// @jest-environment node
import { getReadingProgress, postComment, updateProgress } from '../usecases/readingProgress'
import { createUseReadingProgressActions } from '../ui/hooks/useReadingProgress'
import type { IReadingSessionRepository } from '../repositories/IReadingSessionRepository'
import type { IPostRepository } from '../repositories/IPostRepository'
import type { ReadingSession, Post } from '../domain'

jest.mock('../infrastructure/supabase/repositories', () => ({}))
jest.mock('../infrastructure/supabase/realtime', () => ({
  SupabaseRealtimeService: {
    subscribeToClubPosts: jest.fn().mockReturnValue(jest.fn()),
    subscribeToReadingSession: jest.fn().mockReturnValue(jest.fn()),
  },
}))

const makeSession = (overrides: Partial<ReadingSession> = {}): ReadingSession => ({
  id: 'session-1',
  clubId: 'club-1',
  bookId: 'book-1',
  currentChapter: 8,
  currentPage: 94,
  startedAt: '2026-01-01T00:00:00Z',
  finishedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

const makePost = (): Post => ({
  id: 'post-1',
  clubId: 'club-1',
  readingSessionId: 'session-1',
  authorId: 'user-1',
  content: 'Qué capítulo tan bueno',
  chapterRef: 8,
  pageRef: null,
  hasSpoiler: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

const makeSessionRepo = (session: ReadingSession | null = makeSession()): IReadingSessionRepository => ({
  getActiveByClub: jest.fn().mockResolvedValue(session),
  create: jest.fn().mockResolvedValue(makeSession()),
  updateProgress: jest.fn().mockResolvedValue(makeSession()),
  finish: jest.fn().mockResolvedValue(makeSession({ finishedAt: '2026-01-02T00:00:00Z' })),
})

const makePostRepo = (): IPostRepository => ({
  getByClub: jest.fn().mockResolvedValue([]),
  create: jest.fn().mockResolvedValue(makePost()),
  delete: jest.fn().mockResolvedValue(undefined),
})

// --- getReadingProgress ---

test('getReadingProgress returns active session for club', async () => {
  const session = makeSession()
  const repo = makeSessionRepo(session)

  const result = await getReadingProgress(repo, 'club-1')

  expect(result).toEqual(session)
  expect(repo.getActiveByClub).toHaveBeenCalledWith('club-1')
})

test('getReadingProgress returns null when no active session', async () => {
  const repo = makeSessionRepo(null)

  const result = await getReadingProgress(repo, 'club-1')

  expect(result).toBeNull()
})

// --- postComment ---

test('postComment creates post with chapter reference', async () => {
  const repo = makePostRepo()

  await postComment(repo, {
    clubId: 'club-1',
    sessionId: 'session-1',
    authorId: 'user-1',
    content: 'Gran capítulo',
    chapterRef: 8,
    hasSpoiler: false,
  })

  expect(repo.create).toHaveBeenCalledWith(
    expect.objectContaining({ chapterRef: 8, hasSpoiler: false, content: 'Gran capítulo' }),
  )
})

test('postComment throws when content is empty', async () => {
  const repo = makePostRepo()

  await expect(
    postComment(repo, {
      clubId: 'club-1',
      sessionId: 'session-1',
      authorId: 'user-1',
      content: '   ',
      chapterRef: 8,
      hasSpoiler: false,
    }),
  ).rejects.toThrow()
})

test('postComment marks spoiler when hasSpoiler is true', async () => {
  const repo = makePostRepo()

  await postComment(repo, {
    clubId: 'club-1',
    sessionId: 'session-1',
    authorId: 'user-1',
    content: 'Al final resulta que...',
    chapterRef: 8,
    hasSpoiler: true,
  })

  expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ hasSpoiler: true }))
})

// --- updateProgress ---

test('updateProgress saves new chapter and page', async () => {
  const repo = makeSessionRepo()

  await updateProgress(repo, 'session-1', { chapter: 10, page: 120 })

  expect(repo.updateProgress).toHaveBeenCalledWith('session-1', {
    currentChapter: 10,
    currentPage: 120,
  })
})

test('updateProgress throws when chapter is less than 1', async () => {
  const repo = makeSessionRepo()

  await expect(updateProgress(repo, 'session-1', { chapter: 0, page: null })).rejects.toThrow()
})

test('updateProgress allows null page', async () => {
  const repo = makeSessionRepo()

  await updateProgress(repo, 'session-1', { chapter: 5, page: null })

  expect(repo.updateProgress).toHaveBeenCalledWith('session-1', {
    currentChapter: 5,
    currentPage: null,
  })
})

// --- createUseReadingProgressActions ---

test('createUseReadingProgressActions.fetchProgress delegates to getReadingProgress', async () => {
  const session = makeSession()
  const sessionRepo = makeSessionRepo(session)
  const postRepo = makePostRepo()
  const actions = createUseReadingProgressActions(sessionRepo, postRepo)

  const result = await actions.fetchProgress('club-1')

  expect(result).toEqual(session)
})

test('createUseReadingProgressActions.fetchChapterPosts gets posts filtered by chapter', async () => {
  const sessionRepo = makeSessionRepo()
  const postRepo = makePostRepo()
  const actions = createUseReadingProgressActions(sessionRepo, postRepo)

  await actions.fetchChapterPosts('club-1', 8)

  expect(postRepo.getByClub).toHaveBeenCalledWith('club-1', { chapterRef: 8 })
})

test('createUseReadingProgressActions.comment delegates to postComment', async () => {
  const sessionRepo = makeSessionRepo()
  const postRepo = makePostRepo()
  const actions = createUseReadingProgressActions(sessionRepo, postRepo)

  await actions.comment({
    clubId: 'club-1',
    sessionId: 'session-1',
    authorId: 'user-1',
    content: 'Muy bueno',
    chapterRef: 8,
    hasSpoiler: false,
  })

  expect(postRepo.create).toHaveBeenCalled()
})

test('createUseReadingProgressActions.advance delegates to updateProgress', async () => {
  const sessionRepo = makeSessionRepo()
  const postRepo = makePostRepo()
  const actions = createUseReadingProgressActions(sessionRepo, postRepo)

  await actions.advance('session-1', { chapter: 9, page: 105 })

  expect(sessionRepo.updateProgress).toHaveBeenCalledWith('session-1', {
    currentChapter: 9,
    currentPage: 105,
  })
})
