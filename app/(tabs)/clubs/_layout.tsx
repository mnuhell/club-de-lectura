import { Stack } from 'expo-router'
import { colors } from '@/src/ui/theme'

export default function ClubsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
      <Stack.Screen
        name="create"
        options={{
          headerShown: true,
          title: 'Nuevo club',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.amber,
          headerTitleStyle: { fontFamily: 'Inter-Regular', color: colors.textPrimary },
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="join"
        options={{
          headerShown: true,
          title: 'Unirse a un club',
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.amber,
          headerTitleStyle: { fontFamily: 'Inter-Regular', color: colors.textPrimary },
          presentation: 'modal',
        }}
      />
    </Stack>
  )
}
