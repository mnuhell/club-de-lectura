/**
 * @jest-environment node
 */
import type { IClubRepository } from '../repositories'
import type { Club, ClubMember, ClubWithDetails } from '../domain'
import { createClub, joinClub, getMyClubs, getClubDetail } from '../usecases/clubs'

const makeClub = (overrides: Partial<Club> = {}): Club => ({
  id: 'club-1',
  name: 'Lectores Nocturnos',
  description: null,
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

describe('createClub', () => {
  it('crea un club con los datos del usuario y devuelve el club creado', async () => {
    const repo = makeRepo()
    const result = await createClub(repo, {
      name: 'Lectores Nocturnos',
      description: null,
      isPrivate: false,
      ownerId: 'user-1',
    })
    expect(result.name).toBe('Lectores Nocturnos')
    expect(result.ownerId).toBe('user-1')
  })

  it('lanza error si el nombre está vacío', async () => {
    const repo = makeRepo()
    await expect(
      createClub(repo, { name: '   ', description: null, isPrivate: false, ownerId: 'user-1' }),
    ).rejects.toThrow('El nombre del club es obligatorio')
  })

  it('no llama al repositorio si la validación falla', async () => {
    const repo = makeRepo()
    await createClub(repo, {
      name: 'válido',
      description: null,
      isPrivate: false,
      ownerId: 'user-1',
    }).catch(() => {})
    // la llamada válida sí invoca el repo
    expect(repo.create).toHaveBeenCalledTimes(1)

    const repo2 = makeRepo()
    await createClub(repo2, {
      name: '',
      description: null,
      isPrivate: false,
      ownerId: 'user-1',
    }).catch(() => {})
    expect(repo2.create).not.toHaveBeenCalled()
  })
})

describe('joinClub', () => {
  it('une al usuario al club con el código correcto y devuelve el membership', async () => {
    const repo = makeRepo()
    const result = await joinClub(repo, 'ABC123', 'user-2')
    expect(result.userId).toBe('user-2')
    expect(result.role).toBe('member')
  })

  it('lanza error si el código de invitación está vacío', async () => {
    const repo = makeRepo()
    await expect(joinClub(repo, '  ', 'user-2')).rejects.toThrow(
      'El código de invitación es obligatorio',
    )
  })

  it('no llama al repositorio si el código está vacío', async () => {
    const repo = makeRepo()
    await joinClub(repo, '  ', 'user-2').catch(() => {})
    expect(repo.joinByCode).not.toHaveBeenCalled()
  })
})

describe('getMyClubs', () => {
  it('devuelve la lista de clubs del usuario', async () => {
    const repo = makeRepo()
    const result = await getMyClubs(repo, 'user-1')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Lectores Nocturnos')
  })

  it('llama al repositorio con el userId correcto', async () => {
    const repo = makeRepo()
    await getMyClubs(repo, 'user-1')
    expect(repo.getMyClubs).toHaveBeenCalledWith('user-1')
  })
})

describe('getClubDetail', () => {
  it('devuelve el detalle del club con libro y miembros', async () => {
    const repo = makeRepo()
    const result = await getClubDetail(repo, 'club-1', 'user-1')
    expect(result?.id).toBe('club-1')
    expect(result?.memberCount).toBe(1)
    expect(result?.myRole).toBe('owner')
  })

  it('devuelve null si el club no existe', async () => {
    const repo = makeRepo({ getById: jest.fn().mockResolvedValue(null) })
    const result = await getClubDetail(repo, 'no-existe', 'user-1')
    expect(result).toBeNull()
  })
})
