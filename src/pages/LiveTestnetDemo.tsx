import { useCallback, useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Radio, Wallet, Droplet, Hash, Rocket, CheckCircle2, XCircle,
  Loader2, ExternalLink, Copy, Check, AlertTriangle, Info,
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

type Stage = 'idle' | 'airdropping' | 'anchoring' | 'success' | 'error';

const SAMPLE: LiveAnchorParams = {
  startupName: 'GreenChain Demo',
  startupId: 42,
  mrr: 125_000,
  totalUsers: 18_400,
  activeUsers: 12_900,
  burnRate: 45_000,
  runway: 18,
  growthRate: 0.23, // 23%
  carbonOffset: 340,
};

/**
 * Live Solana Devnet demo — end-to-end, investor-ready.
 *
 * Connects a real wallet, optionally air-drops devnet SOL, and sends a real
 * Memo-program transaction anchoring a SHA-256 proof of the startup metrics
 * on-chain. Returns a verifiable Solana Explorer link.
 *
 * Uses the canonical SPL Memo Program (deployed on every cluster) rather than
 * our custom Anchor program, so this works today without needing `anchor deploy`.
 * The hash format is identical to the one the full ChainTrust program uses,
 * so memos posted here are forward-compatible with the real registry.
 */
export default function LiveTestnetDemo() {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const [params, setParams] = useState<LiveAnchorParams>(SAMPLE);
  const [stage, setStage] = useState<Stage>('idle');
  const [balance, setBalance] = useState<number | null>(null);
  const [airdropSig, setAirdropSig] = useState<string | null>(null);
  const [anchorSig, setAnchorSig] = useState<string | null>(null);
  const [proofHex, setProofHex] = useState<string | null>(null);
  const [memoPayload, setMemoPayload] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  const onAirdrop = useCallback(async () => {
    if (!publicKey) return;
    setErr(null);
    setStage('airdropping');
    try {
      const sig = await requestDevnetAirdrop(connection, publicKey, 1);
      setAirdropSig(sig);
      await refreshBalance();
      setStage('idle');
    } catch (e: any) {
      setErr(
        e?.message?.includes('429') || e?.message?.includes('rate')
          ? 'Devnet faucet is rate-limited right now. Try again in a minute, or grab SOL from https://faucet.solana.com'
          : `Airdrop failed: ${e?.message ?? 'unknown error'}`,
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
      const { signature, proofHashHex, memoPayload } = await sendProofHashMemo(
        connection,
        publicKey,
        sendTransaction,
        params,
      );
      setAnchorSig(signature);
      setProofHex(proofHashHex);
      setMemoPayload(memoPayload);
      setStage('success');
      refreshBalance();
    } catch (e: any) {
      const msg = e?.message ?? String(e);
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

  const copySig = useCallback(() => {
    if (!anchorSig) return;
    navigator.clipboard.writeText(anchorSig);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [anchorSig]);

  const update = (key: keyof LiveAnchorParams) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setParams((p) => ({
      ...p,
      [key]: key === 'startupName'
        ? v
        : key === 'growthRate'
          ? Number(v) / 100
          : Number(v),
    }));
  };

  const onMainnet = SOLANA_NETWORK === 'mainnet-beta';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-green-300 bg-green-50 px-4 py-1.5 text-sm font-medium text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300 mb-4">
          <Radio className="h-3.5 w-3.5 animate-pulse" /> Live Solana {SOLANA_NETWORK} — Real Signed Transactions
        </div>
        <h1 className="text-3xl font-bold">Live Testnet Demo</h1>
        <p className="mt-2 text-muted-foreground max-w-3xl">
          End-to-end proof that ChainTrust works on real Solana infrastructure. Connect your wallet,
          get free devnet SOL, and anchor a cryptographic proof of your startup metrics on-chain.
          Every step is a real transaction — verifiable on Solana Explorer in seconds.
        </p>
      </div>

      {onMainnet && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950/30">
          <CardContent className="p-4 flex gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
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

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-5">

          {/* Step 1 — Connect wallet */}
          <Step num={1} icon={Wallet} title="Connect a Solana wallet" done={connected}>
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
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    {balance !== null && (
                      <span className="ml-3 text-muted-foreground">
                        Balance: <span className="font-mono text-foreground">{balance.toFixed(4)} SOL</span>
                      </span>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground">
                    Any Solana wallet works — Phantom, Solflare, or Coinbase. The demo never touches your mainnet funds.
                  </p>
                )}
              </div>
              <WalletMultiButton style={{
                background: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                borderRadius: '0.5rem',
                height: '40px',
                fontSize: '14px',
                fontWeight: 600,
              }} />
            </div>
          </Step>

          {/* Step 2 — Airdrop */}
          <Step
            num={2}
            icon={Droplet}
            title="Get free devnet SOL"
            done={connected && balance !== null && balance > 0.001}
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
                    className="text-xs text-green-600 hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <CheckCircle2 className="h-3 w-3" /> Airdrop confirmed — view tx
                    <ExternalLink className="h-3 w-3" />
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
                  <><Loader2 className="h-4 w-4 animate-spin" /> Requesting…</>
                ) : (
                  <><Droplet className="h-4 w-4" /> Airdrop 1 SOL</>
                )}
              </Button>
            </div>
          </Step>

          {/* Step 3 — Metrics input */}
          <Step num={3} icon={Hash} title="Enter metrics to anchor" done={stage === 'success'}>
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

          {/* Step 4 — Anchor */}
          <Step
            num={4}
            icon={Rocket}
            title="Anchor proof on-chain"
            done={stage === 'success'}
            disabled={!connected}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground max-w-md">
                Signs a real Solana transaction in your wallet and posts the SHA-256 proof
                to the{' '}
                <a
                  href={explorerAddressUrl(MEMO_PROGRAM_ID.toBase58())}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  SPL Memo Program
                </a>
                . Cost: ~0.000005 SOL.
              </div>
              <Button
                onClick={onAnchor}
                disabled={!connected || stage === 'anchoring'}
                className="gap-2 px-6"
              >
                {stage === 'anchoring' ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Anchoring…</>
                ) : (
                  <><Rocket className="h-4 w-4" /> Anchor to {SOLANA_NETWORK}</>
                )}
              </Button>
            </div>
          </Step>

          {/* Error */}
          <AnimatePresence>
            {err && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card className="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
                  <CardContent className="p-4 flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-red-800 dark:text-red-200">Something went wrong</p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1">{err}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success */}
          <AnimatePresence>
            {stage === 'success' && anchorSig && proofHex && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-6 w-6 text-green-500" />
                      <h3 className="font-bold text-lg">Proof anchored on Solana {SOLANA_NETWORK}</h3>
                    </div>

                    <div className="rounded-lg bg-background border p-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Transaction signature</div>
                        <div className="flex items-center gap-2">
                          <code className="font-mono text-xs break-all flex-1">{anchorSig}</code>
                          <button onClick={copySig} className="shrink-0" aria-label="Copy signature">
                            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground hover:text-foreground" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">SHA-256 proof hash</div>
                        <code className="font-mono text-xs break-all text-accent">{proofHex}</code>
                      </div>
                      {memoPayload && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">On-chain memo payload</div>
                          <pre className="text-[10px] bg-muted/50 rounded p-2 overflow-x-auto">{memoPayload}</pre>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <a
                        href={explorerTxUrl(anchorSig)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="gap-2">
                          <ExternalLink className="h-4 w-4" /> View on Solana Explorer
                        </Button>
                      </a>
                      <Button variant="outline" onClick={() => { setStage('idle'); setAnchorSig(null); setProofHex(null); setMemoPayload(null); }}>
                        Anchor another
                      </Button>
                    </div>

                    <div className="rounded-md border bg-background/50 p-3 text-xs text-muted-foreground flex gap-2">
                      <Info className="h-4 w-4 text-primary shrink-0" />
                      <div>
                        This is a real, immutable Solana transaction. Anyone, anywhere, can replay this
                        verification — no ChainTrust backend, API key, or login required. That's the whole point.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <ChainStatus />

          <Card className="border-border/60">
            <CardContent className="p-4 text-sm">
              <h4 className="font-semibold mb-3">Why this matters</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  <span><strong className="text-foreground">Real wallet signature</strong> — Phantom/Solflare/Coinbase, your keys.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  <span><strong className="text-foreground">Real Solana transaction</strong> — confirmed in ~2s, visible on Explorer forever.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  <span><strong className="text-foreground">Trustless verification</strong> — investors can replay the SHA-256 themselves.</span>
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                  <span><strong className="text-foreground">No gatekeeper</strong> — uses the canonical SPL Memo Program, zero deployment risk.</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-muted/30">
            <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">Verify any transaction yourself</p>
              <pre className="text-[10px] bg-background rounded p-2 overflow-x-auto border font-mono">
{`solana confirm -v <signature> \\
  --url ${SOLANA_NETWORK}`}
              </pre>
              <p>The Memo payload contains the raw metrics + SHA-256. Recompute the hash and compare.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Step({
  num, icon: Icon, title, done, disabled, children,
}: {
  num: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  done?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={`${done ? 'border-green-300 dark:border-green-800' : 'border-border'} ${disabled ? 'opacity-60' : ''}`}>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${done ? 'bg-green-500 text-white' : 'bg-primary/10 text-primary'}`}>
            {done ? <CheckCircle2 className="h-4 w-4" /> : num}
          </div>
          <h3 className="font-semibold flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            {title}
          </h3>
        </div>
        <div className="pl-11">{children}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, value, onChange, type = 'text' }: {
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
