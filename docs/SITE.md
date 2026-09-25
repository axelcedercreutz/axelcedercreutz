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
| `public/` | Fonts, favicon, icon set and web manifest, robots.txt, `og.png`. |
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
npm run icons          # renders scripts/icons.html → public/icons/*.png (needs Playwright)
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

## Search engines and AI assistants

Everything a crawler needs is generated from the same content collections as the pages, so it cannot drift:

- `/robots.txt` (`src/pages/robots.txt.ts`): allows everyone, with search engines, AI-search agents and
  AI-training crawlers listed as separate blocks. To stay citable in AI answers but opt out of training,
  change `Allow` to `Disallow` in the training block only.
- `/sitemap-index.xml`: every indexable page; posts carry `lastmod` from their frontmatter. The 404 page is
  `noindex` and stays out.
- `/llms.txt` and `/llms-full.txt` (`src/lib/llms.ts`): the llmstxt.org summary and the full Markdown of every
  case study and published post, for assistants that read it.
- `/rss.xml`: the feed, with categories and a self link.
- Every page has a canonical URL, `robots` meta, full Open Graph and Twitter tags, and one JSON-LD `@graph`
  with `WebSite`, `Person` (`#person`, referenced by every author/publisher field) and `BreadcrumbList`, plus
  `SoftwareApplication` on case studies, `BlogPosting` on posts, `ProfilePage` on About. Case studies use
  their cover, cropped to 1200×630, as the social image; everything else uses `/og.png`.
- `npm test` checks all of it over `dist/`: robots directives, sitemap equals the set of indexable pages,
  `@id` references resolve on the page, llms.txt links resolve, social images exist.

Helpers live in `src/lib/seo.ts`. Absolute URLs always come from `Astro.site`, which is the domain.

## Contact form

`/contact` posts to a Vercel Function, `api/contact.js`, which emails the message through
[Resend](https://resend.com). The logic lives in `api/_contact-core.js` (the underscore stops Vercel deploying
it as a separate function) and is covered by `tests/contact.test.mjs`. `npm run build && node scripts/serve.mjs`
runs the function locally too.

Spam goes into a sinkhole: it gets the same "sent" response a person gets and is dropped without an email.
Bots learn nothing to adapt to. The traps:

1. **Honeypot.** A `website` field people never see or reach; anything typed in it is a bot.
2. **Signed timer.** The page fetches a signed token when someone starts on the form. The submission must
   carry it unforged and arrive at least three seconds later. Scripts that post straight to the endpoint,
   or fill the form in a blink, fail.
3. **Content.** More than three links, HTML anchors, BBCode, or a link as the name.

Cross-origin posts, non-JSON bodies and oversized messages are refused outright. A person with a typo is told
which field to fix. Dropped submissions are logged with their reason, never their content, in the Vercel
function logs (`contact: sinkholed (honeypot)`), so it is easy to check the filter is not eating real mail.

Setup, once:

1. Sign up at resend.com **with axel.cedercreutz@gmail.com**. Resend's shared sender, `onboarding@resend.dev`,
   can only deliver to the account's own address, which is exactly where these messages go, so no domain
   setup is needed.
2. Create an API key (sending access only).
3. In Vercel: **Settings → Environment Variables**, add `RESEND_API_KEY` for Production and Preview, then
   redeploy.

Optional variables: `CONTACT_TO` (default `axel.cedercreutz@gmail.com`), `CONTACT_FROM` (default
`axelcedercreutz.fi <onboarding@resend.dev>`; to send from your own address, verify `axelcedercreutz.fi`
in Resend first) and `CONTACT_SECRET` (signs the form tokens; defaults to the API key).

Until the key is set, the form says it is not switched on yet and offers the email address instead.

## Deployment: Vercel

Every absolute URL (canonical, Open Graph image, sitemap, feed, robots, llms.txt, structured data) is
`https://axelcedercreutz.fi/...`, whatever host serves the build. Previews and the `*.vercel.app` URL point
search engines at the domain rather than at themselves.

The site is static, so Vercel needs no adapter and no environment variables. `vercel.json` carries the
framework hint, clean URLs (the build emits `work.html`, served as `/work`), long cache headers for hashed
assets and fonts, and a strict Content-Security-Policy. The inline scripts are why `script-src` allows
`'unsafe-inline'`: the theme bootstrap and Astro's hydration script are inlined by design.

First-time setup (a few minutes, in the Vercel dashboard):

1. **Add New → Project → Import** `axelcedercreutz/axelcedercreutz`. Vercel detects Astro; leave build command
   `astro build` and output `dist` as detected. Node 22 or newer.
2. Deploy. Every push to `main` then redeploys production; pull requests get preview URLs.
3. **Settings → Domains**: `axelcedercreutz.fi` is the production domain (done). If `www.axelcedercreutz.fi`
   is added too, set it to redirect to the apex so there is one address.
4. Optional: **Settings → Deployment Protection** off for production, so the URL is public.

`vercel.json` also redirects the `axelcedercreutz.vercel.app` alias to the domain (permanent), so there is one
indexable copy of the site. Preview deployments keep their own URLs.

Two things remain on the search side, both outside the repository:

1. Redirect any URL the old site had that this one does not (`redirects` in `vercel.json`, `permanent: true`),
   so existing links and rankings carry over.
2. Verify the domain in Google Search Console and Bing Webmaster Tools (a DNS TXT record) and submit
   `https://axelcedercreutz.fi/sitemap-index.xml`. Both report indexing and structured-data errors.

`npm run check:release` lists whatever is still marked unconfirmed on the pages; clear it before linking the
site from a CV.

DNS for aced.fi and the product subdomains stays separate infrastructure work.
