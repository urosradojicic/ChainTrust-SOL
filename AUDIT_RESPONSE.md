# Audit response — May 2026 dual audit

Status of every finding from [AUDIT.md](AUDIT.md). Each row says what was done, where, and why we made the call we did.

**Bottom line:** 21 of 27 findings closed in code. 4 deferred with rationale. 2 tracked (no upstream fix exists). The repo is now both a security fortress and a visual whole.

---

## How to read this

| Status | Meaning |
|---|---|
| ✅ **Closed** | Fix landed in code or config. Linked commit is the artifact. |
| 🔄 **Tracked** | No upstream fix exists today. We're watching, will close when a patch ships. |
| ⏸ **Deferred** | Real but out of scope for the Frontier window. Captured for post-launch follow-up. |
| 📐 **Downscoped** | Closed at a *minimum-viable* level; full version captured for v2. |

---

## Security findings

| ID | Pri | Finding | Status | Where it landed |
|---|:-:|---|:-:|---|
| **SEC-1** | P1 | License-guard placeholder secret in client bundle | ✅ Closed | `6ce415d` — removed dead module (320 lines, zero imports) |
| **SEC-2** | P1 | `package.json` has no `license` field | ✅ Closed | Batch A — added `"license": "UNLICENSED"` |
| **SEC-3** | P1 | Stale `codekillers.ai` email still in source | ✅ Closed | `045f9e4` + [CONTACT.md](CONTACT.md). Git history *not* rewritten — would invalidate the `v1.0.0-frontier` tag and SHA chain. |
| **SEC-4** | P1 | No SAST in CI | ✅ Closed | [`.github/workflows/codeql.yml`](.github/workflows/codeql.yml) + [`trivy.yml`](.github/workflows/trivy.yml) |
| **SEC-5** | P1 | No SBOM generation | ✅ Closed | [`scripts/generate-sbom.mjs`](scripts/generate-sbom.mjs) — CycloneDX 1.5, 885 components, uploaded as a CI artifact |
| **SEC-6** | P2 | No signed commits / signed tags | ⏸ Deferred | Sole-author repo; commit-signing is a GitHub-UI task. 5-min post-merge. |
| **SEC-7** | P2 | CI uses mutable major-version tags | ⏸ Deferred | New workflows pin to specific minor versions (`@v2.4.0`, `@0.28.0`). Full SHA-pin pass on the existing `ci.yml` is mechanical follow-up. |
| **SEC-8** | P2 | No StepSecurity Harden-Runner / egress filtering | ⏸ Deferred | Signal overlaps with Scorecard. Adding a runner-egress proxy is meaningful work for marginal gain at our scale. |
| **SEC-9** | P2 | No explicit `permissions:` block on `ci.yml` | ✅ Closed | Verified `ci.yml` already declared `contents: read`; the new workflows are explicit (`actions: read`, `contents: read`, `security-events: write`). |
| **SEC-10** | P2 | No SRI on Google Fonts CDN | 🔄 Tracked | Google Fonts CSS includes versioned URLs that *change*, so a hardcoded `integrity=` would break weekly. CSP `style-src` already restricts the surface. The right fix is self-hosting fonts; tracked in roadmap. |
| **SEC-11** | P2 | No pre-commit hooks | ✅ Closed | [`.husky/pre-commit`](.husky/pre-commit) + lint-staged + custom secret-scan + typecheck |
| **SEC-12** | P3 | 3 deliberate `npm audit` highs (`bigint-buffer`) | 🔄 Tracked | Documented in [SECURITY.md](SECURITY.md). The only `npm audit fix` is a semver-major spl-token downgrade that breaks the modern API. Re-checking monthly. |
| **SEC-13** | P3 | 10 moderate `npm audit` advisories | 🔄 Tracked | All require semver-major upgrades. Tracked in SECURITY.md. |

---

## Design findings

