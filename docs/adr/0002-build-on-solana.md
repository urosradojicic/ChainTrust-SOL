# ADR-0002 — Build on Solana over EVM / Aptos / Sui

- **Status**: Accepted
- **Date**: 2026-04
- **Deciders**: ChainTrust core team

## Context

ChainTrust commits a SHA-256 hash of startup metrics to a public ledger so investors can verify a metric was claimed at a specific time without trusting the founder's PowerPoint. The chain choice has to satisfy four constraints, in priority order:

1. **Cost per anchor must be negligible** — investors expect founders to publish updates monthly, and at $0.30/tx (Ethereum L1) or $0.05/tx (Optimism), the founder cost compounds to thousands of dollars over the lifetime of a startup. Trust-layer adoption dies at that price point.
2. **Sub-second confirmation** is needed for the live demo flow ("click anchor → see Explorer link in 10 seconds"). Slow finality breaks the on-chain UX.
3. **Mature wallet ecosystem** — Phantom + Solflare + Coinbase ship to mainstream users; ledger / hardware support exists.
4. **Programmable accounts at the chain layer** — we need to enforce per-row constraints (signer, owner, account-state checks) without relying on a smart-contract framework that's still settling.

We considered EVM L1, EVM L2 (Optimism, Arbitrum, Base), Aptos / Sui, and Solana.

## Decision

**Build on Solana with the Anchor framework.**

The `chainmetrics` Anchor program ([`blockchain/programs/chainmetrics/src/`](../../blockchain/programs/chainmetrics/src/)) holds 24 instructions across registry, staking, governance, and badges. The chain-side proof-anchor flow uses the SPL Memo Program for the live demo (no program deployment required for a verifiable on-chain transaction) plus the full `chainmetrics` program for production state.

## Consequences

### Positive

- **~$0.00025 per metric anchor** at typical priority fees — three orders of magnitude cheaper than EVM. Founders can update freely.
- **400ms slot time** — sub-second perceived finality, which matters for the demo UX
- **Mature Anchor framework** — `#[derive(Accounts)]` and account-constraint macros catch a class of bugs (missing `signer`, missing `owner` check, missing `seeds` constraint) that would be hand-rolled assertions on EVM
- **Wallet adapter is plug-and-play** — Phantom + Solflare + Coinbase via `@solana/wallet-adapter-react`; users sign with one click
- **Compressed NFTs** available via Metaplex Bubblegum if certificate volume ever requires it

### Negative

- **Smaller pool of audit firms** than EVM — though we got three smart-contract audits done (OtterSec, Sec3, CertiK), the firms are mostly Solana-native
- **Solana account model is unfamiliar** to many engineers and to most off-chain tooling — we spent more time on PDA derivation correctness than we would have on Solidity equivalents
- **`bigint-buffer` chain** in the Solana ecosystem ships with a known buffer-overflow CVE; the only available fix downgrades `@solana/spl-token` to a 3-year-old API. We've documented this as a deferred risk in [`/SECURITY.md`](../../SECURITY.md)
- **Mainnet halts** are real (multiple in 2022 and 2023). Cluster verification + simulation hardening (ADR-implicit, see [`solana-config.ts`](../../src/lib/solana/solana-config.ts)) mitigates the user-side impact of an unreachable cluster

### Neutral

- We're chain-locked. A cross-chain expansion would need a parallel deployment, not a port. Acceptable: the trust-layer thesis is "investors verify a single claim chain"; multi-chain dilutes that.

## Alternatives considered

- **Ethereum L1.** Rejected — gas cost kills the per-update economics. Founders will not pay $5–30 per metric publish.
- **Optimism / Arbitrum / Base (EVM L2).** Rejected — better cost than L1, but the L2-finality story is still a UX problem (rollup challenge windows + the 7-day withdrawal narrative confuses non-crypto-native investors). Also still ~$0.05/tx, an order of magnitude over Solana.
- **Aptos.** Considered — the Move account model is elegant. Rejected: smaller wallet ecosystem, no equivalent of Phantom's user-base, less audit-firm coverage
- **Sui.** Same reasoning as Aptos. Earlier on the maturity curve.

## References

- [Anchor framework documentation](https://www.anchor-lang.com/)
- [`blockchain/programs/chainmetrics/src/lib.rs`](../../blockchain/programs/chainmetrics/src/lib.rs) — the program
- [SECURITY.md](../../SECURITY.md) — `bigint-buffer` deferred risk
