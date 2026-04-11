# Deploying ChainTrust to Solana Devnet

> This guide takes you from zero to a fully live ChainTrust deployment on Solana devnet.
> After deployment, all blockchain transactions will be REAL and verifiable on Solana Explorer.

---

## Prerequisites

1. **Rust** — Install from https://rustup.rs
2. **Solana CLI** — Install from https://docs.solana.com/cli/install-solana-cli-tools
3. **Anchor CLI** — Install with `cargo install --git https://github.com/coral-xyz/anchor avm --locked`
4. **Node.js 18+** — For the frontend

## Step 1: Set Up Solana Wallet

```bash
# Generate a new keypair for devnet
solana-keygen new --outfile ~/.config/solana/devnet.json

# Set the config to devnet
solana config set --url devnet --keypair ~/.config/solana/devnet.json

# Get free SOL for deployment (~2 SOL needed)
solana airdrop 2
solana airdrop 2
# Run twice — you need ~4 SOL total for program deployment + account creation
```

## Step 2: Build the Anchor Program

```bash
cd blockchain

# Build the program
anchor build

# Get the program ID from the build
solana address -k target/deploy/chainmetrics-keypair.json
# This will output something like: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
```

## Step 3: Update Program ID

Take the program ID from Step 2 and update it in two places:

1. **Anchor.toml** — Update `[programs.devnet]` section:
   ```toml
   [programs.devnet]
   chainmetrics = "YOUR_PROGRAM_ID_HERE"
   ```

2. **Smart Contract** — Update `declare_id!` in `blockchain/programs/chainmetrics/src/lib.rs`:
   ```rust
   declare_id!("YOUR_PROGRAM_ID_HERE");
   ```

3. **Frontend** — Create `.env` file in project root:
   ```env
   VITE_SOLANA_PROGRAM_ID=YOUR_PROGRAM_ID_HERE
   VITE_SOLANA_CLUSTER=devnet
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
   ```

4. Rebuild after updating the ID:
   ```bash
   anchor build
   ```

## Step 4: Deploy to Devnet

```bash
cd blockchain
anchor deploy --provider.cluster devnet
```

You should see output like:
```
Deploying workspace: https://api.devnet.solana.com
Upgrade authority: ~/.config/solana/devnet.json
Deploying program "chainmetrics"...
Program Id: YOUR_PROGRAM_ID_HERE
Deploy success
```

## Step 5: Initialize the Program

After deploying, you need to initialize the registry, vault, and DAO.
Run the initialization script:

```bash
# Initialize the registry (required for startup registration)
anchor run initialize

# Or manually via Solana CLI:
# The frontend will attempt initialization on first use
```

Alternatively, the frontend hooks will attempt to read the registry and handle
uninitialized state gracefully.

## Step 6: Start the Frontend

```bash
# Back in the project root
cd ..
npm install
npm run dev
```

Open http://localhost:8080 — the Chain Status indicator in the navbar should show "Live on Devnet" with a green dot.

## Step 7: Test the Full Flow

1. Connect a Phantom/Solflare wallet (set to devnet)
2. Get devnet SOL: https://faucet.solana.com
3. Register a startup — you should see a REAL transaction on Solana Explorer
4. Publish metrics — the SHA-256 proof hash will be stored on-chain
5. Go to /verify — enter the startup ID and verify independently

## Verification

After deployment, you can verify everything is working:

```bash
# Check program is deployed
solana program show YOUR_PROGRAM_ID

# Check registry PDA exists (after initialization)
solana account $(solana find-program-derived-address YOUR_PROGRAM_ID registry)
```

## Troubleshooting

- **"Insufficient funds"** — Run `solana airdrop 2` again
- **"Program failed to compile"** — Make sure Rust and Anchor versions match (Anchor 0.30.1)
- **"Transaction simulation failed"** — Check wallet is on devnet and has SOL
- **Chain Status shows "Demo Mode"** — The program ID in `.env` doesn't match a deployed program
- **Transaction confirmed but no data** — Registry may not be initialized yet

## What Changes After Deployment

| Before (Demo Mode) | After (Live) |
|--------------------|----|
| Fake transaction signatures (DEMO_xxx) | Real signatures on Solana Explorer |
| Chain Status: yellow "Demo Mode" | Chain Status: green "Live on Devnet" |
| /verify shows "No Data Found" | /verify shows real on-chain data |
| No cost to "transact" | ~$0.00025 per real transaction (devnet SOL) |
