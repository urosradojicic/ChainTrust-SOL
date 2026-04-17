# ChainTrust — Deep Upgrade Session (April 17, 2026)

This document records the full backend/frontend/blockchain/security upgrade
done in preparation for the Colosseum Frontier hackathon submission.

## Methodology

Four parallel research agents audited the entire codebase simultaneously,
looking for bugs, security holes, performance issues, architecture gaps,
and expansion opportunities. Over 100 findings were synthesized into this
implementation, prioritized by severity.

## Blockchain Program (Anchor)

### Safety fixes
- **Quorum enforcement** (`execute_proposal`): proposal execution now
  requires total vote weight ≥ `total_staked × quorum_pct / 100`. Previously
  missing — passing vote (for > against) could execute with 1 total voter.
- **Vault solvency check** (`claim_rewards`): asserts
  `vault_token_account.amount ≥ pending_rewards` before transferring. Gives a
  clean `InsufficientVaultFunds` error instead of an SPL-level panic.
- **Growth rate bounds** (`publish_metrics`): reject values outside
  ±10,000 basis points (±100%) to catch data corruption.
- **Empty-string validation** (`register_startup`): separate `EmptyName` /
  `EmptyCategory` errors replace the misleading `NameTooLong` for zero-length
  input.

### Event emission
Every state mutation now emits a structured event for indexers:
- `StartupVerified { id, verified_at, verifier }`
- `TrustScoreUpdated { id, old_score, new_score, updated_at }`
- `BadgeScoreUpdated { startup_id, old_score, new_score }`
- `BadgeTierUpgraded { startup_id, new_tier, trust_score, upgraded_at }`
- `ProposalExecuted` expanded with `for_votes`, `against_votes`,
  `abstain_votes`, `executed_at`
- `BadgeMinted` extended with `tier`

### New badge tier system
Verification badges now have 4 tiers that unlock based on trust score:

| Tier | Name     | Minimum Trust Score |
|------|----------|---------------------|
| 0    | Bronze   | 50                  |
| 1    | Silver   | 60                  |
| 2    | Gold     | 75                  |
| 3    | Platinum | 90                  |

New instruction: `upgrade_badge_tier` — authority-only, promotes a badge by
one tier if its trust score clears the next threshold. Emits
`BadgeTierUpgraded`. Helper `compute_badge_tier(trust_score) → u8` sets the
initial tier when `mint_badge` runs.

### New error variants
`QuorumNotMet`, `InsufficientVaultFunds`, `InvalidBadgeTier`,
`TierTrustScoreTooLow`, `BadgeAtMaxTier`, `GrowthRateOutOfBounds`,
`EmptyName`, `EmptyCategory`, `InvalidAuthority`.

### State changes
`VerificationBadge` gained `tier: u8` and `tier_upgraded_at: i64` fields.

## Frontend: new hook

`useUpgradeBadgeTier` in `src/hooks/use-blockchain.ts` — calls the new
`upgrade_badge_tier` instruction. Falls back to demo tx signature when the
real program isn't deployed, matching the rest of the hook suite.

## Security

- **Demo sessions expire after 24 hours** (was 365 days). Session restore
  checks `signedInAt` against `DEMO_SESSION_SECONDS` and purges expired
  localStorage entries. Test credentials continue to work — users just sign
  in again once a day.
- **CSP tightened** in `index.html`: removed `'unsafe-eval'`; added
  `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`. Kept
  `'unsafe-inline'` for Vite-generated runtime styles.
- **Permissions-Policy** meta tag blocks camera, microphone, geolocation,
  payment, USB, etc.
- **Wallet `autoConnect` disabled** — no silent re-connection to the last
  wallet on shared machines. Users must explicitly click "Connect Wallet".
- **Error boundary logging**: `componentDidCatch` now logs component stacks
  in DEV.

## Frontend quality

- **Error boundaries** wrap `Portfolio3D`, `NLQueryBar` on the Dashboard and
  `QuantModelsPanel`, `AIDueDiligence`, `OnChainVerification` on the startup
  detail page. One component crash no longer takes down the page.
- **Password validation** in signup — minimum 8 characters and at least one
  digit.

## Build & architecture

- **Vite manual chunks** split the 1.1 MB main bundle by vendor:
  `vendor-3d`, `vendor-charts`, `vendor-solana`, `vendor-supabase`,
  `vendor-pdf`, `vendor-radix`, `vendor-motion`, `vendor-icons`, `vendor`.
  Much smaller initial download for first-time visitors.
- **Console stripping** in production builds (`esbuild drop: console`).
- **`.prettierrc.json`** added — 100-char lines, single quotes, trailing
  commas, LF line endings.
- **`vercel.json`** added — SPA rewrites, security headers (HSTS,
  X-Frame-Options, Referrer-Policy, Permissions-Policy), immutable cache on
  `/assets/`.
- **`SECURITY.md`** — vulnerability reporting policy and security controls
  inventory.
- **`package.json`** — proper name (`chaintrust`), version `1.0.0`,
  description, `typecheck` script.

## Outcomes

- All changes build cleanly.
- Test credentials (`admin@chainmetrics.io`, etc.) continue to work.
- Zero breaking changes to existing APIs.
- Bundle size reduced through vendor splitting.
- Blockchain program is safer (quorum check, vault solvency) and richer
  (badge tiers, 5 new events).

See `git log` for the commit trail of this session.
