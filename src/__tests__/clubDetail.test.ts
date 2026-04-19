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

import type { Club, ClubMember, ClubWithDetails } from '../domain'
import type { IClubRepository } from '../repositories'
import { createUseClubDetailActions } from '../ui/hooks/useClubDetail'
import { getClubMembers, leaveClub } from '../usecases/clubs'

const makeClub = (overrides: Partial<Club> = {}): Club => ({
  id: 'club-1',
  name: 'Lectores Nocturnos',
  description: 'Un club para leer juntos',
  coverUrl: null,
  isPrivate: false,
  inviteCode: 'ABC123',
  ownerId: 'user-1',
  currentBookId: null,
  startDate: null,
  meetingDate: null,
  bookstoreName: null,
  bookstoreUrl: null,
  bookstoreAddress: null,
  bookstorePhone: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

const makeClubWithDetails = (overrides: Partial<ClubWithDetails> = {}): ClubWithDetails => ({
  ...makeClub(),
  currentBook: null,
  memberCount: 3,
  myRole: 'member',
  ...overrides,
})

const makeMember = (overrides: Partial<ClubMember> = {}): ClubMember => ({
  clubId: 'club-1',
  userId: 'user-2',
  role: 'member',
  joinedAt: '2026-01-01T00:00:00Z',
  ...overrides,
})

function makeRepo(overrides: Partial<IClubRepository> = {}): IClubRepository {
  return {
    getById: jest.fn().mockResolvedValue(makeClubWithDetails()),
    getMyClubs: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue(makeClub()),
    update: jest.fn().mockResolvedValue(makeClub()),
    delete: jest.fn().mockResolvedValue(undefined),
    joinByCode: jest.fn().mockResolvedValue(makeMember()),
    leave: jest.fn().mockResolvedValue(undefined),
    getMembers: jest.fn().mockResolvedValue([makeMember(), makeMember({ userId: 'user-3' })]),
    ...overrides,
  }
}

describe('leaveClub', () => {
  it('llama al repositorio con el clubId y userId correctos', async () => {
    const repo = makeRepo()
    await leaveClub(repo, 'club-1', 'user-2')
    expect(repo.leave).toHaveBeenCalledWith('club-1', 'user-2')
  })

  it('lanza error si el usuario es el owner del club', async () => {
    const repo = makeRepo({
      getById: jest.fn().mockResolvedValue(makeClubWithDetails({ myRole: 'owner' })),
    })
    await expect(leaveClub(repo, 'club-1', 'user-1')).rejects.toThrow(
      'El organizador no puede abandonar el club',
    )
  })

  it('no llama a leave si el usuario es owner', async () => {
    const repo = makeRepo({
      getById: jest.fn().mockResolvedValue(makeClubWithDetails({ myRole: 'owner' })),
    })
    await leaveClub(repo, 'club-1', 'user-1').catch(() => {})
    expect(repo.leave).not.toHaveBeenCalled()
  })
})

describe('getClubMembers', () => {
  it('devuelve la lista de miembros del club', async () => {
    const repo = makeRepo()
    const members = await getClubMembers(repo, 'club-1')
    expect(members).toHaveLength(2)
  })

  it('llama al repositorio con el clubId correcto', async () => {
    const repo = makeRepo()
    await getClubMembers(repo, 'club-1')
    expect(repo.getMembers).toHaveBeenCalledWith('club-1')
  })
})

describe('useClubDetail actions', () => {
  it('fetchDetail devuelve el club con detalles', async () => {
    const repo = makeRepo()
    const actions = createUseClubDetailActions(repo)
    const club = await actions.fetchDetail('club-1', 'user-1')
    expect(club?.name).toBe('Lectores Nocturnos')
    expect(club?.memberCount).toBe(3)
  })

  it('fetchMembers devuelve los miembros', async () => {
    const repo = makeRepo()
    const actions = createUseClubDetailActions(repo)
    const members = await actions.fetchMembers('club-1')
    expect(members).toHaveLength(2)
  })

  it('leave llama al use case con los ids correctos', async () => {
    const repo = makeRepo()
    const actions = createUseClubDetailActions(repo)
    await actions.leave('club-1', 'user-2')
    expect(repo.leave).toHaveBeenCalledWith('club-1', 'user-2')
  })

  it('leave lanza error si el usuario es owner', async () => {
    const repo = makeRepo({
      getById: jest.fn().mockResolvedValue(makeClubWithDetails({ myRole: 'owner' })),
    })
    const actions = createUseClubDetailActions(repo)
    await expect(actions.leave('club-1', 'user-1')).rejects.toThrow(
      'El organizador no puede abandonar el club',
    )
  })
})
