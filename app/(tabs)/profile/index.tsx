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
  container: { backgroundColor: colors.bg, flex: 1 },
  empty: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  emptyText: { color: colors.textSecondary, fontFamily: 'Georgia', fontSize: 16 },
  footer: { padding: 20 },
  header: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  signOutButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 14,
  },
  signOutText: { color: colors.textMuted, fontFamily: 'SpaceMono', fontSize: 13 },
  title: { color: colors.textPrimary, fontFamily: 'Georgia', fontSize: 24 },
})
