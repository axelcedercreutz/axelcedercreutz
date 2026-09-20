# axelcedercreutz.fi — site notes

An [Astro](https://astro.build) site with static output. Pages are `.astro`, case studies and blog posts are
Markdown in typed content collections. No client-side framework; the only JavaScript that ships is a small
inline script for scroll reveals, count-up numbers, card tilt and the theme toggle. No analytics, no cookies,
no third-party requests (fonts are self-hosted under the OFL).

## Layout

| Path | What |
|---|---|
| `src/pages/` | Routes: `/`, `/work`, `/work/[slug]`, `/blog`, `/blog/[slug]`, `/about`, `/404`, `/rss.xml`. |
| `src/content/work/*.md` | Case studies. Frontmatter carries role, stack, links, pending links, stats, evidence, cover and gallery. |
| `src/content/blog/*.md` | Posts. `draft: true` keeps a post out of the production build and the feed. |
| `src/content.config.ts` | The schemas. Adding a field here is how you add a field to every case study. |
| `src/layouts/Base.astro` | Head (title, description, canonical, Open Graph, JSON-LD), header, footer, the progressive-enhancement script. |
| `src/components/` | Header, Footer, Marquee, WorkCard, PostList, Todo. |
| `src/styles/global.css` | Design tokens (light and dark), type, buttons, cards, motion (all behind `prefers-reduced-motion`). |
| `src/data/site.ts` | Name, role, employer, email, social URLs. |
| `src/data/links.json` | Registry of every external URL with where it was verified. Tests fail on unregistered links. |
| `src/assets/work/` | Source images for case studies; Astro emits responsive WebP sets at build. |
| `public/` | Fonts, favicon, robots.txt, `og.png`. |
| `tests/site.test.mjs` | Checks over the built HTML in `dist/`. |
| `scripts/` | Release gate, link checker, static server, screenshot and OG helpers. |
| `docs/HANDOFF.md` | Facts and links awaiting confirmation. |

## Commands

```sh
npm run dev            # Astro dev server with hot reload; drafts are visible here
npm run build          # static build → dist/
npm run preview        # serve dist/ the way a host would
npm test               # checks over dist/ (build first)
npm run check:release  # fails while any <Todo>, pending link or data-todo marker remains
npm run check:links    # fetches every URL in src/data/links.json (needs network)
npm run screenshots    # docs/screenshots/*.jpg at 390, 768 and 1440 px (needs Playwright; build first)
npm run og             # renders scripts/og.html → public/og.png (needs Playwright)
```

## Writing a post

Create `src/content/blog/my-post.md`:

```md
---
title: A short, specific title
description: One or two sentences. This is the summary in lists, the meta description and the feed.
pubDate: 2026-10-01
tags: [product, data]
draft: true
---

Markdown body. Code blocks get syntax highlighting. Images go in `src/assets/` and are referenced relatively.
```

Flip `draft` to `false` to publish. The URL is the file name.

## Adding a case study

Copy an existing file in `src/content/work/`, set `order`, put the cover and gallery images under `src/assets/work/`,
and keep `links` to URLs that exist in the project's own repository or docs. Anything unverified goes in `pending`
and renders as a visible marker until it is resolved.

## Design notes

Bone paper and ink with one hot accent (ember) and one cool accent (ice); a lime marker for the odd highlight.
Bricolage Grotesque for words, JetBrains Mono for anything that reads like a scoreboard. Big outlined numerals
number the case studies. Motion is few and deliberate: a word-by-word headline, a marquee, reveals on scroll, a
tilt on the work cards, short view transitions between pages. All of it is off under `prefers-reduced-motion`.

## Deployment: Vercel

The site is static, so Vercel needs no adapter and no environment variables. `vercel.json` carries the
framework hint, clean URLs (the build emits `work.html`, served as `/work`), long cache headers for hashed
assets and fonts, and a strict Content-Security-Policy. The inline scripts are why `script-src` allows
`'unsafe-inline'`: the theme bootstrap and Astro's hydration script are inlined by design.

First-time setup (a few minutes, in the Vercel dashboard):

1. **Add New → Project → Import** `axelcedercreutz/axelcedercreutz`. Vercel detects Astro; leave build command
   `astro build` and output `dist` as detected. Node 22 or newer.
2. Deploy. Every push to `main` then redeploys production; pull requests get preview URLs.
3. **Settings → Domains**: add `axelcedercreutz.fi` and `www.axelcedercreutz.fi`, pick one as primary
   (redirect the other). Vercel shows the DNS records to set at the registrar: an `A` record for the apex
   and a `CNAME` for `www`. Until DNS changes, the `*.vercel.app` URL is the site.
4. Optional: **Settings → Deployment Protection** off for production, so the URL is public.

Before the domain switch, run `npm run check:release` and clear whatever it lists; it refuses while any
fact on the page is still marked unconfirmed.

DNS for aced.fi and the product subdomains stays separate infrastructure work.
