export type Reaction = {
  id: string
  postId: string
  userId: string
  emoji: string
  createdAt: string
}

export type ReactionSummary = {
  emoji: string
  count: number
  reactedByMe: boolean
}
