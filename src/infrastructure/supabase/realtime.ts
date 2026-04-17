import { supabase } from './client'
import type { IRealtimeService } from './IRealtimeService'

export const SupabaseRealtimeService: IRealtimeService = {
  subscribeToClubPosts(clubId, onEvent) {
    const channel = supabase
      .channel(`club-posts-${clubId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts', filter: `club_id=eq.${clubId}` },
        () => onEvent(),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  },

  subscribeToReadingSession(sessionId, onEvent) {
    const channel = supabase
      .channel(`reading-session-${sessionId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reading_sessions', filter: `id=eq.${sessionId}` },
        () => onEvent(),
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  },
}
