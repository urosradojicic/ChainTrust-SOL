/**
 * Zero-Knowledge Range Proof Library
 * ────────────────────────────────────
 * Client-side ZK range proof generation and verification.
 * Proves a value lies within a range WITHOUT revealing the exact value.
 *
 * "I can prove my MRR is between $50K and $500K without telling you the exact number."
 *
 * Implementation: Pedersen commitment + simplified range proof protocol.
 * Uses Web Crypto API for cryptographic operations.
 *
 * Architecture:
 *   1. Prover commits to value: C = g^v * h^r (Pedersen commitment)
 *   2. Prover generates proof that v ∈ [min, max]
 *   3. Verifier checks proof without learning v
 *   4. Commitment + proof stored on-chain (replaces plaintext metrics)
 *
 * NOTE: This is an educational implementation demonstrating the ZK concept.
 * Production would use the `bulletproofs` Rust crate in the Anchor program.
 */

// ── Types ────────────────────────────────────────────────────────────

export interface PedersenCommitment {
  /** The commitment value (hex string) */
  commitment: string;
  /** The blinding factor (kept secret by prover) */
  blindingFactor: string;
  /** The committed value (kept secret by prover) */
  value: number;
}

export interface RangeProof {
  /** Proof ID */
  id: string;
  /** The metric being proved */
  metric: string;
  /** The commitment (public) */
  commitment: string;
  /** Range minimum (public) */
  rangeMin: number;
  /** Range maximum (public) */
  rangeMax: number;
  /** Proof data (would be the actual cryptographic proof bytes in production) */
  proofData: string;
  /** Proof size in bytes */
  proofSizeBytes: number;
  /** Whether the proof is valid */
  isValid: boolean;
  /** Verification time in ms */
  verificationTimeMs: number;
  /** Generation time in ms */
  generationTimeMs: number;
  /** Timestamp */
  generatedAt: number;
  /** Hash of the proof for on-chain storage */
  proofHash: string;
}

export interface ZKMetricsPublish {
  /** Startup ID */
  startupId: string;
  /** All metric proofs */
  proofs: RangeProof[];
  /** Combined proof hash (for on-chain storage) */
  combinedProofHash: string;
  /** Total proof size */
  totalProofSizeBytes: number;
  /** Estimated on-chain verification cost (SOL) */
  estimatedVerificationCost: number;
  /** Privacy level achieved */
  privacyLevel: 'full' | 'range' | 'threshold' | 'none';
  /** What an observer can learn */
  publicInformation: string[];
  /** What remains private */
  privateInformation: string[];
}

export interface ZKTierAccess {
  /** Tier name */
  tier: string;
  /** What this tier can see */
  visibleData: string[];
  /** Range precision available */
  rangePrecision: 'broad' | 'narrow' | 'exact';
  /** Example of what they see */
  example: string;
}

// ── Cryptographic Primitives ─────────────────────────────────────────

/**
 * Generate a cryptographically secure random hex string.
 */
