# Handoff: facts and links awaiting confirmation

Everything on the site was written from the repositories and documents listed under "Verified from".
The items below could not be verified from any reachable source. Each is a visible marker on the page
(`<Todo>` in `.astro` files, `pending:` in case-study frontmatter); `npm run check:release` fails until they are resolved.

## Links to confirm or provide

| # | Item | Where | What I found |
|---|---|---|---|
| 1 | RinkView source repository link | `/work/rinkview` | `axelcedercreutz/rinkview` is private. Make it public and add to `links`, or delete the `pending` line. |
| 2 | Banger Board live URL | `/work/banger-board` | The Vercel deployment is behind Vercel Authentication (README). Add a public URL or keep it private. |
| 3 | Banger Board source link | `/work/banger-board` | `axelcedercreutz/nhl-fantasy-draft-tool` is private. |
| 4 | Budgy live product URL | `/work/budgy` | `budgy.aced.fi` resolves to Vercel DNS, but no document in either Budgy repository names a public URL. |
| 5 | Budgy source link | `/work/budgy` | `axelcedercreutz/budgy-v2` is private. |
| 6 | LinkedIn URL `linkedin.com/in/axel-cedercreutz` | header, footer, JSON-LD | From the 2017 site. LinkedIn blocks automated checks. |
| 7 | Contact email `axel.cedercreutz@gmail.com` | footer, about, JSON-LD | Commit author email on RinkView and the 2017 site's contact address. Confirm it is the one you want public. |

## Facts to confirm

| # | Claim | Basis | Action |
|---|---|---|---|
| 8 | "Eight-plus years" | Profile README (April 2025) | Update if it has moved on. |
| 9 | Gosta Labs start date | Not in any source | Fill in on `/about`. |
| 10 | Earlier employers, titles, dates | Not in any source | Fill in on `/about`; the placeholder row is marked. |
| 11 | Aalto degree level and graduation year | 2017 site: studies began autumn 2016 | Fill in on `/about`. |
| 12 | "Finland" as location | Domain, Aalto, Gosta Labs | Confirm or name a city. |
| 13 | "Former competitive athlete" | README "ex-athlete"; 2017 site named top-league floorball | Confirm wording; name the sport if you want to. |
| 14 | RinkView "How it was made" section (AI-assisted, directed passes) | `docs/BUILD_NOTES.md` in the RinkView repo, itself marked "candidate must review"; every commit on all three repos is authored by you | Read and confirm. |
| 15 | Budgy "running in production" | Handover doc names a live Supabase project with real data and bank connections | Confirm. |
| 16 | Banger Board "deployed on Vercel for one league" | README | Confirm. |
| 17 | Budgy cover image | A composition rendered from Budgy's own design tokens with illustrative numbers (`scripts/budgy-cover.html`), captioned as such | Replace with a product screenshot when you have one. |
| 18 | The draft post "What a week of directed building actually produced" | Assembled from RinkView's `docs/BUILD_NOTES.md`; `draft: true`, excluded from the build | Edit in your own words, then flip `draft` to publish, or delete it. |

## Verified from

- `axelcedercreutz/rinkview` at `7550892`: README, `docs/BUILD_NOTES.md`, `docs/DEFENSE_NOTES.md`, `docs/CHAT.md`, `docs/xg_fit_report.md`, `data/PROVENANCE.md`, CI and deploy workflows. Suites run in this pass: 319 pytest cases collected and passing, 119 node:test cases passing.
- `axelcedercreutz/nhl-fantasy-draft-tool` at `1f1f823`: README, HANDOVER.md, `lib/*.ts`, API routes. Vitest: 22 passing; `next build` clean. The three Banger Board screenshots were captured from that build.
- `axelcedercreutz/budgy-v2` at `303b2f5`: CLAUDE.md, DEPLOYMENT.md, `docs/design-direction.md`, `docs/architecture-review.md`, `docs/features/*.md`, `lib/crypto/`, CI workflow. Vitest: 1,127 tests in 120 files passing. 54 migration files.
- `axelcedercreutz/Budgy` (v1) docs: `first-five-minutes.md`, `handover-consolidation.md`, `roadmap-2026h2.md`, `architecture-review.md`.
- Profile README in this repository (Gosta Labs, years of experience, interests, ex-athlete).
- `axelcedercreutz/axelcedercreutz.github.io` (2017 site): education, BrainStation, LinkedIn URL, email.
- Public repositories `darts-app` and `backend-posthog-demo`: READMEs.
- RinkView screenshots: `docs/img/*.png` from the RinkView repository.

## Deliberately out of scope

- DNS for axelcedercreutz.fi, aced.fi redirects, product subdomains such as rinkview.aced.fi.
- Deploying the site. The current axelcedercreutz.fi host could not be inspected from the build environment and its source is not in any reachable repository.
- Making private repositories public.
- A CV download and a photo. Add the PDF under `public/` and link it from the hero when ready.
- A real Budgy screenshot (needs a Supabase environment to render).
