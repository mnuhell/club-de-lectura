/**
 * @jest-environment node
 */

// Evita que el cliente Supabase se inicialice en tests de unidad
jest.mock('../infrastructure/supabase/repositories', () => ({}))

import type { IClubRepository } from '../repositories'
import type { Club, ClubMember, ClubWithDetails } from '../domain'

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
  memberCount: 1,
  myRole: 'owner',
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
    getMyClubs: jest.fn().mockResolvedValue([makeClubWithDetails()]),
    create: jest.fn().mockResolvedValue(makeClub()),
    update: jest.fn().mockResolvedValue(makeClub()),
    delete: jest.fn().mockResolvedValue(undefined),
    joinByCode: jest.fn().mockResolvedValue(makeMember()),
    leave: jest.fn().mockResolvedValue(undefined),
    getMembers: jest.fn().mockResolvedValue([makeMember()]),
    ...overrides,
  }
}

// Importamos la factory del hook (sin React, el hook retorna un objeto con la lógica pura)
import { createUseClubsActions } from '../ui/hooks/useClubs'

describe('useClubs actions (lógica pura)', () => {
  it('create dispara createClub con los datos correctos y devuelve el club', async () => {
    const repo = makeRepo()
    const actions = createUseClubsActions(repo)
    const club = await actions.create({
      name: 'Lectores Nocturnos',
      description: null,
      isPrivate: false,
      ownerId: 'user-1',
    })
    expect(club.name).toBe('Lectores Nocturnos')
    expect(repo.create).toHaveBeenCalledTimes(1)
  })

  it('create lanza error si el nombre está vacío', async () => {
    const repo = makeRepo()
    const actions = createUseClubsActions(repo)
    await expect(
      actions.create({ name: '', description: null, isPrivate: false, ownerId: 'user-1' })
    ).rejects.toThrow('El nombre del club es obligatorio')
  })

  it('join une al usuario con el código y devuelve el membership', async () => {
    const repo = makeRepo()
    const actions = createUseClubsActions(repo)
    const member = await actions.join('ABC123', 'user-2')
    expect(member.userId).toBe('user-2')
    expect(repo.joinByCode).toHaveBeenCalledWith('ABC123', 'user-2')
  })

  it('join lanza error si el código está vacío', async () => {
    const repo = makeRepo()
    const actions = createUseClubsActions(repo)
    await expect(actions.join('', 'user-2')).rejects.toThrow('El código de invitación es obligatorio')
  })

  it('fetchMyClubs devuelve la lista de clubs del usuario', async () => {
    const repo = makeRepo()
    const actions = createUseClubsActions(repo)
    const clubs = await actions.fetchMyClubs('user-1')
    expect(clubs).toHaveLength(1)
    expect(clubs[0].name).toBe('Lectores Nocturnos')
  })
})
