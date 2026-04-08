# Database Schema

ChainTrust uses Supabase (PostgreSQL) with Row Level Security (RLS) enabled on all tables.

## Tables

### user_roles

User-to-role mapping. Each user has exactly one role.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto-generated |
| user_id | UUID | FK -> auth.users, ON DELETE CASCADE |
| role | app_role | ENUM: admin, investor, startup |

UNIQUE constraint on (user_id, role).

### profiles

Auto-created on user signup via `handle_new_user()` trigger.

| Column | Type | Default |
|--------|------|---------|
| id | UUID | PK |
| user_id | UUID | FK -> auth.users, UNIQUE |
| display_name | TEXT | - |
| email | TEXT | - |
| avatar_url | TEXT | - |
| visibility_public | BOOLEAN | false |
| created_at | TIMESTAMPTZ | now() |
| updated_at | TIMESTAMPTZ | now() |

### startups

Core startup data. Published metrics are duplicated here for fast queries.

| Column | Type | Default |
|--------|------|---------|
| id | UUID | PK |
| user_id | UUID | FK -> auth.users |
| name | TEXT | NOT NULL |
| category | TEXT | 'SaaS' |
| blockchain | TEXT | 'Solana' |
| mrr | INTEGER | 0 |
| users | INTEGER | 0 |
| growth_rate | NUMERIC(6,2) | 0 |
| sustainability_score | INTEGER | 0 |
| energy_score | INTEGER | 0 |
| carbon_score | INTEGER | 0 |
| tokenomics_score | INTEGER | 0 |
| governance_score | INTEGER | 0 |
| verified | BOOLEAN | false |
| trust_score | INTEGER | 50 |
| description | TEXT | - |
| website | TEXT | - |
| carbon_offset_tonnes | NUMERIC(10,2) | 0 |
| energy_per_transaction | TEXT | '0.001 kWh' |
| token_concentration_pct | NUMERIC(5,2) | 0 |
| whale_concentration | NUMERIC(5,2) | 0 |
| chain_type | TEXT | 'PoS' |
| inflation_rate | NUMERIC(5,2) | 0 |
| team_size | INTEGER | 1 |
| treasury | NUMERIC(14,2) | 0 |
| created_at | TIMESTAMPTZ | now() |

### metrics_history

Monthly metrics snapshots. Each row = one month of data for one startup.

| Column | Type | Default |
|--------|------|---------|
| id | UUID | PK |
| startup_id | UUID | FK -> startups, CASCADE |
| month | TEXT | - |
| month_date | DATE | CURRENT_DATE |
| revenue | NUMERIC(14,2) | 0 |
| costs | NUMERIC(14,2) | 0 |
| mau | INTEGER | 0 |
| transactions | INTEGER | 0 |
| carbon_offsets | NUMERIC(10,2) | 0 |
| growth_rate | NUMERIC(6,2) | 0 |
| created_at | TIMESTAMPTZ | now() |

### proposals

DAO governance proposals. Vote counts updated via trigger.

| Column | Type | Default |
|--------|------|---------|
| id | UUID | PK |
| title | TEXT | NOT NULL |
| description | TEXT | - |
| proposer | TEXT | - |
| votes_for | INTEGER | 0 |
| votes_against | INTEGER | 0 |
| votes_abstain | INTEGER | 0 |
| status | TEXT | 'Active' |
| ends_at | TIMESTAMPTZ | - |
| created_at | TIMESTAMPTZ | now() |

### votes

Individual vote records. Trigger auto-updates proposal counts.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| proposal_id | UUID | FK -> proposals, CASCADE |
| user_id | UUID | FK -> auth.users, CASCADE |
| vote | TEXT | CHECK: 'For', 'Against', 'Abstain' |
| created_at | TIMESTAMPTZ | now() |

UNIQUE constraint on (proposal_id, user_id).

### pledges

Sustainability pledges made by startups.

| Column | Type | Default |
|--------|------|---------|
| id | UUID | PK |
| startup_id | UUID | FK -> startups, CASCADE |
| pledge_text | TEXT | - |
| committed_date | DATE | CURRENT_DATE |
| status | TEXT | 'active' |
| created_at | TIMESTAMPTZ | now() |

### startup_audit_log

Immutable record of every change to startup data.

| Column | Type | Default |
|--------|------|---------|
| id | UUID | PK |
| startup_id | UUID | FK -> startups, CASCADE |
| user_id | UUID | FK -> auth.users, CASCADE |
| field_changed | TEXT | - |
| old_value | TEXT | - |
| new_value | TEXT | - |
| tx_hash | TEXT | Solana transaction hash |
| changed_at | TIMESTAMPTZ | now() |

### funding_rounds

Fundraising history for startups.

| Column | Type | Default |
|--------|------|---------|
| id | UUID | PK |
| startup_id | UUID | FK -> startups, CASCADE |
| round_name | TEXT | - |
| amount | NUMERIC(14,2) | 0 |
| valuation | NUMERIC(14,2) | 0 |
| round_date | DATE | - |
| investors | TEXT[] | Investor names array |
| created_at | TIMESTAMPTZ | now() |

### token_unlocks

Token vesting and unlock schedule.

| Column | Type | Default |
|--------|------|---------|
| id | UUID | PK |
| startup_id | UUID | FK -> startups, CASCADE |
| unlock_date | DATE | - |
| amount | NUMERIC(14,0) | 0 |
| category | TEXT | - |
| unlocked | BOOLEAN | false |
| created_at | TIMESTAMPTZ | now() |

## Functions

| Function | Returns | Purpose |
|----------|---------|---------|
| `has_role(user_id, role)` | BOOLEAN | Check if user has a specific role (security definer) |
| `get_user_role(user_id)` | app_role | Get user's primary role |
| `handle_new_user()` | TRIGGER | Auto-create profile on auth.users INSERT |
| `update_updated_at_column()` | TRIGGER | Auto-update profiles.updated_at |
| `update_proposal_votes()` | TRIGGER | Auto-update proposal vote counts on votes INSERT |

## Statistics

- **Tables:** 10
- **Total Columns:** 127
- **Foreign Keys:** 12
- **RLS Policies:** 24
- **Database Functions:** 5
- **Triggers:** 3
