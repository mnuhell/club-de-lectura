import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '@/src/ui/theme'
import { useAuth } from '@/src/ui/hooks/useAuth'

export default function ProfileScreen() {
  const { signOut } = useAuth()

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
      </View>
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Tu perfil aparecerá aquí</Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Cerrar sesión</Text>
        </TouchableOpacity>
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
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontFamily: 'Georgia', fontSize: 16, color: colors.textSecondary },
  footer: { padding: 20 },
  signOutButton: {
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  signOutText: { fontFamily: 'SpaceMono', fontSize: 13, color: colors.textMuted },
})
