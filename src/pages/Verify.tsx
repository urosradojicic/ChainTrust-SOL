import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getErrorMessage } from '@/lib/errors';
import { useConnection } from '@solana/wallet-adapter-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Shield, CheckCircle2, XCircle, Loader2, Hash,
  Clock, Users, TrendingUp, DollarSign, Leaf, ExternalLink,
  Copy, Check, AlertTriangle, Radio, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { getStartupPDA, getMetricsPDA, getBadgePDA, PROGRAM_ID } from '@/lib/contracts';
import { computeProofHash } from '@/hooks/use-blockchain';
import { SOLANA_NETWORK } from '@/lib/solana-config';
import ChainStatus from '@/components/common/ChainStatus';

interface OnChainStartup {
  id: number;
  owner: string;
  name: string;
  category: string;
  metadataUri: string;
  registeredAt: number;
  isVerified: boolean;
  verifiedAt: number;
  trustScore: number;
  totalReports: number;
}

interface OnChainMetrics {
  startupId: number;
  timestamp: number;
  mrr: number;
  totalUsers: number;
  activeUsers: number;
  burnRate: number;
  runway: number;
  growthRate: number;
  carbonOffset: number;
  proofHash: number[];
  oracleVerified: boolean;
}

interface OnChainBadge {
  startupId: number;
  owner: string;
  trustScore: number;
  verifiedAt: number;
  verifier: string;
  isLocked: boolean;
}

interface VerificationResult {
  startup: OnChainStartup | null;
  metrics: OnChainMetrics | null;
  badge: OnChainBadge | null;
  proofValid: boolean | null;
  startupPDA: string;
  metricsPDA: string;
  badgePDA: string;
}

/**
 * Public Proof Verifier — the "aha" moment.
 *
 * Anyone (no wallet required) can enter a startup ID and independently verify:
 * 1. The startup exists on-chain
 * 2. Its metrics are published with a SHA-256 proof hash
 * 3. The proof hash matches the recomputed hash from the raw metrics
 * 4. A soulbound verification badge exists
 *
 * This is the core value proposition: trustless, independent verification.
 */
