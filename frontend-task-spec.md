# Frontend Task — Project Spec

## Context

This is a take-home interview task for a Front-End Engineer (mid-level) role at **drivvn**, a B2B SaaS company in the automotive eCommerce space. Source repo for the task brief: https://github.com/drivvn/frontend-task

The company's production stack is TypeScript, React, Next.js, Nx — but they explicitly state in their job description: *"we are not precious about specific technology and are always looking to use the most appropriate technology to achieve our goals."* This task should demonstrate good judgment about tool fit, not just tool familiarity. Decisions below were made with that in mind, and should be followed rather than re-litigated by default — deviate only if there's a clear, documentable reason.

---

## Task Brief (from drivvn/frontend-task README)

Build a single page application that:
- Uses the Deck of Cards API (https://deckofcardsapi.com)
- Demonstrates user interaction, API integration, logic, image/text display, and testing
- Can use any framework or no framework — HTML/CSS/JS minimum

### Minimum Requirements
1. Initialise a shuffled single deck of cards
2. Provide a button that 'draws' a card from that deck
3. Display the newly drawn card's image, with the previous card's image to its left (placeholder if no previous card)
4. If the new card's **value** matches the previous card's value — display `SNAP VALUE!`
5. If the new card's **suit** matches the previous card's suit — display `SNAP SUIT!`
6. If neither matches — display no message
7. Once all 52 cards are drawn: remove the button, display total value matches and total suit matches
8. Write a suitable test suite covering these requirements

### Optional Requirements
- Counter showing current card number / cards remaining (e.g. "Card 12 of 52")
- Probability that the next card drawn will be a value or suit match (requires tracking drawn cards, calculated from theoretical remaining deck composition — NOT by peeking at any pre-fetched array of future cards)
- Animation and/or sound effects

### Submission Requirements
- Public GitHub repo link
- Test suite included
- README.md explaining how to run the app and its tests
- Optional: hosted link (Netlify/Vercel)
- Target time: 2-3 hours

---

## Deck of Cards API Reference

Base URL: `https://deckofcardsapi.com`

**Step 1 — Initialise a shuffled deck:**
```
GET /api/deck/new/shuffle/?deck_count=1
```
Response: `{ success, deck_id, shuffled: true, remaining: 52 }`

**Step 2 — Draw cards (using the deck_id from step 1):**
```
GET /api/deck/{deck_id}/draw/?count=52
```
Response: `{ success, deck_id, cards: [...], remaining }`

Each card object:
```json
{
  "code": "6H",
  "image": "https://deckofcardsapi.com/static/img/6H.png",
  "images": { "svg": "...", "png": "..." },
  "value": "6",
  "suit": "HEARTS"
}
```

### API quirks to handle
- `value` is a full word string — `"ACE"`, `"KING"`, `"QUEEN"`, `"JACK"`, `"10"`...`"2"` — never a number. Compare as strings directly, do not attempt numeric parsing.
- `suit` is also a full word string — `"HEARTS"`, `"DIAMONDS"`, `"CLUBS"`, `"SPADES"`.
- **Architectural decision**: Call step 1 and step 2 as two separate, explicit calls (not the `deck/new/draw/` shortcut), because the task brief lists "Initialise a shuffled deck" and "draw a card" as separate instructions — code structure should reflect that separation for clarity and easier testing/mocking.
- **Prefetch strategy**: Fetch all 52 cards in one `draw/?count=52` call on initialisation, then reveal them one at a time locally on each button click (advancing an index), rather than calling `/draw/` once per click. This avoids per-click network latency/failure, and makes tests far simpler to mock (one API response instead of 52). IMPORTANT: this means the "next card" is technically already in memory — the probability calculation (optional requirement) must NOT use this foreknowledge. It must be calculated purely from "what's theoretically left in a full deck minus what's been revealed so far," exactly as if calling the API fresh each time.
- The API does not always cleanly error on drawing from an empty deck — but this doesn't apply here since we prefetch all 52 upfront and just guard locally on `drawnCount >= 52`.
- `remaining` field exists in API responses but since we prefetch everything upfront, derive "remaining" locally as `52 - drawnCount` rather than re-querying the API.

### Edge case requiring a documented decision
The brief doesn't specify what happens if a drawn card matches BOTH value and suit (i.e. an identical card — only possible if duplicate decks were combined, which doesn't apply here with a single 52-card deck, but should still be handled defensively in the comparison logic). Decision: if implemented, show both `SNAP VALUE!` and `SNAP SUIT!` messages simultaneously rather than prioritising one. Document this decision explicitly in the README.

