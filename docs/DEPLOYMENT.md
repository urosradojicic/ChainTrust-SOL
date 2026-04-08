# Deployment Guide

## Prerequisites

- Node.js 18+
- npm 9+
- Rust + Cargo (for smart contract)
- Solana CLI + Anchor CLI (for blockchain deployment)
- Supabase account

## Frontend Setup

```bash
# Clone and install
git clone https://github.com/urosradojicic/ChainTrust-SOL.git
cd ChainTrust-SOL
npm install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Development server
npm run dev          # http://localhost:8080

# Production build
npm run build        # Output: dist/
npm run preview      # Preview production build
```

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon key |
| `VITE_SOLANA_PROGRAM_ID` | Yes | Deployed Anchor program ID |
| `VITE_SOLANA_CLUSTER` | No | `devnet` (default) or `mainnet-beta` |

## Smart Contract Deployment

### Build

```bash
cd blockchain
anchor build
```

### Deploy to Devnet

```bash
# Fund deployer wallet
solana airdrop 2 --url devnet

# Deploy
anchor deploy --provider.cluster devnet

# Note the program ID from output
# Update .env: VITE_SOLANA_PROGRAM_ID=<program_id>
# Update blockchain/Anchor.toml [programs.devnet] section
# Update blockchain/programs/chainmetrics/src/lib.rs declare_id!()
```

### Initialize On-Chain State

After deployment, run initialization transactions:

```bash
# These can be run via Anchor test scripts or a custom CLI
anchor run initialize_token      # Create CMT SPL token
anchor run initialize_registry   # Create startup registry
anchor run initialize_vault      # Create staking vault (12.5% APY)
anchor run initialize_dao        # Create governance config
```

## Supabase Setup

### Database

1. Create a new Supabase project
2. Run all migrations in order:

```bash
# Apply migrations
supabase db push
```

Migrations are in `supabase/migrations/` (8 files, dated March 30 - April 5, 2026).

### Row Level Security

All tables have RLS enabled with policies for:
- Public read access for startup data
- Role-based write access (admin, investor, startup)
- Audit logging for all mutations

### Edge Functions

Deploy the risk-analysis Edge Function:

```bash
supabase functions deploy risk-analysis
```

## Production Checklist

### Security
- [ ] Rotate Supabase keys after initial setup
- [ ] Enable Supabase rate limiting
- [ ] Configure CORS for your domain only
- [ ] Add Content-Security-Policy headers
- [ ] Verify all RLS policies are active
- [ ] Remove test credentials from Login.tsx (DEV-only gate in place)

### Infrastructure
- [ ] Deploy frontend to Vercel/Netlify/Cloudflare Pages
- [ ] Configure custom domain with SSL
- [ ] Set up error monitoring (Sentry recommended)
- [ ] Enable Supabase database backups
- [ ] Configure Solana RPC provider (Helius/QuickNode for production)

### Blockchain
- [ ] Deploy smart contract to devnet and test
- [ ] Run full test suite
- [ ] Deploy to mainnet-beta after testing
- [ ] Initialize all on-chain state accounts
- [ ] Transfer program authority to multisig

### Monitoring
- [ ] Set up uptime monitoring
- [ ] Configure Solana program event listeners
- [ ] Enable Supabase dashboard alerts
- [ ] Set up log aggregation

## Architecture Diagram

```
Browser
  |
  +-- React SPA (Vite build)
  |     |
  |     +-- Supabase Client (REST + Realtime WebSocket)
  |     |     |
  |     |     +-- PostgreSQL (10 tables, RLS)
  |     |     +-- Auth (JWT sessions)
  |     |     +-- Realtime (postgres_changes)
  |     |     +-- Edge Functions (risk-analysis)
  |     |
  |     +-- Solana Web3.js + Wallet Adapter
  |           |
  |           +-- Anchor Program (chainmetrics)
  |           |     +-- Registry PDAs
  |           |     +-- Staking Vault
  |           |     +-- DAO Governance
  |           |     +-- Soulbound Badges
  |           |
  |           +-- Solana RPC (devnet / mainnet)
  |
  +-- Wallet Extension (Phantom/Solflare/Coinbase)
```
