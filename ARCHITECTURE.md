# Architecture

The reference for how ChainTrust is laid out, what's allowed to import what, and where each kind of code belongs. Last updated 2026-05-07 after the cleanup pass that split `src/lib/` into thematic subgroups.

## The 90-second mental model

ChainTrust is a **single-page React app** (Vite-bundled) that talks to two backends:

1. **Supabase** for off-chain data (startup metadata, audit log, governance proposals, deal rooms). Authentication uses Supabase GoTrue; authorisation is enforced by **Row-Level Security** policies on every table — the client only ever uses the publishable anon JWT.
2. **Solana** for on-chain anchoring. The `chainmetrics` Anchor program holds 24 instructions covering registry, staking, governance, and badges. The frontend constructs transactions and asks the user's wallet (Phantom / Solflare / Coinbase) to sign.

There is **no Node/Express backend** in this repo. The only server-side code is Supabase Edge Functions (Deno) and the Anchor program (Rust).

## Layering

```
ROUTE LAYER:  src/App.tsx + src/pages/*.tsx
              (lazy-loaded routes, RoleGuard wraps protected pages)
                              ↓
HOOK LAYER:   src/hooks/use-*.ts
              (data fetching via Supabase + chain side-effects via wallet)
                              ↓
LIB LAYER:    src/lib/{security,solana,format,mock,intelligence}/*.ts
              (pure-function domain logic + service clients)
                              ↓
DATA LAYER:   supabase/migrations/*.sql  (RLS policies are the source of truth)
              blockchain/programs/chainmetrics  (Anchor program, on-chain state)
```

Plus orthogonal pieces:

- `src/contexts/` — global React state (Auth, Wallet, InstitutionalView, Realtime)
- `src/providers/` — third-party context (Web3, Tooltip, QueryClient)
- `src/components/` — UI atoms + composed widgets
- `src/integrations/supabase/` — generated typed client
- `src/sdk/` — programmatic facade used internally

## Import rules

Treat `src/lib/` as the kernel — pure logic the rest of the app composes. The arrows point one way only.

| From | May import | May NOT import |
|---|---|---|
| `pages/` | `hooks/`, `components/`, `contexts/`, `lib/**`, `integrations/`, `types/` | other `pages/` (use components or hooks instead) |
| `components/` | other `components/`, `hooks/`, `contexts/`, `lib/**`, `types/` | `pages/` |
| `hooks/` | `contexts/`, `lib/**`, `integrations/`, `types/` | `components/`, `pages/` |
| `contexts/` | `lib/**`, `integrations/`, `types/` | `components/`, `pages/`, `hooks/` |
| `providers/` | `lib/**`, `contexts/` (rarely) | everything UI-shaped |
| `lib/security/` | only DOM globals + standard library | every other `lib/*` (deepest layer) |
| `lib/solana/` | `@solana/*`, `lib/security/`, `lib/format/` | `lib/intelligence/`, `lib/mock/` |
| `lib/format/` | only standard library | every other `lib/*` |
| `lib/mock/` | `lib/format/`, `types/` | `lib/intelligence/` |
| `lib/intelligence/` | `lib/security/`, `lib/solana/`, `lib/format/`, `lib/mock/`, `types/` | `pages/`, `hooks/`, `components/` |

**Critical rule**: nothing under `lib/` may import from `pages/`, `hooks/`, or `components/`. The `lib/` tree is what the rest of the app composes — if it imports back, you have a cycle.

## Where each kind of code lives

| Concern | Canonical location |
|---|---|
| Route definitions | `src/App.tsx` |
| Page implementations | `src/pages/*.tsx` |
| Route gating | `src/components/RoleGuard.tsx` (UI) + `src/lib/format/role-access.ts` (table) + Supabase RLS (server) |
| Auth state | `src/contexts/AuthContext.tsx` |
| Wallet state | `src/contexts/WalletContext.tsx` |
| Wallet adapter setup | `src/providers/Web3Provider.tsx` |
| Sanitization (HTML, URL, twitter handle) | `src/lib/security/sanitize.ts` |
| Error narrowing | `src/lib/security/errors.ts` (`getErrorMessage`, `getErrorCode`, `isNetworkError`) |
| Error logging | `src/lib/security/error-handler.ts` (`logDataError`) |
| Sentry telemetry | `src/lib/security/telemetry.ts` (no-op until `VITE_SENTRY_DSN` is set) |
| `fetch()` with timeout | `src/lib/security/fetch-with-timeout.ts` (use everywhere; never bare `fetch` for external endpoints) |
| Solana cluster + tx helpers | `src/lib/solana/solana-config.ts` (`verifyCluster`, `simulateOrThrow`, `explorerTxUrl`, `isDemoSignature`) |
| Anchor program contracts | `src/lib/solana/contracts.ts` (PDAs, IDs, `cmtToBaseUnits`) |
| Memo program flow | `src/lib/solana/memo-anchor.ts` |
| Helius client | `src/lib/solana/helius.ts` |
| Currency / number / date format | `src/lib/format/format.ts` |
| App-wide constants | `src/lib/format/constants.ts` |
| Mock startups + activity | `src/lib/mock/{mock-data,demo-data}.ts` |
| Domain intelligence (scoring, models, reports) | `src/lib/intelligence/*.ts` (~70 modules — read its files, not this list) |
| Tailwind class merge | `src/lib/utils.ts` (`cn(...)`) |
| Database types | `src/integrations/supabase/types.ts` (auto-generated, hand-extended for schema drift) |
| Tests | `src/test/*.test.ts` (centralized — see "Tests" below) |

