/**
 * @jest-environment node
 */

jest.mock('../infrastructure/supabase/repositories', () => ({}))
jest.mock('../infrastructure/supabase/realtime', () => ({
  SupabaseRealtimeService: {
    subscribeToClubPosts: jest.fn().mockReturnValue(jest.fn()),
    subscribeToReadingSession: jest.fn().mockReturnValue(jest.fn()),
  },
}))

import type { IClubRepository } from '../repositories'
import type { IPostRepository } from '../repositories/IPostRepository'
import type { IReadingSessionRepository } from '../repositories/IReadingSessionRepository'
import type { Club, ClubWithDetails, PostWithDetails, ReadingSession, User } from '../domain'
import { getFeed } from '../usecases/feed'
import { createUseFeedActions } from '../ui/hooks/useFeed'

const makeUser = (): User => ({
  id: 'user-1',
  username: 'lector',
  displayName: 'El Lector',
  avatarUrl: null,
  bio: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

const makeClub = (overrides: Partial<Club> = {}): Club => ({
  id: 'club-1',
  name: 'Lectores Nocturnos',
  description: null,
  coverUrl: null,
  isPrivate: false,
  inviteCode: 'ABC123',
  ownerId: 'user-1',
  currentBookId: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

const makeClubWithDetails = (overrides: Partial<ClubWithDetails> = {}): ClubWithDetails => ({
  ...makeClub(),
  currentBook: null,
  memberCount: 2,
  myRole: 'member',
  ...overrides,
})

const makePost = (overrides: Partial<PostWithDetails> = {}): PostWithDetails => ({
  id: 'post-1',
  clubId: 'club-1',
  readingSessionId: null,
  authorId: 'user-1',
  content: 'Qué capítulo tan intenso',
  chapterRef: 3,
  pageRef: null,
  hasSpoiler: false,
  createdAt: '2026-04-17T10:00:00Z',
  updatedAt: '2026-04-17T10:00:00Z',
  author: makeUser(),
  reactions: [],
  ...overrides,
})

const makeSession = (overrides: Partial<ReadingSession> = {}): ReadingSession => ({
  id: 'session-1',
  clubId: 'club-1',
  bookId: 'book-1',
  currentChapter: 5,
  currentPage: 120,
  startedAt: '2026-04-15T09:00:00Z',
  finishedAt: null,
  createdAt: '2026-04-15T09:00:00Z',
  ...overrides,
})

function makeClubRepo(overrides: Partial<IClubRepository> = {}): IClubRepository {
  return {
    getById: jest.fn().mockResolvedValue(makeClubWithDetails()),
    getMyClubs: jest.fn().mockResolvedValue([makeClubWithDetails()]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    joinByCode: jest.fn(),
    leave: jest.fn(),
    getMembers: jest.fn().mockResolvedValue([]),
    ...overrides,
  }
}

function makePostRepo(overrides: Partial<IPostRepository> = {}): IPostRepository {
  return {
    getByClub: jest.fn().mockResolvedValue([makePost()]),
    create: jest.fn(),
    delete: jest.fn(),
    ...overrides,
  }
}

function makeSessionRepo(overrides: Partial<IReadingSessionRepository> = {}): IReadingSessionRepository {
  return {
    getActiveByClub: jest.fn().mockResolvedValue(makeSession()),
    create: jest.fn(),
    updateProgress: jest.fn(),
    finish: jest.fn(),
    ...overrides,
  }
}

describe('getFeed', () => {
  it('incluye posts del club como items de tipo post', async () => {
    const items = await getFeed(makeClubRepo(), makePostRepo(), makeSessionRepo(), 'user-1')
    const postItems = items.filter(i => i.type === 'post')
    expect(postItems).toHaveLength(1)
    expect(postItems[0].type).toBe('post')
  })

  it('incluye sesiones activas como items de tipo progress', async () => {
    const items = await getFeed(makeClubRepo(), makePostRepo(), makeSessionRepo(), 'user-1')
    const progressItems = items.filter(i => i.type === 'progress')
    expect(progressItems).toHaveLength(1)
    expect(progressItems[0].type).toBe('progress')
  })

  it('los items están ordenados por fecha descendente', async () => {
    const postRepo = makePostRepo({
      getByClub: jest.fn().mockResolvedValue([
        makePost({ id: 'post-old', createdAt: '2026-04-10T00:00:00Z' }),
        makePost({ id: 'post-new', createdAt: '2026-04-17T00:00:00Z' }),
      ]),
    })
    const sessionRepo = makeSessionRepo({
      getActiveByClub: jest.fn().mockResolvedValue(
        makeSession({ startedAt: '2026-04-13T00:00:00Z' }),
      ),
    })
    const items = await getFeed(makeClubRepo(), postRepo, sessionRepo, 'user-1')
    expect(items[0].timestamp).toBe('2026-04-17T00:00:00Z')
    expect(items[1].timestamp).toBe('2026-04-13T00:00:00Z')
    expect(items[2].timestamp).toBe('2026-04-10T00:00:00Z')
  })

  it('el item post lleva el nombre del club', async () => {
    const clubRepo = makeClubRepo({
      getMyClubs: jest.fn().mockResolvedValue([makeClubWithDetails({ name: 'Club de Prueba' })]),
    })
    const items = await getFeed(clubRepo, makePostRepo(), makeSessionRepo(), 'user-1')
    const postItem = items.find(i => i.type === 'post')
    expect(postItem?.clubName).toBe('Club de Prueba')
  })

  it('el item progress lleva capítulo y página actuales', async () => {
    const items = await getFeed(makeClubRepo(), makePostRepo(), makeSessionRepo(), 'user-1')
    const progressItem = items.find(i => i.type === 'progress')
    if (progressItem?.type !== 'progress') throw new Error('expected progress item')
    expect(progressItem.chapter).toBe(5)
    expect(progressItem.page).toBe(120)
  })

  it('devuelve feed vacío si el usuario no tiene clubs', async () => {
    const clubRepo = makeClubRepo({ getMyClubs: jest.fn().mockResolvedValue([]) })
    const items = await getFeed(clubRepo, makePostRepo(), makeSessionRepo(), 'user-1')
    expect(items).toHaveLength(0)
  })

  it('omite el item progress si el club no tiene sesión activa', async () => {
    const sessionRepo = makeSessionRepo({
      getActiveByClub: jest.fn().mockResolvedValue(null),
    })
    const items = await getFeed(makeClubRepo(), makePostRepo(), sessionRepo, 'user-1')
    const progressItems = items.filter(i => i.type === 'progress')
    expect(progressItems).toHaveLength(0)
  })

  it('los posts con spoiler llevan hasSpoiler=true en el item', async () => {
    const postRepo = makePostRepo({
      getByClub: jest.fn().mockResolvedValue([makePost({ hasSpoiler: true })]),
    })
    const items = await getFeed(makeClubRepo(), postRepo, makeSessionRepo(), 'user-1')
    const postItem = items.find(i => i.type === 'post')
    if (postItem?.type !== 'post') throw new Error('expected post item')
    expect(postItem.post.hasSpoiler).toBe(true)
  })
})

describe('useFeed actions', () => {
  it('fetchFeed devuelve los items del feed', async () => {
    const actions = createUseFeedActions(makeClubRepo(), makePostRepo(), makeSessionRepo())
    const items = await actions.fetchFeed('user-1')
    expect(items.length).toBeGreaterThan(0)
  })

  it('fetchFeed devuelve array vacío si no hay clubs', async () => {
    const clubRepo = makeClubRepo({ getMyClubs: jest.fn().mockResolvedValue([]) })
    const actions = createUseFeedActions(clubRepo, makePostRepo(), makeSessionRepo())
    const items = await actions.fetchFeed('user-1')
    expect(items).toHaveLength(0)
  })
})
