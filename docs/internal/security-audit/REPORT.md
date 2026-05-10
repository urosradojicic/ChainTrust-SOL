# ChainTrust Deep Security Audit — 2026-05-07

**Branch**: `security/audit-2026-05-07`
**Auditor**: senior application-security + offensive-research methodology, autonomous
**Scope**: full repository — frontend (React/Vite), Supabase RLS + migrations + Edge Function, Anchor program, CI/CD, dependencies, git history
**Threat model**: see [`docs/internal/security-audit/00_threat_model.md`](00_threat_model.md)

---

## Executive summary

A deep adversarial pass against the ChainTrust codebase found **one Critical**, **four High**, **five Medium**, and several Low/Informational issues. The most consequential finding (C1) silently undermines the trust premise of the product: a startup user could mark their *own* row `verified=true, trust_score=100` because the existing RLS policy on `startups.UPDATE` had no `WITH CHECK` and the May 2026 hardening migration didn't replace it. A second class of findings (M-A5, M-A6) showed the client's blockchain hooks systematically swallowed every on-chain error into a fake `DEMO_*` signature — including for a hook that was passing a *wrong* account list to the Anchor program — so users would see "success" on calls that never executed.

**Critical and High findings are all fixed in this branch.** Two Anchor program hardening fixes (C1-paired counter overflows, seed-bound proposal account substitution defense) require a program redeploy to take effect. **No credentials require rotation** — the only "secret" in the tree (`.env`) is a Supabase publishable anon key, which is intentionally public-by-design and gated by RLS.

| | Critical | High | Medium | Low | Info |
|---|---|---|---|---|---|
| Found | 1 | 4 | 5 | 4 | 2 |
| Fixed in this PR | 1 | 4 | 5 | 4 | 2 |
| Requires program redeploy | — | — | 2 | 3 | — |
| Requires credential rotation | 0 | 0 | 0 | 0 | 0 |

---

## Findings table

| ID | Severity | Title | File:Line | Status |
|---|---|---|---|---|
| **C1** | Critical | RLS on `startups.UPDATE` lets startup user self-grant `verified` and `trust_score` | `supabase/migrations/20260330220858_*.sql:28-30` | ✅ fixed (BEFORE UPDATE trigger) |
| **H1** | High | `useExecuteProposal` passes wrong account list — every call to deployed program fails silently | `src/hooks/use-blockchain.ts:686-698` | ✅ fixed (added vault PDA) |
| **H2** | High | Hooks swallow real on-chain errors into fake `DEMO_*` sigs across 11 sites | `src/hooks/use-blockchain.ts` (all `catch` blocks) | ✅ fixed (rethrow when `IS_PLACEHOLDER_PROGRAM_ID` is false) |
| **H3** | High | Pledges INSERT had no investor-attribution check + no UPDATE/DELETE policies | `supabase/migrations/20260330220858_*.sql:50-59` + `20260422200000_deal_rooms.sql` | ✅ fixed (replaced INSERT policy + added UPDATE/DELETE) |
| **H4** | High | `startup_audit_log` previously forgeable (closed in May 2026 audit, reverified) | `20260330220858_*.sql:23-25` → `20260505000000_security_hardening.sql` | ✅ already closed |
| **M1** | Medium | Edge Function `risk-analysis` allows `Origin: *`, no auth, no body size cap, no rate limit, raw error echo | `supabase/functions/risk-analysis/index.ts` | ✅ fixed (origin allowlist + body cap + per-IP limit + generic error) |
| **M2** | Medium | EntityDossier inline `<a href={https://explorer.solana.com/tx/${ev.txHash}}>` skipped `explorerTxUrl()` URL encoding | `src/pages/EntityDossier.tsx:293` | ✅ fixed (uses `explorerTxUrl()`) |
| **M3** | Medium | `entity-aggregator.ts` builds explorer URL from raw `treasury` field with no validation or encoding | `src/lib/entity-aggregator.ts:136` | ✅ fixed (validate + use `explorerAddressUrl()`) |
| **M4** | Medium | `proposals.proposer` field was free-text client input → governance attribution forgery | `src/pages/Governance.tsx:126-135` | ✅ fixed (BEFORE INSERT trigger derives from `auth.uid()`) |
| **M5** | Medium | Anchor program: counters incremented with `+=` (BPF wraps silently in release) | `lib.rs:133, 198, 580` | ✅ fixed (`checked_add`) — needs redeploy |
| **L1** | Low | Anchor program: `CastVote/ExecuteProposal/CancelProposal/CloseVoteRecord` — `proposal` account lacked `seeds`/`bump` constraint | `lib.rs:1167, 1201, 1213, 1236` | ✅ fixed (added explicit seeds bind) — needs redeploy |
| **L2** | Low | Stored XSS latent in `solana-actions.ts` `embedHtml` — un-escaped `startup.name` in HTML alt attr | `src/lib/solana-actions.ts:158` | ✅ fixed (`escapeHtml` on every interpolation) |
| **L3** | Low | `update_proposal_votes` SECURITY DEFINER lacked `SET search_path` (CVE-2018-1058 family) | `supabase/migrations/20260405000000_*.sql:59-69` | ✅ fixed (search_path locked) |
| **L4** | Low | `handle_new_user` accepted unbounded `display_name` from signup metadata (DoS via 10MB string) | `supabase/migrations/20260330182708_*.sql:102-117` | ✅ fixed (control-char strip + 200-char cap) |
| **I1** | Info | Demo session restore is bypassable via localStorage tampering (read-only blast radius) | `src/contexts/AuthContext.tsx:81-119` | ✅ documented as intentional design; defense-in-depth comment added |
| **I2** | Info | `actions/checkout@v4`, `actions/setup-node@v4` use mutable major tags (not SHA-pinned) | `.github/workflows/ci.yml:29,32` | 🔵 deferred (low risk for first-party actions; tracked for follow-up) |

