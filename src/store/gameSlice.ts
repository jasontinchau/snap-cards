import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'
import { compareCards } from '../utils/matchLogic'
import type { Card } from '../types/card'
import type { DrawResult } from '../api/deckApi'

export interface GameState {
  // The deck this game is played against. Written exactly once when the
  // shuffle resolves; the reducer ignores any later write, so all 52
  // draws are guaranteed to come from the same deck.
  deckId: string | null
  // Full drawn history: needed for the previous-card display and for
  // the probability calculation (tracking what has already been drawn).
  drawnCards: Card[]
  valueMatches: number
  suitMatches: number
  // As reported by the API on the last draw; null until the first draw.
  remaining: number | null
}

const initialState: GameState = {
  deckId: null,
  drawnCards: [],
  valueMatches: 0,
  suitMatches: 0,
  remaining: null,
}

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    deckInitialised(state, action: PayloadAction<string>) {
      // Write-once: a game is bound to one deck for its whole lifetime.
      if (state.deckId === null) {
        state.deckId = action.payload
      }
    },
    cardDrawn(state, action: PayloadAction<DrawResult>) {
      const previous = state.drawnCards.at(-1) ?? null
      const { valueMatch, suitMatch } = compareCards(
        previous,
        action.payload.card,
      )
      state.drawnCards.push(action.payload.card)
      if (valueMatch) {
        state.valueMatches += 1
      }
      if (suitMatch) {
        state.suitMatches += 1
      }
      state.remaining = action.payload.remaining
    },
  },
})

export const { deckInitialised, cardDrawn } = gameSlice.actions
export default gameSlice.reducer
