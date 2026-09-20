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
| 8 | "Eight-plus years in early-stage companies" | Public LinkedIn "About" snippet | Update if it has moved on. |
| 9 | Gosta Labs start date, titles over time (Software Engineer → Product), one-line scope | LinkedIn headline "Product @ Gosta Labs"; README said Software Engineer | Fill in on `/about`. |
| 10 | Rentle: title(s), dates, role wording | LinkedIn post "I've been at Rentle on and off since…" (2022) and a public recommendation ("owner of the data platform", "core reason for the success of the PLG model") | Fill in on `/about`; confirm the wording is yours. |
| 10b | Any role between 2016 and Rentle | Not in any source | Add or delete the placeholder row. |
| 11 | Aalto degree level and graduation year | 2017 site: studies began autumn 2016 | Fill in on `/about`. |
| 12 | "Helsinki" as location | Public LinkedIn snippet; Gosta Labs is Helsinki-based | Done unless wrong. |
| 13 | Floorball history: Steelers (top league, 2016–17), Järfälla in Sweden (2012), SSV Helsinki | F-liiga statistics and transfer records found via search; 2017 site | Check the years on the timeline row (written as 2011–2017). |
| 13b | Gosta Labs description ("AI operating system for oncology teams", clinicians in Finland, Switzerland, the Baltics and Australia) | Public funding announcements (Dec 2025) and LinkedIn snippets | Confirm it matches how the company describes itself today. |
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
- Public search snippets of the LinkedIn profile and posts (headline, Helsinki, Rentle, recommendation wording), Gosta Labs seed-round coverage (Vestbee, Pääomasijoittajat, Cision, FAIR EDIH), F-liiga statistics on nhlfinns.net and Pääkallo.fi transfer notes. LinkedIn itself is blocked from the build environment, so nothing was read from the profile page directly.
- `axelcedercreutz/axelcedercreutz.github.io` (2017 site): education, BrainStation, LinkedIn URL, email.
- Public repositories `darts-app` and `backend-posthog-demo`: READMEs.
- RinkView screenshots: `docs/img/*.png` from the RinkView repository.

## Deliberately out of scope

- DNS for axelcedercreutz.fi, aced.fi redirects, product subdomains such as rinkview.aced.fi.
- Deploying the site. The current axelcedercreutz.fi host could not be inspected from the build environment and its source is not in any reachable repository.
- Making private repositories public.
- A CV download and a photo. Add the PDF under `public/` and link it from the hero when ready.
- A real Budgy screenshot (needs a Supabase environment to render).
