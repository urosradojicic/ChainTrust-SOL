# Smart Contract: chainmetrics

Anchor program deployed on Solana. Implements startup verification, staking, governance, and soulbound badges.

## Program Overview

- **Framework:** Anchor 0.30.1
- **Language:** Rust
- **Network:** Solana Devnet (configurable)
- **Instructions:** 24
- **Account Types:** 12
- **Custom Errors:** 20
- **Events:** 9

## Account Structures

### TokenConfig
PDA Seeds: `["token_config"]`

| Field | Type | Size |
|-------|------|------|
| authority | Pubkey | 32 |
| mint | Pubkey | 32 |
| bump | u8 | 1 |

### Registry
PDA Seeds: `["registry"]`

| Field | Type | Size |
|-------|------|------|
| authority | Pubkey | 32 |
| startup_count | u64 | 8 |
| bump | u8 | 1 |

### StartupAccount
PDA Seeds: `["startup", id.to_le_bytes()]`

| Field | Type | Size |
|-------|------|------|
| id | u64 | 8 |
| owner | Pubkey | 32 |
| name | String | max 100 |
| category | String | max 50 |
| metadata_uri | String | max 200 |
| registered_at | i64 | 8 |
| is_verified | bool | 1 |
| verified_at | i64 | 8 |
| trust_score | u64 | 8 |
| total_reports | u64 | 8 |
| bump | u8 | 1 |

### MetricsAccount
PDA Seeds: `["metrics", startup_id.to_le_bytes()]`

| Field | Type | Size |
|-------|------|------|
| startup_id | u64 | 8 |
| timestamp | i64 | 8 |
| mrr | u64 | 8 |
| total_users | u64 | 8 |
| active_users | u64 | 8 |
| burn_rate | u64 | 8 |
| runway | u64 | 8 |
| growth_rate | i64 | 8 |
| carbon_offset | u64 | 8 |
| proof_hash | [u8; 32] | 32 |
| oracle_verified | bool | 1 |
| bump | u8 | 1 |

### StakingVault
PDA Seeds: `["vault"]`

| Field | Type | Size |
|-------|------|------|
| authority | Pubkey | 32 |
| mint | Pubkey | 32 |
| total_staked | u64 | 8 |
| total_investors | u64 | 8 |
| reward_rate_bps | u16 | 2 |
| bump | u8 | 1 |

### InvestorAccount
PDA Seeds: `["investor", user.key()]`

| Field | Type | Size |
|-------|------|------|
| user | Pubkey | 32 |
| staked_amount | u64 | 8 |
| staked_at | i64 | 8 |
| lock_until | i64 | 8 |
| tier | u8 | 1 |
| pending_rewards | u64 | 8 |
| bump | u8 | 1 |

### VerificationBadge (Soulbound)
PDA Seeds: `["badge", startup_id.to_le_bytes()]`

| Field | Type | Size |
|-------|------|------|
| startup_id | u64 | 8 |
| owner | Pubkey | 32 |
| trust_score | u64 | 8 |
| verified_at | i64 | 8 |
| verifier | Pubkey | 32 |
| is_locked | bool | 1 |
| bump | u8 | 1 |

### DaoConfig
PDA Seeds: `["dao"]`

| Field | Type | Size |
|-------|------|------|
| authority | Pubkey | 32 |
| voting_delay | i64 | 8 |
| voting_period | i64 | 8 |
| proposal_threshold | u64 | 8 |
| quorum_percentage | u8 | 1 |
| proposal_count | u64 | 8 |
| bump | u8 | 1 |

### Proposal
PDA Seeds: `["proposal", id.to_le_bytes()]`

| Field | Type | Size |
|-------|------|------|
| id | u64 | 8 |
| proposer | Pubkey | 32 |
| title | String | max 200 |
| description | String | max 1000 |
| created_at | i64 | 8 |
| voting_starts | i64 | 8 |
| voting_ends | i64 | 8 |
| for_votes | u64 | 8 |
| against_votes | u64 | 8 |
| abstain_votes | u64 | 8 |
| executed | bool | 1 |
| cancelled | bool | 1 |
| bump | u8 | 1 |

