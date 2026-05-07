# Cleanup & architecture pass — 2026-05-07

**Branch**: `chore/cleanup-2026-05-07` (stacked on `security/audit-2026-05-07`)
**Base**: `f1a7dca` (last commit on the security branch)
**Tip**: `939b08a` (after 7 commits)
**Behavior changes**: zero — pure refactor + docs

## Executive summary

A new contributor opening this repo today sees **5 thematic subdirectories** in `src/lib/` (security, solana, format, mock, intelligence) instead of 105 flat files, plus an `ARCHITECTURE.md` that documents the layer rules and a `CONTRIBUTING.md` covering branch and commit policy. Every change is move-only or doc-only — no runtime code was modified, no security defense was touched, every test still passes.

The biggest win is `src/lib/`: from 105 flat files (impossible to scan) to 5 navigable groupings. This required updating ~115 import statements across the consumer codebase but no logic edits.

## Before / after

| | Baseline (f1a7dca) | After cleanup (939b08a) | Δ |
|---|---|---|---|
| Tests | 74 / 74 pass | 74 / 74 pass | 0 |
| Test runtime | 2.95 s | 2.97 s | +0.7% |
| Typecheck | clean | clean | — |
| Lint problems | 245 (48 errors, 197 warnings) | 245 (48 errors, 197 warnings) | 0 |
| Build | clean | clean | — |
| `src/lib/` flat files | 105 | 1 (`utils.ts`, kept top-level) | **-104** |
| `src/lib/` subdirs | 0 | 5 | **+5** |
| `.editorconfig` | missing | present | — |
| `ARCHITECTURE.md` | missing | present | — |
| `CONTRIBUTING.md` | missing | present | — |

Total source LOC unchanged (60,056). Test count unchanged. No file outside `src/lib/` had its substantive content modified — only import paths.

## Commits (chronological)

| # | SHA | Message | Files | Notes |
|---|---|---|---|---|
| 1 | `7ef101d` | `chore: add .editorconfig + cleanup planning docs` | 4 new | mechanical + planning |
| 2 | `c2ce8cd` | `refactor(lib): extract security/ subgroup` | 7 moved + 23 import-only | security primitives |
| 3 | `8151ede` | `refactor(lib): extract format/ subgroup` | 6 moved + 40 import-only | format helpers |
| 4 | `2f74d32` | `refactor(lib): extract mock/ subgroup` | 3 moved + 7 import-only | demo + mock data |
| 5 | `61d5b5c` | `refactor(lib): extract solana/ subgroup` | 14 moved + 32 import-only | chain helpers |
| 6 | `a685de7` | `refactor(lib): extract intelligence/ subgroup` | 74 moved + 25 import-only | domain analytics — final split |
| 7 | `939b08a` | `docs: rewrite README + add ARCHITECTURE + CONTRIBUTING` | 3 docs | onboarding |

Each move-commit individually:
- ran `npm run typecheck` (clean)
- ran `npm test -- --run` (74/74)
- preserved security-touched files byte-equivalent (verified by inspecting exports against SECURITY_AUDIT/REPORT.md)

## What moved where

| From | To |
|---|---|
| `src/lib/sanitize.ts` | `src/lib/security/sanitize.ts` |
| `src/lib/errors.ts` | `src/lib/security/errors.ts` |
| `src/lib/error-handler.ts` | `src/lib/security/error-handler.ts` |
| `src/lib/fetch-with-timeout.ts` | `src/lib/security/fetch-with-timeout.ts` |
| `src/lib/telemetry.ts` | `src/lib/security/telemetry.ts` |
| `src/lib/integrity-guard.ts` | `src/lib/security/integrity-guard.ts` |
| `src/lib/license-guard.ts` | `src/lib/security/license-guard.ts` |
| `src/lib/format.ts` | `src/lib/format/format.ts` |
| `src/lib/constants.ts` | `src/lib/format/constants.ts` |
| `src/lib/clipboard.ts` | `src/lib/format/clipboard.ts` |
| `src/lib/confetti.ts` | `src/lib/format/confetti.ts` |
| `src/lib/role-access.ts` | `src/lib/format/role-access.ts` |
| `src/lib/export-pdf.ts` | `src/lib/format/export-pdf.ts` |
| `src/lib/demo-data.ts` | `src/lib/mock/demo-data.ts` |
| `src/lib/mock-data.ts` | `src/lib/mock/mock-data.ts` |
| `src/lib/recent-anchors.ts` | `src/lib/mock/recent-anchors.ts` |
| `src/lib/contracts.ts` | `src/lib/solana/contracts.ts` |
| `src/lib/memo-anchor.ts` | `src/lib/solana/memo-anchor.ts` |
| `src/lib/solana-config.ts` | `src/lib/solana/solana-config.ts` |
| `src/lib/solana-actions.ts` | `src/lib/solana/solana-actions.ts` |
| `src/lib/helius.ts` | `src/lib/solana/helius.ts` |
| `src/lib/smart-wallets.ts` | `src/lib/solana/smart-wallets.ts` |
| `src/lib/squads-detect.ts` | `src/lib/solana/squads-detect.ts` |
| `src/lib/wallet-abstraction.ts` | `src/lib/solana/wallet-abstraction.ts` |
| `src/lib/cross-chain.ts` | `src/lib/solana/cross-chain.ts` |
| `src/lib/zk-compression.ts` | `src/lib/solana/zk-compression.ts` |
| `src/lib/zk-range-proof.ts` | `src/lib/solana/zk-range-proof.ts` |
| `src/lib/milestone-escrow.ts` | `src/lib/solana/milestone-escrow.ts` |
| `src/lib/streaming-rewards.ts` | `src/lib/solana/streaming-rewards.ts` |
| `src/lib/token-gating.ts` | `src/lib/solana/token-gating.ts` |
| 74 other modules in `src/lib/*.ts` | `src/lib/intelligence/*.ts` |

