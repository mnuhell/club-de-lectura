import { View, Text, StyleSheet, Pressable, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { colors, fontSize, fontWeight, spacing, radius } from '@/src/ui/theme';

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
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing[3],
  },
  btnPrimary: {
    alignItems: 'center',
    backgroundColor: colors.amber,
    borderRadius: radius.md,
    paddingVertical: spacing[4],
  },
  btnPrimaryText: {
    color: colors.textInverse,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
  btnSecondary: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: spacing[4],
  },
  btnSecondaryText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
  },
  container: {
    backgroundColor: colors.bg,
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: spacing[8],
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
  },
  divider: {
    backgroundColor: colors.amber,
    height: 1,
    marginVertical: spacing[2],
    width: 40,
  },
  eyebrow: {
    color: colors.textMuted,
    fontFamily: 'SpaceMono',
    fontSize: fontSize.sm,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footerOrnament: {
    color: colors.border,
    fontSize: fontSize.lg,
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: spacing[3],
  },
  ornament: {
    alignItems: 'center',
  },
  ornamentText: {
    color: colors.amber,
    fontSize: fontSize['2xl'],
  },
  pressed: {
    opacity: 0.75,
  },
  quoteAuthor: {
    color: colors.textMuted,
    fontFamily: 'SpaceMono',
    fontSize: fontSize.sm,
  },
  quoteBlock: {
    borderLeftColor: colors.amber,
    borderLeftWidth: 2,
    gap: spacing[2],
    paddingLeft: spacing[4],
  },
  quoteText: {
    color: colors.textSecondary,
    fontFamily: 'Georgia',
    fontSize: fontSize.base,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  tagline: {
    color: colors.textSecondary,
    fontFamily: 'Georgia',
    fontSize: fontSize.md,
    lineHeight: 26,
    textAlign: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontFamily: 'Georgia',
    fontSize: fontSize['3xl'],
    fontWeight: fontWeight.bold,
    letterSpacing: 3,
  },
});
