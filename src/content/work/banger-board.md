---
title: Banger Board
tagline: A fantasy hockey draft platform for a league whose scoring makes the public rankings wrong.
summary: Projections, value over replacement, a draft room that reasons about waiting, a mock-draft simulator, live ESPN market data and two-device draft-night sync. Built for a 14-team league with unusual scoring.
order: 2
year: "2026"
role: Sole builder — model, data pipeline, product, deployment
status: Deployed on Vercel for one league
accent: ember
stack: [TypeScript, Next.js, React, Vitest, Vite, Redis, Vercel, Python]
links: []
pending:
  - "Live app: the deployment is behind Vercel Authentication; confirm a public URL or keep it private"
  - "Source repository: the nhl-fantasy-draft-tool repo is private; make it public and add the link, or drop this line"
cover: ../../assets/work/bangerboard-draft.png
coverAlt: Banger Board draft room. A roster panel with open slots on the left, a ranked list of players in the middle showing projected points and gain versus waiting, and a position outlook panel on the right estimating the best player available at the next pick for each slot.
gallery:
  - src: ../../assets/work/bangerboard-boards.png
    alt: Banger Board boards view with side-by-side ranked columns per position, each row showing projected fantasy points, value over replacement and external ranks.
    caption: The boards. One column per position, sorted by value over replacement, with the public ranks alongside for context.
  - src: ../../assets/work/bangerboard-mock.png
    alt: Banger Board mock draft setup screen with team count, draft slot, CPU drafter style and clock settings.
    caption: Mock draft. CPU drafters, a 45-second clock, auto-pick, and a grade against the other 13 lineups.
stats:
  - value: "14"
    label: "teams in the league"
  - value: "497"
    label: "players in the dataset"
  - value: "16"
    label: "starters per roster the model fills"
  - value: "45"
    label: "second draft clock in the mock"
evidence:
  - claim: "Replacement level per slot is found by filling all 14 lineups league-wide and reading off the best player left"
    source: "lib/scoring.ts"
  - claim: "Draft suggestions rank by value now minus expected value at your next pick, using a logistic 'gone' probability"
    source: "lib/draft.ts"
  - claim: "Two-device sync is revision-guarded; a losing writer adopts the winning document and picks are merged, never overwritten"
    source: "lib/sync.ts · app/api/state"
  - claim: "Live ESPN ADP is trimmed from a 16 MB feed to about 60 KB by an edge-cached route handler"
    source: "app/api/adp/route.ts"
  - claim: "22 Vitest cases pass and the production build is clean on the current commit"
    source: "vitest · next build"
---

## The problem

A 14-team ESPN head-to-head points league with scoring that punishes anyone who drafts off a magazine list: defensemen get a bonus on every point, faceoffs count, hits and blocks count, penalty minutes cost, and goalies are paid for workload as much as for wins. Public rankings assume standard scoring, so they are wrong in predictable ways. Banger Board replaces them with the league's own numbers.

## What I built

- **Projections and value over replacement.** Every player gets a projection from per-game rates over projected games played, blended with published projections where they exist. Replacement level per slot comes from filling all 14 lineups league-wide, best players first, and reading off the best player left.
- **A draft room that thinks about waiting.** For each open slot it estimates the best player likely to still be there at your next pick, using a logistic "gone" probability over the picks until your turn, and ranks by value now minus expected value later. Players who fill no open starting slot only show up when they clearly beat the need-fill.
- **A mock-draft simulator** with CPU drafters in two styles, a 45-second clock, auto-pick, a grade against the other 13 lineups and a pick-by-pick review.
- **Draft-night sync and live market data.** Two devices converge through an 8-character share code and a revision-guarded document in Redis; a losing writer adopts the winning copy and picks are merged rather than clobbered. Live ESPN average draft position feeds the wait model only, so value never reads the market.

## How it is built

Next.js 15, TypeScript and React 19 on Vercel. All draft state lives in the browser with export and import, which is also why the same source builds as one self-contained HTML file through Vite, with `next/link` and `next/navigation` aliased to hash-router shims. The two builds cannot drift because they compile the same files.

A Python pipeline over NHL Stats API extracts and several ranking lists produces the 497-player dataset, with hand-maintained tables for offseason moves, position eligibility and injured players. The pure modules (scoring, the draft model, the sync merge rules, accent-insensitive name matching) are unit-tested.

## What I would do next

Cloud sync for the whole platform instead of one draft, a nightly projection refresh from live season stats, a waivers page ranked by value over your worst starter, and a week planner that counts games per team against your lineup slots.
