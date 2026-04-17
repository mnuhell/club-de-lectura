import { supabase } from '../client'
import type { IBookRepository } from '../../../repositories'
import type { Book } from '../../../domain'
import type { Database } from '../types'

type BookRow = Database['public']['Tables']['books']['Row']

function mapBook(row: BookRow): Book {
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

export const BookRepository: IBookRepository = {
  async getById(id) {
    const { data, error } = await supabase.from('books').select('*').eq('id', id).single()
    if (error) return null
    return mapBook(data)
  },

  async search(query) {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
      .limit(20)
    if (error) throw new Error('Error al buscar libros')
    return data.map(mapBook)
  },

  async upsert(book) {
    const { data, error } = await supabase
      .from('books')
      .upsert({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        cover_url: book.coverUrl,
        description: book.description,
        page_count: book.pageCount,
        published_year: book.publishedYear,
        external_id: book.externalId,
        external_source: book.externalSource,
      })
      .select()
      .single()
    if (error) throw new Error('No se pudo guardar el libro')
    return mapBook(data)
  },
}
