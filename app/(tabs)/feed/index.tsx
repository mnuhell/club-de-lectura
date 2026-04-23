import type {
  FeedItem,
  NotificationWithDetails,
  PostFeedItem,
  ProgressFeedItem,
  ReactionSummary,
} from '@/src/domain'
import { EmojiReactionBar } from '@/src/ui/components/EmojiReactionBar'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useFeed } from '@/src/ui/hooks/useFeed'
import { useNotifications } from '@/src/ui/hooks/useNotifications'
import { useReaction } from '@/src/ui/hooks/useReaction'
import { colors } from '@/src/ui/theme'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
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

function Avatar({
  name,
  avatarUrl,
  size = 40,
}: {
  name: string
  avatarUrl?: string | null
  size?: number
}) {
  const borderRadius = size / 2
  if (avatarUrl) {
    return (
      <Image
        source={{ uri: avatarUrl }}
        style={[styles.avatar, { width: size, height: size, borderRadius }]}
      />
    )
  }
  const initial = name.slice(0, 1).toUpperCase()
  const hue = name.charCodeAt(0) % 6
  const palettes = [
    { bg: '#F2E0C8', fg: '#8B5E2A' },
    { bg: '#D6E8D4', fg: '#3D7A54' },
    { bg: '#D4E0F0', fg: '#3A5F8A' },
    { bg: '#EDD4F0', fg: '#7A3A8A' },
    { bg: '#F0D4D4', fg: '#8A3A3A' },
    { bg: '#D4EEF0', fg: '#2A7A80' },
  ]
  const { bg, fg } = palettes[hue]
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius, backgroundColor: bg }]}>
      <Text style={[styles.avatarInitial, { color: fg, fontSize: size * 0.38 }]}>{initial}</Text>
    </View>
  )
}

function PostCard({ item, userId }: { item: PostFeedItem; userId: string }) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false)
  const router = useRouter()
  const authorName = item.post.author.displayName ?? item.post.author.username
  const isMe = item.post.author.id === userId

  const initialReactions = useMemo<ReactionSummary[]>(
    () =>
      Object.entries(
        item.post.reactions.reduce<Record<string, { count: number; reactedByMe: boolean }>>(
          (acc, r) => {
            if (!acc[r.emoji]) acc[r.emoji] = { count: 0, reactedByMe: false }
            acc[r.emoji].count++
            if (r.userId === userId) acc[r.emoji].reactedByMe = true
            return acc
          },
          {},
        ),
      ).map(([emoji, { count, reactedByMe }]) => ({ emoji, count, reactedByMe })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      item.post.id,
      item.post.reactions
        .map(r => `${r.userId}:${r.emoji}`)
        .sort()
        .join('|'),
    ],
  )

  const { reactions, toggle } = useReaction(item.post.id, userId, initialReactions)

  function goToProfile() {
    if (isMe) return
    router.push(`/club/${item.clubId}/member/${item.post.author.id}`)
  }

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.cardTop}
        onPress={goToProfile}
        disabled={isMe}
        activeOpacity={isMe ? 1 : 0.7}
      >
        <Avatar name={authorName} avatarUrl={item.post.author.avatarUrl} size={42} />
        <View style={styles.cardTopInfo}>
          <View style={styles.cardTopRow}>
            <Text style={styles.authorName} numberOfLines={1}>
              {authorName}
            </Text>
            {item.post.chapterRef != null && (
              <View style={styles.chapterPill}>
                <Text style={styles.chapterPillText}>cap. {item.post.chapterRef}</Text>
              </View>
            )}
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.clubLabel} numberOfLines={1}>
              {item.clubName}
            </Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.timestamp}>{timeAgo(item.timestamp)}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Content */}
      {item.post.hasSpoiler && !spoilerRevealed ? (
        <TouchableOpacity style={styles.spoilerBlock} onPress={() => setSpoilerRevealed(true)}>
          <Ionicons name="eye-off-outline" size={16} color={colors.textMuted} />
          <Text style={styles.spoilerText}>Contiene spoilers · toca para ver</Text>
        </TouchableOpacity>
      ) : (
        <Text style={styles.postContent} numberOfLines={5}>
          {item.post.content}
        </Text>
      )}

      <EmojiReactionBar reactions={reactions} onToggle={toggle} />
    </View>
  )
}

