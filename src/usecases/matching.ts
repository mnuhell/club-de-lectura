import type { IMatchingRepository } from '../repositories/IMatchingRepository'
import type { ReaderProfile, ReaderMatch } from '../domain/ReaderProfile'

export function createMatchingActions(repo: IMatchingRepository) {
  return {
    async getDiscoverableReaders(userId: string, city?: string): Promise<ReaderProfile[]> {
      return repo.getDiscoverableReaders(userId, city)
    },

    async like(swiperId: string, swipedId: string): Promise<string | null> {
      return repo.swipeReader(swiperId, swipedId, 'like')
    },

    async pass(swiperId: string, swipedId: string): Promise<void> {
      await repo.swipeReader(swiperId, swipedId, 'pass')
    },

    async getMatches(userId: string): Promise<ReaderMatch[]> {
      return repo.getMatches(userId)
    },

    async getMyGenres(userId: string): Promise<string[]> {
      return repo.getMyGenres(userId)
    },

    async setMyGenres(userId: string, genres: string[]): Promise<void> {
      if (genres.length < 1) throw new Error('Elige al menos un género')
      await repo.setMyGenres(userId, genres)
    },

    async updateReaderProfile(
      userId: string,
      data: { city?: string; readerBio?: string; matchingEnabled?: boolean },
    ): Promise<void> {
      await repo.updateReaderProfile(userId, data)
    },
  }
}
