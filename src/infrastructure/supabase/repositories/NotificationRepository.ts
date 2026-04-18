import type { NotificationWithDetails } from '../../../domain'
import type { INotificationRepository } from '../../../repositories'
import { supabase } from '../client'

type NotificationRow = {
  id: string
  user_id: string
  actor_id: string
  post_id: string | null
  type: string
  emoji: string | null
  read: boolean
  created_at: string
  actor: {
    id: string
    username: string
    display_name: string | null
    avatar_url: string | null
    bio: string | null
    created_at: string
    updated_at: string
  } | null
}

export const NotificationRepository: INotificationRepository = {
  async getForUser(userId, limit = 30) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:profiles!actor_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error('No se pudieron cargar las notificaciones')

    return (data as unknown as NotificationRow[])
      .filter(row => row.actor !== null && row.post_id !== null)
      .map(
        (row): NotificationWithDetails => ({
          id: row.id,
          userId: row.user_id,
          actorId: row.actor_id,
          postId: row.post_id!,
          type: row.type as 'reaction',
          emoji: row.emoji,
          read: row.read,
          createdAt: row.created_at,
          actor: {
            id: row.actor!.id,
            username: row.actor!.username,
            displayName: row.actor!.display_name,
            avatarUrl: row.actor!.avatar_url,
            bio: row.actor!.bio,
            createdAt: row.actor!.created_at,
            updatedAt: row.actor!.updated_at,
          },
        }),
      )
  },

  async markAllRead(userId) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
  },
}
