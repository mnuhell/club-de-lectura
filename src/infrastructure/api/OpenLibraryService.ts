import type { IBookSearchService } from './IBookSearchService'
import type { Book } from '../../domain'

interface OLDoc {
  key: string
  title: string
  author_name?: string[]
  isbn?: string[]
  cover_i?: number
  number_of_pages_median?: number
  first_publish_year?: number
}

function mapDoc(doc: OLDoc): Book {
  const workId = doc.key.replace('/works/', '')
  return {
    id: '',
    title: doc.title,
    author: doc.author_name?.[0] ?? 'Autor desconocido',
    isbn: doc.isbn?.[0] ?? null,
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : null,
    description: null,
    pageCount: doc.number_of_pages_median ?? null,
    publishedYear: doc.first_publish_year ?? null,
    externalId: workId,
    externalSource: 'openlibrary',
    createdAt: '',
  }
}

export const OpenLibraryService: IBookSearchService = {
  async search(query: string): Promise<Book[]> {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=key,title,author_name,isbn,cover_i,number_of_pages_median,first_publish_year&limit=20`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Error al buscar en Open Library')
    const json = await res.json()
    return (json.docs as OLDoc[]).map(mapDoc)
  },
}
