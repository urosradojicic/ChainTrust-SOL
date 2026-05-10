# Architecture Decision Records (ADRs)

> "Architecture decisions are the kind of thing where, three years from now, a new engineer asks 'why did we do it this way?' and the answer is either 'because it was decided in ADR-0007' or 'I have no idea.' We aim for the former." — *the team*

This folder records consequential, hard-to-reverse decisions about ChainTrust's architecture. Every ADR follows the [MADR](https://adr.github.io/madr/) format:

1. **Status** — proposed / accepted / superseded by ADR-XXXX
2. **Context** — what forced the decision
3. **Decision** — what we chose
4. **Consequences** — positive, negative, neutral; the trade-offs we accepted
5. **Alternatives considered** — what we *didn't* pick and why

ADRs are **append-only**. Once accepted, an ADR is never edited — if a later decision overrides it, write a new ADR with `Status: supersedes ADR-XXXX` and link both directions.

## Index

| # | Title | Status | Date |
|---|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | 2026-04 |
| [0002](0002-build-on-solana.md) | Build on Solana over EVM / Aptos / Sui | Accepted | 2026-04 |
| [0003](0003-supabase-rls-as-authorization-source-of-truth.md) | Supabase RLS as the authorization source of truth | Accepted | 2026-04 |
| [0004](0004-bigint-fixed-point-token-math.md) | BigInt fixed-point for token amounts | Accepted | 2026-05 |
| [0005](0005-deny-by-default-route-gating.md) | Deny-by-default route gating with double-gate (RoleGuard + RLS) | Accepted | 2026-04 |
| [0006](0006-ban-wallet-adapter-wallets-meta.md) | Ban the `@solana/wallet-adapter-wallets` meta-package | Accepted | 2026-05 |
| [0007](0007-master-fast-forward-only.md) | `master` is fast-forward only | Accepted | 2026-05 |
| [0008](0008-demo-accounts-are-public-by-design.md) | Demo accounts are public by design | Accepted | 2026-05 |

## When to write an ADR

Write one when a decision will be **expensive to reverse** and **non-obvious to a future reader**. Examples that qualify:

- Choosing a chain, framework, or third-party service
- Picking an authorization model
- Banning a dependency or pattern
- Establishing a branch / release policy

Examples that don't:

- Renaming a variable
- Picking a colour for a button
- Adding a single new test

## When to supersede an ADR

If a new decision genuinely replaces an old one (not just refines it):

1. Copy the template, increment the number
2. Set `Status: Supersedes ADR-NNNN` and explain why
3. In the old ADR, append `Status: Superseded by ADR-NNNN`
4. Update the index above

Don't edit the historical content of the old ADR. The point is the trail.
