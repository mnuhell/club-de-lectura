import { useCallback, useEffect, useState } from 'react'
import type { IClubRepository } from '../../repositories'
import type { Club, ClubWithDetails } from '../../domain'
import { ClubRepository } from '../../infrastructure/supabase/repositories'
import { createClub, joinClub, getMyClubs } from '../../usecases/clubs'

export function createUseClubsActions(repo: IClubRepository) {
  return {
    create: (data: Pick<Club, 'name' | 'description' | 'isPrivate' | 'ownerId'>) =>
      createClub(repo, data),
    join: (inviteCode: string, userId: string) => joinClub(repo, inviteCode, userId),
    fetchMyClubs: (userId: string) => getMyClubs(repo, userId),
  }
}

interface ClubsState {
  clubs: ClubWithDetails[]
  loading: boolean
  error: string | null
  refresh: () => void
  create: (data: Pick<Club, 'name' | 'description' | 'isPrivate'>) => Promise<Club>
  join: (inviteCode: string) => Promise<void>
}

export function useClubs(userId: string): ClubsState {
  const [clubs, setClubs] = useState<ClubWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const actions = createUseClubsActions(ClubRepository)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await actions.fetchMyClubs(userId)
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

  async function create(data: Pick<Club, 'name' | 'description' | 'isPrivate'>) {
    const club = await actions.create({ ...data, ownerId: userId })
    await load()
    return club
  }

  async function join(inviteCode: string) {
    await actions.join(inviteCode, userId)
    await load()
  }

  return { clubs, loading, error, refresh: load, create, join }
}
