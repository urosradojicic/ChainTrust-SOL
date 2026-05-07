# ChainTrust — Phase 1 Upgrade Audit

**Date:** 2026-04-27
**Branch audited:** `merged-ai-roadmap-v2`
**Backup branch (read-only):** `cc7f324`
**Stack:** React 18 · Vite 5 · TypeScript · Tailwind 3 · Supabase · `@solana/web3.js` · Anchor program
**Constraint:** Colosseum Frontier deadline **May 11, 2026** (~2 weeks)
**Audit method:** parallel `Explore` agents (code + arch + sec + perf + SEO + ops + DX) + Playwright MCP live UI/a11y at three viewports + `npm audit` + manual file inspection.

This is **read-only**. No code changes during Phase 1. The Phase 2 gate requires explicit approval before any execution.

---

## 1.1 Repo Map

### Top-level folders
| Folder | Role |
|---|---|
| `src/` | React frontend (33 pages, 150+ components, 40+ libs, 12 hooks, 3 contexts) |
| `blockchain/programs/chainmetrics/` | Anchor program — 24 instructions, badge tier system, governance with quorum |
| `supabase/migrations/` | 11 SQL migrations: 14 indexes, RLS policies, CHECK constraints, deal_rooms, Pitchbook fields |
| `docs/` | 9 files: ARCHITECTURE, DATABASE, DEPLOYMENT, ROADMAP_V2, IMPROVEMENTS_APR2026, etc. |
| `public/` | Static — `robots.txt` only (no `og-image.png`, no `sitemap.xml`) |
| `.github/` | **Empty** — no workflows, no PR template, no issue templates |
| `.husky/` | **Missing** — no pre-commit hooks |

### Run scripts
| Script | Time | State |
|---|---|---|
| `npm run dev` | ~5 s startup | Clean, IPv6 binding (`host: "::"`) |
| `npm run build` | ~37 s | Clean (vendor splits ship 3D/charts/Solana/Supabase/PDF separately) |
| `npm run typecheck` | ~10 s | **46 errors** (see §1.2) |
| `npm run lint` | ~5 s | **116 issues** (94 errors + 22 warnings) |
| `npm test` | ~3 s | 1 placeholder test passing |

### Env vars
| Var | Required | Defined | Used in |
|---|---|---|---|
| `VITE_SUPABASE_URL` | yes | `.env`, `.env.example` | `integrations/supabase/client.ts` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes | `.env`, `.env.example` | same |
| `VITE_SUPABASE_PROJECT_ID` | optional | `.env` | not actually consumed in code |
| `VITE_SOLANA_PROGRAM_ID` | no (placeholder fallback) | `.env.example` | `lib/contracts.ts:7` |
| `VITE_SOLANA_CLUSTER` | no (defaults to `devnet`) | `.env.example` | `lib/solana-config.ts` |
| `VITE_HELIUS_API_KEY` | no (graceful fallback) | `.env.example` | `lib/helius.ts` |

### Secret leak risk
- `.env` is in `.gitignore` (line 16) but a check via `git ls-files` is needed to confirm it was never committed historically.
- The Supabase anon JWT is publicly safe by design (browser key, gated by RLS) — but its presence in a working tree alongside `VITE_SUPABASE_PROJECT_ID` and `VITE_SUPABASE_URL` warrants confirmation.
- **Action:** run `git log --all --full-history -- .env` and `git log -S 'eyJ' --all` to verify.

### CI/CD
- **None.** No `.github/workflows/`. Lint/typecheck/build/test are not gated. Failing code can land on master without external feedback.

---

## 1.2 Code Quality

