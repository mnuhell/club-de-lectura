import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native'
import { router } from 'expo-router'
import { updatePassword } from '@/src/infrastructure/supabase/auth'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { colors, fontSize, fontWeight, spacing, radius } from '@/src/ui/theme'

export default function ResetPasswordScreen() {
  const { clearPasswordRecovery } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await updatePassword(password)
      clearPasswordRecovery()
      router.replace('/(tabs)/feed')
    } catch (e: unknown) {
      setError(friendlyError(e instanceof Error ? e.message : 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.ornament}>🔑</Text>
          <Text style={styles.title}>Nueva{'\n'}contraseña</Text>
          <Text style={styles.subtitle}>Elige una contraseña nueva para tu cuenta</Text>
        </View>

        <View style={styles.form}>
          <Field
            label="Nueva contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 8 caracteres"
          />
          <Field
            label="Confirmar contraseña"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repite la contraseña"
          />

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>✦ {error}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.btnPrimary,
              pressed && styles.pressed,
              loading && styles.disabled,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.btnPrimaryText}>Guardar contraseña</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, focused && fieldStyles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        autoCapitalize="none"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  )
}

function friendlyError(msg: string): string {
  if (msg.includes('same password')) return 'Usa una contraseña distinta a la actual.'
  if (msg.includes('weak password')) return 'Usa una contraseña más segura.'
  if (msg.includes('network')) return 'Sin conexión. Revisa tu red.'
  return 'Algo salió mal. Inténtalo de nuevo.'
}

const styles = StyleSheet.create({
  btnPrimary: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: radius.md,
    marginTop: spacing[2],
    paddingVertical: spacing[4],
  },
  btnPrimaryText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  container: {
    backgroundColor: colors.bg,
    flexGrow: 1,
    gap: spacing[8],
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[12],
  },
  disabled: { opacity: 0.5 },
  errorBox: {
    backgroundColor: colors.errorFaint,
    borderRadius: radius.sm,
    padding: spacing[3],
  },
  errorText: { color: colors.error, fontSize: fontSize.sm },
  flex: { backgroundColor: colors.bg, flex: 1 },
  form: { gap: spacing[4] },
  header: { gap: spacing[2] },
  ornament: { fontSize: fontSize.xl, marginBottom: spacing[2] },
  pressed: { opacity: 0.75 },
  subtitle: { color: colors.textMuted, fontSize: fontSize.base },
  title: {
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: 36,
  },
})

const fieldStyles = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceUp,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.textPrimary,
    fontSize: fontSize.base,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  inputFocused: {
    borderColor: colors.amber,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },
  wrapper: { gap: spacing[2] },
})
