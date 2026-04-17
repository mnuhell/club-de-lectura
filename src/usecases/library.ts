import type { IUserBookRepository } from '../repositories'
import type { BookStatus, UserBookWithDetails } from '../domain'

export async function getLibrary(
  repo: IUserBookRepository,
  userId: string,
  status?: BookStatus,
): Promise<UserBookWithDetails[]> {
  return repo.getByUser(userId, status)
}

export async function setBookStatus(
  repo: IUserBookRepository,
  userId: string,
  bookId: string,
  status: BookStatus,
): Promise<UserBookWithDetails> {
  const now = new Date().toISOString()
  return repo.upsert({
    userId,
    bookId,
    status,
    rating: null,
    startedAt: status === 'reading' ? now : null,
    finishedAt: status === 'read' ? now : null,
  })
}

export async function removeFromLibrary(
  repo: IUserBookRepository,
  userId: string,
  bookId: string,
): Promise<void> {
  return repo.remove(userId, bookId)
}
