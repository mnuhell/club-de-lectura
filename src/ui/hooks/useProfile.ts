import { useCallback, useEffect, useState } from 'react'
import type { IUserRepository } from '../../repositories'
import type { IUserBookRepository } from '../../repositories'
import type { IClubRepository } from '../../repositories'
import type { User } from '../../domain'
import { UserRepository } from '../../infrastructure/supabase/repositories'
import { UserBookRepository } from '../../infrastructure/supabase/repositories'
import { ClubRepository } from '../../infrastructure/supabase/repositories'
import { uploadAvatar } from '../../infrastructure/supabase/storage'
import { getProfile, updateProfile } from '../../usecases/profile'

export interface ProfileStats {
  booksRead: number
  booksReading: number
  clubCount: number
}

export function createUseProfileActions(
  userRepo: IUserRepository,
  userBookRepo: IUserBookRepository,
  clubRepo: IClubRepository,
) {
  return {
    fetchProfile: (userId: string) => getProfile(userRepo, userId),
    fetchStats: async (userId: string): Promise<ProfileStats> => {
      const [books, clubs] = await Promise.all([
        userBookRepo.getByUser(userId),
        clubRepo.getMyClubs(userId),
      ])
      return {
        booksRead: books.filter(b => b.status === 'read').length,
        booksReading: books.filter(b => b.status === 'reading').length,
        clubCount: clubs.length,
      }
    },
    update: (userId: string, data: { displayName: string; bio: string }) =>
      updateProfile(userRepo, userId, data),
    uploadAvatar: (userId: string, uri: string, contentType: string) =>
      uploadAvatar(userId, uri, contentType),
    updateAvatarUrl: (userId: string, avatarUrl: string) =>
      userRepo.update(userId, { avatarUrl }),
  }
}

interface ProfileState {
  user: User | null
  stats: ProfileStats
  loading: boolean
  error: string | null
  update: (data: { displayName: string; bio: string }) => Promise<void>
  changeAvatar: (uri: string, contentType: string) => Promise<void>
  refresh: () => void
}

export function useProfile(userId: string): ProfileState {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<ProfileStats>({ booksRead: 0, booksReading: 0, clubCount: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const actions = createUseProfileActions(UserRepository, UserBookRepository, ClubRepository)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [profile, profileStats] = await Promise.all([
        actions.fetchProfile(userId),
        actions.fetchStats(userId),
      ])
      setUser(profile)
      setStats(profileStats)
    } catch {
      setError('No se pudo cargar el perfil')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (userId) load()
  }, [userId, load])

  async function update(data: { displayName: string; bio: string }) {
    const updated = await actions.update(userId, data)
    setUser(updated)
  }

  async function changeAvatar(uri: string, contentType: string) {
    const avatarUrl = await actions.uploadAvatar(userId, uri, contentType)
    const updated = await actions.updateAvatarUrl(userId, avatarUrl)
    setUser(updated)
  }

  return { user, stats, loading, error, update, changeAvatar, refresh: load }
}