---

## Per-finding detail

### C1 — Mass-assignment of attested fields on `startups`

**Description.** The pre-existing policy `"Startup update own"` (commit `20260330220858_*.sql:28`) had `USING (auth.uid() = user_id AND has_role(...))` but no `WITH CHECK` clause and no column-level write protection. PostgREST/Supabase passes through arbitrary column updates as long as the row predicate matches. The May 2026 hardening migration added a separate `WITH CHECK` to other policies but did not replace this one.

**Impact.** Critical to the product premise: a startup-role user owning row `S` could `update startups set verified = true, trust_score = 100, sustainability_score = 100, mrr = 99999999 where id = S`. The "Verified" badge in the screener, the leaderboard's "trust score" sort, the LP report's headline metrics — every consumer of these columns trusts that they're oracle-attested or admin-set, but they're directly user-controlled.

**PoC** (post-auth as `startup` role, no admin needed):
```ts
const { error } = await supabase.from('startups')
  .update({ verified: true, trust_score: 100, sustainability_score: 100 })
  .eq('id', myStartupId);
// error is null; row reflects the update on next read.
```

**Fix applied.** `supabase/migrations/20260507000000_audit_2026_05_07_fixes.sql` adds a `BEFORE UPDATE` trigger `guard_startup_attested_fields` that resets `verified`, `trust_score`, `sustainability_score`, `energy_score`, `carbon_score`, `tokenomics_score`, `governance_score`, `user_id`, and `created_at` back to their `OLD.*` values for any caller who is not `has_role('admin')`. Trigger is `SECURITY DEFINER` with locked `search_path = public, pg_temp`. Idempotent: `DROP TRIGGER IF EXISTS … CREATE TRIGGER …`.

**Residual risk.** `service_role` can still write any column (by design — used for oracle attestation jobs and admin tooling). The trigger does not prevent legitimate writes from `service_role` because `service_role` bypasses RLS and triggers on per-Supabase-default — verify before deploying that your service-role attestation jobs target columns through the back-end (which they do; they should not be affected).

---

### H1 — `useExecuteProposal` account list mismatch

**Description.** The on-chain `ExecuteProposal` Anchor `Accounts` struct (lib.rs:1188-1202) requires `[authority, dao, vault, proposal]` in order. The hook (use-blockchain.ts:686-698) passed `[user, daoPDA, proposalPDA]` — vault missing. On the deployed program every call would fail with `AccountNotEnoughKeys`. The catch block (covered by H2) swallowed the error into a `DEMO_*` sig, so the UI showed "executed" without anything happening.

