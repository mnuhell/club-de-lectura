import { useEffect } from 'react'
import { useFonts } from 'expo-font'
import { Stack, router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { TamaguiProvider } from '@tamagui/core'
import { useAuth } from '@/src/ui/hooks/useAuth'
import { colors } from '@/src/ui/theme'
import config from '@/tamagui.config'

SplashScreen.preventAutoHideAsync()

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(auth)',
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  })

  useEffect(() => {
    if (fontError) throw fontError
  }, [fontError])

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <TamaguiProvider config={config} defaultTheme="dark">
      <RootNavigator />
    </TamaguiProvider>
  )
}

function RootNavigator() {
  const { session, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (session) {
      router.replace('/(tabs)')
    } else {
      router.replace('/(auth)/welcome')
    }
  }, [session, loading])

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}
