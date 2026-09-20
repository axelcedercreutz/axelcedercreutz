# Hi, I'm Axel 👋

**Product engineer.** I build products end to end: interface, data model, pipeline, deploy, and the on-call after. Eight-plus years in early-stage companies, first at Rentle and now in product at [Gosta Labs](https://gostalabs.com), a Helsinki healthtech startup building an AI operating system for oncology teams.

Everything else, including case studies and a blog, lives at **[axelcedercreutz.fi](https://axelcedercreutz.fi)**.

## Things I built and run myself

- **RinkView** — shot quality, matchups and lineup decisions for a full NHL season (1,312 games, all 32 teams), with the uncertainty kept on screen. Django + Pandas API, framework-free D3/Highcharts modules in a Next.js shell, one stateless Cloud Run container. [Live demo](https://rinkview-670251302746.europe-north1.run.app) (scale-to-zero, the first load takes a few seconds).
- **Banger Board** — a fantasy hockey draft platform for a league whose scoring makes public rankings wrong: value over replacement, gain-over-waiting suggestions, a mock-draft simulator, live market data and two-device draft-night sync.
- **Budgy** — household budgeting for couples: bank sync, one ingestion path, effective-dated plans, an assistant that never invents a number, per-household encryption, and an MCP server with its own OAuth flow.

## This repository

Also the source of [axelcedercreutz.fi](https://axelcedercreutz.fi): an [Astro](https://astro.build) site with static output, Markdown content collections for case studies and posts, no client framework, no analytics. See [docs/SITE.md](docs/SITE.md) for how it is organised and [docs/HANDOFF.md](docs/HANDOFF.md) for what still needs confirming.

```sh
npm install
npm run dev      # write, preview
npm run build    # dist/
npm test         # checks over the built HTML
```
