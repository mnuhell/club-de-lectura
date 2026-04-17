import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '@/src/ui/theme'
import { useClubs } from '@/src/ui/hooks/useClubs'
import { useAuth } from '@/src/ui/hooks/useAuth'

export default function CreateClubScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { create } = useClubs(user?.id ?? '')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setError(null)
    setLoading(true)
    try {
      await create({ name, description: description.trim() || null, isPrivate })
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
        <Text style={styles.label}>Nombre del club *</Text>
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
  content: { gap: 8, padding: 24 },
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
    marginTop: 16,
  },
  switchHint: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 10, marginTop: 2 },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 4,
  },
})
