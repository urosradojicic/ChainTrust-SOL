# Target architecture — 2026-05-07

## Scope summary

Move-only refactor for `src/lib/`. Everything else stays put — the existing layout is coherent and the Phase 1 assessment found no other HIGH-severity layout issues.

## Target tree

```
src/
├── App.tsx, App.css, main.tsx, index.css, vite-env.d.ts   (entry)
│
├── pages/                  React Router routes — one page per file
│
├── components/             UI components, grouped by domain
│   ├── audit/              audit-log table + helpers
│   ├── common/             Badge, DataProvenance, etc. (cross-page atoms)
│   ├── dashboard/          dashboard-only widgets
│   ├── demo/               demo-banner + similar demo-mode UI
│   ├── form/               input atoms, sliders, toggles
│   ├── governance/         proposal cards + vote UI
│   ├── layout/             Header, Footer, PageTransition, Skip-link
│   ├── startup/            startup-detail-only widgets
│   ├── ui/                 shadcn UI primitives (button, card, etc.)
│   └── *.tsx               standalone features (RoleGuard, CommandPalette, etc.)
│
├── hooks/                  React hooks — one concern per file
│
├── contexts/               app-wide state providers (Auth, Wallet, ...)
│
├── providers/              third-party providers (Web3, Tooltip, QueryClient)
│
├── integrations/
│   └── supabase/           generated client + types (auto-managed)
│
├── lib/
│   ├── security/           ★ NEW — security primitives + sanitisers
│   ├── solana/             ★ NEW — chain-side helpers + adapters
│   ├── format/             ★ NEW — formatters, constants, UI utilities
│   ├── mock/               ★ NEW — demo data + fixture generators
│   ├── intelligence/       ★ NEW — domain analytics + scoring + reports
│   └── utils.ts            shadcn class-merge helper (Tailwind-coupled, kept top-level)
│
├── sdk/                    programmatic SDK surface (used internally)
├── test/                   centralized vitest tests (project leans this way)
└── types/                  shared TypeScript types
```

## Layer rules

| From | May import |
|---|---|
| `pages/` | `hooks/`, `components/`, `contexts/`, `lib/**`, `integrations/`, `types/` |
| `components/` | other `components/`, `hooks/`, `contexts/`, `lib/**`, `types/` |
| `hooks/` | `contexts/`, `lib/**`, `integrations/`, `types/` |
| `contexts/` | `lib/**`, `integrations/`, `types/` |
| `providers/` | `lib/**`, `contexts/` (rarely) |
| `lib/security/` | only DOM globals + standard library |
| `lib/solana/` | `@solana/*`, `lib/security/`, `lib/format/` |
| `lib/format/` | only standard library |
| `lib/mock/` | `lib/format/`, `types/` |
| `lib/intelligence/` | `lib/security/`, `lib/solana/`, `lib/format/`, `lib/mock/`, `types/` |

**Forbidden**: `lib/**` importing from `pages/`, `hooks/`, or `components/`. The `lib/` tree is the kernel — it's pure logic the rest of the app composes.

**Forbidden**: deep relative imports outside the same subdir. Use `@/` alias.

## Naming rules

- **Files**: `kebab-case.ts` for pure modules, `PascalCase.tsx` for React components.
- **Tests**: `<source>.test.ts` in `src/test/` (not colocated — project pattern).
- **Hooks**: prefix with `use-` (filename) and `use` (exported function). One concern per hook file is the goal; `use-blockchain.ts` is the existing exception (deferred — see C2).
- **Constants**: SCREAMING_SNAKE_CASE for module-level constants. Lower-case for instance values.
- **Types**: PascalCase, `Db` prefix for Supabase row shapes (existing convention).

## Canonical locations (one place each)

