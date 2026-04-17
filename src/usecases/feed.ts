import type { IClubRepository } from '../repositories'
import type { IPostRepository } from '../repositories/IPostRepository'
import type { IReadingSessionRepository } from '../repositories/IReadingSessionRepository'
import type { FeedItem } from '../domain'

export async function getFeed(
  clubRepo: IClubRepository,
  postRepo: IPostRepository,
  sessionRepo: IReadingSessionRepository,
  userId: string,
  limit = 30,
): Promise<FeedItem[]> {
  const clubs = await clubRepo.getMyClubs(userId)
  if (clubs.length === 0) return []

  const results = await Promise.all(
    clubs.map(async club => {
      const [posts, session] = await Promise.all([
        postRepo.getByClub(club.id, { limit: 10 }),
        sessionRepo.getActiveByClub(club.id),
      ])

      const postItems: FeedItem[] = posts.map(post => ({
        type: 'post' as const,
        id: post.id,
        clubId: club.id,
        clubName: club.name,
        post,
        timestamp: post.createdAt,
      }))

      const progressItems: FeedItem[] = session
        ? [
            {
              type: 'progress' as const,
              id: session.id,
              clubId: club.id,
              clubName: club.name,
              bookId: session.bookId,
              chapter: session.currentChapter,
              page: session.currentPage,
              timestamp: session.startedAt,
            },
          ]
        : []

      return [...postItems, ...progressItems]
    }),
  )

  return results
    .flat()
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, limit)
}
