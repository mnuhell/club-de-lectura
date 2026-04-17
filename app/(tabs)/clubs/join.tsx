import { useState } from 'react'
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { colors } from '@/src/ui/theme'
import { useClubs } from '@/src/ui/hooks/useClubs'
import { useAuth } from '@/src/ui/hooks/useAuth'

export default function JoinClubScreen() {
  const router = useRouter()
  const { user } = useAuth()
  const { join } = useClubs(user?.id ?? '')

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    setError(null)
    setLoading(true)
    try {
      await join(code.trim().toUpperCase())
      router.back()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo unir al club')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Introduce el código de invitación que te compartió el organizador del club.
        </Text>

        <Text style={styles.label}>Código de invitación</Text>
        <TextInput
          style={styles.input}
          value={code}
          onChangeText={t => setCode(t.toUpperCase())}
          placeholder="ABC123"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={10}
          autoFocus
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, (!code.trim() || loading) && styles.buttonDisabled]}
          onPress={handleJoin}
          disabled={!code.trim() || loading}
        >
          {loading
            ? <ActivityIndicator color={colors.textInverse} />
            : <Text style={styles.buttonText}>Unirse al club</Text>
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, padding: 24, gap: 8 },
  subtitle: { fontFamily: 'Georgia', fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginBottom: 8 },
  label: { fontFamily: 'SpaceMono', fontSize: 11, color: colors.textMuted, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: colors.surfaceUp,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontFamily: 'SpaceMono',
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: 6,
    textAlign: 'center',
  },
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
