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
        <Text style={styles.cardName} numberOfLines={1}>{club.name}</Text>
        {club.description && (
          <Text style={styles.cardDesc} numberOfLines={2}>{club.description}</Text>
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
            onPress={() => router.push('./join')}
          >
            <Text style={styles.secondaryButtonText}>Unirse</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push('./create')}
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
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: 'Georgia', fontSize: 24, color: colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: 8 },
  secondaryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: 20,
  },
  secondaryButtonText: { fontFamily: 'SpaceMono', fontSize: 12, color: colors.amber },
  primaryButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: colors.amber,
    borderRadius: 20,
  },
  primaryButtonText: { fontFamily: 'SpaceMono', fontSize: 12, color: colors.textInverse },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  errorText: { fontFamily: 'SpaceMono', fontSize: 13, color: colors.error },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 8 },
  retryText: { fontFamily: 'SpaceMono', fontSize: 12, color: colors.textSecondary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontFamily: 'Georgia', fontSize: 16, color: colors.textSecondary },
  emptyHint: { fontFamily: 'SpaceMono', fontSize: 12, color: colors.textMuted },
  list: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLeft: { flex: 1, gap: 4 },
  cardName: { fontFamily: 'Georgia', fontSize: 17, color: colors.textPrimary },
  cardDesc: { fontFamily: 'SpaceMono', fontSize: 11, color: colors.textSecondary, lineHeight: 16 },
  cardMeta: { fontFamily: 'SpaceMono', fontSize: 10, color: colors.textMuted },
  cardArrow: { fontSize: 22, color: colors.textMuted, marginLeft: 8 },
})
