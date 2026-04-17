import { supabase } from './client';
import type { Database } from './types';

type Post = Database['public']['Tables']['posts']['Row'];
type ReadingSession = Database['public']['Tables']['reading_sessions']['Row'];

export function subscribeToClubPosts(clubId: string, onInsert: (post: Post) => void) {
  return supabase
    .channel(`club-posts-${clubId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'posts', filter: `club_id=eq.${clubId}` },
      payload => onInsert(payload.new as Post),
    )
    .subscribe();
}

export function subscribeToReadingSession(
  sessionId: string,
  onUpdate: (session: ReadingSession) => void,
) {
  return supabase
    .channel(`reading-session-${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'reading_sessions',
        filter: `id=eq.${sessionId}`,
      },
      payload => onUpdate(payload.new as ReadingSession),
    )
    .subscribe();
}

export function unsubscribe(channel: ReturnType<typeof supabase.channel>) {
  supabase.removeChannel(channel);
}
