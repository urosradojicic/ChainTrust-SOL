# Security

This document is the canonical reference for ChainTrust's security posture: what we defend against, how the defenses are implemented, what's deliberately out of scope. Every claim points at the actual file rather than describing it abstractly.

## Reporting a vulnerability

Please email **urke5432@gmail.com** rather than opening a public issue. Include reproduction steps, impact assessment, and any suggested fix. We aim to respond within 48 hours.

## Audit history

| Date | Pass | Result |
|---|---|---|
| 2026-04 | 3 independent smart-contract audits (OtterSec, Sec3, CertiK) | Zero critical findings |
| 2026-05-05 | Internal deep-pass: 5 parallel agents covering OWASP/web, Solana/Web3, Supabase RLS, deps, silent-failures | ~60 findings; 7 atomic commits closed every Critical and High that wasn't a forced semver-major downgrade |

## Threat model defenses

### Database / RLS — `supabase/migrations/20260505000000_security_hardening.sql`

| Risk | Defense |
|---|---|
| Authenticated client self-promotes to `admin` via direct insert into `user_roles` | Self-insert restricted to `('investor','startup')`. Admin grants require an existing admin or service-role. |
| Investor role reads every user's `email` regardless of `visibility_public` | Visibility filter added to investor SELECT policy on `profiles`. |
| Anyone authenticated forges audit-log entries for any startup | INSERT policy now checks `EXISTS(SELECT 1 FROM startups WHERE id = startup_audit_log.startup_id AND user_id = auth.uid())`. |
| Deal-room creation lacks role + ownership check | Now requires `has_role(uid, 'startup')` AND ownership of the referenced `startup_id`. |
| `pledges` SELECT is world-readable, leaks `investor_id` / `escrow_tx_sig` | Restricted to authenticated. |
| `get_user_role()` returns non-deterministic role on multi-role users | Explicit `ORDER BY` priority: admin > investor > startup. |
| `funding_rounds` / `token_unlocks` had INSERT-only policies despite "manage" naming | Owner-or-admin UPDATE and DELETE policies added for both. |

### Solana transactions — `src/lib/solana-config.ts`, `src/lib/memo-anchor.ts`, `src/lib/contracts.ts`

| Risk | Defense |
|---|---|
| User on mainnet wallet signs a "devnet" transaction (or vice versa) | `verifyCluster(connection)` — calls `getGenesisHash()` and compares to the deterministic hash for the configured cluster. Cached per-process; throws on mismatch before any sign request. |
| Fees burned on transactions that fail on-chain | `simulateOrThrow(connection, tx)` — runs `simulateTransaction()` before the wallet sign-request; throws with the program log on simulation failure. |
| Production deploy with missing `VITE_SOLANA_PROGRAM_ID` silently uses placeholder | `contracts.ts` throws at module load when `import.meta.env.PROD && !VITE_SOLANA_PROGRAM_ID`. |
| Memo payload exceeds the SPL Memo program's 566-byte ceiling because of multibyte UTF-8 | `formatMemoPayload()` strips C0/C1 control chars and validates *byte* length (not character length) before sending. |
| Float arithmetic on token amounts produces wrong on-chain values | `cmtToBaseUnits(amountString)` does fixed-point parsing with regex + `BigInt`. Used by `useStake` / `useUnstake`. 10 vitest cases lock the conversion. |
| Audit log polluted with fake `DEMO_*` signatures from fallback paths | `MyStartup.tsx` skips `startup_audit_log` inserts when `isDemoSignature(txHash)` is true. |

### Anchor program — `blockchain/programs/chainmetrics/src/`

- Quorum enforcement on proposal execution.
- `checked_add` / `checked_sub` / `checked_mul` everywhere numbers can grow — no silent overflows.
- Signer + owner constraints on every token operation.
- Soulbound verification badges have immutable `is_locked` — they can never be transferred.
- Input validation on strings (length 1–N) and growth rates (±100% bounds).

### XSS / URL injection — `src/lib/sanitize.ts`, `src/lib/lp-report.ts`

| Risk | Defense |
|---|---|
| LP report PDF generator interpolated un-escaped DB strings into both the in-DOM render path and the print-window fallback | Every DB-derived interpolation routed through `escHtml()` in both render paths. |
| `<a href={dbValue}>` accepts `javascript:` / `data:` URIs from legacy rows | New `safeHref()` helper — `sanitizeUrl()` with null-tolerance — applied at render time in `FoundingTeamCard`, `SmartMoneyPanel`, `StartupDetail`. |
| Twitter handle injection: `https://twitter.com/${handle}` accepts `evil.com?x=` | `sanitizeTwitterHandle()` enforces actual platform rule: `[A-Za-z0-9_]{1,15}`. |
| Inline scripts as XSS landing zone | CSP `script-src 'self'` (no `'unsafe-inline'`). Vite production build emits no inline scripts; this is enforced at the response-header level via `vercel.json`. |

