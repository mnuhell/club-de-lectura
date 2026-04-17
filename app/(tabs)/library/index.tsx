import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/src/ui/theme'

export default function LibraryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi biblioteca</Text>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Tu biblioteca está vacía</Text>
        <Text style={styles.emptyHint}>Busca libros para añadirlos a tu lista</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.bg, flex: 1 },
  empty: { alignItems: 'center', flex: 1, gap: 8, justifyContent: 'center' },
  emptyHint: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 12 },
  emptyText: { color: colors.textSecondary, fontFamily: 'Georgia', fontSize: 16 },
  header: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 24 },
})
