import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.buttonText}>Unirse al club</Text>
          )}
        </TouchableOpacity>
      </View>
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
    fontFamily: 'Inter-Regular',
    fontSize: 15,
    fontWeight: '600',
  },
  container: { backgroundColor: colors.bg, flex: 1 },
  content: { flex: 1, gap: 8, padding: 24 },
  error: { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 8 },
  input: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: 22,
    letterSpacing: 6,
    paddingHorizontal: 14,
    paddingVertical: 14,
    textAlign: 'center',
  },
  label: {
    color: colors.textMuted,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    marginBottom: 6,
    marginTop: 16,
  },
  subtitle: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
})
