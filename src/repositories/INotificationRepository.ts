import type { NotificationWithDetails } from '../domain'

export interface INotificationRepository {
  getForUser(userId: string, limit?: number): Promise<NotificationWithDetails[]>
  markAllRead(userId: string): Promise<void>
}
