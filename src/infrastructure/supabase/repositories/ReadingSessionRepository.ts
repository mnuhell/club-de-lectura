import { supabase } from '../client'
import type { IReadingSessionRepository } from '../../../repositories'
import type { ReadingSession } from '../../../domain'
import type { Database } from '../types'

type SessionRow = Database['public']['Tables']['reading_sessions']['Row']

function mapSession(row: SessionRow): ReadingSession {
  return {
    id: row.id,
    clubId: row.club_id,
    bookId: row.book_id,
    currentChapter: row.current_chapter,
    currentPage: row.current_page,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
  }
}

export const ReadingSessionRepository: IReadingSessionRepository = {
  async getActiveByClub(clubId) {
    const { data, error } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('club_id', clubId)
      .is('finished_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single()
    if (error) return null
    return mapSession(data)
  },

  async create(fields) {
    const { data, error } = await supabase
      .from('reading_sessions')
      .insert({ club_id: fields.clubId, book_id: fields.bookId })
      .select()
      .single()
    if (error) throw new Error('No se pudo iniciar la sesión de lectura')
    return mapSession(data)
  },

  async updateProgress(id, fields) {
    console.log('[updateProgress] session id:', id)
    console.log('[updateProgress] fields:', fields)

    const { error } = await supabase
      .from('reading_sessions')
      .update({ current_chapter: fields.currentChapter, current_page: fields.currentPage })
      .eq('id', id)
    console.log('[updateProgress] update error:', error)

    const { data, error: readError } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('id', id)
      .single()
    console.log(
      '[updateProgress] after update, db has:',
      data?.current_chapter,
      '| expected:',
      fields.currentChapter,
    )

    if (readError) throw new Error('No se pudo leer el progreso actualizado')
    if (data.current_chapter !== fields.currentChapter) {
      throw new Error('Sin permisos para actualizar el progreso. Revisa las políticas RLS.')
    }
    return mapSession(data)
  },

  async finish(id) {
    const { error } = await supabase
      .from('reading_sessions')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      console.error('[ReadingSessionRepository] finish error:', error)
      throw new Error(error.message ?? 'No se pudo finalizar la sesión')
    }
    const { data, error: readError } = await supabase
      .from('reading_sessions')
      .select('*')
      .eq('id', id)
      .single()
    if (readError) throw new Error('No se pudo leer la sesión finalizada')
    return mapSession(data)
  },
}
