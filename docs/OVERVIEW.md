# ChainTrust — Platform Overview

## What Is ChainTrust?

ChainTrust is a startup verification platform built on Solana. It lets startups publish their metrics on-chain, get verified by independent checks against the actual blockchain, and build investor confidence with cryptographic proof chains.

Think of it as a **credit bureau for startups** — but instead of trusting self-reported data, we verify claims directly against Solana.

---

## How It Works (4 Steps)

```
1. REGISTER        2. PUBLISH          3. VERIFY           4. CERTIFY
Startup creates    Metrics hashed      Blockchain data     cNFT certificate
on-chain identity  with SHA-256 and    independently       minted to wallet
via 6-step form    stored on Solana    verified via RPC    as permanent proof
```

---

## What Gets Verified (All Free, All On-Chain)

| Check | What We Read | Source |
|-------|-------------|--------|
| Treasury Balance | SOL + all SPL tokens | `getBalance()` + `getParsedTokenAccountsByOwner()` |
| USD Valuation | Real-time SOL/USD price | Pyth Network oracle |
| Token Distribution | All token holders, top-10 concentration | `getParsedProgramAccounts()` |
| Transaction Activity | 7-day, 30-day, all-time tx counts | `getSignaturesForAddress()` |
| Payment Volume | Inbound/outbound SOL + USDC flows | Parsed transaction history |
| Mint Authority | Can new tokens be minted? | `getParsedAccountInfo()` on mint |

**Result:** A verification score (0-100) with A-F grade, plus a compressed NFT certificate.

---

## Tech Stack

| Layer | What | Why |
|-------|------|-----|
| Frontend | React, TypeScript, Tailwind, shadcn/ui | Fast, accessible, professional |
| Blockchain | Solana + Anchor Framework | $0.00025/tx, 400ms finality |
| Oracle | Pyth Network | Free, real-time, oracle-verified pricing |
| Certificates | Metaplex Bubblegum cNFTs | ~$0.0001/mint, lives in wallet |
| Backend | Supabase (PostgreSQL + Auth + Realtime) | Instant setup, RLS security |
| Charts | Recharts | Interactive, responsive |

---

## Pages (23 Total)

### For Everyone
- **Dashboard** — Startup grid/table with filters, live stats
- **Leaderboard** — Ranked by 4 metrics with pagination
- **Staking** — CMT token staking with rewards calculator
- **Governance** — Proposals, voting, delegation, pledges
- **Compliance** — EU Digital Product Passport tracker
- **Provenance** — RWA supply chain certificates
- **Security** — Audit reports, MiCA compliance
- **Tokenomics** — Distribution, vesting, burn mechanics
- **Demo** — Interactive 4-step walkthrough

### For Investors
- **Portfolio** — Bookmarks, alerts, wallet overview
- **Screener** — 8-dimension multi-metric filter
- **Compare** — Side-by-side radar charts
- **Analytics** — Platform KPIs and growth charts
- **Cost Calculator** — Savings vs traditional verification
- **Investor Relations** — Traction, case studies, roadmap
- **API** — REST spec, SDKs, webhook docs

### For Startups
- **My Startup** — Profile, metrics, BMC upload, badge claiming
- **Register** — 6-step wizard with on-chain submission

---

## Smart Contract (24 Instructions)

The `chainmetrics` Anchor program handles:

- **Startup Registry** — Register, publish metrics with SHA-256 proof hash, verify, score
- **CMT Token Staking** — Stake/unstake with 30-day lock, 4 tiers (Free/Basic/Pro/Whale)
- **DAO Governance** — Create proposals, weighted voting, delegation, execution
- **Soulbound Badges** — Non-transferable verification NFTs

---

## Role-Based Access

| Role | What They See |
|------|--------------|
| **Investor** | Dashboard + Screener + Compare + Portfolio + Analytics + API |
| **Startup** | Dashboard + My Startup + Register + Governance |
| **Admin** | Everything |

Access enforced at route level (deny-by-default) + Supabase Row Level Security.

---

## Security

- 3 independent smart contract audits (OtterSec, Sec3, CertiK)
- Row Level Security on all 10 database tables
- HTML sanitization on all user-generated exports
- Console output gated behind DEV flag in production
- Role guard defaults to admin-only for unknown routes

---

## What Makes ChainTrust Unique

1. **We verify, not just record.** Other platforms timestamp self-reported data. We read actual blockchain state.
2. **Pyth oracle pricing.** Treasury valuations use real-time oracle prices, not estimates.
3. **cNFT certificates.** Verification proof lives in the startup's wallet — permanent, immutable, ~$0.0001.
4. **Payment volume verification.** We read actual token transfers to verify economic activity.
5. **$0 per verification.** Everything runs on Solana RPC reads — free, unlimited, no API key.
6. **Institutional view.** Toggle switches the entire platform to enterprise terminology and dense data.

---

## Numbers

- **23** pages
- **92** components (43 custom + 49 UI primitives)
- **24** on-chain instructions
- **10** database tables
- **15** blockchain hooks
- **11** data query hooks
- **3** user roles
- **4** staking tiers
- **0** external API costs

---

*Built on Solana. Verified by the blockchain. Trusted by investors.*
