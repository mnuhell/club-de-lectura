import type { Reaction, ReactionSummary } from '../domain'

export interface IReactionRepository {
  getByPost(postId: string, userId: string): Promise<ReactionSummary[]>
  toggle(data: Pick<Reaction, 'postId' | 'userId' | 'emoji'>): Promise<void>
}
