use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer, MintTo, Burn};

declare_id!("CMTRgstry1111111111111111111111111111111111");

pub mod state;
pub mod errors;

use state::*;
use errors::*;

#[program]
pub mod chainmetrics {
    use super::*;

    // ── CMT Token ──────────────────────────────────────────────────

    /// Initialize the CMT SPL token mint and mint initial supply to authority.
    /// Initial supply uses 6 decimals (e.g., 10_000_000 * 1e6 = 10_000_000_000_000).
    pub fn initialize_token(ctx: Context<InitializeToken>, initial_supply: u64) -> Result<()> {
        let config = &mut ctx.accounts.token_config;
        config.authority = ctx.accounts.authority.key();
        config.mint = ctx.accounts.mint.key();
        config.bump = ctx.bumps.token_config;

        if initial_supply > 0 {
            let seeds = &[b"token_config".as_ref(), &[config.bump]];
            let signer_seeds = &[&seeds[..]];

            token::mint_to(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    MintTo {
                        mint: ctx.accounts.mint.to_account_info(),
                        to: ctx.accounts.authority_token_account.to_account_info(),
                        authority: ctx.accounts.token_config.to_account_info(),
                    },
                    signer_seeds,
                ),
                initial_supply,
            )?;
        }

        Ok(())
    }

    /// Mint additional CMT tokens (authority only).
    pub fn mint_tokens(ctx: Context<MintTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, ChainMetricsError::ZeroAmount);
        let config = &ctx.accounts.token_config;
        require!(
            ctx.accounts.authority.key() == config.authority,
            ChainMetricsError::Unauthorized
        );

        let seeds = &[b"token_config".as_ref(), &[config.bump]];
        let signer_seeds = &[&seeds[..]];

        token::mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.to.to_account_info(),
                    authority: ctx.accounts.token_config.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        Ok(())
    }

    /// Burn CMT tokens from signer's account.
    pub fn burn_tokens(ctx: Context<BurnTokens>, amount: u64) -> Result<()> {
        require!(amount > 0, ChainMetricsError::ZeroAmount);
        token::burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.mint.to_account_info(),
                    from: ctx.accounts.from.to_account_info(),
                    authority: ctx.accounts.authority.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }

    /// Delegate voting power to another address (stores on-chain).
    pub fn delegate_votes(ctx: Context<DelegateVotes>, delegatee: Pubkey) -> Result<()> {
        let delegation = &mut ctx.accounts.delegation;
        delegation.delegator = ctx.accounts.delegator.key();
        delegation.delegatee = delegatee;
        delegation.delegated_at = Clock::get()?.unix_timestamp;
        delegation.bump = ctx.bumps.delegation;

        emit!(VotesDelegated {
            delegator: ctx.accounts.delegator.key(),
            delegatee,
        });

        Ok(())
    }

    // ── ChainMetrics Registry ─────────────────────────────────────

    /// Initialize the global registry state.
    pub fn initialize_registry(ctx: Context<InitializeRegistry>) -> Result<()> {
        let registry = &mut ctx.accounts.registry;
        registry.authority = ctx.accounts.authority.key();
        registry.startup_count = 0;
        registry.bump = ctx.bumps.registry;
        Ok(())
    }

    /// Register a new startup on-chain.
    pub fn register_startup(
        ctx: Context<RegisterStartup>,
        name: String,
        category: String,
        metadata_uri: String,
    ) -> Result<()> {
        require!(!name.is_empty(), ChainMetricsError::EmptyName);
        require!(name.len() <= 100, ChainMetricsError::NameTooLong);
        require!(!category.is_empty(), ChainMetricsError::EmptyCategory);
        require!(category.len() <= 50, ChainMetricsError::CategoryTooLong);
        require!(metadata_uri.len() <= 200, ChainMetricsError::UriTooLong);

        let registry = &mut ctx.accounts.registry;
        registry.startup_count += 1;
        let startup_id = registry.startup_count;

        let startup = &mut ctx.accounts.startup;
        startup.id = startup_id;
        startup.owner = ctx.accounts.owner.key();
        startup.name = name.clone();
        startup.category = category;
        startup.metadata_uri = metadata_uri;
        startup.registered_at = Clock::get()?.unix_timestamp;
        startup.is_verified = false;
        startup.verified_at = 0;
        startup.trust_score = 50;
        startup.total_reports = 0;
        startup.bump = ctx.bumps.startup;

        emit!(StartupRegistered {
            id: startup_id,
            owner: ctx.accounts.owner.key(),
            name,
        });

        Ok(())
    }

    /// Publish metrics for a startup (owner only).
    pub fn publish_metrics(
        ctx: Context<PublishMetrics>,
        mrr: u64,
        total_users: u64,
        active_users: u64,
        burn_rate: u64,
        runway: u64,
        growth_rate: i64,
        carbon_offset: u64,
        proof_hash: [u8; 32],
    ) -> Result<()> {
        let startup = &mut ctx.accounts.startup;
        require!(
            startup.owner == ctx.accounts.owner.key(),
            ChainMetricsError::NotStartupOwner
        );
        require!(startup.id > 0, ChainMetricsError::StartupNotFound);
        // Validate active_users <= total_users
        require!(active_users <= total_users, ChainMetricsError::InvalidMetrics);
        // Growth rate in basis points: -10000 (-100%) to 10000 (+100%)
        require!(
            growth_rate >= -10000 && growth_rate <= 10000,
            ChainMetricsError::GrowthRateOutOfBounds
        );

        let metrics = &mut ctx.accounts.metrics;
        metrics.startup_id = startup.id;
        metrics.timestamp = Clock::get()?.unix_timestamp;
        metrics.mrr = mrr;
        metrics.total_users = total_users;
        metrics.active_users = active_users;
        metrics.burn_rate = burn_rate;
        metrics.runway = runway;
        metrics.growth_rate = growth_rate;
        metrics.carbon_offset = carbon_offset;
        metrics.proof_hash = proof_hash;
        metrics.oracle_verified = false;
        metrics.bump = ctx.bumps.metrics;

        startup.total_reports += 1;

        emit!(MetricsPublished {
            id: startup.id,
            proof_hash,
            timestamp: metrics.timestamp,
        });

        Ok(())
    }

    /// Verify a startup (authority only).
    pub fn verify_startup(ctx: Context<VerifyStartup>) -> Result<()> {
        let registry = &ctx.accounts.registry;
        require!(
            ctx.accounts.authority.key() == registry.authority,
            ChainMetricsError::Unauthorized
        );

        let startup = &mut ctx.accounts.startup;
        require!(startup.id > 0, ChainMetricsError::StartupNotFound);

        startup.is_verified = true;
        startup.verified_at = Clock::get()?.unix_timestamp;

        emit!(StartupVerified {
            id: startup.id,
            verified_at: startup.verified_at,
            verifier: ctx.accounts.authority.key(),
        });
        Ok(())
    }

    /// Update a startup's trust score (authority only).
    pub fn update_trust_score(ctx: Context<VerifyStartup>, new_score: u64) -> Result<()> {
        let registry = &ctx.accounts.registry;
        require!(
            ctx.accounts.authority.key() == registry.authority,
            ChainMetricsError::Unauthorized
        );
        require!(new_score <= 100, ChainMetricsError::InvalidTrustScore);

        let startup = &mut ctx.accounts.startup;
        let old_score = startup.trust_score;
        startup.trust_score = new_score;

        emit!(TrustScoreUpdated {
            id: startup.id,
            old_score,
            new_score,
            updated_at: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }

    // ── Staking Vault ─────────────────────────────────────────────

    /// Initialize the staking vault.
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        vault.authority = ctx.accounts.authority.key();
        vault.mint = ctx.accounts.mint.key();
        vault.total_staked = 0;
        vault.total_investors = 0;
        vault.reward_rate_bps = 1250; // 12.5% APY default (in basis points)
        vault.bump = ctx.bumps.vault;
        Ok(())
    }

    /// Stake CMT tokens.
    pub fn stake(ctx: Context<Stake>, amount: u64) -> Result<()> {
        require!(amount > 0, ChainMetricsError::ZeroAmount);
        require!(amount <= u64::MAX / 2, ChainMetricsError::AmountTooLarge);

        // Transfer tokens from user to vault token account
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_token_account.to_account_info(),
                    to: ctx.accounts.vault_token_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            amount,
        )?;

        let investor = &mut ctx.accounts.investor;
        let is_new = investor.staked_amount == 0 && investor.user == Pubkey::default();

        if is_new {
            let vault = &mut ctx.accounts.vault;
            vault.total_investors += 1;
        }

        investor.user = ctx.accounts.user.key();
        investor.staked_amount = investor.staked_amount.checked_add(amount)
            .ok_or(ChainMetricsError::AmountTooLarge)?;
        investor.staked_at = Clock::get()?.unix_timestamp;
        investor.lock_until = Clock::get()?.unix_timestamp + LOCK_PERIOD;
        investor.tier = compute_tier(investor.staked_amount);
        investor.bump = ctx.bumps.investor;

        let vault = &mut ctx.accounts.vault;
        vault.total_staked = vault.total_staked.checked_add(amount)
            .ok_or(ChainMetricsError::AmountTooLarge)?;

        emit!(Staked {
            investor: ctx.accounts.user.key(),
            amount,
            tier: investor.tier,
        });

        Ok(())
    }

    /// Unstake CMT tokens.
    pub fn unstake(ctx: Context<Unstake>, amount: u64) -> Result<()> {
        require!(amount > 0, ChainMetricsError::ZeroAmount);
        let investor = &mut ctx.accounts.investor;
        require!(investor.user == ctx.accounts.user.key(), ChainMetricsError::Unauthorized);
        require!(investor.staked_amount >= amount, ChainMetricsError::InsufficientStake);
        require!(
            Clock::get()?.unix_timestamp >= investor.lock_until,
            ChainMetricsError::StillLocked
        );

        investor.staked_amount = investor.staked_amount.checked_sub(amount)
            .ok_or(ChainMetricsError::InsufficientStake)?;
        investor.tier = compute_tier(investor.staked_amount);

        let vault = &mut ctx.accounts.vault;
        vault.total_staked = vault.total_staked.checked_sub(amount)
            .ok_or(ChainMetricsError::AmountTooLarge)?;

        if investor.staked_amount == 0 {
            vault.total_investors = vault.total_investors.saturating_sub(1);
        }

        // Transfer tokens back from vault to user
        let seeds = &[b"vault".as_ref(), &[vault.bump]];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;

        emit!(Unstaked {
            investor: ctx.accounts.user.key(),
            amount,
        });

        Ok(())
    }

    /// Distribute rewards to a specific investor (authority only).
    /// This is called periodically by the protocol to set pending_rewards.
    pub fn distribute_rewards(ctx: Context<DistributeRewards>, reward_amount: u64) -> Result<()> {
        let vault = &ctx.accounts.vault;
        require!(
            ctx.accounts.authority.key() == vault.authority,
            ChainMetricsError::Unauthorized
        );
        require!(reward_amount > 0, ChainMetricsError::ZeroAmount);

        let investor = &mut ctx.accounts.investor;
        require!(investor.user != Pubkey::default(), ChainMetricsError::InvestorNotFound);

        investor.pending_rewards = investor.pending_rewards.checked_add(reward_amount)
            .ok_or(ChainMetricsError::AmountTooLarge)?;

        Ok(())
    }

    /// Claim pending staking rewards.
    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        let investor = &mut ctx.accounts.investor;
        require!(investor.user == ctx.accounts.user.key(), ChainMetricsError::Unauthorized);
        require!(investor.pending_rewards > 0, ChainMetricsError::NoRewards);

        // Ensure vault has enough balance to pay rewards (fail-fast, better error than SPL panic)
        require!(
            ctx.accounts.vault_token_account.amount >= investor.pending_rewards,
            ChainMetricsError::InsufficientVaultFunds
        );

        let rewards = investor.pending_rewards;
        investor.pending_rewards = 0;

        let vault = &ctx.accounts.vault;
        let seeds = &[b"vault".as_ref(), &[vault.bump]];
        let signer_seeds = &[&seeds[..]];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault_token_account.to_account_info(),
                    to: ctx.accounts.user_token_account.to_account_info(),
                    authority: ctx.accounts.vault.to_account_info(),
                },
                signer_seeds,
            ),
            rewards,
        )?;

        emit!(RewardsClaimed {
            investor: ctx.accounts.user.key(),
            amount: rewards,
        });

        Ok(())
    }

    /// Update the vault reward rate (authority only).
    pub fn set_reward_rate(ctx: Context<SetRewardRate>, new_rate_bps: u16) -> Result<()> {
        let vault = &mut ctx.accounts.vault;
        require!(
            ctx.accounts.authority.key() == vault.authority,
            ChainMetricsError::Unauthorized
        );
        require!(new_rate_bps <= 10000, ChainMetricsError::InvalidRewardRate);

        vault.reward_rate_bps = new_rate_bps;
        Ok(())
    }

    // ── Verification Badge (Soulbound) ────────────────────────────

    /// Mint a soulbound verification badge for a startup.
    pub fn mint_badge(
        ctx: Context<MintBadge>,
        startup_id: u64,
        trust_score: u64,
    ) -> Result<()> {
        let registry = &ctx.accounts.registry;
        require!(
            ctx.accounts.authority.key() == registry.authority,
            ChainMetricsError::Unauthorized
        );
        require!(trust_score <= 100, ChainMetricsError::InvalidTrustScore);

        let badge = &mut ctx.accounts.badge;
        badge.startup_id = startup_id;
        badge.owner = ctx.accounts.recipient.key();
        badge.trust_score = trust_score;
        badge.verified_at = Clock::get()?.unix_timestamp;
        badge.verifier = ctx.accounts.authority.key();
        badge.is_locked = true; // Soulbound — non-transferable
        // Assign initial tier based on trust score
        badge.tier = compute_badge_tier(trust_score);
        badge.tier_upgraded_at = badge.verified_at;
        badge.bump = ctx.bumps.badge;

        emit!(BadgeMinted {
            startup_id,
            owner: ctx.accounts.recipient.key(),
            trust_score,
            tier: badge.tier,
        });

        Ok(())
    }

    /// Update the trust score on an existing badge (authority only).
    pub fn update_badge_score(
        ctx: Context<UpdateBadge>,
        new_trust_score: u64,
    ) -> Result<()> {
        let registry = &ctx.accounts.registry;
        require!(
            ctx.accounts.authority.key() == registry.authority,
            ChainMetricsError::Unauthorized
        );
        require!(new_trust_score <= 100, ChainMetricsError::InvalidTrustScore);

        let badge = &mut ctx.accounts.badge;
        let old_score = badge.trust_score;
        badge.trust_score = new_trust_score;

        emit!(BadgeScoreUpdated {
            startup_id: badge.startup_id,
            old_score,
            new_score: new_trust_score,
        });
        Ok(())
    }

    /// Upgrade a verification badge to a higher tier.
    /// Tiers: 0=Bronze (≥50), 1=Silver (≥60), 2=Gold (≥75), 3=Platinum (≥90).
    /// Requires authority permission and sufficient trust score.
    pub fn upgrade_badge_tier(ctx: Context<UpdateBadge>) -> Result<()> {
        let registry = &ctx.accounts.registry;
        require!(
            ctx.accounts.authority.key() == registry.authority,
            ChainMetricsError::Unauthorized
        );

        let badge = &mut ctx.accounts.badge;
        require!(badge.tier < 3, ChainMetricsError::BadgeAtMaxTier);

        let next_tier = badge.tier + 1;
        let min_score = match next_tier {
            1 => 60,
            2 => 75,
            3 => 90,
            _ => return Err(ChainMetricsError::InvalidBadgeTier.into()),
        };

        require!(
            badge.trust_score >= min_score,
            ChainMetricsError::TierTrustScoreTooLow
        );

        badge.tier = next_tier;
        badge.tier_upgraded_at = Clock::get()?.unix_timestamp;

        emit!(BadgeTierUpgraded {
            startup_id: badge.startup_id,
            new_tier: next_tier,
            trust_score: badge.trust_score,
            upgraded_at: badge.tier_upgraded_at,
        });

        Ok(())
    }

    // ── Governance (DAO) ──────────────────────────────────────────

    /// Initialize the DAO configuration.
    pub fn initialize_dao(
        ctx: Context<InitializeDao>,
        voting_delay: i64,
        voting_period: i64,
        proposal_threshold: u64,
        quorum_percentage: u8,
    ) -> Result<()> {
        require!(quorum_percentage > 0 && quorum_percentage <= 100, ChainMetricsError::InvalidQuorum);
        require!(voting_period > 0, ChainMetricsError::InvalidVotingPeriod);
        require!(voting_delay >= 0, ChainMetricsError::InvalidVotingPeriod);
        // Prevent timestamp overflow: delay + period must fit in i64
        voting_delay.checked_add(voting_period)
            .ok_or(ChainMetricsError::InvalidVotingPeriod)?;

        let dao = &mut ctx.accounts.dao;
        dao.authority = ctx.accounts.authority.key();
        dao.voting_delay = voting_delay;
        dao.voting_period = voting_period;
        dao.proposal_threshold = proposal_threshold;
        dao.quorum_percentage = quorum_percentage;
        dao.proposal_count = 0;
        dao.bump = ctx.bumps.dao;
        Ok(())
    }

    /// Create a governance proposal. Proposer must have sufficient staked CMT.
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        title: String,
        description: String,
    ) -> Result<()> {
        require!(title.len() > 0 && title.len() <= 200, ChainMetricsError::TitleTooLong);
        require!(description.len() <= 1000, ChainMetricsError::DescriptionTooLong);

        // Verify proposer meets threshold via staked amount
        let investor = &ctx.accounts.investor;
        let dao = &ctx.accounts.dao;
        require!(
            investor.staked_amount >= dao.proposal_threshold,
            ChainMetricsError::InsufficientStakeForProposal
        );

        let dao = &mut ctx.accounts.dao;
        dao.proposal_count += 1;

        let now = Clock::get()?.unix_timestamp;
        let proposal = &mut ctx.accounts.proposal;
        proposal.id = dao.proposal_count;
        proposal.proposer = ctx.accounts.proposer.key();
        proposal.title = title;
        proposal.description = description;
        proposal.created_at = now;
        proposal.voting_starts = now + dao.voting_delay;
        proposal.voting_ends = now + dao.voting_delay + dao.voting_period;
        proposal.for_votes = 0;
        proposal.against_votes = 0;
        proposal.abstain_votes = 0;
        proposal.executed = false;
        proposal.cancelled = false;
        proposal.bump = ctx.bumps.proposal;

        emit!(ProposalCreated {
            id: dao.proposal_count,
            proposer: ctx.accounts.proposer.key(),
            title: proposal.title.clone(),
        });

        Ok(())
    }

    /// Cast a vote on a proposal, weighted by staked CMT tokens.
    pub fn cast_vote(
        ctx: Context<CastVote>,
        support: u8, // 0 = Against, 1 = For, 2 = Abstain
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let proposal = &mut ctx.accounts.proposal;

        require!(now >= proposal.voting_starts, ChainMetricsError::VotingNotStarted);
        require!(now <= proposal.voting_ends, ChainMetricsError::VotingEnded);
        require!(!proposal.cancelled, ChainMetricsError::ProposalCancelled);

        let vote_record = &mut ctx.accounts.vote_record;
        require!(!vote_record.has_voted, ChainMetricsError::AlreadyVoted);

        // Weight votes by staked CMT tokens — must stake to vote (prevents Sybil attacks)
        let investor = &ctx.accounts.investor;
        require!(investor.staked_amount > 0, ChainMetricsError::InsufficientStakeToVote);
        let weight: u64 = investor.staked_amount / CMT_DECIMALS; // Convert from base units to whole tokens
        require!(weight > 0, ChainMetricsError::InsufficientStakeToVote);

        match support {
            0 => proposal.against_votes = proposal.against_votes.checked_add(weight)
                .ok_or(ChainMetricsError::AmountTooLarge)?,
            1 => proposal.for_votes = proposal.for_votes.checked_add(weight)
                .ok_or(ChainMetricsError::AmountTooLarge)?,
            2 => proposal.abstain_votes = proposal.abstain_votes.checked_add(weight)
                .ok_or(ChainMetricsError::AmountTooLarge)?,
            _ => return Err(ChainMetricsError::InvalidVoteType.into()),
        }

        vote_record.voter = ctx.accounts.voter.key();
        vote_record.proposal_id = proposal.id;
        vote_record.support = support;
        vote_record.weight = weight;
        vote_record.has_voted = true;
        vote_record.bump = ctx.bumps.vote_record;

        Ok(())
    }

    /// Execute a passed proposal (authority only, after voting ends).
    /// Enforces quorum: total participating vote weight >= (total_staked * quorum_pct / 100).
    pub fn execute_proposal(ctx: Context<ExecuteProposal>) -> Result<()> {
        let dao = &ctx.accounts.dao;
        require!(
            ctx.accounts.authority.key() == dao.authority,
            ChainMetricsError::Unauthorized
        );

        let vault = &ctx.accounts.vault;
        let proposal = &mut ctx.accounts.proposal;
        let now = Clock::get()?.unix_timestamp;
        require!(now > proposal.voting_ends, ChainMetricsError::VotingNotEnded);
        require!(!proposal.executed, ChainMetricsError::ProposalAlreadyExecuted);
        require!(!proposal.cancelled, ChainMetricsError::ProposalCancelled);

        // Compute total votes participated (in whole tokens, matching vote weight)
        let total_votes = proposal.for_votes
            .checked_add(proposal.against_votes)
            .and_then(|v| v.checked_add(proposal.abstain_votes))
            .ok_or(ChainMetricsError::AmountTooLarge)?;

        // Quorum: fraction of total staked supply that must participate.
        // vault.total_staked is in base units; divide by CMT_DECIMALS to match whole-token vote weights.
        let total_stake_whole = vault.total_staked / CMT_DECIMALS;
        let quorum_required = total_stake_whole
            .checked_mul(dao.quorum_percentage as u64)
            .and_then(|v| v.checked_div(100))
            .unwrap_or(0);

        require!(total_votes >= quorum_required, ChainMetricsError::QuorumNotMet);

        // Check if proposal passed (for > against)
        require!(
            proposal.for_votes > proposal.against_votes,
            ChainMetricsError::ProposalNotPassed
        );

        proposal.executed = true;

        emit!(ProposalExecuted {
            id: proposal.id,
            for_votes: proposal.for_votes,
            against_votes: proposal.against_votes,
            abstain_votes: proposal.abstain_votes,
            executed_at: now,
        });

        Ok(())
    }

    /// Cancel a proposal (authority or proposer, before execution).
    pub fn cancel_proposal(ctx: Context<CancelProposal>) -> Result<()> {
        let proposal = &mut ctx.accounts.proposal;
        require!(!proposal.executed, ChainMetricsError::ProposalAlreadyExecuted);
        require!(!proposal.cancelled, ChainMetricsError::ProposalCancelled);

        // Only authority or proposer can cancel
        let dao = &ctx.accounts.dao;
        let caller = ctx.accounts.caller.key();
        require!(
            caller == dao.authority || caller == proposal.proposer,
            ChainMetricsError::Unauthorized
        );

        proposal.cancelled = true;

        Ok(())
    }

    // ── Account Closure (rent reclaim) ────────────────────────────

    /// Close an investor account after fully unstaking. Reclaims rent to user.
    pub fn close_investor_account(ctx: Context<CloseInvestorAccount>) -> Result<()> {
        let investor = &ctx.accounts.investor;
        require!(investor.user == ctx.accounts.user.key(), ChainMetricsError::Unauthorized);
        require!(investor.staked_amount == 0, ChainMetricsError::StillLocked);
        require!(investor.pending_rewards == 0, ChainMetricsError::NoRewards);
        // Account will be closed by Anchor's `close` attribute
        Ok(())
    }

    /// Close a vote record after proposal is finalized. Reclaims rent to voter.
    pub fn close_vote_record(ctx: Context<CloseVoteRecord>) -> Result<()> {
        let proposal = &ctx.accounts.proposal;
        // Only allow closing after voting period ends
        let now = Clock::get()?.unix_timestamp;
        require!(
            now > proposal.voting_ends || proposal.executed || proposal.cancelled,
            ChainMetricsError::VotingNotEnded
        );
        Ok(())
    }
}

