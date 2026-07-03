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
