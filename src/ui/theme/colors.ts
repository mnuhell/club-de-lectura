// Paleta clara inspirada en páginas de libro, papel crema y librerías luminosas
export const colors = {
  // Fondos
  bg: '#F9F5EE', // crema cálida, como papel de libro nuevo
  surface: '#FFFFFF', // superficie blanca
  surfaceUp: '#FFFFFF', // tarjetas, modales
  surfaceHigh: '#EDE8DF', // elementos elevados, hover

  // Bordes
  border: '#E0D8CE',
  borderLight: '#EDE8DF',

  // Acento — ámbar dorado, como las letras de un lomo antiguo
  amber: '#C8853A',
  amberLight: '#E8A95A',
  amberFaint: '#C8853A18', // para fondos tenues

  // Texto — tinta sobre papel
  textPrimary: '#1A1208', // casi negro con calor
  textSecondary: '#5C4A35', // marrón medio
  textMuted: '#9E8472', // marrón claro
  textInverse: '#F9F5EE', // crema sobre fondo oscuro

  // Semánticos
  success: '#4A8A5C',
  error: '#C0614A',
  errorFaint: '#C0614A15',

  // Transparencias
  white: '#FFFFFF',
  transparent: 'transparent',
  overlay: 'rgba(26, 18, 8, 0.75)',
  scrim: 'rgba(0, 0, 0, 0.45)',
  scannerBg: 'rgba(0,0,0,0.5)',
} as const

export type Color = keyof typeof colors
