// @jest-environment node
import { searchExternalBooks, saveBookToLibrary } from '../usecases/discovery'
import { createUseBookSearchActions } from '../ui/hooks/useBookSearch'
import type { IBookSearchService } from '../infrastructure/api/IBookSearchService'
import type { IBookRepository } from '../repositories'
import type { IUserBookRepository } from '../repositories'
import type { Book, UserBookWithDetails } from '../domain'

jest.mock('../infrastructure/supabase/repositories', () => ({}))
jest.mock('../infrastructure/api/GoogleBooksService', () => ({}))

const makeBook = (id = 'book-1'): Book => ({
  id,
  title: 'Cien años de soledad',
  author: 'Gabriel García Márquez',
  isbn: '978-0060883287',
  coverUrl: 'https://covers.openlibrary.org/b/id/123-M.jpg',
  description: null,
  pageCount: 432,
  publishedYear: 1967,
  externalId: 'OL123W',
  externalSource: 'openlibrary',
  createdAt: '2026-01-01T00:00:00Z',
})

const makeUserBook = (bookId = 'book-1'): UserBookWithDetails => ({
  userId: 'user-1',
  bookId,
  status: 'want_to_read',
  rating: null,
  startedAt: null,
  finishedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  book: makeBook(bookId),
})

const makeSearchService = (books: Book[] = []): IBookSearchService => ({
  search: jest.fn().mockResolvedValue(books),
})

const makeBookRepo = (book = makeBook()): IBookRepository => ({
  getById: jest.fn().mockResolvedValue(book),
  search: jest.fn().mockResolvedValue([]),
  upsert: jest.fn().mockResolvedValue(book),
})

const makeUserBookRepo = (): IUserBookRepository => ({
  getByUser: jest.fn().mockResolvedValue([]),
  upsert: jest.fn().mockResolvedValue(makeUserBook()),
  remove: jest.fn().mockResolvedValue(undefined),
})

// --- searchExternalBooks ---

test('searchExternalBooks returns results from service', async () => {
  const books = [makeBook('b1'), makeBook('b2')]
  const service = makeSearchService(books)

  const result = await searchExternalBooks(service, 'garcia marquez')

  expect(result).toEqual(books)
  expect(service.search).toHaveBeenCalledWith('garcia marquez')
})

test('searchExternalBooks returns empty array for blank query', async () => {
  const service = makeSearchService([makeBook()])

  const result = await searchExternalBooks(service, '   ')

  expect(result).toEqual([])
  expect(service.search).not.toHaveBeenCalled()
})

test('searchExternalBooks returns empty array for empty query', async () => {
  const service = makeSearchService()

  const result = await searchExternalBooks(service, '')

  expect(result).toEqual([])
})

// --- saveBookToLibrary ---

test('saveBookToLibrary upserts book into books table', async () => {
  const book = makeBook()
  const bookRepo = makeBookRepo(book)
  const userBookRepo = makeUserBookRepo()

  await saveBookToLibrary(bookRepo, userBookRepo, 'user-1', book, 'want_to_read')

  expect(bookRepo.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ title: book.title, externalId: book.externalId }),
  )
})

test('saveBookToLibrary adds book to user library with given status', async () => {
  const book = makeBook()
  const bookRepo = makeBookRepo(book)
  const userBookRepo = makeUserBookRepo()

  await saveBookToLibrary(bookRepo, userBookRepo, 'user-1', book, 'reading')

  expect(userBookRepo.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ userId: 'user-1', status: 'reading' }),
  )
})

test('saveBookToLibrary returns UserBookWithDetails', async () => {
  const book = makeBook()
  const userBook = makeUserBook()
  const bookRepo = makeBookRepo(book)
  const userBookRepo = makeUserBookRepo()
  ;(userBookRepo.upsert as jest.Mock).mockResolvedValue(userBook)

  const result = await saveBookToLibrary(bookRepo, userBookRepo, 'user-1', book, 'want_to_read')

  expect(result).toEqual(userBook)
})

// --- createUseBookSearchActions ---

test('createUseBookSearchActions.search delegates to searchExternalBooks', async () => {
  const books = [makeBook()]
  const service = makeSearchService(books)
  const bookRepo = makeBookRepo()
  const userBookRepo = makeUserBookRepo()
  const actions = createUseBookSearchActions(service, bookRepo, userBookRepo)

  const result = await actions.search('dune')

  expect(result).toEqual(books)
})

test('searchExternalBooks prefixes isbn: when query looks like a barcode', async () => {
  const books = [makeBook()]
  const service = makeSearchService(books)

  await searchExternalBooks(service, '9780060883287')

  expect(service.search).toHaveBeenCalledWith('isbn:9780060883287')
})

test('createUseBookSearchActions.save delegates to saveBookToLibrary', async () => {
  const book = makeBook()
  const service = makeSearchService()
  const bookRepo = makeBookRepo(book)
  const userBookRepo = makeUserBookRepo()
  const actions = createUseBookSearchActions(service, bookRepo, userBookRepo)

  await actions.save('user-1', book, 'read')

  expect(bookRepo.upsert).toHaveBeenCalled()
  expect(userBookRepo.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ userId: 'user-1', status: 'read' }),
  )
})