## What was renamed

Nothing — every move kept the original filename. This was deliberate: renaming pre-existing security-touched files would force a re-audit; preserving names lets the security report's file pointers continue to make sense (just with the new directory prefix).

## What was extracted / split

Nothing yet — Phase 5 internal-refactor work is deferred. See "Deliberately not changed" below.

## Deliberately NOT changed (and why)

| | Why |
|---|---|
| **Long pages** (`Landing.tsx` 54 KB, `MyStartup.tsx` 39 KB, `StartupDetail.tsx` 38 KB, `LiveTestnetDemo.tsx` 35 KB, `Register.tsx` 32 KB, `Verify.tsx` 28 KB, `Dashboard.tsx` 26 KB, `Governance.tsx` 26 KB) | Each is a cohesive page with non-trivial state interactions. Splitting risks behavior changes. Several were modified by the security audit and a split would force a re-audit. |
| **`src/hooks/use-blockchain.ts`** (37 KB, 13 hooks) | Just modified by the security audit (H1 + H2 + the catch-block refactor). Splitting now would invalidate that audit's per-hook verification. |
| **`blockchain/programs/chainmetrics/src/lib.rs`** (44 KB) | Idiomatic for Anchor to keep all instructions in `lib.rs`. Splitting per-feature would help readability but doesn't help the on-chain reviewer audience. |
| **`tsconfig.app.json` `strict: false`** | Flipping `strict` requires fixing the 43 `no-explicit-any` errors, plus likely 100+ subtler typing fixes. Multi-PR work. |
| **245 lint problems** (48 errors, 197 warnings) | Identical count before/after — ground rules forbid lint warning fixes that might touch behavior. The 175 unused-vars warnings each need a manual judgment call (is it actually dead? prefix with `_`? remove entirely?) Multi-PR work. |
| **Renaming `errors.ts` / `error-handler.ts`** | Names are slightly confusing (one is type narrowing, the other is logging) but renaming security-touched files would require a re-audit. Module headers explain the split instead. |
| **`src/lib/utils.ts`** (6-line shadcn `cn()` helper) | Moving it would touch ~80 component imports for no architectural gain. Top-level `utils.ts` is the standard shadcn convention. |
| **Tests not colocated** | Project pattern is centralized `src/test/` (only 6 files). `ARCHITECTURE.md` documents this so future authors don't drop tests into `__tests__` next to sources. |
| **No formatter sweep** | Running Prettier across 299 files would produce a 60K+-line diff dominated by line-ending changes (mostly cosmetic). The diff would obscure the substantive moves. Future cleanup; flagged as deferred. |
| **No barrel `index.ts` re-exports** | Considered as an alternative to moves. Move was the higher-value choice — barrel files don't help navigation (105 files still in one dir, just hidden behind a re-export). |

## Security re-audit (mandatory per ground rules)

Re-read every file modified by the May 2026 security branch. Confirmed every security invariant is intact:

