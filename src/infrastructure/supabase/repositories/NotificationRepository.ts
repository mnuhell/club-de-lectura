import { supabase } from '../client'
import type { INotificationRepository } from '../../../repositories'
import type { NotificationWithDetails } from '../../../domain'

export const NotificationRepository: INotificationRepository = {
  async getForUser(userId, limit = 30) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:profiles!actor_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error('No se pudieron cargar las notificaciones')

    return data.map(
      (row): NotificationWithDetails => ({
        id: row.id,
        userId: row.user_id,
        actorId: row.actor_id,
        postId: row.post_id,
        type: row.type as 'reaction',
        emoji: row.emoji,
        read: row.read,
        createdAt: row.created_at,
        actor: {
          id: row.actor.id,
          username: row.actor.username,
          displayName: row.actor.display_name,
          avatarUrl: row.actor.avatar_url,
          bio: row.actor.bio,
          createdAt: row.actor.created_at,
          updatedAt: row.actor.updated_at,
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