// ── Constants ─────────────────────────────────────────────────────

pub const LOCK_PERIOD: i64 = 30 * 24 * 60 * 60; // 30 days in seconds
pub const CMT_DECIMALS: u64 = 1_000_000; // 6 decimals
pub const PRO_THRESHOLD: u64 = 5_000 * CMT_DECIMALS; // 5,000 CMT
pub const WHALE_THRESHOLD: u64 = 50_000 * CMT_DECIMALS; // 50,000 CMT

pub fn compute_tier(amount: u64) -> u8 {
    if amount >= WHALE_THRESHOLD {
        2 // Whale
    } else if amount >= PRO_THRESHOLD {
        1 // Pro
    } else {
        0 // Basic
    }
}

// ── Account Contexts ──────────────────────────────────────────────

#[derive(Accounts)]
pub struct InitializeToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + TokenConfig::INIT_SPACE,
        seeds = [b"token_config"],
        bump,
    )]
    pub token_config: Account<'info, TokenConfig>,

    #[account(
        init,
        payer = authority,
        mint::decimals = 6,
        mint::authority = token_config,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub authority_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(seeds = [b"token_config"], bump = token_config.bump)]
    pub token_config: Account<'info, TokenConfig>,

    #[account(mut, address = token_config.mint)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub to: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    pub authority: Signer<'info>,

    #[account(mut)]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub from: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DelegateVotes<'info> {
    #[account(mut)]
    pub delegator: Signer<'info>,

    #[account(
        init_if_needed,
        payer = delegator,
        space = 8 + VoteDelegation::INIT_SPACE,
        seeds = [b"delegation", delegator.key().as_ref()],
        bump,
    )]
    pub delegation: Account<'info, VoteDelegation>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeRegistry<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Registry::INIT_SPACE,
        seeds = [b"registry"],
        bump,
    )]
    pub registry: Account<'info, Registry>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(name: String, category: String, metadata_uri: String)]
