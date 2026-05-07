# ChainTrust

**The trust layer for startup fundraising on Solana.**

ChainTrust lets startups publish metrics on-chain, get verified by independent oracles, and lets investors browse a screener / due-diligence stack backed by real cryptographic proof chains rather than self-reported pitch decks.

> **Submitting to Colosseum Frontier — May 11, 2026.** `master` is the Frontier-ready snapshot. Active development happens on `merged-ai-roadmap-v2`, lands on `master` via fast-forward when stable. `backup` is a frozen restore point — `git fetch origin backup && git reset --hard origin/backup` to roll back.

> **Reading this for the first time?** Pick the doc that matches your goal:
> - **Hackathon judge** → [JUDGES.md](JUDGES.md) — 3-minute guided tour with demo credentials
> - **New contributor** → [ARCHITECTURE.md](ARCHITECTURE.md) — layers, layout, where things live
> - **Security reviewer** → [SECURITY.md](SECURITY.md) — defenses + audit history with file pointers
> - **Recording the demo video** → [DEMO_VIDEO.md](DEMO_VIDEO.md) — 3:00 script with verified storyboard

## Quick start

```bash
npm install --legacy-peer-deps    # see CONTRIBUTING.md for why --legacy-peer-deps
npm run dev                        # localhost:8080
npm test -- --run                  # 74 vitest cases
npm run typecheck                  # tsc --noEmit
npm run build                      # production bundle into dist/
```

Demo credentials (no signup, one-click on `/login`):

| Role | Email | Password |
|---|---|---|
| Investor | `investor@chainmetrics.io` | `investor1` |
| Startup | `startup@chainmetrics.io` | `startup1` |
| Admin | `admin@chainmetrics.io` | `admin123` |

Sessions expire after 24 hours. RLS rejects all writes from demo users — they're read-only navigation accounts.

## Project layout

```
src/
├── pages/                  React Router routes (one page per file)
├── components/             UI components — grouped by domain (audit/, dashboard/,
│                           governance/, startup/, ui/, …)
├── hooks/                  React hooks (data + chain side-effects)
├── contexts/               app-wide state providers (Auth, Wallet, Realtime, …)
├── providers/              third-party providers (Web3, Tooltip, QueryClient)
├── integrations/supabase/  generated Supabase client + types
├── lib/
│   ├── security/           sanitisers, errors, telemetry, fetch timeouts
│   ├── solana/             chain helpers (contracts, PDAs, memo, helius)
│   ├── format/             formatters, constants, clipboard, role-access
│   ├── mock/               demo + fixture data
│   ├── intelligence/       domain analytics, scoring, reports (~70 modules)
│   └── utils.ts            shadcn cn() class-merge helper
├── sdk/                    programmatic SDK surface
├── test/                   centralized vitest tests
└── types/                  shared TypeScript types

blockchain/
├── programs/chainmetrics/  Anchor smart contract (24 instructions)
└── tests/                  program test suite

supabase/
├── migrations/             SQL migrations (RLS policies live here)
└── functions/              Deno Edge Functions
```

The architecture rules — what's allowed to import what, where each kind of code belongs — are in [ARCHITECTURE.md](ARCHITECTURE.md).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript 5, Vite 5, Tailwind 3, shadcn/ui, Framer Motion |
| Blockchain | Solana web3.js, `@coral-xyz/anchor` 0.30, SPL Token, three single-package wallet adapters (Phantom, Solflare, Coinbase) |
| Backend (BaaS) | Supabase (PostgreSQL + RLS + Auth + Realtime + Edge Functions) |
| Charts | Recharts |
| PDF | html2canvas + jsPDF |
| Test | Vitest 3, jsdom, @testing-library/react |
| Lint / format | ESLint 9, Prettier (`.editorconfig` mirrors the rules) |
| Deploy | Vercel (`vercel.json` ships CSP / HSTS / X-Frame-Options) |

## Smart contract

The `chainmetrics` Anchor program implements 24 on-chain instructions across:

- **Registry** — startup registration, metrics publication, verification, trust scoring
- **Staking** — CMT vault with 30-day lock, tier computation, reward distribution
- **Governance** — proposals, weighted voting, execution, delegation
- **Badges** — soulbound verification NFTs

Source lives at [`blockchain/programs/chainmetrics/src/`](blockchain/programs/chainmetrics/src/).

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

The `VITE_SUPABASE_PUBLISHABLE_KEY` is intentionally public — RLS gates every read/write. See [SECURITY.md](SECURITY.md) for the full rotation policy.

In production builds, missing `VITE_SOLANA_PROGRAM_ID` causes the app to throw at module load (defense-in-depth so a misconfigured deploy can't sign transactions against the placeholder program ID).

## Security posture (one-paragraph version)

3 independent smart-contract audits (OtterSec, Sec3, CertiK — zero critical findings) plus a 2026-05 internal deep-pass that closed **1 Critical + 4 High + 5 Medium** RLS / web / Solana issues. CSP `script-src 'self'` (no `'unsafe-inline'`), HSTS preload, frame-ancestors `'none'`. `npm audit`: 0 critical, 3 high (deliberate `bigint-buffer` chain — see SECURITY.md). The full pointer-list with file references is in [SECURITY.md](SECURITY.md). The audit reports themselves are in [SECURITY_AUDIT/](SECURITY_AUDIT/).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for branch policy, commit message format, and the test/lint loop. Short version: branch off `merged-ai-roadmap-v2`, conventional commits, no force pushes, all PRs run CI on push.

## License

Proprietary. All rights reserved.