### VoteRecord
PDA Seeds: `["vote", proposal_id.to_le_bytes(), voter.key()]`

| Field | Type | Size |
|-------|------|------|
| voter | Pubkey | 32 |
| proposal_id | u64 | 8 |
| support | u8 | 1 |
| weight | u64 | 8 |
| has_voted | bool | 1 |
| bump | u8 | 1 |

### VoteDelegation
PDA Seeds: `["delegation", delegator.key()]`

| Field | Type | Size |
|-------|------|------|
| delegator | Pubkey | 32 |
| delegatee | Pubkey | 32 |
| delegated_at | i64 | 8 |
| bump | u8 | 1 |

## Instructions

### Token Management
| Instruction | Authority | Description |
|------------|-----------|-------------|
| `initialize_token` | Program deployer | Create CMT SPL token (6 decimals) |
| `mint_tokens` | Authority only | Mint additional CMT supply |
| `burn_tokens` | Token holder | Burn tokens from caller's account |

### Registry
| Instruction | Authority | Description |
|------------|-----------|-------------|
| `initialize_registry` | Program deployer | Create global registry |
| `register_startup` | Any authenticated | Register startup, assign ID |
| `publish_metrics` | Startup owner | Publish metrics with SHA-256 proof hash |
| `verify_startup` | Authority only | Mark startup as verified |
| `update_trust_score` | Authority only | Set trust score (0-100) |

### Staking
| Instruction | Authority | Description |
|------------|-----------|-------------|
| `initialize_vault` | Program deployer | Create vault (default 12.5% APY) |
| `stake` | Token holder | Lock CMT for 30 days, update tier |
| `unstake` | Token holder | Withdraw after lock period |
| `distribute_rewards` | Authority only | Add rewards to investor |
| `claim_rewards` | Investor | Claim accumulated rewards |
| `set_reward_rate` | Authority only | Adjust APY (max 100%) |

### Badges
| Instruction | Authority | Description |
|------------|-----------|-------------|
| `mint_badge` | Authority only | Issue soulbound badge |
| `update_badge_score` | Authority only | Update badge trust score |

### Governance
| Instruction | Authority | Description |
|------------|-----------|-------------|
| `initialize_dao` | Program deployer | Set voting parameters |
| `create_proposal` | Staked investor | Create proposal (requires threshold) |
| `cast_vote` | Staked investor | Vote weighted by staked CMT |
| `execute_proposal` | Authority | Execute passed proposal |
| `cancel_proposal` | Proposer/Authority | Cancel before execution |
| `delegate_votes` | Any investor | Delegate voting power |

### Account Management
| Instruction | Authority | Description |
|------------|-----------|-------------|
| `close_investor_account` | Account owner | Reclaim rent (requires 0 stake) |
| `close_vote_record` | Account owner | Reclaim rent after voting ends |

## Constants

```rust
LOCK_PERIOD:      2,592,000  // 30 days in seconds
CMT_DECIMALS:     1,000,000  // 6 decimal places
PRO_THRESHOLD:    5,000 CMT
WHALE_THRESHOLD:  50,000 CMT
```

## Events

| Event | Emitted By |
|-------|-----------|
| StartupRegistered | register_startup |
| MetricsPublished | publish_metrics |
| Staked | stake |
| Unstaked | unstake |
| RewardsClaimed | claim_rewards |
| BadgeMinted | mint_badge |
| VotesDelegated | delegate_votes |
| ProposalCreated | create_proposal |
| ProposalExecuted | execute_proposal |

## Proof Hash Computation

Metrics proof hashes are computed as:

```
SHA-256(mrr|totalUsers|activeUsers|burnRate|runway|growthRate*100|carbonOffset)
```

The resulting 32-byte hash is stored on-chain in `MetricsAccount.proof_hash` and can be independently verified by anyone with access to the raw metrics.
