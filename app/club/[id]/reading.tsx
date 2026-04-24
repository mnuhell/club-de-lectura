import type { PostWithDetails, ReactionSummary } from '@/src/domain'
import { EmojiReactionBar } from '@/src/ui/components/EmojiReactionBar'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useReaction } from '@/src/ui/hooks/useReaction'
import { useReadingProgress } from '@/src/ui/hooks/useReadingProgress'
import { colors } from '@/src/ui/theme'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

const AVATAR_COLORS = [
  { bg: '#F2E0C8', fg: '#8B5E2A' },
  { bg: '#D6E8D4', fg: '#3D7A54' },
  { bg: '#D4E0F0', fg: '#3A5F8A' },
  { bg: '#EDD4F0', fg: '#7A3A8A' },
  { bg: '#F0D4D4', fg: '#8A3A3A' },
  { bg: '#D4EEF0', fg: '#2A7A80' },
]

function CommentCard({ post, userId }: { post: PostWithDetails; userId: string }) {
  const [revealed, setRevealed] = useState(false)
  const name = post.author.displayName ?? post.author.username
  const isMe = post.author.id === userId
  const palette = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

  const initialReactions = useMemo<ReactionSummary[]>(
    () =>
      Object.entries(
        post.reactions.reduce<Record<string, { count: number; reactedByMe: boolean }>>((acc, r) => {
          if (!acc[r.emoji]) acc[r.emoji] = { count: 0, reactedByMe: false }
          acc[r.emoji].count++
          if (r.userId === userId) acc[r.emoji].reactedByMe = true
          return acc
        }, {}),
      ).map(([emoji, { count, reactedByMe }]) => ({ emoji, count, reactedByMe })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [post.id],
  )

  const { reactions, toggle } = useReaction(post.id, userId, initialReactions)

  return (
    <View style={[styles.card, isMe && styles.cardMe]}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: palette.bg }]}>
          <Text style={[styles.avatarInitial, { color: palette.fg }]}>
            {name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.authorName}>{name}</Text>
          {post.chapterRef != null && (
            <View style={styles.chapterTag}>
              <Text style={styles.chapterTagText}>cap. {post.chapterRef}</Text>
            </View>
          )}
        </View>
        <Text style={styles.timestamp}>{timeAgo(post.createdAt)}</Text>
      </View>

      {post.hasSpoiler && !revealed ? (
        <TouchableOpacity style={styles.spoilerBlock} onPress={() => setRevealed(true)}>
          <Ionicons name="eye-off-outline" size={14} color={colors.textMuted} />
          <Text style={styles.spoilerText}>Contiene spoilers — toca para ver</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.content}>{post.content}</Text>
      )}

      <EmojiReactionBar reactions={reactions} onToggle={toggle} />
    </View>
  )
}

function AdvanceModal({
  visible,
  currentChapter,
  currentPage,
  onSave,
  onClose,
}: {
  visible: boolean
  currentChapter: number
  currentPage: number | null
  onSave: (chapter: number, page: number | null) => Promise<void>
  onClose: () => void
}) {
  const [chapter, setChapter] = useState(String(currentChapter))
  const [page, setPage] = useState(currentPage != null ? String(currentPage) : '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (visible) {
      setChapter(String(currentChapter))
      setPage(currentPage != null ? String(currentPage) : '')
    }
  }, [visible, currentChapter, currentPage])

  async function handleSave() {
    const ch = parseInt(chapter, 10)
    const pg = page.trim() ? parseInt(page, 10) : null
    if (isNaN(ch) || ch < 1) {
      Alert.alert('Error', 'El capítulo debe ser un número mayor que 0')
      return
    }
    setSaving(true)
    try {
      await onSave(ch, pg)
      onClose()
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo actualizar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Mi progreso</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.amber} size="small" />
            ) : (
              <Text style={styles.modalSave}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>
          <Text style={styles.fieldLabel}>CAPÍTULO ACTUAL</Text>
          <TextInput
            style={styles.fieldInput}
            value={chapter}
            onChangeText={setChapter}
            keyboardType="number-pad"
            placeholder="Ej. 12"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.fieldLabel}>PÁGINA (opcional)</Text>
          <TextInput
            style={styles.fieldInput}
            value={page}
            onChangeText={setPage}
            keyboardType="number-pad"
            placeholder="Ej. 210"
            placeholderTextColor={colors.textMuted}
          />
        </View>
      </View>
    </Modal>
  )
}