pub struct RegisterStartup<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut, seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,

    #[account(
        init,
        payer = owner,
        space = 8 + StartupAccount::INIT_SPACE,
        seeds = [b"startup", &(registry.startup_count + 1).to_le_bytes()],
        bump,
    )]
    pub startup: Account<'info, StartupAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PublishMetrics<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut, seeds = [b"startup", &startup.id.to_le_bytes()], bump = startup.bump)]
    pub startup: Account<'info, StartupAccount>,

    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + MetricsAccount::INIT_SPACE,
        seeds = [b"metrics", &startup.id.to_le_bytes()],
        bump,
    )]
    pub metrics: Account<'info, MetricsAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct VerifyStartup<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,

    #[account(
        mut,
        seeds = [b"startup", &startup.id.to_le_bytes()],
        bump = startup.bump,
    )]
    pub startup: Account<'info, StartupAccount>,
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = authority,
        space = 8 + StakingVault::INIT_SPACE,
        seeds = [b"vault"],
        bump,
    )]
    pub vault: Account<'info, StakingVault>,

    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut, seeds = [b"vault"], bump = vault.bump)]
    pub vault: Account<'info, StakingVault>,

    #[account(
        init_if_needed,
        payer = user,
        space = 8 + InvestorAccount::INIT_SPACE,
        seeds = [b"investor", user.key().as_ref()],
        bump,
    )]
    pub investor: Account<'info, InvestorAccount>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key() @ ChainMetricsError::Unauthorized,
        constraint = user_token_account.mint == vault.mint @ ChainMetricsError::MintMismatch,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = vault.mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, anchor_spl::associated_token::AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut, seeds = [b"vault"], bump = vault.bump)]
    pub vault: Account<'info, StakingVault>,

    #[account(
        mut,
        seeds = [b"investor", user.key().as_ref()],
        bump = investor.bump,
    )]
    pub investor: Account<'info, InvestorAccount>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key() @ ChainMetricsError::Unauthorized,
        constraint = user_token_account.mint == vault.mint @ ChainMetricsError::MintMismatch,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = vault.mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct DistributeRewards<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(seeds = [b"vault"], bump = vault.bump)]
    pub vault: Account<'info, StakingVault>,

    #[account(
        mut,
        seeds = [b"investor", investor.user.as_ref()],
        bump = investor.bump,
        constraint = investor.user != Pubkey::default() @ ChainMetricsError::InvestorNotFound,
    )]
    pub investor: Account<'info, InvestorAccount>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(seeds = [b"vault"], bump = vault.bump)]
    pub vault: Account<'info, StakingVault>,

    #[account(
        mut,
        seeds = [b"investor", user.key().as_ref()],
        bump = investor.bump,
        constraint = investor.user == user.key() @ ChainMetricsError::Unauthorized,
    )]
    pub investor: Account<'info, InvestorAccount>,

    #[account(
        mut,
        constraint = user_token_account.owner == user.key() @ ChainMetricsError::Unauthorized,
        constraint = user_token_account.mint == vault.mint @ ChainMetricsError::MintMismatch,
    )]
    pub user_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = vault.mint,
        associated_token::authority = vault,
    )]
    pub vault_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetRewardRate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut, seeds = [b"vault"], bump = vault.bump)]
    pub vault: Account<'info, StakingVault>,
}

