import { useState, useCallback, useEffect, useRef } from 'react'
import { MessageRepository } from '@/src/infrastructure/supabase/repositories/MessageRepository'
import { supabase } from '@/src/infrastructure/supabase/client'
import type { Message } from '@/src/domain/Message'

export function useChat(matchId: string, userId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const load = useCallback(async () => {
    if (!matchId || !userId) return
    setLoading(true)
    try {
      const data = await MessageRepository.getMessages(matchId)
      setMessages(data)
      await MessageRepository.markAsRead(matchId, userId)
    } finally {
      setLoading(false)
    }
  }, [matchId, userId])

  useEffect(() => {
    load()
  }, [load])

  // Realtime subscription
  useEffect(() => {
    if (!matchId) return

    const channel = supabase
      .channel(`messages:${matchId}:${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        payload => {
          const row = payload.new as {
            id: string
            match_id: string
            sender_id: string
            content: string
            created_at: string
            read_at: string | null
          }
          const msg: Message = {
            id: row.id,
            matchId: row.match_id,
            senderId: row.sender_id,
            content: row.content,
            createdAt: row.created_at,
            readAt: row.read_at ?? undefined,
          }
          setMessages(prev => {
            if (prev.find(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          // Mark as read if sent by the other person
          if (row.sender_id !== userId) {
            MessageRepository.markAsRead(matchId, userId)
          }
        },
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId, userId])

  const send = useCallback(
    async (content: string) => {
      if (!content.trim() || sending) return
      setSending(true)
      try {
        const msg = await MessageRepository.sendMessage(matchId, userId, content.trim())
        // Optimistic: add immediately (realtime will dedupe)
        setMessages(prev => (prev.find(m => m.id === msg.id) ? prev : [...prev, msg]))
      } finally {
        setSending(false)
      }
    },
    [matchId, userId, sending],
  )

  return { messages, loading, sending, send }
}
