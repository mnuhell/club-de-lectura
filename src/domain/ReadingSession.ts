export type ReadingSession = {
  id: string
  clubId: string
  bookId: string
  currentChapter: number | null
  currentPage: number | null
  startedAt: string
  finishedAt: string | null
  createdAt: string
}

export type ReadingProgress = {
  chapter: number | null
  page: number | null
  totalPages: number | null
}