### Lint config & violations
- `eslint.config.js` extends `@eslint/js` recommended + `typescript-eslint` strict.
- `@typescript-eslint/no-unused-vars` is **disabled** in eslint.config.js — dead code never surfaces.
- 116 violations:
  - **57 × `@typescript-eslint/no-explicit-any`** (50% of all errors)
  - 11 × `react-refresh/only-export-components` (constants exported alongside components in `ui/badge.tsx`, `ui/button.tsx`, `contexts/AuthContext.tsx`)
  - 5 × `react-hooks/exhaustive-deps`
  - 3 × `@typescript-eslint/no-unsafe-function-type` (`sdk/event-bus.ts:55`, `sdk/plugins.ts:35,37`)
  - 2 × `prefer-const`
  - 2 × `@typescript-eslint/no-empty-object-type`
  - 1 × `no-constant-condition`
  - 1 × `@typescript-eslint/no-require-imports` (`tailwind.config.ts`)

### Type safety
- **46 `tsc --noEmit` errors.** Specific examples:
  - `src/pages/MyStartup.tsx:18` — imports undefined `DbDbAuditEntry` (typo, double prefix)
  - `src/pages/Governance.tsx:433` — queries non-existent `votes` table column
  - `src/pages/Analytics.tsx:96` — references `is_verified` (schema is `verified`)
  - `src/lib/dd-workflow.ts` — 10 errors (Omit narrowing mismatches)
  - `src/pages/InvestorHub.tsx` — 5 property collisions on `ComplianceReport` type (`overallStatus`, `riskLevel`)
- **17 `as any` casts** still in production code (down from 50+ before Phase 6 cleanup).
- 40+ exported lib functions have no explicit return type (rely on inference).

### Dead code & duplication
- ESLint can't detect dead exports because `no-unused-vars` is off.
- Manual scan: no duplicate component files. Card pattern reused 40×, Button 33× — those are intentional shadcn primitives.

### Test coverage
- `src/test/example.test.ts` — 143 bytes, placeholder.
- **0 tests** for: 12 blockchain hooks, 5 data hooks, AuthContext, RoleGuard, 40+ lib/ analysis fns, ErrorBoundary, WalletContext.
- Vitest + Playwright + RTL all installed; nothing wired.

### Error handling discipline
- `lib/error-handler.ts` exists; `logDataError` correctly used in `useStartups`/`useStartup`/`useMetricsHistory`.
- **Not wired** in: `MyStartup.tsx:108` (silent catch), `MyStartup.tsx:125` (audit log fetch), `pages/DealRooms.tsx`, several Edge Function fetches.
- `console.warn`/`console.error` outside `import.meta.env.DEV` gate: only `ErrorBoundary.componentDidCatch` (correct — should always log) and 2 demo example files. **Production console output is clean.**

---

## 1.3 Architecture

### Data flow
- React Query owns all server state. Hooks: `useStartups`, `useStartup`, `useMetricsHistory`, `useAllMetricsMap`, `useFundingRounds`, `useAuditLog`, `useProposals`, `useUserVotes`, `useTokenUnlocks`, `useStartupPledges`, `useDealRooms`, `useDealRoom`.
- All queries fall back to `DEMO_STARTUPS` / `DEMO_METRICS` on error or empty response (since `da6241a`, `useStartups` always merges DB rows with demo top-up).
- **Realtime invalidation:** `useRealtimeSync` (mounted once via `RealtimeProvider` in `App.tsx`) subscribes to 5 tables via Supabase Realtime and invalidates the corresponding query keys. Cleanup is correct.

### State management
- `AuthContext` — user/session/role. Demo session 24h. `signedInAt` timestamp checked on restore. Test creds preserved.
- `WalletContext` — wraps Solana Wallet Adapter; tracks bookmarked startup IDs in component state (**not persisted** to localStorage).
- `InstitutionalViewContext` — `institutionalMode` boolean, persisted in localStorage with try/catch.
- **No state duplication** between Context and React Query.

### Coupling hot-spots
- Most-imported components: Card (40×), Button (33×), Badge (20×) — all shadcn primitives, expected.
- No domain component imported by >6 files. No leaky abstractions.

