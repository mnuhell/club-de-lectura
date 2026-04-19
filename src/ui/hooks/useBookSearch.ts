import { useCallback, useState } from 'react'
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

const _actions = createUseBookSearchActions(GoogleBooksService, BookRepository, UserBookRepository)

export function useBookSearch(userId: string): BookSearchState {
  const [results, setResults] = useState<Book[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    try {
      const data = await _actions.search(trimmed)
      setResults(data)
    } catch {
      setError('No se pudo buscar. Comprueba tu conexión.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const save = useCallback(
    async (book: Book, status: BookStatus) => {
      await _actions.save(userId, book, status)
    },
    [userId],
  )

  return { results, loading, error, search, save }
}
