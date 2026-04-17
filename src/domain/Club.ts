export type ClubRole = 'owner' | 'admin' | 'member'

export type Club = {
  id: string
  name: string
  description: string | null
  coverUrl: string | null
  isPrivate: boolean
  inviteCode: string
  ownerId: string
  currentBookId: string | null
  createdAt: string
  updatedAt: string
}

export type ClubMember = {
  clubId: string
  userId: string
  role: ClubRole
  joinedAt: string
}

export type ClubWithDetails = Club & {
  currentBook: import('./Book').Book | null
  memberCount: number
  myRole: ClubRole | null
}
