import type { IBookSearchService } from './IBookSearchService'
import type { Book } from '../../domain'

interface GBVolume {
  id: string
  volumeInfo: {
    title: string
    authors?: string[]
    industryIdentifiers?: { type: string; identifier: string }[]
    imageLinks?: { thumbnail?: string; smallThumbnail?: string }
    description?: string
    pageCount?: number
    publishedDate?: string
  }
}

function mapVolume(vol: GBVolume): Book {
  const info = vol.volumeInfo
  const isbn =
    info.industryIdentifiers?.find(i => i.type === 'ISBN_13')?.identifier ??
    info.industryIdentifiers?.find(i => i.type === 'ISBN_10')?.identifier ??
    null
  const thumbnail = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail ?? null
  const coverUrl = thumbnail ? thumbnail.replace('http://', 'https://') : null
  const year = info.publishedDate ? parseInt(info.publishedDate.slice(0, 4), 10) : null

  return {
    id: '',
    title: info.title,
    author: info.authors?.[0] ?? 'Autor desconocido',
    isbn,
    coverUrl,
    description: info.description ?? null,
    pageCount: info.pageCount ?? null,
    publishedYear: year && !isNaN(year) ? year : null,
    externalId: vol.id,
    externalSource: 'google',
    createdAt: '',
  }
}

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY ?? ''

export const GoogleBooksService: IBookSearchService = {
  async search(query: string): Promise<Book[]> {
    const key = API_KEY ? `&key=${API_KEY}` : ''
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&langRestrict=es${key}`
    const res = await fetch(url)
    if (!res.ok) throw new Error('Error al buscar en Google Books')
    const json = await res.json()
    if (!json.items) return []
    return (json.items as GBVolume[]).map(mapVolume)
  },
}
