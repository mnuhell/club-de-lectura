import type { User } from './User'
import type { Reaction } from './Reaction'

export type Post = {
  id: string
  clubId: string
  readingSessionId: string | null
  authorId: string
  content: string
  chapterRef: number | null
  pageRef: number | null
  hasSpoiler: boolean
  createdAt: string
  updatedAt: string
}

export type PostWithDetails = Post & {
  author: User
  reactions: Reaction[]
}
