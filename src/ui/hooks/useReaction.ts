import { useCallback, useState } from 'react'
import type { ReactionSummary } from '../../domain'
import { ReactionRepository } from '../../infrastructure/supabase/repositories'
import { computeReactionToggle } from '../../usecases/reactions'

export function useReaction(postId: string, userId: string, initialReactions: ReactionSummary[]) {
  const [reactions, setReactions] = useState<ReactionSummary[]>(initialReactions)

  const toggle = useCallback(
    async (emoji: string) => {
      const snapshot = reactions
      setReactions(prev => computeReactionToggle(prev, emoji))
      try {
        await ReactionRepository.toggle({ postId, userId, emoji })
      } catch {
        setReactions(snapshot)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [postId, userId, reactions],
  )

  return { reactions, toggle }
}
