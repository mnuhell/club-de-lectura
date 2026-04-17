export interface IRealtimeService {
  subscribeToClubPosts(clubId: string, onEvent: () => void): () => void
  subscribeToReadingSession(sessionId: string, onEvent: () => void): () => void
}
