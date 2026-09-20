---
title: What a week of directed building actually produced
description: RinkView started as a work sample and became a league-wide analytics tool. Notes on scoping, directing AI-assisted passes, and what the critique loop changed.
pubDate: 2026-07-24
tags: [rinkview, process, hockey-analytics]
draft: true
---

> Draft. This post is assembled from the build notes in the RinkView repository, which are themselves marked "candidate must review". Read every line before publishing; delete this note when it is true.

RinkView began with a gap analysis, not with an idea for an app. I had a written list of the skills a role asked for that my documented history did not evidence, and the shape of the tool was specified to close those gaps. Every technology in the repository is there because the requirement named it.

## Directed passes

The work was split the way I would split it across a small team: one pass for the Django and Pandas backend with tests, one for the frontend pages, one for DevOps and documentation, and a verification pass that ran the result and checked every claim against reality. I directed, reviewed and corrected between passes. The commit history is short by design; I would rather say that plainly than manufacture incremental commits.

## The critique that changed the product

The lineup evaluator did not go straight to code. A planner drafted it, a devil's advocate attacked the draft against the shipped data, and a gatekeeper ruled on each finding. The critique produced fourteen findings, two of them blockers: the pair-versus-expected residual was statistically unidentified exactly where the plan claimed the most confidence, and the proposed trade-in archetypes were pooled from opponents observed against a single club. Both blockers forced a rescope from "trade evaluator" to "linemate and lineup evaluator", and the first version refused to rate incoming players until rival-team data existed to rate them honestly.

That refusal is still visible in the product. A cross-team trade-in is rated on the player's own minutes, and chemistry with new linemates is shown as an unknown rather than a number.

## From one team to the league

The dataset went from 82 games to 1,312, the expected-goals model was refit by maximum likelihood on the whole league with a holdout check, and the evaluator was generalised to any roster. Ingest of the full season measures a little over three minutes on a laptop, and nothing statistical runs in the request path, so the API stays fast regardless.

## What it does and does not prove

It shows that I can specify, direct, review and ship a working app in an unfamiliar stack quickly, with AI assistance, which is how I actually work. It does not show years of hands-on Django experience, and I will not claim that. My production backend history is TypeScript and Node; my data work is SQL, dbt and Python. The gap between my stack and a new one is days, not months, and the repository is the evidence.
