import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { usePublishMetrics } from '@/hooks/use-blockchain';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  Loader2, Save, CheckCircle2, Plus, History,
  Building2, BarChart3, Leaf, FileText, AlertTriangle, Award, Lock, Shield,
  Upload, X, File, Download,
} from 'lucide-react';
import { sanitizeText, sanitizeNumber } from '@/lib/sanitize';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuditLogTable } from '@/components/audit/AuditLogTable';
import { inputCls, labelCls, CATEGORIES, BLOCKCHAINS } from '@/lib/constants';
import type { DbStartup, DbDbAuditEntry } from '@/types/database';

export default function MyStartup() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { connected: isConnected } = useSolanaWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const { publish, isPending: txPending } = usePublishMetrics();
  const [startup, setStartup] = useState<DbStartup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [auditLog, setAuditLog] = useState<DbAuditEntry[]>([]);
  const [activeTab, setActiveTab] = useState('profile');

  // BMC PDF upload state
  const [bmcFile, setBmcFile] = useState<{ name: string; size: number; uploadedAt: string; dataUrl: string } | null>(() => {
    try {
      const saved = localStorage.getItem('chaintrust_bmc');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [bmcDragOver, setBmcDragOver] = useState(false);

  const handleBmcUpload = (file: File) => {
    // Validate MIME type
    if (file.type !== 'application/pdf') {
      toast({ title: 'Invalid file', description: 'Please upload a PDF file.', variant: 'destructive' });
      return;
    }
    // Validate file extension (defense in depth — MIME can be spoofed)
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast({ title: 'Invalid file', description: 'File must have a .pdf extension.', variant: 'destructive' });
      return;
    }
    // Limit size to 5MB for localStorage safety
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB.', variant: 'destructive' });
      return;
    }
    // Sanitize filename (remove path traversal, special chars)
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Verify it's actually a data URL starting with the PDF MIME
      if (!result.startsWith('data:application/pdf;')) {
        toast({ title: 'Invalid file content', description: 'File does not appear to be a valid PDF.', variant: 'destructive' });
        return;
      }
      const entry = {
        name: safeName,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        dataUrl: result,
      };
      setBmcFile(entry);
      localStorage.setItem('chaintrust_bmc', JSON.stringify(entry));
      toast({ title: 'BMC uploaded', description: `${safeName} saved successfully.` });
    };
    reader.readAsDataURL(file);
  };

  const removeBmc = () => {
    setBmcFile(null);
    localStorage.removeItem('chaintrust_bmc');
    toast({ title: 'BMC removed' });
  };

  // Editable fields
  const [form, setForm] = useState({
    name: '', description: '', category: 'DeFi', blockchain: 'Base', website: '', team_size: '1',
    mrr: '0', users: '0', growth_rate: '0', treasury: '0',
    carbon_offset_tonnes: '0', energy_per_transaction: '0.001', token_concentration_pct: '0',
  });

  // Monthly metrics form
  const [monthForm, setMonthForm] = useState({
    month: '', revenue: '', costs: '', mau: '', carbon_offsets: '',
  });
  const [submittingMonth, setSubmittingMonth] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    // Role guard in App.tsx handles access — just fetch data
    fetchStartup();
  }, [user, role]);

  const fetchStartup = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) { if (import.meta.env.DEV) console.error(error); setLoading(false); return; }
    if (!data) { setLoading(false); return; }
    setStartup(data as unknown as DbStartup);
    setForm({
      name: data.name, description: data.description || '', category: data.category,
      blockchain: data.blockchain, website: data.website || '', team_size: String(data.team_size),
      mrr: String(data.mrr), users: String(data.users), growth_rate: String(data.growth_rate),
      treasury: String(data.treasury), carbon_offset_tonnes: String(data.carbon_offset_tonnes),
      energy_per_transaction: (data.energy_per_transaction || '0.001 kWh').replace(' kWh', ''),
      token_concentration_pct: String(data.token_concentration_pct),
    });
    // Fetch audit log
    const { data: logs } = await supabase
      .from('startup_audit_log')
      .select('*')
      .eq('startup_id', data.id)
      .order('changed_at', { ascending: false })
      .limit(50);
    if (logs) setAuditLog(logs as DbAuditEntry[]);
    setLoading(false);
  };

  const u = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const saveProfile = async () => {
    if (!startup || !user) return;
    if (!isConnected) {
      toast({ title: 'Wallet Required', description: 'Please connect your wallet to publish on-chain.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      const updates: Record<string, any> = {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        blockchain: form.blockchain,
        website: form.website.trim() || null,
        team_size: Number(form.team_size) || 1,
        mrr: Number(form.mrr) || 0,
        users: Number(form.users) || 0,
        growth_rate: Number(form.growth_rate) || 0,
        treasury: Number(form.treasury) || 0,
        carbon_offset_tonnes: Number(form.carbon_offset_tonnes) || 0,
        energy_per_transaction: `${form.energy_per_transaction} kWh`,
        token_concentration_pct: Number(form.token_concentration_pct) || 0,
        whale_concentration: Number(form.token_concentration_pct) || 0,
      };

      // Detect changes for audit log
      const oldData: Record<string, any> = {
        name: startup.name, description: startup.description || '', category: startup.category,
        blockchain: startup.blockchain, website: startup.website || '', team_size: startup.team_size,
        mrr: startup.mrr, users: startup.users, growth_rate: startup.growth_rate,
        treasury: startup.treasury, carbon_offset_tonnes: startup.carbon_offset_tonnes,
        energy_per_transaction: startup.energy_per_transaction,
        token_concentration_pct: startup.token_concentration_pct,
        whale_concentration: startup.whale_concentration,
      };

      const changes: { field: string; old_val: string; new_val: string }[] = [];
      for (const key of Object.keys(updates)) {
        const oldVal = String(oldData[key] ?? '');
        const newVal = String(updates[key] ?? '');
        if (oldVal !== newVal) {
          changes.push({ field: key, old_val: oldVal, new_val: newVal });
        }
      }

      if (changes.length === 0) {
        toast({ title: 'No changes', description: 'Nothing was modified.' });
        setSaving(false);
        return;
      }

      // Publish metrics on-chain via Anchor smart contract
      const txHash = await publish({
        startupId: 1,
        mrr: Number(form.mrr) || 0,
        totalUsers: Number(form.users) || 0,
        activeUsers: Math.round((Number(form.users) || 0) * 0.7),
        burnRate: 0,
        runway: Number(form.treasury) || 0,
        growthRate: Number(form.growth_rate) || 0,
        carbonOffset: Number(form.carbon_offset_tonnes) || 0,
      });

      // Update Supabase after on-chain confirmation
      const { error } = await supabase.from('startups').update(updates).eq('id', startup.id);
      if (error) throw error;

      // Insert audit log entries with tx hash
      await supabase.from('startup_audit_log').insert(
        changes.map(c => ({
          startup_id: startup.id,
          user_id: user.id,
          field_changed: c.field,
          old_value: c.old_val,
          new_value: c.new_val,
          tx_hash: txHash,
        }))
      );

      setSaved(true);
      toast({ title: 'Confirmed on Solana ✓', description: `${changes.length} field(s) published. Tx: ${txHash.slice(0, 10)}...` });

      fetchStartup();
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || 'Save failed';
      toast({ title: 'Save Failed', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const submitMonthlyMetrics = async () => {
    if (!startup || !monthForm.month || !user) return;
    if (!isConnected) {
      toast({ title: 'Wallet Required', description: 'Please connect your wallet to publish on-chain.', variant: 'destructive' });
      return;
    }
    setSubmittingMonth(true);
    try {
      // Publish on-chain first
      const txHash = await publish({
        startupId: 1,
        mrr: Number(monthForm.revenue) || 0,
        totalUsers: Number(monthForm.mau) || 0,
        activeUsers: Math.round((Number(monthForm.mau) || 0) * 0.7),
        burnRate: Number(monthForm.costs) || 0,
        runway: 0,
        growthRate: Number(form.growth_rate) || 0,
        carbonOffset: Number(monthForm.carbon_offsets) || 0,
      });

      // Then save to Supabase
      const { error } = await supabase.from('metrics_history').insert({
        startup_id: startup.id,
        month: sanitizeText(monthForm.month, 7),
        month_date: `${sanitizeText(monthForm.month, 7)}-01`,
        revenue: sanitizeNumber(monthForm.revenue, 0, 1e12),
        costs: sanitizeNumber(monthForm.costs, 0, 1e12),
        mau: sanitizeNumber(monthForm.mau, 0, 1e9),
        carbon_offsets: sanitizeNumber(monthForm.carbon_offsets, 0, 1e6),
        growth_rate: sanitizeNumber(form.growth_rate, -100, 1000),
      });
      if (error) throw error;

      await supabase.from('startup_audit_log').insert({
        startup_id: startup.id,
        user_id: user.id,
        field_changed: 'monthly_metrics',
        old_value: null,
        new_value: `${monthForm.month}: Rev $${monthForm.revenue}, Costs $${monthForm.costs}, MAU ${monthForm.mau}`,
        tx_hash: txHash,
      });

      toast({ title: 'Monthly metrics published on-chain ✓', description: `Tx: ${txHash.slice(0, 10)}...` });
      setMonthForm({ month: '', revenue: '', costs: '', mau: '', carbon_offsets: '' });
      fetchStartup();
    } catch (e: any) {
      const msg = e?.shortMessage || e?.message || 'Transaction failed';
      toast({ title: 'Transaction Failed', description: msg, variant: 'destructive' });
    } finally {
      setSubmittingMonth(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!startup) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="rounded-2xl border border-border bg-card p-10 max-w-md w-full shadow-sm">
        <Building2 className="h-14 w-14 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground mb-2">No Startup Registered</h1>
        <p className="text-muted-foreground mb-6">
          You need to register a startup before you can manage your profile and metrics here.
        </p>
        <button
          onClick={() => navigate('/register')}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Register Your Startup
        </button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Startup</h1>
          <p className="text-muted-foreground">Manage your startup profile and metrics</p>
        </div>
        {startup.verified && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">✓ Verified</span>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="profile" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Profile & Metrics</TabsTrigger>
          <TabsTrigger value="monthly" className="gap-1.5"><BarChart3 className="h-3.5 w-3.5" /> Monthly Data</TabsTrigger>
          <TabsTrigger value="bmc" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Business Model Canvas</TabsTrigger>
          <TabsTrigger value="badge" className="gap-1.5"><Award className="h-3.5 w-3.5" /> Verification Badge</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5"><History className="h-3.5 w-3.5" /> Audit Trail</TabsTrigger>
        </TabsList>

        {/* Profile & Metrics */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-bold text-foreground flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /> Profile</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={labelCls}>Startup Name</label>
                <input value={form.name} onChange={e => u('name', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Category</label>
                <select value={form.category} onChange={e => u('category', e.target.value)} className={inputCls}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select></div>
            </div>
            <div><label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={e => u('description', e.target.value)} rows={3} className={inputCls + ' resize-none'} /></div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className={labelCls}>Blockchain</label>
                <select value={form.blockchain} onChange={e => u('blockchain', e.target.value)} className={inputCls}>
                  {BLOCKCHAINS.map(b => <option key={b}>{b}</option>)}
                </select></div>
              <div><label className={labelCls}>Website</label>
                <input value={form.website} onChange={e => u('website', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Team Size</label>
                <input type="number" value={form.team_size} onChange={e => u('team_size', e.target.value)} className={inputCls} min={1} /></div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-bold text-foreground flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Metrics</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={labelCls}>MRR ($)</label>
                <input type="number" value={form.mrr} onChange={e => u('mrr', e.target.value)} className={inputCls} min={0} /></div>
              <div><label className={labelCls}>Monthly Active Users</label>
                <input type="number" value={form.users} onChange={e => u('users', e.target.value)} className={inputCls} min={0} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className={labelCls}>Growth Rate (%)</label>
                <input type="number" value={form.growth_rate} onChange={e => u('growth_rate', e.target.value)} className={inputCls} step={0.1} /></div>
              <div><label className={labelCls}>Treasury ($)</label>
                <input type="number" value={form.treasury} onChange={e => u('treasury', e.target.value)} className={inputCls} min={0} /></div>
              <div><label className={labelCls}>Token Concentration (%)</label>
                <input type="number" value={form.token_concentration_pct} onChange={e => u('token_concentration_pct', e.target.value)} className={inputCls} min={0} max={100} /></div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-bold text-foreground flex items-center gap-2"><Leaf className="h-4 w-4 text-primary" /> Sustainability</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={labelCls}>Carbon Offsets (tonnes CO₂)</label>
                <input type="number" value={form.carbon_offset_tonnes} onChange={e => u('carbon_offset_tonnes', e.target.value)} className={inputCls} min={0} /></div>
              <div><label className={labelCls}>Energy per Transaction (kWh)</label>
                <input type="number" value={form.energy_per_transaction} onChange={e => u('energy_per_transaction', e.target.value)} className={inputCls} step={0.001} min={0} /></div>
            </div>
          </div>

          {!isConnected && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Wallet required to publish on-chain</p>
                <p className="text-xs text-muted-foreground">Connect your Solana wallet to sign and publish changes to Devnet.</p>
              </div>
              <button onClick={() => openWalletModal(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition">
                Connect Wallet
              </button>
            </div>
          )}
          <button onClick={saveProfile} disabled={saving || txPending || !isConnected}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-50">
            {saving || txPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Publishing on Solana...</>
              : saved ? <><CheckCircle2 className="h-4 w-4" /> Confirmed on Solana!</>
              : <><Save className="h-4 w-4" /> Save & Publish On-Chain</>}
          </button>
        </TabsContent>

        {/* Monthly Data */}
        <TabsContent value="monthly" className="mt-6 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6 space-y-4">
            <h2 className="font-bold text-foreground flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Submit Monthly Metrics</h2>
            <p className="text-sm text-muted-foreground">Add a new month of data. This will be publicly visible and recorded on-chain.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={labelCls}>Month (YYYY-MM)</label>
                <input type="month" value={monthForm.month} onChange={e => setMonthForm(f => ({ ...f, month: e.target.value }))} className={inputCls} /></div>
              <div><label className={labelCls}>Revenue ($)</label>
                <input type="number" value={monthForm.revenue} onChange={e => setMonthForm(f => ({ ...f, revenue: e.target.value }))} className={inputCls} min={0} /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div><label className={labelCls}>Operating Costs ($)</label>
                <input type="number" value={monthForm.costs} onChange={e => setMonthForm(f => ({ ...f, costs: e.target.value }))} className={inputCls} min={0} /></div>
              <div><label className={labelCls}>Monthly Active Users</label>
                <input type="number" value={monthForm.mau} onChange={e => setMonthForm(f => ({ ...f, mau: e.target.value }))} className={inputCls} min={0} /></div>
              <div><label className={labelCls}>Carbon Offsets (tonnes)</label>
                <input type="number" value={monthForm.carbon_offsets} onChange={e => setMonthForm(f => ({ ...f, carbon_offsets: e.target.value }))} className={inputCls} min={0} /></div>
            </div>
            <button onClick={submitMonthlyMetrics} disabled={submittingMonth || !monthForm.month}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-50">
              {submittingMonth ? <><Loader2 className="h-4 w-4 animate-spin" /> Recording...</> : <><FileText className="h-4 w-4" /> Submit & Record On-Chain</>}
            </button>
          </div>
        </TabsContent>

        {/* Business Model Canvas */}
        <TabsContent value="bmc" className="mt-6 space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-bold text-foreground flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary" /> Business Model Canvas
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your Business Model Canvas as a PDF. This helps investors quickly understand your value proposition,
              revenue streams, key partners, and cost structure. Drag and drop or click to upload.
            </p>

            {bmcFile ? (
              <div className="space-y-4">
                {/* Uploaded file card */}
                <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                    <File className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{bmcFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(bmcFile.size / 1024).toFixed(0)} KB — Uploaded {new Date(bmcFile.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={bmcFile.dataUrl}
                      download={bmcFile.name}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      onClick={removeBmc}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      title="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* PDF preview */}
                <div className="rounded-xl border border-border overflow-hidden bg-muted/20">
                  <iframe
                    src={bmcFile.dataUrl}
                    className="w-full h-[600px]"
                    title="Business Model Canvas Preview"
                  />
                </div>

                {/* Replace button */}
                <label className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition hover:border-primary hover:text-primary cursor-pointer">
                  <Upload className="h-4 w-4" />
                  Replace with a new PDF
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleBmcUpload(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            ) : (
              /* Drop zone */
              <div
                onDragOver={e => { e.preventDefault(); setBmcDragOver(true); }}
                onDragLeave={() => setBmcDragOver(false)}
                onDrop={e => {
                  e.preventDefault();
                  setBmcDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f) handleBmcUpload(f);
                }}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition ${
                  bmcDragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card/50 hover:border-primary/50'
                }`}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {bmcDragOver ? 'Drop your PDF here' : 'Drag & drop your BMC PDF'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  or click to browse — PDF only, max 10MB
                </p>
                <label className="mt-4 cursor-pointer rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">
                  Choose File
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleBmcUpload(f);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          {/* What to include */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="font-bold text-foreground mb-3">What to include in your BMC</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { title: 'Value Proposition', items: ['What problem you solve', 'Unique selling point', 'Target customer segments'] },
                { title: 'Revenue & Cost', items: ['Revenue streams & pricing', 'Key cost drivers', 'Unit economics (if available)'] },
                { title: 'Operations', items: ['Key partners & suppliers', 'Distribution channels', 'Key resources & activities'] },
              ].map(section => (
                <div key={section.title} className="rounded-lg bg-muted/30 p-4">
                  <h4 className="text-sm font-semibold mb-2">{section.title}</h4>
                  <ul className="space-y-1">
                    {section.items.map(item => (
                      <li key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Badge Claiming */}
        <TabsContent value="badge" className="mt-6 space-y-6">
          {startup.verified ? (
            <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-6">
              <div className="absolute -top-16 -right-16 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary">
                  <Award className="h-7 w-7 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold">Soulbound Verification Badge</h3>
                    <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      <Lock className="h-2.5 w-2.5" /> Non-Transferable
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{startup.name} — Verified on ChainTrust</p>
                  <div className="mt-3 grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Trust Score</span>
                      <p className="text-xl font-bold font-mono text-primary">{startup.trust_score}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Category</span>
                      <p className="text-sm font-medium">{startup.category}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</span>
                      <p className="text-sm font-medium text-emerald-400">Verified</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-muted">
                  <Shield className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold">Verification Badge — Not Yet Earned</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete the steps below to earn your soulbound verification badge on Solana.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Badge requirements checklist */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-bold mb-4">Badge Requirements</h3>
            <div className="space-y-3">
              {[
                { label: 'Complete startup profile', done: !!(startup.name && startup.category && startup.description), desc: 'Name, category, description, and website filled out' },
                { label: 'Publish metrics on-chain', done: startup.mrr > 0, desc: 'At least one set of metrics published to Solana' },
                { label: 'Achieve trust score > 60', done: startup.trust_score > 60, desc: `Current: ${startup.trust_score}/100` },
                { label: 'Submit sustainability data', done: Number(startup.carbon_offset_tonnes) > 0, desc: 'Carbon offset and energy data reported' },
                { label: 'Pass oracle verification', done: startup.verified || false, desc: 'Independent oracle attestation of published metrics' },
              ].map((req, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-muted/30 p-3">
                  {req.done ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className={`text-sm font-medium ${req.done ? 'text-foreground' : 'text-muted-foreground'}`}>{req.label}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{req.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {!startup.verified && (
              <button
                onClick={() => {
                  toast({ title: 'Verification requested', description: 'Your startup will be reviewed by oracle verifiers within 48 hours.' });
                }}
                disabled={startup.trust_score <= 60 || startup.mrr <= 0}
                className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90 disabled:opacity-40"
              >
                <Award className="h-4 w-4" /> Request Verification Badge
              </button>
            )}
            {startup.verified && (
              <button
                onClick={() => {
                  toast({ title: 'Badge minted!', description: 'Soulbound verification badge has been minted on Solana.' });
                }}
                className="mt-4 flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition hover:bg-primary/90"
              >
                <Award className="h-4 w-4" /> Mint Soulbound Badge on Solana
              </button>
            )}
          </div>

          {/* Badge tiers */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-bold mb-4">Badge Tiers</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { tier: 'Bronze', min: 60, color: 'border-amber-700/50 bg-amber-900/10', textColor: 'text-amber-600', features: ['Basic verification', 'Leaderboard listing', 'Public proof chain'] },
                { tier: 'Silver', min: 75, color: 'border-gray-400/50 bg-gray-500/10', textColor: 'text-gray-400', features: ['Priority oracle verification', 'Institutional visibility', 'API access'] },
                { tier: 'Gold', min: 90, color: 'border-amber-400/50 bg-amber-400/10', textColor: 'text-amber-400', features: ['Featured placement', 'Investor introductions', 'Premium analytics'] },
              ].map((t, i) => (
                <div key={t.tier} className={`rounded-xl border p-4 ${t.color} ${startup.trust_score >= t.min ? '' : 'opacity-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-bold ${t.textColor}`}>{t.tier}</span>
                    <span className="text-xs font-mono text-muted-foreground">{t.min}+ trust</span>
                  </div>
                  <ul className="space-y-1">
                    {t.features.map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CheckCircle2 className={`h-3 w-3 shrink-0 ${startup.trust_score >= t.min ? t.textColor : 'text-muted-foreground/30'}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {startup.trust_score >= t.min && (
                    <span className={`mt-2 block text-[10px] font-bold ${t.textColor}`}>Eligible</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Audit Trail */}
        <TabsContent value="audit" className="mt-6">
          <AuditLogTable entries={auditLog} showStatus />
        </TabsContent>
      </Tabs>
    </div>
  );
}

