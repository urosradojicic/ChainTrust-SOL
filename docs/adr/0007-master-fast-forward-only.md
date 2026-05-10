# ADR-0007 — `master` is fast-forward only

- **Status**: Accepted
- **Date**: 2026-05
- **Deciders**: ChainTrust core team

## Context

Most projects let `master` accept merge commits. `git log master` then has "Merge branch 'feature/x'" bubbles every few commits. This is fine for very small teams that all read every commit, but for an investor- and reviewer-facing repository it has two problems:

1. **`git log` becomes hard to skim.** A reviewer reading our commit history wants a clean changelog: `feat:`, `fix:`, `security:`, `chore:`. Merge bubbles add noise.
2. **`git blame` becomes harder to follow** — the merge commit shows up between the actual change and the file's history, breaking the chain.

We have a small team and a clean conventional-commit discipline. We don't need merge commits to "preserve branch context" — the commit messages already do that.

## Decision

**`master` is fast-forward only.** No merge commits. No squash commits. No force pushes.

- Feature branches branch off `merged-ai-roadmap-v2` (the dev branch).
- Stable batches fast-forward into `master`.
- If a feature branch can't fast-forward, rebase it. Don't merge.
- `merged-ai-roadmap-v2` itself can have merge commits if needed (it's the dev branch); `master` cannot.
- The `backup` branch is read-only, never advances. Restore-only.

This is enforced via:

- A documented rule in [`CONTRIBUTING.md`](../../CONTRIBUTING.md)
- Hooks (planned, deferred) that block non-FF pushes to master
- Reviewer discipline at PR merge time

## Consequences

### Positive

- **`git log master` reads like a changelog**. Commit messages are the story.
- **`git blame` chains work** — every line traces directly to the commit that introduced it.
- **Bisect works cleanly** — no merge commits to skip over.
- **Fast-forward signals stable**: a feature can't reach `master` without explicitly being rebased; the rebase forces "is this still wanted on master right now?"

### Negative

- **Rebasing is required** when `master` advances during a long-running feature branch. Conventional commits + small commits make this manageable.
- **No "merged from PR #N" commit** to refer back to. We compensate with conventional-commit prefixes that name the scope.
- **PR auto-merge with merge commits is forbidden.** Use rebase-and-merge or squash-and-rebase.

### Neutral

- This is a discipline policy, not a hard guarantee enforced by GitHub branch protection — that's a TODO. The reviewer is the gate today.

## Alternatives considered

- **Merge commits with "Merge pull request #N from feature/x"**. Standard GitHub default. Rejected for the reasons above.
- **Squash-and-merge**. Considered — produces a single commit on master with the PR's contents collapsed. Loses the per-step history, which we like; rejected.
- **Rebase-and-merge with auto-merge on**. This is essentially what we do, just with the discipline made explicit.

## References

- [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — branch policy
- [Memory: CI Determinism](../internal/cleanup/REPORT.md) — note on lockfile + ff-only flow
- May 2026 fast-forwards: master `4193e89 → f1a7dca → 5337e56 → 0ad312b → 5a2a2b0`
