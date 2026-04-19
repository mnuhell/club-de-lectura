import { useCallback, useEffect, useState } from 'react'
import type { ClubWithDetails } from '../../domain'
import { ClubRepository } from '../../infrastructure/supabase/repositories'
import { discoverClubs, joinClub } from '../../usecases/clubs'

interface PublicClubsState {
  clubs: ClubWithDetails[]
  loading: boolean
  error: string | null
  city: string
  setCity: (city: string) => void
  refresh: () => void
  join: (inviteCode: string) => Promise<void>
}

export function usePublicClubs(userId: string, initialCity = ''): PublicClubsState {
  const [clubs, setClubs] = useState<ClubWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [city, setCity] = useState(initialCity)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await discoverClubs(ClubRepository, userId, city || undefined)
      setClubs(data)
    } catch {
      setError('No se pudieron cargar los clubs')
    } finally {
      setLoading(false)
    }
  }, [userId, city])

  useEffect(() => {
    load()
  }, [load])

  async function join(inviteCode: string) {
    await joinClub(ClubRepository, inviteCode, userId)
    await load()
  }

  return { clubs, loading, error, city, setCity, refresh: load, join }
}