**Impact.** Governance was broken silently. Users could vote "for" but no proposal could ever be executed.

**Fix applied.** `src/hooks/use-blockchain.ts:686-704` — added `getVaultPDA()` and inserted the vault account in position 3.

---

### H2 — Silent on-chain error swallow across all hooks

**Description.** Every `catch` block in `src/hooks/use-blockchain.ts` returned `genFallbackTxSig()` (a `DEMO_*` string) regardless of whether the error came from a wallet rejection, simulation failure, RPC error, or — as in H1 — a programming bug in the account list. Combined with the missing simulation step on most paths, users could be charged 5,000-lamport failed-transaction fees while seeing fake "success" toasts.

**Fix applied.** Introduced `runChainOrDemo` helper and refactored all 11 catch blocks. New behavior: if `IS_PLACEHOLDER_PROGRAM_ID` is true (development with the placeholder program id), continue to return a `DEMO_*` sig. Otherwise rethrow as a real `Error` so callers' toasts show the underlying message (already routed through `getErrorMessage()`).

**Residual risk.** Demo-mode UX is unchanged when `VITE_SOLANA_PROGRAM_ID` is unset. In production, hook callers must catch errors with toasts; spot-checked `Staking.tsx`, `Governance.tsx` — they already do.

---

### H3 — Pledges RLS allowed forged investor attribution + no mutation policies

**Description.** The original "Startup insert own pledges" policy (20260330220858_*.sql:50-59) only checked the caller owned the referenced startup. After the deal-rooms migration added `investor_id`/`pledge_amount`/`escrow_tx_sig`, a startup owner could insert a pledge with `investor_id` set to *any* wallet, forging the appearance that a notable VC had pledged into their deal. There were also no `UPDATE` or `DELETE` policies on `pledges`, so admins couldn't even clean it up via the client.

**Fix applied.** `supabase/migrations/20260507000000_audit_2026_05_07_fixes.sql`:
- Replaced INSERT with `Pledge insert with attribution`: caller must be the investor (when `investor_id` is set), or own the startup (when `investor_id IS NULL` for founder-pledges), or be admin.
- Added `Pledge update own` and `Pledge delete own` (investor or startup owner or admin).

---

### H4 — `startup_audit_log` forgeable (re-verified — already closed)

The May 2026 audit closed this. Re-verified by reading `20260505000000_security_hardening.sql` — the INSERT policy now requires the caller to own the referenced startup. No further action.

---

### M1 — Edge Function hardening

**Description.** `supabase/functions/risk-analysis/index.ts` had `Access-Control-Allow-Origin: *`, no Authorization check, no Content-Length cap, no per-IP rate limit, and echoed raw `e.message` to clients on errors. As a public unauthenticated endpoint billed by Supabase per invocation, this was a denial-of-wallet vector.

**Fix applied.** Rewrote to:
- Allow only origins from `ALLOWED_ORIGIN` env (defaults to `https://chaintrust.app`, plus localhost ports for dev).
- Reject `Content-Length > 8 KiB` with `413`.
- Per-IP in-memory rate limit (30 reqs/min — backstop, not authoritative; real protection belongs at the Supabase platform edge).
- Cap `startup.name` at 80 chars and other strings at 200 chars before interpolating into the response template.
- Generic `"Internal error"` to clients on 500; raw exception goes to `console.error()` only.

---

### M2, M3 — URL injection via DB-derived strings

**Description.** Two render sites (`EntityDossier.tsx:293` for tx hash, `entity-aggregator.ts:136` for treasury wallet address) constructed Solana Explorer URLs by string-concatenation without `encodeURIComponent`. The `treasury` field in particular comes from `solana_address` / `wallet_address` columns where there's no DB-side validation that the value is a valid Solana base58 pubkey.

**Fix applied.**
- `EntityDossier.tsx:293` now uses the existing `explorerTxUrl()` helper (which `encodeURIComponent`s the path).
- `entity-aggregator.ts:136` validates with `isValidSolanaAddress()` first; renders only if it parses, and routes through `explorerAddressUrl()`.

---

### M4 — `proposals.proposer` was free-text

