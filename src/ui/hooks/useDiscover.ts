import { useState, useCallback, useEffect, useRef } from 'react'
import { useFocusEffect } from 'expo-router'
import { MatchingRepository } from '@/src/infrastructure/supabase/repositories/MatchingRepository'
import { createMatchingActions } from '@/src/usecases/matching'
import type { ReaderProfile, ReaderMatch } from '@/src/domain/ReaderProfile'

const actions = createMatchingActions(MatchingRepository)

export function useDiscover(userId: string, city?: string) {
  const [readers, setReaders] = useState<ReaderProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newMatch, setNewMatch] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)
    try {
      const data = await actions.getDiscoverableReaders(userId, city)
      setReaders(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los lectores')
    } finally {
      setLoading(false)
    }
  }, [userId, city])

  useEffect(() => {
    load()
  }, [load])

  const like = useCallback(
    async (swipedId: string) => {
      setReaders((prev) => prev.filter((r) => r.id !== swipedId))
      const matchId = await actions.like(userId, swipedId)
      if (matchId) setNewMatch(matchId)
    },
    [userId]
  )

  const pass = useCallback(
    async (swipedId: string) => {
      setReaders((prev) => prev.filter((r) => r.id !== swipedId))
      await actions.pass(userId, swipedId)
    },
    [userId]
  )

  const clearNewMatch = useCallback(() => setNewMatch(null), [])

  return { readers, loading, error, newMatch, like, pass, clearNewMatch, reload: load }
}

export function useMatches(userId: string) {
  const [matches, setMatches] = useState<ReaderMatch[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    try {
      const data = await actions.getMatches(userId)
      setMatches(data)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  return { matches, loading, reload: load }
}

export function useReaderPreferences(userId: string) {
  const [genres, setGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchGenres = useCallback(() => {
    if (!userId) return
    setLoading(true)
    actions
      .getMyGenres(userId)
      .then((g) => setGenres(g))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [userId])

  // Reload every time the screen comes into focus (e.g. after setup modal closes)
  useFocusEffect(
    useCallback(() => {
      fetchGenres()
    }, [fetchGenres])
  )

  const saveGenres = useCallback(
    async (selected: string[]) => {
      setSaving(true)
      try {
        await actions.setMyGenres(userId, selected)
        setGenres(selected)
      } finally {
        setSaving(false)
      }
    },
    [userId]
  )

  const saveReaderProfile = useCallback(
    async (data: { city?: string; readerBio?: string; matchingEnabled?: boolean }) => {
      setSaving(true)
      try {
        await actions.updateReaderProfile(userId, data)
      } finally {
        setSaving(false)
      }
    },
    [userId]
  )

  return { genres, loading, saving, saveGenres, saveReaderProfile }
}
