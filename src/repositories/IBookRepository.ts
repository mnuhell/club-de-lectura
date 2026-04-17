import type { Book } from '../domain'

export interface IBookRepository {
  getById(id: string): Promise<Book | null>
  search(query: string): Promise<Book[]>
  upsert(book: Omit<Book, 'id' | 'createdAt'>): Promise<Book>
}
