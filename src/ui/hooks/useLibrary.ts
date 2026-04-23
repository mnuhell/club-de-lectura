import { useCallback, useEffect, useState } from 'react'
import type { IUserBookRepository } from '../../repositories'
import type { BookStatus, UserBookWithDetails } from '../../domain'
import { UserBookRepository } from '../../infrastructure/supabase/repositories'
import { getLibrary, setBookStatus, removeFromLibrary } from '../../usecases/library'

export function createUseLibraryActions(repo: IUserBookRepository) {
  return {
    fetchLibrary: (userId: string, status?: BookStatus) => getLibrary(repo, userId, status),
    setStatus: (userId: string, bookId: string, status: BookStatus) =>
      setBookStatus(repo, userId, bookId, status),
    remove: (userId: string, bookId: string) => removeFromLibrary(repo, userId, bookId),
  }
}

interface LibraryState {
  books: UserBookWithDetails[]
  loading: boolean
  error: string | null
  setStatus: (bookId: string, status: BookStatus) => Promise<void>
  remove: (bookId: string) => Promise<void>
  refresh: () => void
}

const _actions = createUseLibraryActions(UserBookRepository)

export function useLibrary(userId: string): LibraryState {
  const [books, setBooks] = useState<UserBookWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await _actions.fetchLibrary(userId)
      setBooks(data)
    } catch {
      setError('No se pudo cargar tu biblioteca')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) load()
  }, [userId, load])

  async function setStatus(bookId: string, status: BookStatus) {
    await _actions.setStatus(userId, bookId, status)
    await load()
  }

  async function remove(bookId: string) {
    await _actions.remove(userId, bookId)
    await load()
  }

  return { books, loading, error, setStatus, remove, refresh: load }
}
