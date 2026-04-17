import { useState } from 'react';
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
} from 'react-native';
import { router } from 'expo-router';
import { signInWithEmail } from '@/src/infrastructure/supabase/auth';
import { colors, fontSize, fontWeight, spacing, radius } from '@/src/ui/theme';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    if (!email || !password) {
      setError('Completa todos los campos para continuar.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signInWithEmail(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(friendlyError(e.message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Cabecera */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.ornament}>📖</Text>
          <Text style={styles.title}>Bienvenido de vuelta,{'\n'}lector</Text>
          <Text style={styles.subtitle}>Retoma donde lo dejaste</Text>
        </View>

        {/* Formulario */}
        <View style={styles.form}>
          <Field
            label="Correo electrónico"
            value={email}
            onChangeText={setEmail}
            placeholder="tu@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
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
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.btnPrimaryText}>Continuar leyendo</Text>
            )}
          </Pressable>
        </View>

        {/* Pie */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Primera vez aquí? </Text>
          <Pressable onPress={() => router.replace('/(auth)/sign-up')}>
            <Text style={styles.footerLink}>Únete al club</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={fieldStyles.wrapper}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[fieldStyles.input, focused && fieldStyles.inputFocused]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function friendlyError(msg: string): string {
  if (msg.includes('Invalid login')) return 'Correo o contraseña incorrectos.';
  if (msg.includes('Email not confirmed')) return 'Confirma tu correo antes de entrar.';
  if (msg.includes('network')) return 'Sin conexión. Revisa tu red.';
  return 'Algo salió mal. Inténtalo de nuevo.';
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
  footer: { flexDirection: 'row', justifyContent: 'center' },
  footerLink: { color: colors.amber, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  footerText: { color: colors.textMuted, fontSize: fontSize.sm },
  form: { gap: spacing[4] },
  header: { gap: spacing[2] },
  ornament: { fontSize: fontSize.xl, marginBottom: spacing[2] },
  pressed: { opacity: 0.75 },
  subtitle: { color: colors.textMuted, fontSize: fontSize.base },
  title: {
    color: colors.textPrimary,
    fontFamily: 'Georgia',
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    lineHeight: 36,
  },
});

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
    fontFamily: 'SpaceMono',
    fontSize: fontSize.sm,
    letterSpacing: 0.5,
  },
  wrapper: { gap: spacing[2] },
});
