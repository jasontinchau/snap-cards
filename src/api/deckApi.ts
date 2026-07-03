import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { z } from 'zod'
import type { Card } from '../types/card'

// Runtime validation at the network boundary: TypeScript types cannot
// check data arriving over the wire, so responses are parsed before
// they enter the store. `satisfies` keeps the schema and the Card type
// from drifting apart.
const cardSchema = z.object({
  code: z.string(),
  image: z.string(),
  images: z.object({
    svg: z.string(),
    png: z.string(),
  }),
  value: z.enum([
    'ACE',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'JACK',
    'QUEEN',
    'KING',
  ]),
  suit: z.enum(['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES']),
}) satisfies z.ZodType<Card>

const newDeckResponseSchema = z.object({
  success: z.boolean(),
  deck_id: z.string(),
  shuffled: z.boolean(),
  remaining: z.number(),
})

const drawResponseSchema = z.object({
  success: z.boolean(),
  deck_id: z.string(),
  cards: z.array(cardSchema),
  remaining: z.number(),
})

export interface DrawResult {
  card: Card
  remaining: number
}

export const deckApi = createApi({
  reducerPath: 'deckApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://deckofcardsapi.com/api/deck' }),
  // The shuffled deck is initialised exactly once per session and must
  // never be silently refetched — a new shuffle mid-game would corrupt
  // the game.
  keepUnusedDataFor: Infinity,
  refetchOnMountOrArgChange: false,
  endpoints: (builder) => ({
    // Requirement step 1: "Initialise a shuffled single deck of cards"
    getShuffledDeck: builder.query<string, void>({
      query: () => '/new/shuffle/?deck_count=1',
      transformResponse: (response: unknown) => {
        const parsed = newDeckResponseSchema.parse(response)
        if (!parsed.success) {
          throw new Error('Deck API reported failure while shuffling new deck')
        }
        return parsed.deck_id
      },
    }),
    // Requirement step 2: "draw a card from that deck" — one card per
    // button click. Drawing changes server state (remaining decreases),
    // so it is modelled as a mutation, never cached.
    getNextCard: builder.mutation<DrawResult, string>({
      query: (deckId) => `/${deckId}/draw/?count=1`,
      transformResponse: (response: unknown): DrawResult => {
        const parsed = drawResponseSchema.parse(response)
        if (!parsed.success || parsed.cards.length === 0) {
          throw new Error('Deck API reported failure while drawing a card')
        }
        return { card: parsed.cards[0], remaining: parsed.remaining }
      },
    }),
  }),
})

export const { useGetShuffledDeckQuery, useGetNextCardMutation } = deckApi
