import type { Post, ReadingSession } from '../domain'
import type { IPostRepository } from '../repositories/IPostRepository'
import type { IReadingSessionRepository } from '../repositories/IReadingSessionRepository'

export async function getReadingProgress(
  repo: IReadingSessionRepository,
  clubId: string,
): Promise<ReadingSession | null> {
  return repo.getActiveByClub(clubId)
}

export async function postComment(
  repo: IPostRepository,
  data: {
    clubId: string
    sessionId: string
    authorId: string
    content: string
    chapterRef: number
    hasSpoiler: boolean
  },
): Promise<Post> {
  if (!data.content.trim()) throw new Error('El comentario no puede estar vacío')
  return repo.create({
    clubId: data.clubId,
    readingSessionId: data.sessionId,
    authorId: data.authorId,
    content: data.content.trim(),
    chapterRef: data.chapterRef,
    pageRef: null,
    hasSpoiler: data.hasSpoiler,
  })
}

export async function updateProgress(
  repo: IReadingSessionRepository,
  sessionId: string,
  data: { chapter: number; page: number | null },
): Promise<ReadingSession> {
  if (data.chapter < 1) throw new Error('El capítulo debe ser mayor que 0')
  return repo.updateProgress(sessionId, {
    currentChapter: data.chapter,
    currentPage: data.page,
  })
}

export async function finishReading(
  repo: IReadingSessionRepository,
  sessionId: string,
): Promise<ReadingSession> {
  return repo.finish(sessionId)
}