#[derive(Accounts)]
#[instruction(startup_id: u64)]
pub struct MintBadge<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,

    /// CHECK: The recipient of the badge, does not need to sign.
    pub recipient: UncheckedAccount<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + VerificationBadge::INIT_SPACE,
        seeds = [b"badge", &startup_id.to_le_bytes()],
        bump,
    )]
    pub badge: Account<'info, VerificationBadge>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateBadge<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(seeds = [b"registry"], bump = registry.bump)]
    pub registry: Account<'info, Registry>,

    #[account(
        mut,
        seeds = [b"badge", &badge.startup_id.to_le_bytes()],
        bump = badge.bump,
    )]
    pub badge: Account<'info, VerificationBadge>,
}

#[derive(Accounts)]
pub struct InitializeDao<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + DaoConfig::INIT_SPACE,
        seeds = [b"dao"],
        bump,
    )]
    pub dao: Account<'info, DaoConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String, description: String)]
pub struct CreateProposal<'info> {
    #[account(mut)]
    pub proposer: Signer<'info>,

    #[account(mut, seeds = [b"dao"], bump = dao.bump)]
    pub dao: Account<'info, DaoConfig>,

    /// Investor account to verify proposer meets threshold.
    #[account(
        seeds = [b"investor", proposer.key().as_ref()],
        bump = investor.bump,
    )]
    pub investor: Account<'info, InvestorAccount>,

    #[account(
        init,
        payer = proposer,
        space = 8 + Proposal::INIT_SPACE,
        seeds = [b"proposal", &(dao.proposal_count + 1).to_le_bytes()],
        bump,
    )]
    pub proposal: Account<'info, Proposal>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CastVote<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,

    /// Investor account to read staked amount for vote weight.
    #[account(
        seeds = [b"investor", voter.key().as_ref()],
        bump = investor.bump,
    )]
    pub investor: Account<'info, InvestorAccount>,

    #[account(
        init_if_needed,
        payer = voter,
        space = 8 + VoteRecord::INIT_SPACE,
        seeds = [b"vote", &proposal.id.to_le_bytes(), voter.key().as_ref()],
        bump,
    )]
    pub vote_record: Account<'info, VoteRecord>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(seeds = [b"dao"], bump = dao.bump)]
    pub dao: Account<'info, DaoConfig>,

    /// Staking vault — used to compute quorum threshold
    #[account(seeds = [b"vault"], bump = vault.bump)]
    pub vault: Account<'info, StakingVault>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
}

