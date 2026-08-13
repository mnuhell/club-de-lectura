import { AuthProvider, useAuth } from '@/src/ui/hooks/useAuth'
import { usePushNotifications } from '@/src/ui/hooks/usePushNotifications'
import { colors } from '@/src/ui/theme'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { useFonts } from 'expo-font'
import { Stack, router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'

import { Inter_400Regular as Inter_400 } from '@expo-google-fonts/inter/400Regular'
import { Inter_500Medium as Inter_500 } from '@expo-google-fonts/inter/500Medium'
import { Inter_600SemiBold as Inter_600 } from '@expo-google-fonts/inter/600SemiBold'
import { Inter_700Bold as Inter_700 } from '@expo-google-fonts/inter/700Bold'
import { PlayfairDisplay_700Bold as Playfair_700 } from '@expo-google-fonts/playfair-display/700Bold'

SplashScreen.preventAutoHideAsync()

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(auth)',
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400,
    'Inter-Medium': Inter_500,
    'Inter-SemiBold': Inter_600,
    'Inter-Bold': Inter_700,
    'Playfair-Bold': Playfair_700,
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
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  )
}

function RootNavigator() {
  const { session, loading, passwordRecovery } = useAuth()
  usePushNotifications(session?.user.id ?? '')

  useEffect(() => {
    if (loading) return
    if (passwordRecovery) {
      router.replace('/(auth)/reset-password')
    } else if (session) {
      router.replace('/(tabs)/feed')
    } else {
      router.replace('/(auth)/welcome')
    }
  }, [session, loading, passwordRecovery])

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="club" />
    </Stack>
  )
}
