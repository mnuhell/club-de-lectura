import type { ClubMember } from '@/src/domain'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useClubDetail } from '@/src/ui/hooks/useClubDetail'
import { colors } from '@/src/ui/theme'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function MemberRow({ member }: { member: ClubMember }) {
  return (
    <View style={styles.memberRow}>
      <View style={styles.memberAvatar}>
        <Text style={styles.memberInitial}>{member.userId.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberId} numberOfLines={1}>
          {member.userId}
        </Text>
        <Text style={styles.memberRole}>{member.role}</Text>
      </View>
    </View>
  )
}

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { club, members, loading, error, leave, refresh } = useClubDetail(id, user?.id ?? '')

  function handleLeave() {
    Alert.alert('Abandonar club', `¿Seguro que quieres abandonar "${club?.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Abandonar',
        style: 'destructive',
        onPress: async () => {
          try {
            await leave()
            router.back()
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo abandonar el club')
          }
        },
      },
    ])
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.amber} />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !club) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Club no encontrado'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        {club.myRole !== 'owner' && (
          <TouchableOpacity onPress={handleLeave} style={styles.leaveButton}>
            <Text style={styles.leaveText}>Abandonar</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={members}
        keyExtractor={m => m.userId}
        renderItem={({ item }) => <MemberRow member={item} />}
        onRefresh={refresh}
        refreshing={loading}
        ListHeaderComponent={
          <View style={styles.heroSection}>
            <Text style={styles.clubName}>{club.name}</Text>
            {club.description && <Text style={styles.clubDesc}>{club.description}</Text>}

            <View style={styles.metaRow}>
              <View style={styles.metaBadge}>
                <Ionicons name="people-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>
                  {club.memberCount} {club.memberCount === 1 ? 'lector' : 'lectores'}
                </Text>
              </View>
              <View style={styles.metaBadge}>
                <Ionicons
                  name={club.isPrivate ? 'lock-closed-outline' : 'globe-outline'}
                  size={13}
                  color={colors.textMuted}
                />
                <Text style={styles.metaText}>{club.isPrivate ? 'Privado' : 'Público'}</Text>
              </View>
            </View>

            {club.currentBook ? (
              <View style={styles.currentBook}>
                <Text style={styles.currentBookLabel}>Leyendo ahora</Text>
                <Text style={styles.currentBookTitle}>{club.currentBook.title}</Text>
              </View>
            ) : (
              <View style={styles.noBook}>
                <Text style={styles.noBookText}>Sin libro actual</Text>
              </View>
            )}

            <View style={styles.inviteRow}>
              <Text style={styles.inviteLabel}>Código de invitación</Text>
              <Text style={styles.inviteCode}>{club.inviteCode}</Text>
            </View>

            <Text style={styles.sectionTitle}>Miembros ({members.length})</Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  backButton: { padding: 4 },
  centered: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  clubDesc: {
    color: colors.textSecondary,
    fontFamily: 'Georgia',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  clubName: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 26 },
  container: { backgroundColor: colors.bg, flex: 1 },
  currentBook: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    marginTop: 20,
    padding: 14,
  },
  currentBookLabel: { color: colors.amber, fontFamily: 'SpaceMono', fontSize: 10 },
  currentBookTitle: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 15 },
  errorText: { color: colors.error, fontFamily: 'SpaceMono', fontSize: 13 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  heroSection: { padding: 20 },
  inviteCode: {
    color: colors.amber,
    fontFamily: 'SpaceMono',
    fontSize: 18,
    letterSpacing: 4,
    marginTop: 4,
  },
  inviteLabel: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10 },
  inviteRow: { marginTop: 20 },
  leaveButton: {
    borderColor: colors.error,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  leaveText: { color: colors.error, fontFamily: 'SpaceMono', fontSize: 11 },
  list: { paddingBottom: 24 },
  memberAvatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  memberId: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 12 },
  memberInfo: { flex: 1, gap: 2 },
  memberInitial: { color: colors.amber, fontFamily: 'SpaceMono', fontSize: 14 },
  memberRole: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10 },
  memberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  metaBadge: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  metaRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  metaText: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 11 },
  noBook: { marginTop: 20 },
  noBookText: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 12 },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 12 },
  sectionTitle: {
    color: colors.textSecondary,
    fontFamily: 'SpaceMono',
    fontSize: 11,
    marginTop: 28,
  },
})
