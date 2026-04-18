import type { ReaderMatch, ReaderProfile } from '../../../domain/ReaderProfile'
import type { IMatchingRepository } from '../../../repositories/IMatchingRepository'
import { supabase } from '../client'

export const MatchingRepository: IMatchingRepository = {
  async getDiscoverableReaders(userId, city) {
    const { data, error } = await supabase.rpc('get_discoverable_readers', {
      p_user_id: userId,
      p_city: city ?? null,
      p_limit: 50,
    })
    if (error) throw new Error('No se pudieron cargar los lectores')
    return (data ?? []).map(
      (row: {
        id: string
        full_name: string
        city: string | null
        reader_bio: string | null
        genres: string[] | null
        shared_genre_count: number
      }): ReaderProfile => ({
        id: row.id,
        fullName: row.full_name,
        city: row.city ?? undefined,
        readerBio: row.reader_bio ?? undefined,
        genres: row.genres ?? [],
        sharedGenreCount: row.shared_genre_count,
      }),
    )
  },

  async swipeReader(swiperId, swipedId, action) {
    const { data, error } = await supabase.rpc('swipe_reader', {
      p_swiper_id: swiperId,
      p_swiped_id: swipedId,
      p_action: action,
    })
    if (error) throw new Error('No se pudo registrar el swipe')
    return data as string | null
  },

  async getMatches(userId) {
    const { data, error } = await supabase.rpc('get_my_matches', {
      p_user_id: userId,
    })
    if (error) throw new Error('No se pudieron cargar tus coincidencias')
    return (data ?? []).map(
      (row: {
        match_id: string
        matched_at: string
        reader_id: string
        full_name: string
        city: string | null
        reader_bio: string | null
        avatar_url: string | null
        genres: string[] | null
      }): ReaderMatch => ({
        matchId: row.match_id,
        matchedAt: row.matched_at,
        reader: {
          id: row.reader_id,
          fullName: row.full_name,
          city: row.city ?? undefined,
          readerBio: row.reader_bio ?? undefined,
          avatarUrl: row.avatar_url ?? undefined,
          genres: row.genres ?? [],
        },
      }),
    )
  },

  async getMyGenres(userId) {
    const { data, error } = await supabase
      .from('reader_genres')
      .select('genre')
      .eq('user_id', userId)
    if (error) throw new Error('No se pudieron cargar tus géneros')
    return (data ?? []).map(r => r.genre)
  },

  async setMyGenres(userId, genres) {
    const { error: delError } = await supabase.from('reader_genres').delete().eq('user_id', userId)
    if (delError) throw new Error('Error al guardar tus géneros')
    if (genres.length === 0) return
    const rows = genres.map(genre => ({ user_id: userId, genre }))
    const { error: insError } = await supabase.from('reader_genres').insert(rows)
    if (insError) throw new Error('Error al guardar tus géneros')
  },

  async updateReaderProfile(userId, data) {
    const update: {
      city?: string
      reader_bio?: string
      matching_enabled?: boolean
    } = {}
    if (data.city !== undefined) update.city = data.city
    if (data.readerBio !== undefined) update.reader_bio = data.readerBio
    if (data.matchingEnabled !== undefined) update.matching_enabled = data.matchingEnabled
    const { error } = await supabase.from('profiles').update(update).eq('id', userId)
    if (error) throw new Error('No se pudo actualizar tu perfil lector')
  },
}
