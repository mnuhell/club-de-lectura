import { useCallback, useEffect, useState } from 'react'
import type { IClubRepository } from '../../repositories'
import type { IPostRepository } from '../../repositories/IPostRepository'
import type { IReadingSessionRepository } from '../../repositories/IReadingSessionRepository'
import type { FeedItem } from '../../domain'
import {
  ClubRepository,
  PostRepository,
  ReadingSessionRepository,
} from '../../infrastructure/supabase/repositories'
import { getFeed } from '../../usecases/feed'

export function createUseFeedActions(
  clubRepo: IClubRepository,
  postRepo: IPostRepository,
  sessionRepo: IReadingSessionRepository,
) {
  return {
    fetchFeed: (userId: string) => getFeed(clubRepo, postRepo, sessionRepo, userId),
  }
}

interface FeedState {
  items: FeedItem[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useFeed(userId: string): FeedState {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const actions = createUseFeedActions(ClubRepository, PostRepository, ReadingSessionRepository)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await actions.fetchFeed(userId)
      setItems(data)
    } catch {
      setError('No se pudo cargar el feed')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) load()
  }, [userId, load])

  return { items, loading, error, refresh: load }
}
