import { createAnimations } from '@tamagui/animations-reanimated'
import { createInterFont } from '@tamagui/font-inter'
import { shorthands } from '@tamagui/shorthands'
import { createTamagui, createTokens } from '@tamagui/core'

const animations = createAnimations({
  fast: {
    type: 'spring',
    damping: 20,
    mass: 1,
    stiffness: 250,
  },
  medium: {
    type: 'spring',
    damping: 18,
    mass: 1,
    stiffness: 180,
  },
  slow: {
    type: 'spring',
    damping: 16,
    mass: 1,
    stiffness: 80,
  },
})

const interFont = createInterFont(
  {
    size: {
      1: 11,
      2: 13,
      3: 15,
      4: 17,
      5: 20,
      6: 24,
      7: 30,
      8: 38,
      true: 15,
    },
    weight: {
      1: '400',
      4: '500',
      6: '600',
      7: '700',
    },
    letterSpacing: {
      1: 0,
      2: 0.2,
    },
  },
  { sizeLineHeight: size => size + 6 },
)

const tokens = createTokens({
  color: {
    // Fondos
    bg: '#0D0A06',
    surface: '#161009',
    surfaceUp: '#221810',
    surfaceHigh: '#2E2016',
    // Bordes
    border: '#3A2A1A',
    borderLight: '#4D3A26',
    // Ámbar
    amber1: '#1C1206',
    amber2: '#2A1C08',
    amber3: '#3D2A0D',
    amber4: '#553C14',
    amber5: '#704E1C',
    amber6: '#8C6326',
    amber7: '#A87832',
    amber8: '#C8853A',
    amber9: '#D9944A',
    amber10: '#E8A95A',
    amber11: '#F2C07A',
    amber12: '#FBE0B8',
    // Texto
    textPrimary: '#F2E8D5',
    textSecondary: '#A89070',
    textMuted: '#6B5540',
    textInverse: '#0D0A06',
    // Semánticos
    success: '#5C9B6E',
    error: '#C0614A',
    warning: '#D4943A',
    // Requeridos por Tamagui internals
    white1: '#FFFFFF',
    white2: '#F8F5F0',
    white3: '#F2E8D5',
    white4: '#E8D9C0',
    white5: '#D4C4A0',
    white6: '#BBA880',
    white7: '#A89070',
    white8: '#8A7060',
    white9: '#6B5540',
    white10: '#4D3A26',
    white11: '#3A2A1A',
    white12: '#2A1C0E',
    black1: '#0D0A06',
    black2: '#161009',
    black3: '#221810',
    black4: '#2E2016',
    black5: '#3A2A1A',
    black6: '#4D3A26',
    black7: '#6B5540',
    black8: '#8A7060',
    black9: '#A89070',
    black10: '#BBA880',
    black11: '#D4C4A0',
    black12: '#F2E8D5',
  },
  space: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    20: 80,
    true: 16,
  },
  size: {
    0: 0,
    0.5: 2,
    1: 4,
    1.5: 6,
    2: 8,
    2.5: 10,
    3: 12,
    3.5: 14,
    4: 16,
    5: 20,
    6: 24,
    7: 28,
    8: 32,
    9: 36,
    10: 40,
    11: 44,
    12: 48,
    14: 56,
    16: 64,
    true: 40,
  },
  radius: {
    0: 0,
    1: 4,
    2: 6,
    3: 8,
    4: 10,
    5: 16,
    6: 24,
    7: 32,
    8: 40,
    9: 48,
    10: 999,
    true: 10,
  },
  zIndex: {
    0: 0,
    1: 100,
    2: 200,
    3: 300,
    4: 400,
    5: 500,
  },
})

// Tema oscuro: objetos planos con los tokens de color
const dark = {
  // Escala de colores de UI (Tamagui usa color1–color12)
  color1: '#0D0A06',
  color2: '#161009',
  color3: '#221810',
  color4: '#2E2016',
  color5: '#3A2A1A',
  color6: '#4D3A26',
  color7: '#6B5540',
  color8: '#8A7060',
  color9: '#A89070',
  color10: '#BBA880',
  color11: '#D4C4A0',
  color12: '#F2E8D5',

  // Semánticos de UI
  background: '#0D0A06',
  backgroundHover: '#161009',
  backgroundPress: '#221810',
  backgroundFocus: '#161009',
  backgroundStrong: '#2E2016',
  backgroundTransparent: 'rgba(13,10,6,0)',

  color: '#F2E8D5',
  colorHover: '#A89070',
  colorPress: '#F2E8D5',
  colorFocus: '#F2E8D5',
  colorTransparent: 'rgba(242,232,213,0)',

  borderColor: '#3A2A1A',
  borderColorHover: '#4D3A26',
  borderColorFocus: '#C8853A',
  borderColorPress: '#C8853A',

  placeholderColor: '#6B5540',
  outlineColor: '#C8853A',

  shadowColor: 'rgba(0,0,0,0.6)',
  shadowColorHover: 'rgba(0,0,0,0.8)',
}

// Sub-tema ámbar (botones primarios, acentos)
const dark_amber = {
  ...dark,
  background: '#C8853A',
  backgroundHover: '#D9944A',
  backgroundPress: '#A87832',
  color: '#0D0A06',
  colorHover: '#0D0A06',
  borderColor: '#A87832',
}

const config = createTamagui({
  animations,
  defaultTheme: 'dark',
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  shorthands,
  fonts: {
    heading: interFont,
    body: interFont,
    mono: interFont,
  },
  themes: {
    dark,
    dark_amber,
    light: dark, // la app es siempre dark
  },
  tokens,
  media: {
    xs: { maxWidth: 380 },
    sm: { maxWidth: 660 },
    md: { maxWidth: 768 },
    lg: { minWidth: 769 },
    xl: { minWidth: 1280 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  },
})

export type AppConfig = typeof config
declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default config
