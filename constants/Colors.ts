import { colors } from '@/src/ui/theme';

// La app es siempre dark — paleta de librería antigua
export default {
  dark: {
    text: colors.textPrimary,
    background: colors.bg,
    tint: colors.amber,
    tabIconDefault: colors.textMuted,
    tabIconSelected: colors.amber,
    surface: colors.surface,
    border: colors.border,
  },
  // Alias para compatibilidad con componentes que leen 'light'
  light: {
    text: colors.textPrimary,
    background: colors.bg,
    tint: colors.amber,
    tabIconDefault: colors.textMuted,
    tabIconSelected: colors.amber,
    surface: colors.surface,
    border: colors.border,
  },
};
