# ADR-0001 — Record architecture decisions

- **Status**: Accepted
- **Date**: 2026-04
- **Deciders**: ChainTrust core team

## Context

Decisions made early in a codebase are the ones future contributors most need to understand and most often question. Without a written record, the answer to "why did we do X?" decays into folklore — or worse, gets re-litigated every six months by someone who doesn't have the context that made X right.

ChainTrust touches three domains where the decisions are particularly consequential and easy to misread later: Solana program design, off-chain authorization (RLS), and frontend security posture. We need a way for a new contributor to learn *why* a thing is the way it is without interrogating the team.

## Decision

We adopt [MADR](https://adr.github.io/madr/) (Markdown Architectural Decision Records) as the format for capturing significant architectural decisions.

ADRs live in `/docs/adr/`. Each ADR is:

- **Numbered** sequentially (`0001`, `0002`, ...). The number never changes.
- **Append-only**. Once an ADR is `Accepted`, its content does not change. New decisions that override old ones are written as new ADRs with `Status: Supersedes ADR-NNNN`.
- **Indexed** in [`docs/adr/README.md`](README.md).

Format per record:

1. **Title** — short, declarative
2. **Status** — Proposed / Accepted / Deprecated / Superseded by ADR-NNNN
3. **Date** — month + year of the decision
4. **Context** — the forces, constraints, and pain
5. **Decision** — what we chose
6. **Consequences** — positive, negative, and neutral effects
7. **Alternatives considered** — what we didn't pick and the specific reason

## Consequences

### Positive

- A new engineer can read the ADR index and learn the **why** of the architecture in 30 minutes
- Decisions are traceable to a date and a context; reverting a decision requires writing a new ADR, which forces deliberate thinking
- Code review can reference ADRs ("this would violate ADR-0005") instead of relying on memory

### Negative

- A small writing tax on each significant decision (~10 minutes per ADR)
- Some discipline required to actually write the ADR rather than just merging the change

### Neutral

- ADRs do not document everything. Per-file design choices, naming conventions, and minor tradeoffs live in code comments or `ARCHITECTURE.md`. ADRs are reserved for decisions that meaningfully shape what the codebase *can become*.

## Alternatives considered

- **No ADRs, write things in commit messages instead.** Rejected — commit messages are not discoverable, and the "why" gets lost in `git log` once there are 1000+ commits.
- **A wiki.** Rejected — wikis drift from the code; ADRs live with the code and version with it.
- **A long `ARCHITECTURE.md`.** Kept for layer-rules and request-lifecycle reference; not a substitute for individually-numbered, dated decision records.