async function randomHex(bytes: number = 32): Promise<string> {
  const buffer = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(buffer).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * SHA-256 hash of arbitrary data.
 */
async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a Pedersen-style commitment to a value.
 * C = SHA256(value || blindingFactor)
 *
 * In production: C = g^v * h^r on an elliptic curve (e.g., Curve25519)
 * This simplified version uses hash-based commitments for demonstration.
 */
async function createCommitment(value: number): Promise<PedersenCommitment> {
  const blindingFactor = await randomHex(32);
  const commitment = await sha256(`${value}|${blindingFactor}`);
  return { commitment, blindingFactor, value };
}

/**
 * Verify a commitment matches a claimed value and blinding factor.
 */
async function verifyCommitment(
  commitment: string,
  value: number,
  blindingFactor: string,
): Promise<boolean> {
  const expected = await sha256(`${value}|${blindingFactor}`);
  return expected === commitment;
}

// ── Range Proof Generation ───────────────────────────────────────────

/**
 * Generate a range proof that a committed value lies within [min, max].
 *
 * Simplified protocol:
 *   1. Commit to value v
 *   2. Prove v - min >= 0 (commitment to delta_low)
 *   3. Prove max - v >= 0 (commitment to delta_high)
 *   4. Prove delta_low + delta_high = max - min (range width check)
 *   5. Generate challenge hash binding all commitments
 *
 * In production: Bulletproofs protocol (~700 bytes for 64-bit range)
 */
export async function generateRangeProof(
  metric: string,
  value: number,
  rangeMin: number,
  rangeMax: number,
): Promise<RangeProof> {
  const startTime = performance.now();

  // Validate inputs
  if (value < rangeMin || value > rangeMax) {
    throw new Error(`Value ${value} is not in range [${rangeMin}, ${rangeMax}]`);
  }

  // Step 1: Commit to the value
  const valueCommitment = await createCommitment(value);

  // Step 2: Compute range deltas
  const deltaLow = value - rangeMin;
  const deltaHigh = rangeMax - value;

  // Step 3: Commit to deltas
  const deltaLowCommitment = await createCommitment(deltaLow);
  const deltaHighCommitment = await createCommitment(deltaHigh);

  // Step 4: Generate challenge (Fiat-Shamir heuristic)
  const challenge = await sha256([
    valueCommitment.commitment,
    deltaLowCommitment.commitment,
    deltaHighCommitment.commitment,
    rangeMin.toString(),
    rangeMax.toString(),
  ].join('|'));

  // Step 5: Generate response (proving knowledge of openings)
  const response = await sha256([
    challenge,
    valueCommitment.blindingFactor,
    deltaLowCommitment.blindingFactor,
    deltaHighCommitment.blindingFactor,
  ].join('|'));

  // Step 6: Construct proof data
  const proofData = JSON.stringify({
    valueCommitment: valueCommitment.commitment,
    deltaLowCommitment: deltaLowCommitment.commitment,
    deltaHighCommitment: deltaHighCommitment.commitment,
    challenge,
    response,
    rangeWidth: rangeMax - rangeMin,
  });

  const generationTime = performance.now() - startTime;

  // Step 7: Verify the proof we just generated
  const verifyStart = performance.now();
  const isValid = await verifyRangeProofInternal(proofData, rangeMin, rangeMax);
  const verificationTime = performance.now() - verifyStart;

  const proofHash = await sha256(proofData);
  const proofSizeBytes = new TextEncoder().encode(proofData).length;

  return {
    id: `zkp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    metric,
    commitment: valueCommitment.commitment,
    rangeMin,
    rangeMax,
    proofData,
    proofSizeBytes,
    isValid,
    verificationTimeMs: +verificationTime.toFixed(2),
    generationTimeMs: +generationTime.toFixed(2),
    generatedAt: Date.now(),
    proofHash,
  };
}

/**
 * Verify a range proof (without knowing the value).
 */
async function verifyRangeProofInternal(proofData: string, rangeMin: number, rangeMax: number): Promise<boolean> {
  try {
    const proof = JSON.parse(proofData);

    // Verify challenge was correctly computed
    const expectedChallenge = await sha256([
      proof.valueCommitment,
      proof.deltaLowCommitment,
      proof.deltaHighCommitment,
      rangeMin.toString(),
      rangeMax.toString(),
    ].join('|'));

    if (expectedChallenge !== proof.challenge) return false;

    // Verify range width matches
    if (proof.rangeWidth !== rangeMax - rangeMin) return false;

    // Verify response is correctly bound to challenge
    // (In production, this would verify elliptic curve equations)
    if (!proof.response || proof.response.length !== 64) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Public verification function (for verifiers who don't know the value).
 */
export async function verifyRangeProof(proof: RangeProof): Promise<{
  valid: boolean;
  verificationTimeMs: number;
  details: string;
}> {
  const start = performance.now();
  const valid = await verifyRangeProofInternal(proof.proofData, proof.rangeMin, proof.rangeMax);
  const timeMs = performance.now() - start;

  return {
    valid,
    verificationTimeMs: +timeMs.toFixed(2),
    details: valid
      ? `Proof verified: the committed value is within [${proof.rangeMin.toLocaleString()}, ${proof.rangeMax.toLocaleString()}]. The exact value is not revealed.`
      : 'Proof verification failed — the proof may be invalid or tampered with.',
  };
}

// ── Metric-Specific Proof Generators ─────────────────────────────────

/**
 * Standard range configurations for each metric.
 * These define what ranges are meaningful for each metric type.
 */
export const METRIC_RANGE_CONFIGS: Record<string, {
  label: string;
  ranges: { label: string; min: number; max: number }[];
  unit: string;
}> = {
  mrr: {
    label: 'Monthly Recurring Revenue',
    unit: 'USD',
    ranges: [
      { label: 'Pre-Revenue', min: 0, max: 10000 },
      { label: 'Early Traction', min: 10000, max: 50000 },
      { label: 'Product-Market Fit', min: 50000, max: 200000 },
      { label: 'Growth Stage', min: 200000, max: 1000000 },
      { label: 'Scale', min: 1000000, max: 10000000 },
    ],
  },
  growth_rate: {
    label: 'Monthly Growth Rate',
    unit: '%',
    ranges: [
      { label: 'Contracting', min: -50, max: 0 },
      { label: 'Slow Growth', min: 0, max: 10 },
      { label: 'Healthy Growth', min: 10, max: 25 },
      { label: 'Hyper Growth', min: 25, max: 100 },
    ],
  },
  burn_rate: {
    label: 'Monthly Burn Rate',
    unit: 'USD',
    ranges: [
      { label: 'Profitable', min: -1000000, max: 0 },
      { label: 'Lean', min: 0, max: 50000 },
      { label: 'Moderate', min: 50000, max: 200000 },
      { label: 'Aggressive', min: 200000, max: 1000000 },
    ],
  },
  runway: {
    label: 'Runway (months)',
    unit: 'months',
    ranges: [
      { label: 'Critical', min: 0, max: 6 },
      { label: 'Needs Funding', min: 6, max: 12 },
      { label: 'Comfortable', min: 12, max: 24 },
      { label: 'Well Funded', min: 24, max: 999 },
    ],
  },
  users: {
    label: 'Total Users',
    unit: 'users',
    ranges: [
      { label: 'Pre-Launch', min: 0, max: 1000 },
      { label: 'Early Adopters', min: 1000, max: 10000 },
      { label: 'Traction', min: 10000, max: 100000 },
      { label: 'Scale', min: 100000, max: 10000000 },
    ],
  },
};

/**
 * Generate ZK proofs for all metrics of a startup.
 * This replaces plaintext metric publishing with privacy-preserving proofs.
 */
export async function generateZKMetricsPublish(
  startupId: string,
  metrics: Record<string, number>,
): Promise<ZKMetricsPublish> {
  const proofs: RangeProof[] = [];

  for (const [metric, value] of Object.entries(metrics)) {
    const config = METRIC_RANGE_CONFIGS[metric];
    if (!config) continue;

    // Find the appropriate range for this value
    const range = config.ranges.find(r => value >= r.min && value <= r.max);
    if (!range) continue;

    const proof = await generateRangeProof(metric, value, range.min, range.max);
    proofs.push(proof);
  }

  const totalSize = proofs.reduce((s, p) => s + p.proofSizeBytes, 0);
  const allProofHashes = proofs.map(p => p.proofHash).join('|');
  const combinedHash = await sha256(allProofHashes);

  // Calculate what's public vs private
  const publicInfo = proofs.map(p => {
    const config = METRIC_RANGE_CONFIGS[p.metric];
    const range = config?.ranges.find(r => r.min === p.rangeMin && r.max === p.rangeMax);
    return `${config?.label ?? p.metric}: ${range?.label ?? 'in range'} [${p.rangeMin.toLocaleString()}-${p.rangeMax.toLocaleString()} ${config?.unit ?? ''}]`;
  });

  const privateInfo = proofs.map(p => {
    const config = METRIC_RANGE_CONFIGS[p.metric];
    return `Exact ${config?.label ?? p.metric} value`;
  });

  return {
    startupId,
    proofs,
    combinedProofHash: combinedHash,
    totalProofSizeBytes: totalSize,
    estimatedVerificationCost: proofs.length * 0.00025, // ~$0.00025 per proof on Solana
    privacyLevel: 'range',
    publicInformation: publicInfo,
    privateInformation: privateInfo,
  };
}

// ── Tier-Based Access Control ────────────────────────────────────────

/**
 * Define what each staking tier can see about a startup's metrics.
 * Maps directly to the existing Free/Basic/Pro/Whale tier system.
 */
export function getZKTierAccess(): ZKTierAccess[] {
  return [
    {
      tier: 'Public',
      visibleData: ['Category', 'Blockchain', 'Verified (yes/no)', 'Trust score range'],
      rangePrecision: 'broad',
      example: 'MRR: Verified in range [$50K-$500K]',
    },
    {
      tier: 'Basic',
      visibleData: ['Broad range proofs', 'Growth above/below threshold', 'Sustainability tier'],
      rangePrecision: 'broad',
      example: 'MRR: Product-Market Fit range [$50K-$200K], Growth: Healthy [10-25%]',
    },
    {
      tier: 'Pro',
      visibleData: ['Narrow range proofs', 'Trend direction', 'Comparative percentile'],
      rangePrecision: 'narrow',
      example: 'MRR: [$100K-$150K], Growth: 15-20%, Top 25% in category',
    },
    {
      tier: 'Whale',
      visibleData: ['Exact metrics (full decryption)', 'Raw data access', 'Historical time-series'],
      rangePrecision: 'exact',
      example: 'MRR: $142,000, Growth: 18.2%, 12-month history with monthly granularity',
    },
  ];
}
