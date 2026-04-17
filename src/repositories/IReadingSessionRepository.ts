import type { ReadingSession } from '../domain'

export interface IReadingSessionRepository {
  getActiveByClub(clubId: string): Promise<ReadingSession | null>
  create(data: Pick<ReadingSession, 'clubId' | 'bookId'>): Promise<ReadingSession>
  updateProgress(id: string, data: Pick<ReadingSession, 'currentChapter' | 'currentPage'>): Promise<ReadingSession>
  finish(id: string): Promise<ReadingSession>
}
