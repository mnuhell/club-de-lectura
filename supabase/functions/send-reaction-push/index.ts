import { createClient } from '@supabase/supabase-js'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface NotificationRecord {
  id: string
  user_id: string
  actor_id: string
  post_id: string
  type: string
  emoji: string | null
}

interface Profile {
  push_token?: string | null
  display_name?: string | null
  username?: string | null
}

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json()
    const record = body.record as NotificationRecord
    if (!record) return new Response('no record', { status: 400 })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const [{ data: recipient }, { data: actor }] = await Promise.all([
      supabase.from('profiles').select('push_token').eq('id', record.user_id).single<Profile>(),
      supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', record.actor_id)
        .single<Profile>(),
    ])

    const token = recipient?.push_token
    if (!token || !token.startsWith('ExponentPushToken')) {
      return new Response('no valid push token', { status: 200 })
    }

    const actorName = actor?.display_name ?? actor?.username ?? 'Alguien'
    const emoji = record.emoji ?? '👍'

    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        title: 'Folio',
        body: `${actorName} reaccionó con ${emoji} a tu comentario`,
        data: { postId: record.post_id, screen: 'feed' },
        sound: 'default',
      }),
    })

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[send-reaction-push] error:', err)
    return new Response('error', { status: 500 })
  }
})
