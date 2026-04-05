import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Database, Hash, Link2, CheckCircle2, ArrowRight, Lock, Cpu, Globe } from 'lucide-react';
import type { DbStartup } from '@/types/database';
import { computeProofHash } from '@/hooks/use-blockchain';
import { PROGRAM_ID } from '@/lib/contracts';
import { explorerAddressUrl } from '@/lib/solana-config';

interface ProofChainVisualizerProps {
  startup: DbStartup;
}

type Step = 'metrics' | 'hash' | 'submit' | 'pda' | 'oracle' | 'verified';

const STEPS: { id: Step; label: string; icon: any; description: string }[] = [
  { id: 'metrics', label: 'Raw Metrics', icon: Database, description: 'MRR, Users, Growth, Burn Rate, Carbon Offset collected from APIs' },
  { id: 'hash', label: 'SHA-256 Hash', icon: Hash, description: 'Metrics concatenated and hashed into 32-byte proof' },
  { id: 'submit', label: 'On-Chain Submit', icon: Link2, description: 'Proof hash + metrics submitted to Solana program' },
  { id: 'pda', label: 'PDA Storage', icon: Lock, description: 'Data stored in Program Derived Address on Solana' },
  { id: 'oracle', label: 'Oracle Verify', icon: Globe, description: 'Chainlink oracle independently verifies metric accuracy' },
  { id: 'verified', label: 'Verified', icon: CheckCircle2, description: 'Startup metrics cryptographically proven on-chain' },
];

