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
  refreshing: boolean
  error: string | null
  refresh: () => void
}

const _feedActions = createUseFeedActions(ClubRepository, PostRepository, ReadingSessionRepository)

export function useFeed(userId: string): FeedState {
  const [items, setItems] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initialLoadDone = useRef(false)

  const realtimeManager = useRef(createRealtimeManager(SupabaseRealtimeService))

  const load = useCallback(
    async (opts?: { background?: boolean }) => {
      const isBackground = opts?.background ?? false
      if (isBackground) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      try {
        const { items: data, allClubIds } = await _feedActions.fetchFeed(userId)
        setItems(data)
        realtimeManager.current.subscribeToClubs(allClubIds, () => load({ background: true }))
        initialLoadDone.current = true
      } catch {
        setError('No se pudo cargar el feed')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [userId],
  )

  useEffect(() => {
    const manager = realtimeManager.current
    if (userId) load()
    return () => manager.unsubscribeAll()
  }, [userId, load])

  const refresh = useCallback(() => {
    load({ background: initialLoadDone.current })
  }, [load])

  return { items, loading, refreshing, error, refresh }
}