#[derive(Accounts)]
pub struct CancelProposal<'info> {
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(seeds = [b"dao"], bump = dao.bump)]
    pub dao: Account<'info, DaoConfig>,

    #[account(mut)]
    pub proposal: Account<'info, Proposal>,
}

#[derive(Accounts)]
pub struct CloseInvestorAccount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        close = user,
        seeds = [b"investor", user.key().as_ref()],
        bump = investor.bump,
        constraint = investor.user == user.key() @ ChainMetricsError::Unauthorized,
    )]
    pub investor: Account<'info, InvestorAccount>,
}

#[derive(Accounts)]
pub struct CloseVoteRecord<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    pub proposal: Account<'info, Proposal>,

    #[account(
        mut,
        close = voter,
        seeds = [b"vote", &proposal.id.to_le_bytes(), voter.key().as_ref()],
        bump = vote_record.bump,
        constraint = vote_record.voter == voter.key() @ ChainMetricsError::Unauthorized,
    )]
    pub vote_record: Account<'info, VoteRecord>,
}

// ── Events ────────────────────────────────────────────────────────

#[event]
pub struct StartupRegistered {
    pub id: u64,
    pub owner: Pubkey,
    pub name: String,
}

#[event]
pub struct MetricsPublished {
    pub id: u64,
    pub proof_hash: [u8; 32],
    pub timestamp: i64,
}

