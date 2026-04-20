import { Stack } from 'expo-router'
import { colors } from '@/src/ui/theme'

export default function LibraryLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="search"
        options={{
          presentation: 'modal',
          headerShown: true,
          headerTitle: 'Buscar libros',
          headerStyle: { backgroundColor: colors.surfaceUp },
          headerTintColor: colors.textPrimary,
          headerTitleStyle: { fontFamily: 'Inter-Regular', fontSize: 18 },
        }}
      />
    </Stack>
  )
}
