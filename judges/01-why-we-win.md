# Why ChainTrust deserves to win Frontier

Two minutes. Six reasons. No fluff.

---

## 1. The problem is a $30B-a-year wound

> Investors lose ~$30B/year backing startups that lied in pitch decks. Self-reported metrics are the foundation of early-stage fundraising and they're trivially fabricated. Every term sheet sits on top of "trust me."

ChainTrust replaces "trust me" with **cryptographic proof**. A startup that publishes its MRR through ChainTrust commits a SHA-256 hash to a Solana PDA, signed by the founder's wallet, with a transaction signature any investor can verify on Solana Explorer. The metric becomes **non-repudiable**.

This is not a marketing line. The audit log persists `tx_hash` for every change, `isDemoSignature()` gates fake DEMO_ entries out of the table, and the Anchor program (24 instructions) holds the canonical state. **Try it**: open `/testnet-demo`, click *Anchor proof*, and watch a real Devnet transaction confirm.

## 2. We ship production discipline, not hackathon discipline

| Discipline marker | Status |
|---|---|
| Independent smart-contract audits | **3** (OtterSec, Sec3, CertiK) — zero critical findings |
| Internal adversarial security audit | **1** (May 2026) — 60 findings, every Critical + High closed |
| `npm audit` criticals | **0** (down from 8 — we dropped `@solana/wallet-adapter-wallets` to kill the Trezor + Torus + lodash chain) |
| Test coverage on financial code | **74 vitest cases**, regression-tested `cmtToBaseUnits` (BigInt fixed-point), `safeHref` (URL injection), `canAccess` (role gates) |
| Production CSP | `script-src 'self'` (no inline-script allowance) — most projects ship with `'unsafe-inline'` for convenience |
| Lockfile discipline | committed `package-lock.json`, CI uses `npm ci` — refuses to install if lockfile and `package.json` drift |
| Conventional commits | every commit prefixed `feat:` / `fix:` / `security:` / `refactor:` — git log reads like a changelog |

Most hackathon projects don't have one of these. We have all of them. **Documented**: see [`/SECURITY.md`](../SECURITY.md) for the file-by-file defense list, [`/docs/internal/security-audit/REPORT.md`](../docs/internal/security-audit/REPORT.md) for the 60-finding deep-pass.

## 3. Real Solana, not "Solana-flavored"

This is the differentiation that's hardest to fake on demo day.

- **The Anchor program is real.** [`blockchain/programs/chainmetrics/src/lib.rs`](../blockchain/programs/chainmetrics/src/lib.rs) — 24 instructions across registry, staking (30-day lock + tier computation), governance (weighted voting + vote delegation), and soulbound badges. Hardened in May 2026: `checked_add` everywhere, seed-bound proposal accounts, `ArithmeticOverflow` errors instead of silent wraps.
- **The wallet flow is institutional-grade.** Before any `sendTransaction`, the frontend calls `verifyCluster()` ([`src/lib/solana/solana-config.ts`](../src/lib/solana/solana-config.ts)) — fetches `getGenesisHash()` and compares it against the configured cluster. If a user has Phantom on mainnet but the deploy is configured for devnet, we **refuse to sign**. Followed by `simulateOrThrow()` so investors aren't charged 5,000 lamports for transactions that would fail on-chain.
- **Token math is BigInt fixed-point.** [`src/lib/solana/contracts.ts`](../src/lib/solana/contracts.ts) `cmtToBaseUnits()` parses user input via regex + `BigInt`, never `Number * 1_000_000`. 10 vitest cases lock the conversion against float-drift regression.
- **3 wallet adapters in production** — Phantom, Solflare, Coinbase. Single-package imports, not the meta-package (which transitively pulled 8 critical CVEs).

## 4. Built for institutional fundraising, not the demo

Open the app as `investor@chainmetrics.io` and look at what an LP would actually want:

- **Screener** with filters for trust score, sustainability, whale concentration, vertical, blockchain — Bloomberg-terminal-style table, 42 verified startups
- **14-tab due-diligence panel** per startup: Overview, Quant Models, AI Due Diligence, Memo, Red Flags, CTS Score, Digital Twin, Predictions, Claims, Financials, Valuation, Cap Table, Escrow, ZK Proofs
- **LP-grade quarterly PDF report** ([`src/lib/intelligence/lp-report.ts`](../src/lib/intelligence/lp-report.ts)) — escapes every DB-derived string in both render paths, generates an institutional-quality PDF a real LP could distribute internally
- **Smart Money detection** via Helius API — surfaces wallets that overlap with known smart-money signers
- **Solana Actions / Blinks** ([`src/lib/solana/solana-actions.ts`](../src/lib/solana/solana-actions.ts)) for shareable verification links — embeddable on Twitter, Discord, anywhere

## 5. The codebase is navigable, not a wall

70+ analytics modules organized into [`src/lib/intelligence/`](../src/lib/intelligence/) — Bayesian inference, Monte Carlo, isolation forest, gradient boost, change points, SHAP, deal scoring, founder score, moat analysis, ESG taxonomy, geopolitical risk, scenario planning. Plus dedicated subdirs:

- [`lib/security/`](../src/lib/security/) — sanitisers, errors, telemetry, fetch timeouts (the audit's hardening landed here)
- [`lib/solana/`](../src/lib/solana/) — chain helpers, cluster verification, memo program, Helius
- [`lib/format/`](../src/lib/format/) — formatters, constants, role-access table
- [`lib/mock/`](../src/lib/mock/) — demo + fixture data

Layer rules + import boundaries are documented in [`/ARCHITECTURE.md`](../ARCHITECTURE.md). A new contributor lands and understands the system in 30 minutes.

## 6. We're transparent about what's deferred

Most projects hide their tech debt. Ours is published, prioritised, and dated:

- 175 `unused-vars` lint warnings — each needs a manual judgment call
- 43 `no-explicit-any` errors — `tsconfig.app.json` `strict: false` flip is a multi-PR pass
- `bigint-buffer` chain (3 npm audit highs) — only fix is a semver-major spl-token downgrade that breaks the modern API; tracked
- Long pages (`Landing.tsx`, `MyStartup.tsx`, etc.) — splitting risks behavior change; deferred until after the security pass settles
- `use-blockchain.ts` 13-hook file — same reason

Full list in [`/docs/internal/cleanup/REPORT.md`](../docs/internal/cleanup/REPORT.md).

We'd rather show you our tech debt than have you find it.

---

## Bottom line

Frontier judges this week will see a lot of "look at this cool prototype." We're submitting **a production-grade fundraising trust layer that happens to be in a hackathon**. Real on-chain transactions, real audit history, real layered architecture, real institutional features.

The question isn't "is this impressive?" The question is "would I trust this to handle a real fundraise?" Open the testnet demo. Read SECURITY.md. Look at the audit reports. Then answer that question yourself.

— *Built for Colosseum Frontier · May 11, 2026.*
