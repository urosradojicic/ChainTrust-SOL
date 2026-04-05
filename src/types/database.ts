export interface DbStartup {
  id: string;
  name: string;
  category: string;
  blockchain: string;
  mrr: number;
  users: number;
  growth_rate: number;
  sustainability_score: number;
  energy_score: number;
  carbon_score: number;
  tokenomics_score: number;
  governance_score: number;
  verified: boolean;
  logo_url: string | null;
  description: string | null;
  founded_date: string | null;
  website: string | null;
  carbon_offset_tonnes: number;
  energy_per_transaction: string | null;
  token_concentration_pct: number;
  trust_score: number;
  chain_type: string | null;
  inflation_rate: number;
  team_size: number;
  treasury: number;
  energy_consumption: number;
  whale_concentration: number;
  created_at: string;
}

export interface DbMetricsHistory {
  id: string;
  startup_id: string;
  month: string;
  month_date: string;
  revenue: number;
  costs: number;
  mau: number;
  transactions: number;
  carbon_offsets: number;
  growth_rate: number;
}

export interface DbPledge {
  id: string;
  startup_id: string;
  pledge_text: string;
  committed_date: string;
  status: string;
}

export interface DbAuditEntry {
  id: string;
  startup_id: string;
  user_id: string;
  field_changed: string;
  old_value: string | null;
  new_value: string | null;
  tx_hash: string;
  changed_at: string;
}

export interface DbProposal {
  id: string;
  title: string;
  description: string | null;
  proposer: string;
  votes_for: number;
  votes_against: number;
  votes_abstain: number;
  status: string;
  ends_at: string | null;
}

export interface DbVote {
  id: string;
  proposal_id: string;
  user_id: string;
  vote: 'For' | 'Against' | 'Abstain';
  created_at: string;
}

export interface DbFundingRound {
  id: string;
  startup_id: string;
  round_name: string;
  amount: number;
  valuation: number;
  round_date: string;
  investors: string[];
  created_at: string;
}

export interface DbTokenUnlock {
  id: string;
  startup_id: string;
  unlock_date: string;
  amount: number;
  category: string;
  unlocked: boolean;
  created_at: string;
}
