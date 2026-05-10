# ADR-0005 — Deny-by-default route gating with a double-gate (RoleGuard + RLS)

- **Status**: Accepted
- **Date**: 2026-04
- **Deciders**: ChainTrust core team

## Context

Routes have role requirements. `/governance` is investor + admin. `/my-startup` is startup + admin. `/security` is admin only. Etc.

Two failure modes we want to design out:

1. **Forgetting to gate a new route** — a developer adds `<Route path="/admin/secret" .../>` and forgets to wrap it with permission logic. We want this to *fail closed* by default, not open.
2. **Trusting the client gate as authorization** — RoleGuard hides a route, but the underlying data is still RLS-permitted, so the user can still hit the API directly. We want it explicit: RoleGuard is UX, RLS is authorization.

## Decision

**Two layers, both deny-by-default.**

### Layer 1: client-side `RoleGuard` (UX)

Defined in [`src/components/RoleGuard.tsx`](../../src/components/RoleGuard.tsx) and [`src/lib/format/role-access.ts`](../../src/lib/format/role-access.ts).

- A route's permission is keyed on its path. The default for any unknown path is **deny**, not allow.
- `canAccess(role, path)` is a pure function over a permission table. New routes that don't appear in the table redirect to `/login`.
- Unit-tested in [`src/test/role-access.test.ts`](../../src/test/role-access.test.ts) — 16 cases covering the four roles, public/auth/role-gated paths, and dynamic-route normalization.

### Layer 2: Supabase RLS (authorization)

The actual data gate. Every table has RLS enabled. See [ADR-0003](0003-supabase-rls-as-authorization-source-of-truth.md) for the rationale.

Layer 1 hides UI. Layer 2 protects data. If they disagree (Layer 1 says deny but Layer 2 says allow, or vice versa), Layer 2 wins — but the disagreement itself signals a bug to fix.

## Consequences

### Positive

- **Forgetting to gate a route fails closed**. No silent privilege escalation through "I forgot the wrapper."
- **Tested**. The role-access table can't drift without breaking tests.
- **Clear separation**: anyone reading the codebase can see "client = UX, server = authz" and not confuse the two.

### Negative

- **Two places to update** when a new route's permission changes — the table in `role-access.ts` *and* the RLS policy on whatever table that route reads. We accept this; the alternative is one place that's the wrong layer.
- **A new route requires a deliberate decision**: who can see it? Adding the entry is a small extra step.

### Neutral

- The guard doesn't prevent network calls — that's RLS's job. New contributors should not interpret "RoleGuard hides the page" as "the API is gated."

## Alternatives considered

- **Allow-by-default with explicit deny lists.** Rejected — the failure mode is silent privilege escalation, exactly what we're avoiding.
- **Skip RoleGuard, rely on RLS alone.** Rejected — non-permitted users would see broken pages with empty tables and 403 errors instead of a clean redirect to `/login`. Bad UX.
- **Run a server middleware.** Not applicable — no Node backend ([ADR-0003](0003-supabase-rls-as-authorization-source-of-truth.md)).

## References

- [`src/components/RoleGuard.tsx`](../../src/components/RoleGuard.tsx)
- [`src/lib/format/role-access.ts`](../../src/lib/format/role-access.ts)
- [`src/test/role-access.test.ts`](../../src/test/role-access.test.ts)
- [ADR-0003](0003-supabase-rls-as-authorization-source-of-truth.md) — why RLS owns authorization
