# ADR-0004 — BigInt fixed-point for token amounts

- **Status**: Accepted
- **Date**: 2026-05
- **Deciders**: ChainTrust core team

## Context

CMT (the staking token) has 6 decimals — base units are `1_000_000` per CMT. Earlier code (`useStake`, `useUnstake`) accepted `amount: number` and converted via `BigInt(Math.round(amount * 1_000_000))`.

JavaScript `Number` is IEEE-754 binary64. Two specific failure modes affect us:

1. **Magnitude limit**: above ~`2^53 / 1e6 ≈ 9_007_199_254` CMT, `Number * 1_000_000` exceeds safe integer range and quietly loses bits.
2. **Decimal representation**: `0.1 + 0.2 = 0.30000000000000004`. `0.1 * 1_000_000 = 100000.00000000001`. Rounded with `Math.round` it usually works — but combined with hostile typing or boundary cases, the user types `12.345678` expecting 12,345,678 base units and gets `12345677` or `12345679` instead. Off-by-one in token math is a bug class we don't want.

The May 2026 audit explicitly flagged this as a "High" — financial code shouldn't have a known off-by-one path.

## Decision

Use a fixed-point string parser backed by `BigInt`. The frontend boundary is `cmtToBaseUnits(amount: string | number): bigint` in [`src/lib/solana/contracts.ts`](../../src/lib/solana/contracts.ts).

The parser:

1. Coerces `number` inputs to their string form via `.toString()` (preserves `Number`'s display precision, which is what the user typed in the input field).
2. Validates the string against `/^\d+(?:\.\d{1,6})?$/` — non-negative, up to 6 fractional digits, no scientific notation, no commas.
3. Splits on `.`, pads the fractional part to exactly 6 digits, parses both halves with `BigInt`, and returns `whole * 1_000_000n + frac`.

Invalid input throws an `Error` instead of silently producing zero or NaN.

10 vitest cases in [`src/test/contracts.test.ts`](../../src/test/contracts.test.ts) lock the conversion: whole numbers, fractional padding, parity with the old float path on small values, rejection of negatives + scientific notation + over-6-decimals.

## Consequences

### Positive

- **Off-by-one impossible** for valid input
- **No magnitude ceiling** (BigInt is arbitrary-precision)
- **Explicit input validation** — invalid strings fail loudly instead of producing wrong amounts
- **Regression-tested** — drift from this contract breaks tests immediately

### Negative

- **API change**: `useStake`/`useUnstake` now accept `string | number`. Existing call sites in `Staking.tsx` were updated to pass the raw input string; one extra change at every callsite.
- **No locale support**: the regex doesn't accept `,` as a decimal separator. Acceptable — internationalisation would happen at the input-component layer, where the locale-aware string is converted to canonical form before reaching `cmtToBaseUnits`.

## Alternatives considered

- **`@solana/web3.js`'s `BN.js`**. Same precision guarantee. Rejected — `BN.js` is heavier and an extra dep; native `bigint` exists in every browser we target.
- **Custom 6-decimals integer**. Same idea, but using `number` instead of `bigint`. Rejected — re-introduces the magnitude ceiling.
- **Float math, accept the off-by-one risk**. Rejected — failing in finance code is a hard no.

## References

- [`src/lib/solana/contracts.ts`](../../src/lib/solana/contracts.ts) — `cmtToBaseUnits`
- [`src/test/contracts.test.ts`](../../src/test/contracts.test.ts) — regression tests
- [SECURITY.md](../../SECURITY.md) — finding M-A1 / cmtToBaseUnits row
