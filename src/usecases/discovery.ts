import type { IBookSearchService } from '../infrastructure/api/IBookSearchService'
import type { IBookRepository } from '../repositories'
import type { IUserBookRepository } from '../repositories'
import type { Book, BookStatus, UserBookWithDetails } from '../domain'

const ISBN_RE = /^[\d-]{10,17}$/

export async function searchExternalBooks(
  service: IBookSearchService,
  query: string,
): Promise<Book[]> {
  const q = query.trim()
  if (!q) return []
  const normalised = ISBN_RE.test(q.replace(/\s/g, '')) ? `isbn:${q.replace(/\s/g, '')}` : q
  return service.search(normalised)
}

export async function saveBookToLibrary(
  bookRepo: IBookRepository,
  userBookRepo: IUserBookRepository,
  userId: string,
  book: Book,
  status: BookStatus,
): Promise<UserBookWithDetails> {
  const saved = await bookRepo.upsert({
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    coverUrl: book.coverUrl,
    description: book.description,
    pageCount: book.pageCount,
    publishedYear: book.publishedYear,
    externalId: book.externalId,
    externalSource: book.externalSource,
  })

  const now = new Date().toISOString()
  return userBookRepo.upsert({
    userId,
    bookId: saved.id,
    status,
    rating: null,
    startedAt: status === 'reading' ? now : null,
    finishedAt: status === 'read' ? now : null,
  })
}
