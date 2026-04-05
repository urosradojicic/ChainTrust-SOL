use anchor_lang::prelude::*;

/// Global token configuration (PDA: seeds = ["token_config"])
#[account]
#[derive(InitSpace)]
pub struct TokenConfig {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub bump: u8,
}

/// Vote delegation record (PDA: seeds = ["delegation", delegator])
#[account]
#[derive(InitSpace)]
pub struct VoteDelegation {
    pub delegator: Pubkey,
    pub delegatee: Pubkey,
    pub delegated_at: i64,
    pub bump: u8,
}

/// Global registry state (PDA: seeds = ["registry"])
#[account]
#[derive(InitSpace)]
pub struct Registry {
    pub authority: Pubkey,
    pub startup_count: u64,
    pub bump: u8,
}

/// Individual startup account (PDA: seeds = ["startup", id.to_le_bytes()])
#[account]
#[derive(InitSpace)]
pub struct StartupAccount {
    pub id: u64,
    pub owner: Pubkey,
    #[max_len(100)]
    pub name: String,
    #[max_len(50)]
    pub category: String,
    #[max_len(200)]
    pub metadata_uri: String,
    pub registered_at: i64,
    pub is_verified: bool,
    pub verified_at: i64,
    pub trust_score: u64,
    pub total_reports: u64,
    pub bump: u8,
}

/// Latest metrics for a startup (PDA: seeds = ["metrics", startup_id.to_le_bytes()])
#[account]
#[derive(InitSpace)]
pub struct MetricsAccount {
    pub startup_id: u64,
    pub timestamp: i64,
    pub mrr: u64,
    pub total_users: u64,
    pub active_users: u64,
    pub burn_rate: u64,
    pub runway: u64,
    pub growth_rate: i64,
    pub carbon_offset: u64,
    pub proof_hash: [u8; 32],
    pub oracle_verified: bool,
    pub bump: u8,
}

/// Staking vault global state (PDA: seeds = ["vault"])
#[account]
#[derive(InitSpace)]
pub struct StakingVault {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub total_staked: u64,
    pub total_investors: u64,
    pub reward_rate_bps: u16, // Annual reward rate in basis points (e.g., 1250 = 12.5%)
    pub bump: u8,
}

/// Individual investor staking state (PDA: seeds = ["investor", user.key()])
#[account]
#[derive(InitSpace)]
pub struct InvestorAccount {
    pub user: Pubkey,
    pub staked_amount: u64,
    pub staked_at: i64,
    pub lock_until: i64,
    pub tier: u8, // 0 = Basic, 1 = Pro, 2 = Whale
    pub pending_rewards: u64,
    pub bump: u8,
}

/// Soulbound verification badge (PDA: seeds = ["badge", startup_id.to_le_bytes()])
#[account]
#[derive(InitSpace)]
pub struct VerificationBadge {
    pub startup_id: u64,
    pub owner: Pubkey,
    pub trust_score: u64,
    pub verified_at: i64,
    pub verifier: Pubkey,
    pub is_locked: bool, // Always true — soulbound
    pub bump: u8,
}

/// DAO configuration (PDA: seeds = ["dao"])
#[account]
#[derive(InitSpace)]
pub struct DaoConfig {
    pub authority: Pubkey,
    pub voting_delay: i64,    // seconds after proposal creation before voting starts
    pub voting_period: i64,   // seconds the voting window is open
    pub proposal_threshold: u64, // minimum staked CMT to create proposal (in base units)
    pub quorum_percentage: u8,   // e.g., 4 = 4%
    pub proposal_count: u64,
    pub bump: u8,
}

/// Individual governance proposal (PDA: seeds = ["proposal", id.to_le_bytes()])
#[account]
#[derive(InitSpace)]
pub struct Proposal {
    pub id: u64,
    pub proposer: Pubkey,
    #[max_len(200)]
    pub title: String,
    #[max_len(1000)]
    pub description: String,
    pub created_at: i64,
    pub voting_starts: i64,
    pub voting_ends: i64,
    pub for_votes: u64,
    pub against_votes: u64,
    pub abstain_votes: u64,
    pub executed: bool,
    pub cancelled: bool,
    pub bump: u8,
}

/// Vote record per proposal per voter (PDA: seeds = ["vote", proposal_id, voter.key()])
#[account]
#[derive(InitSpace)]
pub struct VoteRecord {
    pub voter: Pubkey,
    pub proposal_id: u64,
    pub support: u8, // 0 = Against, 1 = For, 2 = Abstain
    pub weight: u64, // Vote weight (staked CMT tokens)
    pub has_voted: bool,
    pub bump: u8,
}
