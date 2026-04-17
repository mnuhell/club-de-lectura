import type { Book, BookStatus } from '@/src/domain'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useBookSearch } from '@/src/ui/hooks/useBookSearch'
import { colors } from '@/src/ui/theme'
import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const STATUS_OPTIONS: { key: BookStatus; label: string }[] = [
  { key: 'want_to_read', label: 'Por leer' },
  { key: 'reading', label: 'Leyendo ahora' },
  { key: 'read', label: 'Ya lo leí' },
]

function BookResult({ book, onAdd }: { book: Book; onAdd: (status: BookStatus) => void }) {
  function handleAdd() {
    Alert.alert('Añadir a biblioteca', `"${book.title}"`, [
      ...STATUS_OPTIONS.map(opt => ({
        text: opt.label,
        onPress: () => onAdd(opt.key),
      })),
      { text: 'Cancelar', style: 'cancel' as const },
    ])
  }

  return (
    <View style={styles.result}>
      <View style={styles.cover}>
        {book.coverUrl ? (
          <Image source={{ uri: book.coverUrl }} style={styles.coverImage} resizeMode="cover" />
        ) : (
          <Ionicons name="book-outline" size={22} color={colors.amber} />
        )}
      </View>
      <View style={styles.resultBody}>
        <Text style={styles.resultTitle} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.resultAuthor} numberOfLines={1}>
          {book.author}
        </Text>
        {book.publishedYear && (
          <Text style={styles.resultMeta}>{book.publishedYear}</Text>
        )}
      </View>
      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <Ionicons name="add" size={20} color={colors.amber} />
      </TouchableOpacity>
    </View>
  )
}

function ScannerView({ onScanned, onClose }: { onScanned: (isbn: string) => void; onClose: () => void }) {
  const [scanned, setScanned] = useState(false)

  function handleBarcode({ data }: { data: string }) {
    if (scanned) return
    setScanned(true)
    onScanned(data)
  }

  return (
    <View style={styles.scanner}>
      <CameraView
        style={styles.camera}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
        onBarcodeScanned={handleBarcode}
      />
      <View style={styles.scannerOverlay}>
        <View style={styles.scannerFrame} />
        <Text style={styles.scannerHint}>Enfoca el código de barras del libro</Text>
      </View>
      <TouchableOpacity style={styles.scannerClose} onPress={onClose}>
        <Ionicons name="close" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}

export default function SearchScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { results, loading, error, search, save } = useBookSearch(user?.id ?? '')
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [permission, requestPermission] = useCameraPermissions()

  async function handleSearch(q = query) {
    if (!q.trim()) return
    await search(q.trim())
  }

  async function handleScanPress() {
    if (!permission?.granted) {
      const result = await requestPermission()
      if (!result.granted) {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para escanear el código de barras.')
        return
      }
    }
    setShowScanner(true)
  }

  async function handleScanned(isbn: string) {
    setShowScanner(false)
    setQuery(isbn)
    await search(isbn)
  }

  async function handleAdd(book: Book, status: BookStatus) {
    setSaving(true)
    try {
      await save(book, status)
      router.back()
    } catch {
      Alert.alert('Error', 'No se pudo añadir el libro. Inténtalo de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  if (showScanner) {
    return (
      <ScannerView
        onScanned={handleScanned}
        onClose={() => setShowScanner(false)}
      />
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            placeholder="Título, autor o ISBN..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.scanButton} onPress={handleScanPress}>
          <Ionicons name="barcode-outline" size={22} color={colors.amber} />
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.amber} />
          <Text style={styles.hintText}>Buscando en Google Books...</Text>
        </View>
      )}

      {error && !loading && (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!loading && !error && results.length === 0 && query.trim() !== '' && (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Sin resultados para &ldquo;{query}&rdquo;</Text>
        </View>
      )}

      {!loading && results.length === 0 && query.trim() === '' && (
        <View style={styles.centered}>
          <Ionicons name="search" size={40} color={colors.surfaceHigh} />
          <Text style={styles.hintText}>Busca por título, autor o ISBN</Text>
          <TouchableOpacity style={styles.scanHint} onPress={handleScanPress}>
            <Ionicons name="barcode-outline" size={16} color={colors.amber} />
            <Text style={styles.scanHintText}>O escanea el código de barras</Text>
          </TouchableOpacity>
        </View>
      )}

      {results.length > 0 && (
        <FlatList
          data={results}
          keyExtractor={item => item.externalId ?? item.title}
          renderItem={({ item }) => (
            <BookResult book={item} onAdd={status => handleAdd(item, status)} />
          )}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
      )}

      {saving && (
        <View style={styles.savingOverlay}>
          <ActivityIndicator color={colors.amber} />
          <Text style={styles.savingText}>Añadiendo a tu biblioteca...</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: colors.amberFaint,
    borderRadius: 16,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  camera: { flex: 1 },
  centered: { alignItems: 'center', flex: 1, gap: 12, justifyContent: 'center' },
  container: { backgroundColor: colors.bg, flex: 1 },
  cover: {
    alignItems: 'center',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 6,
    height: 64,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 44,
  },
  coverImage: { height: '100%', width: '100%' },
  emptyText: { color: colors.textSecondary, fontFamily: 'Georgia', fontSize: 15 },
  errorText: { color: colors.error, fontFamily: 'SpaceMono', fontSize: 13 },
  hintText: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 13 },
  input: {
    color: colors.textPrimary,
    flex: 1,
    fontFamily: 'SpaceMono',
    fontSize: 14,
    paddingVertical: 0,
  },
  list: { paddingVertical: 8 },
  result: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  resultAuthor: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 11 },
  resultBody: { flex: 1, gap: 3 },
  resultMeta: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10 },
  resultTitle: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 15 },
  savingOverlay: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderRadius: 12,
    bottom: 32,
    flexDirection: 'row',
    gap: 10,
    left: 32,
    paddingHorizontal: 20,
    paddingVertical: 14,
    position: 'absolute',
    right: 32,
  },
  savingText: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 12 },
  scanButton: {
    alignItems: 'center',
    backgroundColor: colors.amberFaint,
    borderRadius: 12,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  scanHint: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  scanHintText: { color: colors.amber, fontFamily: 'SpaceMono', fontSize: 12 },
  scanner: { flex: 1 },
  scannerClose: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    position: 'absolute',
    right: 20,
    top: 60,
  },
  scannerFrame: {
    borderColor: colors.amber,
    borderRadius: 12,
    borderWidth: 2,
    height: 160,
    width: 280,
  },
  scannerHint: {
    color: '#fff',
    fontFamily: 'SpaceMono',
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
  },
  scannerOverlay: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  searchBar: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
})
