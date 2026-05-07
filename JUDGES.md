# 30-Second Tour for Judges

> **Hello!** This page is a guided shortcut so you don't have to spend 20 minutes guessing what to look at. Estimated read: **3 minutes**.

---

## What ChainTrust is, in one paragraph

ChainTrust is the **trust layer for early-stage Solana startups**: founders publish their metrics on-chain (SHA-256 hashed → Solana PDAs), independent oracles verify them, and investors browse a screener / due-diligence stack backed by real cryptographic proof chains rather than self-reported PowerPoints. Built for investors tired of being lied to by pitch decks.

## See it run, with no install

| What | How long | Link |
|---|---|---|
| **Live on-chain transaction** — connect Phantom (Devnet), click airdrop, click anchor; you get a real signed Solana tx with an Explorer link. | 10 seconds | [`/testnet-demo`](src/pages/LiveTestnetDemo.tsx) — full walkthrough in [docs/LIVE_TESTNET_DEMO.md](docs/LIVE_TESTNET_DEMO.md) |
| **Run locally** | 60 seconds | `npm install --legacy-peer-deps && npm run dev` → localhost:8080 |
| **Demo accounts** (one-click on `/login`) | instant | `admin@chainmetrics.io` / `admin123` · `investor@chainmetrics.io` / `investor1` · `startup@chainmetrics.io` / `startup1` |

## What to look at first (in this order)

1. **The smart contract** — [blockchain/programs/chainmetrics/src/](blockchain/programs/chainmetrics/src/). 24 Anchor instructions across registry, staking (30-day lock + tier computation), governance (weighted voting + delegation), and soulbound badges.
2. **The proof flow** — [src/lib/solana/memo-anchor.ts](src/lib/solana/memo-anchor.ts) shows the live SPL-Memo path used by the testnet demo. Includes cluster verification + transaction simulation before the wallet ever sees a sign request.
3. **The investor screener** — `/dashboard` or `/screener` after sign-in as investor. PDF export uses [src/lib/intelligence/lp-report.ts](src/lib/intelligence/lp-report.ts) (LP-grade quarterly report).
4. **The architecture** — [ARCHITECTURE.md](ARCHITECTURE.md) documents the layers + import rules. Briefly: [`src/pages/`](src/pages/) (23 routes), [`src/hooks/`](src/hooks/) (data + chain), [`src/contexts/`](src/contexts/) (Auth + Wallet), [`src/lib/`](src/lib/) split into `security/`, `solana/`, `format/`, `mock/`, `intelligence/`.

## Why this team is different

- **Security**: see [SECURITY.md](SECURITY.md). We just ran a deep audit (5 parallel agents, ~60 findings) and shipped 7 atomic commits closing every Critical and High that wasn't a forced semver-major downgrade. **8 → 0 critical npm vulnerabilities.** Zero `'unsafe-inline'` in CSP script-src. RLS hardened to block the classic Supabase admin-self-grant footgun.
- **Real on-chain transactions, not screenshots**: the testnet demo posts a signed transaction to Solana Devnet right now. Click the Explorer link → see it confirmed.
- **Tested where it matters**: 74 vitest cases. Financial code (`cmtToBaseUnits` BigInt math), input sanitization (`sanitizeUrl` / `safeHref` / `sanitizeTwitterHandle`), and role-access guards (`canAccess`) all have regression tests.

## What's intentionally limited (we'd rather tell you than have you find it)

- **Mainnet is not enabled by default.** Devnet is the configured cluster. M2 enforces a genesis-hash check before signing — flipping to mainnet without a real `VITE_SOLANA_PROGRAM_ID` will refuse to start.
- **Three remaining `npm audit` highs are deliberate.** They chain through `bigint-buffer` (used by `@solana/spl-token` to decode account data). The only `npm audit` "fix" is a semver-major downgrade of spl-token to 0.1.8 which breaks the modern API. Practical impact for our use-case is low: the buffer-overflow CVE is exploitable when an attacker controls the bytes being parsed, and our decode path only consumes bytes from cluster-verified Solana RPC. Tracked for follow-up if `bigint-buffer` ever ships a real patch.
- **Some hooks fall back to demo data** when Supabase is unreachable or `VITE_SOLANA_PROGRAM_ID` is unset. Demo signatures are clearly prefixed `DEMO_` and **not** persisted to `startup_audit_log` (M3 closed that audit-trail integrity gap).

## Repo signals

- **Branch model** — `master` is the Frontier-ready snapshot (what you should clone). `merged-ai-roadmap-v2` is the dev branch. `backup` is a frozen restore point.
- **CI on every push** — GitHub Actions runs lint + typecheck + test + build. See `.github/workflows/ci.yml`.
- **Conventional commits** — every commit prefixed `feat:` / `fix:` / `security:` / `perf:` / etc. Git log reads like a changelog.

## Questions? Read these next, in order

1. [README.md](README.md) — the longer pitch.
2. [SECURITY.md](SECURITY.md) — what we defend against, with file pointers.
3. [DEMO_VIDEO.md](DEMO_VIDEO.md) — the 3-minute submission video script + storyboard (with verified screenshots of every scene).
4. [docs/LIVE_TESTNET_DEMO.md](docs/LIVE_TESTNET_DEMO.md) — full walkthrough of the on-chain demo.
5. [UPGRADE_NOTES.md](UPGRADE_NOTES.md) — Phase 5 senior-engineer cleanup notes.

— Built for **Colosseum Frontier · May 11, 2026**.
