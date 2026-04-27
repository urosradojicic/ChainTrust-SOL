import { describe, it, expect, beforeEach, vi } from 'vitest';
import { escapeHtml, stripHtml, sanitizeText, sanitizeUrl, sanitizeNumber, isValidEmail, isValidSolanaAddress, safeJsonParse, rateLimit } from '@/lib/sanitize';

describe('escapeHtml', () => {
  it('escapes the five XSS-relevant characters', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    );
    expect(escapeHtml("Bob's & Carol's")).toBe('Bob&#x27;s &amp; Carol&#x27;s');
  });

  it('handles empty + plain strings', () => {
    expect(escapeHtml('')).toBe('');
    expect(escapeHtml('hello')).toBe('hello');
  });
});

describe('stripHtml', () => {
  it('removes tags but keeps text content', () => {
    expect(stripHtml('<b>bold</b>')).toBe('bold');
    expect(stripHtml('<a href="x">click</a>')).toBe('click');
    expect(stripHtml('plain')).toBe('plain');
  });
});

describe('sanitizeText', () => {
  it('strips html, trims whitespace, enforces length cap', () => {
    expect(sanitizeText('  <b>hi</b>  ')).toBe('hi');
    expect(sanitizeText('a'.repeat(1000), 10)).toHaveLength(10);
  });

  it('uses default 500 cap when no maxLength provided', () => {
    expect(sanitizeText('a'.repeat(1000))).toHaveLength(500);
  });
});

describe('sanitizeUrl', () => {
  it('accepts http and https', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com/');
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('blocks javascript: protocol (XSS vector)', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
  });

  it('blocks data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>')).toBeNull();
  });

  it('returns null for malformed urls and empty strings', () => {
    expect(sanitizeUrl('not a url')).toBeNull();
    expect(sanitizeUrl('')).toBeNull();
    expect(sanitizeUrl('   ')).toBeNull();
  });
});

describe('sanitizeNumber', () => {
  it('clamps to min/max', () => {
    expect(sanitizeNumber(150, 0, 100)).toBe(100);
    expect(sanitizeNumber(-50, 0, 100)).toBe(0);
    expect(sanitizeNumber(50, 0, 100)).toBe(50);
  });

  it('returns min for non-numeric input', () => {
    expect(sanitizeNumber('not a number', 5)).toBe(5);
    expect(sanitizeNumber(undefined, 5)).toBe(5);
    expect(sanitizeNumber(NaN, 5)).toBe(5);
  });

  it('handles string-numeric input via Number coercion', () => {
    expect(sanitizeNumber('42', 0, 100)).toBe(42);
  });
});

describe('isValidEmail', () => {
  it('accepts standard emails', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('user.name+tag@sub.example.co.uk')).toBe(true);
  });

  it('rejects malformed emails', () => {
    expect(isValidEmail('no-at-sign')).toBe(false);
    expect(isValidEmail('user@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('user@example')).toBe(false);
    expect(isValidEmail('user @example.com')).toBe(false);
  });

  it('rejects oversized emails', () => {
    expect(isValidEmail('a'.repeat(250) + '@x.com')).toBe(false);
  });
});

describe('isValidSolanaAddress', () => {
  it('accepts well-formed base58 addresses', () => {
    expect(isValidSolanaAddress('11111111111111111111111111111111')).toBe(true);
    expect(isValidSolanaAddress('SoLFuNd1111111111111111111111111111111111111')).toBe(true);
  });

  it('rejects too-short / too-long / invalid characters', () => {
    expect(isValidSolanaAddress('short')).toBe(false);
    expect(isValidSolanaAddress('0OIl' + 'a'.repeat(40))).toBe(false); // contains forbidden chars
    expect(isValidSolanaAddress('a'.repeat(45))).toBe(false); // too long
  });
});

describe('safeJsonParse', () => {
  it('returns parsed value on valid JSON', () => {
    expect(safeJsonParse('{"a":1}', {})).toEqual({ a: 1 });
  });

  it('returns fallback on invalid JSON, never throws', () => {
    expect(safeJsonParse('not json', { fallback: true })).toEqual({ fallback: true });
    expect(safeJsonParse(null, [])).toEqual([]);
    expect(safeJsonParse('{broken', 'default')).toBe('default');
  });
});

describe('rateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('allows up to maxAttempts in the window, then blocks', () => {
    expect(rateLimit('test1', 3, 60_000)).toBe(true);
    expect(rateLimit('test1', 3, 60_000)).toBe(true);
    expect(rateLimit('test1', 3, 60_000)).toBe(true);
    expect(rateLimit('test1', 3, 60_000)).toBe(false); // 4th attempt blocked
  });

  it('separate keys are independent', () => {
    expect(rateLimit('a', 1, 60_000)).toBe(true);
    expect(rateLimit('a', 1, 60_000)).toBe(false);
    expect(rateLimit('b', 1, 60_000)).toBe(true);
  });

  it('window reset allows new attempts after the cooldown', () => {
    expect(rateLimit('test2', 1, 1_000)).toBe(true);
    expect(rateLimit('test2', 1, 1_000)).toBe(false);
    vi.advanceTimersByTime(1_500);
    expect(rateLimit('test2', 1, 1_000)).toBe(true);
  });
});
