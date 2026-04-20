import type { PostWithDetails, ReactionSummary } from '@/src/domain'
import { EmojiReactionBar } from '@/src/ui/components/EmojiReactionBar'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useReaction } from '@/src/ui/hooks/useReaction'
import { useReadingProgress } from '@/src/ui/hooks/useReadingProgress'
import { colors } from '@/src/ui/theme'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useRef, useState } from 'react'
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
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

function CommentCard({ post, userId }: { post: PostWithDetails; userId: string }) {
  const [revealed, setRevealed] = useState(false)
  const name = post.author.displayName ?? post.author.username

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
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={styles.authorName}>{name}</Text>
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
          <Text style={styles.modalTitle}>Actualizar progreso</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.amber} size="small" />
            ) : (
              <Text style={styles.modalSave}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>
          <Text style={styles.fieldLabel}>Capítulo actual</Text>
          <TextInput
            style={styles.fieldInput}
            value={chapter}
            onChangeText={setChapter}
            keyboardType="number-pad"
            placeholder="Ej. 12"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.fieldLabel}>Página (opcional)</Text>
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
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { session, posts, loading, error, comment, advance, refresh } = useReadingProgress(
    id,
    user?.id ?? '',
  )

  const [commentText, setCommentText] = useState('')
  const [hasSpoiler, setHasSpoiler] = useState(false)
  const [sending, setSending] = useState(false)
  const [showAdvance, setShowAdvance] = useState(false)
  const inputRef = useRef<TextInput>(null)

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
          <TouchableOpacity onPress={() => router.back()}>
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.advanceButton} onPress={() => setShowAdvance(true)}>
          <Ionicons name="flag-outline" size={14} color={colors.amber} />
          <Text style={styles.advanceText}>Actualizar progreso</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressBanner}>
        <View style={styles.progressInfo}>
          <Text style={styles.chapterLabel}>Capítulo {session.currentChapter ?? '–'}</Text>
          {session.currentPage != null && (
            <Text style={styles.pageLabel}>Página {session.currentPage}</Text>
          )}
        </View>
        <View style={styles.progressBadge}>
          <Ionicons name="book-outline" size={13} color={colors.success} />
          <Text style={styles.progressBadgeText}>en curso</Text>
        </View>
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
              <Text style={styles.emptyText}>
                Sin comentarios para el capítulo {session.currentChapter ?? 1}
              </Text>
              <Text style={styles.emptyHint}>Sé el primero en comentar</Text>
            </View>
          }
        />

        <View style={styles.inputArea}>
          <TouchableOpacity
            style={[styles.spoilerToggle, hasSpoiler && styles.spoilerToggleActive]}
            onPress={() => setHasSpoiler(v => !v)}
          >
            <Ionicons
              name="eye-off-outline"
              size={14}
              color={hasSpoiler ? colors.amber : colors.textMuted}
            />
            <Text style={[styles.spoilerToggleText, hasSpoiler && styles.spoilerToggleTextActive]}>
              Spoiler
            </Text>
          </TouchableOpacity>

          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={`Comentar cap. ${session.currentChapter ?? 1}...`}
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
                <Ionicons name="send" size={16} color={colors.textInverse} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <AdvanceModal
        visible={showAdvance}
        currentChapter={session.currentChapter ?? 1}
        currentPage={session.currentPage}
        onSave={advance}
        onClose={() => setShowAdvance(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  advanceButton: {
    alignItems: 'center',
    borderColor: colors.amber,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  advanceText: { color: colors.amber, fontFamily: 'Inter-Regular', fontSize: 12 },
  authorName: { color: colors.textSecondary, flex: 1, fontFamily: 'Inter-Regular', fontSize: 13 },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  avatarInitial: { color: colors.amber, fontFamily: 'Inter-Regular', fontSize: 13 },
  card: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 12,
  },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 8 },
  centered: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  chapterLabel: { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 18 },
  container: { backgroundColor: colors.bg, flex: 1 },
  content: { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 16, lineHeight: 22 },
  emptyComments: { alignItems: 'center', gap: 6, paddingTop: 60 },
  emptyHint: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 12 },
  emptyText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 16 },
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
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginBottom: 6,
    marginTop: 14,
  },
  flex: { flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  modalSave: { color: colors.amber, fontFamily: 'Inter-Regular', fontSize: 14 },
  modalTitle: { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 18 },
  pageLabel: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 2 },
  progressBadge: {
    alignItems: 'center',
    backgroundColor: colors.success + '20',
    borderRadius: 10,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  progressBadgeText: { color: colors.success, fontFamily: 'Inter-Regular', fontSize: 11 },
  progressBanner: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  progressInfo: { gap: 2 },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13 },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sendButtonDisabled: { backgroundColor: colors.surfaceHigh },
  spoilerBlock: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  spoilerText: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 13 },
  spoilerToggle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
    paddingVertical: 2,
  },
  spoilerToggleActive: {},
  spoilerToggleText: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 12 },
  spoilerToggleTextActive: { color: colors.amber },
  timestamp: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 11 },
})