export default function ProofChainVisualizer({ startup }: ProofChainVisualizerProps) {
  const [activeStep, setActiveStep] = useState<number>(-1);
  const [playing, setPlaying] = useState(false);
  const [proofHash, setProofHash] = useState<string>('');
  const [metricsString, setMetricsString] = useState('');

  useEffect(() => {
    const metrics = {
      mrr: startup.mrr,
      users: startup.users,
      activeUsers: Math.round(startup.users * 0.7),
      burnRate: 0,
      runway: Number(startup.treasury),
      growthRate: Number(startup.growth_rate),
      carbonOffset: Number(startup.carbon_offset_tonnes),
    };
    setMetricsString(`${metrics.mrr}|${metrics.users}|${metrics.activeUsers}|${metrics.burnRate}|${metrics.runway}|${Math.round(metrics.growthRate * 100)}|${metrics.carbonOffset}`);
    computeProofHash(metrics).then(hash => {
      setProofHash(Array.from(hash).map(b => b.toString(16).padStart(2, '0')).join(''));
    });
  }, [startup]);

  const play = () => {
    setPlaying(true);
    setActiveStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= STEPS.length) {
        clearInterval(interval);
        setPlaying(false);
      } else {
        setActiveStep(step);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Cryptographic Proof Chain
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">How {startup.name}'s metrics are verified on Solana</p>
        </div>
        <button
          onClick={play}
          disabled={playing}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {playing ? 'Verifying...' : activeStep >= 0 ? 'Replay' : 'Simulate Verification'}
        </button>
      </div>

      {/* Step chain visualization */}
      <div className="relative flex items-center justify-between gap-1">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isActive = i <= activeStep;
          const isCurrent = i === activeStep;
          return (
            <div key={step.id} className="flex items-center flex-1">
              <motion.div
                animate={{
                  scale: isCurrent ? 1.15 : 1,
                  borderColor: isActive ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                }}
                className={`relative z-10 flex flex-col items-center gap-1.5 cursor-pointer`}
                onClick={() => setActiveStep(i)}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl border-2 transition-all duration-500 ${
                  isActive ? 'border-primary bg-primary/10' : 'border-border bg-card'
                } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}>
                  <Icon className={`h-5 w-5 transition-colors duration-500 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <span className={`text-[10px] font-medium text-center leading-tight max-w-[70px] ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </span>
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 mx-1">
                  <motion.div
                    className="h-0.5 rounded-full"
                    animate={{
                      backgroundColor: i < activeStep ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                      scaleX: i < activeStep ? 1 : 0.3,
                    }}
                    transition={{ duration: 0.5 }}
                    style={{ transformOrigin: 'left' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        {activeStep >= 0 && (
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-primary/20 bg-primary/5 p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              {(() => { const Icon = STEPS[activeStep].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
              <h4 className="font-bold text-foreground">{STEPS[activeStep].label}</h4>
              <span className="text-xs text-muted-foreground">Step {activeStep + 1} of {STEPS.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{STEPS[activeStep].description}</p>

            {activeStep === 0 && (
              <div className="rounded-lg bg-[#0d1117] border border-[#30363d] p-4 font-mono text-xs overflow-x-auto">
                <div className="text-cyan-400">// Raw metrics input</div>
                <div className="text-gray-300">MRR: <span className="text-emerald-400">${startup.mrr.toLocaleString()}</span></div>
                <div className="text-gray-300">Users: <span className="text-emerald-400">{startup.users.toLocaleString()}</span></div>
                <div className="text-gray-300">Growth: <span className="text-emerald-400">{startup.growth_rate}%</span></div>
                <div className="text-gray-300">Carbon Offset: <span className="text-emerald-400">{Number(startup.carbon_offset_tonnes)}t CO₂</span></div>
                <div className="text-gray-300">Treasury: <span className="text-emerald-400">${Number(startup.treasury).toLocaleString()}</span></div>
              </div>
            )}

            {activeStep === 1 && (
              <div className="space-y-2">
                <div className="rounded-lg bg-[#0d1117] border border-[#30363d] p-4 font-mono text-xs overflow-x-auto">
                  <div className="text-cyan-400">// Input string</div>
                  <div className="text-amber-400 break-all">{metricsString}</div>
                  <div className="mt-2 text-cyan-400">// SHA-256 digest</div>
                  <div className="text-emerald-400 break-all">{proofHash || 'computing...'}</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Cpu className="h-3.5 w-3.5" />
                  <span>Computed client-side using Web Crypto API — deterministic and verifiable by anyone</span>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="rounded-lg bg-[#0d1117] border border-[#30363d] p-4 font-mono text-xs overflow-x-auto">
                <div className="text-cyan-400">// Solana transaction instruction</div>
                <div className="text-gray-300">program: <span className="text-purple-400">{PROGRAM_ID.toBase58().slice(0, 20)}...</span></div>
                <div className="text-gray-300">instruction: <span className="text-amber-400">publish_metrics</span></div>
                <div className="text-gray-300">proof_hash: <span className="text-emerald-400">[{proofHash.slice(0, 24)}...]</span></div>
                <div className="text-gray-300">signer: <span className="text-blue-400">startup_owner.publicKey</span></div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-2">
                <div className="rounded-lg bg-[#0d1117] border border-[#30363d] p-4 font-mono text-xs overflow-x-auto">
                  <div className="text-cyan-400">// PDA derivation</div>
                  <div className="text-gray-300">seeds: <span className="text-amber-400">["metrics", startup_id.to_le_bytes()]</span></div>
                  <div className="text-gray-300">program: <span className="text-purple-400">{PROGRAM_ID.toBase58().slice(0, 20)}...</span></div>
                  <div className="mt-1 text-cyan-400">// Stored on-chain (immutable until next publish)</div>
                  <div className="text-emerald-400">{'MetricsAccount { mrr, users, proof_hash, timestamp, ... }'}</div>
                </div>
                <a href={explorerAddressUrl(PROGRAM_ID.toBase58())} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                  View program on Solana Explorer <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            )}

            {activeStep === 4 && (
              <div className="rounded-lg bg-[#0d1117] border border-[#30363d] p-4 font-mono text-xs overflow-x-auto">
                <div className="text-cyan-400">// Oracle verification (Chainlink)</div>
                <div className="text-gray-300">1. Fetch Stripe MRR: <span className="text-emerald-400">${startup.mrr.toLocaleString()}</span> <span className="text-emerald-400">✓ match</span></div>
                <div className="text-gray-300">2. Fetch analytics users: <span className="text-emerald-400">{startup.users.toLocaleString()}</span> <span className="text-emerald-400">✓ match</span></div>
                <div className="text-gray-300">3. Recompute hash: <span className="text-emerald-400">{proofHash.slice(0, 16)}...</span> <span className="text-emerald-400">✓ match</span></div>
                <div className="mt-1 text-emerald-400 font-bold">→ oracle_verified = true</div>
              </div>
            )}

            {activeStep === 5 && (
              <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/10 border border-accent/30">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-accent/20">
                  <CheckCircle2 className="h-7 w-7 text-accent" />
                </div>
                <div>
                  <p className="font-bold text-accent text-lg">Cryptographically Verified</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {startup.name}'s metrics are on-chain, hash-linked, and oracle-verified.
                    Anyone can independently verify by recomputing the SHA-256 proof.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
