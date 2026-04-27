# Pull Request

## Summary
<!-- One sentence describing what changes and why. -->

## Type
<!-- Check one. Conventional commit prefix should match (feat:, fix:, etc). -->
- [ ] `feat:` New feature
- [ ] `fix:` Bug fix
- [ ] `refactor:` Code change with no behavioral effect
- [ ] `perf:` Performance improvement
- [ ] `a11y:` Accessibility improvement
- [ ] `security:` Security fix or hardening
- [ ] `docs:` Documentation only
- [ ] `chore:` Tooling, deps, CI

## Behavioral changes
<!-- If this changes user-visible behavior, describe what changes and why
     it's necessary. Otherwise: "None — behavior preserved." -->

## Test plan
<!-- How to verify this works. Steps a reviewer can run locally. -->
- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Manual smoke test of affected page(s):

## Screenshots / videos
<!-- Required for any UI change. Before / after side-by-side preferred. -->

## Checklist
- [ ] Code follows existing patterns (no surprise refactors mid-feature)
- [ ] No new dependencies (or justified in summary)
- [ ] No secrets, API keys, or PII committed
- [ ] No `console.log` / `debugger` left behind (gated by `import.meta.env.DEV` if needed)
- [ ] WCAG-affecting changes use semantic HTML and proper ARIA where needed
- [ ] If adding async surfaces: loading + empty + error states present
- [ ] Backup branch (`backup`) is **not** modified

## Deferred / follow-ups
<!-- Anything that came up but isn't in this PR. -->

## Related issues
<!-- Closes #N, refs #N, etc. -->
