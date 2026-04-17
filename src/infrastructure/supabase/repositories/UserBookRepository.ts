import { supabase } from '../client'
import type { IUserBookRepository } from '../../../repositories'
import type { UserBook, BookStatus } from '../../../domain'
import type { Database } from '../types'

type UserBookRow = Database['public']['Tables']['user_books']['Row']

function mapUserBook(row: UserBookRow): UserBook {
  return {
    userId: row.user_id,
    bookId: row.book_id,
    status: row.status,
    rating: row.rating,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const UserBookRepository: IUserBookRepository = {
  async getByUser(userId, status?: BookStatus) {
    let query = supabase.from('user_books').select('*').eq('user_id', userId)
    if (status) query = query.eq('status', status)
    const { data, error } = await query.order('updated_at', { ascending: false })
    if (error) throw new Error('No se pudo cargar tu biblioteca')
    return data.map(mapUserBook)
  },

  async upsert(fields) {
    const { data, error } = await supabase
      .from('user_books')
      .upsert({
        user_id: fields.userId,
        book_id: fields.bookId,
        status: fields.status,
        rating: fields.rating,
        started_at: fields.startedAt,
        finished_at: fields.finishedAt,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw new Error('No se pudo actualizar tu biblioteca')
    return mapUserBook(data)
  },

  async remove(userId, bookId) {
    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId)
    if (error) throw new Error('No se pudo eliminar el libro de tu biblioteca')
  },
}