### Routing
- `App.tsx` defines **31 routes**, all lazy-loaded except layout-critical (`Navbar`, `Footer`, `RoleGuard`, `ErrorBoundary`).
- Route → role mapping in `lib/role-access.ts` with default-deny on unknown paths and dynamic-route normalization (`/startup/123` → `/startup`).

### API contract validation
- **No Zod runtime validation.** Supabase responses are cast via `as DbStartup[]` — schema drift would surface as undefined-property reads at runtime.
- `zod` is in `package.json` but not imported anywhere in `src/`.

### Background jobs / leaks
- All `setInterval` / `setTimeout` calls have proper cleanup. No leaks detected.
- `useToast` `TOAST_REMOVE_DELAY` is 5 s. Listener subscription dependency was fixed to `[]`.

### Feature flags
- None. Compile-time only.

---

## 1.4 UI / UX (live audit at 360 / 768 / 1280 / 1920)

### Viewport check
| Viewport | Page | Result |
|---|---|---|
| 360 × 800 | `/` | Mobile lays out cleanly. Hero stacks. Hash marquee, comparison table, stats grid all responsive. No overflow. |
| 360 × 800 | `/login` | Quick-login buttons stack vertically. Manual sign-in form below. Looks intentional. |
| 1280 × 900 | `/dashboard` | Redirects to `/login` (auth gate working — RoleGuard fires). |
| 1280 × 900 | `/` | All sections render. Manual chunks load lazily as user scrolls. |

### Visual consistency (after polish pass `d724b99`)
- Solid token system (semantic colors, `--success`, `--info`, fixed dark-mode contrast).
- All purple/violet/indigo hardcodes replaced with primary blue. No gradient text. No glow/shine.
- Card → 2-layer institutional shadow.
- Button → `rounded-lg` with `active:translate-y-px`.
- `tabular-nums` on all numerics.

### Loading / empty / error states
- **Loading:** Skeleton or `PageLoader` at route level via Suspense. Some surfaces still show a raw spinner instead of skeleton (e.g., `EntityDossier.tsx` initial load).
- **Empty:** Dashboard's "no startups match" was upgraded with icon + headline + 2 CTAs. `Portfolio.tsx`, `Compare.tsx`, `Analytics.tsx` empty states are still generic single sentences.
- **Error:** `ErrorBoundary` wraps app + heavy components individually. Reasonable coverage.

### Forms
- `Register.tsx` — 6 steps, no progress percentage shown numerically, no draft save, inputs lack inline help.
- `MyStartup.tsx` — multiple tabs of forms, no autosave, audit log not filterable.
- `Login.tsx` — sign-up missing password-strength meter (only post-submit "must contain digit" toast).
- All forms call `rateLimit()` clientside.

### Information density
- Institutional mode CSS works (denser padding) but only affects spacing, not chart animations.

### Dark mode
- Tokens consistent. `--muted-foreground` bumped 50→65% in dark — passes AA contrast.

### Confirmation patterns for destructive actions
- Logout: silent. Cancel proposal: silent. "Anchor another" reset: silent. **No destructive action has a confirmation dialog.**

---

## 1.5 Accessibility — Live Playwright audit

### Document baseline
- `<html lang="en">` ✓
- `<meta name="viewport" content="width=device-width, initial-scale=1.0">` ✓
- 1 `<main>`, 1 `<nav>`, 1 `<footer>` per page ✓
- **No skip-link** (missed pattern: `<a href="#main">Skip to content</a>` at top of body).

### Heading hierarchy
- Landing: 1 H1, 11 H2, 35 H3 — long but coherent.
- Login: 1 H1, 0 H2 (acceptable for a focused form page).

### Per-route audit
| Route | Images w/o alt | Buttons w/o name | Inputs w/o label | Anchors w/o text |
|---|---|---|---|---|
| `/` | 0 | 0 | 0 | 0 |
| `/login` | 0 | **1** | 0 | 0 |
| `/dashboard` | (auth-gated; saw login redirect) | | | |