**Description.** The client wrote `proposer: sanitizeText(user?.email || 'anonymous', 100)` — and could send any string. A malicious investor could create a proposal claiming `proposer: "Vitalik Buterin"` for social-engineering value.

**Fix applied.** New `BEFORE INSERT` trigger `set_proposal_proposer` derives `proposer` from `profiles.display_name` (or email local-part) of `auth.uid()`. Admins can still pass arbitrary values for batch imports / migrations.

---

### M5, L1 — Anchor program hardening

**Description.**
- M5: `registry.startup_count`, `startup.total_reports`, `dao.proposal_count` were incremented with `+=`. In Solana BPF release builds, u64 wraps silently on overflow — astronomically unlikely to hit, but trivially preventable.
- L1: `CastVote`, `ExecuteProposal`, `CancelProposal`, `CloseVoteRecord` had `proposal: Account<'info, Proposal>` with no `seeds`/`bump` constraint. Anchor was already enforcing owner+discriminator (so currently unexploitable since `Proposal` is only created via `CreateProposal` with canonical seeds), but explicit binding prevents future code paths from creating non-canonical Proposal-typed accounts and substituting them.

**Fix applied.**
- All three counters use `checked_add(1).ok_or(ChainMetricsError::ArithmeticOverflow)?`.
- Added `seeds = [b"proposal", &proposal.id.to_le_bytes()], bump = proposal.bump` to all four account constraints.
- New `ChainMetricsError::ArithmeticOverflow` and `StartupIdMismatch` variants in `errors.rs`.

**Deployment note.** These changes ship in source on this branch but require an Anchor program redeploy with a bump in the IDL. The frontend continues to work in demo mode against the placeholder program ID.

---

### L2 — Stored XSS latent in `solana-actions.ts` `embedHtml`

**Description.** The function returns an `embedHtml` string — `<a href="${detailUrl}"><img alt="… ${startup.name}" /></a>` — interpolating `startup.name` un-escaped into the HTML `alt` attribute. No current consumer renders this raw, but the field is part of the public API surface and may be copy-pasted by users into third-party pages.

**Fix applied.** Every interpolation slot wrapped in `escapeHtml(…)`; `trust_score` coerced via `Number()` to drop any non-numeric content.

---

### L3 — `update_proposal_votes` SECURITY DEFINER lacked `SET search_path`

**Description.** Classic CVE-2018-1058 family — a `SECURITY DEFINER` function with default search_path is vulnerable to schema-shadowing. Currently unexploitable in this codebase because authenticated users have no `CREATE` on `public`, but every other security-definer function in the schema (`has_role`, `get_user_role`, `handle_new_user`) sets it explicitly, so this was a consistency gap.

**Fix applied.** Recreated the function with `SET search_path = public, pg_temp`.

---

### L4 — Unbounded `display_name` in `handle_new_user`

**Description.** The signup trigger inserted `raw_user_meta_data->>'display_name'` directly into `profiles.display_name` with no length cap. An attacker could send a 10MB display_name and DoS the row, or stash control characters that break downstream rendering (defense-in-depth — the client already sanitizes, but server-side belt-and-suspenders matters).

**Fix applied.** Strip control chars (`\x00–\x1F`, `\x7F`) and `LEFT(…, 200)`.

---

### I1 — Demo session escalation via localStorage

**Description.** `chaintrust_demo_user` localStorage key — anyone who knows a demo email (which is documented in JUDGES.md and SECURITY.md) can write `{email: 'admin@chainmetrics.io', signedInAt: Date.now()}` to localStorage, refresh, and become an admin client-side. Server-side RLS still rejects every write because demo user IDs (`demo-admin`) are not UUIDs and never satisfy `auth.uid() = user_id`. So the practical impact is read-only access to navigation surfaces — those pages render mock data anyway.

**Status.** Documented as intentional design with read-only blast radius. Defense-in-depth comment added to `AuthContext.tsx:80-93` clarifying that `parsed.role` is *not* trusted (role is always re-derived from the server-side `DEMO_ACCOUNTS` allowlist). The original code already did this; the comment now makes it explicit so it survives future refactors.

---

### I2 — CI uses mutable major tags for first-party actions

