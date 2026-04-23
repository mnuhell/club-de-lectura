import type { BookStatus, UserBookWithDetails } from '@/src/domain'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useLibrary } from '@/src/ui/hooks/useLibrary'
import { colors } from '@/src/ui/theme'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const TABS: { key: BookStatus; label: string }[] = [
  { key: 'reading', label: 'Leyendo' },
  { key: 'want_to_read', label: 'Por leer' },
  { key: 'read', label: 'Leídos' },
]

const STATUS_LABELS: Record<BookStatus, string> = {
  reading: 'Leyendo',
  want_to_read: 'Por leer',
  read: 'Leído',
}

function BookCard({
  item,
  onChangeStatus,
  onRemove,
}: {
  item: UserBookWithDetails
  onChangeStatus: (status: BookStatus) => void
  onRemove: () => void
}) {
  const otherStatuses = (Object.keys(STATUS_LABELS) as BookStatus[]).filter(s => s !== item.status)

  function handleOptions() {
    Alert.alert(item.book.title, undefined, [
      ...otherStatuses.map(s => ({
        text: `Mover a "${STATUS_LABELS[s]}"`,
        onPress: () => onChangeStatus(s),
      })),
      { text: 'Eliminar de biblioteca', style: 'destructive' as const, onPress: onRemove },
      { text: 'Cancelar', style: 'cancel' as const },
    ])
  }

  return (
    <TouchableOpacity style={styles.card} onPress={handleOptions} activeOpacity={0.75}>
      <View style={styles.cardCover}>
        {item.book.coverUrl ? (
          <Image
            source={{ uri: item.book.coverUrl }}
            style={styles.cardCoverImage}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="book-outline" size={24} color={colors.amber} />
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.book.title}
        </Text>
        <Text style={styles.cardAuthor} numberOfLines={1}>
          {item.book.author}
        </Text>
        {!!item.book.pageCount && (
          <Text style={styles.cardMeta}>{item.book.pageCount} páginas</Text>
        )}
      </View>
      <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  )
}

export default function LibraryScreen() {
  const router = useRouter()
  const { user } = useAuth()

  const { books, loading, error, setStatus, remove, refresh } = useLibrary(user?.id ?? '')
  const [activeTab, setActiveTab] = useState<BookStatus>('reading')

  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh]),
  )

  const filtered = books.filter(b => b.status === activeTab)

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi biblioteca</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push('/(tabs)/library/search')}
        >
          <Ionicons name="search-outline" size={18} color={colors.amber} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {TABS.map(tab => {
          const count = books.filter(b => b.status === tab.key).length
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{count}</Text>
                </View>
              )}
            </TouchableOpacity>
          )
        })}
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

      {!loading && !error && filtered.length === 0 && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>
            {activeTab === 'reading'
              ? 'No estás leyendo nada ahora mismo'
              : activeTab === 'want_to_read'
                ? 'Tu lista de pendientes está vacía'
                : 'Aún no has marcado libros como leídos'}
          </Text>
        </View>
      )}

      {!loading && !error && filtered.length > 0 && (
        <FlatList
          data={filtered}
          keyExtractor={item => item.bookId}
          renderItem={({ item }) => (
            <BookCard
              item={item}
              onChangeStatus={status => setStatus(item.bookId, status)}
              onRemove={() => remove(item.bookId)}
            />
          )}
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
  card: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 12,
  },
  cardAuthor: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 12 },
  cardBody: { flex: 1, gap: 4 },
  cardCover: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 6,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 40,
  },
  cardCoverImage: { height: '100%', width: '100%' },
  cardMeta: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 11 },
  cardTitle: { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 16 },
  centered: { alignItems: 'center', flex: 1, gap: 8, justifyContent: 'center' },
  container: { backgroundColor: colors.bg, flex: 1 },
  emptyText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 16 },
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
  list: { paddingVertical: 8 },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13 },
  searchButton: {
    alignItems: 'center',
    backgroundColor: colors.amberFaint,
    borderRadius: 20,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  tab: {
    alignItems: 'center',
    borderBottomColor: colors.transparent,
    borderBottomWidth: 2,
    flexDirection: 'row',
    flex: 1,
    gap: 6,
    justifyContent: 'center',
    paddingVertical: 10,
  },
  tabActive: { borderBottomColor: colors.amber },
  tabBadge: {
    backgroundColor: colors.amberFaint,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabBadgeText: { color: colors.amber, fontFamily: 'Inter-Regular', fontSize: 10 },
  tabText: { color: colors.textMuted, fontFamily: 'Inter-Regular', fontSize: 12 },
  tabTextActive: { color: colors.amber },
  tabs: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  title: { color: colors.textPrimary, fontFamily: 'Inter-Regular', fontSize: 24 },
})
