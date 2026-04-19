import type { Club, ClubCreateData, ClubMember, ClubWithDetails } from '../domain'

export interface IClubRepository {
  getById(id: string, userId: string): Promise<ClubWithDetails | null>
  getMyClubs(userId: string): Promise<ClubWithDetails[]>
  create(data: ClubCreateData): Promise<Club>
  update(
    id: string,
    data: Partial<Pick<Club, 'name' | 'description' | 'coverUrl' | 'currentBookId'>>,
  ): Promise<Club>
  delete(id: string): Promise<void>
  joinByCode(inviteCode: string, userId: string): Promise<ClubMember>
  leave(clubId: string, userId: string): Promise<void>
  getMembers(clubId: string): Promise<ClubMember[]>
  getPublicClubs(userId: string, city?: string): Promise<ClubWithDetails[]>
}
