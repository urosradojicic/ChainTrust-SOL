/**
 * License Verification System
 * ───────────────────────────
 * Cryptographic license key validation using HMAC-SHA256.
 * Only authorized deployments can use the full platform.
 *
 * How it works:
 *   1. ChainTrust generates a license key for each customer
 *   2. The key encodes: customer ID, allowed domains, expiry, tier
 *   3. Key is signed with HMAC-SHA256 using a server-side secret
 *   4. Client validates the signature at runtime
 *   5. Features are gated based on license tier
 *
 * Without a valid license:
 *   - Core features work (basic dashboard, public verifier)
 *   - Advanced engines are locked (SDK, ZK proofs, 3D, AI agents)
 *   - A "License Required" banner appears
 *   - Usage is logged for enforcement
 *
 * This is NOT DRM — it's a business protection layer.
 * The code is readable but the SYSTEM requires authorization.
 */

// ── Types ────────────────────────────────────────────────────────────

export type LicenseTier = 'community' | 'startup' | 'professional' | 'enterprise' | 'unlimited';

export interface LicensePayload {
  /** Customer/organization ID */
  customerId: string;
  /** Customer name */
  customerName: string;
  /** License tier */
  tier: LicenseTier;
  /** Allowed domains (empty = any domain in dev) */
  allowedDomains: string[];
  /** Issued timestamp */
  issuedAt: number;
  /** Expiry timestamp (0 = never expires) */
  expiresAt: number;
  /** Max concurrent users (0 = unlimited) */
  maxUsers: number;
  /** Enabled engine IDs (empty = all engines for tier) */
  enabledEngines: string[];
  /** Custom metadata */
  metadata: Record<string, string>;
}

export interface LicenseKey {
  /** The encoded payload */
  payload: LicensePayload;
  /** HMAC-SHA256 signature of the payload */
  signature: string;
  /** Full license key string */
  key: string;
}

export interface LicenseStatus {
  /** Whether the license is valid */
  valid: boolean;
  /** License tier (community if invalid) */
  tier: LicenseTier;
  /** Reason if invalid */
  reason: string | null;
  /** Customer info (if valid) */
  customer: { id: string; name: string } | null;
  /** Days until expiry */
  daysUntilExpiry: number | null;
  /** Domain authorized */
  domainAuthorized: boolean;
  /** Engines available at this tier */
  availableEngines: number;
  /** Total engines */
  totalEngines: number;
}

// ── Tier Configuration ───────────────────────────────────────────────

export const TIER_ENGINE_LIMITS: Record<LicenseTier, {
  maxEngines: number;
  includes: string[];
  label: string;
  price: string;
  features: string[];
}> = {
  community: {
    maxEngines: 10,
    includes: [
      'red-flag-detection', 'reputation-score', 'survival-predictor',
      'nl-query', 'benchmarking', 'narrative-engine', 'command-palette',
      'feature-discovery', 'investor-engagement', 'investor-preferences',
    ],
    label: 'Community',
    price: 'Free',
    features: ['Basic analytics', 'NL query', 'Dashboard', 'Trust scores'],
  },
  startup: {
    maxEngines: 25,
    includes: [
      // Community engines plus:
      'claim-verification', 'cohort-analysis', 'competitive-intel',
      'monte-carlo', 'survival-predictor', 'pattern-recognition',
      'deal-scoring', 'lifecycle-detector', 'execution-velocity',
      'revenue-quality', 'founder-score', 'social-proof',
      'scenario-planning', 'time-series', 'solana-actions',
    ],
    label: 'Startup',
    price: '$99/mo',
    features: ['All Community features', 'Monte Carlo', 'DD scoring', 'Cohort analysis'],
  },
  professional: {
    maxEngines: 50,
    includes: [
      // Startup engines plus:
      'investment-memo', 'term-sheet', 'cap-table', 'milestone-escrow',
      'prediction-market', 'portfolio-optimizer', 'signal-engine',
      'quant-risk', 'return-calculator', 'valuation-suite',
      'dd-workflow', 'investment-flow', 'deal-flow-analytics',
      'smart-alerts', 'lp-portal', 'investor-matching',
      'bayesian-inference', 'gradient-boost', 'startup-dna',
      'network-effects', 'moat-scorer', 'tokenomics-simulator',
      'conviction-tracker', 'liquidity-analysis', 'protocol-revenue',
    ],
    label: 'Professional',
    price: '$499/mo',
    features: ['All Startup features', 'Investment memos', 'Portfolio optimizer', 'VaR/Sharpe'],
  },
  enterprise: {
    maxEngines: 73,
    includes: [], // All engines
    label: 'Enterprise',
    price: 'Custom',
    features: ['All engines', 'ZK proofs', '3D viz', 'AI agents', 'SDK access', 'Plugins', 'Custom integrations'],
  },
  unlimited: {
    maxEngines: 73,
    includes: [],
    label: 'Unlimited (Founders)',
    price: 'Internal',
    features: ['Everything', 'Source code access', 'White-label rights', 'Priority support'],
  },
};

// ── Cryptographic Functions ──────────────────────────────────────────

/**
 * HMAC-SHA256 signing using Web Crypto API.
 */
async function hmacSign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);

  const key = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * HMAC-SHA256 verification.
 */
