import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native'
import { router } from 'expo-router'
import { colors, fontSize, fontWeight, spacing, radius } from '@/src/ui/theme'

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />

      {/* Decoración superior */}
      <View style={styles.ornament}>
        <Text style={styles.ornamentText}>❧</Text>
      </View>

      {/* Logo / marca */}
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>— un club de lectura —</Text>
        <Text style={styles.title}>Folio</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>
          Lee con otros.{'\n'}Discute sin spoilers.{'\n'}Descubre tu próxima historia.
        </Text>
      </View>

      {/* Cita literaria */}
      <View style={styles.quoteBlock}>
        <Text style={styles.quoteText}>
          "Una habitación sin libros es como un cuerpo sin alma."
        </Text>
        <Text style={styles.quoteAuthor}>— Cicerón</Text>
      </View>

      {/* Acciones */}
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.btnPrimary, pressed && styles.pressed]}
          onPress={() => router.push('/(auth)/sign-up')}
        >
          <Text style={styles.btnPrimaryText}>Abrir el libro</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btnSecondary, pressed && styles.pressed]}
          onPress={() => router.push('/(auth)/sign-in')}
        >
          <Text style={styles.btnSecondaryText}>Ya tengo cuenta</Text>
        </Pressable>
      </View>

      {/* Decoración inferior */}
      <Text style={styles.footerOrnament}>⁂</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[8],
    justifyContent: 'space-between',
  },
  ornament: {
    alignItems: 'center',
  },
  ornamentText: {
    color: colors.amber,
    fontSize: fontSize['2xl'],
  },
  hero: {
    alignItems: 'center',
    gap: spacing[3],
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontFamily: 'SpaceMono',
  },
  title: {
    color: colors.textPrimary,
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    fontFamily: 'Georgia',
    letterSpacing: 3,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: colors.amber,
    marginVertical: spacing[2],
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'Georgia',
  },
  quoteBlock: {
    borderLeftWidth: 2,
    borderLeftColor: colors.amber,
    paddingLeft: spacing[4],
    gap: spacing[2],
  },
  quoteText: {
    color: colors.textSecondary,
    fontSize: fontSize.base,
    fontStyle: 'italic',
    fontFamily: 'Georgia',
    lineHeight: 22,
  },
  quoteAuthor: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontFamily: 'SpaceMono',
  },
  actions: {
    gap: spacing[3],
  },
  btnPrimary: {
    backgroundColor: colors.amber,
    paddingVertical: spacing[4],
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  btnSecondary: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing[4],
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnSecondaryText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  pressed: {
    opacity: 0.75,
  },
  footerOrnament: {
    color: colors.border,
    textAlign: 'center',
    fontSize: fontSize.lg,
  },
})
