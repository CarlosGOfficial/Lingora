import type { Item, LangCode } from '../content/types'

/*
 * Community decks (server/decks.ts). A deck card becomes an ordinary learnable item with
 * the id "<lang>-deck<deckId>-<cardId>", so the course lookups (courseFor, getItem once
 * registered), reviews and sync all treat it like any other word.
 */

export const DECK_LIMITS = { cards: 200, decks: 20, subscriptions: 50, title: 60, description: 300, rateAfter: 10 }
export const DECK_CARD_FIELDS = { target: 80, reading: 80, meaning: 120, example: 200 }

export type DeckCard = { id: number; target: string; reading: string | null; meaning: string; example: string | null }
export type DeckSummary = {
  id: number; lang: LangCode; title: string; description: string; public: boolean; hidden: boolean
  owner: { id: string; name: string }; mine: boolean; cardCount: number; subscribers: number
  rating: number | null; ratings: number; subscribed: boolean; updatedAt: string
}
export type DeckDetail = DeckSummary & { cards: DeckCard[]; shareCode?: string; myRating: number | null }
/** What the app keeps for decks you own or follow (GET /decks/mine). */
export type MyDeck = DeckSummary & { cards: DeckCard[] }

export const deckItemId = (lang: string, deckId: number, cardId: number) => `${lang}-deck${deckId}-${cardId}`
export const isDeckItem = (id: string) => /^[a-z]{2}-deck\d+-\d+$/.test(id)

/** A deck card as a course item (a word; its example sentence shown as a note). */
export function deckItem(deck: { id: number; lang: string }, c: DeckCard): Item {
  return {
    id: deckItemId(deck.lang, deck.id, c.id), kind: 'word', target: c.target,
    ...(c.reading ? { reading: c.reading } : {}), meaning: c.meaning,
    ...(c.example ? { note: c.example } : {}),
  }
}

/** The items of the decks you own or follow. */
export const itemsOfDecks = (decks: MyDeck[]): Item[] => decks.filter((d) => d.mine || d.subscribed).flatMap((d) => d.cards.map((c) => deckItem(d, c)))
