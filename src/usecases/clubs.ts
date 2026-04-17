import type { IClubRepository } from '../repositories'
import type { Club, ClubMember, ClubWithDetails } from '../domain'

export async function createClub(
  repo: IClubRepository,
  data: Pick<Club, 'name' | 'description' | 'isPrivate' | 'ownerId'>,
): Promise<Club> {
  if (!data.name.trim()) throw new Error('El nombre del club es obligatorio')
  return repo.create(data)
}

export async function joinClub(
  repo: IClubRepository,
  inviteCode: string,
  userId: string,
): Promise<ClubMember> {
  if (!inviteCode.trim()) throw new Error('El código de invitación es obligatorio')
  return repo.joinByCode(inviteCode.trim(), userId)
}

export async function getMyClubs(
  repo: IClubRepository,
  userId: string,
): Promise<ClubWithDetails[]> {
  return repo.getMyClubs(userId)
}

export async function getClubDetail(
  repo: IClubRepository,
  id: string,
  userId: string,
): Promise<ClubWithDetails | null> {
  return repo.getById(id, userId)
}
