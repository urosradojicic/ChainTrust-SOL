# Structural assessment — 2026-05-07

## A. Layout problems

### HIGH

| # | Finding | Where | Proposed fix |
|---|---|---|---|
| A1 | **`src/lib/` is a 105-file flat dumping ground.** Mixes security primitives, Solana adapters, format helpers, mock data, and 60+ domain-intelligence modules. Navigation requires scrolling. | `src/lib/` (whole dir) | Group into 5 thematic subdirs: `security/`, `solana/`, `format/`, `mock/`, `intelligence/`. Move-only — no code change. |
| A2 | **Tests are centralized in `src/test/`** (6 files for 299 source files). Reasonable for a small test suite but inconsistent with the colocated pattern most TypeScript projects use today. | `src/test/` | **Keep centralized** (project leans this way; only 6 files). Document this in `ARCHITECTURE.md` so future authors don't drop tests into `__tests__` folders next to sources. |
| A3 | **No `.editorconfig`** — relies on each contributor's editor to match Prettier config. | repo root | Add a 6-line `.editorconfig` matching `.prettierrc.json`. |

### MEDIUM

| # | Finding | Where | Proposed fix |
|---|---|---|---|
| A4 | `src/lib/utils.ts` is 6 lines containing only the shadcn `cn()` helper. The name is bland but moving it would touch ~80 component imports. | `src/lib/utils.ts` | **Keep**. Document in module header that it's the canonical Tailwind-class-merge helper. |
| A5 | 28 top-level files in `src/components/` (alongside 9 subdirs). Some could move into existing subdirs but all are genuine standalone features (CommandPalette, RoleGuard, etc.). | `src/components/*.tsx` | **Keep** — these are leaf features. Document that subdirs group by domain (audit, dashboard, governance, startup) and top-level files are standalone. |

### LOW

| # | Finding | Where | Proposed fix |
|---|---|---|---|
| A6 | `src/sdk/` shipping a programmatic SDK from inside the SPA repo blurs the boundary between app and library. | `src/sdk/` | Acceptable — used internally by the same app. Document in ARCHITECTURE.md. |

## B. Naming & consistency

### MEDIUM

| # | Finding | Where | Proposed fix |
|---|---|---|---|
| B1 | Lib filenames consistently use `kebab-case.ts`. UI component files consistently use `PascalCase.tsx`. **Consistent — no fix.** Notable as a positive. | repo-wide | none |
| B2 | A handful of `.ts` files inside `src/components/audit/` use kebab-case (e.g. `AuditLogTable.tsx` is fine, but check there's no mix). | `src/components/*` | spot-checked — clean |

### LOW

| # | Finding | Where | Proposed fix |
|---|---|---|---|
| B3 | `error-handler.ts` and `errors.ts` in the same dir; the names don't make their relationship obvious. `errors.ts` is *type narrowing helpers*, `error-handler.ts` is *runtime logging*. | `src/lib/errors.ts`, `src/lib/error-handler.ts` | Move both to `src/lib/security/` and rename if needed. Renaming pre-existing security-touched files is risky; safer to add module headers explaining the split. |

## C. Size & complexity

### HIGH

| # | Finding | Where | Proposed fix |
|---|---|---|---|
| C1 | `src/pages/Landing.tsx` (54 KB), `MyStartup.tsx` (39 KB), `StartupDetail.tsx` (38 KB), `LiveTestnetDemo.tsx` (35 KB), `Register.tsx` (32 KB), `Verify.tsx` (28 KB), `Dashboard.tsx` (26 KB), `Governance.tsx` (26 KB) — all single-file pages. | `src/pages/*.tsx` | **Defer.** Each is a cohesive page; splitting risks behavior changes. Long but readable. Document as deferred follow-up. |
| C2 | `src/hooks/use-blockchain.ts` (37 KB, 13 hooks) — this is a known pain point. Each hook (useStake, useUnstake, useClaimRewards, useExecuteProposal, useCastVote, etc.) could live in its own file. | `src/hooks/use-blockchain.ts` | **Defer** — security branch H1/H2 just modified this file end-to-end and splitting now would force a re-audit of every catch path. Document as deferred. |

### MEDIUM

| # | Finding | Where | Proposed fix |
|---|---|---|---|
| C3 | `src/lib/lib.rs` — Anchor program at 44 KB. Each instruction handler is small, but the file aggregates all 24. | `blockchain/programs/chainmetrics/src/lib.rs` | **Defer** — security-touched. Idiomatic Anchor allows a single `lib.rs`. Could split per-feature in a follow-up. |
| C4 | 175 unused-vars lint warnings. ESLint is configured to ignore `^_`-prefixed identifiers but contributors haven't been prefixing. | repo-wide | Manual prefix sweep is risky (each var is a small judgment call: is it actually dead, or genuinely unused for now). Document as deferred. |
| C5 | 43 `no-explicit-any` errors. Real type debt. | repo-wide | Document as deferred — typing work is multi-PR-sized. |
| C6 | `src/lib/demo-data.ts` (36 KB) and `mock-data.ts` (25 KB) live next to security primitives. Easy mental clutter. | `src/lib/{demo,mock}-data.ts` | Move to `src/lib/mock/`. |

### LOW

| # | Finding | Where | Proposed fix |
|---|---|---|---|
| C7 | 12 `react-refresh/only-export-components` warnings — files that export both a component and a non-component (constants/hooks/contexts). Cosmetic. | various | Document as deferred. |
| C8 | 10 `react-hooks/exhaustive-deps` — these need *manual* review (sometimes you genuinely don't want a dep). Skipping. | various | Document as deferred. |

## D. Architecture

### Findings

The repo has clear layers; they're just not documented.

```
ROUTE LAYER:    src/App.tsx + src/pages/*.tsx (route gating via RoleGuard)
                ↓
HOOK LAYER:     src/hooks/use-*.ts (data + chain side-effects)
                ↓
LIB LAYER:      src/lib/*.ts (pure-function domain logic + clients)
                ↓
DATA LAYER:     supabase/* + blockchain/programs/chainmetrics
```

Plus orthogonal:
- `src/contexts/` — global state (Auth, Wallet, InstitutionalView, Realtime)
- `src/providers/` — third-party context providers (Web3, Tooltip, QueryClient)
- `src/components/` — UI atoms + composed widgets
- `src/integrations/supabase/` — typed Supabase client
- `src/sdk/` — programmatic API surface (used internally)

The architecture is sound. What's missing is a written description so a new contributor can find their way without reading every file.

### Proposed fix

Write `ARCHITECTURE.md` documenting the layers + the rule "hooks consume lib, not the other way around" + where each kind of code belongs. Already covered in Phase 6.

## Summary

The codebase is in better shape than its file count suggests. The single biggest navigation problem is `src/lib/` flatness (A1). Everything else is either tolerable, deferred per the ground rules, or already correct.
