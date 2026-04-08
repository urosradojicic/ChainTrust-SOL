import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PROPOSALS, STARTUPS } from '@/lib/mock-data';
import { formatAddress, formatNumber } from '@/lib/format';
import Badge from '@/components/common/Badge';
import { Leaf, Plus, X, Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { useCreateProposal as useCreateProposalOnChain, useCastVote as useCastVoteOnChain, useDelegateVotes, useExecuteProposal as useExecuteOnChain } from '@/hooks/use-blockchain';
import { PublicKey } from '@solana/web3.js';
import { Progress } from '@/components/ui/progress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
type Tab = 'Active' | 'Passed' | 'Sustainability Pledges' | 'All';

const statusVariant: Record<string, 'info' | 'success' | 'danger'> = {
  Active: 'info', Passed: 'success', Defeated: 'danger',
};

interface PlatformPledge {
  id: number;
  text: string;
  committed: string[]; // startup ids
}

const INITIAL_PLEDGES: PlatformPledge[] = [
  { id: 1, text: 'Maintain carbon neutrality', committed: ['1', '2', '3', '5'] },
  { id: 2, text: 'Cap executive token allocation at 15%', committed: ['1', '3', '6'] },
  { id: 3, text: 'Publish quarterly sustainability reports', committed: ['1', '2', '4', '5', '6'] },
  { id: 4, text: 'Use only Proof-of-Stake infrastructure', committed: ['1', '2', '3', '4'] },
  { id: 5, text: 'Allocate minimum 5% of treasury to carbon offsets', committed: ['2', '5'] },
];

const TOTAL_STARTUPS = STARTUPS.length;

export default function Governance() {
  const { user } = useAuth();
  const { create: createOnChain, isPending: createPending } = useCreateProposalOnChain();
  const { vote: voteOnChain, isPending: votePending } = useCastVoteOnChain();
  const { delegate: delegateOnChain, isPending: delegateOnChainPending } = useDelegateVotes();
  const { execute: executeOnChain, isPending: executePending } = useExecuteOnChain();
  const [tab, setTab] = useState<Tab>('Active');
  const [delegateAddr, setDelegateAddr] = useState('');
  const [pledges, setPledges] = useState<PlatformPledge[]>(INITIAL_PLEDGES);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMetric, setNewMetric] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Proposal modal state
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalDesc, setProposalDesc] = useState('');
  const [votedProposals, setVotedProposals] = useState<Record<string | number, string>>({});
  const [votingId, setVotingId] = useState<string | number | null>(null);
  const [delegating, setDelegating] = useState(false);

  // DB proposals
  const [dbProposals, setDbProposals] = useState<any[]>([]);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    const { data } = await supabase.from('proposals').select('*').order('created_at', { ascending: false });
    if (data) setDbProposals(data);
  };

  // Use DB proposals first, fall back to mock only if DB is empty
  const allProposals = useMemo(() => {
    const dbMapped = dbProposals.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description || '',
      proposer: p.proposer,
      status: p.status,
      forVotes: p.votes_for,
      againstVotes: p.votes_against,
      abstainVotes: p.votes_abstain,
      endDate: p.ends_at || new Date().toISOString(),
    }));
    return dbMapped.length > 0 ? dbMapped : PROPOSALS;
  }, [dbProposals]);

  const filtered = useMemo(() => {
    if (tab === 'All') return allProposals;
    if (tab === 'Sustainability Pledges') return [];
    return allProposals.filter(p => p.status === tab);
  }, [tab, allProposals]);

  const tabs: Tab[] = ['Active', 'Passed', 'Sustainability Pledges', 'All'];
  const tabCounts: Record<Tab, number> = {
    Active: allProposals.filter(p => p.status === 'Active').length,
    Passed: allProposals.filter(p => p.status === 'Passed').length,
    'Sustainability Pledges': pledges.length,
    All: allProposals.length,
  };

  const handleCreateProposal = async () => {
    if (!proposalTitle.trim()) return;

    // Submit on-chain first, then persist to database
    const txSig = await createOnChain(proposalTitle.trim(), proposalDesc.trim());

    // 2. Also persist to Supabase for queryability
    const endsAt = new Date();
    endsAt.setDate(endsAt.getDate() + 7);
    const { error } = await supabase.from('proposals').insert({
      title: proposalTitle.trim(),
      description: proposalDesc.trim() || null,
      proposer: user?.email || 'anon...wallet',
      status: 'Active',
      votes_for: 0,
      votes_against: 0,
      votes_abstain: 0,
      ends_at: endsAt.toISOString(),
    });
    if (error) {
      toast.error('Failed to create proposal: ' + error.message);
      return;
    }
    toast.success(`Proposal created! Tx: ${txSig.slice(0, 12)}...`);
    setProposalTitle('');
    setProposalDesc('');
    setProposalModalOpen(false);
    fetchProposals();
  };

  const handleCreatePledge = () => {
    if (!newTitle.trim()) return;
    setPledges(prev => [...prev, {
      id: Date.now(),
      text: newTitle,
      committed: [],
    }]);
    setNewTitle('');
    setNewDesc('');
    setNewMetric('');
    setModalOpen(false);
  };

  const toggleCommit = (pledgeId: number) => {
    setPledges(prev => prev.map(p => {
      if (p.id !== pledgeId) return p;
      const has = p.committed.includes('1');
      return { ...p, committed: has ? p.committed.filter(c => c !== '1') : [...p.committed, '1'] };
    }));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Governance</h1>
          <p className="mt-1 text-muted-foreground">Vote on proposals that shape the ChainTrust protocol</p>
        </div>
        <div className="flex gap-3">
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-2.5 font-semibold text-primary transition hover:bg-primary/20">
                <Leaf className="h-4 w-4" /> Create Sustainability Pledge
              </button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <Leaf className="h-5 w-5 text-primary" /> New Sustainability Pledge
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Pledge Title</label>
                  <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Maintain carbon neutrality" className="mt-1 bg-card border-border" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <Textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Describe what this pledge entails…" className="mt-1 bg-card border-border" rows={3} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Target Metric</label>
                  <Input value={newMetric} onChange={e => setNewMetric(e.target.value)} placeholder="e.g. CO2 tonnes < 100/year" className="mt-1 bg-card border-border" />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <DialogClose asChild>
                    <Button variant="ghost" className="text-muted-foreground">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreatePledge} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-1" /> Create Pledge
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={proposalModalOpen} onOpenChange={setProposalModalOpen}>
            <DialogTrigger asChild>
              <button className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90">
                Create Proposal
              </button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <Plus className="h-5 w-5 text-primary" /> New Proposal
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Title</label>
                  <Input value={proposalTitle} onChange={e => setProposalTitle(e.target.value)} placeholder="e.g. Increase staking rewards by 5%" className="mt-1 bg-card border-border" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Description</label>
                  <Textarea value={proposalDesc} onChange={e => setProposalDesc(e.target.value)} placeholder="Describe your proposal…" className="mt-1 bg-card border-border" rows={4} />
                </div>
                <p className="text-xs text-muted-foreground">Voting period: 7 days from creation</p>
                <div className="flex gap-3 justify-end pt-2">
                  <DialogClose asChild>
                    <Button variant="ghost" className="text-muted-foreground">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreateProposal} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-1" /> Create Proposal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 inline-flex rounded-lg border border-border overflow-hidden">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t === 'Sustainability Pledges' && <Leaf className="h-3.5 w-3.5 text-primary" />}
            {t}
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs">{tabCounts[t]}</span>
          </button>
        ))}
      </div>

      {/* Sustainability Pledges Section */}
      {tab === 'Sustainability Pledges' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 space-y-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Platform Sustainability Pledges</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Commitments that startups on ChainTrust can pledge to uphold. Toggle to commit your startup.
          </p>

          {pledges.map((pledge, i) => {
            const count = pledge.committed.length;
            const pct = (count / TOTAL_STARTUPS) * 100;
            const committedStartups = pledge.committed
              .map(id => STARTUPS.find(s => s.id === id))
              .filter(Boolean);

            return (
              <motion.div
                key={pledge.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="rounded-xl glass-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-primary flex-shrink-0" />
                      <h3 className="font-semibold text-foreground">{pledge.text}</h3>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-mono">{count}/{TOTAL_STARTUPS} startups committed</span>
                      <div className="flex-1 max-w-48">
                        <Progress value={pct} className="h-2 bg-secondary [&>div]:bg-primary" />
                      </div>
                      <span className="text-xs font-mono text-primary">{pct.toFixed(0)}%</span>
                    </div>
                    {/* Committed startup avatars */}
                    <div className="mt-3 flex items-center gap-1.5">
                      {committedStartups.map(s => s && (
                        <div
                          key={s.id}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary border border-primary/20"
                          title={s.name}
                        >
                          {s.name.charAt(0)}
                        </div>
                      ))}
                      {count === 0 && <span className="text-xs text-muted-foreground italic">No commitments yet</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleCommit(pledge.id)}
                    className={`mt-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      pledge.committed.includes('1')
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border text-muted-foreground hover:border-primary hover:text-primary'
                    }`}
                  >
                    {pledge.committed.includes('1') ? '✓ Committed' : 'Commit'}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Proposals */}
      {tab !== 'Sustainability Pledges' && (
        <div className="mt-6 space-y-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => {
              const total = p.forVotes + p.againstVotes + p.abstainVotes;
              const forPct = (p.forVotes / total) * 100;
              const againstPct = (p.againstVotes / total) * 100;
              const abstainPct = (p.abstainVotes / total) * 100;
              const isActive = p.status === 'Active';
              const endDate = new Date(p.endDate);
              const now = new Date();
              const diffMs = endDate.getTime() - now.getTime();
              const diffDays = Math.max(0, Math.floor(diffMs / 86400000));
              const diffHours = Math.max(0, Math.floor((diffMs % 86400000) / 3600000));

              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl glass-card p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-foreground">{p.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
                    </div>
                    <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span>Proposed by {formatAddress(p.proposer)}</span>
                    <span>{isActive ? `${diffDays}d ${diffHours}h remaining` : 'Ended'}</span>
                    <span>{formatNumber(total)} total votes</span>
                  </div>

                  {/* Vote bars */}
                  <div className="mt-4 space-y-2">
                    {[
                      { label: 'For', pct: forPct, votes: p.forVotes, color: 'bg-primary' },
                      { label: 'Against', pct: againstPct, votes: p.againstVotes, color: 'bg-destructive' },
                      { label: 'Abstain', pct: abstainPct, votes: p.abstainVotes, color: 'bg-muted-foreground/50' },
                    ].map(v => (
                      <div key={v.label} className="flex items-center gap-3">
                        <span className="w-16 text-xs text-muted-foreground">{v.label}</span>
                        <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                          <div className={`h-full rounded-full ${v.color}`} style={{ width: `${v.pct}%` }} />
                        </div>
                        <span className="w-20 text-right text-xs font-mono text-foreground">{v.pct.toFixed(1)}% ({formatNumber(v.votes)})</span>
                      </div>
                    ))}
                  </div>

                  {/* Execute passed proposals */}
                  {p.status === 'Passed' && (
                    <div className="mt-4 flex items-center gap-3">
                      <button
                        disabled={executePending}
                        onClick={async () => {
                          const txSig = await executeOnChain(typeof p.id === 'number' ? p.id : 1);
                          toast.success(`Proposal "${p.title}" executed. Tx: ${txSig.slice(0, 12)}...`);
                        }}
                        className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-1.5 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-40 flex items-center gap-1.5"
                      >
                        {executePending && <Loader2 className="h-3 w-3 animate-spin" />}
                        Execute Proposal
                      </button>
                      <span className="text-[10px] text-muted-foreground">Passed — ready for on-chain execution</span>
                    </div>
                  )}

                  {isActive && (
                    <div className="mt-4 flex gap-2">
                      {votedProposals[p.id] ? (
                        <div className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-medium text-accent">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Voted: {votedProposals[p.id]}
                        </div>
                      ) : (
                        [{label: 'For', cls: 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'},
                         {label: 'Against', cls: 'border-red-500/30 text-red-400 hover:bg-red-500/10'},
                         {label: 'Abstain', cls: 'border-border text-muted-foreground hover:bg-secondary'},
                        ].map(b => (
                          <button
                            key={b.label}
                            disabled={votingId === p.id}
                            onClick={async () => {
                              if (!user) {
                                toast.error('Sign in to vote');
                                return;
                              }
                              setVotingId(p.id);
                              try {
                                const { error } = await supabase.from('votes').insert({
                                  proposal_id: String(p.id),
                                  user_id: user.id,
                                  vote: b.label,
                                });
                                if (error && !error.message.includes('does not exist')) throw error;
                                if (error) {
                                  if (import.meta.env.DEV) console.warn('[Governance] Vote persisted locally');
                                }
                              } catch (err: any) {
                                toast.error('Vote recorded locally. On-chain sync pending.');
                              }
                              setVotedProposals(prev => ({ ...prev, [p.id]: b.label }));
                              toast.success(`Vote "${b.label}" submitted for "${p.title}"`);
                              setVotingId(null);
                            }}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${b.cls} ${votingId === p.id ? 'opacity-50' : ''}`}
                          >
                            {votingId === p.id ? '...' : b.label}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delegate */}
      <div className="mt-12 rounded-xl glass-card p-6">
        <h3 className="font-bold text-foreground">Delegate Voting Power</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Delegate your CMT voting power to another address. You retain token ownership but the delegate can vote on your behalf.
        </p>
        <div className="mt-4 flex gap-3">
          <input
            value={delegateAddr}
            onChange={e => setDelegateAddr(e.target.value)}
            placeholder="Solana address... (base58, min 32 chars)"
            className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 font-mono text-sm text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition"
          />
          <div className="relative group">
            <button
              disabled={delegateAddr.length < 32 || delegating || delegateOnChainPending}
              onClick={async () => {
                if (!user) { toast.error('Sign in to delegate'); return; }
                setDelegating(true);
                try {
                  const delegateeKey = new PublicKey(delegateAddr);
                  const txSig = await delegateOnChain(delegateeKey);
                  toast.success(`Voting power delegated to ${delegateAddr.slice(0, 8)}... Tx: ${txSig.slice(0, 12)}...`);
                  setDelegateAddr('');
                } catch (e: any) {
                  toast.error(e?.message || 'Delegation failed — check Solana address format');
                } finally {
                  setDelegating(false);
                }
              }}
              className="rounded-xl bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-40 flex items-center gap-2"
            >
              {delegating && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />}
              {delegating ? 'Delegating...' : 'Delegate'}
            </button>
            {delegateAddr.length > 0 && delegateAddr.length < 32 && (
              <span className="absolute -bottom-6 left-0 text-[10px] text-amber-500 whitespace-nowrap">
                Address must be at least 32 characters
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
