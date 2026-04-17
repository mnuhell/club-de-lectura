import { useCallback, useEffect, useRef, useState } from 'react'
import type { IClubRepository } from '../../repositories'
import type { ClubMember, ClubWithDetails } from '../../domain'
import { ClubRepository } from '../../infrastructure/supabase/repositories'
import { SupabaseRealtimeService } from '../../infrastructure/supabase/realtime'
import { getClubDetail, getClubMembers, leaveClub } from '../../usecases/clubs'
import { createRealtimeManager } from '../../usecases/realtime'

export function createUseClubDetailActions(repo: IClubRepository) {
  return {
    fetchDetail: (id: string, userId: string) => getClubDetail(repo, id, userId),
    fetchMembers: (clubId: string) => getClubMembers(repo, clubId),
    leave: (clubId: string, userId: string) => leaveClub(repo, clubId, userId),
  }
}

interface ClubDetailState {
  club: ClubWithDetails | null
  members: ClubMember[]
  loading: boolean
  error: string | null
  leave: () => Promise<void>
  refresh: () => void
}

const _clubDetailActions = createUseClubDetailActions(ClubRepository)

export function useClubDetail(id: string, userId: string): ClubDetailState {
  const [club, setClub] = useState<ClubWithDetails | null>(null)
  const [members, setMembers] = useState<ClubMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const realtimeManager = useRef(createRealtimeManager(SupabaseRealtimeService))

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [detail, memberList] = await Promise.all([
        _clubDetailActions.fetchDetail(id, userId),
        _clubDetailActions.fetchMembers(id).catch(e => {
          console.error('[useClubDetail] fetchMembers error:', e)
          return []
        }),
      ])
      setClub(detail ? { ...detail, memberCount: memberList.length } : null)
      setMembers(memberList)
    } catch (e) {
      console.error('[useClubDetail] error:', e)
      setError('No se pudo cargar el club')
    } finally {
      setLoading(false)
    }
  }, [id, userId])

  useEffect(() => {
    const manager = realtimeManager.current
    if (id && userId) {
      load()
      manager.subscribeToClubs([id], load)
    }
    return () => manager.unsubscribeAll()
  }, [id, userId, load])

  async function leave() {
    await _clubDetailActions.leave(id, userId)
  }

  return { club, members, loading, error, leave, refresh: load }
}
