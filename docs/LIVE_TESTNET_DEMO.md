# Live Testnet Demo

> **Real Solana devnet transactions in under 10 seconds — designed for investor pitches and judge demos.**

`/testnet-demo` lets anyone with a Solana wallet (Phantom, Solflare, Coinbase) connect, request a free devnet airdrop, and anchor a cryptographic proof of startup metrics on-chain. Every step is a real signed transaction, confirmed on-chain, and verifiable on Solana Explorer forever.

---

## Why this exists

Our custom Anchor program (`blockchain/programs/chainmetrics/`) is complete (~1350 lines: tokens, staking, DAO, soulbound badges) but not yet deployed to devnet — `declare_id!` still holds a placeholder vanity ID. Every write in [`src/hooks/use-blockchain.ts`](../src/hooks/use-blockchain.ts) silently falls back to a simulated `DEMO_…` signature.

Deploying the full program requires a Rust + Solana CLI + Anchor CLI toolchain, typically a Linux/WSL environment. That's a multi-hour setup we can't rely on in a live demo room.

The Live Testnet Demo solves that gap by using the **SPL Memo Program** — canonical Solana infrastructure, already deployed on every cluster — to post a real memo transaction containing the same SHA-256 proof hash our Anchor program would store. This gives investors a live, trustless, on-chain flow today, while the full registry deployment is in progress.

---

## Quickstart

### Prerequisites

- Node 18+ and `npm`
- A Solana wallet extension (Phantom recommended) with a devnet account
- In Phantom: **Settings → Developer Settings → Testnet Mode: ON**, then pick **Devnet** in the network switcher

### Run it

```bash
npm install
npm run dev
# open http://localhost:8080/testnet-demo
```

### The 4-step flow

1. **Connect wallet** — click the "Select Wallet" button; pick Phantom/Solflare/Coinbase. The page reads your current SOL balance.
2. **Airdrop 1 SOL** — one click, goes straight to the Solana devnet faucet. Returns a confirmed tx signature.
3. **Enter metrics** — sample values are pre-filled (MRR $125K, 18K users, 23% growth, 340 t carbon offset). Change any field to see a different proof.
4. **Anchor to devnet** — signs a real transaction in your wallet containing a JSON memo + SHA-256 hash. Confirmation lands in ~2 seconds. You get a copy-able tx signature and a **View on Solana Explorer** button.

---

## What gets posted on-chain

The memo payload is a compact JSON document embedded in a single Memo-program instruction:

```json
{
  "p": "ChainTrust",
  "v": 1,
  "kind": "metrics",
  "sid": 42,
  "name": "GreenChain Demo",
  "mrr": 125000,
  "u": 18400,
  "au": 12900,
  "bn": 45000,
  "rw": 18,
  "gr": 2300,
  "co": 340,
  "h": "6a1c…<64-char sha256>",
  "t": 1713855600
}
```

The proof hash is computed as:

```
SHA-256("mrr|users|active|burn|runway|growth*100|carbon")
```

This is **byte-identical** to the hash format the `publish_metrics` instruction in our Anchor program uses, so memos posted via the demo remain valid historical proofs even after the full registry ships on devnet or mainnet.

---

## Verifying a proof independently

Anyone can replay the verification — no API key, no ChainTrust account required.

### With Solana CLI

```bash
# Read the transaction, including its logs and memo
solana confirm -v <signature> --url devnet
```

The memo appears in the tx logs. Extract the `h` (hash) field, recompute `SHA-256("mrr|users|active|burn|runway|growth*100|carbon")` from the values in the same payload, and compare.

### With Solana Explorer

Open the tx signature on [explorer.solana.com](https://explorer.solana.com/?cluster=devnet) — the memo instruction shows the raw JSON under the **Program Instruction Logs** section.

---

## Key architectural decisions

| Decision | Rationale |
|---|---|
| **SPL Memo Program, not custom Anchor** | Zero deploy risk. Canonical infra on every cluster. Same wallet-signing UX. |
| **Hash format matches `publish_metrics`** | Memos are forward-compatible — once the registry deploys, these same proofs are re-verifiable against the on-chain metrics PDA. |
| **`autoConnect={false}` on the wallet adapter** | Prevents session carry-over on shared machines. Users always explicitly click Connect. |
| **Airdrop disabled on mainnet** | Mainnet has no faucet; guarding against `VITE_SOLANA_CLUSTER=mainnet-beta` prevents a confusing failure. |
| **Client-side SHA-256 via `crypto.subtle`** | No dependency on a backend; independently auditable. |

---

## Files

| File | Responsibility |
|---|---|
| [`src/lib/memo-anchor.ts`](../src/lib/memo-anchor.ts) | Memo-program instruction builder, proof-hash computation, devnet airdrop helper, `sendProofHashMemo` end-to-end. |
| [`src/pages/LiveTestnetDemo.tsx`](../src/pages/LiveTestnetDemo.tsx) | 4-step UI — connect / airdrop / metrics / anchor — with error and success states. |
| [`src/App.tsx`](../src/App.tsx) | Lazy route `/testnet-demo`. |
| [`src/components/common/ChainStatus.tsx`](../src/components/common/ChainStatus.tsx) | Sidebar widget showing cluster, program-deployment status, wallet state, and current slot. |

---

## Troubleshooting

**"Not enough SOL to pay the transaction fee"** — click **Airdrop 1 SOL** above, or grab devnet SOL from [faucet.solana.com](https://faucet.solana.com).

**"Airdrop failed: 429"** — the public devnet faucet is rate-limited. Wait 60 seconds or switch to faucet.solana.com.

**"Transaction rejected in the wallet"** — the user declined the signature prompt. Click **Anchor to devnet** again.

**"Airdrops are not available on mainnet"** — you're on `mainnet-beta`. Edit `.env` and set `VITE_SOLANA_CLUSTER=devnet`, then restart `npm run dev`.

**The tx shows "Demo Mode" in the sidebar** — that refers to our custom Anchor program (not deployed). The Memo Program anchoring still works and produces a real, verifiable tx signature.

---

## Next step: full registry

Once the Anchor program is deployed to devnet (`anchor deploy --provider.cluster devnet`), set `VITE_SOLANA_PROGRAM_ID` in `.env` to the deployed program ID. At that point:

- `/verify` will resolve real startup/metrics/badge PDAs.
- `/register`, `/staking`, `/governance` transactions will hit the real program instead of returning `DEMO_…` signatures.
- The proof hashes posted via the Memo demo remain valid — they can be re-anchored into the registry via `publish_metrics` with no re-computation.

See [`docs/SMART-CONTRACT.md`](./SMART-CONTRACT.md) and [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) for the deployment procedure.
