# ChainTrust — Threat Model (2026-05-07)

This is a *fresh* threat model written before reading any source for the May 2026 audit. No assumptions of safety from prior audits.

## 1. Tech stack

| Layer | Technology |
|---|---|
| **Frontend runtime** | React 18.3, TypeScript 5.9, Vite 5.4, browser only |
| **Frontend libs** | Tailwind 3, shadcn/ui, framer-motion 11, recharts, three.js, html2canvas + jsPDF, lucide-react |
| **Wallet / chain** | `@solana/web3.js` 1.95, `@solana/spl-token` 0.4.14, `@solana/wallet-adapter-{phantom,solflare,coinbase}`, `@coral-xyz/anchor` 0.30 |
| **Backend (BaaS)** | Supabase (PostgreSQL, GoTrue auth, RLS, Realtime, Edge Functions on Deno) |
| **Smart contracts** | Anchor (Rust) — `chainmetrics` program: 24 instructions, 6 PDAs |
| **Build / deploy** | Vite production bundle → Vercel static hosting; Vercel `vercel.json` defines headers + rewrites |
| **CI** | GitHub Actions, `npm ci --legacy-peer-deps` against committed lockfile |
| **Pkg manager** | npm (lockfile committed); bun lockfiles gitignored |
| **Test** | Vitest 3, jsdom 20, @testing-library/react 16 |
| **Public services consumed** | Pyth Hermes (oracle), Helius (transaction history), Solana RPC (devnet by default) |

There is **no Node/Express/Fastify backend** — the API surface is Supabase REST + RPC + Edge Functions, plus Solana RPC. Auth is Supabase GoTrue; service role key is never sent to the client (only `VITE_SUPABASE_PUBLISHABLE_KEY`, the anon JWT).

## 2. Trust boundaries (where untrusted input enters)

| # | Boundary | Source of untrusted input |
|---|---|---|
| **TB-1** | Browser ↔ Supabase REST/RPC | Anon-JWT-authenticated requests from the client. Defended by RLS. |
| **TB-2** | Browser ↔ Supabase Edge Function `/risk-analysis` | Any caller can `POST /functions/v1/risk-analysis` with arbitrary `{startup}` JSON. No auth required by the function body. |
| **TB-3** | Browser ↔ Solana RPC (devnet/mainnet) | Trusted *if* cluster is verified (genesis-hash check exists). Reads are public; writes require wallet signature. |
| **TB-4** | Browser ↔ Pyth Hermes | Public oracle, signed price updates. Read-only. |
| **TB-5** | Browser ↔ Helius API | Optional API key, returns transaction history. Read-only. |
| **TB-6** | URL → Router | `react-router-dom` route params come from URL. `:id` slugs flow into Supabase queries (PostgREST). |
| **TB-7** | localStorage | `chaintrust_demo_user`, `auth_token`, register-form drafts. JSON-decoded; if structure differs from expected, must not crash or escalate. |
| **TB-8** | Wallet signMessage / signTransaction | The wallet adapter signs whatever payload the app constructs. Adversarial payloads here = drained wallet. |
| **TB-9** | DB row content rendered to DOM | Once written by user A, displayed to user B. Persistent XSS surface. |
| **TB-10** | DB row content rendered to PDF | LP report uses `innerHTML` and a print-window fallback. Same XSS surface, different output channel. |
| **TB-11** | Anchor program → instruction data | The on-chain program receives instruction data signed by users; client-side bugs that craft malformed instructions can panic the program (DoS) or trigger semantic bugs (arithmetic). |
| **TB-12** | CI runner | GitHub Actions fetches dependencies via `npm ci`; lockfile-pinned but actions themselves can be tag-mutated if not SHA-pinned. |
| **TB-13** | Vercel build | Build environment receives env vars from Vercel project; CSP shipped via response headers, not meta. |

## 3. Crown jewels

| Asset | Sensitivity | Where it lives |
|---|---|---|
| **Supabase service role key** | Highest — bypasses RLS, full DB access | NOT in client. Only in Vercel build env (if at all) and Supabase dashboard. Compromise = full data takeover. |
| **Anon (publishable) JWT** | Low — identifies project, RLS enforces access | Shipped in client bundle. Public by Supabase design. |
| **User session JWTs (post-login)** | High per user — full RLS-permitted access for that user | Browser localStorage (Supabase default). |
| **Demo session marker** | Low — local-only stub | localStorage. |
| **Wallet private keys** | Highest per user — drains funds | Inside wallet extension; we never see them. We can request signatures. |
| **PII** | High — emails, optional display names | `profiles` table. |
| **Audit trail** | High — claimed-immutable on-chain pointer | `startup_audit_log` table (`tx_hash` column). Forging fake hashes = repudiation attack. |
| **Soulbound badges** | Medium — represent verification | On-chain PDAs; cannot be transferred per Anchor program. |
| **Smart contract authority keys** | Highest if program upgrade authority is held | Anchor `Pubkey`-based authority on certain instructions. |
| **Helius API key** | Low-medium — rate-limit token | Shipped in client bundle (visible to anyone). Cost vector if abused. |
| **Sentry DSN** | Low — write-only telemetry endpoint | Shipped in client bundle. |