The 1 login button without an accessible name is the **password show/hide eye icon** in `pages/Login.tsx` — no `aria-label`. Single, easy fix.

### Console errors live (every page)
```
[ERROR] CSP directive 'frame-ancestors' is ignored when delivered via <meta>
[ERROR] X-Frame-Options may only be set via an HTTP header, not <meta>
```
Both directives are in `index.html` but browsers honor them only as response headers. The directives in `vercel.json` cover `X-Frame-Options` correctly, but **`Content-Security-Policy` is only in the meta tag** → enforcement on top-level navigations is partial. **P1 finding.**

### Reduced motion
- Global `@media (prefers-reduced-motion: reduce)` rule in `index.css` kills all animations + transitions.
- Confetti util explicitly checks `matchMedia` early-return ✓.

### Keyboard nav
- Cmd+K opens command palette. `?` shows shortcut help.
- `<Dialog>` (Radix) handles focus trap + Esc + restore-focus correctly.
- **Skip-link missing** — keyboard users tab through the entire navbar before reaching main content.

### Color contrast
- Most foreground/background pairs pass AA after polish pass.
- Tier-badge contrast on EntityDossier was bumped on Gold/Bronze — passes now.
- **Untested:** info-only chips with custom HSL like `text-amber-500` on `bg-amber-500/10` in light mode — visually OK but not formally measured.

---

## 1.6 Security

### Dependency audit (`npm audit`)
- **0 critical, 0 high in app code.**
- Many MODERATE in the Solana SDK supply chain (`@solana/web3.js` → `bigint-buffer`; `@metaplex-foundation/mpl-bubblegum` → `merkletreejs`; `@coral-xyz/anchor` → `@coral-xyz/borsh`; `@keystonehq/sol-keyring` → `uuid`).
- Most have `fixAvailable: false` (need upstream Solana ecosystem to patch) or require **major version upgrades** which would break things.
- **Recommendation:** monitor; do not chase upgrades during the 2-week hackathon window.

### Secrets sweep
- `.env` is in `.gitignore`. Working-tree file contains a Supabase anon JWT (publicly-safe by design).
- **Action:** `git log --all -- .env` to verify it was never committed; if it was, plan key rotation.
- Default-fallback uses placeholder `eyJ...placeholder` (correct pattern in `integrations/supabase/client.ts`).
- No `sk_live`, `BEGIN PRIVATE`, or AWS-style keys found anywhere.

### Auth & session
- Supabase auth via SDK. `autoRefreshToken: true`. `persistSession: true`.
- Demo session lifetime: 24 h, age-checked on restore.
- Logout clears Supabase session AND the demo localStorage key.
- Demo creds preserved per user instruction.

### Authorization
- `lib/role-access.ts` default-denies (returns `'admin'` access for unknown paths → only admin sees them).
- All 31 routes in `App.tsx` have entries.
- Route guard `RoleGuard` lets public routes render before auth resolves.

### Server-side enforcement (Supabase RLS)
- 11 migrations have RLS policies enabled.
- Latest tightening: `proposals` and `votes` INSERT policies require `investor` or `admin` role.
- **Public read** on most tables (intentional). Audit log is public-readable.

### XSS & content security
- Single use of inline-HTML injection — only in `components/ui/chart.tsx` for CSS-variable injection. Source is config object, not user input ✓.
- All sanitization: `lib/sanitize.ts` (`escapeHtml`, `sanitizeText`, `sanitizeUrl` — blocks `javascript:`/`data:`).
- LP report uses `escapeHtml` on user-supplied startup name/description ✓.

### CSRF
- All mutations go through Supabase SDK. No custom fetch-based mutations to public endpoints. Supabase cookies are `HttpOnly`, `Secure`, `SameSite=Lax` by default.

