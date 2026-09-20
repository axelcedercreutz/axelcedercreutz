# Handoff: facts and links awaiting confirmation

Everything on the page was written from the repositories and documents listed under "Verified from".
The items below could not be verified from any source I could reach. Each is marked in `index.html`
with a `data-todo` attribute (visible in review builds); `npm run check:release` fails until they are resolved.

## Links to confirm or provide

| # | Item | Where on the page | What I found |
|---|---|---|---|
| 1 | RinkView source repository link | RinkView meta column | `github.com/axelcedercreutz/rinkview` is private. Make it public and add the link, or drop the line. |
| 2 | Banger Board live URL | Banger Board meta column | The Vercel project deploys behind Vercel Authentication (README). If a public URL exists or is wanted, add it; otherwise keep "private to the league". |
| 3 | Banger Board source repository link | Banger Board meta column | `github.com/axelcedercreutz/nhl-fantasy-draft-tool` is private. |
| 4 | Budgy live product URL | Budgy meta column | `budgy.aced.fi` resolves to Vercel DNS, but no document in either Budgy repository names a public production URL, so it is not on the page. |
| 5 | Budgy source repository link | Budgy meta column | `github.com/axelcedercreutz/budgy-v2` is private. |
| 6 | LinkedIn URL `https://www.linkedin.com/in/axel-cedercreutz` | Header, contact, JSON-LD | Taken from the 2017 site. LinkedIn blocks automated checks, so please confirm it resolves to your profile. |
| 7 | Contact email `axel.cedercreutz@gmail.com` | Contact section, JSON-LD | Commit author email on the RinkView repository and the 2017 site's contact address. Confirm this is the address you want public. |

## Facts to confirm

| # | Claim on the page | Basis | Action |
|---|---|---|---|
| 8 | "Eight-plus years of software and data engineering in startups" | Profile README (last edited April 2025) | Update the number if it has changed. |
| 9 | Gosta Labs start date | Not in any source | Fill in (timeline entry). |
| 10 | Earlier employers, titles and dates | Not in any source | Fill in from the CV (timeline entry is a placeholder). |
| 11 | Aalto University, Information Networks: degree level and graduation year | 2017 site says studies began autumn 2016 | Fill in. |
| 12 | "Finland" as location | Domain, Aalto, Gosta Labs | Confirm, or change to a city. |
| 13 | "Former competitive athlete" | Profile README ("ex-athlete"); 2017 site named top-league floorball | Confirm wording; add the sport if you want it named. |
| 14 | "Built solo, running an AI-assisted workflow end to end" (RinkView) | `docs/BUILD_NOTES.md` in the RinkView repo, which is itself marked "draft, candidate must review"; every commit on all three repos is authored by you | Confirm you want this stated on the site. |
| 15 | "In daily use" and "running in production" (Budgy) | Handover doc names a live Supabase project with real data and bank connections | Confirm. |
| 16 | "Deployed on Vercel for one league" (Banger Board) | README: repo linked to the Vercel project, pushes to main deploy | Confirm. |
| 17 | Interests list (growth and product analytics, environment and biotech, web development) | Profile README | Trim or update. |

## Verified from

- `axelcedercreutz/rinkview` at `7550892` (README, `docs/BUILD_NOTES.md`, `docs/DEFENSE_NOTES.md`, `docs/CHAT.md`, `docs/xg_fit_report.md`, `data/PROVENANCE.md`, CI and deploy workflows). Test suites run in this pass: 319 pytest cases and 119 node:test cases, all passing.
- `axelcedercreutz/nhl-fantasy-draft-tool` at `1f1f823` (README, HANDOVER.md, `lib/*.ts`, API routes). Vitest run in this pass: 22 passing. Production build succeeded; the draft-room screenshot on the page was captured from that build.
- `axelcedercreutz/budgy-v2` at `303b2f5` (CLAUDE.md, DEPLOYMENT.md, `docs/design-direction.md`, `docs/architecture-review.md`, `docs/features/*.md`, `lib/crypto/`, CI workflow). Vitest run in this pass: 1,127 tests in 120 files passing. 54 migration files counted.
- `axelcedercreutz/Budgy` (v1) docs: `docs/first-five-minutes.md`, `docs/handover-consolidation.md`, `docs/roadmap-2026h2.md`, `docs/architecture-review.md`.
- Profile README in this repository (Gosta Labs, years of experience, interests, ex-athlete).
- `axelcedercreutz/axelcedercreutz.github.io` (2017 site): education, BrainStation, LinkedIn URL, email.
- Public repositories `darts-app` and `backend-posthog-demo`: READMEs.
- RinkView screenshots: `docs/img/shotmap.png` from the RinkView repository, downscaled.

## Deliberately out of scope

- DNS for axelcedercreutz.fi, aced.fi redirects, and product subdomains such as rinkview.aced.fi.
- Deploying this page anywhere. The current axelcedercreutz.fi host (a non-GitHub, non-Vercel IP) could not be inspected from the build environment, and its source is not in any reachable repository.
- Making any of the private repositories public.
- A CV download. Add one under `assets/` and link it from the hero when ready.
- A photo. None was available; the page is designed to work without one.
