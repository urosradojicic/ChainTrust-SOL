import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useRegisterStartup } from '@/hooks/use-blockchain';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  CheckCircle2, ChevronLeft, ChevronRight, Loader2, ExternalLink, AlertTriangle,
} from 'lucide-react';
import { explorerTxUrl } from '@/lib/solana-config';
import { sanitizeText, sanitizeUrl, sanitizeNumber, rateLimit } from '@/lib/sanitize';
import { Progress } from '@/components/ui/progress';
import Toggle from '@/components/form/Toggle';
import DistSlider from '@/components/form/DistSlider';
import { inputCls, labelCls, CATEGORIES, BLOCKCHAINS } from '@/lib/constants';

const STEPS = ['Basic Info', 'Metrics', 'Sustainability', 'Tokenomics', 'Pledges', 'Review'];

const SDG_LABELS = [
  'No Poverty', 'Zero Hunger', 'Good Health', 'Quality Education', 'Gender Equality',
  'Clean Water', 'Affordable Energy', 'Decent Work', 'Industry & Innovation',
  'Reduced Inequalities', 'Sustainable Cities', 'Responsible Consumption',
  'Climate Action', 'Life Below Water', 'Life on Land', 'Peace & Justice', 'Partnerships',
];

const PRESET_PLEDGES = [
  { key: 'carbon_neutrality', label: 'Maintain carbon neutrality' },
  { key: 'cap_exec_alloc', label: 'Cap executive token allocation at 15%' },
  { key: 'quarterly_reports', label: 'Publish quarterly sustainability reports' },
  { key: 'pos_only', label: 'Use only Proof-of-Stake infrastructure' },
  { key: 'treasury_reserve', label: 'Allocate minimum 5% of treasury to carbon offsets' },
];

interface FormData {
  // Step 1
  name: string; description: string; category: string; blockchain: string; website: string; foundedDate: string;
  // Step 2
  mrr: string; mau: string; growthRate: string; fundingRaised: string; treasury: string;
  // Step 3
  chainType: 'PoS' | 'PoW'; energyPerTx: string; carbonOffsets: string; sdgs: number[]; greenProvider: boolean;
  // Step 4
  tokenName: string; totalSupply: string; circulatingSupply: string;
  distTeam: number; distInvestors: number; distCommunity: number; distTreasury: number; distLiquidity: number;
  vestingCliff: string; walletConcentration: string;
  // Step 5
  pledges: Record<string, boolean>; customPledge: string;
}