### Security headers
- `index.html` has CSP, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` as meta tags.
- `vercel.json` has `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `HSTS`, `Permissions-Policy` as response headers.
- **CSP is missing from `vercel.json`** — meta-tag CSP is partially ignored. **P1.**

### Rate limiting
- Client-side `rateLimit()` in `lib/sanitize.ts` used on Register, Governance, MyStartup forms.
- **Server-side rate limiting absent.** Acceptable for hackathon scope.

### File upload (BMC PDF)
- Type + extension + magic-byte validation ✓. Size cap 5 MB ✓. Filename sanitized ✓.
- **Stored in localStorage as data-URL only.** Acceptable for MVP.

### Open redirects
- All `navigate(...)` calls use static paths or guarded URLs. No `window.location = userInput` patterns.

### IDOR
- `MyStartup` filters by `user_id` before allowing edits ✓.
- `useUserVotes(userId)` filters by `user_id` ✓.
- Audit log is intentionally public-readable.

### Logging hygiene
- All `console.warn`/`console.error` in production paths gated behind `import.meta.env.DEV`. ErrorBoundary always logs (correct).

---

## 1.7 Performance

### Build output (Phase 8 vendor chunking)
| Chunk | gzipped | Notes |
|---|---|---|
| `vendor-3d` | 243 KB | Three.js + R3F. **Only used on Portfolio3D + `/portfolio`** — should be route-deferred. |
| `vendor-pdf` | 160 KB | jsPDF + html2canvas. **Only used on PDF export.** Should `import()` on click. |
| `vendor-charts` | 89 KB | Recharts — needed on many pages, OK. |
| `vendor` (misc) | 288 KB | Catch-all — could split further. |
| `vendor-supabase` | 48 KB | OK. |
| `vendor-solana` | 46 KB | OK. |
| `vendor-motion` | 36 KB | framer-motion, OK. |
| `vendor-radix` | 25 KB | OK. |
| `index` (main) | 28 KB | Excellent (was 1.1 MB before vendor splits). |

### Lazy loading
- All 31 pages use `lazy()` ✓.
- `ErrorBoundary`, `Navbar`, `Footer`, `RoleGuard` are eager (correct).

### Images
- Only 2 `<img>` tags total (`WalletConnectModal.tsx`, `Landing.tsx` Unsplash hero).
- **No `loading="lazy"`, no `width`/`height`, no `srcset`.** CLS risk on Landing hero.

### Fonts
- Imported via Google Fonts CSS `@import` in `src/index.css:1`. `display=swap` included ✓.
- **No `<link rel="preconnect">`** for `fonts.googleapis.com` and `fonts.gstatic.com` — extra DNS+TLS RTT on first paint.
- 3 families × 5 weights ≈ 12 font files.

### Render-blocking
- Vite inlines critical CSS. Module script is `defer`. No external blocking scripts.
- TTFB / domContentLoaded measured at **3.4 s** for `/` (mobile viewport, dev server). Production CDN should be 5-10× better.

### N+1
- `useAllMetricsMap` is the bulk-fetch path; used everywhere data tables iterate.
- No per-row `useMetricsHistory` calls inside `.map()` blocks. ✓

### Animations
- 76 framer-motion uses. Global `prefers-reduced-motion` killswitch in `index.css` ✓.

### Web workers
- No CPU work offloaded. PELT, Monte Carlo, signal-engine, gradient-boost all run on main thread.
- Acceptable while datasets are small (<200 rows).

---

## 1.8 SEO & Metadata

| Item | State |
|---|---|
| Site `<title>` | Static, in `index.html` |
| Per-route titles | **Missing** — every page shows the same `<title>` (Playwright confirmed Login + Dashboard + Landing all show the same) |
| `<meta description>` | Static, in `index.html` |
| OG tags | `og:type`, `og:title`, `og:description` set; **no `og:image`, no `og:url`** |
| Twitter card | `summary_large_image` set, **no `twitter:image`** |
| Canonical URL | **Missing** |
| `robots.txt` | Present, `Allow: /` — no `Sitemap:` line |
| `sitemap.xml` | **Missing** |
| 404 page | `pages/NotFound.tsx` — friendly copy, "Back to home" CTA |
| URL hygiene | All routes kebab-case, lowercase. No mixed conventions. ✓ |

