import { Stack } from 'expo-router'

export default function DiscoverLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="matches" />
      <Stack.Screen name="setup" options={{ presentation: 'modal' }} />
      <Stack.Screen name="match/[id]" />
      <Stack.Screen name="chat/[matchId]" />
    </Stack>
  )
}