function ProgressCard({ item }: { item: ProgressFeedItem }) {
  const chapterText = item.chapter != null ? `Capítulo ${item.chapter}` : null
  const pageText = item.page != null ? `pág. ${item.page}` : null
  const progressLine = [chapterText, pageText].filter(Boolean).join(' · ') || 'Lectura en curso'

  return (
    <View style={[styles.card, styles.progressCard]}>
      <View style={styles.progressLeft}>
        <View style={styles.progressIconWrap}>
          <Ionicons name="book-outline" size={20} color={colors.success} />
        </View>
        <View style={styles.progressInfo}>
          <View style={styles.cardMeta}>
            <Text style={styles.clubLabel}>{item.clubName}</Text>
            <Text style={styles.dot}>·</Text>
            <Text style={styles.timestamp}>{timeAgo(item.timestamp)}</Text>
          </View>
          <Text style={styles.progressText}>{progressLine}</Text>
          {item.chapter != null && (
            <View style={styles.progressBarWrap}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${Math.min((item.chapter / 30) * 100, 100)}%` },
                ]}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

function FeedCard({ item, userId }: { item: FeedItem; userId: string }) {
  if (item.type === 'post') return <PostCard item={item} userId={userId} />
  return <ProgressCard item={item} />
}

function NotificationsSheet({
  visible,
  notifications,
  onClose,
}: {
  visible: boolean
  notifications: NotificationWithDetails[]
  onClose: () => void
}) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.sheetContainer}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Notificaciones</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.centered}>
            <Ionicons name="notifications-off-outline" size={40} color={colors.border} />
            <Text style={styles.emptyText}>Sin notificaciones</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.notifList}>
            {notifications.map(n => (
              <View key={n.id} style={[styles.notifItem, !n.read && styles.notifItemUnread]}>
                <Avatar
                  name={n.actor.displayName ?? n.actor.username}
                  avatarUrl={n.actor.avatarUrl}
                  size={38}
                />
                <View style={styles.notifBody}>
                  <Text style={styles.notifText}>
                    <Text style={styles.notifActor}>{n.actor.displayName ?? n.actor.username}</Text>
                    {' reaccionó con '}
                    <Text style={styles.notifEmoji}>{n.emoji}</Text>
                    {' a tu comentario'}
                  </Text>
                  <Text style={styles.notifTime}>{timeAgo(n.createdAt)}</Text>
                </View>
                {!n.read && <View style={styles.unreadDot} />}
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  )
}

export default function FeedScreen() {
  const { user } = useAuth()
  const { items, loading, refreshing, error, refresh } = useFeed(user?.id ?? '')
  const { notifications, unreadCount, markAllRead } = useNotifications(user?.id ?? '')
  const [notifVisible, setNotifVisible] = useState(false)

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh]),
  )

  function openNotifications() {
    setNotifVisible(true)
    if (unreadCount > 0) markAllRead()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Folio</Text>
        <TouchableOpacity style={styles.bellButton} onPress={openNotifications}>
          <Ionicons name="notifications-outline" size={22} color={colors.textSecondary} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.amber} />
        </View>
      )}

      {error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && items.length === 0 && (
        <View style={styles.centered}>
          <Ionicons name="book-outline" size={48} color={colors.border} />
          <Text style={styles.emptyText}>Tu feed está vacío</Text>
          <Text style={styles.emptyHint}>Únete a un club para ver la actividad aquí</Text>
        </View>
      )}

      {!loading && !error && items.length > 0 && (
        <FlatList
          data={items}
          keyExtractor={i => `${i.type}-${i.id}`}
          renderItem={({ item }) => <FeedCard item={item} userId={user?.id ?? ''} />}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
        />
      )}

      <NotificationsSheet
        visible={notifVisible}
        notifications={notifications}
        onClose={() => setNotifVisible(false)}
      />
    </SafeAreaView>
  )
}

const cardShadow = {
  shadowColor: '#1A1208',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  elevation: 2,
}

const styles = StyleSheet.create({
  authorName: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    fontWeight: '600',
  },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: 'Inter-Regular', fontWeight: '600' },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.error,
    borderRadius: 8,
    bottom: -2,
    height: 16,
    justifyContent: 'center',
    minWidth: 16,
    paddingHorizontal: 3,
    position: 'absolute',
    right: -4,
  },
  badgeText: { color: '#fff', fontFamily: 'Inter-Regular', fontSize: 10 },
  bellButton: { padding: 4, position: 'relative' },
  card: {
    ...cardShadow,
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
  },
  cardMeta: { alignItems: 'center', flexDirection: 'row', gap: 4, marginTop: 2 },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, marginBottom: 12 },
  cardTopInfo: { flex: 1 },
  cardTopRow: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  centered: { alignItems: 'center', flex: 1, gap: 10, justifyContent: 'center' },
  chapterPill: {
    backgroundColor: colors.amberFaint,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chapterPillText: { color: colors.amber, fontFamily: 'Inter-Regular', fontSize: 10 },
  closeBtn: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: 16,
    padding: 6,
  },
  clubLabel: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    maxWidth: 160,
  },
  container: { backgroundColor: colors.bg, flex: 1 },
  dot: { color: colors.borderLight, fontSize: 11 },
  emptyHint: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 13 },
  emptyText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 17 },
  errorText: { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 },
  header: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  list: { paddingTop: 8, paddingBottom: 24 },
  notifActor: { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontWeight: '600' },
  notifBody: { flex: 1, gap: 3 },
  notifEmoji: { fontSize: 17 },
  notifItem: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  notifItemUnread: { backgroundColor: colors.amberFaint },
  notifList: { paddingBottom: 20 },
  notifText: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  notifTime: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 11 },
  postContent: {
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 23,
    marginBottom: 12,
  },
  progressBar: {
    backgroundColor: colors.success,
    borderRadius: 3,
    height: 4,
  },
  progressBarWrap: {
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 4,
    marginTop: 8,
    overflow: 'hidden',
    width: '100%',
  },
  progressCard: { borderColor: colors.border },
  progressIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.success + '18',
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  progressInfo: { flex: 1 },
  progressLeft: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  progressText: {
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginTop: 4,
  },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13 },
  sheetContainer: { backgroundColor: colors.surface, flex: 1 },
  sheetHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sheetTitle: { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 22 },
  spoilerBlock: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    padding: 12,
  },
  spoilerText: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 13 },
  timestamp: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 11 },
  title: { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 28 },
  unreadDot: {
    backgroundColor: colors.amber,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
})
