import { describe, it, expect } from 'vitest';
import { getErrorMessage, getErrorCode, isNetworkError } from '@/lib/errors';

describe('getErrorMessage', () => {
  it('returns the message of an Error instance', () => {
    expect(getErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('prefers shortMessage over message (Solana web3.js pattern)', () => {
    const err = new Error('long verbose detail') as Error & { shortMessage?: string };
    err.shortMessage = 'tx rejected';
    expect(getErrorMessage(err)).toBe('tx rejected');
  });

  it('returns the string itself when err is a string', () => {
    expect(getErrorMessage('something failed')).toBe('something failed');
  });

  it('extracts message from plain object errors', () => {
    expect(getErrorMessage({ message: 'object error' })).toBe('object error');
  });

  it('uses fallback when err is null/undefined', () => {
    expect(getErrorMessage(null, 'default')).toBe('default');
    expect(getErrorMessage(undefined, 'default')).toBe('default');
    expect(getErrorMessage(null)).toBe('Unknown error');
  });

  it('falls back to JSON.stringify for arbitrary objects', () => {
    expect(getErrorMessage({ custom: 'shape' })).toBe('{"custom":"shape"}');
  });
});

describe('getErrorCode', () => {
  it('returns string code if present', () => {
    expect(getErrorCode({ code: 'PGRST301' })).toBe('PGRST301');
  });

  it('coerces numeric codes to string', () => {
    expect(getErrorCode({ code: 404 })).toBe('404');
  });

  it('returns undefined when no code is present', () => {
    expect(getErrorCode({})).toBeUndefined();
    expect(getErrorCode(null)).toBeUndefined();
    expect(getErrorCode('plain string')).toBeUndefined();
  });
});

describe('isNetworkError', () => {
  it('detects fetch/network/timeout/cors phrases', () => {
    expect(isNetworkError(new Error('Failed to fetch'))).toBe(true);
    expect(isNetworkError(new Error('Network request failed'))).toBe(true);
    expect(isNetworkError(new Error('Request timeout'))).toBe(true);
    expect(isNetworkError(new Error('CORS preflight failed'))).toBe(true);
    expect(isNetworkError(new Error('aborted by user'))).toBe(true);
  });

  it('does not flag non-network errors', () => {
    expect(isNetworkError(new Error('User rejected'))).toBe(false);
    expect(isNetworkError(new Error('Insufficient funds'))).toBe(false);
    expect(isNetworkError(null)).toBe(false);
  });
});
