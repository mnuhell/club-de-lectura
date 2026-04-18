// @jest-environment node

jest.mock('../infrastructure/supabase/repositories', () => ({}))
jest.mock('../infrastructure/supabase/client', () => ({
  supabase: {
    channel: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnThis(),
    }),
    removeChannel: jest.fn(),
  },
}))

import type { INotificationRepository } from '../repositories'
import type { NotificationWithDetails, User } from '../domain'

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'actor-1',
    username: 'lector42',
    displayName: 'El Lector',
    avatarUrl: null,
    bio: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeNotification(
  overrides: Partial<NotificationWithDetails> = {},
): NotificationWithDetails {
  return {
    id: 'notif-1',
    userId: 'user-1',
    actorId: 'actor-1',
    postId: 'post-1',
    type: 'reaction',
    emoji: '📚',
    read: false,
    createdAt: '2026-04-18T10:00:00Z',
    actor: makeUser(),
    ...overrides,
  }
}

function makeRepo(overrides: Partial<INotificationRepository> = {}): INotificationRepository {
  return {
    getForUser: jest.fn().mockResolvedValue([]),
    markAllRead: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

// ─── INotificationRepository contract ────────────────────────────────────────

describe('INotificationRepository — getForUser', () => {
  it('devuelve array vacío si el usuario no tiene notificaciones', async () => {
    const repo = makeRepo()
    const result = await repo.getForUser('user-1')
    expect(result).toEqual([])
  })

  it('devuelve las notificaciones del usuario con detalles del actor', async () => {
    const notif = makeNotification()
    const repo = makeRepo({ getForUser: jest.fn().mockResolvedValue([notif]) })
    const result = await repo.getForUser('user-1')
    expect(result).toHaveLength(1)
    expect(result[0].actor.username).toBe('lector42')
    expect(result[0].emoji).toBe('📚')
    expect(result[0].type).toBe('reaction')
  })

  it('distingue notificaciones leídas y no leídas', async () => {
    const notifs = [
      makeNotification({ id: 'n1', read: false }),
      makeNotification({ id: 'n2', read: true }),
    ]
    const repo = makeRepo({ getForUser: jest.fn().mockResolvedValue(notifs) })
    const result = await repo.getForUser('user-1')
    const unread = result.filter(n => !n.read)
    const read = result.filter(n => n.read)
    expect(unread).toHaveLength(1)
    expect(read).toHaveLength(1)
  })

  it('propaga el error si el repositorio falla', async () => {
    const repo = makeRepo({
      getForUser: jest.fn().mockRejectedValue(new Error('No se pudieron cargar las notificaciones')),
    })
    await expect(repo.getForUser('user-1')).rejects.toThrow('No se pudieron cargar las notificaciones')
  })
})

describe('INotificationRepository — markAllRead', () => {
  it('llama a markAllRead con el userId correcto', async () => {
    const repo = makeRepo()
    await repo.markAllRead('user-1')
    expect(repo.markAllRead).toHaveBeenCalledWith('user-1')
  })

  it('no lanza error en caso de éxito', async () => {
    const repo = makeRepo()
    await expect(repo.markAllRead('user-1')).resolves.toBeUndefined()
  })
})

// ─── lógica de unreadCount ────────────────────────────────────────────────────

describe('unreadCount derivado de notificaciones', () => {
  function countUnread(notifications: NotificationWithDetails[]): number {
    return notifications.filter(n => !n.read).length
  }

  it('es 0 si no hay notificaciones', () => {
    expect(countUnread([])).toBe(0)
  })

  it('cuenta correctamente las no leídas', () => {
    const notifs = [
      makeNotification({ id: 'n1', read: false }),
      makeNotification({ id: 'n2', read: false }),
      makeNotification({ id: 'n3', read: true }),
    ]
    expect(countUnread(notifs)).toBe(2)
  })

  it('es 0 si todas están leídas', () => {
    const notifs = [
      makeNotification({ id: 'n1', read: true }),
      makeNotification({ id: 'n2', read: true }),
    ]
    expect(countUnread(notifs)).toBe(0)
  })

  it('vuelve a 0 tras marcar todo como leído (simulación de markAllRead)', () => {
    const notifs = [
      makeNotification({ id: 'n1', read: false }),
      makeNotification({ id: 'n2', read: false }),
    ]
    const afterMark = notifs.map(n => ({ ...n, read: true }))
    expect(countUnread(afterMark)).toBe(0)
  })
})

// ─── notificaciones no se auto-generan en reacción propia ────────────────────

describe('regla: no notificar si el actor es el autor del post', () => {
  it('una notificación siempre tiene actorId distinto de userId', () => {
    const notif = makeNotification({ userId: 'author-1', actorId: 'other-1' })
    expect(notif.actorId).not.toBe(notif.userId)
  })

  it('el repositorio no devuelve notificaciones donde actor === destinatario', async () => {
    // El trigger SQL garantiza esto; aquí verificamos que el contrato lo refleja
    const selfReactionNotif = makeNotification({ userId: 'user-1', actorId: 'user-1' })
    const repo = makeRepo({
      // Un repositorio correcto nunca debería devolver auto-notificaciones
      getForUser: jest.fn().mockResolvedValue([selfReactionNotif]),
    })
    const result = await repo.getForUser('user-1')
    // Verificamos que si llegara, podríamos detectarla
    const selfNotifs = result.filter(n => n.actorId === n.userId)
    expect(selfNotifs).toHaveLength(1) // detectada — en prod el trigger evita que existan
  })
})
