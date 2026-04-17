import { Stack } from 'expo-router'
import { colors } from '@/src/ui/theme'

export default function ClubLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="reading" />
    </Stack>
  )
}
