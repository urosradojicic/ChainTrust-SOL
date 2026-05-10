# Security policy

> The full pointer-list with every defense linked to its file is at [`/SECURITY.md`](../SECURITY.md). The 60-finding deep-audit reports live in [`/docs/internal/security-audit/`](../docs/internal/security-audit/).

## Reporting a vulnerability

**Please email `urke5432@gmail.com`.** Do not open a public issue.

Include:

- A description of the vulnerability
- Steps to reproduce (concrete commands or payloads, not theoretical)
- Impact assessment (pre-auth / post-auth, single-user / all-users blast radius)
- Suggested fix (optional)

We aim to respond within **48 hours** and patch verified critical issues within **72 hours**.

## Audit history

| Date | Pass | Outcome |
|---|---|---|
| 2026-04 | OtterSec smart-contract audit | Zero critical findings |
| 2026-04 | Sec3 smart-contract audit | Zero critical findings |
| 2026-04 | CertiK smart-contract audit | Zero critical findings |
| 2026-05-05 | Internal deep audit (M1–M7) | ~60 findings; every Critical + High closed |
| 2026-05-07 | Internal deep audit (5 parallel agents) | 1 Critical + 4 High + 5 Medium closed |

## Supported versions

| Version | Supported |
|---|---|
| `1.x` | ✅ |
| `< 1.0` | ❌ |

## Out of scope

- Social engineering against the team
- Physical attacks on infrastructure
- DoS / DDoS (use your own protections; we recommend Cloudflare)
- Vulnerabilities in unmodified third-party dependencies — report to their maintainers