---

## 1.9 Observability & Operations

### Error tracking
- No Sentry / DataDog / Posthog wired.
- `lib/error-handler.ts` ring buffer is dev-only.
- `ErrorBoundary.componentDidCatch` logs to console — also dev-only.
- **Production errors are silent.**

### Health checks
- No `/health` endpoint.

### Backups
- Supabase free tier: only daily backups, 7-day retention.

### Feature flags / rollback
- No flags. Rollback is via the `backup` branch (which I am explicitly forbidden to touch).

---

## 1.10 Developer Experience

| Item | State |
|---|---|
| `README.md` | Present, accurate as of `2399234`. Missing: hackathon deadline mention, CONTRIBUTING.md link |
| Time-to-first-run | ~2 min (clone → install → cp .env.example → npm run dev). No setup script needed. |
| Pre-commit hooks | **None**. No `.husky/`, no `lint-staged` config. |
| PR template | **None**. |
| Issue templates | **None**. |
| CI/CD | **None**. |
| Local-vs-prod parity | esbuild drops `console`/`debugger` in prod. Source maps disabled in prod. |

---

## Prioritized Backlog

### Severity definitions
- **P0** — security or correctness; blocks demo / submission
- **P1** — significant UX, perf, or data-quality issues
- **P2** — polish, consistency, DX
- **P3** — nice-to-have

### Backlog table

