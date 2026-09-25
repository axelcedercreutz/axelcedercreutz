# Handoff: facts and links awaiting confirmation

Everything on the site was written from the repositories and documents listed under "Verified from".
The items below could not be verified from any reachable source. Each is a visible marker on the page
(`<Todo>` in `.astro` files, `pending:` in case-study frontmatter); `npm run check:release` fails until they are resolved.

## Links to confirm or provide

| # | Item | Where | What I found |
|---|---|---|---|
| 1 | RinkView source repository link | `/work/rinkview` | `axelcedercreutz/rinkview` is private. Make it public and add to `links`, or delete the `pending` line. |
| 2 | Banger Board source link | `/work/banger-board` | `axelcedercreutz/nhl-fantasy-draft-tool` is private. |
| 3 | Budgy live product URL | `/work/budgy` | `budgy.aced.fi` resolves to Vercel DNS, but no document names a public URL. |
| 4 | Budgy source link | `/work/budgy` | `axelcedercreutz/budgy-v2` is private. |
| 5 | Banger Board live URL | `/work/banger-board` | Taken from the CV's "Live demo" link. Confirm Vercel deployment protection is off so visitors are not asked to sign in. |

Resolved from the CV (20 September 2026): LinkedIn URL, contact email.

## Facts to confirm

| # | Claim | Basis | Action |
|---|---|---|---|
| 6 | Work history, titles, dates, bullet content on `/about` | The CV, transcribed | Read once; it is your document, reworded lightly. |
| 7 | "Product Engineer at Gosta Labs since October 2024", "a Helsinki healthcare AI startup building an AI operating system for oncology teams" | CV title and dates; company description from public funding coverage | Confirm the company wording. |
| 8 | Floorball: F-liiga 2016–2018 with Steelers, "a season in Sweden as a junior" | CV (F-liiga 2016–2018); league records (Steelers); 2017 site and transfer records (Järfälla, 2012) | Confirm the Sweden wording. |
| 9 | RinkView "How it was made" section (AI-assisted, directed passes) | `docs/BUILD_NOTES.md` in the RinkView repo, itself marked "candidate must review" | Read and confirm. |
| 10 | Budgy "running in production" | Handover doc names a live Supabase project with real data and bank connections | Confirm. |
| 11 | Budgy cover image | A composition rendered from Budgy's own design tokens with illustrative numbers, captioned as such | Replace with a product screenshot when you have one. |
| 12 | The draft post "What a week of directed building actually produced" | Assembled from RinkView's `docs/BUILD_NOTES.md`; `draft: true`, excluded from the build | Edit in your own words, then flip `draft` to publish, or delete it. |

## After the domain moves (search)

| # | Item | Why |
|---|---|---|
| 13 | List the URLs the current axelcedercreutz.fi serves (the old host could not be crawled from the build environment) and add `permanent` redirects for any that no longer exist | Keeps inbound links and rankings; otherwise they 404 |
| 14 | Redirect `axelcedercreutz.vercel.app` to the domain (snippet in `docs/SITE.md`) | One indexable copy of the site |
| 15 | Verify the domain in Google Search Console and Bing Webmaster Tools, submit the sitemap | Indexing and rich-result reports |
| 16 | A photo for the `Person` structured data and About page | Knowledge-panel style results use it; the site currently points `image` at `/og.png` |

Deliberately not on the site, from the CV and cover letter: phone number, relocation readiness, and any reference to a specific club. The site stays team-neutral.

## Verified from

- `axelcedercreutz/rinkview` at `7550892`: README, `docs/BUILD_NOTES.md`, `docs/DEFENSE_NOTES.md`, `docs/CHAT.md`, `docs/xg_fit_report.md`, `data/PROVENANCE.md`, CI and deploy workflows. Suites run in this pass: 319 pytest cases collected and passing, 119 node:test cases passing.
- `axelcedercreutz/nhl-fantasy-draft-tool` at `1f1f823`: README, HANDOVER.md, `lib/*.ts`, API routes. Vitest: 22 passing; `next build` clean. The three Banger Board screenshots were captured from that build.
- `axelcedercreutz/budgy-v2` at `303b2f5`: CLAUDE.md, DEPLOYMENT.md, `docs/design-direction.md`, `docs/architecture-review.md`, `docs/features/*.md`, `lib/crypto/`, CI workflow. Vitest: 1,127 tests in 120 files passing. 54 migration files.
- `axelcedercreutz/Budgy` (v1) docs: `first-five-minutes.md`, `handover-consolidation.md`, `roadmap-2026h2.md`, `architecture-review.md`.
- The CV and cover letter dated 20 September 2026 (roles, dates, education, languages, sport, contact details, live links).
- Profile README in this repository (interests).
- Public search snippets of the LinkedIn profile and posts (headline, Helsinki, Rentle, recommendation wording), Gosta Labs seed-round coverage (Vestbee, Pääomasijoittajat, Cision, FAIR EDIH), F-liiga statistics on nhlfinns.net and Pääkallo.fi transfer notes. LinkedIn itself is blocked from the build environment, so nothing was read from the profile page directly.
- `axelcedercreutz/axelcedercreutz.github.io` (2017 site): education, BrainStation, LinkedIn URL, email.
- Public repositories `darts-app`, `backend-posthog-demo`, `arsfest`, `project-self-monitoring`, `fullstackopen`, `stupidhack-2021`: READMEs; `Teknologforeningen/e-phuxpoangshafte`: commit history (Axel's commits 2021–2022).
- GitHub profile via the API: bio "Product @Gosta-Labs-Oy", location Helsinki, account since June 2016, 23 public repositories.
- RinkView screenshots: `docs/img/*.png` from the RinkView repository.

## Deliberately out of scope

- DNS for axelcedercreutz.fi, aced.fi redirects, product subdomains such as rinkview.aced.fi.
- Deploying the site. The current axelcedercreutz.fi host could not be inspected from the build environment and its source is not in any reachable repository.
- Making private repositories public.
- A CV download and a photo. Add the PDF under `public/` and link it from the hero when ready.
- A real Budgy screenshot (needs a Supabase environment to render).
