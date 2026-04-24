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

function Tag({ icon, label, color }: { icon: string; label: string; color?: string }) {
  const c = color ?? colors.textMuted
  return (
    <View style={[styles.tag, { borderColor: c + '40' }]}>
      <Text style={styles.tagIcon}>{icon}</Text>
      <Text style={[styles.tagLabel, { color: c }]}>{label}</Text>
    </View>
  )
}

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
        <View style={[styles.memberAvatarFallback, { borderColor: roleColor + '50' }]}>
          <Text style={[styles.memberInitial, { color: roleColor }]}>{initial}</Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName} numberOfLines={1}>
          {name}
        </Text>
      </View>
      <View style={[styles.roleBadge, { backgroundColor: roleColor + '18', borderColor: roleColor + '50' }]}>
        <Text style={[styles.roleBadgeText, { color: roleColor }]}>{roleLabel}</Text>
      </View>
      {!isMe && <Ionicons name="chevron-forward" size={14} color={colors.border} />}
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
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* ── Portada hero ── */}
            <View style={styles.coverHero}>
              {coverUrl ? (
                <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="cover" />
              ) : (
                <View style={styles.coverFallback}>
                  <Ionicons name="book" size={52} color={colors.border} />
                </View>
              )}
              <View style={styles.coverOverlay} />
              <View style={styles.headerOverlay}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={20} color="#fff" />
                </TouchableOpacity>
                <View style={styles.headerRight}>
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
            </View>

            <View style={styles.heroSection}>
              {/* Nombre */}
              <Text style={styles.clubName}>{club.name}</Text>
              {club.description && <Text style={styles.clubDesc}>{club.description}</Text>}

              {/* Tags */}
              <View style={styles.tagsRow}>
                {owner && (
                  <Tag
                    icon="👑"
                    label={owner.displayName ?? owner.username ?? 'Organizador'}
                    color={colors.amber}
                  />
                )}
                {club.currentBook && (
                  <Tag icon="✍️" label={club.currentBook.author} color="#6BA5C8" />
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
                  style={styles.currentBookCard}
                  onPress={() =>
                    router.push(`/club/${id}/reading?bookId=${club.currentBook!.id}` as never)
                  }
                  activeOpacity={0.78}
                >
                  {/* Label */}
                  <View style={styles.currentBookLabelRow}>
                    <View style={styles.nowDot} />
                    <Text style={styles.currentBookLabel}>LEYENDO AHORA</Text>
                  </View>

                  {/* Cover + info */}
                  <View style={styles.currentBookBody}>
                    <View style={styles.currentBookCoverWrap}>
                      {club.currentBook.coverUrl ? (
                        <Image
                          source={{ uri: club.currentBook.coverUrl }}
                          style={styles.currentBookCover}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.currentBookCoverFallback}>
                          <Ionicons name="book" size={28} color={colors.amber} />
                        </View>
                      )}
                      <View style={styles.currentBookSpine} />
                    </View>

                    <View style={styles.currentBookInfo}>
                      <Text style={styles.currentBookTitle} numberOfLines={3}>
                        {club.currentBook.title}
                      </Text>
                      <Text style={styles.currentBookAuthor} numberOfLines={1}>
                        {club.currentBook.author}
                      </Text>
                    </View>
                  </View>

                  {/* CTA */}
                  <View style={styles.currentBookCta}>
                    <Ionicons name="book-outline" size={15} color="#fff" />
                    <Text style={styles.currentBookCtaText}>Entrar a leer y comentar</Text>
                    <Ionicons name="arrow-forward" size={15} color="#fff" />
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={styles.noBook}>
                  <Ionicons name="book-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.noBookText}>Sin libro asignado</Text>
                </View>
              )}

              {/* Acciones del owner */}
              {isOwner && (
                <View style={styles.ownerActions}>
                  <TouchableOpacity
                    style={styles.ownerBtn}
                    onPress={() => router.push(`/club/${id}/edit` as never)}
                  >
                    <Ionicons name="create-outline" size={14} color={colors.amber} />
                    <Text style={styles.ownerBtnText}>Editar</Text>
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
                    <Text style={styles.ownerBtnDangerText}>Eliminar</Text>
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
              <View style={styles.inviteCard}>
                <Text style={styles.inviteLabel}>CÓDIGO DE INVITACIÓN</Text>
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

              <Text style={styles.sectionTitle}>MIEMBROS  ·  {members.length}</Text>
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
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  backButtonSolid: { padding: 4 },
  bookSearchWrap: { marginTop: 12 },
  centered: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  closedBadge: {
    backgroundColor: colors.error + '20',
    borderColor: colors.error + '60',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  closedBadgeText: { color: colors.error, fontFamily: 'Inter-SemiBold', fontSize: 10, letterSpacing: 0.5 },
  clubDesc: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  clubName: { color: colors.textPrimary, fontFamily: 'Playfair-Bold', fontSize: 28, lineHeight: 34 },
  container: { backgroundColor: colors.bg, flex: 1 },
  coverFallback: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    flex: 1,
    justifyContent: 'center',
  },
  coverHero: { height: 300, width: '100%' },
  coverImage: { height: '100%', width: '100%' },
  coverOverlay: {
    bottom: 0,
    height: 80,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  currentBook: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.amber + '40',
    borderLeftColor: colors.amber,
    borderLeftWidth: 3,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
    marginTop: 20,
    padding: 16,
  },
  currentBookAuthor: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    marginTop: 4,
  },
  currentBookBody: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 14,
    marginTop: 14,
  },
  currentBookCard: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
    overflow: 'hidden',
    padding: 16,
    shadowColor: '#1A1208',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  currentBookCover: { height: '100%', width: '100%' },
  currentBookCoverFallback: {
    alignItems: 'center',
    backgroundColor: colors.amberFaint,
    flex: 1,
    justifyContent: 'center',
  },
  currentBookCoverWrap: {
    borderRadius: 8,
    elevation: 4,
    height: 120,
    overflow: 'hidden',
    shadowColor: '#1A1208',
    shadowOffset: { width: -2, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    width: 80,
  },
  currentBookCta: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 13,
  },
  currentBookCtaText: {
    color: '#fff',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  currentBookInfo: { flex: 1, justifyContent: 'center' },
  currentBookLabel: {
    color: colors.amber,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 1,
  },
  currentBookLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  currentBookSpine: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  currentBookTitle: {
    color: colors.textPrimary,
    fontFamily: 'Playfair-Bold',
    fontSize: 20,
    lineHeight: 26,
  },
  nowDot: {
    backgroundColor: colors.amber,
    borderRadius: 4,
    height: 7,
    width: 7,
  },
  errorText: { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 },
  headerOverlay: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  headerRight: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  heroSection: { padding: 20 },
  inviteActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  inviteButton: {
    alignItems: 'center',
    borderColor: colors.amber,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  inviteButtonText: { color: colors.amber, fontFamily: 'Inter-Medium', fontSize: 13 },
  inviteCard: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 20,
    padding: 16,
  },
  inviteCode: {
    color: colors.textPrimary,
    fontFamily: 'Inter-Bold',
    fontSize: 22,
    letterSpacing: 5,
    marginTop: 6,
  },
  inviteLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  leaveButton: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderColor: colors.error + '80',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  leaveText: { color: '#FF8C7A', fontFamily: 'Inter-Medium', fontSize: 12 },
  list: { paddingBottom: 40 },
  memberAvatar: { borderRadius: 20, height: 40, width: 40 },
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
  memberInitial: { fontFamily: 'Inter-SemiBold', fontSize: 16 },
  memberName: { color: colors.textPrimary, fontFamily: 'Inter-Medium', fontSize: 15 },
  memberRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },
  noBook: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
  },
  noBookText: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 14 },
  ownerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 20 },
  ownerBtn: {
    alignItems: 'center',
    borderColor: colors.amber,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  ownerBtnDanger: {
    alignItems: 'center',
    borderColor: colors.error,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  ownerBtnDangerText: { color: colors.error, fontFamily: 'Inter-Medium', fontSize: 12 },
  ownerBtnText: { color: colors.amber, fontFamily: 'Inter-Medium', fontSize: 12 },
  readingCta: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 6 },
  readingCtaText: { color: colors.amber, fontFamily: 'Inter-Medium', fontSize: 12 },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13 },
  roleBadge: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  roleBadgeText: { fontFamily: 'Inter-Medium', fontSize: 11 },
  sectionTitle: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    letterSpacing: 0.8,
    marginTop: 28,
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
  tagIcon: { fontSize: 12 },
  tagLabel: { fontFamily: 'Inter-Medium', fontSize: 12 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
})
