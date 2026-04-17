// @jest-environment node
import { createRealtimeManager } from '../usecases/realtime'
import type { IRealtimeService } from '../infrastructure/supabase/IRealtimeService'

jest.mock('../infrastructure/supabase/repositories', () => ({}))

const makeService = (overrides: Partial<IRealtimeService> = {}): IRealtimeService => ({
  subscribeToClubPosts: jest.fn().mockReturnValue(jest.fn()),
  subscribeToReadingSession: jest.fn().mockReturnValue(jest.fn()),
  ...overrides,
})

// --- createRealtimeManager ---

test('subscribeToClubs subscribes to each club', () => {
  const service = makeService()
  const manager = createRealtimeManager(service)

  manager.subscribeToClubs(['club-1', 'club-2'], jest.fn())

  expect(service.subscribeToClubPosts).toHaveBeenCalledTimes(2)
  expect(service.subscribeToClubPosts).toHaveBeenCalledWith('club-1', expect.any(Function))
  expect(service.subscribeToClubPosts).toHaveBeenCalledWith('club-2', expect.any(Function))
})

test('subscribeToClubs calls onEvent when a new post arrives', () => {
  const onEvent = jest.fn()
  let capturedCallback: () => void = () => {}
  const service = makeService({
    subscribeToClubPosts: jest.fn().mockImplementation((_id, cb) => {
      capturedCallback = cb
      return jest.fn()
    }),
  })
  const manager = createRealtimeManager(service)

  manager.subscribeToClubs(['club-1'], onEvent)
  capturedCallback()

  expect(onEvent).toHaveBeenCalledTimes(1)
})

test('unsubscribeAll calls all unsubscribe functions', () => {
  const unsub1 = jest.fn()
  const unsub2 = jest.fn()
  const service = makeService({
    subscribeToClubPosts: jest.fn()
      .mockReturnValueOnce(unsub1)
      .mockReturnValueOnce(unsub2),
  })
  const manager = createRealtimeManager(service)

  manager.subscribeToClubs(['club-1', 'club-2'], jest.fn())
  manager.unsubscribeAll()

  expect(unsub1).toHaveBeenCalled()
  expect(unsub2).toHaveBeenCalled()
})

test('unsubscribeAll is safe to call when no subscriptions exist', () => {
  const service = makeService()
  const manager = createRealtimeManager(service)

  expect(() => manager.unsubscribeAll()).not.toThrow()
})

test('subscribeToSession subscribes to a reading session', () => {
  const service = makeService()
  const manager = createRealtimeManager(service)

  manager.subscribeToSession('session-1', jest.fn())

  expect(service.subscribeToReadingSession).toHaveBeenCalledWith('session-1', expect.any(Function))
})

test('subscribeToSession calls onEvent when session updates', () => {
  const onEvent = jest.fn()
  let capturedCallback: () => void = () => {}
  const service = makeService({
    subscribeToReadingSession: jest.fn().mockImplementation((_id, cb) => {
      capturedCallback = cb
      return jest.fn()
    }),
  })
  const manager = createRealtimeManager(service)

  manager.subscribeToSession('session-1', onEvent)
  capturedCallback()

  expect(onEvent).toHaveBeenCalledTimes(1)
})

test('subscribing twice to same clubs replaces previous subscriptions', () => {
  const unsub1 = jest.fn()
  const service = makeService({
    subscribeToClubPosts: jest.fn()
      .mockReturnValueOnce(unsub1)
      .mockReturnValue(jest.fn()),
  })
  const manager = createRealtimeManager(service)

  manager.subscribeToClubs(['club-1'], jest.fn())
  manager.subscribeToClubs(['club-1'], jest.fn())

  expect(unsub1).toHaveBeenCalled()
})
