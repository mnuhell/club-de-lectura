import type { PostWithDetails } from './Post'

export type PostFeedItem = {
  type: 'post'
  id: string
  clubId: string
  clubName: string
  post: PostWithDetails
  timestamp: string
}

export type ProgressFeedItem = {
  type: 'progress'
  id: string
  clubId: string
  clubName: string
  bookId: string
  chapter: number | null
  page: number | null
  timestamp: string
}

export type FeedItem = PostFeedItem | ProgressFeedItem