## 4. Deployment surface

| What is publicly reachable | Why |
|---|---|
| The static SPA at `chaintrust.app` (Vercel) | Public marketing + product |
| All client-side routes including `/admin`, `/governance`, `/my-startup` | Routes are gated by `RoleGuard`; access control is **client-side** for navigation but **must be enforced server-side** by RLS for actual data |
| Supabase REST (`/rest/v1/*`) | Reachable with anon JWT; data filtered by RLS |
| Supabase RPC (`/rest/v1/rpc/*`) | Same |
| Supabase Edge Function `/functions/v1/risk-analysis` | Public (no auth check in function) |
| Supabase Realtime websocket | Public, channel auth via JWT |
| Vercel preview deployments | Per-PR — usually `*.vercel.app` URLs |

What should *not* be public but might be:
- Per-PR preview deployments may be indexed by search engines if `noindex` is missing.
- Supabase project SQL editor / dashboard — admin only by Supabase, but social-engineering risk on the project owner.

## 5. STRIDE

| Threat | Concrete manifestation in this app | Where to look during static analysis |
|---|---|---|
| **S — Spoofing** | (a) Forging another user's identity via JWT/cookie. (b) Calling Supabase RPC pretending to be admin. (c) Spoofed wallet address in deal-room creation. | `AuthContext`, RLS policies, deal_rooms migration, role checks |
| **T — Tampering** | (a) DB writes to fields the user shouldn't control (mass-assignment-style — though Supabase is column-explicit so this is structural). (b) Modifying tx_hash to point at someone else's tx. (c) Modifying form draft in localStorage to bypass client validation. (d) MITM RPC requests on a non-HTTPS connection. (e) Memo payload tampering before sign. | All `supabase.from('...').insert/update`, sanitize.ts, RLS WITH CHECK clauses, memo-anchor.ts |
| **R — Repudiation** | (a) Fake DEMO_ tx_hash inserted into audit log makes the user look like they anchored when they didn't. (b) Audit log entries for actions a user denies taking. | MyStartup.tsx audit-log inserts, `isDemoSignature` guard |
| **I — Info disclosure** | (a) PII leakage via overly-permissive RLS. (b) Sensitive data in client bundle, source maps, or git history. (c) Verbose error messages leaking SQL or stack traces. (d) JWT in URLs / logs. (e) PDF/LP report leaking data the viewer wasn't authorized to see. | RLS policies on `profiles`/`pledges`, env handling, error boundaries, console.log audits |
| **D — Denial of service** | (a) Unrate-limited Edge Function (denial-of-wallet via Supabase invocation billing). (b) Catastrophic regex backtracking. (c) Unbounded localStorage growth. (d) Front-end render bombs from DB content (e.g., 1MB string in description). (e) On-chain DoS via crafted instruction data panicking the program. | Edge function, sanitize.ts regexes, sanitization length caps |
| **E — Elevation of privilege** | (a) Self-grant `role='admin'` via direct insert. (b) Auth bypass via client-side-only `RoleGuard` (server must verify). (c) Privilege escalation via SQL injection or RPC abuse. (d) Anchor program authority misconfiguration. | user_roles RLS, RoleGuard.tsx, all `useAuth()` consumers, lib.rs program authority constraints |

## 6. Audit prioritization

Highest-risk surfaces, in order:

1. **Supabase RLS policies** (TB-1, TB-9, all STRIDE rows) — single source of authorization truth. Misconfig = wide blast radius.
2. **Wallet sign request payloads** (TB-8) — if we sign something the user didn't intend, funds move.
3. **Anchor program** (TB-11) — on-chain bugs are unpatchable without an upgrade authority and a redeploy.
4. **DB-row → DOM render paths** (TB-9, TB-10) — persistent XSS via stored startup names/descriptions.
5. **Edge Function** (TB-2) — public, unauthenticated, could be abused for cost.
6. **localStorage handling** (TB-7) — stored auth/role state must be validated, not trusted.
7. **Client bundle / git history** — for committed secrets, hardcoded keys, debug flags.

Phase 1 will read every file in these surfaces end-to-end, looking for the specific patterns enumerated above rather than grepping for keywords.
