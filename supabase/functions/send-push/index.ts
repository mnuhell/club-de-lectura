import { createClient } from '@supabase/supabase-js'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface MessageRecord {
  id: string
  match_id: string
  sender_id: string
  content: string
}

interface Match {
  user_1_id: string
  user_2_id: string
}

interface Profile {
  push_token?: string | null
  display_name?: string | null
  username?: string | null
}

Deno.serve(async (req: Request) => {
  try {
    const body = await req.json()
    const record = body.record as MessageRecord
    if (!record) return new Response('no record', { status: 400 })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: match } = await supabase
      .from('reader_matches')
      .select('user_1_id, user_2_id')
      .eq('id', record.match_id)
      .single<Match>()

    if (!match) return new Response('match not found', { status: 404 })

    const recipientId = match.user_1_id === record.sender_id ? match.user_2_id : match.user_1_id

    const [{ data: recipient }, { data: sender }] = await Promise.all([
      supabase.from('profiles').select('push_token').eq('id', recipientId).single<Profile>(),
      supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', record.sender_id)
        .single<Profile>(),
    ])

    const token = recipient?.push_token
    if (!token || !token.startsWith('ExponentPushToken')) {
      return new Response('no valid push token', { status: 200 })
    }

    const senderName = sender?.display_name ?? sender?.username ?? 'Alguien'
    const bodyText =
      record.content.length > 100 ? record.content.slice(0, 97) + '…' : record.content

    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        title: senderName,
        body: bodyText,
        data: { matchId: record.match_id, screen: 'chat' },
        sound: 'default',
      }),
    })

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('[send-push] error:', err)
    return new Response('error', { status: 500 })
  }
})
