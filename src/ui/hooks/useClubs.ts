import { useCallback, useEffect, useState } from 'react'
import type { IClubRepository } from '../../repositories'
import type { Book, Club, ClubCreateData, ClubWithDetails } from '../../domain'
import { ClubRepository } from '../../infrastructure/supabase/repositories'
import { BookRepository } from '../../infrastructure/supabase/repositories'
import { createClub, joinClub, getMyClubs } from '../../usecases/clubs'

export function createUseClubsActions(repo: IClubRepository) {
  return {
    create: (data: ClubCreateData) => createClub(repo, data),
    join: (inviteCode: string, userId: string) => joinClub(repo, inviteCode, userId),
    fetchMyClubs: (userId: string) => getMyClubs(repo, userId),
  }
}

export type CreateClubInput = {
  name: string
  description: string | null
  isPrivate: boolean
  book?: Book | null
  startDate?: string | null
  meetingDate?: string | null
  bookstoreName?: string | null
  bookstoreUrl?: string | null
  bookstoreAddress?: string | null
  bookstorePhone?: string | null
}

interface ClubsState {
  clubs: ClubWithDetails[]
  loading: boolean
  error: string | null
  refresh: () => void
  create: (data: CreateClubInput) => Promise<Club>
  join: (inviteCode: string) => Promise<void>
}

const _actions = createUseClubsActions(ClubRepository)

export function useClubs(userId: string): ClubsState {
  const [clubs, setClubs] = useState<ClubWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await _actions.fetchMyClubs(userId)
      setClubs(data)
    } catch {
      setError('No se pudieron cargar tus clubs')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) load()
  }, [userId, load])

  async function create(input: CreateClubInput) {
    let currentBookId: string | null = null
    if (input.book) {
      const saved = await BookRepository.upsert(input.book)
      currentBookId = saved.id
    }
    const club = await _actions.create({
      name: input.name,
      description: input.description,
      isPrivate: input.isPrivate,
      ownerId: userId,
      currentBookId,
      startDate: input.startDate ?? null,
      meetingDate: input.meetingDate ?? null,
      bookstoreName: input.bookstoreName ?? null,
      bookstoreUrl: input.bookstoreUrl ?? null,
      bookstoreAddress: input.bookstoreAddress ?? null,
      bookstorePhone: input.bookstorePhone ?? null,
    })
    await load()
    return club
  }

  async function join(inviteCode: string) {
    await _actions.join(inviteCode, userId)
    await load()
  }

  return { clubs, loading, error, refresh: load, create, join }
}
