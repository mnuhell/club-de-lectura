// Paleta oscura inspirada en librerías antiguas, cuero y páginas envejecidas
export const colors = {
  // Fondos
  bg: '#0D0A06', // negro con calor, como cuero muy oscuro
  surface: '#161009', // superficie principal
  surfaceUp: '#221810', // tarjetas, modales
  surfaceHigh: '#2E2016', // elementos elevados

  // Bordes
  border: '#3A2A1A',
  borderLight: '#4D3A26',

  // Acento — ámbar dorado, como las letras de un lomo antiguo
  amber: '#C8853A',
  amberLight: '#E8A95A',
  amberFaint: '#C8853A26', // para fondos tenues

  // Texto — tono crema de página envejecida
  textPrimary: '#F2E8D5',
  textSecondary: '#A89070',
  textMuted: '#6B5540',
  textInverse: '#0D0A06',

  // Semánticos
  success: '#5C9B6E',
  error: '#C0614A',
  errorFaint: '#C0614A20',

  // Transparencias
  white: '#FFFFFF',
  transparent: 'transparent',
  overlay: 'rgba(13, 10, 6, 0.85)',
  scrim: 'rgba(0, 0, 0, 0.6)',
  scannerBg: 'rgba(0,0,0,0.5)',
} as const

export type Color = keyof typeof colors
