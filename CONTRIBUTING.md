# Contributing to ChainTrust

Short version. Read [ARCHITECTURE.md](ARCHITECTURE.md) for layout, [SECURITY.md](SECURITY.md) for what we defend against, then come back here.

## Local setup

```bash
git clone https://github.com/urosradojicic/ChainTrust-SOL.git
cd ChainTrust-SOL
npm install --legacy-peer-deps      # required because Solana wallet-adapter peer ranges
cp .env.example .env.local           # then edit
npm run dev                          # localhost:8080
```

## The three loops

Run all three before pushing. Same loops CI runs.

```bash
npm run typecheck      # tsc --noEmit -p tsconfig.app.json — must be clean
npm test -- --run      # vitest, currently 74/74 passing
npm run lint           # ESLint — known-issue burn-down in progress (deferred)
npm run build          # vite build — must succeed
```

If a test breaks because of a rename, update the test. If a test breaks because behavior changed, you went too far.

## Branch policy

- `master` is the Frontier-ready snapshot — what reviewers and investors clone. **Do not push directly.**
- `merged-ai-roadmap-v2` is the dev branch. Branch your feature off here.
- `backup` is a frozen restore point. **Never** push, force-push, or merge into it.

Branch naming:

| Prefix | Use for |
|---|---|
| `feature/<short-name>` | new product surfaces |
| `fix/<short-name>` | bug fixes |
| `chore/<short-name>` | tooling, lockfile, docs-only |
| `refactor/<short-name>` | move-only / rename-only changes |
| `security/<date>` | output of a security audit pass |

## Commit style

[Conventional Commits](https://www.conventionalcommits.org/) — every commit message starts with one of:

- `feat(scope): ...`
- `fix(scope): ...`
- `refactor(scope): ...`
- `perf(scope): ...`
- `chore(scope): ...`
- `docs(scope): ...`
- `security(scope): ...`
- `test(scope): ...`

Body explains the **why**, not the **what**. The diff says what.

NEVER put exploit details, secret values, or PoC payloads in commit messages. Those stay in the security audit report only.

## PR checklist

Before opening a PR, verify:

- [ ] `npm run typecheck` is clean
- [ ] `npm test -- --run` shows 74/74 (or higher if you added tests)
- [ ] `npm run build` produces a clean dist/
- [ ] Every commit message follows Conventional Commits
- [ ] Touched a security-critical file? Re-read its section in [SECURITY.md](SECURITY.md) and confirm the security invariant is preserved
- [ ] Diff is reviewable: < ~300 lines per logical commit, splits when bigger
- [ ] No new dependencies added without a comment justifying them in the PR body

GitHub Actions CI runs on every push and on every PR. Master and `merged-ai-roadmap-v2` only accept fast-forwards from green CI runs.

## What NOT to do

- **Never** force-push to a shared branch.
- **Never** push to `master` or `backup` directly.
- **Never** add `--no-verify` to bypass commit hooks.
- **Never** weaken a security defense to make a test pass — fix the test.
- **Never** commit `.env`, `.env.local`, or any file containing real credentials. The Supabase publishable JWT in `.env.example` is intentional (anon key, public-by-design).

## File organisation

- New module → pick the right `src/lib/<subgroup>/` directory (security/, solana/, format/, mock/, intelligence/). See [ARCHITECTURE.md](ARCHITECTURE.md) for the rules.
- New page → `src/pages/<Page>.tsx`, register the route in `src/App.tsx`, add a `RoleGuard` wrapper if the page is role-gated.
- New hook → `src/hooks/use-<concern>.ts`. One concern per file (the existing `use-blockchain.ts` is a known exception, deferred).
- New test → `src/test/<source>.test.ts`. Centralized, not colocated.

## When in doubt

- Read [ARCHITECTURE.md](ARCHITECTURE.md) for layer rules.
- Read the closest existing file in the same domain — when there's an established pattern, follow it.
- For security-relevant changes, read [SECURITY.md](SECURITY.md) first.
- For demo / hackathon polish, read the curated [`judges/`](judges/) folder.
- For a high-confidence place to ask, open a draft PR and request review.
