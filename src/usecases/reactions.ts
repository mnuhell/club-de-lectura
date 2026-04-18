import type { ReactionSummary } from '../domain'
import type { IReactionRepository } from '../repositories'

export function computeReactionToggle(
  reactions: ReactionSummary[],
  emoji: string,
): ReactionSummary[] {
  const existing = reactions.find(r => r.emoji === emoji)

  if (!existing) {
    return [...reactions, { emoji, count: 1, reactedByMe: true }]
  }

  if (existing.reactedByMe) {
    return existing.count === 1
      ? reactions.filter(r => r.emoji !== emoji)
      : reactions.map(r =>
          r.emoji === emoji ? { ...r, count: r.count - 1, reactedByMe: false } : r,
        )
  }

  return reactions.map(r =>
    r.emoji === emoji ? { ...r, count: r.count + 1, reactedByMe: true } : r,
  )
}

export function createReactionActions(repo: IReactionRepository) {
  return {
    toggle: (postId: string, userId: string, emoji: string) =>
      repo.toggle({ postId, userId, emoji }),
  }
}
