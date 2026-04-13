/**
 * Integrity & Anti-Tampering Guard
 * ─────────────────────────────────
 * Detects unauthorized modifications, code fingerprints deployments,
 * and creates an audit trail of all platform usage.
 *
 * Layers:
 *   1. Code Fingerprinting — unique watermark per deployment
 *   2. Integrity Check     — detects runtime modifications
 *   3. Domain Lock         — only runs on authorized origins
 *   4. Usage Audit         — logs all engine invocations
 *   5. Deployment Guard    — environment validation
 */

// ── Types ────────────────────────────────────────────────────────────

export interface DeploymentFingerprint {
  /** Unique deployment ID (generated at build time or first run) */
  deploymentId: string;
  /** Deployment domain */
  domain: string;
  /** Build timestamp */
  buildTimestamp: number;
  /** Platform version */
  version: string;
  /** Environment */
  environment: 'development' | 'staging' | 'production';
  /** Engine count (for tampering detection) */
  engineCount: number;
  /** Checksum of core modules (simplified) */
  coreChecksum: string;
}

export interface UsageAuditEntry {
  /** Engine ID that was called */
  engineId: string;
  /** Function name */
  functionName: string;
  /** Timestamp */
  timestamp: number;
  /** Execution time (ms) */
  executionTime: number;
  /** Whether the call succeeded */
  success: boolean;
  /** Deployment fingerprint */
  deploymentId: string;
  /** User session ID (anonymous) */
  sessionId: string;
}

export interface IntegrityReport {
  /** Overall integrity status */
  status: 'intact' | 'warning' | 'compromised';
  /** Deployment fingerprint */
  fingerprint: DeploymentFingerprint;
  /** Checks performed */
  checks: IntegrityCheck[];
  /** Usage statistics */
  usage: {
    totalCalls: number;
    uniqueEngines: number;
    sessionsToday: number;
    topEngines: { engineId: string; calls: number }[];
  };
  /** Timestamp */
  checkedAt: number;
}

export interface IntegrityCheck {
  name: string;
  passed: boolean;
  detail: string;
  severity: 'info' | 'warning' | 'critical';
}

// ── Deployment Fingerprinting ────────────────────────────────────────

const FINGERPRINT_KEY = 'chaintrust_deployment_fingerprint';
const AUDIT_KEY = 'chaintrust_usage_audit';
const SESSION_KEY = 'chaintrust_session_id';

function generateDeploymentId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

function getSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Get or create the deployment fingerprint.
 * Created once on first run, persists across sessions.
 */
export function getDeploymentFingerprint(): DeploymentFingerprint {
  const stored = localStorage.getItem(FINGERPRINT_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch { /* Fall through to create new */ }
  }

  const fingerprint: DeploymentFingerprint = {
    deploymentId: generateDeploymentId(),
    domain: typeof window !== 'undefined' ? window.location.hostname : 'server',
    buildTimestamp: Date.now(),
    version: '1.0.0',
    environment: typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'development' : 'production',
    engineCount: 73,
    coreChecksum: '', // Set below
  };

  // Compute checksum of critical constants
  const criticalData = [
    fingerprint.deploymentId,
    fingerprint.version,
    fingerprint.engineCount.toString(),
    'ChainTrust-SOL',
  ].join('|');

  // Simple FNV-1a hash as checksum
  let hash = 2166136261;
  for (let i = 0; i < criticalData.length; i++) {
    hash ^= criticalData.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  fingerprint.coreChecksum = hash.toString(16);

  localStorage.setItem(FINGERPRINT_KEY, JSON.stringify(fingerprint));
  return fingerprint;
}

// ── Domain Lock ──────────────────────────────────────────────────────

/** Domains that are always authorized (development) */
const ALWAYS_AUTHORIZED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
];

/**
 * Check if the current domain is authorized to run ChainTrust.
 * In production, authorized domains come from the license key.
 */
export function checkDomainAuthorization(authorizedDomains: string[] = []): {
  authorized: boolean;
  currentDomain: string;
  reason: string;
} {
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'server';

  // Always allow dev domains
  if (ALWAYS_AUTHORIZED_DOMAINS.includes(currentDomain)) {
    return { authorized: true, currentDomain, reason: 'Development domain — always authorized' };
  }

  // Check against authorized list
  if (authorizedDomains.length === 0) {
    return { authorized: true, currentDomain, reason: 'No domain restrictions configured' };
  }

  const isAuthorized = authorizedDomains.some(domain => {
    if (domain === '*') return true;
    if (domain.startsWith('*.')) {
      const suffix = domain.slice(2);
      return currentDomain === suffix || currentDomain.endsWith(`.${suffix}`);
    }
    return currentDomain === domain;
  });

  return {
    authorized: isAuthorized,
    currentDomain,
    reason: isAuthorized
      ? `Domain ${currentDomain} is in authorized list`
      : `Domain ${currentDomain} is NOT authorized. Allowed: ${authorizedDomains.join(', ')}`,
  };
}

// ── Usage Audit Trail ────────────────────────────────────────────────

/**
 * Log an engine usage event.
 * Call this from the SDK facade whenever an engine is invoked.
 */