---

## Stack Decisions (with reasoning — follow these, don't re-litigate without strong reason)

| Layer | Choice | Why |
|---|---|---|
| Framework | **React + Vite + TypeScript** | Fast scaffold/dev under time pressure. TS forces proper modelling of `value`/`suit` as typed unions rather than loose strings — signals care. Plain Vite chosen over Next.js deliberately: this is a single-screen, client-only app with no SSR/routing/multi-page need, so Next.js would add framework overhead solving zero problems this app has. Document this choice explicitly in the README as a "most appropriate technology" call, referencing the JD's own stated philosophy. |
| Styling | **CSS Modules** (built into Vite, zero extra config) | No need for Tailwind/Bootstrap at this scale; keep dependencies minimal. Visual polish/redesign is a deliberately separate, later phase — see "Phasing" below. |
| State management | **`useReducer`** in a custom hook (NOT Redux Toolkit / RTK) | This app has exactly one piece of state owned by one component tree, ~3-4 actions, flat (non-nested) shape. RTK's value (Immer for nested mutations, normalized entity caching, RTK Query for shared server state across many components) doesn't get exercised at this scale — there's no cross-cutting state-sharing problem to solve. Introducing a global store here would itself be a negative signal: at mid-level, judgment about *not* over-tooling is being evaluated as much as technical ability. The JD's "not precious about specific technology, most appropriate technology" line directly supports this reasoning — cite it in the README if asked to justify. |
| HTTP | **Native `fetch`** | One GET-call pattern, no need for axios. |
| Testing | **Vitest + React Testing Library + MSW (Mock Service Worker)** | Vitest pairs natively with Vite. RTL tests from user perspective (role/text/aria-label queries — NOT class names or DOM structure, so tests survive a later visual redesign). MSW intercepts at the network level rather than stubbing `fetch` directly — more realistic test coverage of the actual fetch logic. |
| Lint/format | **ESLint + Prettier** | Accept Vite's TS template defaults, don't spend time tuning. NOTE (deviation): the current Vite react-ts template ships **oxlint** instead of ESLint. Decision: keep oxlint (zero-config, already wired) and add Prettier; document this swap in the README. |
| CI | **Minimal GitHub Actions workflow** (`npm test` on push/PR) | JD explicitly calls out "automated testing, and continuous integration/delivery" and "high levels of test automation" twice — this is a cheap, high-signal addition (~15 min) directly demonstrating the production/DevOps culture they describe. |
| Deploy | **Netlify or Vercel** | Zero-config GitHub integration for Vite apps. |

---

## File Structure

```
src/
├── api/
│   └── deckApi.ts          # initialiseDeck(): calls /new/shuffle/ then /draw/?count=52
├── hooks/
│   └── useDeck.ts          # deckReducer + useDeck hook (initialiseDeck, drawCard)
├── types/
│   └── card.ts             # Card, DeckState, DeckAction types
├── components/
│   ├── CardDisplay.tsx     # previous (or placeholder) + current card images, with alt text
│   ├── SnapMessage.tsx     # conditional SNAP VALUE!/SNAP SUIT!, aria-live region
│   ├── DrawButton.tsx      # hidden/disabled when deck exhausted or loading
│   ├── ResultsSummary.tsx  # shown after 52nd draw — total value/suit match counts
│   ├── CardCounter.tsx     # optional — "Card X of 52"
│   └── ProbabilityIndicator.tsx  # optional — next-draw match odds
├── utils/
│   └── matchLogic.ts       # pure compareCards(previous, current) function — unit tested in isolation
├── App.tsx
└── main.tsx

tests/
├── matchLogic.test.ts      # value match / suit match / both / neither
├── deckReducer.test.ts     # each action type, full-deck exhaustion behaviour
├── App.test.tsx            # RTL: draw flow, SNAP messages, button removal + summary at 52 draws
└── (MSW mock handlers for deckApi, no real network calls in test suite)

.github/
└── workflows/
    └── test.yml            # run npm test on push/PR
```

