import { useCallback, useEffect, useRef, useState } from 'react'
import type { IReadingSessionRepository } from '../../repositories/IReadingSessionRepository'
import type { IPostRepository } from '../../repositories/IPostRepository'
import type { PostWithDetails, ReadingSession } from '../../domain'
import {
  ReadingSessionRepository,
  PostRepository,
} from '../../infrastructure/supabase/repositories'
import { SupabaseRealtimeService } from '../../infrastructure/supabase/realtime'
import { getReadingProgress, postComment, updateProgress } from '../../usecases/readingProgress'
import { createRealtimeManager } from '../../usecases/realtime'

export function createUseReadingProgressActions(
  sessionRepo: IReadingSessionRepository,
  postRepo: IPostRepository,
) {
  return {
    fetchProgress: (clubId: string) => getReadingProgress(sessionRepo, clubId),
    fetchChapterPosts: (clubId: string, chapterRef: number) =>
      postRepo.getByClub(clubId, { chapterRef }),
    comment: (data: {
      clubId: string
      sessionId: string
      authorId: string
      content: string
      chapterRef: number
      hasSpoiler: boolean
    }) => postComment(postRepo, data),
    advance: (sessionId: string, data: { chapter: number; page: number | null }) =>
      updateProgress(sessionRepo, sessionId, data),
  }
}

interface ReadingProgressState {
  session: ReadingSession | null
  posts: PostWithDetails[]
  loading: boolean
  error: string | null
  comment: (content: string, hasSpoiler: boolean) => Promise<void>
  advance: (chapter: number, page: number | null) => Promise<void>
  refresh: () => void
}

const _readingActions = createUseReadingProgressActions(ReadingSessionRepository, PostRepository)

export function useReadingProgress(clubId: string, userId: string): ReadingProgressState {
  const [session, setSession] = useState<ReadingSession | null>(null)
  const [posts, setPosts] = useState<PostWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const realtimeManager = useRef(createRealtimeManager(SupabaseRealtimeService))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const activeSession = await _readingActions.fetchProgress(clubId)
      setSession(activeSession)
      if (activeSession) {
        const chapterPosts = await _readingActions.fetchChapterPosts(
          clubId,
          activeSession.currentChapter ?? 1,
        )
        setPosts(chapterPosts)
        realtimeManager.current.subscribeToClubs([clubId], load)
        realtimeManager.current.subscribeToSession(activeSession.id, load)
      }
    } catch {
      setError('No se pudo cargar el progreso de lectura')
    } finally {
      setLoading(false)
    }
  }, [clubId])

  useEffect(() => {
    const manager = realtimeManager.current
    if (clubId && userId) load()
    return () => manager.unsubscribeAll()
  }, [clubId, userId, load])

  async function comment(content: string, hasSpoiler: boolean) {
    if (!session) return
    await _readingActions.comment({
      clubId,
      sessionId: session.id,
      authorId: userId,
      content,
      chapterRef: session.currentChapter ?? 1,
      hasSpoiler,
    })
    await load()
  }

  async function advance(chapter: number, page: number | null) {
    if (!session) return
    const updated = await _readingActions.advance(session.id, { chapter, page })
    setSession(updated)
    const chapterPosts = await _readingActions.fetchChapterPosts(clubId, chapter)
    setPosts(chapterPosts)
  }

  return { session, posts, loading, error, comment, advance, refresh: load }
}
