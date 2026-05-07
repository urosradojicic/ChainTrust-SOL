# ADR-0003 — Supabase RLS as the authorization source of truth

- **Status**: Accepted
- **Date**: 2026-04
- **Deciders**: ChainTrust core team

## Context

ChainTrust has three roles (`admin`, `investor`, `startup`) and dozens of pages. Each page makes Supabase queries; some are reads (RPC + REST), some are writes (insert / update / delete on tables like `startups`, `pledges`, `votes`, `proposals`, `startup_audit_log`).

Authorization can be enforced in three places:

1. **Client** — hide UI, prevent the user from "seeing" the option
2. **Application server** — middleware that checks the role before forwarding the request
3. **Database** — Postgres Row-Level Security policies on every table

We have a SPA + Supabase BaaS architecture. Option 2 (application server) doesn't exist — there is no Node/Express in this repo. So the choice is really: client-only, RLS-only, or both.

Several real risks shaped the decision:

- A client-only check is **trivially bypassed** — open DevTools, call `supabase.from('user_roles').insert(...)`, done
- We later discovered that even our hardened RLS had gaps — a `WITH CHECK`-less UPDATE policy on `startups` let a startup-role user self-grant `verified=true, trust_score=100` (audit finding C1, fixed in May 2026). The fix was a `BEFORE UPDATE` trigger, not a client change — proving where the truth lives matters
- The publishable anon JWT ships in the client bundle; anyone who can read the source can call the API directly. The only thing that prevents abuse is RLS

## Decision

**Postgres Row-Level Security policies are the canonical authorization source of truth.** Client-side route guards exist, but only for UX (hide the option from users who can't use it).

Specifically:

1. **Every table has RLS enabled.** Migrations enforce this; no exceptions.
2. **Every policy is column-aware where columns matter.** UPDATE policies on `startups` use a `BEFORE UPDATE` trigger to lock attested fields (`verified`, `trust_score`, `*_score`, `user_id`, `created_at`) for non-admins.
3. **`SECURITY DEFINER` functions always set `search_path`** to prevent CVE-2018-1058-class privilege escalation (`has_role`, `get_user_role`, etc.).
4. **Client-side `RoleGuard` and `canAccess`** are documented as **UX-only** — they hide buttons and routes the user cannot use, but never as the authorization gate.
5. **Migrations are idempotent.** `DROP POLICY IF EXISTS … CREATE POLICY …` so a re-run on an already-migrated database is safe.

See [`supabase/migrations/`](../../supabase/migrations/) for the policies. The May 2026 audit migration ([`20260507000000_audit_2026_05_07_fixes.sql`](../../supabase/migrations/20260507000000_audit_2026_05_07_fixes.sql)) documents the column-aware `guard_startup_attested_fields` trigger explicitly.

## Consequences

### Positive

- **One authorization model** to test, audit, and reason about
- **Defense in depth at the DB layer** — even if the client is fully compromised, the data isn't (subject to the publishable JWT's RLS-permitted scope)
- **Security audits target one layer** — policies are SQL, reviewers can read and run them; doesn't require crawling app code
- **`anon` JWT can ship in the bundle safely** by Supabase design

### Negative

- **Policy logic is harder to read than imperative code** — `EXISTS (SELECT 1 FROM ...)` clauses, column-level triggers, etc. We compensate with comprehensive comments in the migration files
- **Postgres RLS doesn't have per-column SELECT/UPDATE policies natively** — column protection requires a trigger (which we use) or a view + REVOKE pattern (deferred follow-up for `profiles.email`)
- **Client-side filtering still happens** for UX (e.g., the screener filters startups by category) — but those filters are not security; the underlying query already returns only RLS-permitted rows

### Neutral

- We are committed to Supabase. Migrating to a different database would require porting all policies. Acceptable — Supabase's RLS expressivity is comparable to mainstream Postgres + PostgREST setups, so the policies *would* port, just with effort.

## Alternatives considered

- **Stand up a Node/Fastify backend that mediates DB access.** Rejected — adds a new attack surface (the backend becomes its own RBAC system to maintain) without removing the underlying RLS, since the database still serves both the new backend and any future direct access. We'd be running two authorization models.
- **Client-only checks with a "trusted client" model.** Rejected — the publishable JWT is in the bundle; "trusted client" is a contradiction in browser apps.
- **Keep RLS off and gate everything with the application.** Not applicable — there's no application layer to gate with, and adding one doesn't remove the need for RLS (anyone with the JWT can hit PostgREST directly).

## References

- [Supabase RLS docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [SECURITY.md](../../SECURITY.md) — pointer-list mapping every defense to its file
- [`supabase/migrations/20260505000000_security_hardening.sql`](../../supabase/migrations/20260505000000_security_hardening.sql) — first hardening pass
- [`supabase/migrations/20260507000000_audit_2026_05_07_fixes.sql`](../../supabase/migrations/20260507000000_audit_2026_05_07_fixes.sql) — column-aware guard trigger
