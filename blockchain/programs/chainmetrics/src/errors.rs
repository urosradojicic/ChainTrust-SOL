use anchor_lang::prelude::*;

#[error_code]
pub enum ChainMetricsError {
    #[msg("Unauthorized: only the authority can perform this action")]
    Unauthorized,

    #[msg("Not the startup owner")]
    NotStartupOwner,

    #[msg("Startup name must be 1-100 characters")]
    NameTooLong,

    #[msg("Category must be 1-50 characters")]
    CategoryTooLong,

    #[msg("Metadata URI too long (max 200 chars)")]
    UriTooLong,

    #[msg("Cannot use zero amount")]
    ZeroAmount,

    #[msg("Amount too large, would overflow")]
    AmountTooLarge,

    #[msg("Insufficient staked amount")]
    InsufficientStake,

    #[msg("Tokens are still locked")]
    StillLocked,

    #[msg("No pending rewards to claim")]
    NoRewards,

    #[msg("Proposal title must be 1-200 characters")]
    TitleTooLong,

    #[msg("Proposal description too long (max 1000 chars)")]
    DescriptionTooLong,

    #[msg("Voting has not started yet")]
    VotingNotStarted,

    #[msg("Voting period has ended")]
    VotingEnded,

    #[msg("Voting period has not ended yet")]
    VotingNotEnded,

    #[msg("Proposal has been cancelled")]
    ProposalCancelled,

    #[msg("Already voted on this proposal")]
    AlreadyVoted,

    #[msg("Invalid vote type (must be 0, 1, or 2)")]
    InvalidVoteType,

    #[msg("Startup not found or not initialized")]
    StartupNotFound,

    #[msg("Invalid metrics: active_users cannot exceed total_users")]
    InvalidMetrics,

    #[msg("Trust score must be between 0 and 100")]
    InvalidTrustScore,

    #[msg("Investor account not found")]
    InvestorNotFound,

    #[msg("Insufficient staked CMT to create proposal")]
    InsufficientStakeForProposal,

    #[msg("Proposal has already been executed")]
    ProposalAlreadyExecuted,

    #[msg("Proposal did not pass (for votes must exceed against votes)")]
    ProposalNotPassed,

    #[msg("Invalid quorum percentage (must be 1-100)")]
    InvalidQuorum,

    #[msg("Voting period must be greater than 0")]
    InvalidVotingPeriod,

    #[msg("Invalid reward rate (max 10000 basis points = 100%)")]
    InvalidRewardRate,

    #[msg("Token account mint does not match expected mint")]
    MintMismatch,

    #[msg("Must stake CMT tokens to vote")]
    InsufficientStakeToVote,
}
