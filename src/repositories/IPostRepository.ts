import type { Post, PostWithDetails } from '../domain'

export interface IPostRepository {
  getByClub(clubId: string, options?: { chapterRef?: number; limit?: number }): Promise<PostWithDetails[]>
  create(data: Pick<Post, 'clubId' | 'readingSessionId' | 'authorId' | 'content' | 'chapterRef' | 'pageRef' | 'hasSpoiler'>): Promise<Post>
  delete(id: string): Promise<void>
}
