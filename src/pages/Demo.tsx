import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Rocket, Database, Shield, Award, ChevronRight, ChevronLeft,
  Play, CheckCircle2, Loader2, Zap, Clock, DollarSign, Globe,
  Lock, TrendingUp, FastForward,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StepRegister from '@/components/demo/StepRegister';
import StepPublish from '@/components/demo/StepPublish';
import StepVerify from '@/components/demo/StepVerify';
import StepBadge from '@/components/demo/StepBadge';

const DEMO_STEPS = [
  { id: 'register', title: 'Register Startup', subtitle: 'Submit startup details to the ChainMetricsRegistry contract', icon: Rocket, color: 'hsl(var(--primary))' },
  { id: 'publish', title: 'Publish Metrics', subtitle: 'Push verifiable MRR, users, growth, and burn rate on-chain', icon: Database, color: 'hsl(var(--accent))' },
  { id: 'verify', title: 'Oracle Verification', subtitle: 'Pyth oracles independently validate your metrics', icon: Shield, color: 'hsl(36, 78%, 41%)' },
  { id: 'badge', title: 'Soulbound Badge', subtitle: 'Earn a non-transferable soulbound reputation badge', icon: Award, color: 'hsl(280, 60%, 55%)' },
];

const STEP_COMPONENTS = [StepRegister, StepPublish, StepVerify, StepBadge];

const COMPARISONS = [
  { label: 'Traditional Audit', cost: '$50,000+', time: '6 weeks', icon: Clock },
  { label: 'ChainTrust', cost: '$0.00025', time: '~2 seconds', icon: Zap },
];

