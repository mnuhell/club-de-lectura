/**
 * @jest-environment node
 */
jest.mock('../infrastructure/supabase/repositories', () => ({}))
jest.mock('../infrastructure/api/GoogleBooksService', () => ({}))

import { searchExternalBooks } from '../usecases/discovery'
import { createUseBookSearchActions } from '../ui/hooks/useBookSearch'
import type { IBookSearchService } from '../infrastructure/api/IBookSearchService'
import type { IBookRepository } from '../repositories'
import type { IUserBookRepository } from '../repositories'
import type { Book } from '../domain'

const makeBook = (overrides: Partial<Book> = {}): Book => ({
  id: 'book-1',
  title: 'Cien años de soledad',
  author: 'Gabriel García Márquez',
  isbn: '9780060883287',
  coverUrl: 'https://example.com/cover.jpg',
  description: null,
  pageCount: 432,
  publishedYear: 1967,
  externalId: 'GB123',
  externalSource: 'google',
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

function makeService(books: Book[] = []): IBookSearchService {
  return { search: jest.fn().mockResolvedValue(books) }
}

function makeBookRepo(): IBookRepository {
  const book = makeBook()
  return {
    getById: jest.fn().mockResolvedValue(book),
    search: jest.fn().mockResolvedValue([]),
    upsert: jest.fn().mockResolvedValue(book),
  }
}

function makeUserBookRepo(): IUserBookRepository {
  return {
    getByUser: jest.fn().mockResolvedValue([]),
    upsert: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue(undefined),
  }
}

// ─── searchExternalBooks ─────────────────────────────────────────────────────

describe('searchExternalBooks', () => {
  it('devuelve resultados del servicio', async () => {
    const books = [makeBook(), makeBook({ id: 'book-2', title: 'El otoño del patriarca' })]
    const service = makeService(books)
    const result = await searchExternalBooks(service, 'garcia marquez')
    expect(result).toEqual(books)
    expect(service.search).toHaveBeenCalledWith('garcia marquez')
  })

  it('no llama al servicio si la query está vacía', async () => {
    const service = makeService()
    const result = await searchExternalBooks(service, '')
    expect(result).toEqual([])
    expect(service.search).not.toHaveBeenCalled()
  })

  it('no llama al servicio si la query es solo espacios', async () => {
    const service = makeService()
    const result = await searchExternalBooks(service, '   ')
    expect(result).toEqual([])
    expect(service.search).not.toHaveBeenCalled()
  })

  it('prefija isbn: cuando la query parece un código de barras', async () => {
    const service = makeService([makeBook()])
    await searchExternalBooks(service, '9780060883287')
    expect(service.search).toHaveBeenCalledWith('isbn:9780060883287')
  })

  it('no prefija isbn: para queries de texto normal', async () => {
    const service = makeService([makeBook()])
    await searchExternalBooks(service, 'cien años')
    expect(service.search).toHaveBeenCalledWith('cien años')
  })

  it('devuelve array vacío si el servicio no encuentra resultados', async () => {
    const service = makeService([])
    const result = await searchExternalBooks(service, 'libro inexistente xyz')
    expect(result).toEqual([])
  })
})

// ─── createUseBookSearchActions ──────────────────────────────────────────────

describe('createUseBookSearchActions', () => {
  it('search llama al servicio con la query correcta', async () => {
    const books = [makeBook()]
    const service = makeService(books)
    const actions = createUseBookSearchActions(service, makeBookRepo(), makeUserBookRepo())
    const result = await actions.search('dune')
    expect(result).toEqual(books)
    expect(service.search).toHaveBeenCalledWith('dune')
  })

  it('search devuelve array vacío para query en blanco', async () => {
    const service = makeService([makeBook()])
    const actions = createUseBookSearchActions(service, makeBookRepo(), makeUserBookRepo())
    const result = await actions.search('   ')
    expect(result).toEqual([])
    expect(service.search).not.toHaveBeenCalled()
  })

  it('save llama a upsert en el repo de libros y de usuario', async () => {
    const book = makeBook()
    const bookRepo = makeBookRepo()
    const userBookRepo = makeUserBookRepo()
    const actions = createUseBookSearchActions(makeService(), bookRepo, userBookRepo)
    await actions.save('user-1', book, 'want_to_read')
    expect(bookRepo.upsert).toHaveBeenCalledWith(expect.objectContaining({ title: book.title }))
    expect(userBookRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', status: 'want_to_read' }),
    )
  })

  it('save con status "reading" pasa el estado correcto', async () => {
    const book = makeBook()
    const userBookRepo = makeUserBookRepo()
    const actions = createUseBookSearchActions(makeService(), makeBookRepo(), userBookRepo)
    await actions.save('user-42', book, 'reading')
    expect(userBookRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-42', status: 'reading' }),
    )
  })

  it('save con status "read" pasa el estado correcto', async () => {
    const book = makeBook()
    const userBookRepo = makeUserBookRepo()
    const actions = createUseBookSearchActions(makeService(), makeBookRepo(), userBookRepo)
    await actions.save('user-1', book, 'read')
    expect(userBookRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'read' }),
    )
  })
})
