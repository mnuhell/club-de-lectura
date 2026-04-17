import type { IRealtimeService } from '../infrastructure/supabase/IRealtimeService'

export interface RealtimeManager {
  subscribeToClubs(clubIds: string[], onEvent: () => void): void
  subscribeToSession(sessionId: string, onEvent: () => void): void
  unsubscribeAll(): void
}

export function createRealtimeManager(service: IRealtimeService): RealtimeManager {
  let unsubscribers: Array<() => void> = []

  return {
    subscribeToClubs(clubIds, onEvent) {
      unsubscribers.forEach(fn => fn())
      unsubscribers = clubIds.map(id => service.subscribeToClubPosts(id, onEvent))
    },

    subscribeToSession(sessionId, onEvent) {
      const unsub = service.subscribeToReadingSession(sessionId, onEvent)
      unsubscribers.push(unsub)
    },

    unsubscribeAll() {
      unsubscribers.forEach(fn => fn())
      unsubscribers = []
    },
  }
}
