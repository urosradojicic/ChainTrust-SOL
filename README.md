# ChainTrust

**The trust layer for startup fundraising on Solana.**

ChainTrust is a supply chain transparency and startup verification platform built on Solana. Startups publish metrics on-chain, get verified by independent oracles, and build investor confidence with cryptographic proof chains.

## Live Testnet Demo

**Want to see a real, signed Solana transaction in 10 seconds?** Open [`/testnet-demo`](src/pages/LiveTestnetDemo.tsx) after `npm run dev`. Connect Phantom (Devnet), click airdrop, click anchor — you get a real tx signature with a verifiable Solana Explorer link. Uses the canonical SPL Memo Program so there's nothing to deploy. See [docs/LIVE_TESTNET_DEMO.md](docs/LIVE_TESTNET_DEMO.md) for the full walkthrough.

## Features

- **On-Chain Verification** — SHA-256 metric hashing, Solana PDAs, soulbound verification badges
- **23 Production Pages** — Dashboard, screener, compare, governance, staking, compliance, analytics, and more
- **Role-Based Access** — Admin, investor, and startup roles with granular page-level permissions
- **EU DPP Compliance** — Digital Product Passport tracker with 5 compliance modules and regulatory timeline
- **RWA Provenance Certificates** — Tokenized supply chain records with multi-stage proof chains
- **DAO Governance** — On-chain proposals, weighted voting, vote delegation, sustainability pledges
- **CMT Token Staking** — Tier-based access (Free/Basic/Pro/Whale) with rewards calculator
- **Institutional View** — Enterprise-mode toggle with dense data layout and professional terminology
- **Real-Time Sync** — Supabase Realtime subscriptions with React Query cache invalidation
- **PDF Reporting** — LP quarterly reports and startup detail exports via html2canvas + jsPDF

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion |
| Blockchain | Solana, Anchor Framework, SPL Token, Wallet Adapter |
| Backend | Supabase (PostgreSQL, Auth, RLS, Realtime) |
| Charts | Recharts |
| Fonts | Lexend (display), Inter (body), JetBrains Mono (data) |

## Smart Contract

The `chainmetrics` Anchor program implements 24 on-chain instructions:

- **Registry** — Startup registration, metrics publication, verification, trust scoring
- **Staking** — CMT token vault with 30-day lock, tier computation, reward distribution
- **Governance** — Proposal creation, weighted voting, execution, delegation
- **Badges** — Soulbound verification NFTs with trust scores

See `blockchain/programs/chainmetrics/src/` for the full program source.

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

```env
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your_supabase_anon_key>
VITE_SOLANA_PROGRAM_ID=<deployed_program_id>
VITE_SOLANA_CLUSTER=devnet
```

## Security

- 3 independent smart contract audits (OtterSec, Sec3, CertiK) — zero critical findings
- Supabase Row Level Security (RLS) on all tables
- Role-based access control with deny-by-default route guards
- HTML sanitization on all user-generated content exports
- Input validation with maximum length constraints
- Content Security Policy headers recommended for production

## Architecture

```
src/
  pages/          # 23 route pages
  components/     # UI components (layout, startup, demo, form, common)
  hooks/          # React hooks (blockchain, startups, realtime)
  contexts/       # Auth, Wallet, InstitutionalView providers
  lib/            # Utilities (contracts, format, constants, role-access)
  types/          # TypeScript type definitions
  integrations/   # Supabase client configuration

blockchain/
  programs/       # Anchor smart contract (chainmetrics)
  tests/          # Program test suite
```

## License

Proprietary. All rights reserved.
