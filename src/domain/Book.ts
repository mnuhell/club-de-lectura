export type ExternalSource = 'openlibrary' | 'google'

export type Book = {
  id: string
  title: string
  author: string
  isbn: string | null
  coverUrl: string | null
  description: string | null
  pageCount: number | null
  publishedYear: number | null
  externalId: string | null
  externalSource: ExternalSource | null
  createdAt: string
}
