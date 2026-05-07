# ChainTrust

**The trust layer for startup fundraising on Solana.** Founders publish metrics on-chain, oracles verify them, investors get cryptographic proof chains instead of self-reported decks.

[![CI](https://github.com/urosradojicic/ChainTrust-SOL/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/urosradojicic/ChainTrust-SOL/actions/workflows/ci.yml)
![Tests](https://img.shields.io/badge/tests-74%20passing-brightgreen)
![Audits](https://img.shields.io/badge/audits-3%20%C3%97%20smart%20contract%20%2B%201%20%C3%97%20deep-blue)
![npm audit](https://img.shields.io/badge/npm%20audit-0%20critical-brightgreen)
![Solana](https://img.shields.io/badge/Solana-Devnet-purple)
![Frontier](https://img.shields.io/badge/Colosseum-Frontier%20%C2%B7%20May%2011-blue)

---

## 👋 Judges & reviewers — start here

> **You have 3 minutes. Here's the shortest path to "is this real?":**
>
> 1. **See a real Solana transaction** → after `npm run dev`, open [`/testnet-demo`](src/pages/LiveTestnetDemo.tsx) → connect Phantom (Devnet) → click airdrop → click anchor → click the Explorer link in the toast. **10 seconds.** No install if you skip ahead to the [demo-video script](DEMO_VIDEO.md) which embeds verified screenshots of every scene.
> 2. **Sign in as any role with one click** → on `/login`, the "Explore as Investor / Startup / Admin" buttons handle auth. Demo creds below.
> 3. **Read the security posture in 90 seconds** → [SECURITY.md](SECURITY.md) is a pointer-list (not an essay) — every defense maps to a real file.

| ⚡ One-click destinations |
|---|
| 🎥 **[3-minute demo script](DEMO_VIDEO.md)** — what to watch first, with screenshots of every scene |
| 🛡️ **[Security posture](SECURITY.md)** — 3 prior smart-contract audits + May 2026 deep-pass, every defense linked to its file |
| 🏗️ **[Architecture](ARCHITECTURE.md)** — layers, import rules, request lifecycle |
| 🎯 **[Judge tour](JUDGES.md)** — long-form version of this section with file pointers |

**Demo credentials** (one-click on `/login`):

| Role | Email | Password |
|---|---|---|
| Investor (recommended start) | `investor@chainmetrics.io` | `investor1` |
| Startup | `startup@chainmetrics.io` | `startup1` |
| Admin | `admin@chainmetrics.io` | `admin123` |

Sessions expire after 24 hours. RLS rejects all writes from demo users.

---

## Quick start

```bash
npm install --legacy-peer-deps    # see CONTRIBUTING.md for why --legacy-peer-deps
npm run dev                        # localhost:8080
npm test -- --run                  # 74 / 74 vitest cases
npm run typecheck                  # tsc --noEmit
npm run build                      # production bundle
```

> **Branch model.** `master` is the Frontier-ready snapshot. Active development happens on `merged-ai-roadmap-v2` and lands on `master` via fast-forward when stable. `backup` is a read-only restore point — `git fetch origin backup && git reset --hard origin/backup` to roll back.

---

## What's in the box

- **24 on-chain Anchor instructions** — registry, staking (30-day lock + tier computation), governance (weighted voting + delegation), soulbound badges. Source: [`blockchain/programs/chainmetrics/src/`](blockchain/programs/chainmetrics/src/)
- **Live testnet demo** that posts a real signed transaction to Solana Devnet, with cluster genesis-hash verification + simulation-before-sign hardening. Source: [`src/lib/solana/memo-anchor.ts`](src/lib/solana/memo-anchor.ts)
- **23 production pages** — investor screener, due-diligence stack, governance, staking, compliance, deal rooms — all role-gated by Supabase RLS (server-side) plus deny-by-default route guards (UI)
- **70+ domain-analytics modules** — Bayesian inference, Monte Carlo, isolation forest, gradient boost, change points, SHAP, deal scoring, founder score, moat analysis, ESG, geopolitical risk, scenario planning. Catalog: [`src/lib/intelligence/`](src/lib/intelligence/)
- **LP-grade PDF reports** ([`src/lib/intelligence/lp-report.ts`](src/lib/intelligence/lp-report.ts)) and Solana Actions / Blinks shareable verification links ([`src/lib/solana/solana-actions.ts`](src/lib/solana/solana-actions.ts))

---

## Project layout

```
src/
├── pages/                  React Router routes
├── components/             UI grouped by domain (audit/, dashboard/,
│                           governance/, startup/, ui/, …)
├── hooks/                  data + chain side-effects
├── contexts/               Auth, Wallet, Realtime, InstitutionalView
├── providers/              Web3, Tooltip, QueryClient
├── integrations/supabase/  generated client + types
├── lib/
│   ├── security/           sanitisers, errors, telemetry, fetch timeouts
│   ├── solana/             contracts, PDAs, memo, helius, cluster verify
│   ├── format/             format, constants, clipboard, role-access
│   ├── mock/               demo + fixture data
│   ├── intelligence/       70+ domain-analytics modules
│   └── utils.ts            shadcn cn() helper
├── sdk/                    programmatic SDK surface
└── test/                   centralized vitest tests

blockchain/programs/chainmetrics/   Anchor program (24 instructions)
supabase/migrations/                SQL — RLS lives here
supabase/functions/                 Deno Edge Functions
```

Layer rules + import boundaries → [ARCHITECTURE.md](ARCHITECTURE.md).

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Vite 5, Tailwind 3, shadcn/ui, Framer Motion |
| Blockchain | Solana web3.js, `@coral-xyz/anchor` 0.30, SPL Token, three single-package wallet adapters (Phantom, Solflare, Coinbase) |
| Backend (BaaS) | Supabase (Postgres + RLS + Auth + Realtime + Edge Functions) |
| Charts | Recharts |
| PDF | html2canvas + jsPDF |
| Test | Vitest 3, jsdom, @testing-library/react |
| Lint / format | ESLint 9, Prettier (`.editorconfig` mirrors the rules) |
| Deploy | Vercel (`vercel.json` ships CSP / HSTS / X-Frame-Options) |

---

## Environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon JWT — public-by-design>
VITE_SOLANA_PROGRAM_ID=<deployed Anchor program id>
VITE_SOLANA_CLUSTER=devnet                # or mainnet-beta
VITE_HELIUS_API_KEY=<optional, enables Smart Money detection>
VITE_SENTRY_DSN=<optional, telemetry>
```

The `VITE_SUPABASE_PUBLISHABLE_KEY` is intentionally public — RLS gates every read/write. See [SECURITY.md](SECURITY.md).

In production builds, missing `VITE_SOLANA_PROGRAM_ID` causes the app to throw at module load (defense-in-depth so a misconfigured deploy can't sign against the placeholder program ID).

---

## Security at a glance

- **3 independent smart-contract audits** (OtterSec, Sec3, CertiK) — zero critical findings
- **2026-05 internal deep-pass** — closed 1 Critical + 4 High + 5 Medium issues. Reports in [SECURITY_AUDIT/](SECURITY_AUDIT/)
- **CSP `script-src 'self'`** (no `'unsafe-inline'`), HSTS preload, frame-ancestors `'none'`
- **`npm audit`**: 0 critical, 3 high (deliberate `bigint-buffer` chain — full rationale in [SECURITY.md](SECURITY.md))
- **74 regression tests** locking financial conversion, sanitization, and role gates

The full pointer-list, with file references for every defense, is in [SECURITY.md](SECURITY.md).

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch policy, commit format, and the test/lint loop. Short version: branch off `merged-ai-roadmap-v2`, conventional commits, no force pushes, all PRs run CI on push.

## License

Proprietary. All rights reserved.
