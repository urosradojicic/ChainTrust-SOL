import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Rocket, Database, Shield, Award, ChevronRight, ChevronLeft,
  Play, CheckCircle2, Loader2, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import StepRegister from '@/components/demo/StepRegister';
import StepPublish from '@/components/demo/StepPublish';
import StepVerify from '@/components/demo/StepVerify';
import StepBadge from '@/components/demo/StepBadge';

const DEMO_STEPS = [
  { id: 'register', title: 'Register Startup', subtitle: 'Submit startup details to the ChainMetricsRegistry contract', icon: Rocket, color: 'hsl(var(--primary))' },
  { id: 'publish', title: 'Publish Metrics', subtitle: 'Push verifiable MRR, users, growth, and burn rate on-chain', icon: Database, color: 'hsl(var(--accent))' },
  { id: 'verify', title: 'Oracle Verification', subtitle: 'Chainlink oracles independently validate your metrics', icon: Shield, color: 'hsl(36, 78%, 41%)' },
  { id: 'badge', title: 'Soulbound Badge', subtitle: 'Earn a non-transferable soulbound reputation badge', icon: Award, color: 'hsl(280, 60%, 55%)' },
];

const STEP_COMPONENTS = [StepRegister, StepPublish, StepVerify, StepBadge];

export default function Demo() {
  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleComplete = () => {
    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setPlaying(false);
  };

  const handlePlay = () => {
    setPlaying(true);
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.delete(currentStep);
      return next;
    });
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Interactive Demo</h1>
        <p className="mt-1 text-muted-foreground">
          Walk through the full startup lifecycle — from registration to soulbound badge
        </p>
      </div>

      {/* Step Progress */}
      <div className="mb-8 flex items-center justify-between">
        {DEMO_STEPS.map((s, i) => {
          const StepIcon = s.icon;
          const done = completedSteps.has(i);
          const active = i === currentStep;
          return (
            <button key={i} onClick={() => { setCurrentStep(i); setPlaying(false); }} className="flex flex-col items-center gap-1.5 group">
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

      {/* Current Step Header */}
      <motion.div key={currentStep} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: stepInfo.color + '15', color: stepInfo.color }}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{stepInfo.title}</h2>
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
            <><Loader2 className="h-4 w-4 animate-spin" /> Simulating…</>
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

      {/* Completion */}
      <AnimatePresence>
        {allDone && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-10 rounded-2xl border-2 border-accent/40 bg-accent/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent">
              <Zap className="h-7 w-7 text-accent-foreground" />
            </div>
            <h3 className="text-2xl font-bold">Demo Complete!</h3>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              You've walked through the full ChainTrust lifecycle: registration, metric publishing,
              oracle verification, and soulbound badge issuance.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/register"><Button size="lg" className="gap-2"><Rocket className="h-4 w-4" /> Register for Real</Button></Link>
              <Link to="/dashboard"><Button size="lg" variant="outline">View Dashboard</Button></Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
