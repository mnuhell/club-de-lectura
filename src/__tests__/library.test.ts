// @jest-environment node
import { getLibrary, setBookStatus, removeFromLibrary } from '../usecases/library'
import { createUseLibraryActions } from '../ui/hooks/useLibrary'
import type { IUserBookRepository } from '../repositories'
import type { UserBookWithDetails } from '../domain'

jest.mock('../infrastructure/supabase/repositories', () => ({}))

const makeBook = (id: string) => ({
  id,
  title: `Book ${id}`,
  author: 'Author',
  isbn: null,
  coverUrl: null,
  description: null,
  pageCount: null,
  publishedYear: null,
  externalId: null,
  externalSource: null,
  createdAt: '2026-01-01T00:00:00Z',
})

const makeUserBook = (bookId: string, status: UserBookWithDetails['status'] = 'want_to_read'): UserBookWithDetails => ({
  userId: 'user-1',
  bookId,
  status,
  rating: null,
  startedAt: null,
  finishedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  book: makeBook(bookId),
})

const makeRepo = (overrides: Partial<IUserBookRepository> = {}): IUserBookRepository => ({
  getByUser: jest.fn().mockResolvedValue([]),
  upsert: jest.fn().mockResolvedValue(makeUserBook('book-1')),
  remove: jest.fn().mockResolvedValue(undefined),
  ...overrides,
})

// --- getLibrary ---

test('getLibrary returns all user books', async () => {
  const books = [makeUserBook('book-1'), makeUserBook('book-2')]
  const repo = makeRepo({ getByUser: jest.fn().mockResolvedValue(books) })

  const result = await getLibrary(repo, 'user-1')

  expect(result).toEqual(books)
  expect(repo.getByUser).toHaveBeenCalledWith('user-1', undefined)
})

test('getLibrary filters by status when provided', async () => {
  const books = [makeUserBook('book-1', 'reading')]
  const repo = makeRepo({ getByUser: jest.fn().mockResolvedValue(books) })

  const result = await getLibrary(repo, 'user-1', 'reading')

  expect(result).toEqual(books)
  expect(repo.getByUser).toHaveBeenCalledWith('user-1', 'reading')
})

test('getLibrary returns empty array when no books', async () => {
  const repo = makeRepo({ getByUser: jest.fn().mockResolvedValue([]) })

  const result = await getLibrary(repo, 'user-1')

  expect(result).toEqual([])
})

// --- setBookStatus ---

test('setBookStatus upserts with given status', async () => {
  const repo = makeRepo()

  await setBookStatus(repo, 'user-1', 'book-1', 'reading')

  expect(repo.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ userId: 'user-1', bookId: 'book-1', status: 'reading' }),
  )
})

test('setBookStatus sets startedAt when status is reading', async () => {
  const repo = makeRepo()

  await setBookStatus(repo, 'user-1', 'book-1', 'reading')

  expect(repo.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ startedAt: expect.any(String) }),
  )
})

test('setBookStatus sets finishedAt when status is read', async () => {
  const repo = makeRepo()

  await setBookStatus(repo, 'user-1', 'book-1', 'read')

  expect(repo.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ finishedAt: expect.any(String) }),
  )
})

test('setBookStatus does not set startedAt for want_to_read', async () => {
  const repo = makeRepo()

  await setBookStatus(repo, 'user-1', 'book-1', 'want_to_read')

  expect(repo.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ startedAt: null, finishedAt: null }),
  )
})

// --- removeFromLibrary ---

test('removeFromLibrary calls repo.remove', async () => {
  const repo = makeRepo()

  await removeFromLibrary(repo, 'user-1', 'book-1')

  expect(repo.remove).toHaveBeenCalledWith('user-1', 'book-1')
})

// --- createUseLibraryActions ---

test('createUseLibraryActions.fetchLibrary delegates to getLibrary', async () => {
  const books = [makeUserBook('book-1')]
  const repo = makeRepo({ getByUser: jest.fn().mockResolvedValue(books) })
  const actions = createUseLibraryActions(repo)

  const result = await actions.fetchLibrary('user-1')

  expect(result).toEqual(books)
})

test('createUseLibraryActions.setStatus delegates to setBookStatus', async () => {
  const repo = makeRepo()
  const actions = createUseLibraryActions(repo)

  await actions.setStatus('user-1', 'book-1', 'read')

  expect(repo.upsert).toHaveBeenCalledWith(
    expect.objectContaining({ status: 'read', finishedAt: expect.any(String) }),
  )
})

test('createUseLibraryActions.remove delegates to removeFromLibrary', async () => {
  const repo = makeRepo()
  const actions = createUseLibraryActions(repo)

  await actions.remove('user-1', 'book-1')

  expect(repo.remove).toHaveBeenCalledWith('user-1', 'book-1')
})
