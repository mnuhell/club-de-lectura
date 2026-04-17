// @jest-environment node
import { getProfile, updateProfile } from '../usecases/profile'
import { createUseProfileActions } from '../ui/hooks/useProfile'
import type { IUserRepository } from '../repositories'
import type { IUserBookRepository } from '../repositories'
import type { IClubRepository } from '../repositories'
import type { User, UserBookWithDetails } from '../domain'

jest.mock('../infrastructure/supabase/repositories', () => ({}))
jest.mock('../infrastructure/supabase/storage', () => ({}))

const makeUser = (): User => ({
  id: 'user-1',
  username: 'ana_libros',
  displayName: 'Ana Libros',
  avatarUrl: null,
  bio: 'Apasionada del realismo mágico.',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
})

const makeUserBook = (status: UserBookWithDetails['status']): UserBookWithDetails => ({
  userId: 'user-1',
  bookId: 'book-1',
  status,
  rating: null,
  startedAt: null,
  finishedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  book: {
    id: 'book-1',
    title: 'Libro',
    author: 'Autor',
    isbn: null,
    coverUrl: null,
    description: null,
    pageCount: null,
    publishedYear: null,
    externalId: null,
    externalSource: null,
    createdAt: '2026-01-01T00:00:00Z',
  },
})

const makeUserRepo = (user: User | null = makeUser()): IUserRepository => ({
  getById: jest.fn().mockResolvedValue(user),
  getByUsername: jest.fn().mockResolvedValue(user),
  update: jest.fn().mockResolvedValue({ ...makeUser(), ...user }),
})

const makeUserBookRepo = (books: UserBookWithDetails[] = []): IUserBookRepository => ({
  getByUser: jest.fn().mockResolvedValue(books),
  upsert: jest.fn(),
  remove: jest.fn(),
})

const makeClubRepo = (): IClubRepository => ({
  getById: jest.fn().mockResolvedValue(null),
  getMyClubs: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  joinByCode: jest.fn(),
  leave: jest.fn(),
  getMembers: jest.fn().mockResolvedValue([]),
})

// --- getProfile ---

test('getProfile returns user from repo', async () => {
  const user = makeUser()
  const repo = makeUserRepo(user)

  const result = await getProfile(repo, 'user-1')

  expect(result).toEqual(user)
  expect(repo.getById).toHaveBeenCalledWith('user-1')
})

test('getProfile returns null when user not found', async () => {
  const repo = makeUserRepo(null)

  const result = await getProfile(repo, 'unknown')

  expect(result).toBeNull()
})

// --- updateProfile ---

test('updateProfile saves display name and bio', async () => {
  const repo = makeUserRepo()

  await updateProfile(repo, 'user-1', { displayName: 'Ana Nueva', bio: 'Nueva bio' })

  expect(repo.update).toHaveBeenCalledWith('user-1', { displayName: 'Ana Nueva', bio: 'Nueva bio' })
})

test('updateProfile throws when displayName is empty', async () => {
  const repo = makeUserRepo()

  await expect(updateProfile(repo, 'user-1', { displayName: '', bio: '' })).rejects.toThrow()
})

test('updateProfile throws when displayName is only whitespace', async () => {
  const repo = makeUserRepo()

  await expect(updateProfile(repo, 'user-1', { displayName: '   ', bio: '' })).rejects.toThrow()
})

test('updateProfile returns updated user', async () => {
  const updated = { ...makeUser(), displayName: 'Nuevo nombre' }
  const repo = makeUserRepo()
  ;(repo.update as jest.Mock).mockResolvedValue(updated)

  const result = await updateProfile(repo, 'user-1', { displayName: 'Nuevo nombre', bio: '' })

  expect(result.displayName).toBe('Nuevo nombre')
})

// --- createUseProfileActions ---

test('createUseProfileActions.fetchProfile delegates to getProfile', async () => {
  const user = makeUser()
  const userRepo = makeUserRepo(user)
  const userBookRepo = makeUserBookRepo()
  const clubRepo = makeClubRepo()
  const actions = createUseProfileActions(userRepo, userBookRepo, clubRepo)

  const result = await actions.fetchProfile('user-1')

  expect(result).toEqual(user)
})

test('createUseProfileActions.fetchStats returns book and club counts', async () => {
  const userRepo = makeUserRepo()
  const userBookRepo = makeUserBookRepo([
    makeUserBook('read'),
    makeUserBook('read'),
    makeUserBook('reading'),
  ])
  const clubRepo = makeClubRepo()
  ;(clubRepo.getMyClubs as jest.Mock).mockResolvedValue([{}, {}])
  const actions = createUseProfileActions(userRepo, userBookRepo, clubRepo)

  const stats = await actions.fetchStats('user-1')

  expect(stats.booksRead).toBe(2)
  expect(stats.clubCount).toBe(2)
})

test('createUseProfileActions.update delegates to updateProfile', async () => {
  const userRepo = makeUserRepo()
  const userBookRepo = makeUserBookRepo()
  const clubRepo = makeClubRepo()
  const actions = createUseProfileActions(userRepo, userBookRepo, clubRepo)

  await actions.update('user-1', { displayName: 'Nuevo', bio: 'Bio' })

  expect(userRepo.update).toHaveBeenCalledWith('user-1', { displayName: 'Nuevo', bio: 'Bio' })
})
