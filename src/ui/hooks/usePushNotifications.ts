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

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  if (!projectId) return null
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
  return token
}

export function usePushNotifications(userId: string) {
  useEffect(() => {
    if (!userId) return

    registerForPushNotifications().then(token => {
      if (!token) return
      supabase.from('profiles').update({ push_token: token }).eq('id', userId)
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
