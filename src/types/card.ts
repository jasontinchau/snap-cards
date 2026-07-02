export type CardValue =
  | 'ACE'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'JACK'
  | 'QUEEN'
  | 'KING'

export type CardSuit = 'HEARTS' | 'DIAMONDS' | 'CLUBS' | 'SPADES'

export interface Card {
  code: string
  image: string
  images: {
    svg: string
    png: string
  }
  value: CardValue
  suit: CardSuit
}

export interface DeckState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  deckId: string | null
  cards: Card[]
  drawnCount: number
  valueMatches: number
  suitMatches: number
  error: string | null
}

export type DeckAction =
  | { type: 'FETCH_STARTED' }
  | { type: 'DECK_LOADED'; deckId: string; cards: Card[] }
  | { type: 'FETCH_FAILED'; error: string }
  | { type: 'CARD_DRAWN' }
