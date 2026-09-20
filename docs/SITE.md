# axelcedercreutz.fi — site notes

The personal site is plain HTML and CSS in this repository. No framework, no build step, no runtime
dependencies, no analytics, no third-party requests (the display font is self-hosted under the OFL).

## Files

| Path | What |
|---|---|
| `index.html` | The page. Content lives inline; there is one page. |
| `assets/css/site.css` | All styling: tokens (light and dark), layout, components, review-only `data-todo` markers. |
| `assets/fonts/` | Instrument Serif (latin subset, woff2) plus its OFL licence. |
| `assets/img/` | Product screenshots (downscaled JPEGs) and the Open Graph card. |
| `content/links.json` | Registry of every external URL the page may link to, each with a provenance note. |
| `favicon.svg` | Icon. |
| `scripts/` | Zero-dependency dev server, release gate, link checker; Playwright helpers for screenshots and the OG card. |
| `tests/site.test.mjs` | Structural checks run by `npm test` and CI. |
| `docs/HANDOFF.md` | Open facts and links awaiting confirmation. |
| `docs/screenshots/` | Mobile, tablet and desktop captures from the last review pass. |

## Commands

```sh
npm run dev            # serve locally at http://localhost:8080
npm test               # structural checks (metadata, project order, link registry, TODO discipline, images, privacy)
npm run check:release  # fails while any data-todo marker remains — run before deploying
npm run check:links    # fetches every URL in content/links.json (needs network)
npm run screenshots    # docs/screenshots/*.png at 390, 768 and 1440 px, light and dark (needs Playwright)
npm run og             # renders scripts/og.html → assets/img/og.png (needs Playwright)
```

Playwright is deliberately not a dependency of the site. For the two helpers, either
`npm i -D playwright && npx playwright install chromium` or point `NODE_PATH` at a global install.

## Editing rules

- **No guessed URLs.** Add any new external link to `content/links.json` with where it was verified; the tests fail otherwise.
- **No unconfirmed facts in prose.** Wrap anything still to be confirmed in `<span data-todo="what to confirm">…</span>`.
  It renders as a visible amber marker in review builds, and `npm run check:release` blocks a deploy while any remain.
- **Order is a contract.** Featured work is RinkView, then Banger Board, then Budgy; the tests assert the `data-project` order.
- **Keep it quiet.** No scripts other than the JSON-LD block, no remote assets in CSS, images under 800 KB total.

## Deployment

Nothing in this repository deploys anything. The page is static, so any static host works
(GitHub Pages from this repository, Cloudflare Pages, Netlify, or the current host of axelcedercreutz.fi).
`.nojekyll` is present so GitHub Pages serves the files as-is if that route is chosen.
DNS for axelcedercreutz.fi, the aced.fi redirects and product subdomains are separate infrastructure work.
