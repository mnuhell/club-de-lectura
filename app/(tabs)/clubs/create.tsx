import type { Book } from '@/src/domain'
import { BookSearchInput } from '@/src/ui/components/BookSearchInput'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { useClubs } from '@/src/ui/hooks/useClubs'
import { colors } from '@/src/ui/theme'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

// ─── DateInput ───────────────────────────────────────────────────────────────

function formatDisplay(date: Date, withTime: boolean): string {
  const d = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  if (!withTime) return d
  const t = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  return `${d} ${t}`
}

function DateInput({
  value,
  onChange,
  mode,
  placeholder,
}: {
  value: Date | null
  onChange: (date: Date | null) => void
  mode: 'date' | 'datetime'
  placeholder: string
}) {
  const [showPicker, setShowPicker] = useState(false)

  function handleChange(_event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowPicker(false)
    if (selected) onChange(selected)
  }

  return (
    <View>
      <TouchableOpacity style={styles.dateButton} onPress={() => setShowPicker(v => !v)}>
        <Text style={value ? styles.dateValue : styles.datePlaceholder}>
          {value ? formatDisplay(value, mode === 'datetime') : placeholder}
        </Text>
        <Text style={styles.dateIcon}>📅</Text>
      </TouchableOpacity>

      {showPicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={value ?? new Date()}
            mode={mode}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleChange}
            locale="es-ES"
          />
          {Platform.OS === 'ios' && (
            <View style={styles.pickerActions}>
              {value && (
                <TouchableOpacity
                  onPress={() => {
                    onChange(null)
                    setShowPicker(false)
                  }}
                >
                  <Text style={styles.pickerClear}>Quitar</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.pickerDone}>Hecho</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

// ─── SectionHeader ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function CreateClubScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { create } = useClubs(user?.id ?? '')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)

  const [selectedBook, setSelectedBook] = useState<Book | null>(null)

  const [startDate, setStartDate] = useState<Date | null>(null)
  const [meetingDate, setMeetingDate] = useState<Date | null>(null)
  const [closeDate, setCloseDate] = useState<Date | null>(null)

  const [bookstoreName, setBookstoreName] = useState('')
  const [bookstoreUrl, setBookstoreUrl] = useState('')
  const [bookstoreAddress, setBookstoreAddress] = useState('')
  const [bookstorePhone, setBookstorePhone] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    if (!name.trim()) {
      setError('El nombre del club es obligatorio')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await create({
        name: name.trim(),
        description: description.trim() || null,
        isPrivate,
        book: selectedBook,
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        meetingDate: meetingDate ? meetingDate.toISOString() : null,
        closeDate: closeDate ? closeDate.toISOString() : null,
        bookstoreName: bookstoreName.trim() || null,
        bookstoreUrl: bookstoreUrl.trim() || null,
        bookstoreAddress: bookstoreAddress.trim() || null,
        bookstorePhone: bookstorePhone.trim() || null,
      })
      router.back()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el club')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* ── Club ── */}
        <SectionHeader title="Datos del club" />

        <Text style={styles.label}>Nombre *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Lectores nocturnos..."
          placeholderTextColor={colors.textMuted}
          maxLength={80}
          autoFocus
        />

        <Text style={styles.label}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="De qué trata el club, qué leen..."
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          maxLength={300}
        />

        <View style={styles.switchRow}>
          <View>
            <Text style={styles.label}>Club privado</Text>
            <Text style={styles.switchHint}>Solo por invitación</Text>
          </View>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: colors.border, true: colors.amber }}
            thumbColor={colors.textPrimary}
          />
        </View>

        {/* ── Libro ── */}
        <SectionHeader title="Libro a leer" />
        <Text style={styles.label}>Buscar libro</Text>
        <BookSearchInput
          userId={user?.id ?? ''}
          selected={selectedBook}
          onSelect={setSelectedBook}
        />

        {/* ── Fechas ── */}
        <SectionHeader title="Fechas" />

        <Text style={styles.label}>Inicio de lectura</Text>
        <DateInput
          value={startDate}
          onChange={setStartDate}
          mode="date"
          placeholder="Selecciona una fecha"
        />

        <Text style={styles.label}>Reunión del club</Text>
        <DateInput
          value={meetingDate}
          onChange={setMeetingDate}
          mode="datetime"
          placeholder="Selecciona fecha y hora"
        />

        <Text style={styles.label}>Cierre del club</Text>
        <Text style={styles.sectionHint}>
          A partir de esta fecha el club se cerrará automáticamente y nadie podrá unirse ni
          abandonarlo.
        </Text>
        <DateInput
          value={closeDate}
          onChange={setCloseDate}
          mode="datetime"
          placeholder="Sin fecha de cierre"
        />

        {/* ── Librería ── */}
        <SectionHeader title="Librería colaboradora" />
        <Text style={styles.sectionHint}>
          Añade los datos de la librería donde los lectores pueden comprar o reservar el libro.
        </Text>

        <Text style={styles.label}>Nombre de la librería</Text>
        <TextInput
          style={styles.input}
          value={bookstoreName}
          onChangeText={setBookstoreName}
          placeholder="Librería Cervantes..."
          placeholderTextColor={colors.textMuted}
          maxLength={120}
        />

        <Text style={styles.label}>Web / enlace de compra</Text>
        <TextInput
          style={styles.input}
          value={bookstoreUrl}
          onChangeText={setBookstoreUrl}
          placeholder="https://libreria.com/libro"
          placeholderTextColor={colors.textMuted}
          keyboardType="url"
          autoCapitalize="none"
          maxLength={300}
        />

        <Text style={styles.label}>Dirección</Text>
        <TextInput
          style={styles.input}
          value={bookstoreAddress}
          onChangeText={setBookstoreAddress}
          placeholder="Calle Mayor 1, Madrid"
          placeholderTextColor={colors.textMuted}
          maxLength={200}
        />

        <Text style={styles.label}>Teléfono</Text>
        <TextInput
          style={styles.input}
          value={bookstorePhone}
          onChangeText={setBookstorePhone}
          placeholder="+34 91 000 00 00"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          maxLength={30}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, (!name.trim() || loading) && styles.buttonDisabled]}
          onPress={handleCreate}
          disabled={!name.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.buttonText}>Crear club</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: 12,
    marginTop: 28,
    paddingVertical: 14,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    color: colors.textInverse,
    fontFamily: 'SpaceMono',
    fontSize: 14,
    fontWeight: '600',
  },
  container: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: 8, padding: 24, paddingBottom: 48 },
  dateButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dateIcon: { fontSize: 16 },
  datePlaceholder: { color: colors.textMuted, fontFamily: 'Georgia', fontSize: 15 },
  dateValue: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 15 },
  error: { color: colors.error, fontFamily: 'SpaceMono', fontSize: 12, marginTop: 8 },
  input: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: 'Georgia',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMultiline: { minHeight: 80, paddingTop: 12, textAlignVertical: 'top' },
  label: {
    color: colors.textMuted,
    fontFamily: 'SpaceMono',
    fontSize: 11,
    marginBottom: 6,
    marginTop: 12,
  },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerClear: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 13 },
  pickerContainer: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    overflow: 'hidden',
  },
  pickerDone: { color: colors.amber, fontFamily: 'SpaceMono', fontSize: 13 },

  sectionHeader: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    color: colors.amber,
    fontFamily: 'SpaceMono',
    fontSize: 11,
    letterSpacing: 1.5,
    marginTop: 24,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  sectionHint: {
    color: colors.textMuted,
    fontFamily: 'Georgia',
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: 6,
  },
  switchHint: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10, marginTop: 2 },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 4,
  },
})
