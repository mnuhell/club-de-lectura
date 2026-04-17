import type { Club, ClubMember, ClubWithDetails } from '../domain'

export interface IClubRepository {
  getById(id: string, userId: string): Promise<ClubWithDetails | null>
  getMyClubs(userId: string): Promise<ClubWithDetails[]>
  create(data: Pick<Club, 'name' | 'description' | 'isPrivate' | 'ownerId'>): Promise<Club>
  update(
    id: string,
    data: Partial<Pick<Club, 'name' | 'description' | 'coverUrl' | 'currentBookId'>>,
  ): Promise<Club>
  delete(id: string): Promise<void>
  joinByCode(inviteCode: string, userId: string): Promise<ClubMember>
  leave(clubId: string, userId: string): Promise<void>
  getMembers(clubId: string): Promise<ClubMember[]>
}
