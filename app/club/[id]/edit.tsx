import { useAuth } from '@/src/ui/hooks/useAuth'
import { useClubDetail } from '@/src/ui/hooks/useClubDetail'
import { colors } from '@/src/ui/theme'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
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
import { SafeAreaView } from 'react-native-safe-area-context'

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

export default function EditClubScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { club, loading, updateBook: _, refresh } = useClubDetail(id, user?.id ?? '')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [meetingDate, setMeetingDate] = useState<Date | null>(null)
  const [closeDate, setCloseDate] = useState<Date | null>(null)
  const [bookstoreName, setBookstoreName] = useState('')
  const [bookstoreUrl, setBookstoreUrl] = useState('')
  const [bookstoreAddress, setBookstoreAddress] = useState('')
  const [bookstorePhone, setBookstorePhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!club) return
    setName(club.name)
    setDescription(club.description ?? '')
    setCity(club.city ?? '')
    setIsPrivate(club.isPrivate)
    setStartDate(club.startDate ? new Date(club.startDate) : null)
    setMeetingDate(club.meetingDate ? new Date(club.meetingDate) : null)
    setCloseDate(club.closeDate ? new Date(club.closeDate) : null)
    setBookstoreName(club.bookstoreName ?? '')
    setBookstoreUrl(club.bookstoreUrl ?? '')
    setBookstoreAddress(club.bookstoreAddress ?? '')
    setBookstorePhone(club.bookstorePhone ?? '')
  }, [club])

  async function handleSave() {
    if (!name.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const { ClubRepository } = await import('@/src/infrastructure/supabase/repositories')
      const { updateClub } = await import('@/src/usecases/clubs')
      await updateClub(ClubRepository, id, {
        name: name.trim(),
        description: description.trim() || null,
        city: city.trim() || null,
        isPrivate,
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        meetingDate: meetingDate ? meetingDate.toISOString() : null,
        closeDate: closeDate ? closeDate.toISOString() : null,
        bookstoreName: bookstoreName.trim() || null,
        bookstoreUrl: bookstoreUrl.trim() || null,
        bookstoreAddress: bookstoreAddress.trim() || null,
        bookstorePhone: bookstorePhone.trim() || null,
      })
      refresh()
      router.back()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading && !club) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.amber} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Editar club</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.bg} />
          ) : (
            <Text style={styles.saveBtnText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error && <Text style={styles.errorText}>{error}</Text>}

          <Text style={styles.sectionHeader}>Datos del club</Text>

          <Text style={styles.label}>Nombre *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholderTextColor={colors.textMuted}
            maxLength={80}
          />

          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="De qué trata el club..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={3}
            maxLength={300}
          />

          <Text style={styles.label}>Ciudad</Text>
          <TextInput
            style={styles.input}
            value={city}
            onChangeText={setCity}
            placeholder="Madrid, Barcelona..."
            placeholderTextColor={colors.textMuted}
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

          <Text style={styles.sectionHeader}>Fechas</Text>

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
            A partir de esta fecha el club se cerrará automáticamente.
          </Text>
          <DateInput
            value={closeDate}
            onChange={setCloseDate}
            mode="datetime"
            placeholder="Sin fecha de cierre"
          />

          <Text style={styles.sectionHeader}>Librería asociada</Text>

          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={bookstoreName}
            onChangeText={setBookstoreName}
            placeholder="Librería..."
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Web</Text>
          <TextInput
            style={styles.input}
            value={bookstoreUrl}
            onChangeText={setBookstoreUrl}
            placeholder="https://..."
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={styles.input}
            value={bookstoreAddress}
            onChangeText={setBookstoreAddress}
            placeholder="Calle..."
            placeholderTextColor={colors.textMuted}
          />

          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={styles.input}
            value={bookstorePhone}
            onChangeText={setBookstorePhone}
            placeholder="600 000 000"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  backBtn: { padding: 4 },
  backBtnText: { color: colors.textSecondary, fontSize: 18 },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  container: { backgroundColor: colors.bg, flex: 1 },
  content: { gap: 4, padding: 20, paddingBottom: 60 },
  dateButton: {
    alignItems: 'center',
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  datePlaceholder: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 13 },
  dateValue: { color: colors.textPrimary, fontFamily: 'SpaceMono', fontSize: 13 },
  dateIcon: { fontSize: 14 },
  errorText: {
    backgroundColor: colors.error + '20',
    borderRadius: 8,
    color: colors.error,
    fontFamily: 'SpaceMono',
    fontSize: 12,
    marginBottom: 8,
    padding: 10,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: 'Georgia',
    fontSize: 15,
    marginTop: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  label: { color: colors.textSecondary, fontFamily: 'SpaceMono', fontSize: 11, marginTop: 14 },
  pickerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerClear: { color: colors.error, fontFamily: 'SpaceMono', fontSize: 13 },
  pickerContainer: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 6,
    overflow: 'hidden',
  },
  pickerDone: { color: colors.amber, fontFamily: 'SpaceMono', fontSize: 13 },
  saveBtn: {
    backgroundColor: colors.amber,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: colors.bg, fontFamily: 'SpaceMono', fontSize: 12 },
  sectionHeader: {
    color: colors.textSecondary,
    fontFamily: 'SpaceMono',
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 24,
    textTransform: 'uppercase',
  },
  sectionHint: {
    color: colors.textMuted,
    fontFamily: 'SpaceMono',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },
  switchHint: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10, marginTop: 2 },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  title: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 20 },
})
