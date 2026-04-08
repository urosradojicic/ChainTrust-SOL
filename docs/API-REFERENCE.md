# API Reference

## Blockchain Hooks

All hooks are in `src/hooks/use-blockchain.ts`. Each write hook includes automatic fallback for devnet environments.

### Write Hooks

| Hook | Parameters | Returns | Description |
|------|-----------|---------|-------------|
| `usePublishMetrics()` | startupId, mrr, totalUsers, activeUsers, burnRate, runway, growthRate, carbonOffset | `{ publish, isPending, txHash, isDemoMode }` | Publish metrics with SHA-256 proof hash |
| `useRegisterStartup()` | name, category, metadataURI | `{ register, isPending, txHash, isDemoMode }` | Register new startup on-chain |
| `useStake()` | amount (CMT) | `{ stake, isPending }` | Stake CMT tokens |
| `useUnstake()` | amount (CMT) | `{ unstake, isPending }` | Unstake CMT tokens |
| `useClaimRewards()` | - | `{ claim, isPending }` | Claim pending staking rewards |
| `useMintBadge()` | startupId, recipient, trustScore | `{ mint, isPending }` | Mint soulbound verification badge |
| `useCreateProposal()` | title, description | `{ create, isPending }` | Create governance proposal |
| `useCastVote()` | proposalId, support (0/1/2) | `{ vote, isPending }` | Cast weighted governance vote |
| `useExecuteProposal()` | proposalId | `{ execute, isPending }` | Execute passed proposal |
| `useDelegateVotes()` | delegatee (PublicKey) | `{ delegate, isPending }` | Delegate voting power |

### Read Hooks

| Hook | Parameters | Returns | Description |
|------|-----------|---------|-------------|
| `useVerifyOnChain()` | startupId | `{ data, isLoading, refetch }` | Read MetricsAccount from chain |
| `useInvestorAccount()` | - | `{ data, isLoading, refetch }` | Read staked amount, tier, rewards |
| `useBadge()` | startupId | `{ data, isLoading, refetch }` | Read VerificationBadge |
| `useReadStartupCount()` | - | `{ count, isLoading, refetch }` | Read Registry startup count |
| `useReadProposal()` | proposalId | `{ data, isLoading, refetch }` | Read on-chain proposal |

## Data Query Hooks

All hooks in `src/hooks/use-startups.ts`. Powered by TanStack React Query with Supabase.

| Hook | Returns | Cache Key |
|------|---------|-----------|
| `useStartups()` | All startups sorted by MRR desc | `['startups']` |
| `useStartup(id)` | Single startup by ID | `['startup', id]` |
| `useMetricsHistory(id)` | Monthly metrics for startup | `['metrics', id]` |
| `useStartupPledges(id)` | Pledges for startup | `['pledges', id]` |
| `useAllPledges()` | All pledges platform-wide | `['all-pledges']` |
| `useProposals()` | All governance proposals | `['proposals']` |
| `useAuditLog(id)` | Audit entries for startup | `['audit-log', id]` |
| `useUserVotes(userId)` | User's governance votes | `['user-votes', userId]` |
| `useFundingRounds(id)` | Funding rounds for startup | `['funding-rounds', id]` |
| `useTokenUnlocks(id)` | Token unlock schedule | `['token-unlocks', id]` |

## Real-Time Subscriptions

`useRealtimeSync()` in `src/hooks/use-realtime.ts` subscribes to Supabase Realtime channels:

| Table | Events | Cache Invalidated |
|-------|--------|-------------------|
| startups | INSERT, UPDATE, DELETE | `['startups']`, `['startup', *]` |
| metrics_history | INSERT | `['metrics', *]` |
| proposals | INSERT, UPDATE | `['proposals']` |
| pledges | INSERT, UPDATE | `['pledges', *]`, `['all-pledges']` |
| startup_audit_log | INSERT | `['audit-log', *]` |

## Role Access Control

Defined in `src/lib/role-access.ts`.

| Route | Access Level |
|-------|-------------|
| `/`, `/login`, `/demo` | public |
| `/dashboard`, `/leaderboard`, `/staking`, `/governance`, `/security`, `/tokenomics`, `/compliance`, `/provenance` | auth (any role) |
| `/portfolio`, `/screener`, `/compare`, `/analytics`, `/cost-calculator`, `/investors`, `/api` | investor + admin |
| `/my-startup`, `/register` | startup + admin |

Unknown routes default to admin-only (deny-by-default).

## Anchor Discriminators

All instruction discriminators computed as:

```typescript
SHA-256("global:<instruction_name>")[0..8]
```

Cached at module level after first computation.

## Proof Hash Verification

```typescript
import { computeProofHash } from '@/hooks/use-blockchain';

const hash = await computeProofHash({
  mrr: 125000,
  users: 8500,
  activeUsers: 6000,
  burnRate: 45000,
  runway: 18,
  growthRate: 15.2,
  carbonOffset: 45,
});
// Returns Uint8Array(32) — compare with on-chain MetricsAccount.proof_hash
```