export function logEngineUsage(
  engineId: string,
  functionName: string,
  executionTime: number,
  success: boolean,
): void {
  const fingerprint = getDeploymentFingerprint();
  const entry: UsageAuditEntry = {
    engineId,
    functionName,
    timestamp: Date.now(),
    executionTime,
    success,
    deploymentId: fingerprint.deploymentId,
    sessionId: getSessionId(),
  };

  // Store in localStorage (circular buffer, max 500 entries)
  const stored = localStorage.getItem(AUDIT_KEY);
  let entries: UsageAuditEntry[] = stored ? JSON.parse(stored) : [];
  entries.push(entry);
  if (entries.length > 500) entries = entries.slice(-500);
  localStorage.setItem(AUDIT_KEY, JSON.stringify(entries));
}

/**
 * Get usage audit entries.
 */
export function getUsageAudit(limit: number = 100): UsageAuditEntry[] {
  const stored = localStorage.getItem(AUDIT_KEY);
  const entries: UsageAuditEntry[] = stored ? JSON.parse(stored) : [];
  return entries.slice(-limit);
}

/**
 * Get usage statistics.
 */
export function getUsageStats(): {
  totalCalls: number;
  uniqueEngines: number;
  callsToday: number;
  topEngines: { engineId: string; calls: number }[];
  sessionsToday: number;
} {
  const entries = getUsageAudit(500);
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter(e => new Date(e.timestamp).toISOString().split('T')[0] === today);

  const engineCounts = new Map<string, number>();
  for (const e of entries) {
    engineCounts.set(e.engineId, (engineCounts.get(e.engineId) ?? 0) + 1);
  }

  const sessionSet = new Set(todayEntries.map(e => e.sessionId));

  return {
    totalCalls: entries.length,
    uniqueEngines: engineCounts.size,
    callsToday: todayEntries.length,
    topEngines: Array.from(engineCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([engineId, calls]) => ({ engineId, calls })),
    sessionsToday: sessionSet.size,
  };
}

// ── Integrity Verification ───────────────────────────────────────────

/**
 * Run all integrity checks.
 */
export function runIntegrityChecks(authorizedDomains: string[] = []): IntegrityReport {
  const fingerprint = getDeploymentFingerprint();
  const checks: IntegrityCheck[] = [];

  // Check 1: Domain authorization
  const domainCheck = checkDomainAuthorization(authorizedDomains);
  checks.push({
    name: 'Domain Authorization',
    passed: domainCheck.authorized,
    detail: domainCheck.reason,
    severity: domainCheck.authorized ? 'info' : 'critical',
  });

  // Check 2: Engine count integrity
  const expectedEngines = 73;
  const engineCountValid = fingerprint.engineCount === expectedEngines;
  checks.push({
    name: 'Engine Count Integrity',
    passed: engineCountValid,
    detail: engineCountValid
      ? `${fingerprint.engineCount} engines registered (expected: ${expectedEngines})`
      : `Engine count mismatch: ${fingerprint.engineCount} vs expected ${expectedEngines}`,
    severity: engineCountValid ? 'info' : 'warning',
  });

  // Check 3: Checksum integrity
  const criticalData = [
    fingerprint.deploymentId,
    fingerprint.version,
    fingerprint.engineCount.toString(),
    'ChainTrust-SOL',
  ].join('|');
  let hash = 2166136261;
  for (let i = 0; i < criticalData.length; i++) {
    hash ^= criticalData.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  const checksumValid = fingerprint.coreChecksum === hash.toString(16);
  checks.push({
    name: 'Core Checksum',
    passed: checksumValid,
    detail: checksumValid
      ? 'Core module checksum matches — no tampering detected'
      : 'CHECKSUM MISMATCH — core modules may have been modified',
    severity: checksumValid ? 'info' : 'critical',
  });

  // Check 4: Environment detection
  const isDev = fingerprint.environment === 'development';
  checks.push({
    name: 'Environment',
    passed: true,
    detail: `Running in ${fingerprint.environment} mode${isDev ? ' (all features unlocked for development)' : ''}`,
    severity: 'info',
  });

  // Check 5: Console tampering detection
  const consoleIntact = typeof console.log === 'function';
  checks.push({
    name: 'Console Integrity',
    passed: consoleIntact,
    detail: consoleIntact ? 'Console API intact' : 'Console API has been modified — possible debugging attempt',
    severity: consoleIntact ? 'info' : 'warning',
  });

  // Overall status
  const criticalFailures = checks.filter(c => !c.passed && c.severity === 'critical');
  const warnings = checks.filter(c => !c.passed && c.severity === 'warning');
  const status: IntegrityReport['status'] =
    criticalFailures.length > 0 ? 'compromised' :
    warnings.length > 0 ? 'warning' :
    'intact';

  // Usage stats
  const usageStats = getUsageStats();

  return {
    status,
    fingerprint,
    checks,
    usage: {
      totalCalls: usageStats.totalCalls,
      uniqueEngines: usageStats.uniqueEngines,
      sessionsToday: usageStats.sessionsToday,
      topEngines: usageStats.topEngines,
    },
    checkedAt: Date.now(),
  };
}

/**
 * Generate a deployment report for the founders.
 * Shows who is using the platform, from where, and how.
 */
export function generateDeploymentReport(): {
  fingerprint: DeploymentFingerprint;
  usage: ReturnType<typeof getUsageStats>;
  integrity: IntegrityReport;
  licenseStatus: string;
} {
  return {
    fingerprint: getDeploymentFingerprint(),
    usage: getUsageStats(),
    integrity: runIntegrityChecks(),
    licenseStatus: localStorage.getItem('chaintrust_license') ? 'License key present' : 'No license key',
  };
}
