import type { ClubWithDetails } from '@/src/domain'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { usePublicClubs } from '@/src/ui/hooks/usePublicClubs'
import { colors } from '@/src/ui/theme'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function ClubCard({
  club,
  onJoin,
  joining,
}: {
  club: ClubWithDetails
  onJoin: () => void
  joining: boolean
}) {
  const router = useRouter()
  const isMember = club.myRole !== null
  const isClosed = !!club.closeDate && new Date(club.closeDate) <= new Date()

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => router.push(`/club/${club.id}` as never)}
    >
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>
            {club.name}
          </Text>
          {isClosed && (
            <View style={styles.closedBadge}>
              <Text style={styles.closedText}>CERRADO</Text>
            </View>
          )}
        </View>

        {club.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {club.description}
          </Text>
        )}

        <View style={styles.cardMeta}>
          {club.city && (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={11} color={colors.textMuted} />
              <Text style={styles.metaText}>{club.city}</Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="people-outline" size={11} color={colors.textMuted} />
            <Text style={styles.metaText}>
              {club.memberCount} {club.memberCount === 1 ? 'lector' : 'lectores'}
            </Text>
          </View>
          {club.currentBook && (
            <View style={styles.metaItem}>
              <Ionicons name="book-outline" size={11} color={colors.textMuted} />
              <Text style={styles.metaText} numberOfLines={1}>
                {club.currentBook.title}
              </Text>
            </View>
          )}
        </View>
      </View>

      {isMember ? (
        <View style={styles.memberBadge}>
          <Text style={styles.memberText}>
            {club.myRole === 'owner' ? 'Organizador' : 'Miembro'}
          </Text>
        </View>
      ) : isClosed ? null : (
        <TouchableOpacity
          style={[styles.joinBtn, joining && styles.joinBtnDisabled]}
          onPress={onJoin}
          disabled={joining}
        >
          {joining ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <Text style={styles.joinText}>Unirse</Text>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  )
}

export default function ExploreClubsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { clubs, loading, error, city, setCity, refresh, join } = usePublicClubs(user?.id ?? '')
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleCityChange(text: string) {
    setCity(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(refresh, 600)
  }

  function handleJoin(club: ClubWithDetails) {
    Alert.alert(`Unirse a "${club.name}"`, '¿Quieres unirte a este club de lectura?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Unirse',
        onPress: async () => {
          setJoiningId(club.id)
          try {
            await join(club.inviteCode)
            Alert.alert('¡Bienvenido!', `Ya eres miembro de "${club.name}".`)
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo unir al club')
          } finally {
            setJoiningId(null)
          }
        },
      },
    ])
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.title}>Explorar clubs</Text>
      </View>

      <View style={styles.filterRow}>
        <Ionicons name="location-outline" size={16} color={colors.textMuted} />
        <TextInput
          style={styles.cityInput}
          value={city}
          onChangeText={handleCityChange}
          placeholder="Filtrar por ciudad..."
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
        />
        {city.length > 0 && (
          <TouchableOpacity onPress={() => setCity('')}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.amber} />
        </View>
      )}

      {error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryBtn}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && clubs.length === 0 && (
        <View style={styles.centered}>
          <Ionicons name="search-outline" size={40} color={colors.surfaceHigh} />
          <Text style={styles.emptyText}>
            {city ? `Sin clubs públicos en "${city}"` : 'No hay clubs públicos aún'}
          </Text>
        </View>
      )}

      {!loading && clubs.length > 0 && (
        <FlatList
          data={clubs}
          keyExtractor={c => c.id}
          renderItem={({ item }) => (
            <ClubCard
              club={item}
              onJoin={() => handleJoin(item)}
              joining={joiningId === item.id}
            />
          )}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  backBtn: { padding: 4 },
  card: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  cardBody: { flex: 1, gap: 6 },
  cardDesc: { color: colors.textSecondary, fontFamily: 'Georgia', fontSize: 13, lineHeight: 18 },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  cardMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2 },
  cardName: { color: colors.textPrimary, flex: 1, fontFamily: 'Georgia', fontSize: 17 },
  centered: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  cityInput: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: 'SpaceMono',
    fontSize: 13,
    paddingVertical: 0,
  },
  closedBadge: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error + '60',
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  closedText: { color: colors.error, fontFamily: 'SpaceMono', fontSize: 9 },
  container: { backgroundColor: colors.bg, flex: 1 },
  emptyText: {
    color: colors.textSecondary,
    fontFamily: 'Georgia',
    fontSize: 15,
    textAlign: 'center',
  },
  errorText: { color: colors.error, fontFamily: 'SpaceMono', fontSize: 13 },
  filterRow: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  joinBtn: {
    backgroundColor: colors.amber,
    borderRadius: 16,
    minWidth: 70,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  joinBtnDisabled: { opacity: 0.5 },
  joinText: { color: colors.bg, fontFamily: 'SpaceMono', fontSize: 11, textAlign: 'center' },
  list: { gap: 10, padding: 16 },
  memberBadge: {
    backgroundColor: colors.amber + '20',
    borderColor: colors.amber + '60',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  memberText: { color: colors.amber, fontFamily: 'SpaceMono', fontSize: 10 },
  metaItem: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  metaText: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10 },
  retryBtn: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 12 },
  title: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 22 },
})