---

## Component Behaviour Notes

- **`CardDisplay`**: receives `previousCard: Card | null` and `currentCard: Card | null`. Renders placeholder (e.g. card-back image or styled empty slot) when `previousCard` is null. Both images need descriptive `alt` text (e.g. "King of Hearts"), not generic "card image".
- **`SnapMessage`**: receives the result of `compareCards()`. Wrap in `aria-live="polite"` so screen readers announce it without requiring focus change.
- **`DrawButton`**: hidden entirely (not just disabled) once `drawnCount === 52`, per requirement #7. Should also be disabled (not hidden) during the initial loading state before the deck is ready.
- **`ResultsSummary`**: only renders once `drawnCount === 52`. Shows total `valueMatches` and `suitMatches`.
- Keyboard operability and visible focus states required on the draw button (JD calls out accessibility explicitly).
- Mobile-first responsive layout — JD explicitly calls out "mobile-first, responsive web apps" and Core Web Vitals awareness. Test at a narrow viewport, not just desktop.

---

## Phasing (important — follow this order)

1. **Phase 1 — Functional skeleton**: types, API layer, reducer/hook, components wired to real data and state, minimal/bare CSS only. No visual polish yet.
2. **Phase 2 — Tests**: full coverage of match logic, reducer, and component interaction flow (draw → display → SNAP message → 52-draw completion). Confirm everything passes.
3. **Phase 3 — Accessibility pass**: alt text, aria-live, keyboard/focus states, contrast check.
4. **Phase 4 — CI**: add the GitHub Actions test workflow.
5. **Phase 5 — Visual design pass**: this is a deliberately separate, later phase (planned to use Claude Design once Phase 1-4 are solid and verified). Do NOT let visual polish work happen before or get tangled with Phases 1-3 — keep the test suite querying by role/text/aria-label specifically so a later visual redesign cannot break it.
6. **Phase 6 — Deploy & docs**: README, Netlify/Vercel deploy, final clean-clone verification.

---

## README.md Requirements (to write once app is built)

Must include:
- How to install and run the app (`npm install`, `npm run dev`)
- How to run tests (`npm test`)
- Explicit note on the "both value and suit match" edge case decision
- Explicit justification for Vite-over-Next.js (cite JD's "most appropriate technology" language)
- Explicit justification for `useReducer`-over-RTK (cite JD's "not precious about specific technology" language)
- Note on the prefetch-all-52-upfront architectural decision and why probability calculation deliberately avoids using that foreknowledge
- List of which optional requirements were implemented (counter / probability / animation)
- Note the oxlint-over-ESLint swap (Vite template default changed)

---

## Working approach for this build

- Build STRICTLY step by step. Complete one step, explain the code so the user understands it, then STOP and wait for explicit approval before starting the next step. Do not batch multiple steps.

---

## Definition of Done (checklist)

- [ ] Deck initialises and shuffles on load (separate explicit API call from drawing)
- [ ] Draw button reveals one card at a time from the prefetched 52
- [ ] Previous card displayed to the left, placeholder when none exists
- [ ] SNAP VALUE! / SNAP SUIT! logic correct, including documented both-match behaviour
- [ ] Button removed and summary shown after 52nd draw
- [ ] Counter implemented (optional but cheap, recommended)
- [ ] Probability indicator implemented if time allows (optional, higher-value stretch goal)
- [ ] Unit tests: match logic, reducer
- [ ] Component tests: full draw flow via RTL + MSW, no real network calls
- [ ] Accessibility: alt text, aria-live, keyboard/focus, contrast
- [ ] Mobile-first responsive verified at narrow viewport
- [ ] GitHub Actions CI running tests on push
- [ ] README complete with all required justifications
- [ ] Deployed to Netlify/Vercel
- [ ] Clean clone + install + run + test verified end to end before submission
