# ADR-0006 — Ban the `@solana/wallet-adapter-wallets` meta-package

- **Status**: Accepted
- **Date**: 2026-05
- **Deciders**: ChainTrust core team

## Context

`@solana/wallet-adapter-wallets` is a convenience meta-package that re-exports every Solana wallet adapter (Phantom, Solflare, Coinbase, Trezor, Torus, WalletConnect, … 30+ in total). The intended use case is "import what you need from one place."

In practice it pulls the entire transitive dep graph of every adapter into the bundle even if you only use 3 of them. As of May 2026, that graph included:

- `@trezor/blockchain-link`, `@trezor/connect`, `@trezor/transport`, `@trezor/protobuf` — 6 critical CVEs in the protobuf chain
- `protobufjs` < 7.2.5 — prototype pollution (CVE-2023-36665)
- `@toruslabs/solana-embed` → `crypto-browserify` — low-severity advisories
- `lodash` (transitive through Trezor) — high-severity advisories
- `bigint-buffer` — buffer overflow

Total: **8 critical npm advisories** that we never instantiated a single line of code from.

The `Web3Provider.tsx` only ever creates `PhantomWalletAdapter`, `SolflareWalletAdapter`, and `CoinbaseWalletAdapter`. The Trezor + Torus adapters are pure dead weight.

## Decision

**Ban `@solana/wallet-adapter-wallets`.** Replace the meta-package import with three single-package imports, one per actual adapter:

```ts
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
```

`@solana/wallet-adapter-wallets` is added to `dependabot.yml`'s ignore list so the dep doesn't sneak back in via a routine update.

## Consequences

### Positive

- **`npm audit`: 8 critical → 0 critical, 5 high → 3 high.** Total down from 55 to 16.
- **Smaller bundle** — Trezor + Torus + WalletConnect + 25 other adapters no longer ship to clients
- **Faster `npm install`** — fewer transitive deps
- **Provenance is clearer**: when a wallet feature changes, the diff is in the specific adapter package, not in a meta-re-export

### Negative

- **Can't add a wallet by changing one import**. A future Ledger or WalletConnect addition requires a new explicit dep + a new adapter instantiation. We consider this a feature, not a bug — adding a wallet is a deliberate decision worth a PR.
- **Three deps instead of one** in `package.json`. Negligible cost.

### Neutral

- 3 high `bigint-buffer` advisories remain after this change — they chain through `@solana/spl-token`, not the wallet adapters. Their removal would require a semver-major downgrade of spl-token to 0.1.8 which breaks the modern API. Tracked as deferred in [SECURITY.md](../../SECURITY.md).

## Alternatives considered

- **Keep `@solana/wallet-adapter-wallets`, add `npm audit fix --force`.** Rejected — `--force` accepts semver-major downgrades that broke our SPL Token decode path.
- **Use `package.json` `overrides` to pin the vulnerable transitive deps.** Considered — works for `protobufjs` but not for the `@trezor/*` chain (the patched versions don't exist or aren't ABI-compatible). The ban-the-meta approach is simpler and removes the dead code entirely.
- **Wait for upstream fixes.** Some of these advisories have been open for 12+ months; not a viable strategy.

## References

- [`package.json`](../../package.json) — three single-package imports, no meta
- [`src/providers/Web3Provider.tsx`](../../src/providers/Web3Provider.tsx) — adapter instantiation
- [`.github/dependabot.yml`](../../.github/dependabot.yml) — ignore list
- [SECURITY.md](../../SECURITY.md) — banned-deps row
- May 2026 commit `675ca4b` — `security(deps): drop wallet-adapter-wallets meta-package`
