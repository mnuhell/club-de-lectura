import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

Deno.serve(async req => {
  const { record } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Get the match to find the recipient
  const { data: match } = await supabase
    .from('reader_matches')
    .select('user_1_id, user_2_id')
    .eq('id', record.match_id)
    .single()

  if (!match) return new Response('match not found', { status: 404 })

  const recipientId =
    match.user_1_id === record.sender_id ? match.user_2_id : match.user_1_id

  // Get recipient push token + sender name
  const [{ data: recipient }, { data: sender }] = await Promise.all([
    supabase.from('profiles').select('push_token').eq('id', recipientId).single(),
    supabase.from('profiles').select('full_name').eq('id', record.sender_id).single(),
  ])

  const token = recipient?.push_token
  if (!token || !token.startsWith('ExponentPushToken')) {
    return new Response('no valid push token', { status: 200 })
  }

  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: token,
      title: sender?.full_name ?? 'Nuevo mensaje',
      body: record.content.length > 100 ? record.content.slice(0, 97) + '…' : record.content,
      data: { matchId: record.match_id, screen: 'chat' },
      sound: 'default',
    }),
  })

  return new Response('ok', { status: 200 })
})
