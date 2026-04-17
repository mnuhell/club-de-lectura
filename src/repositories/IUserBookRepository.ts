import type { UserBook, UserBookWithDetails, BookStatus } from '../domain'

export interface IUserBookRepository {
  getByUser(userId: string, status?: BookStatus): Promise<UserBookWithDetails[]>
  upsert(
    data: Pick<UserBook, 'userId' | 'bookId' | 'status' | 'rating' | 'startedAt' | 'finishedAt'>,
  ): Promise<UserBookWithDetails>
  remove(userId: string, bookId: string): Promise<void>
}