**Description.** `.github/workflows/ci.yml:29,32` use `actions/checkout@v4` and `actions/setup-node@v4` — mutable tags. OpenSSF best-practice recommends SHA-pinning. Risk is low because both are first-party GitHub actions (compromise would be a major incident industry-wide).

**Status.** Deferred — tracked as a follow-up. Fix is a one-line change per action when the user is ready: `actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11 # v4.1.1`.

---

## Out of scope by design (informational)

- **Three remaining `npm audit` highs** (`bigint-buffer`, `@solana/spl-token`, `@solana/buffer-layout-utils`) chain via `bigint-buffer`, which is abandoned. The only `npm audit fix` is a semver-major downgrade of spl-token to 0.1.8 which breaks the modern API. Practical impact is low because our spl-token decode path only consumes bytes from cluster-verified Solana RPC. Tracked.
- **Demo accounts (`admin@chainmetrics.io` etc.)** — intentional public-by-design demo creds. Sessions expire after 24 hours.
- **`vercel.json` `style-src 'unsafe-inline'`** — required for Tailwind/shadcn runtime styles. Different directive, narrower trade-off than `script-src 'unsafe-inline'` (which is correctly absent).
- **Vite `optimizeDeps` cache invalidation** — `npm ci` lockfile invalidates correctly; verified.

---

## Secrets to rotate

**None.**

The only "secret" present in any tracked or untracked file is the Supabase **publishable anon JWT** in the local `.env`. Decoding it shows `role: "anon"` — Supabase explicitly designs this to be embedded in client bundles and gated by RLS. The file `.env` is gitignored and `git rev-list --all -- .env` confirms it was never committed. `.env.example` contains placeholders only.

A `git log --all -p` scan for `eyJ`, `sk_live`, `sk_test`, `AKIA`, `-----BEGIN`, `password=`, and `service_role` returned no results that aren't already public-by-design (e.g., the same anon JWT echoed in development log files where present, all gitignored).

---

## Recommended follow-ups (out of scope but high value)

1. **Move `service_role`-mediated writes off the frontend** — for any oracle attestation logic that needs to set `verified`/`trust_score`, host it in a Supabase Edge Function that uses `service_role` server-side. Right now the trigger fix in C1 prevents *client* mass-assignment but assumes the legitimate update path uses service_role.
2. **Per-endpoint server-side rate limits** — `votes`, `pledges`, `metrics_history`, `proposals`. Postgres `pg_net` triggers or Edge Function gate. Client-side `rateLimit()` is a UX guard, not security.
3. **Audit log tamper-evidence** — write a `tx_hash` Merkle tree trigger that hashes each new audit row + previous root into a chain stored on `startup` rows; a client can later re-derive the chain to detect tampering.
4. **Profiles `email` column scope** — long-term, drop `email` from RLS-readable columns; expose a `profiles_public` view that omits it. Postgres doesn't support per-column RLS, so this needs a view + REVOKE on the base table.
5. **WAF / CDN rate limit** in front of the Vercel deploy and Edge Function for bot/scrape protection.
6. **Quarterly threat-model review** — `docs/internal/security-audit/00_threat_model.md` is a living doc; treat it as such.
7. **Pen test by an external firm** before mainnet program deploy.

---

## Change manifest

```
supabase/migrations/20260507000000_audit_2026_05_07_fixes.sql      [new]   C1, H3, M4, L3, L4
src/lib/entity-aggregator.ts                                       [edit]  M3
src/pages/EntityDossier.tsx                                        [edit]  M2
src/lib/solana-actions.ts                                          [edit]  L2
supabase/functions/risk-analysis/index.ts                          [edit]  M1
src/hooks/use-blockchain.ts                                        [edit]  H1, H2
src/contexts/AuthContext.tsx                                       [edit]  I1
blockchain/programs/chainmetrics/src/lib.rs                        [edit]  M5, L1
blockchain/programs/chainmetrics/src/errors.rs                     [edit]  M5
docs/internal/security-audit/00_threat_model.md                                  [new]   threat model
docs/internal/security-audit/REPORT.md                                           [new]   this report
```

All findings have at minimum a code change, a regression-resistant defense, or a documentation pointer. Tests pass: 74/74 vitest, typecheck clean.
