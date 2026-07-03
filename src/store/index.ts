import { configureStore } from '@reduxjs/toolkit'
import { deckApi } from '../api/deckApi'
import gameReducer from './gameSlice'

export const store = configureStore({
  reducer: {
    [deckApi.reducerPath]: deckApi.reducer,
    game: gameReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(deckApi.middleware),
})

// NOTE: we deliberately do NOT call setupListeners(store.dispatch) —
// refetchOnFocus/refetchOnReconnect would silently replace the shuffled
// deck mid-game.

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
