import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio,
  Wallet,
  Droplet,
  Hash,
  Rocket,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Share2,
  History,
  Trash2,
  Twitter,
  TerminalSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import ChainStatus from '@/components/common/ChainStatus';
import { SOLANA_NETWORK, explorerTxUrl, explorerAddressUrl } from '@/lib/solana-config';
import {
  sendProofHashMemo,
  requestDevnetAirdrop,
  MEMO_PROGRAM_ID,
  type LiveAnchorParams,
} from '@/lib/memo-anchor';
import { fireConfetti } from '@/lib/confetti';
import {
  readRecentAnchors,
  pushRecentAnchor,
  clearRecentAnchors,
  type RecentAnchor,
} from '@/lib/recent-anchors';
import { useSolPrice } from '@/hooks/use-pyth-price';

type Stage = 'idle' | 'airdropping' | 'anchoring' | 'success' | 'error';

const SAMPLE: LiveAnchorParams = {
  startupName: 'GreenChain Demo',
  startupId: 42,
  mrr: 125_000,
  totalUsers: 18_400,
  activeUsers: 12_900,
  burnRate: 45_000,
  runway: 18,
  growthRate: 0.23,
  carbonOffset: 340,
};

const STEP_DEFS = [
  { id: 1, key: 'connect', icon: Wallet, title: 'Connect wallet' },
  { id: 2, key: 'airdrop', icon: Droplet, title: 'Get devnet SOL' },
  { id: 3, key: 'metrics', icon: Hash, title: 'Set metrics' },
  { id: 4, key: 'anchor', icon: Rocket, title: 'Anchor on-chain' },
] as const;

/**
 * Live Solana Devnet demo — investor-grade end-to-end flow.
 *
 * Connects a real wallet, optionally air-drops devnet SOL, and posts a real
 * SPL Memo transaction containing a SHA-256 proof of the startup metrics.
 * Returns a verifiable Solana Explorer link the judges can click.
 *
 * Now upgraded with: progress sidebar, USD-cost from Pyth oracle, share
 * card, recent-anchor history, ready-to-paste CLI verify command, confetti
 * on success, and accessibility improvements.
 */
