import { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { toast } from 'sonner'
import { useGetShuffledDeckQuery, useGetNextCardMutation } from '../api/deckApi'
import { deckInitialised, cardDrawn } from '../store/gameSlice'
import type { AppDispatch, RootState } from '../store'

const DECK_SIZE = 52

export function useDeck() {
  const dispatch = useDispatch<AppDispatch>()

  // Step 1: initialise a shuffled deck (once, on mount).
  const shuffle = useGetShuffledDeckQuery()
  // Step 2: draw one card per click — a mutation, fired imperatively.
  const [draw, drawState] = useGetNextCardMutation()

  const { deckId, drawnCards, valueMatches, suitMatches, remaining } =
    useSelector((state: RootState) => state.game)

  // Bind the game to the shuffled deck exactly once. The reducer is
  // write-once, so even if the query data ever changed, the game would
  // keep drawing from the original deck.
  useEffect(() => {
    if (shuffle.data) {
      dispatch(deckInitialised(shuffle.data))
    }
  }, [shuffle.data, dispatch])

  const drawnCount = drawnCards.length
  const isComplete = remaining === 0

  const drawCard = useCallback(async () => {
    // Guard: no deck yet, a draw already in flight (double-click), or
    // the deck is exhausted. Draws use the write-once deckId from game
    // state, never the query cache directly.
    if (!deckId || drawState.isLoading || remaining === 0) {
      return
    }
    try {
      const result = await draw(deckId).unwrap()
      dispatch(cardDrawn(result))
    } catch (err) {
      // A failed draw dispatches nothing, so game state stays
      // consistent — surface it as a transient toast and let the user
      // simply click again.
      toast.error(describeError(err))
    }
  }, [deckId, drawState.isLoading, remaining, draw, dispatch])

  const previousCard = drawnCards.at(-2) ?? null
  const currentCard = drawnCards.at(-1) ?? null

  const status: 'loading' | 'ready' | 'error' = shuffle.isError
    ? 'error'
    : !deckId
      ? 'loading'
      : 'ready'

  return {
    status,
    error: shuffle.isError ? describeError(shuffle.error) : null,
    // Draw failures are separate from deck-init failures: they surface
    // as toasts and the game stays playable — the user just retries.
    isDrawing: drawState.isLoading,
    previousCard,
    currentCard,
    drawnCount,
    totalCards: DECK_SIZE,
    remaining: remaining ?? DECK_SIZE,
    valueMatches,
    suitMatches,
    isComplete,
    drawCard,
  }
}

function describeError(error: unknown): string {
  if (error && typeof error === 'object') {
    // SerializedError — e.g. thrown from transformResponse or zod.
    if ('message' in error && typeof error.message === 'string') {
      return error.message
    }
    // FetchBaseQueryError — network / HTTP-level failure.
    if ('error' in error && typeof error.error === 'string') {
      return error.error
    }
    if ('status' in error) {
      return `Request failed with status ${String(error.status)}`
    }
  }
  return 'Unknown error'
}