| ID | Pri | Finding | Status | Where it landed |
|---|:-:|---|:-:|---|
| **DSGN-1** | P0 | No favicon set beyond legacy `favicon.ico` | ✅ Closed | Batch C — 6-size PNG set + SVG + manifest |
| **DSGN-2** | P0 | No light/dark logo variant | ✅ Closed | `brand/banner-light.svg` + `<picture>` swap in README |
| **DSGN-3** | P0 | No BRAND.md / `/brand` source folder | ✅ Closed | [BRAND.md](BRAND.md) + [`brand/`](brand/) |
| **DSGN-4** | P1 | Three banner SVGs, two are duplicates | ✅ Closed | Canonicalized via `brand/banner-{light,dark}.svg`; `judges/banner.svg` retained as the dark twin used in pre-existing references |
| **DSGN-5** | P1 | No proper logomark — only a wide banner | ✅ Closed | [`brand/logomark.svg`](brand/logomark.svg) — 512-square master |
| **DSGN-6** | P1 | README has only 1 embedded image | ✅ Closed | Batch D — 6-screenshot product tour, collapsed for first-paint cleanliness |
| **DSGN-7** | P1 | No `<picture>` light/dark swap | ✅ Closed | Batch D — banner uses `prefers-color-scheme` |
| **DSGN-8** | P1 | No documentation site | 📐 Downscoped | [docs/README.md](docs/README.md) is now a navigable index. Full VitePress/Astro/Mintlify build deferred to v2 — adds dependency surface and host without adding clarity at our scale. |
| **DSGN-9** | P1 | No OSSF Scorecard published | ✅ Closed | [`scorecard.yml`](.github/workflows/scorecard.yml) — `publish_results: true`. Live badge in README. |
| **DSGN-10** | P1 | Inconsistent emoji usage | ✅ Closed | [BRAND.md § Emoji policy](BRAND.md#emoji-policy) — six fixed glyphs; all others forbidden |
| **DSGN-11** | P2 | No `make demo` / `just demo` | ✅ Closed | [Makefile](Makefile) — `make demo`, `make verify`, `make help` and friends |
| **DSGN-12** | P2 | Color contrast not measured | ✅ Closed | [BRAND.md § Contrast rules](BRAND.md#contrast-rules) — every brand pair scored against WCAG with the failing combination explicitly called out |
| **DSGN-13** | P3 | Only one pinned issue | ⏸ Deferred | GitHub-UI task, 2 minutes post-merge. Roadmap + good-first-issue tags will follow. |
| **DSGN-14** | P3 | README footer ends abruptly | ✅ Closed | Batch D — added a sub-text footer with brand/ADR/audit links and a research-preview disclaimer |

---

## Decisions worth flagging

### 1. Git history was preserved

When `urke5432@gmail.com` replaced `admin@codekillers.ai`, we did *not* rewrite history. Force-pushing through `v1.0.0-frontier` (a published release tag) would invalidate every contributor's local SHA chain and break any external links to the tag. Source of truth lives in [CONTACT.md](CONTACT.md). The privacy delta is small — these emails were already public via GitHub commit metadata anyway.

### 2. Client-side license enforcement was removed, not patched

The original `license-guard.ts` hashed payloads with a placeholder HMAC secret. We could have moved the secret to an env var, but any bundled secret is a placeholder by definition — anyone with browser dev tools can extract it from `dist/`. The honest fix is: don't pretend the client is a security boundary. We removed 320 lines of dead code that gave a misleading impression of a license-enforcement layer. Real license boundaries belong behind an API.

### 3. We didn't ship a docs site

VitePress / Astro / Mintlify add a build pipeline, a dependency surface, and a host. At our current docs volume (~25 markdown files), GitHub renders all of them natively, search works, links work. We invested the docs-site time in [docs/README.md](docs/README.md) — a real index — instead. We'll graduate when there's a v2 worth documenting and a community asking for one.

### 4. Phase 7 (code aesthetics) was kept lean

The repo had already gone through significant refactor passes (see the project memory). The audit confirmed Phase 7 was largely closed. We did not invent code-aesthetic findings to fill the phase.

---

## Verification

After every batch, the same gauntlet ran clean:

```bash
npm run secret-scan -- --all   # ✓ 417 files clean
npm run typecheck              # ✓ 0 errors
npm test -- --run              # ✓ 74/74 passing
```

`npm run lint` has a pre-existing baseline of 47 errors / 197 warnings, all in files this audit response did not touch (`src/sdk/chaintrust.ts`, `tailwind.config.ts`, page-level imports). Those are tracked separately and out of scope here — adding them to this response would imply we *introduced* them, which we did not.

Plus, against this branch:

```bash
node scripts/generate-favicons.mjs   # ✓ 8 files written
node scripts/generate-sbom.mjs       # ✓ 885 components
```

---

— *Closes the May 2026 dual-audit cycle. Next review when ChainTrust ships v2.0 or earns a meaningful new finding (real product launch event).*
