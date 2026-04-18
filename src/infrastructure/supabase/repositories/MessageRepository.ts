import { supabase } from '../client'
import type { IMessageRepository } from '../../../repositories/IMessageRepository'
import type { Message } from '../../../domain/Message'

function mapMessage(row: {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}): Message {
  return {
    id: row.id,
    matchId: row.match_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
  }
}

export const MessageRepository: IMessageRepository = {
  async getMessages(matchId) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })
    if (error) throw new Error('No se pudieron cargar los mensajes')
    return (data ?? []).map(mapMessage)
  },

  async sendMessage(matchId, senderId, content) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: senderId, content })
      .select()
      .single()
    if (error) throw new Error('No se pudo enviar el mensaje')
    return mapMessage(data)
  },

  async markAsRead(matchId, userId) {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('match_id', matchId)
      .neq('sender_id', userId)
      .is('read_at', null)
  },
}
