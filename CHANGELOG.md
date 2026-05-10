# Changelog

All notable changes to this project follow [Conventional Commits](https://www.conventionalcommits.org/) and are tagged with the affected scope. The format roughly follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [1.0.0-frontier] — 2026-05-07

The Frontier-ready snapshot. This is what investors and Colosseum judges land on.

### Added — Documentation

- `judges/` folder — curated entry point for hackathon judges with 5 short docs (`README.md`, `01-why-we-win.md`, `02-three-minute-tour.md`, `03-demo-video.md`, `04-security-summary.md`, `05-pitch.md`) and 11 verified demo screenshots.
- `judges/banner.svg` — branded hero banner (1280×320 SVG with brand gradient, KPIs, Frontier badge).
- `ARCHITECTURE.md` (root) — authoritative layer-rules + import-boundaries reference, with Mermaid diagrams for the request lifecycle.
- `CONTRIBUTING.md` (root) — branch policy, conventional-commit format, pre-PR checklist.
- `.editorconfig` — mirrors `.prettierrc.json` for editors without a Prettier plugin.
- `CHANGELOG.md` (this file).

### Changed — Documentation

- `README.md` rewritten to be judge-instant: hero banner + 6 status badges + direct entry-point grid + Mermaid trust-flow diagram + collapsible `<details>` for less-essential sections.
- `JUDGES.md` → `judges/02-three-minute-tour.md`; `DEMO_VIDEO.md` → `judges/03-demo-video.md`; `PITCH.md` → `judges/05-pitch.md`.
- 12 historical / planning docs moved to `docs/internal/{planning,cleanup,security-audit,…}/` so the repo root only carries what GitHub auto-detects (README, SECURITY, CONTRIBUTING, ARCHITECTURE, LICENSE).

### Added — Security (1 Critical + 4 High + 5 Medium fixes from the May 2026 deep audit)

- **C1** Postgres `BEFORE UPDATE` trigger `guard_startup_attested_fields` resets `verified` / `trust_score` / `*_score` / `user_id` / `created_at` to OLD values for non-admin updates.
- **H1** `useExecuteProposal` account list now matches the on-chain Anchor `ExecuteProposal` struct (added `vault` PDA in position 3).
- **H2** New `runChainOrDemo` helper rethrows real on-chain errors when `IS_PLACEHOLDER_PROGRAM_ID` is false instead of swallowing them into fake `DEMO_*` signatures.
- **H3** New RLS policy `Pledge insert with attribution` requires `investor_id = auth.uid()` for investor pledges; added missing UPDATE/DELETE policies.
- **M1** Edge Function `risk-analysis`: CORS origin allowlist + 8 KiB body cap + per-IP rate limit + generic error responses.
- **M2/M3** URL hardening: `EntityDossier.tsx` and `entity-aggregator.ts` route every DB-derived URL through `explorerTxUrl()` / `explorerAddressUrl()` with `isValidSolanaAddress()` validation.
- **M4** New `BEFORE INSERT` trigger `set_proposal_proposer` derives proposer from `auth.uid()`'s display_name instead of trusting client input.
- **M5** All Anchor counters use `checked_add(1).ok_or(ChainMetricsError::ArithmeticOverflow)?` — no silent BPF wraps.
- **L1** All four `Proposal`-typed Account structs (`CastVote`, `ExecuteProposal`, `CancelProposal`, `CloseVoteRecord`) now bind `seeds = [b"proposal", &proposal.id.to_le_bytes()], bump = proposal.bump`.
- **L2** `solana-actions.ts` `embedHtml` `escapeHtml`-wraps every interpolation slot.
- **L3** `update_proposal_votes` SECURITY DEFINER function now `SET search_path = public, pg_temp`.
- **L4** `handle_new_user` strips control chars and caps `display_name` at 200 chars.

### Added — Architecture refactor

- `src/lib/` split from 105 flat files into 5 thematic subdirectories:
  - `lib/security/` — sanitisers, errors, telemetry, fetch timeouts (7 files)
  - `lib/solana/` — chain helpers, contracts, memo, helius, cluster verify (14 files)
  - `lib/format/` — formatters, constants, clipboard, role-access (6 files)
  - `lib/mock/` — demo + fixture data (3 files)
  - `lib/intelligence/` — 70+ domain-analytics modules
  - `lib/utils.ts` kept top-level (shadcn cn() helper)
- ~115 import statements updated across `src/pages/`, `src/hooks/`, `src/components/`, `src/sdk/`. All via `git mv` so blame/history follows.

### Added — Earlier May 2026 hardening (M1–M7)

- Cluster genesis-hash verification (`verifyCluster`) before every wallet sign request.
- `simulateOrThrow` — runs `simulateTransaction()` before broadcasting so users don't pay fees on doomed transactions.
- BigInt fixed-point token math (`cmtToBaseUnits`) — eliminates float drift, 10 vitest regression tests.
- `isDemoSignature()` gate on `startup_audit_log` inserts — fake `DEMO_*` sigs no longer pollute the audit trail.
- `fetchWithTimeout` AbortController helper — applied to Pyth Hermes, Helius, and the Edge Function.
- WalletContext `balanceError: string | null` — distinguishes "balance read failed" from "balance is genuinely 0".
- Production CSP `script-src 'self'` (no inline-script allowance).
- Dependency overhaul: dropped `@solana/wallet-adapter-wallets` meta-package, eliminated 8 critical CVEs.
- `package-lock.json` committed; CI uses `npm ci` for deterministic installs.

### Added — Test coverage

- `src/test/contracts.test.ts` — `cmtToBaseUnits` BigInt parsing + `computeTier` thresholds (10 cases).
- `src/test/sanitize.test.ts` — `escapeHtml` / `sanitizeUrl` / `safeHref` / `sanitizeTwitterHandle` / `sanitizeNumber` / `rateLimit` (22 cases).
- `src/test/role-access.test.ts` — `canAccess` permission table (16 cases).
- `src/test/errors.test.ts` — `getErrorMessage` / `getErrorCode` / `isNetworkError` (11 cases).
- `src/test/password-strength.test.ts` — `scorePassword` 5-band meter (7 cases).
- Total: **74 / 74 vitest cases passing** — runtime ~3 seconds.

### Verified

- 3 prior independent smart-contract audits (OtterSec, Sec3, CertiK) — zero critical findings.
- Backup branch (`backup`) untouched at `cc7f324` per durable user feedback.
- Master branch fast-forwards from security branch and cleanup branch — no merge bubbles.

---

## Pre-1.0 milestones (summarised — full history in [`docs/internal/dev-log.md`](docs/internal/dev-log.md))

### Apr 2026 — investor-grade build

- 9 new investor-facing pages targeting BlackRock / Vanguard / YC criteria.
- Solana migration: full Ethereum→Solana rewrite, 24 Anchor instructions, 6 PDAs.
- Massive expansion: 137 files including SDK, 80 intelligence libs, ZK proofs, NL query, 3D viz.
- Pyth oracle integration, cNFT certificates, payment volume tracking, verification scoring.
- Real Anchor discriminators wired across 6 chain-side hooks; governance + voting + delegation.
- 10 hackathon-grade VC features: AI due diligence, security page, compliance, fund flows, LP reports.
- Light mode polish, design overhaul, role-based navigation.

### Earlier Apr 2026

- Architecture refactor: 20+ components extracted, types/, lib/constants, domain subdirs, code splitting.
- Investor UX audit: 11-file review fixed broken buttons, mock labels, accessibility, tab grouping.
- Security audit: XSS fix, role guard deny-by-default, tooltips, onboarding, footer, pagination.

---

[1.0.0-frontier]: https://github.com/urosradojicic/ChainTrust-SOL/releases/tag/v1.0.0-frontier