## Request lifecycle (worked example)

When an investor visits `/screener` and clicks a startup row:

1. **Route**: `src/App.tsx` matches `/screener` → lazy-loads `src/pages/Screener.tsx`. `RoleGuard` checks `lib/format/role-access.ts` (UX-only deny-by-default).
2. **Hook**: `Screener.tsx` calls `useStartups()` from `src/hooks/use-startups.ts`.
3. **Data**: that hook calls `supabase.from('startups').select(...)`. The request goes out with the user's anon JWT in the Authorization header.
4. **Server**: PostgREST checks RLS policies in `supabase/migrations/*.sql` — `startups` has a `Public read startups` policy, so reads succeed. RLS is the *only* authorisation enforcement; client-side `RoleGuard` is purely UX.
5. **Cache**: TanStack Query (configured in `src/main.tsx`) caches the result.
6. **Render**: `Screener.tsx` paginates + filters via `lib/format/format.ts` helpers and renders `<StartupRow>` components.
7. **Click**: clicking a row navigates to `/startup/:id`. `src/pages/StartupDetail.tsx` follows the same pattern but additionally invokes hooks like `useChainVerification` (`src/hooks/use-chain-verification.ts`) which reads from a Solana RPC via `lib/solana/solana-config.ts`'s shared `connection`.

If any of those steps doesn't match what you'd expect after reading this doc, the doc is wrong — please open a PR to fix it.

## Anchor program

`blockchain/programs/chainmetrics/src/lib.rs` holds all 24 instructions (idiomatic for Anchor — splitting per-feature is on the deferred list). The shape is:

- `lib.rs` — instruction handlers + Accounts structs
- `state.rs` — account data definitions (`StartupAccount`, `Proposal`, `InvestorAccount`, etc.)
- `errors.rs` — `ChainMetricsError` enum

PDAs use prefixed seeds (`b"registry"`, `b"startup"`, `b"vault"`, `b"investor"`, `b"proposal"`, `b"vote"`, etc.). The May 2026 audit added explicit `seeds`/`bump` constraints to every Account that wasn't init — see [SECURITY.md](SECURITY.md) for the rationale.

## Tests

Tests live in `src/test/*.test.ts` (centralized, vitest). Six files at the time of writing:

| File | Covers |
|---|---|
| `contracts.test.ts` | `cmtToBaseUnits` BigInt fixed-point + `computeTier` thresholds (financial regression suite) |
| `errors.test.ts` | `getErrorMessage`, `getErrorCode`, `isNetworkError` |
| `password-strength.test.ts` | `scorePassword` 5-band meter |
| `role-access.test.ts` | `canAccess` permission table |
| `sanitize.test.ts` | `escapeHtml`, `sanitizeUrl`, `safeHref`, `sanitizeTwitterHandle`, `sanitizeNumber`, `rateLimit` |
| `example.test.ts` | smoke test |

The project's pattern is **centralized**, not colocated. New tests should go in `src/test/` matching this convention. Coverage is intentionally narrow — the security audit's regression tests on financial conversion + sanitization + role gates. Wider behavioral coverage is on the deferred follow-up list.

## What is deliberately NOT split / refactored

- **Long pages** (`Landing.tsx` 54KB, `MyStartup.tsx` 39KB, `StartupDetail.tsx` 38KB, …): each is a cohesive page. Splitting risks behavior changes; deferred.
- **`src/hooks/use-blockchain.ts`** (37KB, 13 hooks in one file): just modified by the security audit (H1, H2). Splitting now would force a re-audit of every catch path. Deferred.
- **`blockchain/programs/chainmetrics/src/lib.rs`** (44KB): idiomatic Anchor allows a single `lib.rs`. Could split per-feature but doesn't help readability for the on-chain reviewer audience.
- **`tsconfig.app.json` `strict: false`**: tracked tech debt; flipping `strict` requires a 100+-fix typing pass.
- **175 `unused-vars` warnings, 43 `no-explicit-any` errors**: documented as deferred follow-ups.

## Diagram (request → DB)

```
              ┌───────────────────┐
  user/judge  │ pages/Screener... │
   browser    │  ↑ React Router   │
              └────────┬──────────┘
                       │ useStartups()
                       ▼
              ┌───────────────────┐
              │ hooks/use-*.ts    │  ← TanStack Query cache lives here
              └────────┬──────────┘
                       │ supabase.from('startups').select(...)
                       ▼
   ┌───────────────────────────────────────┐
   │ integrations/supabase/client.ts        │  anon JWT in Authorization header
   └────────┬──────────────────────────────┘
            │ HTTPS
            ▼
   ┌───────────────────────┐         ┌───────────────────────┐
   │ Supabase PostgREST    │ ─RLS──▶ │ supabase/migrations/* │  policies enforce
   │ + GoTrue auth         │         │ + Postgres triggers   │  authorisation
   └───────────────────────┘         └───────────────────────┘

For wallet writes:

   pages → hooks → lib/solana/contracts.ts (build instruction)
                 → lib/solana/solana-config.ts (verifyCluster, simulateOrThrow)
                 → wallet adapter (signTransaction)
                 → Solana RPC → on-chain Anchor program
```