export default function Demo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [started, setStarted] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  const handleComplete = () => {
    const newCompleted = new Set([...completedSteps, currentStep]);
    setCompletedSteps(newCompleted);
    setPlaying(false);

    // Auto-advance if autoplay is on
    if (autoPlay && currentStep < DEMO_STEPS.length - 1) {
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setTimeout(() => {
          setPlaying(true);
        }, 600);
      }, 800);
    }
  };

  const handlePlay = () => {
    setPlaying(true);
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.delete(currentStep);
      return next;
    });
  };

  const handleAutoPlay = () => {
    setAutoPlay(true);
    setStarted(true);
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setTimeout(() => setPlaying(true), 300);
  };

  const goNext = () => {
    if (currentStep < DEMO_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      setPlaying(false);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setPlaying(false);
    }
  };

  const allDone = completedSteps.size === DEMO_STEPS.length;
  const stepInfo = DEMO_STEPS[currentStep];
  const Icon = stepInfo.icon;
  const StepContent = STEP_COMPONENTS[currentStep];

  // Intro screen before demo starts
  if (!started) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary mb-4">
              <Zap className="h-3.5 w-3.5" /> Interactive Demo
            </div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              See How Startup Verification Works
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Watch a startup register, publish metrics, get oracle-verified, and receive a
              soulbound NFT certificate — all on Solana devnet.
            </p>
          </div>

          {/* The Problem */}
          <Card className="mb-8 border-destructive/20 bg-destructive/5">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-3 text-destructive">The Problem Today</h3>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div className="flex gap-3">
                  <DollarSign className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">$50,000+ per audit</p>
                    <p className="text-muted-foreground">Big 4 firms charge massive fees for metric verification</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">6+ weeks to verify</p>
                    <p className="text-muted-foreground">Manual auditing processes are slow and opaque</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Globe className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">No public proof</p>
                    <p className="text-muted-foreground">Investors must trust claims with no independent verification</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* The Solution */}
          <Card className="mb-8 border-accent/20 bg-accent/5">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-3 text-accent">ChainTrust's Solution</h3>
              <div className="grid sm:grid-cols-4 gap-4 text-sm">
                {DEMO_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  return (
                    <div key={i} className="flex gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: step.color + '15', color: step.color }}>
                        <StepIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold">{step.title}</p>
                        <p className="text-muted-foreground text-xs">{step.subtitle}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Cost Comparison */}
          <div className="grid sm:grid-cols-2 gap-4 mb-10">
            {COMPARISONS.map((item, i) => {
              const CompIcon = item.icon;
              const isChainTrust = i === 1;
              return (
                <Card key={i} className={isChainTrust ? 'border-accent/40 bg-accent/5 ring-1 ring-accent/20' : 'border-border/60'}>
                  <CardContent className="p-5 text-center">
                    <CompIcon className={`h-6 w-6 mx-auto mb-2 ${isChainTrust ? 'text-accent' : 'text-muted-foreground'}`} />
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${isChainTrust ? 'text-accent' : ''}`}>{item.cost}</p>
                    <p className="text-sm text-muted-foreground mt-1">{item.time}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="gap-2 px-8 text-base" onClick={() => { setStarted(true); }}>
              <Play className="h-4 w-4" /> Start Step-by-Step Demo
            </Button>
            <Button size="lg" variant="outline" className="gap-2 px-8 text-base" onClick={handleAutoPlay}>
              <FastForward className="h-4 w-4" /> Auto-Play Full Demo
            </Button>
          </div>

          {/* Tech badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border px-3 py-1">Solana Devnet</span>
            <span className="rounded-full border px-3 py-1">Anchor Framework</span>
            <span className="rounded-full border px-3 py-1">SHA-256 Proof Hashes</span>
            <span className="rounded-full border px-3 py-1">Pyth Oracle</span>
            <span className="rounded-full border px-3 py-1">Metaplex cNFTs</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interactive Demo</h1>
          <p className="mt-1 text-muted-foreground">
            Walk through the full startup lifecycle — from registration to soulbound badge
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setStarted(false); setAutoPlay(false); setCompletedSteps(new Set()); setCurrentStep(0); setPlaying(false); }}>
          Restart
        </Button>
      </div>

      {/* Step Progress */}
      <div className="mb-8 flex items-center justify-between">
        {DEMO_STEPS.map((s, i) => {
          const StepIcon = s.icon;
          const done = completedSteps.has(i);
          const active = i === currentStep;
          return (
            <button key={i} onClick={() => { setCurrentStep(i); setPlaying(false); setAutoPlay(false); }} className="flex flex-col items-center gap-1.5 group">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${
                done ? 'border-accent bg-accent/10' : active ? 'border-primary bg-primary/10 scale-110' : 'border-muted bg-muted/30'
              }`}>
                {done ? <CheckCircle2 className="h-5 w-5 text-accent" /> : <StepIcon className={`h-5 w-5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Connecting lines */}
      <div className="relative -mt-[4.5rem] mb-8 flex justify-between px-5 pointer-events-none">
        {DEMO_STEPS.slice(0, -1).map((_, i) => (
          <div key={i} className={`h-0.5 flex-1 mx-3 mt-5 rounded ${completedSteps.has(i) ? 'bg-accent' : 'bg-muted'}`} />
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_260px] gap-6">
        <div>
          {/* Current Step Header */}
          <motion.div key={currentStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: stepInfo.color + '15', color: stepInfo.color }}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold">{stepInfo.title}</h2>
                  <span className="text-xs text-muted-foreground rounded-full border px-2 py-0.5">
                    Step {currentStep + 1} of {DEMO_STEPS.length}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{stepInfo.subtitle}</p>
              </div>
            </div>
          </motion.div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div key={currentStep} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
              <StepContent playing={playing} onComplete={handleComplete} />
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="mt-8 flex items-center justify-between">
            <Button variant="outline" onClick={goPrev} disabled={currentStep === 0} className="gap-1">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>

            <Button onClick={handlePlay} disabled={playing} className="gap-2 px-6" style={!playing ? { backgroundColor: stepInfo.color } : undefined}>
              {playing ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Simulating...</>
              ) : completedSteps.has(currentStep) ? (
                <><Play className="h-4 w-4" /> Replay</>
              ) : (
                <><Play className="h-4 w-4" /> Run Step</>
              )}
            </Button>

            {completedSteps.has(currentStep) && currentStep < DEMO_STEPS.length - 1 ? (
              <Button onClick={goNext} className="gap-1">Next <ChevronRight className="h-4 w-4" /></Button>
            ) : (
              <div className="w-24" />
            )}
          </div>
        </div>

        {/* Sidebar - What's happening */}
        <div className="hidden lg:block space-y-4">
          <Card className="border-border/60">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-3">What's Happening</h4>
              <AnimatePresence mode="wait">
                <motion.div key={currentStep} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted-foreground space-y-2">
                  {currentStep === 0 && (
                    <>
                      <p>The startup's details are submitted to the <span className="font-mono text-foreground">ChainMetricsRegistry</span> Anchor program on Solana.</p>
                      <p>A <span className="font-mono text-foreground">PDA (Program Derived Address)</span> is created to store the startup's on-chain identity.</p>
                      <p className="flex items-center gap-1 text-accent"><Lock className="h-3 w-3" /> Cost: ~$0.00025</p>
                    </>
                  )}
                  {currentStep === 1 && (
                    <>
                      <p>Metrics are <span className="font-mono text-foreground">SHA-256 hashed</span> together to create a proof hash.</p>
                      <p>The hash is stored on-chain in the startup's <span className="font-mono text-foreground">MetricsAccount</span> PDA.</p>
                      <p>Anyone can recompute the hash locally and verify the data matches.</p>
                      <p className="flex items-center gap-1 text-accent"><Lock className="h-3 w-3" /> Tamper-proof</p>
                    </>
                  )}
                  {currentStep === 2 && (
                    <>
                      <p><span className="font-mono text-foreground">Pyth Network</span> oracles independently verify each metric against real-world data sources.</p>
                      <p>Multiple oracle nodes must reach consensus before verification passes.</p>
                      <p>A <span className="font-mono text-foreground">trust score</span> (0-100) is computed based on verification results.</p>
                      <p className="flex items-center gap-1 text-accent"><Shield className="h-3 w-3" /> No human intermediary</p>
                    </>
                  )}
                  {currentStep === 3 && (
                    <>
                      <p>A <span className="font-mono text-foreground">compressed NFT</span> certificate is minted via Metaplex Bubblegum.</p>
                      <p>The certificate is <span className="font-mono text-foreground">soulbound</span> (non-transferable) and lives permanently in the startup's wallet.</p>
                      <p>Any investor can verify it on-chain for free.</p>
                      <p className="flex items-center gap-1 text-accent"><Award className="h-3 w-3" /> Permanent proof</p>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Tech stack used */}
          <Card className="border-border/60">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-3">Tech Used in This Step</h4>
              <div className="flex flex-wrap gap-1.5">
                {currentStep === 0 && (
                  <>
                    <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-medium">Anchor</span>
                    <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-medium">Solana PDA</span>
                    <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-medium">IPFS</span>
                  </>
                )}
                {currentStep === 1 && (
                  <>
                    <span className="rounded-full bg-accent/10 text-accent px-2.5 py-0.5 text-[10px] font-medium">SHA-256</span>
                    <span className="rounded-full bg-accent/10 text-accent px-2.5 py-0.5 text-[10px] font-medium">Anchor</span>
                    <span className="rounded-full bg-accent/10 text-accent px-2.5 py-0.5 text-[10px] font-medium">Proof Hash</span>
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    <span className="rounded-full bg-orange-500/10 text-orange-600 px-2.5 py-0.5 text-[10px] font-medium">Pyth Network</span>
                    <span className="rounded-full bg-orange-500/10 text-orange-600 px-2.5 py-0.5 text-[10px] font-medium">Oracle Consensus</span>
                    <span className="rounded-full bg-orange-500/10 text-orange-600 px-2.5 py-0.5 text-[10px] font-medium">Trust Score</span>
                  </>
                )}
                {currentStep === 3 && (
                  <>
                    <span className="rounded-full bg-purple-500/10 text-purple-600 px-2.5 py-0.5 text-[10px] font-medium">Metaplex</span>
                    <span className="rounded-full bg-purple-500/10 text-purple-600 px-2.5 py-0.5 text-[10px] font-medium">Bubblegum cNFT</span>
                    <span className="rounded-full bg-purple-500/10 text-purple-600 px-2.5 py-0.5 text-[10px] font-medium">Soulbound</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live stats */}
          <Card className="border-border/60">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-accent" /> By the Numbers
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verification cost</span>
                  <span className="font-mono font-semibold text-accent">$0.00025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time to verify</span>
                  <span className="font-mono font-semibold">~2 sec</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Traditional audit</span>
                  <span className="font-mono font-semibold text-destructive">$50,000+</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Savings</span>
                  <span className="font-mono font-semibold text-accent">200,000x</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Completion */}
      <AnimatePresence>
        {allDone && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-2xl border-2 border-accent/40 bg-accent/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
              <Zap className="h-7 w-7 text-accent-foreground" />
            </div>
            <h3 className="text-2xl font-bold">Verification Complete</h3>
            <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
              You've seen the full ChainTrust lifecycle: on-chain registration, SHA-256 proof hashing,
              oracle verification, and soulbound NFT certification. All on Solana, all for $0.001 total.
            </p>

            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 max-w-lg mx-auto">
              <div className="rounded-lg bg-background border p-3">
                <p className="text-lg font-bold text-accent">4</p>
                <p className="text-xs text-muted-foreground">On-chain txns</p>
              </div>
              <div className="rounded-lg bg-background border p-3">
                <p className="text-lg font-bold text-accent">$0.001</p>
                <p className="text-xs text-muted-foreground">Total cost</p>
              </div>
              <div className="rounded-lg bg-background border p-3">
                <p className="text-lg font-bold text-accent">94/100</p>
                <p className="text-xs text-muted-foreground">Trust score</p>
              </div>
              <div className="rounded-lg bg-background border p-3">
                <p className="text-lg font-bold text-accent">1</p>
                <p className="text-xs text-muted-foreground">cNFT minted</p>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
              <Link to="/register"><Button size="lg" className="gap-2"><Rocket className="h-4 w-4" /> Register Your Startup</Button></Link>
              <Link to="/dashboard"><Button size="lg" variant="outline">Explore Dashboard</Button></Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
