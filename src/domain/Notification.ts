import type { User } from './User'

export type NotificationType = 'reaction'

export type Notification = {
  id: string
  userId: string
  actorId: string
  postId: string
  type: NotificationType
  emoji: string | null
  read: boolean
  createdAt: string
}

export type NotificationWithDetails = Notification & {
  actor: User
}
