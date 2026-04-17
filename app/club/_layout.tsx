import { Stack } from 'expo-router'
import { colors } from '@/src/ui/theme'

export default function ClubRootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
  )
}