export default function ReadingScreen() {
  const {
    id,
    bookId,
    isOwner: isOwnerParam,
  } = useLocalSearchParams<{ id: string; bookId?: string; isOwner?: string }>()
  const isOwner = isOwnerParam === '1'
  const router = useRouter()
  const { user } = useAuth()
  const { session, posts, loading, error, comment, advance, finish, refresh } = useReadingProgress(
    id,
    user?.id ?? '',
    bookId,
  )

  const [commentText, setCommentText] = useState('')
  const [hasSpoiler, setHasSpoiler] = useState(false)
  const [sending, setSending] = useState(false)
  const [showAdvance, setShowAdvance] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const inputRef = useRef<TextInput>(null)

  function handleFinish() {
    Alert.alert('Finalizar lectura', '¿Confirmas que el club ha terminado de leer este libro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Finalizar',
        style: 'destructive',
        onPress: async () => {
          setFinishing(true)
          try {
            await finish()
            Alert.alert('¡Lectura completada!', 'El libro ha sido marcado como finalizado.', [
              { text: 'OK', onPress: () => router.back() },
            ])
          } catch (e: unknown) {
            Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo finalizar la lectura')
          } finally {
            setFinishing(false)
          }
        },
      },
    ])
  }

  async function handleComment() {
    if (!commentText.trim()) return
    setSending(true)
    try {
      await comment(commentText.trim(), hasSpoiler)
      setCommentText('')
      setHasSpoiler(false)
    } catch (e: unknown) {
      Alert.alert('Error', e instanceof Error ? e.message : 'No se pudo enviar')
    } finally {
      setSending(false)
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

  if (error || !session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'No hay sesión de lectura activa'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  const chapter = session.currentChapter ?? 1

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Lectura en grupo
        </Text>
        {isOwner && (
          <TouchableOpacity style={styles.finishButton} onPress={handleFinish} disabled={finishing}>
            {finishing ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={styles.finishButtonText}>Finalizar</Text>
            )}
          </TouchableOpacity>
        )}
        {!isOwner && <View style={{ width: 70 }} />}
      </View>

      {/* Progress hero */}
      <TouchableOpacity
        style={styles.progressHero}
        onPress={() => isOwner && setShowAdvance(true)}
        activeOpacity={isOwner ? 0.75 : 1}
      >
        <View style={styles.progressLeft}>
          <Text style={styles.chapterNumber}>{chapter}</Text>
          <View>
            <Text style={styles.chapterWord}>capítulo</Text>
            {session.currentPage != null && (
              <Text style={styles.pageLabel}>pág. {session.currentPage}</Text>
            )}
          </View>
        </View>
        <View style={styles.progressRight}>
          {isOwner && (
            <View style={styles.updateBtn}>
              <Ionicons name="pencil-outline" size={13} color={colors.amber} />
              <Text style={styles.updateBtnText}>Actualizar</Text>
            </View>
          )}
          <View style={styles.readingBadge}>
            <View style={styles.readingDot} />
            <Text style={styles.readingBadgeText}>en curso</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Comments section label */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>COMENTARIOS · CAP. {chapter}</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          data={posts}
          keyExtractor={p => p.id}
          renderItem={({ item }) => <CommentCard post={item} userId={user?.id ?? ''} />}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubble-outline" size={28} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyText}>Sin comentarios aún</Text>
              <Text style={styles.emptyHint}>Sé el primero en comentar el capítulo {chapter}</Text>
            </View>
          }
        />

        {/* Input area */}
        <View style={styles.inputArea}>
          <TouchableOpacity
            style={[styles.spoilerToggle, hasSpoiler && styles.spoilerToggleActive]}
            onPress={() => setHasSpoiler(v => !v)}
          >
            <Ionicons
              name={hasSpoiler ? 'eye-off' : 'eye-off-outline'}
              size={13}
              color={hasSpoiler ? colors.amber : colors.textMuted}
            />
            <Text style={[styles.spoilerToggleText, hasSpoiler && styles.spoilerToggleTextActive]}>
              {hasSpoiler ? 'Spoiler activo' : 'Marcar spoiler'}
            </Text>
          </TouchableOpacity>

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={`Comenta el capítulo ${chapter}…`}
              placeholderTextColor={colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
              onPress={handleComment}
              disabled={!commentText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator color={colors.textInverse} size="small" />
              ) : (
                <Ionicons
                  name="send"
                  size={15}
                  color={commentText.trim() ? colors.textInverse : colors.textMuted}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <AdvanceModal
        visible={showAdvance}
        currentChapter={chapter}
        currentPage={session.currentPage}
        onSave={advance}
        onClose={() => setShowAdvance(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  authorName: { color: colors.textPrimary, fontFamily: 'Inter-SemiBold', fontSize: 13 },
  avatar: {
    alignItems: 'center',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  avatarInitial: { fontFamily: 'Inter-Bold', fontSize: 13 },
  backButton: { padding: 4 },
  card: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 14,
    shadowColor: '#1A1208',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardMe: { borderColor: colors.amber + '30' },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: 9, marginBottom: 10 },
  cardMeta: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 7 },
  centered: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  chapterNumber: {
    color: colors.textPrimary,
    fontFamily: 'Playfair-Bold',
    fontSize: 48,
    lineHeight: 52,
  },
  chapterTag: {
    backgroundColor: colors.amberFaint,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chapterTagText: { color: colors.amber, fontFamily: 'Inter-Medium', fontSize: 10 },
  chapterWord: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 13 },
  container: { backgroundColor: colors.bg, flex: 1 },
  content: {
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    lineHeight: 23,
  },
  emptyComments: { alignItems: 'center', gap: 8, paddingTop: 56 },
  emptyHint: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 13 },
  emptyIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 20,
    height: 52,
    justifyContent: 'center',
    marginBottom: 4,
    width: 52,
  },
  emptyText: { color: colors.textSecondary, fontFamily: 'Inter-SemiBold', fontSize: 15 },
  errorText: { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 },
  fieldInput: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 14,
  },
  finishButton: {
    backgroundColor: colors.success,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  finishButtonText: { color: '#fff', fontFamily: 'Inter-SemiBold', fontSize: 12 },
  flex: { flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: colors.textSecondary,
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    marginHorizontal: 12,
    textAlign: 'center',
  },
  input: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    maxHeight: 80,
    paddingVertical: 8,
  },
  inputArea: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  inputRow: {
    alignItems: 'flex-end',
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  list: { paddingBottom: 8, paddingTop: 8 },
  modal: { backgroundColor: colors.bg, flex: 1 },
  modalBody: { flex: 1, paddingHorizontal: 20 },
  modalCancel: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 14 },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalSave: { color: colors.amber, fontFamily: 'Inter-SemiBold', fontSize: 14 },
  modalTitle: { color: colors.textPrimary, fontFamily: 'Playfair-Bold', fontSize: 20 },
  pageLabel: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 1 },
  progressHero: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  progressLeft: { alignItems: 'flex-end', flexDirection: 'row', gap: 8 },
  progressRight: { alignItems: 'flex-end', gap: 8 },
  readingBadge: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  readingBadgeText: { color: colors.success, fontFamily: 'Inter-Medium', fontSize: 11 },
  readingDot: {
    backgroundColor: colors.success,
    borderRadius: 4,
    height: 6,
    width: 6,
  },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13 },
  sectionLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  sectionRow: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 18,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  sendButtonDisabled: { backgroundColor: colors.surfaceHigh },
  spoilerBlock: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
    padding: 12,
  },
  spoilerText: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 13 },
  spoilerToggle: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  spoilerToggleActive: {
    backgroundColor: colors.amberFaint,
    borderColor: colors.amber,
  },
  spoilerToggleText: { color: colors.textMuted, fontFamily: 'Inter-Medium', fontSize: 12 },
  spoilerToggleTextActive: { color: colors.amber },
  timestamp: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 11 },
  updateBtn: {
    alignItems: 'center',
    borderColor: colors.amber,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  updateBtnText: { color: colors.amber, fontFamily: 'Inter-Medium', fontSize: 12 },
})
