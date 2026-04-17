# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ChainTrust, please **do not open a public issue**.
Email details to **security@codekillers.ai** with:

- A description of the vulnerability
- Steps to reproduce
- Impact assessment
- Any suggested fixes (optional)

We aim to respond within 48 hours.

## Supported Versions

Only the latest release receives security updates. Older versions are provided as-is.

| Version | Supported |
| ------- | --------- |
| 1.x     | Yes       |
| < 1.0   | No        |

## Security Controls

The ChainTrust codebase implements the following controls:

### Frontend
- **CSP** (Content Security Policy) restricting script sources and connection targets
- **X-Frame-Options: DENY** and CSP `frame-ancestors 'none'` to prevent clickjacking
- **X-Content-Type-Options: nosniff** to block MIME sniffing
- **Permissions-Policy** locking down sensitive browser APIs (camera, mic, geolocation, etc.)
- **Input sanitization** (`src/lib/sanitize.ts`): HTML escaping, URL validation, numeric bounds
- **Rate limiting** on all state-changing forms (registration, governance, metrics)
- **Role-based access control** with deny-by-default for unknown routes
- **Error boundaries** around every heavy component
- **No `eval()`, no `unsafe-eval` in CSP**, no `dangerouslySetInnerHTML` on user content
- **Wallet `autoConnect` disabled** — no silent re-connection on shared machines
- **Demo sessions expire after 24 hours** automatically

### Backend (Solana program)
- **Quorum enforcement** on proposal execution
- **Arithmetic checked_add/checked_sub/checked_mul** everywhere numbers can grow
- **Signer + owner constraints** on every token operation
- **Soulbound badges** cannot be transferred (immutable `is_locked`)
- **Input validation** on strings (length 1-N) and growth rates (±100% bounds)

### Supabase
- **Row-Level Security (RLS)** required on all tables (enforced server-side)
- Client code filters by `user_id` but never trusts client-supplied role
- Role fetched via RPC `get_user_role`, not read from localStorage

## Test Credentials

The app ships with demo credentials for local/dev use:

- `admin@chainmetrics.io` / `admin123`
- `investor@chainmetrics.io` / `investor1`
- `startup@chainmetrics.io` / `startup1`

These are **intentional** and documented — they are sandbox accounts for demos and
do not grant access to production data. Sessions created with these credentials
expire after 24 hours.

## Dependencies

We run `npm audit` periodically. Critical CVEs are patched within 72 hours.

## Out of Scope

- Social engineering attacks on ChainTrust employees
- Physical attacks on infrastructure
- DoS/DDoS attacks (use your own protections — we recommend Cloudflare)
- Attacks on third-party dependencies (report to their maintainers)