export default function Verify() {
  const { connection } = useConnection();
  const [startupId, setStartupId] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const verify = useCallback(async () => {
    const id = parseInt(startupId, 10);
    if (isNaN(id) || id < 1) {
      setError('Enter a valid startup ID (positive integer)');
      return;
    }

    setIsVerifying(true);
    setError(null);
    setResult(null);

    try {
      const [startupPDA] = getStartupPDA(id);
      const [metricsPDA] = getMetricsPDA(id);
      const [badgePDA] = getBadgePDA(id);

      // Fetch all three accounts in parallel
      const [startupInfo, metricsInfo, badgeInfo] = await Promise.all([
        connection.getAccountInfo(startupPDA),
        connection.getAccountInfo(metricsPDA),
        connection.getAccountInfo(badgePDA),
      ]);

      let startup: OnChainStartup | null = null;
      let metrics: OnChainMetrics | null = null;
      let badge: OnChainBadge | null = null;
      let proofValid: boolean | null = null;

      // Parse startup account
      if (startupInfo?.data && startupInfo.data.length > 8) {
        const d = startupInfo.data;
        const off = 8; // Anchor discriminator
        const nameLen = d.readUInt32LE(off + 8 + 32); // after id(8) + owner(32)
        const nameStart = off + 8 + 32 + 4;
        const name = d.subarray(nameStart, nameStart + nameLen).toString('utf8');
        const catOff = nameStart + nameLen;
        const catLen = d.readUInt32LE(catOff);
        const category = d.subarray(catOff + 4, catOff + 4 + catLen).toString('utf8');
        const uriOff = catOff + 4 + catLen;
        const uriLen = d.readUInt32LE(uriOff);
        const metadataUri = d.subarray(uriOff + 4, uriOff + 4 + uriLen).toString('utf8');
        const fixedOff = uriOff + 4 + uriLen;

        startup = {
          id: Number(d.readBigUInt64LE(off)),
          owner: d.subarray(off + 8, off + 40).reduce((s, b) => s + b.toString(16).padStart(2, '0'), ''),
          name,
          category,
          metadataUri,
          registeredAt: Number(d.readBigInt64LE(fixedOff)),
          isVerified: d.readUInt8(fixedOff + 8) === 1,
          verifiedAt: Number(d.readBigInt64LE(fixedOff + 9)),
          trustScore: Number(d.readBigUInt64LE(fixedOff + 17)),
          totalReports: Number(d.readBigUInt64LE(fixedOff + 25)),
        };
      }

      // Parse metrics account
      if (metricsInfo?.data && metricsInfo.data.length >= 112) {
        const d = metricsInfo.data;
        const off = 8;
        metrics = {
          startupId: Number(d.readBigUInt64LE(off)),
          timestamp: Number(d.readBigInt64LE(off + 8)),
          mrr: Number(d.readBigUInt64LE(off + 16)),
          totalUsers: Number(d.readBigUInt64LE(off + 24)),
          activeUsers: Number(d.readBigUInt64LE(off + 32)),
          burnRate: Number(d.readBigUInt64LE(off + 40)),
          runway: Number(d.readBigUInt64LE(off + 48)),
          growthRate: Number(d.readBigInt64LE(off + 56)),
          carbonOffset: Number(d.readBigUInt64LE(off + 64)),
          proofHash: Array.from(d.subarray(off + 72, off + 104)),
          oracleVerified: d.readUInt8(off + 104) === 1,
        };

        // Independently verify the proof hash
        const recomputed = await computeProofHash({
          mrr: metrics.mrr,
          users: metrics.totalUsers,
          activeUsers: metrics.activeUsers,
          burnRate: metrics.burnRate,
          runway: metrics.runway,
          growthRate: metrics.growthRate / 100, // stored as growthRate*100 on-chain
          carbonOffset: metrics.carbonOffset,
        });

        proofValid = metrics.proofHash.every((b, i) => b === recomputed[i]);
      }

      // Parse badge account
      if (badgeInfo?.data && badgeInfo.data.length > 8) {
        const d = badgeInfo.data;
        const off = 8;
        badge = {
          startupId: Number(d.readBigUInt64LE(off)),
          owner: d.subarray(off + 8, off + 40).reduce((s, b) => s + b.toString(16).padStart(2, '0'), ''),
          trustScore: Number(d.readBigUInt64LE(off + 40)),
          verifiedAt: Number(d.readBigInt64LE(off + 48)),
          verifier: d.subarray(off + 56, off + 88).reduce((s, b) => s + b.toString(16).padStart(2, '0'), ''),
          isLocked: d.readUInt8(off + 88) === 1,
        };
      }

      if (!startup && !metrics && !badge) {
        setError(`No on-chain data found for startup ID ${id}. The startup may not be registered yet, or the program may not be deployed.`);
        return;
      }

      setResult({
        startup,
        metrics,
        badge,
        proofValid,
        startupPDA: startupPDA.toBase58(),
        metricsPDA: metricsPDA.toBase58(),
        badgePDA: badgePDA.toBase58(),
      });
    } catch (e: unknown) {
      setError(`Verification failed: ${getErrorMessage(e)}`);
    } finally {
      setIsVerifying(false);
    }
  }, [connection, startupId]);

  const copyHash = (hash: number[]) => {
    const hex = hash.map(b => b.toString(16).padStart(2, '0')).join('');
    navigator.clipboard.writeText(hex);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const formatDate = (ts: number) => ts > 0 ? new Date(ts * 1000).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }) : 'N/A';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-sm font-medium text-accent mb-4">
          <Shield className="h-3.5 w-3.5" /> Public Verification — No Wallet Required
        </div>
        <h1 className="text-3xl font-bold">Verify On-Chain</h1>
        <p className="mt-2 text-muted-foreground max-w-2xl">
          Independently verify any startup's metrics directly from the Solana blockchain.
          No account needed. No trust required. Just cryptographic proof.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_280px] gap-6">
        <div className="space-y-6">
          {/* Live Testnet CTA */}
          <Link to="/testnet-demo" className="block group">
            <Card className="border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                  <Radio className="h-5 w-5 text-green-600 animate-pulse" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">Try the Live Testnet Demo</p>
                  <p className="text-xs text-muted-foreground">
                    Connect a wallet and anchor a real proof on Solana {SOLANA_NETWORK} in under 10 seconds.
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-green-600 group-hover:translate-x-1 transition" />
              </CardContent>
            </Card>
          </Link>

          {/* Search */}
          <Card>
            <CardContent className="p-5">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Enter Startup ID (e.g., 1)"
                    value={startupId}
                    onChange={(e) => setStartupId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && verify()}
                    className="pl-10"
                  />
                </div>
                <Button onClick={verify} disabled={isVerifying || !startupId} className="gap-2 px-6">
                  {isVerifying ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</>
                  ) : (
                    <><Shield className="h-4 w-4" /> Verify</>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                This reads directly from Solana {SOLANA_NETWORK} RPC. No backend, no API keys, no intermediary.
                You can verify the same data using any Solana RPC client or CLI.
              </p>
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-yellow-300 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800">
                <CardContent className="p-4 flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">No Data Found</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">{error}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Results */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                {/* Startup Identity */}
                {result.startup && (
                  <Card className="border-primary/20">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          Startup Found On-Chain
                        </h3>
                        <a
                          href={`https://explorer.solana.com/address/${result.startupPDA}?cluster=${SOLANA_NETWORK}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View on Explorer <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name</span>
                          <p className="font-bold text-lg">{result.startup.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Category</span>
                          <p className="font-medium">{result.startup.category}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Registered</span>
                          <p className="font-medium">{formatDate(result.startup.registeredAt)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Trust Score</span>
                          <p className="font-bold text-accent">{result.startup.trustScore}/100</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Verified</span>
                          <p className={`font-medium flex items-center gap-1 ${result.startup.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                            {result.startup.isVerified ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                            {result.startup.isVerified ? 'Yes' : 'Pending'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total Reports</span>
                          <p className="font-medium">{result.startup.totalReports}</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t text-xs">
                        <span className="text-muted-foreground">PDA: </span>
                        <span className="font-mono">{result.startupPDA}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Metrics + Proof Hash */}
                {result.metrics && (
                  <Card className={result.proofValid ? 'border-green-300 dark:border-green-800' : 'border-red-300 dark:border-red-800'}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold flex items-center gap-2">
                          {result.proofValid ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          Metrics {result.proofValid ? 'Verified' : 'Hash Mismatch'}
                        </h3>
                        <a
                          href={`https://explorer.solana.com/address/${result.metricsPDA}?cluster=${SOLANA_NETWORK}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View on Explorer <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-4">
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                            <DollarSign className="h-3 w-3" /> MRR
                          </div>
                          <p className="font-bold font-mono">${result.metrics.mrr.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                            <Users className="h-3 w-3" /> Users
                          </div>
                          <p className="font-bold font-mono">{result.metrics.totalUsers.toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                            <TrendingUp className="h-3 w-3" /> Growth
                          </div>
                          <p className="font-bold font-mono">{(result.metrics.growthRate / 100).toFixed(1)}%</p>
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3">
                          <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                            <Leaf className="h-3 w-3" /> Carbon
                          </div>
                          <p className="font-bold font-mono">{result.metrics.carbonOffset}t</p>
                        </div>
                      </div>

                      {/* Proof hash verification */}
                      <div className={`rounded-lg p-4 ${result.proofValid ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <Hash className="h-4 w-4" />
                          <span className="font-semibold text-sm">SHA-256 Proof Hash Verification</span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-20 shrink-0">On-chain:</span>
                            <code className="font-mono break-all">
                              {result.metrics.proofHash.map(b => b.toString(16).padStart(2, '0')).join('')}
                            </code>
                            <button onClick={() => copyHash(result.metrics!.proofHash)} className="shrink-0">
                              {copiedHash ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />}
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground w-20 shrink-0">Recomputed:</span>
                            <code className="font-mono break-all text-accent">
                              SHA-256({result.metrics.mrr}|{result.metrics.totalUsers}|{result.metrics.activeUsers}|{result.metrics.burnRate}|{result.metrics.runway}|{result.metrics.growthRate}|{result.metrics.carbonOffset})
                            </code>
                          </div>
                        </div>
                        <p className={`mt-2 text-xs font-semibold ${result.proofValid ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          {result.proofValid ? 'Match confirmed — metrics are cryptographically verified' : 'Mismatch — on-chain data may have been tampered with'}
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground mt-3">
                        Published: {formatDate(result.metrics.timestamp)} | Oracle verified: {result.metrics.oracleVerified ? 'Yes' : 'No'}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Soulbound Badge */}
                {result.badge ? (
                  <Card className="border-primary dark:border-primary">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          Soulbound Badge Found
                        </h3>
                        <a
                          href={`https://explorer.solana.com/address/${result.badgePDA}?cluster=${SOLANA_NETWORK}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View on Explorer <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="grid sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Trust Score</span>
                          <p className="font-bold text-lg text-primary">{result.badge.trustScore}/100</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Verified At</span>
                          <p className="font-medium">{formatDate(result.badge.verifiedAt)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Soulbound</span>
                          <p className="font-medium text-primary flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4" /> Non-Transferable
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : result.startup && (
                  <Card className="border-border/60">
                    <CardContent className="p-4 flex items-center gap-3 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      No soulbound badge minted yet for this startup.
                    </CardContent>
                  </Card>
                )}

                {/* How to verify yourself */}
                <Card className="border-border/60 bg-muted/30">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-2">Verify It Yourself</h4>
                    <p className="text-xs text-muted-foreground mb-2">
                      You don't need to trust ChainTrust. Run this command to verify independently:
                    </p>
                    <pre className="text-xs bg-background rounded-lg p-3 overflow-x-auto border font-mono">
{`solana account ${result.metricsPDA} \\
  --url ${SOLANA_NETWORK} --output json`}
                    </pre>
                    <p className="text-xs text-muted-foreground mt-2">
                      Then compute SHA-256 of the raw metrics and compare with the on-chain proof hash.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {!result && !error && !isVerifying && (
            <div className="text-center py-16 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">Enter a startup ID to begin verification</p>
              <p className="text-sm mt-1">All data is read directly from Solana. No intermediary.</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <ChainStatus />

          <Card className="border-border/60">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-3">How Verification Works</h4>
              <div className="space-y-3 text-xs text-muted-foreground">
                <div className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">1</span>
                  <p>Read the startup's <span className="font-mono text-foreground">MetricsAccount</span> PDA directly from Solana</p>
                </div>
                <div className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">2</span>
                  <p>Extract the raw metrics (MRR, users, growth, etc.) and the stored proof hash</p>
                </div>
                <div className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">3</span>
                  <p>Recompute <span className="font-mono text-foreground">SHA-256(mrr|users|active|burn|runway|growth|carbon)</span></p>
                </div>
                <div className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold">4</span>
                  <p>Compare: if hashes match, the metrics are cryptographically verified</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2">Cost Comparison</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">This verification</span>
                  <span className="font-mono font-bold text-accent">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Traditional audit</span>
                  <span className="font-mono text-destructive">$50,000+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time to verify</span>
                  <span className="font-mono font-bold text-accent">~2 sec</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Traditional time</span>
                  <span className="font-mono text-destructive">6+ weeks</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