export default function LiveTestnetDemo() {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { price: solPrice } = useSolPrice();
  const [params, setParams] = useState<LiveAnchorParams>(SAMPLE);
  const [stage, setStage] = useState<Stage>('idle');
  const [balance, setBalance] = useState<number | null>(null);
  const [airdropSig, setAirdropSig] = useState<string | null>(null);
  const [anchorSig, setAnchorSig] = useState<string | null>(null);
  const [proofHex, setProofHex] = useState<string | null>(null);
  const [memoPayload, setMemoPayload] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<'sig' | 'cli' | null>(null);
  const [recent, setRecent] = useState<RecentAnchor[]>(() => readRecentAnchors());

  const onMainnet = SOLANA_NETWORK === 'mainnet-beta';

  // Refs for auto-scroll to next step
  const stepRefs = {
    1: useRef<HTMLDivElement>(null),
    2: useRef<HTMLDivElement>(null),
    3: useRef<HTMLDivElement>(null),
    4: useRef<HTMLDivElement>(null),
  };
  const successRef = useRef<HTMLDivElement>(null);

  // Step state vector — drives progress sidebar
  const stepDone = useMemo(
    () => ({
      1: connected,
      2: connected && balance !== null && balance > 0.001,
      3: stage === 'success',
      4: stage === 'success',
    }),
    [connected, balance, stage],
  );

  const currentStep = useMemo(() => {
    if (!stepDone[1]) return 1;
    if (!stepDone[2] && !onMainnet) return 2;
    if (!stepDone[4]) return 4;
    return 4;
  }, [stepDone, onMainnet]);

  const refreshBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    }
  }, [connection, publicKey]);

  useEffect(() => {
    if (connected) refreshBalance();
    else setBalance(null);
  }, [connected, refreshBalance]);

  // Auto-scroll to active step on transitions
  useEffect(() => {
    const r = stepRefs[currentStep as 1 | 2 | 3 | 4];
    if (r?.current && stage === 'idle') {
      r.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, stage]); // eslint-disable-line react-hooks/exhaustive-deps

  const onAirdrop = useCallback(async () => {
    if (!publicKey) return;
    setErr(null);
    setStage('airdropping');
    try {
      const sig = await requestDevnetAirdrop(connection, publicKey, 1);
      setAirdropSig(sig);
      await refreshBalance();
      setStage('idle');
    } catch (e: unknown) {
      const msg = (e as Error)?.message ?? 'unknown error';
      setErr(
        msg.includes('429') || msg.toLowerCase().includes('rate')
          ? 'Devnet faucet is rate-limited right now. Try again in a minute, or grab SOL from https://faucet.solana.com'
          : `Airdrop failed: ${msg}`,
      );
      setStage('error');
    }
  }, [connection, publicKey, refreshBalance]);

  const onAnchor = useCallback(async () => {
    if (!publicKey) {
      setErr('Connect a wallet first.');
      return;
    }
    setErr(null);
    setAnchorSig(null);
    setProofHex(null);
    setMemoPayload(null);
    setStage('anchoring');
    try {
      const { signature, proofHashHex, memoPayload: payload } = await sendProofHashMemo(
        connection,
        publicKey,
        sendTransaction,
        params,
      );
      setAnchorSig(signature);
      setProofHex(proofHashHex);
      setMemoPayload(payload);
      setStage('success');

      // Persist to local history
      const entry: RecentAnchor = {
        signature,
        proofHashHex,
        startupName: params.startupName,
        cluster: SOLANA_NETWORK,
        timestamp: Date.now(),
      };
      pushRecentAnchor(entry);
      setRecent(readRecentAnchors());

      fireConfetti();
      refreshBalance();
      // Bring the success card into view
      setTimeout(() => successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
    } catch (e: unknown) {
      const msg = (e as Error)?.message ?? String(e);
      setErr(
        msg.includes('User rejected') || msg.includes('reject')
          ? 'Transaction rejected in the wallet. Approve it to continue.'
          : msg.includes('insufficient')
          ? 'Not enough SOL to pay the transaction fee. Click "Airdrop 1 SOL" above.'
          : `Transaction failed: ${msg}`,
      );
      setStage('error');
    }
  }, [connection, publicKey, sendTransaction, params, refreshBalance]);

  const copy = useCallback(async (text: string, kind: 'sig' | 'cli') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard blocked — silent fail */
    }
  }, []);

  const update = (key: keyof LiveAnchorParams) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setParams((p) => ({
      ...p,
      [key]:
        key === 'startupName' ? v : key === 'growthRate' ? Number(v) / 100 : Number(v),
    }));
  };

  const reset = useCallback(() => {
    setStage('idle');
    setAnchorSig(null);
    setProofHex(null);
    setMemoPayload(null);
    setErr(null);
  }, []);

  // ── Derived UI strings ──────────────────────────────────────────────
  const txCostSol = 0.000005;
  const txCostUsd = solPrice?.price ? txCostSol * solPrice.price : null;
  const balanceUsd = balance && solPrice?.price ? balance * solPrice.price : null;

  const cliVerify = anchorSig
    ? `solana confirm -v ${anchorSig} --url ${SOLANA_NETWORK}`
    : '';

  const tweetHref = anchorSig
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        `Just anchored a verifiable proof of my startup metrics on Solana ${SOLANA_NETWORK} via @ChainTrustSOL — every number is on-chain & re-checkable. View tx:`,
      )}&url=${encodeURIComponent(explorerTxUrl(anchorSig))}`
    : '';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-6">
        <div
          className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300 mb-4"
          aria-label={`Connected to Solana ${SOLANA_NETWORK}`}
        >
          <Radio className="h-3.5 w-3.5 animate-pulse" /> Live Solana {SOLANA_NETWORK} — real signed transactions
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Live Testnet Demo</h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          End-to-end proof that ChainTrust runs on real Solana infrastructure.
          Connect your wallet, get free devnet SOL, and anchor a cryptographic
          proof of your startup metrics on-chain. Every step is a real,
          verifiable transaction.
        </p>
      </header>

      {onMainnet && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" aria-hidden="true" />
            <div className="text-sm">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                Mainnet mode — airdrops disabled.
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                Set <code className="font-mono">VITE_SOLANA_CLUSTER=devnet</code> in your <code className="font-mono">.env</code> to use the free testnet faucet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-[280px_1fr_280px] gap-6">
        {/* ── Progress sidebar (sticky) ─────────────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start order-2 lg:order-1" aria-label="Demo progress">
          <Card>
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-3">
                Progress
              </p>
              <ol className="space-y-2">
                {STEP_DEFS.map((s) => {
                  const done = stepDone[s.id as keyof typeof stepDone];
                  const isCurrent = !done && currentStep === s.id;
                  const Icon = s.icon;
                  return (
                    <li key={s.id}>
                      <button
                        onClick={() => stepRefs[s.id as 1 | 2 | 3 | 4]?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                        aria-current={isCurrent ? 'step' : undefined}
                        className={`w-full flex items-center gap-2.5 rounded-md px-2 py-2 text-left transition ${
                          isCurrent
                            ? 'bg-primary/10 text-primary'
                            : done
                            ? 'text-foreground hover:bg-muted/40'
                            : 'text-muted-foreground hover:bg-muted/40'
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            done
                              ? 'bg-emerald-500 text-white'
                              : isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {done ? <Check className="h-3 w-3" /> : s.id}
                        </span>
                        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="text-xs font-medium truncate">{s.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
              {balance !== null && (
                <div className="mt-4 rounded-md bg-muted/40 p-3 text-xs">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Wallet balance</p>
                  <p className="mt-0.5 font-mono font-bold text-foreground tabular-nums">
                    {balance.toFixed(4)} SOL
                  </p>
                  {balanceUsd !== null && (
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      ≈ ${balanceUsd.toFixed(2)} USD
                    </p>
                  )}
                </div>
              )}
              <div className="mt-3 rounded-md bg-muted/40 p-3 text-xs">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tx cost</p>
                <p className="mt-0.5 font-mono text-foreground tabular-nums">
                  {txCostSol} SOL
                  {txCostUsd !== null && (
                    <span className="ml-1.5 text-muted-foreground">
                      (≈ ${txCostUsd < 0.01 ? '<0.01' : txCostUsd.toFixed(2)})
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* ── Main column ───────────────────────────────────────────── */}
        <main className="space-y-5 order-1 lg:order-2 min-w-0">
          <Step
            ref={stepRefs[1]}
            num={1}
            icon={Wallet}
            title="Connect a Solana wallet"
            done={stepDone[1]}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm">
                {connected && publicKey ? (
                  <>
                    <p className="font-medium">Connected</p>
                    <a
                      href={explorerAddressUrl(publicKey.toBase58())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-primary hover:underline inline-flex items-center gap-1"
                    >
                      {publicKey.toBase58().slice(0, 8)}…{publicKey.toBase58().slice(-8)}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Any Solana wallet works — Phantom, Solflare, or Coinbase. The demo never touches your mainnet funds.
                  </p>
                )}
              </div>
              <WalletMultiButton
                style={{
                  background: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  borderRadius: '0.5rem',
                  height: '40px',
                  fontSize: '14px',
                  fontWeight: 600,
                }}
              />
            </div>
          </Step>

          <Step
            ref={stepRefs[2]}
            num={2}
            icon={Droplet}
            title="Get free devnet SOL"
            done={stepDone[2]}
            disabled={!connected || onMainnet}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm">
                <p className="text-muted-foreground">
                  Transactions cost ~0.000005 SOL. The devnet faucet drops 1 SOL per request.
                </p>
                {airdropSig && (
                  <a
                    href={explorerTxUrl(airdropSig)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-emerald-600 hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    Airdrop confirmed — view tx
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
              <Button
                onClick={onAirdrop}
                disabled={!connected || onMainnet || stage === 'airdropping'}
                variant="secondary"
                className="gap-2"
              >
                {stage === 'airdropping' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span aria-live="polite">Requesting…</span>
                  </>
                ) : (
                  <>
                    <Droplet className="h-4 w-4" aria-hidden="true" /> Airdrop 1 SOL
                  </>
                )}
              </Button>
            </div>
          </Step>

          <Step
            ref={stepRefs[3]}
            num={3}
            icon={Hash}
            title="Enter metrics to anchor"
            done={stepDone[3]}
          >
            <p className="text-sm text-muted-foreground mb-4">
              We compute a SHA-256 hash of these values and post it on-chain. Change any field to see a different proof.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Startup name" value={params.startupName} onChange={update('startupName')} />
              <Field label="Startup ID" type="number" value={params.startupId} onChange={update('startupId')} />
              <Field label="MRR ($)" type="number" value={params.mrr} onChange={update('mrr')} />
              <Field label="Total users" type="number" value={params.totalUsers} onChange={update('totalUsers')} />
              <Field label="Active users" type="number" value={params.activeUsers} onChange={update('activeUsers')} />
              <Field label="Burn rate ($/mo)" type="number" value={params.burnRate} onChange={update('burnRate')} />
              <Field label="Runway (months)" type="number" value={params.runway} onChange={update('runway')} />
              <Field label="Growth rate (%)" type="number" value={params.growthRate * 100} onChange={update('growthRate')} />
              <Field label="Carbon offset (tons)" type="number" value={params.carbonOffset} onChange={update('carbonOffset')} />
            </div>
          </Step>

          <Step
            ref={stepRefs[4]}
            num={4}
            icon={Rocket}
            title="Anchor proof on-chain"
            done={stepDone[4]}
            disabled={!connected}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground max-w-md">
                Signs a real Solana transaction in your wallet and posts the SHA-256 proof to the{' '}
                <a
                  href={explorerAddressUrl(MEMO_PROGRAM_ID.toBase58())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  SPL Memo Program
                </a>
                .
              </div>
              <Button
                onClick={onAnchor}
                disabled={!connected || stage === 'anchoring'}
                className="gap-2 px-6"
              >
                {stage === 'anchoring' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span aria-live="polite">Anchoring…</span>
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" aria-hidden="true" /> Anchor to {SOLANA_NETWORK}
                  </>
                )}
              </Button>
            </div>
          </Step>

          {/* ── Error banner ─────────────────────────────────────────── */}
          <AnimatePresence>
            {err && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                role="alert"
              >
                <Card className="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
                  <CardContent className="p-4 flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-red-800 dark:text-red-200">
                        Something went wrong
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1 break-words">{err}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setErr(null)} aria-label="Dismiss error">
                      ✕
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Success card ─────────────────────────────────────────── */}
          <AnimatePresence>
            {stage === 'success' && anchorSig && proofHex && (
              <motion.div
                ref={successRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                role="status"
                aria-live="polite"
              >
                <Card className="border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CheckCircle2 className="h-6 w-6 text-emerald-500" aria-hidden="true" />
                      <h3 className="font-bold text-lg">Proof anchored on Solana {SOLANA_NETWORK}</h3>
                      <span className="ml-auto text-[10px] uppercase tracking-wider rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 border border-emerald-500/20 font-bold">
                        Confirmed
                      </span>
                    </div>

                    <div className="rounded-lg bg-background border p-3 space-y-3 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Transaction signature</div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs break-all flex-1">{anchorSig}</code>
                          <button
                            onClick={() => copy(anchorSig, 'sig')}
                            className="shrink-0"
                            aria-label="Copy transaction signature"
                          >
                            {copied === 'sig' ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground mb-1">SHA-256 proof hash</div>
                        <code className="font-mono text-xs break-all text-primary">{proofHex}</code>
                      </div>

                      {memoPayload && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            On-chain memo payload
                          </summary>
                          <pre className="mt-2 text-[10px] bg-muted/50 rounded p-2 overflow-x-auto">
                            {memoPayload}
                          </pre>
                        </details>
                      )}

                      {/* Ready-to-paste verify command */}
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5">
                          <TerminalSquare className="h-3 w-3" aria-hidden="true" />
                          Verify yourself
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 font-mono text-[11px] break-all bg-muted/40 rounded p-2 leading-relaxed">
                            {cliVerify}
                          </code>
                          <button
                            onClick={() => copy(cliVerify, 'cli')}
                            aria-label="Copy CLI verify command"
                            className="shrink-0"
                          >
                            {copied === 'cli' ? (
                              <Check className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a href={explorerTxUrl(anchorSig)} target="_blank" rel="noopener noreferrer">
                        <Button className="gap-2">
                          <ExternalLink className="h-4 w-4" aria-hidden="true" /> View on Explorer
                        </Button>
                      </a>
                      <a href={tweetHref} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="gap-2">
                          <Twitter className="h-4 w-4" aria-hidden="true" /> Share on X
                        </Button>
                      </a>
                      <Button variant="outline" onClick={reset} className="gap-2">
                        <Share2 className="h-4 w-4" aria-hidden="true" /> Anchor another
                      </Button>
                    </div>

                    <div className="rounded-md border bg-background/50 p-3 text-xs text-muted-foreground flex gap-2">
                      <Info className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                      <div>
                        This is a real, immutable Solana transaction. Anyone, anywhere, can replay this verification — no ChainTrust backend, API key, or login required.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ── Right rail ────────────────────────────────────────────── */}
        <aside className="space-y-4 order-3" aria-label="Helpful context">
          <ChainStatus />

          {recent.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    Recent anchors
                  </h4>
                  <button
                    onClick={() => {
                      clearRecentAnchors();
                      setRecent([]);
                    }}
                    aria-label="Clear recent anchors"
                    className="text-muted-foreground hover:text-foreground transition"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <ul className="space-y-1.5">
                  {recent.slice(0, 5).map((r) => (
                    <li key={r.signature}>
                      <a
                        href={explorerTxUrl(r.signature)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-md border border-border/60 bg-muted/30 p-2 hover:bg-muted/50 transition"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-foreground truncate">
                            {r.startupName}
                          </span>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {timeSince(r.timestamp)}
                          </span>
                        </div>
                        <code className="mt-0.5 text-[10px] text-muted-foreground font-mono block truncate">
                          {r.signature.slice(0, 14)}…{r.signature.slice(-6)}
                        </code>
                      </a>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card className="border-border/60">
            <CardContent className="p-4 text-sm">
              <h4 className="font-semibold mb-3">Why this matters</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong className="text-foreground">Real wallet signature</strong> — Phantom, Solflare, Coinbase, your keys.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong className="text-foreground">Real Solana transaction</strong> — confirmed in ~2s, on Explorer forever.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong className="text-foreground">Trustless verification</strong> — replay the SHA-256 yourself.
                  </span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong className="text-foreground">No gatekeeper</strong> — uses the canonical SPL Memo Program.
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// ── Subcomponents ────────────────────────────────────────────────────

interface StepProps {
  num: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  done?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const Step = forwardRef<HTMLDivElement, StepProps>(function Step(
  { num, icon: Icon, title, done, disabled, children },
  ref,
) {
  return (
    <Card
      ref={ref}
      className={`${done ? 'border-emerald-300 dark:border-emerald-800' : 'border-border'} ${disabled ? 'opacity-60' : ''}`}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              done ? 'bg-emerald-500 text-white' : 'bg-primary/10 text-primary'
            }`}
          >
            {done ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : num}
          </div>
          <h3 className="font-semibold flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {title}
          </h3>
        </div>
        <div className="pl-11">{children}</div>
      </CardContent>
    </Card>
  );
});

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground mb-1 block">{label}</Label>
      <Input type={type} value={value} onChange={onChange} />
    </div>
  );
}

function timeSince(ts: number): string {
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}
