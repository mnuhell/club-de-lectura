import type { Book, ClubMember } from '@/src/domain'
import { BookSearchInput } from '@/src/ui/components/BookSearchInput'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useClubDetail } from '@/src/ui/hooks/useClubDetail'
import { colors } from '@/src/ui/theme'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// ─── helpers ────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  owner: 'Organizador',
  admin: 'Administrador',
  member: 'Miembro',
}

const ROLE_COLOR: Record<string, string> = {
  owner: colors.amber,
  admin: '#6BA5C8',
  member: colors.textMuted,
}

// ─── Tag chip ────────────────────────────────────────────────────────────────

function Tag({ icon, label, color }: { icon: string; label: string; color?: string }) {
  const c = color ?? colors.textMuted
  return (
    <View style={[styles.tag, { borderColor: c + '50' }]}>
      <Text style={styles.tagIcon}>{icon}</Text>
      <Text style={[styles.tagLabel, { color: c }]}>{label}</Text>
    </View>
  )
}

// ─── Member row ──────────────────────────────────────────────────────────────

function MemberRow({
  member,
  clubId,
  isMe,
}: {
  member: ClubMember
  clubId: string
  isMe: boolean
}) {
  const router = useRouter()
  const name = member.displayName ?? member.username ?? 'Lector'
  const initial = name.charAt(0).toUpperCase()
  const roleColor = ROLE_COLOR[member.role] ?? colors.textMuted
  const roleLabel = ROLE_LABEL[member.role] ?? member.role

  const inner = (
    <View style={styles.memberRow}>
      {member.avatarUrl ? (
        <Image source={{ uri: member.avatarUrl }} style={styles.memberAvatar} />
      ) : (
        <View style={[styles.memberAvatarFallback, { borderColor: roleColor + '60' }]}>
          <Text style={[styles.memberInitial, { color: roleColor }]}>{initial}</Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View
        style={[
          styles.roleBadge,
          { backgroundColor: roleColor + '20', borderColor: roleColor + '60' },
        ]}
      >
        <Text style={[styles.roleBadgeText, { color: roleColor }]}>{roleLabel}</Text>
      </View>
      {!isMe && <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />}
    </View>
  )

  if (isMe) return inner

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/club/${clubId}/member/${member.userId}` as never)}
    >
      {inner}
    </TouchableOpacity>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ClubDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { club, members, loading, error, leave, updateBook, deleteClub, refresh } = useClubDetail(
    id,
    user?.id ?? '',
  )
  const [showBookSearch, setShowBookSearch] = useState(false)

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

  function handleDeleteClub() {
    Alert.alert(
      'Eliminar club',
      `¿Seguro que quieres eliminar "${club?.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClub()
              router.back()
            } catch (e: unknown) {
              Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo eliminar el club')
            }
          },
        },
      ],
    )
  }

  async function handleBookSelect(book: Book | null) {
    if (!book) return
    setShowBookSearch(false)
    try {
      await updateBook(book.id)
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar el libro')
    }
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
        <TouchableOpacity style={styles.backButtonSolid} onPress={() => router.back()}>
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

  const coverUrl = club.currentBook?.coverUrl ?? null
  const owner = members.find(m => m.role === 'owner')
  const isClosed = !!club.closeDate && new Date(club.closeDate) <= new Date()
  const isOwner = club.myRole === 'owner' || club.ownerId === user?.id

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={members}
        keyExtractor={m => m.userId}
        renderItem={({ item }) => (
          <MemberRow member={item} clubId={id} isMe={item.userId === user?.id} />
        )}
        onRefresh={refresh}
        refreshing={loading}
        ListHeaderComponent={
          <>
            {/* ── Portada ── */}
            <View style={styles.coverHero}>
              {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="contain" />
              ) : (
                <View style={styles.coverFallback}>
                  <Ionicons name="book-outline" size={48} color={colors.border} />
                </View>
              )}
              <View style={styles.headerOverlay}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
                </TouchableOpacity>
                {isClosed && (
                  <View style={styles.closedBadge}>
                    <Text style={styles.closedBadgeText}>CERRADO</Text>
                  </View>
                )}
                {club.myRole !== null && club.myRole !== 'owner' && !isClosed && (
                  <TouchableOpacity onPress={handleLeave} style={styles.leaveButton}>
                    <Text style={styles.leaveText}>Abandonar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <View style={styles.heroSection}>
              {/* Nombre y descripción */}
              <Text style={styles.clubName}>{club.name}</Text>
              {club.description && <Text style={styles.clubDesc}>{club.description}</Text>}

              {/* Tags de información */}
              <View style={styles.tagsRow}>
                {owner && (
                  <Tag
                    icon="👑"
                    label={owner.displayName ?? owner.username ?? 'Organizador'}
                    color={colors.amber}
                  />
                )}
                {club.currentBook && (
                  <Tag icon="✍️" label={club.currentBook.author} color="#A8C5A0" />
                )}
                <Tag
                  icon={club.isPrivate ? '🔒' : '🌍'}
                  label={club.isPrivate ? 'Privado' : 'Público'}
                />
                <Tag
                  icon="👥"
                  label={`${club.memberCount} ${club.memberCount === 1 ? 'lector' : 'lectores'}`}
                />
              </View>

              {/* Libro actual */}
              {club.currentBook ? (
                <TouchableOpacity
                  style={styles.currentBook}
                  onPress={() => router.push(`/club/${id}/reading` as never)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.currentBookLabel}>Leyendo ahora</Text>
                  <Text style={styles.currentBookTitle}>{club.currentBook.title}</Text>
                  <View style={styles.readingCta}>
                    <Ionicons name="book-outline" size={12} color={colors.amber} />
                    <Text style={styles.readingCtaText}>Ver progreso y comentarios →</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.noBook}>
                  <Text style={styles.noBookText}>Sin libro asignado</Text>
                </View>
              )}

              {/* Controles del owner */}
              {isOwner && (
                <View style={styles.ownerActions}>
                  <TouchableOpacity
                    style={styles.ownerBtn}
                    onPress={() => router.push(`/club/${id}/edit` as never)}
                  >
                    <Ionicons name="create-outline" size={14} color={colors.amber} />
                    <Text style={styles.ownerBtnText}>Editar club</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.ownerBtn}
                    onPress={() => setShowBookSearch(v => !v)}
                  >
                    <Ionicons name="book-outline" size={14} color={colors.amber} />
                    <Text style={styles.ownerBtnText}>
                      {club.currentBook ? 'Cambiar libro' : 'Asignar libro'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.ownerBtnDanger} onPress={handleDeleteClub}>
                    <Ionicons name="trash-outline" size={14} color={colors.error} />
                    <Text style={styles.ownerBtnDangerText}>Eliminar club</Text>
                  </TouchableOpacity>
                </View>
              )}

              {showBookSearch && isOwner && (
                <View style={styles.bookSearchWrap}>
                  <BookSearchInput
                    userId={user?.id ?? ''}
                    selected={null}
                    onSelect={handleBookSelect}
                    placeholder="Buscar nuevo libro..."
                  />
                </View>
              )}

              {/* Código de invitación */}
              <View style={styles.inviteRow}>
                <Text style={styles.inviteLabel}>Código de invitación</Text>
                <Text style={styles.inviteCode}>{club.inviteCode}</Text>
                <View style={styles.inviteActions}>
                  <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={async () => {
                      await Clipboard.setStringAsync(club.inviteCode)
                      Alert.alert('Copiado', 'Código copiado al portapapeles')
                    }}
                  >
                    <Ionicons name="copy-outline" size={14} color={colors.amber} />
                    <Text style={styles.inviteButtonText}>Copiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.inviteButton}
                    onPress={() =>
                      Share.share({
                        message: `Únete a mi club de lectura "${club.name}" en Folio con el código: ${club.inviteCode}`,
                      })
                    }
                  >
                    <Ionicons name="share-outline" size={14} color={colors.amber} />
                    <Text style={styles.inviteButtonText}>Compartir</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Miembros ({members.length})</Text>
            </View>
          </>
        }
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  backButton: {
    backgroundColor: '#00000040',
    borderRadius: 20,
    padding: 6,
  },
  backButtonSolid: { padding: 4 },
  centered: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  clubDesc: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 20,
    marginTop: 6,
  },
  clubName: { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 26 },
  container: { backgroundColor: colors.bg, flex: 1 },
  coverFallback: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    flex: 1,
    justifyContent: 'center',
  },
  coverHero: { height: 280, width: '100%' },
  coverImage: { backgroundColor: colors.surface, height: '100%', width: '100%' },
  currentBook: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
    marginTop: 20,
    padding: 14,
  },
  currentBookLabel: { color: colors.amber, fontFamily: 'Inter-Regular', fontSize: 11 },
  currentBookTitle: { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 16 },
  errorText: { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 },
  headerOverlay: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  heroSection: { padding: 20 },
  inviteActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  inviteButton: {
    alignItems: 'center',
    borderColor: colors.amber,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  inviteButtonText: { color: colors.amber, fontFamily: 'Inter-Regular', fontSize: 12 },
  inviteCode: {
    color: colors.amber,
    fontFamily: 'Inter-Regular',
    fontSize: 18,
    letterSpacing: 4,
    marginTop: 4,
  },
  inviteLabel: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 11 },
  inviteRow: { marginTop: 20 },
  leaveButton: {
    backgroundColor: '#00000040',
    borderColor: colors.error,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  leaveText: { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 12 },
  list: { paddingBottom: 32 },
  memberAvatar: {
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  memberAvatarFallback: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  memberInfo: { flex: 1 },
  memberInitial: { fontFamily: 'Inter-Regular', fontSize: 16 },
  memberName: { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 16 },
  memberRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  closedBadge: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error + '60',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  closedBadgeText: { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 11 },
  noBook: { marginTop: 20 },
  noBookText: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 13 },
  readingCta: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 8 },
  readingCtaText: { color: colors.amber, fontFamily: 'Inter-Regular', fontSize: 11 },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13 },
  roleBadge: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: { fontFamily: 'Inter-Regular', fontSize: 11 },
  sectionTitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginTop: 28,
    textTransform: 'uppercase',
  },
  tag: {
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagIcon: { fontSize: 13 },
  tagLabel: { fontFamily: 'Inter-Regular', fontSize: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  ownerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  ownerBtn: {
    alignItems: 'center',
    borderColor: colors.amber,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  ownerBtnText: { color: colors.amber, fontFamily: 'Inter-Regular', fontSize: 12 },
  ownerBtnDanger: {
    alignItems: 'center',
    borderColor: colors.error,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  ownerBtnDangerText: { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 12 },
  bookSearchWrap: { marginTop: 12 },
})
