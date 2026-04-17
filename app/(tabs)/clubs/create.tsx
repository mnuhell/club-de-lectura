import { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Switch, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
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
          {loading
            ? <ActivityIndicator color={colors.textInverse} />
            : <Text style={styles.buttonText}>Crear club</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, gap: 8 },
  label: { fontFamily: 'SpaceMono', fontSize: 11, color: colors.textMuted, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: colors.surfaceUp,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Georgia',
    fontSize: 15,
    color: colors.textPrimary,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingVertical: 4,
  },
  switchHint: { fontFamily: 'SpaceMono', fontSize: 10, color: colors.textMuted, marginTop: 2 },
  error: { fontFamily: 'SpaceMono', fontSize: 12, color: colors.error, marginTop: 8 },
  button: {
    backgroundColor: colors.amber,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontFamily: 'SpaceMono', fontSize: 14, color: colors.textInverse, fontWeight: '600' },
})
