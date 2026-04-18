export const LITERARY_GENRES = [
  'Ficción literaria',
  'Novela histórica',
  'Ciencia ficción',
  'Fantasía',
  'Thriller',
  'Romance',
  'Misterio',
  'Ensayo',
  'Poesía',
  'Biografía',
  'No ficción',
  'Terror',
  'Humor',
  'Clásicos',
  'Filosofía',
  'Viajes',
  'Cómics',
  'Juvenil',
] as const;

export type LiteraryGenre = (typeof LITERARY_GENRES)[number];

export interface ReaderProfile {
  id: string;
  fullName: string;
  city?: string;
  readerBio?: string;
  genres: string[];
  sharedGenreCount?: number;
  avatarUrl?: string; // only populated in matches, never in discovery
}

export interface ReaderMatch {
  matchId: string;
  matchedAt: string;
  reader: ReaderProfile & { avatarUrl?: string };
}