| Audit finding | Invariant | Verified |
|---|---|---|
| C1 mass-assignment | `guard_startup_attested_fields` trigger present in `supabase/migrations/20260507000000_audit_2026_05_07_fixes.sql`; resets `verified`, `trust_score`, `*_score`, `user_id`, `created_at` for non-admin updates | ✓ |
| H1 `useExecuteProposal` | Account list `[user, dao, vault, proposal]` matches Anchor `ExecuteProposal` struct in `lib.rs:1188-1202` | ✓ |
| H2 silent error swallow | `runChainOrDemo` rethrows when `IS_PLACEHOLDER_PROGRAM_ID` is false; demo fallback only in unconfigured dev | ✓ |
| H3 pledges INSERT | RLS policy `Pledge insert with attribution` requires `investor_id = auth.uid()` for investor pledges | ✓ |
| M1 Edge Function | CORS allowlist + 8 KiB body cap + per-IP rate limit + generic errors in `supabase/functions/risk-analysis/index.ts` | ✓ |
| M2 EntityDossier tx URL | Routes through `explorerTxUrl()` (URL-encoded path) | ✓ |
| M3 entity-aggregator treasury URL | `isValidSolanaAddress()` validation before URL construction | ✓ |
| M4 proposer field | `set_proposal_proposer` BEFORE INSERT trigger derives `proposer` from `auth.uid()` | ✓ |
| L1 Anchor seeds-bound proposal | Four Account structs (`CastVote`, `ExecuteProposal`, `CancelProposal`, `CloseVoteRecord`) all `seeds = [b"proposal", &proposal.id.to_le_bytes()], bump = proposal.bump` | ✓ |
| L2 solana-actions embedHtml | Every interpolation slot `escapeHtml`-wrapped | ✓ |
| L3 update_proposal_votes | `SET search_path = public, pg_temp` present | ✓ |
| L4 handle_new_user | Control-char strip + 200-char cap | ✓ |
| M5 Anchor checked counters | All three (`registry.startup_count`, `startup.total_reports`, `dao.proposal_count`) use `checked_add(1).ok_or(ChainMetricsError::ArithmeticOverflow)?` | ✓ |
| Buffer polyfill | `globalThis.Buffer ??= Buffer` set in `src/main.tsx` before `createRoot` | ✓ |
| sanitize.ts exports | All security-critical exports present (`escapeHtml`, `sanitizeUrl`, `safeHref`, `sanitizeTwitterHandle`, `rateLimit`) | ✓ |
| AuthContext I1 | Demo session restore re-derives role from server-side `DEMO_ACCOUNTS` allowlist; defense-in-depth comment intact | ✓ |
| CSP `script-src 'self'` | `vercel.json` unchanged | ✓ |

**Conclusion: no security regression.** Every defense from the audit branch lands at the same line in the cleanup branch (different directory prefix only).

## Follow-ups (out of scope for this pass, worth tracking)

These would each be their own PR.

| Priority | Item | Why deferred |
|---|---|---|
| HIGH | Burn down the 175 `unused-vars` warnings | Each needs a small judgment call (dead vs `_`-prefix vs keep). Multi-PR work, no blast radius if left alone |
| HIGH | Fix the 43 `no-explicit-any` errors and flip `tsconfig.app.json` to `strict: true` | Largest typing pass; fixes will cascade |
| MED | Split `src/hooks/use-blockchain.ts` into per-hook files | The audit branch's H1/H2 work is fresh; splitting now would force a re-audit |
| MED | Split the long pages (`Landing.tsx`, `MyStartup.tsx`, `StartupDetail.tsx`, etc.) into route + section components | Behavior-risk; each page is its own PR |
| MED | Apply Prettier formatter sweep | Produces a 60K+-line diff that would obscure substantive changes — do it as a single noisy cleanup commit |
| LOW | Add COOP / CORP response headers in `vercel.json` | Defense-in-depth; needs a verification pass for image-src compatibility |
| LOW | SHA-pin `actions/checkout@v4` and `actions/setup-node@v4` in `.github/workflows/ci.yml` | OpenSSF best practice; first-party actions so risk is low |
| LOW | Move `BMC PDF` upload off `localStorage` (5 MB cap) into Supabase Storage | Edge case; flagged in security audit M11 |
| LOW | Test coverage expansion beyond the financial / sanitization regression suite | New behavioral coverage takes time |
| INFO | Consider a `lib/` barrel `index.ts` per subdir (e.g. `import { sanitize, errors } from '@/lib/security'`) | Has UX cost — IDE-jump-to-definition becomes one indirect step. Skipped for now |

## How to use this branch

The cleanup branch stacks on the security branch. Either:

1. **Merge security PR first**, then this cleanup PR rebases cleanly on top of master.
2. **Merge them together** as two adjacent PRs — the cleanup commits are pure renames + import updates, so they apply trivially after the security commits.

If you want to test locally:

```bash
git fetch origin
git checkout chore/cleanup-2026-05-07
npm install --legacy-peer-deps
npm test -- --run                 # 74 / 74
npm run typecheck                  # clean
npm run dev                        # boot the app
```

## Files referenced

- [`CLEANUP/00_baseline.md`](00_baseline.md) — start-of-pass metrics
- [`CLEANUP/01_assessment.md`](01_assessment.md) — structural findings
- [`CLEANUP/02_target_architecture.md`](02_target_architecture.md) — target tree + layer rules + per-commit migration plan
- [`SECURITY_AUDIT/REPORT.md`](../SECURITY_AUDIT/REPORT.md) — referenced for security re-audit
- [`ARCHITECTURE.md`](../ARCHITECTURE.md) — new authoritative layer-rules doc
- [`CONTRIBUTING.md`](../CONTRIBUTING.md) — new branch/commit/test policy doc