| ID | Area | Issue | File:Line | Sev | Effort | Risk | Recommendation |
|---|---|---|---|---|---|---|---|
| A1 | Security | CSP `frame-ancestors` ignored as `<meta>`; partial XFO enforcement | `index.html:6` + `vercel.json` | P0 | S | L | Move full CSP into `vercel.json` response headers; keep `<meta>` as backup |
| A2 | Type safety | 46 `tsc` errors block strict typecheck (e.g. `MyStartup.tsx:18` imports `DbDbAuditEntry`) | various | P0 | M | M | Fix typo + property collisions; add `npm run typecheck` to CI |
| A3 | DX / CI | No GitHub Actions; failing code can land on master | (missing) | P0 | S | L | Add `.github/workflows/ci.yml` running lint + typecheck + build + test on push/PR |
| A4 | Security | `.env` history check needed; if committed, rotate | `.env` | P0 | S | L | `git log --all --full-history -- .env`; if found, rotate Supabase anon key |
| B1 | Lint | 57 `no-explicit-any` violations | `hooks/use-blockchain.ts` (12), `sdk/config.ts` (6), `sdk/plugins.ts` (8) | P1 | M | L | Type errors as `unknown` + narrow with type guards; create a shared `SolanaTxError` interface |
| B2 | Tests | 0 real tests; 1 placeholder | `src/test/example.test.ts` | P1 | L | L | Add tests for `useStartups` fallback merge, RoleGuard, AuthContext sign-in/out, sanitize.ts, role-access.canAccess |
| B3 | A11y | Login password show/hide button has no `aria-label` | `pages/Login.tsx` | P1 | XS | L | Add `aria-label="Show password"` / `"Hide password"` |
| B4 | A11y | No skip-link to main content | `App.tsx` (entry of every page) | P1 | XS | L | Add `<a href="#main" className="sr-only focus:not-sr-only">Skip to content</a>` and `id="main"` on `<main>` |
| B5 | SEO | Same `<title>` on every page | (per-page) | P1 | S | L | Tiny `useDocumentTitle(title)` hook called from each page top |
| B6 | SEO | No `og:image` / `twitter:image` | `index.html` | P1 | S | L | Generate a 1200×630 social preview, host in `public/og-image.png` |
| B7 | Observability | Production errors are invisible | `ErrorBoundary.tsx`, `lib/error-handler.ts` | P1 | M | L | Sentry wiring (free tier covers solo dev) — gate behind `VITE_SENTRY_DSN` |
| B8 | Perf | `vendor-3d` loaded on routes that never use it | `pages/Dashboard.tsx`, `pages/Portfolio.tsx` | P1 | S | L | Verify `Portfolio3D` is `lazy()`-imported INSIDE the page |
| B9 | Perf | `vendor-pdf` loaded on first MyStartup view | `pages/MyStartup.tsx` | P1 | S | L | Lazy-import `jspdf`/`html2canvas` only on click of "Export PDF" |
| B10 | Forms | Register has 6 steps, no progress %, no draft save | `pages/Register.tsx` | P1 | M | L | Add inline progress meter, persist form state to localStorage on every change with TTL |
| B11 | UX | No password strength meter on signup | `pages/Login.tsx` | P1 | S | L | Inline meter with 3-band scale |
| C1 | API contract | No runtime validation of Supabase responses | all `hooks/use-*.ts` | P2 | M | L | Wrap responses with Zod parsers (already in deps but unused) |
| C2 | Error handling | `MyStartup.tsx` and `DealRooms.tsx` have silent catches | `pages/MyStartup.tsx:108`, `pages/DealRooms.tsx` | P2 | S | L | Pipe through `logDataError` |
| C3 | UX | Inconsistent empty states across pages | `pages/Portfolio.tsx`, `pages/Compare.tsx`, `pages/Analytics.tsx` | P2 | M | L | Adopt the Dashboard empty-state pattern |
| C4 | Perf | No `preconnect` for Google Fonts | `index.html` | P2 | XS | L | Add `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` |
| C5 | Perf | Landing hero `<img>` lacks `width`/`height` and `loading` | `pages/Landing.tsx` | P2 | XS | L | Add explicit dimensions; use `loading="eager"` (above fold) |
| C6 | A11y | No formal contrast measurement for amber-on-amber chips in light mode | various | P2 | S | L | Run axe-core on key surfaces |
| C7 | DX | No pre-commit hooks | (missing) | P2 | S | L | Add Husky + lint-staged: run prettier + eslint --fix on staged files |
| C8 | DX | No PR template | `.github/PULL_REQUEST_TEMPLATE.md` (missing) | P2 | XS | L | Add template with What/Why/Test plan/Screenshots sections |
| C9 | Lint | `@typescript-eslint/no-unused-vars` disabled globally | `eslint.config.js:23` | P2 | S | L | Re-enable; fix the resulting fallout |
| C10 | Architecture | `zod` is in deps but never imported | `package.json` | P2 | XS | L | Use it (per C1) or remove |
| C11 | UX | No confirm dialog on logout / cancel-proposal | `Navbar`, `Governance.tsx` | P2 | S | L | Wrap destructive actions in shadcn `AlertDialog` |
| C12 | Forms | `MyStartup.tsx` has no autosave | `pages/MyStartup.tsx` | P2 | M | L | Debounced localStorage backup of form state with explicit "Saved as draft" indicator |
| D1 | SEO | No `sitemap.xml` | (missing) | P3 | S | L | Generate from route table — only include public routes |
| D2 | SEO | No canonical link | `index.html` | P3 | XS | L | Add canonical (use real domain when one is acquired) |
| D3 | DX | README doesn't mention hackathon deadline | `README.md` | P3 | XS | L | One-paragraph addition |
| D4 | Observability | No `/health` endpoint | (missing) | P3 | M | L | Supabase Edge Function + `vercel.json` rewrite |
| D5 | UX | No autosave indicator anywhere | various forms | P3 | M | L | Pattern after Linear's "Saved · 14:32" indicator |
| D6 | Tests | No e2e tests despite Playwright installed | (missing) | P3 | L | L | Add 3-5 critical-flow tests (login, anchor proof, view dossier) |
| D7 | UX | "/api" page and "/integrate" page have overlapping intent | `pages/API.tsx`, `pages/Integrate.tsx` | P3 | S | L | Merge into single `/integrate` with tabs |

