import { describe, it, expect } from 'vitest';
import { cmtToBaseUnits, computeTier, CMT_DECIMALS } from '@/lib/solana/contracts';

describe('cmtToBaseUnits', () => {
  it('converts whole numbers without precision loss', () => {
    expect(cmtToBaseUnits('100')).toBe(100_000_000n);
    expect(cmtToBaseUnits('5000')).toBe(5_000_000_000n);
    expect(cmtToBaseUnits('50000')).toBe(50_000_000_000n);
  });

  it('handles up to 6 decimal places exactly', () => {
    expect(cmtToBaseUnits('0.000001')).toBe(1n);
    expect(cmtToBaseUnits('1.234567')).toBe(1_234_567n);
    expect(cmtToBaseUnits('999999.999999')).toBe(999_999_999_999n);
  });

  it('pads short fractional parts with zeros', () => {
    expect(cmtToBaseUnits('1.5')).toBe(1_500_000n);
    expect(cmtToBaseUnits('0.1')).toBe(100_000n);
    expect(cmtToBaseUnits('42.42')).toBe(42_420_000n);
  });

  it('matches integer * 1_000_000 for whole numbers (sanity vs old float math)', () => {
    for (const n of [1, 2, 100, 5_000, 50_000, 1_000_000]) {
      expect(cmtToBaseUnits(n)).toBe(BigInt(n * CMT_DECIMALS));
    }
  });

  it('avoids float precision errors that the old Math.round path had', () => {
    // 0.1 + 0.2 in float = 0.30000000000000004, but our string path is exact.
    expect(cmtToBaseUnits('0.3')).toBe(300_000n);
    // A value that rounds badly via float multiplication: 12.345678 * 1e6 in
    // float = 12345677.999999998 → Math.round = 12345678 (lucky here), but
    // amounts like 0.1 * 1_000_000 = 100000.00000000001 round fine yet drift
    // for big magnitudes.
    expect(cmtToBaseUnits('12.345678')).toBe(12_345_678n);
  });

  it('rejects non-numeric input', () => {
    expect(() => cmtToBaseUnits('abc')).toThrow(/non-negative number/i);
    expect(() => cmtToBaseUnits('')).toThrow(/required/i);
    expect(() => cmtToBaseUnits('   ')).toThrow(/required/i);
  });

  it('rejects negative numbers', () => {
    expect(() => cmtToBaseUnits('-1')).toThrow();
    expect(() => cmtToBaseUnits('-0.5')).toThrow();
  });

  it('rejects more than 6 decimal places (would otherwise truncate silently)', () => {
    expect(() => cmtToBaseUnits('1.1234567')).toThrow();
  });

  it('rejects scientific notation (would otherwise parse to wrong amount)', () => {
    expect(() => cmtToBaseUnits('1e3')).toThrow();
  });
});

describe('computeTier (regression — must keep current thresholds)', () => {
  it('classifies based on staked base units', () => {
    expect(computeTier(0)).toBe('Free');
    expect(computeTier(1)).toBe('Basic');
    expect(computeTier(4_999 * CMT_DECIMALS)).toBe('Basic');
    expect(computeTier(5_000 * CMT_DECIMALS)).toBe('Pro');
    expect(computeTier(49_999 * CMT_DECIMALS)).toBe('Pro');
    expect(computeTier(50_000 * CMT_DECIMALS)).toBe('Whale');
  });
});
