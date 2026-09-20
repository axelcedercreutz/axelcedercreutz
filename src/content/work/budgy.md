---
title: Budgy
tagline: Household budgeting for couples. One shared ledger, as little bookkeeping as possible.
summary: A budgeting product for households that fills itself in from the bank, keeps plans people can actually follow, and has an assistant that never invents a number. Multi-tenant, encrypted per household, built and run end to end.
order: 3
year: "2026"
role: Sole builder — product, design system, schema, encryption, infrastructure, operations
status: Running in production
accent: moss
stack: [TypeScript, Next.js, React, Supabase, PostgreSQL, Tailwind, Radix, Vitest, Vercel, PostHog, Enable Banking, MCP]
links: []
pending:
  - "Live product: confirm the public URL (budgy.aced.fi resolves to Vercel but no document in the codebase names it)"
  - "Source repository: the budgy-v2 repo is private; make it public and add the link, or drop this line"
cover: ../../assets/work/budgy-cover.png
coverAlt: A composition built from Budgy's design tokens showing a month-at-a-glance card with a left-to-spend figure, a stacked category bar in the eight household hues, plan-versus-actual bars, a shared ledger with per-partner avatars and a contributions split. Illustrative numbers, not a product screenshot.
gallery: []
stats:
  - value: "1,127"
    label: "unit tests passing"
  - value: "54"
    label: "database migrations"
  - value: "3"
    label: "member roles enforced in the database"
  - value: "1"
    label: "ingestion path for bank, CSV and manual rows"
evidence:
  - claim: "1,127 Vitest cases across 120 files pass on the current commit"
    source: "vitest"
  - claim: "A second suite applies every migration to a fresh Postgres in CI and exercises row-level security as different users"
    source: "tests/db · ci.yml"
  - claim: "Personal fields are AES-GCM ciphertext under a per-household key wrapped by a key-encryption key, with blind indexes for equality"
    source: "lib/crypto · lib/data/codec.ts"
  - claim: "Ask Budgy answers only from tool calls over access-checked reads, behind a consent gate, with a privacy mode of merchant pseudonyms"
    source: "services/ai"
  - claim: "External AI clients connect through an MCP server with its own OAuth 2.1 authorization server and per-household consent"
    source: "docs/features/mcp.md"
---

## The problem

Two people share money but not a view of it. Statements sit in two bank apps, categorising is manual, and "who paid what" turns into a conversation nobody wants to start. Budgy gives a household one ledger that fills itself in from the banks, a plan it can keep, and a monthly recap both partners actually look at.

## Product decisions

- **Time to value is the metric.** The onboarding is designed so the person setting up sees their own plan in under 90 seconds, and an invited partner is inside the shared budget in under 60, with nothing to configure.
- **One ingestion path.** Bank sync over PSD2, CSV and XML imports of Finnish bank formats and manual rows all go through the same pipeline: identity, rules, suggestions, monthly facts, duplicate links. Everything downstream behaves the same regardless of source.
- **Budgets are plans, not copied numbers.** A budget line is effective-dated with a cadence and an optional rollover, and the database resolves it per month. Nobody types the same number twelve times.
- **Who paid, without a debt ledger.** Payer attribution comes from bank-account ownership for synced rows. Contributions are shown as information, not as a settle-up. It is a household, not a tab.
- **An assistant that never invents a number.** Ask Budgy answers from tool calls over the same access-checked reads the interface uses, behind an explicit consent gate, with a privacy mode that hands the model merchant pseudonyms. Writes only ever land as proposals a person approves.
- **A design system built for the kitchen table.** Warm neutrals, one accent, money set in tabular figures through a single component, thumb-first on phones and dense on desktop, with a reduced-motion switch. The chrome recedes; the household's numbers carry the room.

## Architecture

Next.js 16 App Router on Vercel with Supabase Postgres. Multi-tenancy is enforced in the database: row-level security with owner, editor and viewer roles, and a typed repository seam that is the only path to privileged access.

Personal data is ciphertext at rest. Each household has its own data key, wrapped by a key-encryption key from the environment; fields are AES-GCM with the row identity as associated data, so a value cannot be copied between rows or households; equality lookups go through blind indexes; key rotation resumes if it is interrupted.

The AI layer is provider-agnostic with a fallback chain and prompt caching. An MCP server with its own OAuth 2.1 authorization server lets external AI clients connect per person, with per-household consent, and read the same tools the assistant uses.

## Ownership

I ran a full architecture review against the first version and closed every finding: write authorization moved into row-level security, multi-step mutations became atomic Postgres functions, all money math moved into pure, tested modules, and CI started gating every pull request with lint, typecheck, unit tests, a real-database suite and a build. The product, the design system, the schema, the encryption, the infrastructure and the operations are all mine.

## What I would do next

Realtime updates between partners on the same ledger, trip budgets that span a date range instead of a month, and the cross-budget home view that makes several budgets feel like one place.
