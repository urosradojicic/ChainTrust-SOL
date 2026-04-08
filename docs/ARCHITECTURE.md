# ChainTrust Architecture

## Overview

ChainTrust is a supply chain transparency and startup verification platform built on Solana. The system combines on-chain cryptographic verification with a real-time PostgreSQL backend to provide institutional-grade due diligence tooling.

```
                    +-------------------+
                    |   React Frontend  |
                    |   (23 pages, SPA) |
                    +---------+---------+
                              |
              +---------------+---------------+
              |                               |
    +---------v---------+          +----------v----------+
    |  Supabase Backend |          |   Solana Blockchain  |
    |  (PostgreSQL, RLS)|          |  (Anchor Program)    |
    |  - Auth & Roles   |          |  - Registry          |
    |  - Startup Data   |          |  - Metrics + Proofs  |
    |  - Realtime Sync  |          |  - Staking Vault     |
    |  - Audit Logs     |          |  - DAO Governance    |
    +-------------------+          |  - Soulbound Badges  |
                                   +----------------------+
```

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + TypeScript | 18.3 / 5.8 |
| **Build** | Vite | 5.4 |
| **Styling** | Tailwind CSS + shadcn/ui | 3.4 |
| **Animation** | Framer Motion | 11 |
| **Charts** | Recharts | 2.15 |
| **Blockchain** | Solana + Anchor Framework | 1.95 / 0.30 |
| **Wallet** | Solana Wallet Adapter | 0.15 |
| **Backend** | Supabase (PostgreSQL) | 2.101 |
| **State** | TanStack React Query | 5 |
| **Forms** | React Hook Form + Zod | 7.61 / 3.25 |
| **PDF** | html2canvas + jsPDF | 1.4 / 4.2 |

## Project Structure

```
src/
  pages/              # 23 route-level pages (lazy-loaded)
  components/
    layout/           # Navbar, Footer, PageTransition
    startup/          # 18 startup-specific components
    demo/             # Interactive demo components
    common/           # Badge, Sparkline, DataProvenance
    form/             # Toggle, DistSlider
    audit/            # AuditLogTable
    ui/               # 49 shadcn/ui primitives
  hooks/
    use-blockchain.ts # 15 Solana hooks (write + read)
    use-startups.ts   # 11 Supabase query hooks
    use-realtime.ts   # Realtime subscription manager
  contexts/
    AuthContext.tsx    # Supabase auth + role management
    WalletContext.tsx  # Solana wallet state + tier
    InstitutionalViewContext.tsx  # Enterprise mode toggle
  lib/
    contracts.ts      # PDA derivation, constants
    role-access.ts    # Page-level access control
    solana-config.ts  # Cluster + explorer URLs
    format.ts         # Currency/number formatting
    lp-report.ts      # PDF report generation
    ai-due-diligence.ts  # Algorithmic risk analysis
  types/
    database.ts       # TypeScript database types
  integrations/
    supabase/         # Supabase client + auto-generated types

blockchain/
  programs/
    chainmetrics/
      src/
        lib.rs        # 24 instructions, 16 contexts, 9 events
        state.rs      # 12 account structs
        errors.rs     # 20 custom errors
  tests/              # Anchor test suite
```

## Authentication & Authorization

### Roles

| Role | Description | Access |
|------|-------------|--------|
| **admin** | Platform administrator | All pages |
| **investor** | Fund manager, analyst | Dashboard, Screener, Compare, Portfolio, Analytics, API |
| **startup** | Company founder | Dashboard, My Startup, Register, Governance |

### Auth Flow

1. User signs up via Supabase Auth (email/password)
2. Role assigned to `user_roles` table
3. `AuthContext` fetches role via `get_user_role()` RPC function
4. `RoleGuard` component wraps each route in App.tsx
5. Unknown routes default to admin-only (deny-by-default)
6. Sidebar navigation filtered by `canAccess()` per role

### Row Level Security

All 10 database tables enforce RLS policies:
- Read: Public for startups/proposals, role-restricted for profiles
- Write: Role-checked via `has_role()` security definer function
- Audit: All changes logged to `startup_audit_log` with tx hash

## Data Flow

### Startup Registration
```
User fills 6-step form
  -> Wallet signs transaction
  -> Anchor: register_startup instruction
  -> PDA created: StartupAccount
  -> Supabase: INSERT into startups table
  -> Realtime: Dashboard auto-refreshes
```

### Metrics Publication
```
Startup submits monthly metrics
  -> SHA-256 proof hash computed client-side
  -> Anchor: publish_metrics instruction
  -> MetricsAccount PDA updated with proof hash
  -> Supabase: INSERT into metrics_history
  -> Audit log entry with Solana tx hash
```

### Governance Voting
```
Investor creates proposal
  -> Anchor: create_proposal instruction
  -> Supabase: INSERT into proposals
  -> Other investors cast votes
  -> Anchor: cast_vote (weighted by staked CMT)
  -> Supabase trigger: update_proposal_votes()
  -> After voting period: execute_proposal
```

## Staking Tiers

| Tier | Minimum Stake | APY | Features |
|------|--------------|-----|----------|
| Free | 0 CMT | 0% | Dashboard, leaderboard |
| Basic | 1+ CMT | 8% | + Screener, CSV export |
| Pro | 5,000+ CMT | 12.5% | + Due diligence, LP reports, API |
| Whale | 50,000+ CMT | 15% | + Priority oracle, institutional view |

## Real-Time Architecture

```
Supabase PostgreSQL
  -> postgres_changes channel
  -> Tables: startups, metrics_history, proposals, pledges, audit_log
  -> useRealtimeSync() hook subscribes
  -> React Query cache invalidation
  -> UI re-renders with fresh data
```

## Security Model

| Layer | Mechanism |
|-------|-----------|
| **Transport** | TLS 1.3 (Supabase managed) |
| **Auth** | Supabase JWT + session management |
| **Database** | Row Level Security on all tables |
| **Frontend** | RoleGuard deny-by-default routing |
| **On-Chain** | Anchor PDA validation + signer checks |
| **Content** | HTML escape on all user-generated exports |
| **Logging** | Console output gated behind DEV flag |
| **Auditing** | Every metric change logged with Solana tx hash |

## Related Documentation

- [Database Schema](DATABASE.md) - Full table definitions and RLS policies
- [Smart Contract](SMART-CONTRACT.md) - Anchor program instructions and accounts
- [API Reference](API-REFERENCE.md) - All hooks and integration points
- [Design System](DESIGN-SYSTEM.md) - Colors, typography, and component library
- [Deployment Guide](DEPLOYMENT.md) - Setup and deployment instructions
