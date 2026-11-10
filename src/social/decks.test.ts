import { describe, expect, it } from 'vitest'
import { COURSES, allItems, courseFor, getItem, setExtraItems } from '../content'
import { buildDeckLearn } from '../engine/exercises'
import { deckItem, deckItemId, isDeckItem, itemsOfDecks, type MyDeck } from './decks'

const deck: MyDeck = {
  id: 12, lang: 'pt', title: 'Kitchen', description: '', public: true, hidden: false, owner: { id: 'u1', name: 'Ana' }, mine: false,
  cardCount: 5, subscribers: 3, rating: null, ratings: 0, subscribed: true, updatedAt: '2026-11-10T00:00:00Z',
  cards: ['garfo:fork', 'faca:knife', 'colher:spoon', 'prato:plate', 'copo:glass'].map((x, i) => ({ id: 100 + i, target: x.split(':')[0], reading: null, meaning: x.split(':')[1], example: i === 0 ? 'Me passa o garfo?' : null })),
}

describe('community deck items', () => {
  it('have ids the course lookups understand', () => {
    const id = deckItemId('pt', 12, 100)
    expect(id).toBe('pt-deck12-100')
    expect(isDeckItem(id)).toBe(true)
    expect(isDeckItem('pt-ola')).toBe(false)
    expect(courseFor(id)?.lang).toBe('pt')
  })
  it('become findable with getItem once registered, and gone when unfollowed', () => {
    setExtraItems(itemsOfDecks([deck]))
    expect(getItem('pt-deck12-100')).toMatchObject({ target: 'garfo', meaning: 'fork', note: 'Me passa o garfo?', kind: 'word' })
    setExtraItems(itemsOfDecks([{ ...deck, subscribed: false }]))
    expect(getItem('pt-deck12-100')).toBeUndefined()
  })
  it('make a learn session: an intro per new card, then both-way questions', () => {
    const items = deck.cards.map((c) => deckItem(deck, c))
    const ex = buildDeckLearn(items, [...items, ...allItems(COURSES.pt).filter((x) => x.kind === 'word')])
    expect(ex.filter((e) => e.type === 'intro')).toHaveLength(5)
    expect(ex.filter((e) => e.type === 'mcq')).toHaveLength(10)
    expect(ex.some((e) => e.type === 'match')).toBe(true)
    for (const e of ex) if (e.type === 'mcq') expect(e.options).toHaveLength(4)
  })
})
