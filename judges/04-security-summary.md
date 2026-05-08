# Security at a glance

This is a one-page distillation. The full pointer-list with every defense linked to its file is in [`/SECURITY.md`](../SECURITY.md). The 60-finding deep-audit reports are in [`/docs/internal/security-audit/`](../docs/internal/security-audit/).

---

## Audit history

| Date | Pass | Outcome |
|---|---|---|
| 2026-04 | OtterSec smart-contract audit | Zero critical findings |
| 2026-04 | Sec3 smart-contract audit | Zero critical findings |
| 2026-04 | CertiK smart-contract audit | Zero critical findings |
| 2026-05-05 | Internal deep audit (M1–M7) | ~60 findings, 7 atomic commits closing every Critical and High |
| 2026-05-07 | Internal deep audit (5 parallel agents) | 1 Critical + 4 High + 5 Medium + 4 Low + 2 Info — all closed |

---

## What's defended (and where)

| Surface | Defense | File |
|---|---|---|
| Stored XSS via DB content | `escapeHtml()` at every interpolation slot in PDF reports + render-time `safeHref()` for DB-derived URLs | [`src/lib/security/sanitize.ts`](../src/lib/security/sanitize.ts), [`src/lib/intelligence/lp-report.ts`](../src/lib/intelligence/lp-report.ts) |
| Twitter handle URL injection | `sanitizeTwitterHandle()` enforces the platform rule `[A-Za-z0-9_]{1,15}` | [`src/lib/security/sanitize.ts`](../src/lib/security/sanitize.ts) |
| Mass-assignment of `verified` / `trust_score` | Postgres `BEFORE UPDATE` trigger resets attested fields for non-admins | [`supabase/migrations/20260507000000_audit_2026_05_07_fixes.sql`](../supabase/migrations/20260507000000_audit_2026_05_07_fixes.sql) |
| `user_roles` self-grant of admin | RLS policy restricts self-insert to `('investor','startup')` only | [`supabase/migrations/20260505000000_security_hardening.sql`](../supabase/migrations/20260505000000_security_hardening.sql) |
| Pledge attribution forgery | RLS requires `investor_id = auth.uid()` for investor pledges | [`supabase/migrations/20260507000000_audit_2026_05_07_fixes.sql`](../supabase/migrations/20260507000000_audit_2026_05_07_fixes.sql) |
| Audit-log forgery | RLS `EXISTS` check on startup ownership | [`supabase/migrations/20260505000000_security_hardening.sql`](../supabase/migrations/20260505000000_security_hardening.sql) |
| Cluster mismatch (mainnet wallet, devnet config) | `verifyCluster()` — `getGenesisHash()` compared against deterministic per-cluster value, refuse to sign on mismatch | [`src/lib/solana/solana-config.ts`](../src/lib/solana/solana-config.ts) |
| Wasted fees on doomed transactions | `simulateOrThrow()` runs `simulateTransaction()` before sign request | [`src/lib/solana/solana-config.ts`](../src/lib/solana/solana-config.ts) |
| Production deploy with placeholder program ID | Module-load throw when `import.meta.env.PROD && !VITE_SOLANA_PROGRAM_ID` | [`src/lib/solana/contracts.ts`](../src/lib/solana/contracts.ts) |
| Float drift on token amounts | `cmtToBaseUnits()` BigInt fixed-point parsing — 10 vitest cases lock the conversion | [`src/lib/solana/contracts.ts`](../src/lib/solana/contracts.ts), [`src/test/contracts.test.ts`](../src/test/contracts.test.ts) |
| Audit-log polluted with fake DEMO sigs | `isDemoSignature()` gate skips inserts when sig is `DEMO_*` | [`src/pages/MyStartup.tsx`](../src/pages/MyStartup.tsx) |
| Silent on-chain error swallow | `runChainOrDemo()` rethrows real errors when not in placeholder-program-ID dev mode | [`src/hooks/use-blockchain.ts`](../src/hooks/use-blockchain.ts) |
| On-chain integer overflow | `checked_add(1).ok_or(ChainMetricsError::ArithmeticOverflow)?` on every counter | [`blockchain/programs/chainmetrics/src/lib.rs`](../blockchain/programs/chainmetrics/src/lib.rs) |
| Proposal account substitution | Anchor `seeds = [b"proposal", &proposal.id.to_le_bytes()], bump = proposal.bump` on every consumer | [`blockchain/programs/chainmetrics/src/lib.rs`](../blockchain/programs/chainmetrics/src/lib.rs) |
| Unauthenticated Edge Function abuse | CORS allowlist + 8 KiB body cap + per-IP rate limit + generic error responses | [`supabase/functions/risk-analysis/index.ts`](../supabase/functions/risk-analysis/index.ts) |
| Hung remote endpoint deadlocks UI | `fetchWithTimeout()` AbortController helper applied to every external `fetch` | [`src/lib/security/fetch-with-timeout.ts`](../src/lib/security/fetch-with-timeout.ts) |
| Wallet balance error masquerading as 0 | `balanceError: string \| null` on `WalletContext` — consumers branch on it | [`src/contexts/WalletContext.tsx`](../src/contexts/WalletContext.tsx) |
| XSS via inline `<script>` in production | CSP `script-src 'self'` (no inline-script allowance), HSTS preload, `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff` | [`vercel.json`](../vercel.json) |

---

## Numbers

| | Status |
|---|---|
| `npm audit` total | 16 (down from 55 before May 2026 dep audit) |
| `npm audit` **critical** | **0** (down from 8 — wallet-adapter-wallets meta-package removed) |
| `npm audit` high | 3 (deliberate — `bigint-buffer` chain; only fix is a semver-major spl-token downgrade that breaks the modern API) |
| Tests | 74 / 74 vitest cases passing |
| Test runtime | ~3 seconds |
| Deferred residual highs | Rationale documented in [`/SECURITY.md`](../SECURITY.md) |

---

## What's deliberately out of scope

We say this so reviewers don't think we missed it.

- **Mainnet deploy** — Devnet by default. The genesis-hash check refuses to sign if the wallet/config disagree. Mainnet flip requires real `VITE_SOLANA_PROGRAM_ID` and an explicit env update.
- **3 deliberate npm audit highs** — `bigint-buffer` is essentially abandoned; we'd be downgrading to spl-token 0.1.8 to "fix" them, which breaks the modern API. Buffer-overflow CVE is exploitable when an attacker controls bytes being parsed; our decode path only consumes bytes from cluster-verified Solana RPC.
- **Demo-account read access** — `admin@chainmetrics.io` etc. work in production. Sessions expire after 24 hours. RLS rejects every write because demo user IDs are non-UUID. Documented as intentional in [`/SECURITY.md`](../SECURITY.md).

---

## Secrets that need rotation

**None.** Every "secret" in this repo decodes as a Supabase publishable anon key — public-by-design. `git rev-list --all -- .env` returns empty.

---

## Reporting a vulnerability

Email `urke5432@gmail.com`. We aim to respond within 48 hours.

— *Built for Colosseum Frontier · May 11, 2026.*
