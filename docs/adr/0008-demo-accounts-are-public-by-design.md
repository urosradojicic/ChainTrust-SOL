# ADR-0008 — Demo accounts are public by design

- **Status**: Accepted
- **Date**: 2026-05
- **Deciders**: ChainTrust core team

## Context

The app ships three demo accounts (`admin@chainmetrics.io`, `investor@chainmetrics.io`, `startup@chainmetrics.io` — all with simple passwords) that work in production. They're documented in `README.md` and `judges/`. A judge or reviewer can sign in with one click and explore every page without a sign-up flow.

This raises a security question: isn't this a free admin account?

The May 2026 audit (finding I1) flagged this — anyone who knows the email can write the matching role to `localStorage` and "become" admin client-side.

## Decision

**Keep the demo accounts public. Document the residual risk explicitly.**

The reasoning:

1. **The blast radius is read-only.** Demo session restoration produces user IDs of the form `demo-admin`, `demo-investor`, `demo-startup` — non-UUID. Every Supabase RLS policy uses `auth.uid() = user_id` predicates, which can't be satisfied by a non-UUID. **Server-side, every write is rejected.** The most a "promoted" demo user can do is read pages that already render mock data.
2. **The judges' need for one-click access is real and high-value.** Forcing a sign-up flow for a hackathon evaluator is a UX sin. The whole point of `/judges/` is "you have 3 minutes; we removed every barrier."
3. **Defense in depth at the boundary.** [`src/contexts/AuthContext.tsx`](../../src/contexts/AuthContext.tsx) re-derives the role from a server-side `DEMO_ACCOUNTS` allowlist on every restore. We never trust `parsed.role` from `localStorage`. If a future refactor reads `parsed.role` directly, regression tests will break.
4. **Sessions expire after 24 hours.** The TTL is enforced in the restore path, not by Supabase.

## Consequences

### Positive

- **Judges can evaluate the product in 30 seconds** — no sign-up, no account creation, no password recovery flow to test
- **The same flow works in dev, preview, and production** — no environment-specific code that could drift
- **Documented residual risk** — the "intentional design" framing in [`SECURITY.md`](../../SECURITY.md) and [judges/04-security-summary.md](../../judges/04-security-summary.md) means a security reviewer knows we considered it

### Negative

- **A motivated attacker can spoof the admin role client-side.** Mitigated by the read-only blast radius (RLS rejects writes).
- **Pages that "look" admin-only render mock data when accessed by a spoofed admin** — which is sometimes counterintuitive ("how come this admin can see everything but can't change anything?"). Acceptable; the audit finding I1 documents this explicitly.

### Neutral

- This decision is reversible. If we ever ship to a customer (vs. judges and investors), demo accounts move behind `import.meta.env.DEV` and a different ADR supersedes this one.

## Alternatives considered

- **Gate demo accounts behind `import.meta.env.DEV`** — only available locally. Rejected for the hackathon era — the `judges/` flow needs them in production.
- **Require email/password signup with auto-confirmation** — adds 30+ seconds to the judge's path before they see the product. Rejected.
- **Magic link authentication for evaluators** — out of scope for a hackathon submission. Maybe post-Frontier.

## References

- [`src/contexts/AuthContext.tsx`](../../src/contexts/AuthContext.tsx) — demo session restore + DEMO_ACCOUNTS allowlist
- [SECURITY.md](../../SECURITY.md) — finding I1
- [`judges/README.md`](../../judges/README.md) — public credentials
- [`docs/internal/security-audit/REPORT.md`](../internal/security-audit/REPORT.md) — finding I1 detail
