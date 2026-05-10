# Cleanup baseline — 2026-05-07

## Repo state

- **Branch**: `chore/cleanup-2026-05-07` (branched from `security/audit-2026-05-07` so this stacks on the security PR)
- **Base HEAD**: `f1a7dca` (`security(auth): I1 demo session — re-derive role from server allowlist + clarify intent`)
- **Working tree**: clean

## Quality gates (must match or beat at end)

| Gate | Baseline | Target after cleanup |
|---|---|---|
| Tests | **74 / 74 pass** | ≥ 74 / 74 |
| Test runtime | **2.95s** (vitest) | ≤ ~3.5s |
| Typecheck | clean (`tsc --noEmit -p tsconfig.app.json`) | clean |
| Lint | **245 problems** (48 errors, 197 warnings) | ≤ 245, ideally lower |
| Build | not yet measured | clean |

## File inventory

- **`src/`**: 299 `.ts`/`.tsx` files; **60,056 LOC**
- **`src/lib/`**: **105 files** — primary dumping ground. Mixes:
  - Security primitives: `sanitize.ts`, `errors.ts`, `error-handler.ts`, `fetch-with-timeout.ts`, `telemetry.ts`
  - Solana / chain: `contracts.ts`, `memo-anchor.ts`, `solana-config.ts`, `solana-actions.ts`, `helius.ts`, `pyth.ts`
  - Format: `format.ts`, `constants.ts`, `clipboard.ts`, `confetti.ts`
  - Domain logic (intelligence): `ai-due-diligence.ts`, `red-flag-detection.ts`, `deal-scoring.ts`, `entity-aggregator.ts`, `cap-table.ts`, `bayesian-inference.ts`, `change-points.ts`, etc. (~50 of these)
  - Mock / demo data: `demo-data.ts`, `mock-data.ts`
  - PDF: `lp-report.ts`
  - Misc: `dd-workflow.ts`, `command-palette.ts`, `nl-query.ts`
- **`src/components/`**: 28 top-level files + 9 subdirs (`audit/`, `common/`, `dashboard/`, `demo/`, `form/`, `governance/`, `layout/`, `startup/`, `ui/`)
- **`src/test/`**: 6 centralized test files (vitest)
- **`src/sdk/`**: SDK / programmatic API surface
- **`src/integrations/supabase/`**: Supabase client + types

## Top 15 largest files (bytes)

| Bytes | File | Notes |
|---|---|---|
| 54,779 | `src/pages/Landing.tsx` | hero + sections; long but cohesive |
| 44,506 | `blockchain/programs/chainmetrics/src/lib.rs` | Anchor program (security-touched) |
| 39,285 | `src/pages/MyStartup.tsx` | startup-role page (security-touched) |
| 38,400 | `src/pages/StartupDetail.tsx` | investor-detail page (security-touched) |
| 36,972 | `src/hooks/use-blockchain.ts` | 13+ hooks (security-touched) |
| 36,371 | `src/lib/demo-data.ts` | mock data — candidate for `src/lib/mock/` |
| 34,813 | `src/pages/LiveTestnetDemo.tsx` | testnet demo flow |
| 33,635 | `src/sdk/registry.ts` | SDK registry |
| 31,718 | `src/pages/Register.tsx` | startup-onboarding wizard (security-touched) |
| 28,369 | `src/lib/red-flag-detection.ts` | intelligence module |
| 28,288 | `src/pages/Verify.tsx` | verification flow |
| 26,597 | `src/components/startup/OnChainVerification.tsx` | on-chain badge UI |
| 26,441 | `src/pages/Dashboard.tsx` | investor dashboard |
| 25,649 | `src/pages/Governance.tsx` | DAO voting page |
| 25,373 | `src/lib/mock-data.ts` | mock data — candidate for `src/lib/mock/` |

## Tooling present

| Tool | Status |
|---|---|
| Prettier | configured (`.prettierrc.json`) — never run repo-wide |
| ESLint | configured (`eslint.config.js`) |
| `.editorconfig` | **missing** — easy win |
| TypeScript strict | `strict: false` in `tsconfig.app.json` (intentional for hackathon — flagged as deferred) |

## Files modified by the security branch (extra care during cleanup)

These files received security-critical changes on `security/audit-2026-05-07`. Touching them requires re-reading every change to ensure the security logic is preserved exactly.

### From `security/audit-2026-05-07` (current)

| File | Finding |
|---|---|
| `supabase/migrations/20260507000000_audit_2026_05_07_fixes.sql` | C1, H3, M4, L3, L4 |
| `src/lib/entity-aggregator.ts` | M3 |
| `src/pages/EntityDossier.tsx` | M2 |
| `src/lib/solana-actions.ts` | L2 |
| `supabase/functions/risk-analysis/index.ts` | M1 |
| `src/hooks/use-blockchain.ts` | H1, H2 |
| `src/contexts/AuthContext.tsx` | I1 |
| `blockchain/programs/chainmetrics/src/lib.rs` | M5, L1 |
| `blockchain/programs/chainmetrics/src/errors.rs` | M5 |

### From earlier May 2026 hardening (master)

| File | Hardening |
|---|---|
| `src/lib/sanitize.ts` | escapeHtml, sanitizeUrl, safeHref, sanitizeTwitterHandle, rateLimit |
| `src/lib/lp-report.ts` | escHtml at every interpolation site |
| `src/lib/contracts.ts` | prod-strict program ID, IS_PLACEHOLDER_PROGRAM_ID, cmtToBaseUnits |
| `src/lib/memo-anchor.ts` | verifyCluster + simulateOrThrow + memo control-char strip |
| `src/lib/solana-config.ts` | verifyCluster, simulateOrThrow, isDemoSignature |
| `src/lib/fetch-with-timeout.ts` | AbortController-backed fetch wrapper |
| `src/lib/helius.ts` | timeout-wrapped requests |
| `src/lib/errors.ts` | error-narrowing helpers |
| `src/contexts/WalletContext.tsx` | balanceError state |
| `src/main.tsx` | Buffer polyfill (M6 follow-up) |
| `src/pages/MyStartup.tsx` | isDemoSignature gate on audit-log inserts |
| `src/pages/Register.tsx` | orphan funding_raised field removed; admin-rejection client-side |
| `src/pages/Staking.tsx` | real useClaimRewards wired |
| `src/pages/Login.tsx` | PasswordStrengthMeter wired |
| `supabase/migrations/20260505000000_security_hardening.sql` | RLS hardening |

**Rule for this PR**: any rename/move/refactor that touches a file in this list must be paired with a re-read of the security report's relevant section to confirm the security invariant is preserved.
