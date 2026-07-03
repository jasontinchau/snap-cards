import type { Card } from '../types/card'

export interface MatchResult {
  valueMatch: boolean
  suitMatch: boolean
}

export function compareCards(
  previous: Card | null,
  current: Card | null,
): MatchResult {
  if (!previous || !current) {
    return { valueMatch: false, suitMatch: false }
  }
  return {
    valueMatch: previous.value === current.value,
    suitMatch: previous.suit === current.suit,
  }
}