async function hmacVerify(message: string, signature: string, secret: string): Promise<boolean> {
  const expected = await hmacSign(message, secret);
  // Constant-time comparison
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

// ── License Key Generation (Founders Only) ───────────────────────────

/**
 * Generate a license key. THIS FUNCTION IS FOR FOUNDERS ONLY.
 * In production, this runs on a secure server, not in the client.
 *
 * The secret is a placeholder — real deployment uses env-var secret.
 */
export async function generateLicenseKey(
  payload: LicensePayload,
  secret: string = 'CHAINTRUST_LICENSE_SECRET_CHANGE_IN_PRODUCTION',
): Promise<LicenseKey> {
  const payloadString = JSON.stringify(payload);
  const payloadBase64 = btoa(payloadString);
  const signature = await hmacSign(payloadBase64, secret);
  const key = `CT-${payloadBase64}.${signature}`;

  return { payload, signature, key };
}

// ── License Validation ───────────────────────────────────────────────

const LICENSE_STORAGE_KEY = 'chaintrust_license';

/**
 * Store a license key in localStorage.
 */
export function storeLicenseKey(key: string): void {
  localStorage.setItem(LICENSE_STORAGE_KEY, key);
}

/**
 * Get the stored license key.
 */
export function getStoredLicenseKey(): string | null {
  return localStorage.getItem(LICENSE_STORAGE_KEY);
}

/**
 * Validate a license key and return its status.
 */
export async function validateLicense(
  licenseKey: string | null = null,
  secret: string = 'CHAINTRUST_LICENSE_SECRET_CHANGE_IN_PRODUCTION',
): Promise<LicenseStatus> {
  const key = licenseKey ?? getStoredLicenseKey();

  // No license = community tier
  if (!key) {
    return {
      valid: false,
      tier: 'community',
      reason: 'No license key provided',
      customer: null,
      daysUntilExpiry: null,
      domainAuthorized: true,
      availableEngines: TIER_ENGINE_LIMITS.community.maxEngines,
      totalEngines: 73,
    };
  }

  try {
    // Parse key format: CT-{base64payload}.{signature}
    if (!key.startsWith('CT-')) {
      return { valid: false, tier: 'community', reason: 'Invalid key format', customer: null, daysUntilExpiry: null, domainAuthorized: false, availableEngines: 10, totalEngines: 73 };
    }

    const parts = key.slice(3).split('.');
    if (parts.length !== 2) {
      return { valid: false, tier: 'community', reason: 'Invalid key structure', customer: null, daysUntilExpiry: null, domainAuthorized: false, availableEngines: 10, totalEngines: 73 };
    }

    const [payloadBase64, signature] = parts;

    // Verify HMAC signature
    const isValid = await hmacVerify(payloadBase64, signature, secret);
    if (!isValid) {
      return { valid: false, tier: 'community', reason: 'Invalid signature — license key has been tampered with', customer: null, daysUntilExpiry: null, domainAuthorized: false, availableEngines: 10, totalEngines: 73 };
    }

    // Decode payload
    const payload: LicensePayload = JSON.parse(atob(payloadBase64));

    // Check expiry
    if (payload.expiresAt > 0 && Date.now() > payload.expiresAt) {
      const expiredDaysAgo = Math.ceil((Date.now() - payload.expiresAt) / (24 * 3600 * 1000));
      return { valid: false, tier: 'community', reason: `License expired ${expiredDaysAgo} days ago`, customer: { id: payload.customerId, name: payload.customerName }, daysUntilExpiry: -expiredDaysAgo, domainAuthorized: false, availableEngines: 10, totalEngines: 73 };
    }

    // Check domain authorization
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
    const domainAuthorized = payload.allowedDomains.length === 0 ||
      payload.allowedDomains.includes(currentDomain) ||
      payload.allowedDomains.includes('*') ||
      currentDomain === 'localhost' ||
      currentDomain === '127.0.0.1';

    if (!domainAuthorized) {
      return { valid: false, tier: 'community', reason: `Domain ${currentDomain} is not authorized. Allowed: ${payload.allowedDomains.join(', ')}`, customer: { id: payload.customerId, name: payload.customerName }, daysUntilExpiry: null, domainAuthorized: false, availableEngines: 10, totalEngines: 73 };
    }

    // Calculate days until expiry
    const daysUntilExpiry = payload.expiresAt > 0
      ? Math.ceil((payload.expiresAt - Date.now()) / (24 * 3600 * 1000))
      : null; // Never expires

    const tierConfig = TIER_ENGINE_LIMITS[payload.tier];

    return {
      valid: true,
      tier: payload.tier,
      reason: null,
      customer: { id: payload.customerId, name: payload.customerName },
      daysUntilExpiry,
      domainAuthorized: true,
      availableEngines: tierConfig.maxEngines,
      totalEngines: 73,
    };
  } catch (error: any) {
    return { valid: false, tier: 'community', reason: `Validation error: ${error.message}`, customer: null, daysUntilExpiry: null, domainAuthorized: false, availableEngines: 10, totalEngines: 73 };
  }
}

/**
 * Check if a specific engine is available under the current license.
 */
export async function isEngineAuthorized(engineId: string): Promise<boolean> {
  const status = await validateLicense();

  if (status.tier === 'enterprise' || status.tier === 'unlimited') return true;

  const tierConfig = TIER_ENGINE_LIMITS[status.tier];
  return tierConfig.includes.length === 0 || tierConfig.includes.includes(engineId);
}

/**
 * Get all engines available under the current license.
 */
export async function getAuthorizedEngines(): Promise<string[]> {
  const status = await validateLicense();
  const tierConfig = TIER_ENGINE_LIMITS[status.tier];

  if (tierConfig.includes.length === 0) {
    // Enterprise/Unlimited = all engines
    return [];
  }

  return tierConfig.includes;
}
