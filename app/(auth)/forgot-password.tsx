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
import { resetPasswordForEmail } from '@/src/infrastructure/supabase/auth'
import { colors, fontSize, fontWeight, spacing, radius } from '@/src/ui/theme'

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit() {
    if (!email) {
      setError('Escribe tu correo electrónico.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await resetPasswordForEmail(email.trim())
      setDone(true)
    } catch (e: unknown) {
      setError(friendlyError(e instanceof Error ? e.message : 'Error desconocido'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <View style={styles.confirmContainer}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        <Text style={styles.confirmOrnament}>✉︎</Text>
        <Text style={styles.confirmTitle}>Revisa tu correo</Text>
        <Text style={styles.confirmBody}>
          Te enviamos un enlace para restablecer tu contraseña.{'\n'}
          Ábrelo desde este mismo dispositivo.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
          onPress={() => router.replace('/(auth)/sign-in')}
        >
          <Text style={styles.btnPrimaryText}>Ir a iniciar sesión</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.ornament}>🔑</Text>
          <Text style={styles.title}>¿Olvidaste tu{'\n'}contraseña?</Text>
          <Text style={styles.subtitle}>Te enviamos un enlace para restablecerla</Text>
        </View>

        <View style={styles.form}>
          <Field
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
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
              <Text style={styles.btnPrimaryText}>Enviar enlace</Text>
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
  keyboardType,
  autoCapitalize,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: 'email-address'
  autoCapitalize?: 'none'
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
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  )
}

function friendlyError(msg: string): string {
  if (msg.includes('rate limit')) return 'Espera unos minutos antes de volver a intentarlo.'
  if (msg.includes('invalid email')) return 'El correo no tiene un formato válido.'
  if (msg.includes('network')) return 'Sin conexión. Revisa tu red.'
  return 'Algo salió mal. Inténtalo de nuevo.'
}

const styles = StyleSheet.create({
  backBtn: { alignSelf: 'flex-start' },
  backText: { color: colors.textMuted, fontSize: fontSize.sm },
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
  confirmBody: {
    color: colors.textSecondary,
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.base,
    lineHeight: 22,
    textAlign: 'center',
  },
  confirmContainer: {
    alignItems: 'center',
    backgroundColor: colors.bg,
    flex: 1,
    gap: spacing[4],
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  confirmOrnament: { fontSize: 48, marginBottom: spacing[2] },
  confirmTitle: {
    color: colors.textPrimary,
    fontFamily: 'Inter-Regular',
    fontSize: fontSize.xl,
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