| Concern | Canonical file |
|---|---|
| Env-var access | (currently inline `import.meta.env.X`) — flagged as deferred follow-up; would belong in `src/lib/security/env.ts` |
| Error narrowing | `src/lib/security/errors.ts` (renamed from `lib/errors.ts`) |
| Error logging | `src/lib/security/error-handler.ts` (renamed from `lib/error-handler.ts`) |
| Telemetry | `src/lib/security/telemetry.ts` |
| Sanitization | `src/lib/security/sanitize.ts` |
| Fetch with timeout | `src/lib/security/fetch-with-timeout.ts` |
| HTML escaping | `src/lib/security/sanitize.ts` (escapeHtml + safeHref + sanitizeTwitterHandle) |
| Solana cluster + tx helpers | `src/lib/solana/solana-config.ts` |
| Anchor program contracts (PDAs, IDs) | `src/lib/solana/contracts.ts` |
| Memo program | `src/lib/solana/memo-anchor.ts` |
| Helius client | `src/lib/solana/helius.ts` |
| Solana Actions / Blinks | `src/lib/solana/solana-actions.ts` |
| Pyth oracle | (lives in `src/hooks/use-pyth-price.ts` — hook, not lib) |
| Currency / number / date format | `src/lib/format/format.ts` |
| App-wide constants | `src/lib/format/constants.ts` |
| Mock startup data | `src/lib/mock/mock-data.ts` |
| Demo activity / events | `src/lib/mock/demo-data.ts` |

## Migration plan

Ordered so the project is buildable + tests pass after each commit. Each commit ≤300 lines diff or ≤5 files moved (per ground rules).

| # | Commit | Files moved | Rationale |
|---|---|---|---|
| 1 | `chore: add .editorconfig + format docs` | new files | mechanical, no risk |
| 2 | `refactor(lib): extract security/ subgroup` | sanitize.ts, errors.ts, error-handler.ts, fetch-with-timeout.ts, telemetry.ts, integrity-guard.ts, license-guard.ts → `lib/security/` | high-touch by security audit; do first |
| 3 | `refactor(lib): extract format/ subgroup` | format.ts, constants.ts, clipboard.ts, confetti.ts, export-pdf.ts, role-access.ts → `lib/format/` | low-risk — these are pure helpers |
| 4 | `refactor(lib): extract mock/ subgroup` | demo-data.ts, mock-data.ts, recent-anchors.ts → `lib/mock/` | well-isolated |
| 5 | `refactor(lib): extract solana/ subgroup` | contracts.ts, memo-anchor.ts, solana-config.ts, solana-actions.ts, helius.ts, smart-wallets.ts, squads-detect.ts, wallet-abstraction.ts, cross-chain.ts, zk-compression.ts, zk-range-proof.ts, milestone-escrow.ts, streaming-rewards.ts, token-gating.ts → `lib/solana/` | bigger move — split if necessary |
| 6 | `refactor(lib): extract intelligence/ subgroup (part 1)` | scoring + signal modules | first half of the big bucket |
| 7 | `refactor(lib): extract intelligence/ subgroup (part 2)` | quant + risk + diligence modules | second half |
| 8 | `docs: rewrite README + add ARCHITECTURE + CONTRIBUTING` | docs only | low-risk |
| 9 | (optional) `chore(lint): apply prettier sweep` | repo-wide formatter | only if it lands clean |

Each move-commit must:
1. Run `npm run typecheck` — clean.
2. Run `npm test -- --run` — 74/74 pass.
3. Re-read any security-touched file in the move-batch against `docs/internal/security-audit/REPORT.md` to confirm no logic change.
4. Update import paths in every consumer.

## What is deliberately NOT being changed

| | Why |
|---|---|
| Long pages (`Landing.tsx`, `MyStartup.tsx`, etc.) | Splitting risks behavior change; all are cohesive single-purpose pages |
| `use-blockchain.ts` (37 KB) | Just modified by security audit H1/H2; splitting would force re-audit |
| Anchor `lib.rs` (44 KB) | Idiomatic for Anchor; security-touched |
| 175 `unused-vars` warnings | Each is a small judgment call; skipping per "no behavior change" rule |
| 43 `no-explicit-any` errors | Multi-PR typing work |
| `tsconfig.app.json` `strict: false` | Tracked tech debt; strict-on requires a typing pass |

These are all listed as deferred follow-ups in the final report.

## Lower-risk alternative considered

For each move I considered: "would adding a barrel `index.ts` re-exporting from a flat `lib/` work without moving files?" — yes, but it doesn't help navigation (105 files still in one dir) and adds a layer of indirection. Move is the higher-value choice, accepting the import-path-update cost.
