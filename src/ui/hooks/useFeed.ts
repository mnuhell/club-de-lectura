import { useCallback, useEffect, useRef } from 'react'
import { useState } from 'react'
import type { IClubRepository } from '../../repositories'
import type { IPostRepository } from '../../repositories/IPostRepository'
import type { IReadingSessionRepository } from '../../repositories/IReadingSessionRepository'
import type { FeedItem } from '../../domain'
import {
  ClubRepository,
  PostRepository,
  ReadingSessionRepository,
} from '../../infrastructure/supabase/repositories'
import { SupabaseRealtimeService } from '../../infrastructure/supabase/realtime'
import { getFeed } from '../../usecases/feed'
import { createRealtimeManager } from '../../usecases/realtime'

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
  const realtimeManager = useRef(createRealtimeManager(SupabaseRealtimeService))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await actions.fetchFeed(userId)
      setItems(data)
      const clubIds = [...new Set(data.map(i => i.clubId))]
      realtimeManager.current.subscribeToClubs(clubIds, load)
    } catch {
      setError('No se pudo cargar el feed')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) load()
    return () => realtimeManager.current.unsubscribeAll()
  }, [userId, load])

  return { items, loading, error, refresh: load }
}
