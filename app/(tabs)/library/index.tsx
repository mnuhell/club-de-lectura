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
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const COLS = 3
const COVER_WIDTH = (SCREEN_WIDTH - 16 * 2 - 10 * (COLS - 1)) / COLS
const COVER_HEIGHT = COVER_WIDTH * 1.48

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

const EMPTY_MESSAGES: Record<BookStatus, { title: string; hint: string; icon: string }> = {
  reading: {
    title: 'Nada en curso',
    hint: 'Busca un libro y márcalo como "Leyendo"',
    icon: 'book-outline',
  },
  want_to_read: {
    title: 'Lista vacía',
    hint: 'Añade libros que quieras leer próximamente',
    icon: 'bookmark-outline',
  },
  read: {
    title: 'Sin leídos aún',
    hint: 'Marca un libro como leído cuando lo termines',
    icon: 'checkmark-circle-outline',
  },
}

function BookCover({
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
    Alert.alert(item.book.title, item.book.author, [
      ...otherStatuses.map(s => ({
        text: `Mover a "${STATUS_LABELS[s]}"`,
        onPress: () => onChangeStatus(s),
      })),
      { text: 'Eliminar de biblioteca', style: 'destructive' as const, onPress: onRemove },
      { text: 'Cancelar', style: 'cancel' as const },
    ])
  }

  return (
    <TouchableOpacity style={styles.bookItem} onPress={handleOptions} activeOpacity={0.75}>
      <View style={styles.coverWrap}>
        {item.book.coverUrl ? (
          <Image source={{ uri: item.book.coverUrl }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <View style={styles.coverFallback}>
            <Ionicons name="book" size={28} color={colors.amber} />
            <Text style={styles.coverFallbackTitle} numberOfLines={3}>
              {item.book.title}
            </Text>
          </View>
        )}
        {/* Spine effect */}
        <View style={styles.coverSpine} />
      </View>
      <Text style={styles.bookTitle} numberOfLines={2}>
        {item.book.title}
      </Text>
      <Text style={styles.bookAuthor} numberOfLines={1}>
        {item.book.author}
      </Text>
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
  const empty = EMPTY_MESSAGES[activeTab]

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi biblioteca</Text>
        <TouchableOpacity
          style={styles.searchButton}
          onPress={() => router.push('/(tabs)/library/search')}
        >
          <Ionicons name="add" size={20} color={colors.amber} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {TABS.map(tab => {
          const count = books.filter(b => b.status === tab.key).length
          const isActive = activeTab === tab.key
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {count > 0 && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {count}
                  </Text>
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
          <View style={styles.emptyIconWrap}>
            <Ionicons name={empty.icon as never} size={32} color={colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>{empty.title}</Text>
          <Text style={styles.emptyHint}>{empty.hint}</Text>
          <TouchableOpacity
            style={styles.emptySearchBtn}
            onPress={() => router.push('/(tabs)/library/search')}
          >
            <Ionicons name="add" size={14} color={colors.amber} />
            <Text style={styles.emptySearchText}>Añadir libro</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && filtered.length > 0 && (
        <FlatList
          data={filtered}
          keyExtractor={item => item.bookId}
          numColumns={COLS}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <BookCover
              item={item}
              onChangeStatus={status => setStatus(item.bookId, status)}
              onRemove={() => remove(item.bookId)}
            />
          )}
          contentContainerStyle={styles.grid}
          onRefresh={refresh}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  bookAuthor: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    marginTop: 2,
  },
  bookItem: {
    width: COVER_WIDTH,
  },
  bookTitle: {
    color: colors.textPrimary,
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 6,
  },
  centered: { alignItems: 'center', flex: 1, gap: 8, justifyContent: 'center' },
  container: { backgroundColor: colors.bg, flex: 1 },
  coverFallback: {
    alignItems: 'center',
    backgroundColor: colors.amberFaint,
    flex: 1,
    gap: 8,
    justifyContent: 'center',
    padding: 8,
  },
  coverFallbackTitle: {
    color: colors.amber,
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    lineHeight: 13,
    textAlign: 'center',
  },
  coverImage: { height: '100%', width: '100%' },
  coverSpine: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 4,
  },
  coverWrap: {
    borderRadius: 6,
    elevation: 3,
    height: COVER_HEIGHT,
    overflow: 'hidden',
    shadowColor: '#1A1208',
    shadowOffset: { width: -2, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    width: COVER_WIDTH,
  },
  emptyHint: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyIconWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 24,
    height: 64,
    justifyContent: 'center',
    marginBottom: 4,
    width: 64,
  },
  emptySearchBtn: {
    alignItems: 'center',
    borderColor: colors.amber,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  emptySearchText: { color: colors.amber, fontFamily: 'Inter-SemiBold', fontSize: 13 },
  emptyTitle: { color: colors.textSecondary, fontFamily: 'Inter-SemiBold', fontSize: 16 },
  errorText: { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 },
  grid: { padding: 16, paddingBottom: 32, gap: 16 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: { color: colors.textSecondary, fontFamily: 'Inter-Regular', fontSize: 13 },
  row: { gap: 10 },
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
    borderBottomColor: 'transparent',
    borderBottomWidth: 2,
    flexDirection: 'row',
    flex: 1,
    gap: 5,
    justifyContent: 'center',
    paddingVertical: 11,
  },
  tabActive: { borderBottomColor: colors.amber },
  tabBadge: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tabBadgeActive: { backgroundColor: colors.amberFaint },
  tabBadgeText: { color: colors.textMuted, fontFamily: 'Inter-Medium', fontSize: 10 },
  tabBadgeTextActive: { color: colors.amber },
  tabText: { color: colors.textMuted, fontFamily: 'Inter-Medium', fontSize: 12 },
  tabTextActive: { color: colors.amber, fontFamily: 'Inter-SemiBold' },
  tabs: { borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row' },
  title: { color: colors.textPrimary, fontFamily: 'Playfair-Bold', fontSize: 28 },
})
