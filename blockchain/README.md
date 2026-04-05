# ChainMetrics Solana Programs

Anchor programs for the ChainTrust platform, targeting **Solana Devnet**.

## Programs

All functionality lives in a single Anchor program (`chainmetrics`):

| Module | Purpose |
|--------|---------|
| `initialize_token` / `mint_tokens` / `burn_tokens` | SPL token (CMT) with mint authority |
| `register_startup` / `publish_metrics` / `verify_startup` | Core registry — startups register and publish metrics with proof hashes |
| `stake` / `unstake` / `claim_rewards` | Stake CMT tokens, earn tier status (Basic/Pro/Whale) |
| `mint_badge` | Soulbound verification badges for verified startups |
| `create_proposal` / `cast_vote` | On-chain governance (DAO) |

## Deploy (Free — Devnet)

```bash
# 1. Install Solana CLI & Anchor
sh -c "$(curl -sSfL https://release.anza.xyz/stable/install)"
cargo install --git https://github.com/coral-xyz/anchor avm --force
avm install latest && avm use latest

# 2. Create a wallet (if you don't have one)
solana-keygen new

# 3. Set cluster to devnet
solana config set --url devnet

# 4. Get free Devnet SOL
solana airdrop 2

# 5. Build the program
cd blockchain
anchor build

# 6. Deploy to Devnet
anchor deploy

# 7. Copy the program ID into src/lib/contracts.ts
```

## How It Works

1. **Startup registers** → calls `register_startup(name, category, metadata_uri)` → stored in a PDA account
2. **Startup publishes metrics** → calls `publish_metrics(...)` with a `proof_hash` (SHA-256)
3. **Anyone can verify** → read the `metrics` PDA and compare the `proof_hash` against locally computed hash
4. **Proof hash** = `SHA-256(mrr | users | activeUsers | burnRate | runway | growthRate | carbonOffset)`
5. If the hash matches, the data hasn't been tampered with since it was published on-chain

## Account Model (PDAs)

| Seed | Account Type |
|------|-------------|
| `["registry"]` | Global registry state |
| `["startup", id]` | Individual startup data |
| `["metrics", startup_id]` | Latest metrics for a startup |
| `["vault"]` | Global staking vault |
| `["investor", wallet]` | Individual investor staking data |
| `["badge", startup_id]` | Soulbound verification badge |
| `["dao"]` | DAO configuration |
| `["proposal", id]` | Individual governance proposal |
| `["vote", proposal_id, voter]` | Vote record |
| `["token_config"]` | CMT token mint configuration |

## Cost

$0 — Devnet is free. SOL is available from faucets.
