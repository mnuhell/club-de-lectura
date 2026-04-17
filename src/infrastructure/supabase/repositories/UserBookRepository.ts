import type { BookStatus, UserBook, UserBookWithDetails } from '../../../domain'
import type { IUserBookRepository } from '../../../repositories'
import { supabase } from '../client'
import type { Database } from '../types'

type UserBookRow = Database['public']['Tables']['user_books']['Row']
type BookRow = Database['public']['Tables']['books']['Row']

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

function mapBook(row: BookRow) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    coverUrl: row.cover_url,
    description: row.description,
    pageCount: row.page_count,
    publishedYear: row.published_year,
    externalId: row.external_id,
    externalSource: row.external_source,
    createdAt: row.created_at,
  }
}

export const UserBookRepository: IUserBookRepository = {
  async getByUser(userId, status?: BookStatus) {
    let query = supabase.from('user_books').select('*, book:books(*)').eq('user_id', userId)
    if (status) query = query.eq('status', status)
    const { data, error } = await query.order('updated_at', { ascending: false })
    if (error) throw new Error('No se pudo cargar tu biblioteca')
    return data.map(row => ({
      ...mapUserBook(row as unknown as UserBookRow),
      book: mapBook(row.book as unknown as BookRow),
    })) as UserBookWithDetails[]
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
      .select('*, book:books(*)')
      .single()
    if (error) throw new Error('No se pudo actualizar tu biblioteca')
    return {
      ...mapUserBook(data as unknown as UserBookRow),
      book: mapBook((data as unknown as { book: BookRow }).book),
    } as UserBookWithDetails
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
