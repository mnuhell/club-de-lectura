import { useState } from 'react'
import type { IBookSearchService } from '../../infrastructure/api/IBookSearchService'
import type { IBookRepository } from '../../repositories'
import type { IUserBookRepository } from '../../repositories'
import type { Book, BookStatus } from '../../domain'
import { GoogleBooksService } from '../../infrastructure/api/GoogleBooksService'
import { BookRepository, UserBookRepository } from '../../infrastructure/supabase/repositories'
import { searchExternalBooks, saveBookToLibrary } from '../../usecases/discovery'

export function createUseBookSearchActions(
  service: IBookSearchService,
  bookRepo: IBookRepository,
  userBookRepo: IUserBookRepository,
) {
  return {
    search: (query: string) => searchExternalBooks(service, query),
    save: (userId: string, book: Book, status: BookStatus) =>
      saveBookToLibrary(bookRepo, userBookRepo, userId, book, status),
  }
}

interface BookSearchState {
  results: Book[]
  loading: boolean
  error: string | null
  search: (query: string) => Promise<void>
  save: (book: Book, status: BookStatus) => Promise<void>
}

export function useBookSearch(userId: string): BookSearchState {
  const [results, setResults] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const actions = createUseBookSearchActions(GoogleBooksService, BookRepository, UserBookRepository)

  async function search(query: string) {
    setLoading(true)
    setError(null)
    try {
      const data = await actions.search(query)
      setResults(data)
    } catch {
      setError('No se pudo buscar. Comprueba tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  async function save(book: Book, status: BookStatus) {
    await actions.save(userId, book, status)
  }

  return { results, loading, error, search, save }
}
