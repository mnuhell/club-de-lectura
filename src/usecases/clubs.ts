import type { Club, ClubCreateData, ClubMember, ClubWithDetails } from '../domain'
import type { IClubRepository } from '../repositories'

export async function createClub(repo: IClubRepository, data: ClubCreateData): Promise<Club> {
  if (!data.name.trim()) throw new Error('El nombre del club es obligatorio')
  return repo.create(data)
}

function isClubClosed(club: Club | ClubWithDetails | null): boolean {
  if (!club?.closeDate) return false
  return new Date(club.closeDate) <= new Date()
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

export async function discoverClubs(
  repo: IClubRepository,
  userId: string,
  city?: string,
): Promise<ClubWithDetails[]> {
  return repo.getPublicClubs(userId, city)
}

export async function getClubMembers(repo: IClubRepository, clubId: string): Promise<ClubMember[]> {
  return repo.getMembers(clubId)
}

export async function leaveClub(
  repo: IClubRepository,
  clubId: string,
  userId: string,
): Promise<void> {
  const club = await repo.getById(clubId, userId)
  if (club?.myRole === 'owner') throw new Error('El organizador no puede abandonar el club')
  if (isClubClosed(club)) throw new Error('El club está cerrado y no se puede abandonar')
  return repo.leave(clubId, userId)
}
