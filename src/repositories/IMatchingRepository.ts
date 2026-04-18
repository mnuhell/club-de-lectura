import type { ReaderProfile, ReaderMatch } from '@/src/domain/ReaderProfile'

export interface IMatchingRepository {
  getDiscoverableReaders(userId: string, city?: string): Promise<ReaderProfile[]>
  swipeReader(swiperId: string, swipedId: string, action: 'like' | 'pass'): Promise<string | null>
  getMatches(userId: string): Promise<ReaderMatch[]>
  getMyGenres(userId: string): Promise<string[]>
  setMyGenres(userId: string, genres: string[]): Promise<void>
  updateReaderProfile(
    userId: string,
    data: { city?: string; readerBio?: string; matchingEnabled?: boolean }
  ): Promise<void>
}
