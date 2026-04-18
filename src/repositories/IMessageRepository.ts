import type { Message } from '@/src/domain/Message'

export interface IMessageRepository {
  getMessages(matchId: string): Promise<Message[]>
  sendMessage(matchId: string, senderId: string, content: string): Promise<Message>
  markAsRead(matchId: string, userId: string): Promise<void>
}
