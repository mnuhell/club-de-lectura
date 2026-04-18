import type { FeedItem, NotificationWithDetails, PostFeedItem, ProgressFeedItem, ReactionSummary } from '@/src/domain'
import { EmojiReactionBar } from '@/src/ui/components/EmojiReactionBar'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useFeed } from '@/src/ui/hooks/useFeed'
import { useNotifications } from '@/src/ui/hooks/useNotifications'
import { useReaction } from '@/src/ui/hooks/useReaction'
import { colors } from '@/src/ui/theme'
import { Ionicons } from '@expo/vector-icons'
import { useMemo } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

function PostCard({ item, userId }: { item: PostFeedItem; userId: string }) {
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
    [item.post.id],
  )

  const { reactions, toggle } = useReaction(item.post.id, userId, initialReactions)

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.typeBadge}>
          <Ionicons name="chatbubble-outline" size={11} color={colors.amber} />
          <Text style={styles.typeBadgeText}>comentario</Text>
        </View>
        <Text style={styles.clubName}>{item.clubName}</Text>
        <Text style={styles.timestamp}>{timeAgo(item.timestamp)}</Text>
      </View>

      <View style={styles.authorRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {(item.post.author.displayName ?? item.post.author.username).slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.authorName}>
          {item.post.author.displayName ?? item.post.author.username}
        </Text>
        {item.post.chapterRef != null && (
          <Text style={styles.chapterRef}>{`· cap. ${item.post.chapterRef}`}</Text>
        )}
      </View>

      {item.post.hasSpoiler ? (
        <View style={styles.spoilerBlock}>
          <Ionicons name="eye-off-outline" size={14} color={colors.textMuted} />
          <Text style={styles.spoilerText}>Contiene spoilers</Text>
        </View>
      ) : (
        <Text style={styles.postContent} numberOfLines={4}>
          {item.post.content}
        </Text>
      )}

      <EmojiReactionBar reactions={reactions} onToggle={toggle} />
    </View>
  )
}

function ProgressCard({ item }: { item: ProgressFeedItem }) {
  const progress =
    item.chapter != null && item.page != null
      ? `Capítulo ${item.chapter} · Página ${item.page}`
      : item.chapter != null
        ? `Capítulo ${item.chapter}`
        : item.page != null
          ? `Página ${item.page}`
          : 'Lectura en curso'

  return (
    <View style={[styles.card, styles.progressCard]}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, styles.typeBadgeProgress]}>
          <Ionicons name="book-outline" size={11} color={colors.success} />
          <Text style={[styles.typeBadgeText, styles.typeBadgeTextProgress]}>progreso</Text>
        </View>
        <Text style={styles.clubName}>{item.clubName}</Text>
        <Text style={styles.timestamp}>{timeAgo(item.timestamp)}</Text>
      </View>
      <View style={styles.progressBody}>
        <Ionicons name="flag-outline" size={18} color={colors.success} />
        <Text style={styles.progressText}>{progress}</Text>
      </View>
    </View>
  )
}

function FeedCard({ item, userId }: { item: FeedItem; userId: string }) {
  if (item.type === 'post') return <PostCard item={item} userId={userId} />
  return <ProgressCard item={item} />
}

function NotificationsModal({
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
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Notificaciones</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Sin notificaciones</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.notifList}>
            {notifications.map(n => (
              <View key={n.id} style={[styles.notifItem, !n.read && styles.notifItemUnread]}>
                <View style={styles.notifAvatar}>
                  <Text style={styles.notifAvatarText}>
                    {(n.actor.displayName ?? n.actor.username).slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.notifBody}>
                  <Text style={styles.notifText}>
                    <Text style={styles.notifActor}>
                      {n.actor.displayName ?? n.actor.username}
                    </Text>
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
  const { items, loading, error, refresh } = useFeed(user?.id ?? '')
  const { notifications, unreadCount, markAllRead } = useNotifications(user?.id ?? '')
  const [notifVisible, setNotifVisible] = useState(false)

  function openNotifications() {
    setNotifVisible(true)
    if (unreadCount > 0) markAllRead()
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
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
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}

      <NotificationsModal
        visible={notifVisible}
        notifications={notifications}
        onClose={() => setNotifVisible(false)}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  authorName: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 12 },
  authorRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 10 },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  avatarInitial: { color: colors.amber, fontFamily: 'SpaceMono', fontSize: 12 },
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
  badgeText: { color: '#fff', fontFamily: 'SpaceMono', fontSize: 9 },
  bellButton: { padding: 4, position: 'relative' },
  card: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
  },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: 6, marginBottom: 10 },
  centered: { alignItems: 'center', flex: 1, gap: 10, justifyContent: 'center' },
  chapterRef: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 11 },
  clubName: { color: colors.textMuted, flex: 1, fontFamily: 'SpaceMono', fontSize: 10 },
  container: { backgroundColor: colors.bg, flex: 1 },
  emptyHint: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 12 },
  emptyText: { color: colors.textSecondary, fontFamily: 'Georgia', fontSize: 16 },
  errorText: { color: colors.error, fontFamily: 'SpaceMono', fontSize: 13 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  list: { paddingVertical: 8 },
  modalContainer: { backgroundColor: colors.bg, flex: 1 },
  modalHeader: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 20 },
  notifActor: { color: colors.textPrimary, fontFamily: 'SpaceMono' },
  notifAvatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  notifAvatarText: { color: colors.amber, fontFamily: 'SpaceMono', fontSize: 13 },
  notifBody: { flex: 1, gap: 4 },
  notifEmoji: { fontSize: 16 },
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
  notifText: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 12, lineHeight: 18 },
  notifTime: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10 },
  postContent: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 15, lineHeight: 22 },
  progressBody: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  progressCard: { borderColor: colors.success + '40' },
  progressText: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 15 },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 12 },
  spoilerBlock: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    padding: 10,
  },
  spoilerText: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 12 },
  timestamp: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10 },
  title: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 24 },
  typeBadge: {
    alignItems: 'center',
    backgroundColor: colors.amberFaint,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  typeBadgeProgress: { backgroundColor: colors.success + '20' },
  typeBadgeText: { color: colors.amber, fontFamily: 'SpaceMono', fontSize: 9 },
  typeBadgeTextProgress: { color: colors.success },
  unreadDot: {
    backgroundColor: colors.amber,
    borderRadius: 4,
    height: 8,
    width: 8,
  },
})
