import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { colors } from '@/src/ui/theme'
import { useClubs } from '@/src/ui/hooks/useClubs'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { Ionicons } from '@expo/vector-icons'
import type { ClubWithDetails } from '@/src/domain'

const CLUB_COLORS = [
  { bg: '#F2E0C8', fg: '#8B5E2A' },
  { bg: '#D6E8D4', fg: '#3D7A54' },
  { bg: '#D4E0F0', fg: '#3A5F8A' },
  { bg: '#EDD4F0', fg: '#7A3A8A' },
  { bg: '#F0D4D4', fg: '#8A3A3A' },
  { bg: '#D4EEF0', fg: '#2A7A80' },
]

function ClubAvatar({ name }: { name: string }) {
  const initial = name.slice(0, 1).toUpperCase()
  const palette = CLUB_COLORS[name.charCodeAt(0) % CLUB_COLORS.length]
  return (
    <View style={[styles.clubAvatar, { backgroundColor: palette.bg }]}>
      <Text style={[styles.clubAvatarText, { color: palette.fg }]}>{initial}</Text>
    </View>
  )
}

function ClubCard({ club }: { club: ClubWithDetails }) {
  const router = useRouter()
  return (
    <TouchableOpacity
      style={styles.card}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onPress={() => router.push(`/club/${club.id}` as any)}
      activeOpacity={0.72}
    >
      <ClubAvatar name={club.name} />
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {club.name}
        </Text>
        {club.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {club.description}
          </Text>
        )}
        <View style={styles.cardFooter}>
          <Ionicons name="people-outline" size={12} color={colors.textMuted} />
          <Text style={styles.cardMeta}>
            {club.memberCount} {club.memberCount === 1 ? 'lector' : 'lectores'}
          </Text>
          {club.myRole === 'owner' && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.ownerTag}>organizador</Text>
            </>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.border} />
    </TouchableOpacity>
  )
}

export default function ClubsScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { clubs, loading, error, refresh } = useClubs(user?.id ?? '')

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis clubs</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.iconButton}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/(tabs)/clubs/explore' as any)}
          >
            <Ionicons name="compass-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconButton}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/(tabs)/clubs/join' as any)}
          >
            <Ionicons name="qr-code-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/(tabs)/clubs/create' as any)}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.primaryButtonText}>Nuevo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.amber} />
        </View>
      )}

      {error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refresh} style={styles.retryButton}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && clubs.length === 0 && (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="people-outline" size={36} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Aún no tienes clubs</Text>
          <Text style={styles.emptyHint}>Crea uno o únete con un código de invitación</Text>
          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={styles.emptyActionPrimary}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onPress={() => router.push('/(tabs)/clubs/create' as any)}
            >
              <Text style={styles.emptyActionPrimaryText}>Crear club</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.emptyActionSecondary}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onPress={() => router.push('/(tabs)/clubs/join' as any)}
            >
              <Text style={styles.emptyActionSecondaryText}>Unirme con código</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!loading && !error && clubs.length > 0 && (
        <FlatList
          data={clubs}
          keyExtractor={c => c.id}
          renderItem={({ item }) => <ClubCard club={item} />}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const cardShadow = {
  shadowColor: '#1A1208',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 5,
  elevation: 1,
}

const styles = StyleSheet.create({
  card: {
    ...cardShadow,
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 14,
    padding: 14,
  },
  cardBody: { flex: 1, gap: 3 },
  cardDesc: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  cardFooter: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 2 },
  cardMeta: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 11 },
  cardName: { color: colors.textPrimary, fontFamily: 'Inter-SemiBold', fontSize: 16 },
  centered: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  clubAvatar: {
    alignItems: 'center',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  clubAvatarText: { fontFamily: 'Inter-Bold', fontSize: 20 },
  container: { backgroundColor: colors.bg, flex: 1 },
  empty: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  emptyActionPrimary: {
    backgroundColor: colors.amber,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyActionPrimaryText: { color: '#fff', fontFamily: 'Inter-SemiBold', fontSize: 13 },
  emptyActionSecondary: {
    borderColor: colors.amber,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyActionSecondaryText: { color: colors.amber, fontFamily: 'Inter-SemiBold', fontSize: 13 },
  emptyHint: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 24,
    height: 64,
    justifyContent: 'center',
    marginBottom: 4,
    width: 64,
  },
  emptyTitle: { color: colors.textSecondary, fontFamily: 'Inter-SemiBold', fontSize: 16 },
  errorText: { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerActions: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  iconButton: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  list: { gap: 10, padding: 16, paddingBottom: 24 },
  metaDot: { color: colors.borderLight, fontSize: 10 },
  ownerTag: { color: colors.amber, fontFamily: 'Inter-Medium', fontSize: 11 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryButtonText: { color: '#fff', fontFamily: 'Inter-SemiBold', fontSize: 13 },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13 },
  title: { color: colors.textPrimary, fontFamily: 'Playfair-Bold', fontSize: 28 },
})
