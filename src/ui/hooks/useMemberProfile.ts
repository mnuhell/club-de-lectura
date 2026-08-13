import { useCallback, useEffect, useState } from 'react'
import { MatchingRepository } from '@/src/infrastructure/supabase/repositories/MatchingRepository'
import { createMatchingActions } from '@/src/usecases/matching'
import type { ReaderProfile } from '@/src/domain/ReaderProfile'

const actions = createMatchingActions(MatchingRepository)

export function useMemberProfile(userId: string) {
  const [profile, setProfile] = useState<ReaderProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [matching, setMatching] = useState(false)
  const [matched, setMatched] = useState(false)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await actions.getMemberProfile(userId)
      setProfile(data)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  const like = useCallback(
    async (myUserId: string) => {
      setMatching(true)
      try {
        const matchId = await actions.like(myUserId, userId)
        setMatched(true)
        return matchId
      } finally {
        setMatching(false)
      }
    },
    [userId],
  )

  return { profile, loading, matching, matched, like }
}
