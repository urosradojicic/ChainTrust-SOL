# ChainTrust documentation

Index of every doc in this folder. The ones at the top are the *load-bearing* ones for engineers; the [`internal/`](internal/) tree is process and history.

## Start here

| Doc | What it covers |
|---|---|
| [OVERVIEW.md](OVERVIEW.md) | One-page system overview — read this first |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Layer rules, import boundaries, data flow |
| [SMART-CONTRACT.md](SMART-CONTRACT.md) | Anchor program (24 instructions) |
| [DATABASE.md](DATABASE.md) | Postgres schema + RLS layout |
| [API-REFERENCE.md](API-REFERENCE.md) | Internal hooks + SDK surface |

## Operations

| Doc | What it covers |
|---|---|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Vercel + Supabase deploy procedure |
| [deploy.md](deploy.md) | Solana program deploy notes |
| [LIVE_TESTNET_DEMO.md](LIVE_TESTNET_DEMO.md) | What `/testnet-demo` does + how |

## Decisions

| Doc | What it covers |
|---|---|
| [adr/](adr/) | Architecture Decision Records (MADR format) — the *why* behind big calls |
| [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md) | Implementation-side design notes (BRAND.md is the source of truth) |
| [IMPROVEMENTS_APR2026.md](IMPROVEMENTS_APR2026.md) | Design-overhaul changelog from April 2026 |
| [ROADMAP_V2.md](ROADMAP_V2.md) | Forward-looking initiatives |

## Context — for reviewers and historians

| Doc | What it covers |
|---|---|
| [internal/dev-log.md](internal/dev-log.md) | Dated narrative of what got built when |
| [internal/security-audit/](internal/security-audit/) | The 2026-05 internal deep-pass reports |
| [internal/upgrade-audit.md](internal/upgrade-audit.md) | Major dependency upgrade history |
| [internal/cleanup/](internal/cleanup/) | Refactor planning + post-mortems |
| [internal/planning/](internal/planning/) | Earlier architecture explorations |
| [internal/legacy-security-audit-apr.md](internal/legacy-security-audit-apr.md) | Pre-rewrite audit (preserved for traceability) |

## Beyond this folder

- [BRAND.md](../BRAND.md) — design system source of truth (colors, type, voice)
- [SECURITY.md](../SECURITY.md) — threat model, defenses, vuln-disclosure procedure
- [AUDIT.md](../AUDIT.md) — May 2026 dual-audit findings (security + design)
- [AUDIT_RESPONSE.md](../AUDIT_RESPONSE.md) — disposition for every audit finding
- [CONTRIBUTING.md](../CONTRIBUTING.md) — branch policy, commit format, test loop
- [judges/](../judges/) — curated content for hackathon reviewers

---

> Why no docs site? VitePress / Astro / Mintlify add a build step, dependency surface, and host before adding clarity. GitHub renders these files natively, search works, links work. We'll graduate to a proper site when there's a v2 to document and a community asking for one. Until then, `docs/` *is* the docs site.
