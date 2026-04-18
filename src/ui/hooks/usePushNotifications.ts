import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import Constants from 'expo-constants'
import { useEffect } from 'react'
import { Platform } from 'react-native'
import { supabase } from '@/src/infrastructure/supabase/client'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) return null

  const { status: existing } = await Notifications.getPermissionsAsync()
  const finalStatus =
    existing === 'granted' ? existing : (await Notifications.requestPermissionsAsync()).status

  if (finalStatus !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    })
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  if (!projectId) {
    console.warn('[Push] No projectId found — run: npx eas init')
    return null
  }
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
  return token
}

export function usePushNotifications(userId: string) {
  useEffect(() => {
    if (!userId) return

    registerForPushNotifications().then(async token => {
      if (!token) {
        console.log('[Push] No token — simulator or permission denied')
        return
      }
      console.log('[Push] Token obtained:', token)
      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', userId)
      if (error) console.error('[Push] Failed to save token:', error.message, error.code)
      else console.log('[Push] Token saved successfully')
    })

    // Navigate to chat when user taps a notification
    const sub = Notifications.addNotificationResponseReceivedListener(response => {
      const { matchId } = response.notification.request.content.data as {
        matchId?: string
      }
      if (matchId) router.push(`/discover/chat/${matchId}`)
    })

    return () => sub.remove()
  }, [userId])
}
