import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { colors } from '@/src/ui/theme'
import { useClubs } from '@/src/ui/hooks/useClubs'
import { useAuth } from '@/src/ui/hooks/useAuth'
import type { ClubWithDetails } from '@/src/domain'

function ClubCard({ club }: { club: ClubWithDetails }) {
  const router = useRouter()
  return (
    <TouchableOpacity
      style={styles.card}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onPress={() => router.push(`/club/${club.id}` as any)}
      activeOpacity={0.75}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardName} numberOfLines={1}>
          {club.name}
        </Text>
        {club.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {club.description}
          </Text>
        )}
        <Text style={styles.cardMeta}>
          {club.memberCount} {club.memberCount === 1 ? 'lector' : 'lectores'}
          {club.myRole === 'owner' ? '  ·  organizador' : ''}
        </Text>
      </View>
      <Text style={styles.cardArrow}>›</Text>
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
            style={styles.secondaryButton}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/(tabs)/clubs/explore' as any)}
          >
            <Text style={styles.secondaryButtonText}>Explorar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryButton}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/(tabs)/clubs/join' as any)}
          >
            <Text style={styles.secondaryButtonText}>Unirse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPress={() => router.push('/(tabs)/clubs/create' as any)}
          >
            <Text style={styles.primaryButtonText}>+ Nuevo</Text>
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
          <Text style={styles.emptyText}>Aún no perteneces a ningún club</Text>
          <Text style={styles.emptyHint}>Crea uno o únete con un código de invitación</Text>
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
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 16,
  },
  cardArrow: { color: colors.textMuted, fontSize: 22, marginLeft: 8 },
  cardDesc: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12, lineHeight: 16 },
  cardLeft: { flex: 1, gap: 4 },
  cardMeta: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 11 },
  cardName: { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 18 },
  centered: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  container: { backgroundColor: colors.bg, flex: 1 },
  empty: { alignItems: 'center', flex: 1, gap: 8, justifyContent: 'center' },
  emptyHint: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 13 },
  emptyText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 17 },
  errorText: { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerActions: { flexDirection: 'row', gap: 8 },
  list: { gap: 12, padding: 16 },
  primaryButton: {
    backgroundColor: colors.amber,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  primaryButtonText: { color: colors.textInverse, fontFamily: 'Inter-Regular', fontSize: 13 },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13 },
  secondaryButton: {
    borderColor: colors.amber,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  secondaryButtonText: { color: colors.amber, fontFamily: 'Inter-Regular', fontSize: 13 },
  title: { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 24 },
})
