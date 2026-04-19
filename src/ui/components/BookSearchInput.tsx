import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import type { Book } from '../../domain'
import { useBookSearch } from '../hooks/useBookSearch'
import { colors } from '../theme'

interface Props {
  userId: string
  selected: Book | null
  onSelect: (book: Book | null) => void
  placeholder?: string
}

export function BookSearchInput({
  userId,
  selected,
  onSelect,
  placeholder = 'Busca por título o autor...',
}: Props) {
  const [query, setQuery] = useState('')
  const { results, loading, error, search } = useBookSearch(userId)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleChange(text: string) {
    setQuery(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.trim().length >= 3) {
      debounceRef.current = setTimeout(() => search(text.trim()), 500)
    }
  }

  function handleSelect(book: Book) {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    onSelect(book)
    setQuery('')
  }

  if (selected) {
    return (
      <View style={styles.selected}>
        {selected.coverUrl ? (
          <Image source={{ uri: selected.coverUrl }} style={styles.selectedCover} />
        ) : (
          <View style={styles.selectedCoverFallback} />
        )}
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedTitle} numberOfLines={2}>
            {selected.title}
          </Text>
          <Text style={styles.selectedAuthor} numberOfLines={1}>
            {selected.author}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onSelect(null)} style={styles.removeBtn}>
          <Text style={styles.removeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const hasQuery = query.trim().length >= 3
  const showEmpty = hasQuery && !loading && !error && results.length === 0
  const showResults = !loading && results.length > 0

  return (
    <View>
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {loading && <ActivityIndicator size="small" color={colors.amber} style={styles.spinner} />}
      </View>

      {error && !loading && <Text style={styles.errorText}>{error}</Text>}

      {showEmpty && <Text style={styles.emptyText}>Sin resultados</Text>}

      {showResults && (
        <View style={styles.results}>
          {results.slice(0, 6).map(book => (
            <TouchableOpacity
              key={book.externalId ?? book.title}
              style={styles.resultRow}
              onPress={() => handleSelect(book)}
              activeOpacity={0.7}
            >
              {book.coverUrl ? (
                <Image source={{ uri: book.coverUrl }} style={styles.cover} />
              ) : (
                <View style={styles.coverFallback} />
              )}
              <View style={styles.resultInfo}>
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {book.title}
                </Text>
                <Text style={styles.resultAuthor} numberOfLines={1}>
                  {book.author}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  cover: { borderRadius: 4, height: 44, width: 30 },
  coverFallback: { backgroundColor: colors.border, borderRadius: 4, height: 44, width: 30 },
  emptyText: {
    color: colors.textMuted,
    fontFamily: 'SpaceMono',
    fontSize: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  errorText: {
    color: colors.error,
    fontFamily: 'SpaceMono',
    fontSize: 12,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  input: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: 'Georgia',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
  },
  removeBtn: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 },
  removeBtnText: { color: colors.textMuted, fontSize: 16 },
  resultAuthor: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 10 },
  resultInfo: { flex: 1, gap: 3 },
  resultRow: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  resultTitle: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 13 },
  results: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    overflow: 'hidden',
  },
  selected: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderColor: colors.amber,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    padding: 12,
  },
  selectedAuthor: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 11 },
  selectedCover: { borderRadius: 4, height: 54, width: 36 },
  selectedCoverFallback: { backgroundColor: colors.border, borderRadius: 4, height: 54, width: 36 },
  selectedInfo: { flex: 1, gap: 4 },
  selectedTitle: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 14 },
  spinner: { marginRight: 10 },
})
