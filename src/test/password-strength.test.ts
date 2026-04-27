import { describe, it, expect } from 'vitest';
import { scorePassword } from '@/components/PasswordStrengthMeter';

describe('scorePassword', () => {
  it('returns Empty / score 0 for empty input', () => {
    const r = scorePassword('');
    expect(r.label).toBe('Empty');
    expect(r.score).toBe(0);
  });

  it('rejects short passwords as weak', () => {
    expect(scorePassword('abc').score).toBeLessThan(2);
    expect(scorePassword('abc').label).toBe('Weak');
  });

  it('upgrades to Fair with length + a digit', () => {
    const r = scorePassword('abcdefg1');
    expect(r.score).toBeGreaterThanOrEqual(2);
  });

  it('upgrades to Good with length + digit + mixed case', () => {
    const r = scorePassword('Abcdefg1');
    expect(r.score).toBeGreaterThanOrEqual(3);
  });

  it('reaches Strong with all five criteria met', () => {
    const r = scorePassword('Abcdefg1!');
    expect(r.score).toBe(4);
    expect(r.label).toBe('Strong');
  });

  it('treats 12+ chars as the symbol-equivalent rule', () => {
    // No symbol, but length >= 12 satisfies the 5th criterion
    const r = scorePassword('Abcdefgh1234');
    expect(r.score).toBe(4);
  });

  it('reports criteria with met flags', () => {
    const r = scorePassword('a');
    const lengthCriterion = r.criteria.find((c) => c.description.includes('8 characters'));
    expect(lengthCriterion?.met).toBe(false);
  });
});
