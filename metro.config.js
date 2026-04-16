const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)

// Tamagui necesita que Metro resuelva archivos .mjs correctamente
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs']

module.exports = config