#[event]
pub struct Staked {
    pub investor: Pubkey,
    pub amount: u64,
    pub tier: u8,
}

#[event]
pub struct Unstaked {
    pub investor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct RewardsClaimed {
    pub investor: Pubkey,
    pub amount: u64,
}

#[event]
pub struct BadgeMinted {
    pub startup_id: u64,
    pub owner: Pubkey,
    pub trust_score: u64,
    pub tier: u8,
}

#[event]
pub struct BadgeScoreUpdated {
    pub startup_id: u64,
    pub old_score: u64,
    pub new_score: u64,
}

#[event]
pub struct BadgeTierUpgraded {
    pub startup_id: u64,
    pub new_tier: u8,
    pub trust_score: u64,
    pub upgraded_at: i64,
}

#[event]
pub struct StartupVerified {
    pub id: u64,
    pub verified_at: i64,
    pub verifier: Pubkey,
}

#[event]
pub struct TrustScoreUpdated {
    pub id: u64,
    pub old_score: u64,
    pub new_score: u64,
    pub updated_at: i64,
}

#[event]
pub struct VotesDelegated {
    pub delegator: Pubkey,
    pub delegatee: Pubkey,
}

#[event]
pub struct ProposalCreated {
    pub id: u64,
    pub proposer: Pubkey,
    pub title: String,
}

#[event]
pub struct ProposalExecuted {
    pub id: u64,
    pub for_votes: u64,
    pub against_votes: u64,
    pub abstain_votes: u64,
    pub executed_at: i64,
}

// ── Helper Functions ──────────────────────────────────────────────

/// Compute initial badge tier from trust score.
/// Bronze (0): score 50-59
/// Silver (1): score 60-74
/// Gold (2):   score 75-89
/// Platinum (3): score 90-100
pub fn compute_badge_tier(trust_score: u64) -> u8 {
    if trust_score >= 90 { 3 }
    else if trust_score >= 75 { 2 }
    else if trust_score >= 60 { 1 }
    else { 0 }
}
