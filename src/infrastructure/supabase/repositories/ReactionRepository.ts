import { supabase } from '../client'
import type { IReactionRepository } from '../../../repositories'
import type { ReactionSummary } from '../../../domain'

export const ReactionRepository: IReactionRepository = {
  async getByPost(postId, userId) {
    const { data, error } = await supabase
      .from('reactions')
      .select('emoji, user_id')
      .eq('post_id', postId)
    if (error) throw new Error('No se pudieron cargar las reacciones')

    const counts: Record<string, { count: number; reactedByMe: boolean }> = {}
    for (const row of data) {
      if (!counts[row.emoji]) counts[row.emoji] = { count: 0, reactedByMe: false }
      counts[row.emoji].count++
      if (row.user_id === userId) counts[row.emoji].reactedByMe = true
    }

    return Object.entries(counts).map(
      ([emoji, { count, reactedByMe }]): ReactionSummary => ({ emoji, count, reactedByMe }),
    )
  },

  async toggle({ postId, userId, emoji }) {
    const { data: existing } = await supabase
      .from('reactions')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('emoji', emoji)
      .single()

    if (existing) {
      await supabase.from('reactions').delete().eq('id', existing.id)
    } else {
      await supabase.from('reactions').insert({ post_id: postId, user_id: userId, emoji })
    }
  },
}