---

## Phase 2 — Recommended milestone plan

> **STOP — awaiting your approval before any Phase 3 execution.**

I recommend grouping the backlog into 5 sequential milestones, each shippable as a chain of small commits on `merged-ai-roadmap-v2`. Estimates assume solo dev pace.

### M1 — Security & correctness (P0) — ~4–5 hours
Goal: nothing demo-breaking ships.
- A1 — Move CSP into `vercel.json` response headers
- A2 — Fix all 46 typecheck errors
- A3 — Add `.github/workflows/ci.yml` (lint + typecheck + build + test on push/PR)
- A4 — Confirm `.env` was never committed; rotate if it was

### M2 — Forms, a11y, observability (P1) — ~6–8 hours
Goal: every visitor gets a polished, accessible, debuggable experience.
- B3 — `aria-label` on password show/hide
- B4 — Skip-link
- B5 — Per-route `<title>` via tiny `useDocumentTitle` hook
- B6 — `og:image` + `twitter:image` (host in `public/`)
- B7 — Sentry wiring (free tier, gated behind `VITE_SENTRY_DSN`)
- B10 — Register progress meter + draft save
- B11 — Password strength meter on signup

### M3 — Type safety + lint cleanup (P1/P2) — ~4–6 hours
Goal: green typecheck and lint, no stragglers.
- B1 — Replace 57 `no-explicit-any` with proper types
- C9 — Re-enable `no-unused-vars`
- C10 — Use Zod (or remove)
- C1 — Zod runtime validators for `useStartups`, `useStartup`, `useDealRooms`
- C2 — Pipe MyStartup + DealRooms catches through `logDataError`

### M4 — Performance + perceived perf (P1/P2) — ~3–4 hours
- B8 — Verify `Portfolio3D` is route-internal lazy
- B9 — Lazy-import `jspdf`/`html2canvas` on Export PDF click
- C4 — Google Fonts `preconnect`
- C5 — Landing hero explicit dimensions

### M5 — DX + tests + polish (P2/P3) — ~5–7 hours
- B2 — Tests on critical paths (target 30% coverage on `lib/sanitize`, `lib/role-access`, `useStartups`, `AuthContext`)
- C7 — Husky + lint-staged
- C8 — PR template
- C3 — Empty states unified across Portfolio/Compare/Analytics
- C6 — axe-core run on key pages
- C11 — Confirm dialogs for destructive actions
- C12 — MyStartup autosave
- D1, D2, D3 — sitemap, canonical, README hackathon line
- D6 — 3-5 Playwright e2e flows
- D7 — Decide on `/api` vs `/integrate` merge

**Total estimated effort:** 22–30 hours of focused work — fits comfortably in the 2-week window with margin for the May 11 submission video, devnet deployment, and X account setup that are still on the broader hackathon roadmap.

---

## What I propose now

Reply with one of these:

1. **"Approve M1+M2"** — I'll execute Milestones 1 and 2 immediately, commit per item with conventional messages, run full check suite after each commit, push to `merged-ai-roadmap-v2`. Backup branch untouched.
2. **"Approve all 5"** — I'll work through M1 → M5 in sequence, same execution rules.
3. **"Approve M1 only"** — Conservative path: ship the P0 security/correctness fixes, then we re-evaluate.
4. **"Modify scope"** — Tell me what to add/drop and I'll update the plan.

Whichever you pick, **I will not touch:**
- `backup` branch (read-only per durable feedback)
- Test credentials (`admin/investor/startup@chainmetrics.io`)
- The Anchor program (out of scope unless you say otherwise)

I will use Playwright MCP after each milestone to verify visually, and Supabase MCP if any RLS changes are in scope.
