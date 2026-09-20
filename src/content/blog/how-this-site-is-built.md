---
title: How this site is built
description: Astro, Markdown, two self-hosted fonts and a test suite that reads the built HTML. A short tour of the decisions behind axelcedercreutz.fi.
pubDate: 2026-09-20
tags: [astro, meta, tooling]
---

This site is a small static build. That was the brief I gave myself: pages that load instantly, a blog I will actually write in, and nothing running in the browser that the page does not need.

## The stack

[Astro](https://astro.build) does the rendering. Pages are `.astro` files, case studies and posts are Markdown in content collections with a typed schema, and the whole thing compiles to plain HTML. There is no client-side framework. The only JavaScript that ships is a small script for scroll reveals, the count-up numbers on case studies, the card tilt on hover, and the theme toggle. Turn JavaScript off and everything still works.

Fonts are self-hosted. [Bricolage Grotesque](https://github.com/google/fonts/tree/main/ofl/bricolagegrotesque) carries the words and JetBrains Mono carries anything that looks like a scoreboard. No requests leave the page for fonts, analytics or anything else, which is also why there is no cookie banner: there are no cookies.

## Content as data

Each case study has a schema: title, role, stack, links, stats, evidence. The links array only accepts URLs that exist in the project's own repository or documentation. Anything I could not verify goes into a separate `pending` list and renders as a visible marker on the page. A release script refuses to pass while any marker remains, so a guess cannot quietly become a fact.

The blog collection has a `draft` flag. Drafts render in development so I can read them in place, and disappear from the production build and the RSS feed.

## Tests on the output

The test suite does not test components. It builds the site and then reads every HTML file in `dist/`: one `h1` per page, a canonical URL that matches the path, complete Open Graph tags, every external link registered with a note on where it was verified, alt text on every image, no scripts or stylesheets from other hosts. It is a blunt instrument, and it catches exactly the class of mistake a personal site accumulates.

## Motion, with a switch

The animations are deliberately few: a word-by-word headline, a marquee, reveals on scroll, a tilt on the work cards. All of it lives behind `prefers-reduced-motion: no-preference`, so if your system asks for less motion you get a still page with the same content.

That is the whole thing. It fits in a repository you can read in an afternoon, which was the point.
