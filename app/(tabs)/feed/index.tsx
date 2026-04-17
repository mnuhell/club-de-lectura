import type { FeedItem, PostFeedItem, ProgressFeedItem } from '@/src/domain'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useFeed } from '@/src/ui/hooks/useFeed'
import { colors } from '@/src/ui/theme'
import { Ionicons } from '@expo/vector-icons'
import {
  ActivityIndicator,
  FlatList,
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
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

function PostCard({ item }: { item: PostFeedItem }) {
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

      {item.post.reactions.length > 0 && (
        <View style={styles.reactionsRow}>
          {Object.entries(
            item.post.reactions.reduce<Record<string, number>>((acc, r) => {
              acc[r.emoji] = (acc[r.emoji] ?? 0) + 1
              return acc
            }, {}),
          ).map(([emoji, count]) => (
            <View key={emoji} style={styles.reactionBadge}>
              <Text style={styles.reactionEmoji}>{emoji}</Text>
              <Text style={styles.reactionCount}>{count}</Text>
            </View>
          ))}
        </View>
      )}
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

function FeedCard({ item }: { item: FeedItem }) {
  if (item.type === 'post') return <PostCard item={item} />
  return <ProgressCard item={item} />
}

export default function FeedScreen() {
  const { user } = useAuth()
  const { items, loading, error, refresh } = useFeed(user?.id ?? '')

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Feed</Text>
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
          renderItem={({ item }) => <FeedCard item={item} />}
          contentContainerStyle={styles.list}
          onRefresh={refresh}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  avatarInitial: { color: colors.amber, fontFamily: 'SpaceMono', fontSize: 12 },
  authorName: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 12 },
  authorRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginBottom: 10 },
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
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  list: { paddingVertical: 8 },
  postContent: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 15, lineHeight: 22 },
  progressBody: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  progressCard: { borderColor: colors.success + '40' },
  progressText: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 15 },
  reactionBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reactionCount: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 11 },
  reactionEmoji: { fontSize: 14 },
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
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
})
