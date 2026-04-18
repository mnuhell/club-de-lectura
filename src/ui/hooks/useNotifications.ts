import { useCallback, useEffect, useState } from 'react'
import type { NotificationWithDetails } from '../../domain'
import { NotificationRepository } from '../../infrastructure/supabase/repositories'
import { supabase } from '../../infrastructure/supabase/client'

interface NotificationsState {
  notifications: NotificationWithDetails[]
  unreadCount: number
  loading: boolean
  markAllRead: () => Promise<void>
  refresh: () => Promise<void>
}

export function useNotifications(userId: string): NotificationsState {
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    try {
      const data = await NotificationRepository.getForUser(userId)
      setNotifications(data)
    } catch {
      // silent — bell will just show 0
    } finally {
      setLoading(false)
    }
  }, [userId])

  const markAllRead = useCallback(async () => {
    await NotificationRepository.markAllRead(userId)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [userId])

  useEffect(() => {
    if (!userId) return
    load()

    const channel = supabase
      .channel(`notifications-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => load(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, load])

  const unreadCount = notifications.filter(n => !n.read).length

  return { notifications, unreadCount, loading, markAllRead, refresh: load }
}
