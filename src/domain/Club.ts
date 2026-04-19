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
  city: string | null
  startDate: string | null
  meetingDate: string | null
  closeDate: string | null
  bookstoreName: string | null
  bookstoreUrl: string | null
  bookstoreAddress: string | null
  bookstorePhone: string | null
  createdAt: string
  updatedAt: string
}

export type ClubCreateData = {
  name: string
  description: string | null
  isPrivate: boolean
  ownerId: string
  city?: string | null
  currentBookId?: string | null
  startDate?: string | null
  meetingDate?: string | null
  closeDate?: string | null
  bookstoreName?: string | null
  bookstoreUrl?: string | null
  bookstoreAddress?: string | null
  bookstorePhone?: string | null
}

export type ClubMember = {
  clubId: string
  userId: string
  role: ClubRole
  joinedAt: string
  displayName: string | null
  username: string | null
  avatarUrl: string | null
}

export type ClubWithDetails = Club & {
  currentBook: import('./Book').Book | null
  memberCount: number
  myRole: ClubRole | null
}
