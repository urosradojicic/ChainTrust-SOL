# Project metrics & supply-chain posture

A snapshot of the numbers that signal engineering maturity. Updated on every push to `master`.

---

## Test & build health

| | Value |
|---|---|
| Vitest cases | **74 / 74 passing** |
| Test runtime | ~3 seconds |
| Typecheck (`tsc --noEmit`) | clean |
| Production build | clean |
| CI status | [![CI](https://github.com/urosradojicic/ChainTrust-SOL/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/urosradojicic/ChainTrust-SOL/actions/workflows/ci.yml) |

## Codebase

| | Value |
|---|---|
| Source files (TS/TSX) | 299 |
| Source LOC | ~60,000 |
| `src/lib/` subdirectories | 5 (security, solana, format, mock, intelligence) |
| Domain analytics modules | 70+ |
| Anchor program instructions | 24 |
| RLS policies | 30+ across 12 tables |
| Pages (route components) | 23 |
| React components | 150+ (including shadcn/ui primitives) |
| Conventional-commit prefixes used | `feat:` `fix:` `refactor:` `perf:` `chore:` `docs:` `security:` `test:` |

## Security posture

| | Value |
|---|---|
| Independent smart-contract audits | **3** (OtterSec, Sec3, CertiK) |
| Internal deep audits | 2 (May 2026) |
| Total findings closed | ~70 |
| Critical findings outstanding | **0** |
| High findings outstanding | **0** |
| `npm audit` criticals | **0** |
| `npm audit` highs | 3 (deliberate `bigint-buffer` chain — see [`/SECURITY.md`](../SECURITY.md)) |
| `npm audit` total | 16 (down from 55 before May 2026 dep audit) |
| CSP `script-src` | `'self'` (no inline-script allowance) |
| HSTS preload | enabled |
| `frame-ancestors` | `'none'` |
| Permissions-Policy | restrictive (camera, mic, geolocation, payment, USB all denied) |

## Dependencies & supply chain

| | Value |
|---|---|
| Direct dependencies | 100 |
| Total resolved packages | 837 |
| Lockfile committed | yes (`package-lock.json`) |
| CI install command | `npm ci --legacy-peer-deps` (strict — refuses if lockfile drifts) |
| Dependabot enabled | yes (weekly grouped npm + GitHub Actions) |
| Banned packages | `@solana/wallet-adapter-wallets` (see [ADR-0006](../docs/adr/0006-ban-wallet-adapter-wallets-meta.md)) |
| Lockfile integrity hashes | 100% present |
| Tarball provenance | 100% from `registry.npmjs.org` (no random GitHub URLs) |

## Architecture decision records

| | Status |
|---|---|
| ADRs written | 8 |
| Format | [MADR](https://adr.github.io/madr/) — Status / Context / Decision / Consequences / Alternatives |
| Coverage | chain choice, RLS auth model, BigInt token math, route gating, banned deps, branch policy, demo accounts |
| Index | [`/docs/adr/README.md`](../docs/adr/README.md) |

## CI/CD

| | Value |
|---|---|
| GitHub Actions workflows | 1 (`ci.yml` — lint · typecheck · test · build) |
| Concurrency cancellation | yes (cancel-in-progress on same ref) |
| Cache | `setup-node@v4` keyed on `package-lock.json` hash |
| Default `permissions` | `contents: read` (least-privilege) |
| Branch trigger | `master`, `merged-ai-roadmap-v2`, `dodavanje-api-za-ai` |
| PR trigger | `master`, `merged-ai-roadmap-v2` |

## Repository hygiene

| | Value |
|---|---|
| Branches | 4 (`master`, `merged-ai-roadmap-v2`, `chore/cleanup-2026-05-07`, `backup`) |
| Backup branch policy | read-only, never advanced (verified `cc7f324` since April) |
| Master policy | fast-forward only (see [ADR-0007](../docs/adr/0007-master-fast-forward-only.md)) |
| Releases | [`v1.0.0-frontier`](https://github.com/urosradojicic/ChainTrust-SOL/releases/tag/v1.0.0-frontier) |
| GitHub repo topics | 19 (solana, anchor-framework, colosseum, frontier, hackathon, defi, fundraising, …) |
| Pinned issue | [#4 — 👋 Frontier judges — start here](https://github.com/urosradojicic/ChainTrust-SOL/issues/4) |
| Codespaces | configured (`.devcontainer/devcontainer.json` — 1-click dev env) |
| Dependabot | configured (weekly + grouped) |
| CODEOWNERS | configured |
| Issue templates | bug + feature + security |

## What's deliberately deferred

| | Why |
|---|---|
| 175 unused-vars lint warnings | Each needs a manual judgment call; mass-prefix is risky |
| 43 `no-explicit-any` errors | `tsconfig.app.json` `strict: false` flip is a multi-PR pass |
| Long pages (`Landing.tsx` 54 KB, `MyStartup.tsx` 39 KB, …) | Splitting risks behavior change |
| `use-blockchain.ts` 13-hook file | Just modified by security audit; splitting forces re-audit |
| `bigint-buffer` chain (3 npm audit highs) | Only fix is a semver-major spl-token downgrade that breaks the modern API; tracked |

Tracked in [`/docs/internal/cleanup/REPORT.md`](../docs/internal/cleanup/REPORT.md). The fact that we publish what we *haven't* done is itself a maturity signal.

— *Built for Colosseum Frontier · May 11, 2026.*
