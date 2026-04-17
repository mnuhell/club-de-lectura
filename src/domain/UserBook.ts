export type BookStatus = 'want_to_read' | 'reading' | 'read'

export type UserBook = {
  userId: string
  bookId: string
  status: BookStatus
  rating: number | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}
