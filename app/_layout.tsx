import { useAuth } from '@/src/ui/hooks/useAuth'
import { usePushNotifications } from '@/src/ui/hooks/usePushNotifications'
import { colors } from '@/src/ui/theme'
import config from '@/tamagui.config'
import FontAwesome from '@expo/vector-icons/FontAwesome'
import { TamaguiProvider } from '@tamagui/core'
import { useFonts } from 'expo-font'
import { Stack, router } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'

// Inter font paths — loaded under legacy names so no screen code needs changing
import { Inter_400Regular as Inter_400 } from '@expo-google-fonts/inter/400Regular'
import { Inter_500Medium as Inter_500 } from '@expo-google-fonts/inter/500Medium'
import { Inter_600SemiBold as Inter_600 } from '@expo-google-fonts/inter/600SemiBold'
import { Inter_700Bold as Inter_700 } from '@expo-google-fonts/inter/700Bold'

SplashScreen.preventAutoHideAsync()

export { ErrorBoundary } from 'expo-router'

export const unstable_settings = {
  initialRouteName: '(auth)',
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    // Georgia → Inter Regular (cuerpo de texto, descripciones, contenido)
    Georgia: Inter_400,
    // SpaceMono → Inter Medium (etiquetas, badges, meta — más legible que monoespaciado)
    SpaceMono: Inter_500,
    // Variantes extra disponibles para uso explícito
    'Inter-Regular': Inter_400,
    'Inter-Medium': Inter_500,
    'Inter-SemiBold': Inter_600,
    'Inter-Bold': Inter_700,
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
  usePushNotifications(session?.user.id ?? '')

  useEffect(() => {
    if (loading) return
    if (session) {
      router.replace('/(tabs)/feed')
    } else {
      router.replace('/(auth)/welcome')
    }
  }, [session, loading])

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="club" />
    </Stack>
  )
}
