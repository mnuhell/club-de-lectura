import type { Book } from '../../domain'

export interface IBookSearchService {
  search(query: string): Promise<Book[]>
}