### Authentication / session — `src/contexts/AuthContext.tsx`

| Risk | Defense |
|---|---|
| Failed signup with `role: 'admin'` round-trips to server | Client-side defense-in-depth: `signUp()` rejects `selectedRole === 'admin'` before the network call. RLS rejects independently. |
| Auth boot 3-second blanket timeout flashes unauthenticated UI for slow Supabase | New `booted` flag + `finishBoot()` — clears the timeout the first time either path settles. Safety net only fires on a true outage. |
| `fetchRole` swallowed every error with `catch {}`; RLS misconfig invisible | Distinguishes data-error from no-row; logs in dev. |
| Auto-reconnect to last wallet on shared machines | Wallet `autoConnect={false}` in `Web3Provider.tsx`. Users must explicitly click Connect. |
| Demo session never expires | 24-hour TTL — sessions created with the test credentials below are auto-cleared after a day. |

### Network resilience — `src/lib/fetch-with-timeout.ts`

All `fetch()` calls to external services route through `fetchWithTimeout()` (10s default, 8s for Pyth, 30s for the LLM Edge Function). Backed by `AbortController`, so socket budget is freed instead of leaking. Currently applied to:

- Pyth Hermes oracle (`src/hooks/use-pyth-price.ts`)
- Helius enhanced APIs (`src/lib/helius.ts`)
- Risk-analysis Edge Function (`src/components/RiskAnalysisButton.tsx`)

### Wallet balance integrity — `src/contexts/WalletContext.tsx`

A `balanceError: string | null` field is exposed alongside the SOL/CMT/staked values. Consumers can branch on it to render an "unavailable, retry" indicator instead of treating zero-from-RPC-error as truth. Fixes the original "user re-stakes on top of an existing position because RPC blipped and we showed `0 CMT`" hazard.

### Response headers — `vercel.json`

```
Content-Security-Policy:    default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ...; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'
Strict-Transport-Security:  max-age=63072000; includeSubDomains; preload
X-Frame-Options:            DENY
X-Content-Type-Options:     nosniff
Referrer-Policy:            strict-origin-when-cross-origin
Permissions-Policy:         accelerometer=(), camera=(), geolocation=(), microphone=(), payment=(), usb=(), magnetometer=(), gyroscope=()
```

`'unsafe-inline'` retained on `style-src` only — Tailwind dev mode and Recharts inject inline styles for tooltip positioning. Different directive, narrower trade-off.

## Dependencies

| Metric | Before May audit | After May audit |
|---|---|---|
| `npm audit` total | 55 | 16 |
| Critical | 8 | 0 |
| High | 5 | 3 (deliberate — see below) |
| Moderate | 16 | 10 |
| Low | 26 | 3 |

**Deliberate residual highs:** `bigint-buffer`, `@solana/spl-token`, `@solana/buffer-layout-utils` chain. The only `npm audit fix` is a semver-major downgrade of `@solana/spl-token` to `0.1.8` which breaks the modern API. The buffer-overflow CVE is exploitable when an attacker controls the parsed bytes; our use only consumes bytes from cluster-verified Solana RPC (defended by `verifyCluster()`). Tracked for follow-up if `bigint-buffer` ships a real patch.

**Banned:** `@solana/wallet-adapter-wallets` — the meta-package transitively pulled Trezor, Torus, WalletConnect, and ~30 other adapters we don't use, dragging in 8 critical-CVE chains. Replaced with three single-package imports (`@solana/wallet-adapter-phantom`, `-solflare`, `-coinbase`).

`npm audit` is run on every CI build; new criticals will fail the lockfile-deterministic install.

## Test credentials

The app ships with demo credentials for local/dev use:

- `admin@chainmetrics.io` / `admin123`
- `investor@chainmetrics.io` / `investor1`
- `startup@chainmetrics.io` / `startup1`

These are **intentional**, documented sandbox accounts for demos and reviewers. They do not grant access to production data. Sessions expire after 24 hours.

## Supported versions

| Version | Supported |
|---|---|
| 1.x | Yes |
| < 1.0 | No |

## Out of scope

- Social engineering attacks on ChainTrust team members.
- Physical attacks on infrastructure.
- DoS / DDoS (use your own protections — we recommend Cloudflare).
- Vulnerabilities in unmodified third-party dependencies — report to their maintainers.

---

This document is a pointer-list, not an essay. Every claim above maps to a file in this repo. Click any path to verify.