const initForm: FormData = {
  name: '', description: '', category: 'DeFi', blockchain: 'Solana', website: '', foundedDate: '',
  mrr: '', mau: '', growthRate: '', fundingRaised: '', treasury: '',
  chainType: 'PoS', energyPerTx: '0.001', carbonOffsets: '', sdgs: [], greenProvider: false,
  tokenName: '', totalSupply: '', circulatingSupply: '',
  distTeam: 15, distInvestors: 20, distCommunity: 30, distTreasury: 20, distLiquidity: 15,
  vestingCliff: '12', walletConcentration: '',
  pledges: {}, customPledge: '',
};

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');
  const { register: registerOnChain } = useRegisterStartup();
  const { connected: isConnected } = useSolanaWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const u = <K extends keyof FormData>(key: K, val: FormData[K]) => setForm(f => ({ ...f, [key]: val }));

  const distSum = form.distTeam + form.distInvestors + form.distCommunity + form.distTreasury + form.distLiquidity;

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0 && form.description.trim().length > 0;
    if (step === 3) return distSum === 100;
    return true;
  };

  const submit = async () => {
    if (!isConnected) {
      toast({ title: 'Wallet Required', description: 'Please connect your wallet to register on-chain.', variant: 'destructive' });
      return;
    }
    if (!rateLimit('register-startup', 3, 60000)) {
      toast({ title: 'Too many attempts', description: 'Please wait a minute before trying again.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      // 1. Call registerStartup on-chain
      const onChainTxHash = await registerOnChain({
        name: form.name.trim(),
        category: form.category,
        metadataURI: form.website.trim() || `ipfs://chaintrust/${form.name.trim().toLowerCase().replace(/\s+/g, '-')}`,
      });

      // 2. Compute scores
      const energyScore = form.chainType === 'PoS' ? 20 : 8;
      const carbonVal = Number(form.carbonOffsets) || 0;
      const carbonScore = Math.min(25, Math.round(carbonVal / 10));
      const concPct = Number(form.walletConcentration) || 0;
      const tokenomicsScore = Math.max(0, 25 - Math.round(concPct / 4));
      const pledgeCount = Object.values(form.pledges).filter(Boolean).length + (form.customPledge.trim() ? 1 : 0);
      const governanceScore = Math.min(25, pledgeCount * 5);
      const sustainabilityScore = energyScore + carbonScore + tokenomicsScore + governanceScore;

      // 3. Insert into Supabase
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser) {
        throw new Error('You must be logged in to register a startup.');
      }

      // Ensure user has the 'startup' role (may not exist if registered before role system)
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('role', 'startup')
        .maybeSingle();

      if (!existingRole) {
        await supabase.from('user_roles').insert({
          user_id: currentUser.id,
          role: 'startup' as any,
        });
      }

      const { data, error } = await supabase.from('startups').insert({
        name: sanitizeText(form.name, 100),
        user_id: currentUser.id,
        description: sanitizeText(form.description, 500),
        category: sanitizeText(form.category, 50),
        blockchain: sanitizeText(form.blockchain, 50),
        website: sanitizeUrl(form.website) || null,
        founded_date: form.foundedDate || null,
        mrr: sanitizeNumber(form.mrr, 0, 1_000_000_000),
        users: sanitizeNumber(form.mau, 0, 1_000_000_000),
        growth_rate: sanitizeNumber(form.growthRate, -100, 10000),
        treasury: sanitizeNumber(form.treasury, 0, 100_000_000_000),
        chain_type: form.chainType,
        energy_per_transaction: `${form.energyPerTx} kWh`,
        carbon_offset_tonnes: carbonVal,
        token_concentration_pct: concPct,
        whale_concentration: concPct,
        sustainability_score: sustainabilityScore,
        energy_score: energyScore,
        carbon_score: carbonScore,
        tokenomics_score: tokenomicsScore,
        governance_score: governanceScore,
        inflation_rate: 0,
        team_size: 1,
        energy_consumption: form.chainType === 'PoS' ? 0.5 : 50,
        trust_score: 50,
        verified: false,
      }).select('id').single();

      if (error) throw error;
      const startupId = data.id;

      // Insert pledges
      const pledgeTexts = PRESET_PLEDGES.filter(p => form.pledges[p.key]).map(p => p.label);
      if (form.customPledge.trim()) pledgeTexts.push(sanitizeText(form.customPledge, 255));
      if (pledgeTexts.length > 0) {
        await supabase.from('pledges').insert(
          pledgeTexts.map(t => ({ startup_id: startupId, pledge_text: t, status: 'active' }))
        );
      }

      setTxHash(onChainTxHash);
      setSuccess(true);
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || 'Registration failed';
      toast({ title: 'Registration Failed', description: msg, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-20 text-center">
        <div className="relative mb-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div key={i} className="absolute h-3 w-3 rounded-full"
              style={{ background: ['#10B981', '#3B82F6', '#EAB308', '#EF4444', '#A855F7', '#F97316'][i % 6], left: '50%', top: '50%' }}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{ x: Math.cos((i / 12) * Math.PI * 2) * 120, y: Math.sin((i / 12) * Math.PI * 2) * 120, scale: 0, opacity: 0 }}
              transition={{ duration: 1, delay: i * 0.05 }} />
          ))}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-primary">
            <CheckCircle2 className="h-10 w-10 text-primary-foreground" />
          </motion.div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Confirmed on Solana!</h2>
        <p className="mt-3 text-muted-foreground">Your startup is now registered on-chain with a permanent identity.</p>

        <div className="mt-4 rounded-lg bg-muted p-3 w-full">
          <p className="text-xs text-muted-foreground">Transaction Hash</p>
          <p className="mt-1 break-all font-mono text-xs text-foreground">{txHash}</p>
        </div>

        {/* Next steps guidance */}
        <div className="mt-8 w-full text-left">
          <h3 className="text-sm font-bold text-foreground mb-3">What to do next:</h3>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Publish your metrics', desc: 'Go to My Startup and publish your MRR, users, and growth rate on-chain.', link: '/my-startup', linkText: 'Go to My Startup', primary: true },
              { step: '2', title: 'Get verified by oracles', desc: 'Once metrics are published, Pyth oracles cross-check your data and assign a trust score.', link: null, linkText: null, primary: false },
              { step: '3', title: 'Earn your soulbound badge', desc: 'Verified startups receive a non-transferable NFT certificate in their wallet.', link: null, linkText: null, primary: false },
            ].map(item => (
              <div key={item.step} className="flex gap-3 items-start rounded-lg border border-border p-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 text-xs font-bold ${item.primary ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  {item.step}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                  {item.link && (
                    <Link to={item.link} className="inline-flex items-center gap-1 mt-1.5 text-xs font-medium text-primary hover:underline">
                      {item.linkText} <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex gap-3 w-full">
          <Link to="/my-startup" className="flex-1 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 text-center">
            Publish Metrics Now
          </Link>
          <a href={explorerTxUrl(txHash)} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground transition hover:bg-secondary">
            Solana Explorer <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-foreground">Register Startup</h1>
      <p className="mt-1 text-muted-foreground">Register on Solana Devnet in 6 steps</p>

      {/* Progress stepper */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>Step {step + 1} of {STEPS.length}</span>
          <span>{STEPS[step]}</span>
        </div>
        <Progress value={((step + 1) / STEPS.length) * 100} className="h-2" />
        <div className="mt-3 flex justify-between">
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => i < step && setStep(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                i < step ? 'bg-primary text-primary-foreground cursor-pointer' : i === step ? 'bg-primary/20 text-primary ring-2 ring-primary' : 'bg-muted text-muted-foreground'
              }`}>
              {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Form steps */}
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="mt-8 space-y-4">

          {step === 0 && (<>
            {!isConnected && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-2">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Connect your Solana wallet before starting</p>
                  <p className="text-xs text-muted-foreground">You'll need a connected wallet to submit your registration on-chain at the final step.</p>
                </div>
                <button onClick={() => openWalletModal(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition shrink-0">
                  Connect
                </button>
              </div>
            )}
            <div><label className={labelCls}>Startup Name *</label>
              <input value={form.name} onChange={e => u('name', e.target.value)} className={inputCls} placeholder="e.g. GreenChain" maxLength={100} />
              <p className="text-[11px] text-muted-foreground mt-1">Your official company or project name as it will appear on the platform.</p></div>
            <div><label className={labelCls}>Description *</label>
              <textarea value={form.description} onChange={e => u('description', e.target.value)} rows={3} className={inputCls + ' resize-none'} placeholder="What does your startup do?" maxLength={500} />
              <p className="text-[11px] text-muted-foreground mt-1">A brief summary of your product, market, and mission (max 500 chars).</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Category</label>
                <select value={form.category} onChange={e => u('category', e.target.value)} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <p className="text-[11px] text-muted-foreground mt-1">The industry vertical your startup operates in.</p></div>
              <div><label className={labelCls}>Blockchain</label>
                <select value={form.blockchain} onChange={e => u('blockchain', e.target.value)} className={inputCls}>
                  {BLOCKCHAINS.map(b => <option key={b}>{b}</option>)}
                </select></div>
            </div>
            <div><label className={labelCls}>Website URL</label>
              <input type="url" value={form.website} onChange={e => u('website', e.target.value)} className={inputCls} placeholder="https://yourcompany.com" />
              <p className="text-[11px] text-muted-foreground mt-1">Must start with https://. Leave blank if you don't have one yet.</p></div>
            <div><label className={labelCls}>Founding Date</label>
              <input type="date" value={form.foundedDate} onChange={e => u('foundedDate', e.target.value)} className={inputCls} /></div>
          </>)}

          {step === 1 && (<>
            <div className="rounded-lg bg-muted/50 p-3 mb-2">
              <p className="text-xs text-muted-foreground">Enter your current business metrics. These will be published on-chain and visible to investors. Use approximate numbers if exact figures aren't available.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Monthly Recurring Revenue ($)</label>
                <input type="number" value={form.mrr} onChange={e => u('mrr', e.target.value)} className={inputCls} placeholder="150000" min={0} />
                <p className="text-[11px] text-muted-foreground mt-1">Total predictable monthly revenue from subscriptions/contracts (USD).</p></div>
              <div><label className={labelCls}>Monthly Active Users</label>
                <input type="number" value={form.mau} onChange={e => u('mau', e.target.value)} className={inputCls} placeholder="12000" min={0} />
                <p className="text-[11px] text-muted-foreground mt-1">Unique users who used your product in the last 30 days.</p></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Growth Rate (%)</label>
                <input type="number" value={form.growthRate} onChange={e => u('growthRate', e.target.value)} className={inputCls} placeholder="12.5" step={0.1} />
                <p className="text-[11px] text-muted-foreground mt-1">Month-over-month revenue or user growth percentage.</p></div>
              <div><label className={labelCls}>Total Funding Raised ($)</label>
                <input type="number" value={form.fundingRaised} onChange={e => u('fundingRaised', e.target.value)} className={inputCls} placeholder="5000000" min={0} />
                <p className="text-[11px] text-muted-foreground mt-1">Total capital raised to date across all rounds.</p></div>
            </div>
            <div><label className={labelCls}>Treasury Balance ($)</label>
              <input type="number" value={form.treasury} onChange={e => u('treasury', e.target.value)} className={inputCls} placeholder="2000000" min={0} />
              <p className="text-[11px] text-muted-foreground mt-1">Current cash + liquid assets available. Used to calculate runway.</p></div>
          </>)}

          {step === 2 && (<>
            <div>
              <label className={labelCls}>Consensus Mechanism</label>
              <div className="flex gap-2">
                {(['PoS', 'PoW'] as const).map(t => (
                  <button key={t} onClick={() => u('chainType', t)}
                    className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition ${form.chainType === t ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'}`}>
                    {t === 'PoS' ? '⚡ Proof of Stake' : '⛏️ Proof of Work'}
                  </button>
                ))}
              </div>
            </div>
            <div><label className={labelCls}>Energy per Transaction (kWh)</label>
              <div className="relative">
                <input type="number" value={form.energyPerTx} onChange={e => u('energyPerTx', e.target.value)} className={inputCls + ' pr-14'} placeholder="0.001" step={0.001} min={0} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">kWh</span>
              </div></div>
            <div><label className={labelCls}>Carbon Offsets Purchased (tonnes CO₂)</label>
              <input type="number" value={form.carbonOffsets} onChange={e => u('carbonOffsets', e.target.value)} className={inputCls} placeholder="150" min={0} /></div>
            <div>
              <label className={labelCls}>UN SDG Alignment</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SDG_LABELS.map((sdg, i) => (
                  <label key={i} className={`flex items-center gap-2 rounded-lg border p-2.5 text-xs cursor-pointer transition ${form.sdgs.includes(i + 1) ? 'border-primary bg-primary/10 text-foreground' : 'border-border text-muted-foreground hover:bg-secondary'}`}>
                    <input type="checkbox" className="accent-primary h-3.5 w-3.5"
                      checked={form.sdgs.includes(i + 1)}
                      onChange={() => u('sdgs', form.sdgs.includes(i + 1) ? form.sdgs.filter(x => x !== i + 1) : [...form.sdgs, i + 1])} />
                    <span className="font-mono text-[10px] text-muted-foreground">{i + 1}.</span> {sdg}
                  </label>
                ))}
              </div>
            </div>
            <Toggle on={form.greenProvider} onToggle={() => u('greenProvider', !form.greenProvider)} label="Green Infrastructure Provider" />
          </>)}

          {step === 3 && (<>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Token Name</label>
                <input value={form.tokenName} onChange={e => u('tokenName', e.target.value)} className={inputCls} placeholder="CMT" maxLength={20} /></div>
              <div><label className={labelCls}>Total Supply</label>
                <input type="number" value={form.totalSupply} onChange={e => u('totalSupply', e.target.value)} className={inputCls} placeholder="1000000000" min={0} /></div>
            </div>
            <div><label className={labelCls}>Circulating Supply</label>
              <input type="number" value={form.circulatingSupply} onChange={e => u('circulatingSupply', e.target.value)} className={inputCls} placeholder="250000000" min={0} /></div>
            <div>
              <label className={labelCls}>Token Distribution (must equal 100%)</label>
              <div className={`mb-2 rounded-lg p-2 text-center text-sm font-bold ${distSum === 100 ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                Total: {distSum}%
              </div>
              <div className="space-y-3">
                <DistSlider label="Team" value={form.distTeam} onChange={v => u('distTeam', v)} />
                <DistSlider label="Investors" value={form.distInvestors} onChange={v => u('distInvestors', v)} />
                <DistSlider label="Community" value={form.distCommunity} onChange={v => u('distCommunity', v)} />
                <DistSlider label="Treasury" value={form.distTreasury} onChange={v => u('distTreasury', v)} />
                <DistSlider label="Liquidity" value={form.distLiquidity} onChange={v => u('distLiquidity', v)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelCls}>Vesting Cliff (months)</label>
                <input type="number" value={form.vestingCliff} onChange={e => u('vestingCliff', e.target.value)} className={inputCls} placeholder="12" min={0} /></div>
              <div><label className={labelCls}>Top 10 Wallet Concentration (%)</label>
                <input type="number" value={form.walletConcentration} onChange={e => u('walletConcentration', e.target.value)} className={inputCls} placeholder="35" min={0} max={100} /></div>
            </div>
          </>)}

          {step === 4 && (<>
            <p className="text-sm text-muted-foreground">Select the sustainability pledges your startup commits to:</p>
            <div className="space-y-2">
              {PRESET_PLEDGES.map(p => (
                <Toggle key={p.key} on={!!form.pledges[p.key]}
                  onToggle={() => u('pledges', { ...form.pledges, [p.key]: !form.pledges[p.key] })} label={p.label} />
              ))}
            </div>
            <div><label className={labelCls}>Custom Pledge (optional)</label>
              <textarea value={form.customPledge} onChange={e => u('customPledge', e.target.value)}
                rows={2} className={inputCls + ' resize-none'} placeholder="Add your own sustainability pledge..." maxLength={255} /></div>
          </>)}

          {step === 5 && (<>
            <div className="rounded-xl border border-border overflow-hidden">
              {[
                ['Name', form.name],
                ['Category', form.category],
                ['Blockchain', form.blockchain],
                ['Website', form.website || '—'],
                ['Founded', form.foundedDate || '—'],
                ['MRR', form.mrr ? `$${Number(form.mrr).toLocaleString()}` : '—'],
                ['Users', form.mau ? Number(form.mau).toLocaleString() : '—'],
                ['Growth Rate', form.growthRate ? `${form.growthRate}%` : '—'],
                ['Treasury', form.treasury ? `$${Number(form.treasury).toLocaleString()}` : '—'],
                ['Consensus', form.chainType],
                ['Energy/tx', `${form.energyPerTx} kWh`],
                ['Carbon Offsets', form.carbonOffsets ? `${form.carbonOffsets}t CO₂` : '—'],
                ['Token', form.tokenName || '—'],
                ['Distribution', `Team ${form.distTeam}% · Inv ${form.distInvestors}% · Comm ${form.distCommunity}% · Tres ${form.distTreasury}% · Liq ${form.distLiquidity}%`],
                ['Wallet Conc.', form.walletConcentration ? `${form.walletConcentration}%` : '—'],
                ['Pledges', `${Object.values(form.pledges).filter(Boolean).length + (form.customPledge.trim() ? 1 : 0)} active`],
              ].map(([label, value], i) => (
                <div key={label} className={`flex justify-between px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-muted/30' : ''}`}>
                  <span className="text-muted-foreground">{label}</span>
                  <span className="max-w-[60%] truncate text-right font-medium text-foreground">{value}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{form.description}</div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm text-foreground">⚠️ Registration is free on Devnet. Your wallet will sign a transaction on Solana.</p>
            </div>
            {!isConnected && (
              <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Connect wallet to register on-chain</p>
                </div>
                <button onClick={() => openWalletModal(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
                  Connect Wallet
                </button>
              </div>
            )}
            <button onClick={submit} disabled={submitting || !isConnected}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-50">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing to Solana...</> : '🚀 Submit to Blockchain'}
            </button>
          </>)}

        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {step < 5 && (
        <div className="mt-8 flex justify-between">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} className="flex items-center gap-1 rounded-xl border border-border px-5 py-2.5 font-semibold text-foreground transition hover:bg-secondary">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : <div />}
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
            className="flex items-center gap-1 rounded-xl bg-primary px-5 py-2.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-40">
            Next <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
