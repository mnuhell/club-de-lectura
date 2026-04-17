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
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: 'Georgia', fontSize: 24, color: colors.textPrimary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontFamily: 'Georgia', fontSize: 16, color: colors.textSecondary },
  emptyHint: { fontFamily: 'SpaceMono', fontSize: 12, color: colors.textMuted },
})
