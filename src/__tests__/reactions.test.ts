// @jest-environment node

jest.mock('../infrastructure/supabase/repositories', () => ({}))

import type { ReactionSummary } from '../domain'
import type { IReactionRepository } from '../repositories'
import { computeReactionToggle, createReactionActions } from '../usecases/reactions'

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeReaction(overrides: Partial<ReactionSummary> = {}): ReactionSummary {
  return { emoji: '📚', count: 1, reactedByMe: false, ...overrides }
}

function makeRepo(overrides: Partial<IReactionRepository> = {}): IReactionRepository {
  return {
    getByPost: jest.fn().mockResolvedValue([]),
    toggle: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

// ─── computeReactionToggle ───────────────────────────────────────────────────

describe('computeReactionToggle', () => {
  describe('emoji nuevo (no existe en la lista)', () => {
    it('agrega la reacción con count 1 y reactedByMe true', () => {
      const result = computeReactionToggle([], '❤️')
      expect(result).toEqual([{ emoji: '❤️', count: 1, reactedByMe: true }])
    })

    it('conserva las reacciones existentes', () => {
      const existing = [makeReaction({ emoji: '📚', count: 3, reactedByMe: true })]
      const result = computeReactionToggle(existing, '❤️')
      expect(result).toHaveLength(2)
      expect(result.find(r => r.emoji === '📚')).toEqual(existing[0])
    })
  })

  describe('emoji existente que YO ya reaccioné (toggle off)', () => {
    it('elimina la entrada si count era 1', () => {
      const reactions = [makeReaction({ emoji: '❤️', count: 1, reactedByMe: true })]
      const result = computeReactionToggle(reactions, '❤️')
      expect(result).toHaveLength(0)
    })

    it('decrementa count y pone reactedByMe false si count > 1', () => {
      const reactions = [makeReaction({ emoji: '❤️', count: 4, reactedByMe: true })]
      const result = computeReactionToggle(reactions, '❤️')
      expect(result).toEqual([{ emoji: '❤️', count: 3, reactedByMe: false }])
    })

    it('no toca otras reacciones', () => {
      const reactions = [
        makeReaction({ emoji: '❤️', count: 2, reactedByMe: true }),
        makeReaction({ emoji: '😂', count: 5, reactedByMe: false }),
      ]
      const result = computeReactionToggle(reactions, '❤️')
      expect(result.find(r => r.emoji === '😂')).toEqual(reactions[1])
    })
  })

  describe('emoji existente que yo NO reaccioné (toggle on)', () => {
    it('incrementa count y pone reactedByMe true', () => {
      const reactions = [makeReaction({ emoji: '👏', count: 2, reactedByMe: false })]
      const result = computeReactionToggle(reactions, '👏')
      expect(result).toEqual([{ emoji: '👏', count: 3, reactedByMe: true }])
    })

    it('no toca otras reacciones', () => {
      const reactions = [
        makeReaction({ emoji: '👏', count: 1, reactedByMe: false }),
        makeReaction({ emoji: '💡', count: 1, reactedByMe: true }),
      ]
      const result = computeReactionToggle(reactions, '👏')
      expect(result.find(r => r.emoji === '💡')).toEqual(reactions[1])
    })
  })

  describe('inmutabilidad', () => {
    it('devuelve un nuevo array, no muta el original', () => {
      const reactions = [makeReaction({ emoji: '📚', count: 1, reactedByMe: false })]
      const original = [...reactions]
      computeReactionToggle(reactions, '📚')
      expect(reactions).toEqual(original)
    })

    it('los objetos de otras reacciones son referencias distintas solo cuando es necesario', () => {
      const reactions = [
        makeReaction({ emoji: '📚', count: 2, reactedByMe: true }),
        makeReaction({ emoji: '❤️', count: 1, reactedByMe: false }),
      ]
      const result = computeReactionToggle(reactions, '📚')
      // el objeto de ❤️ no debería cambiar su contenido
      expect(result.find(r => r.emoji === '❤️')).toEqual(reactions[1])
    })
  })
})

// ─── createReactionActions ───────────────────────────────────────────────────

describe('createReactionActions', () => {
  it('llama a repo.toggle con los parámetros correctos', async () => {
    const repo = makeRepo()
    const actions = createReactionActions(repo)
    await actions.toggle('post-1', 'user-1', '📚')
    expect(repo.toggle).toHaveBeenCalledWith({
      postId: 'post-1',
      userId: 'user-1',
      emoji: '📚',
    })
  })

  it('propaga el error si repo.toggle falla', async () => {
    const repo = makeRepo({ toggle: jest.fn().mockRejectedValue(new Error('network error')) })
    const actions = createReactionActions(repo)
    await expect(actions.toggle('post-1', 'user-1', '❤️')).rejects.toThrow('network error')
  })

  it('funciona con cualquier emoji del set curado', async () => {
    const repo = makeRepo()
    const actions = createReactionActions(repo)
    const emojis = ['📚', '❤️', '😂', '👏', '🤔', '💡']
    for (const emoji of emojis) {
      await actions.toggle('post-1', 'user-1', emoji)
    }
    expect(repo.toggle).toHaveBeenCalledTimes(emojis.length)
  })
})
