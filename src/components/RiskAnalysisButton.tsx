import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Brain, AlertTriangle, CheckCircle2, Leaf, Coins, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { DbStartup } from '@/hooks/use-startups';

interface Props {
  startup: DbStartup;
}

interface Section {
  title: string;
  content: string;
  type: 'risk' | 'strength';
  icon: typeof AlertTriangle;
}

function parseAnalysis(text: string): Section[] {
  const icons: Record<string, typeof AlertTriangle> = {
    financial: TrendingUp,
    environmental: Leaf,
    tokenomics: Coins,
    recommendation: CheckCircle2,
  };

  const sectionRegex = /\*\*(.+?)\*\*[:\s]*(.+?)(?=\*\*|$)/gs;
  const sections: Section[] = [];
  let match;

  while ((match = sectionRegex.exec(text)) !== null) {
    const title = match[1].trim();
    const content = match[2].trim();
    const lower = title.toLowerCase();
    const icon = lower.includes('financial') ? icons.financial
      : lower.includes('environment') ? icons.environmental
      : lower.includes('token') ? icons.tokenomics
      : icons.recommendation;
    const isStrength = lower.includes('recommendation') || content.toLowerCase().includes('strong') || content.toLowerCase().includes('positive');
    sections.push({ title, content, type: isStrength ? 'strength' : 'risk', icon });
  }

  if (sections.length === 0) {
    sections.push({ title: 'Analysis', content: text, type: 'risk', icon: AlertTriangle });
  }

  return sections;
}

export default function RiskAnalysisButton({ startup }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<Section[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    // Cache: don't re-fetch if already loaded
    if (sections) { setOpen(true); return; }
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('risk-analysis', {
        body: { startup },
      });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      setSections(parseAnalysis(data.analysis));
    } catch (e: any) {
      setError(e.message || 'Failed to generate analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={run} variant="outline" size="sm" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
        <Brain className="h-4 w-4" /> AI Risk Analysis
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Brain className="h-5 w-5 text-primary" />
              Risk Analysis — {startup.name}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="relative flex h-12 w-12 items-center justify-center">
                <span className="absolute h-full w-full animate-ping rounded-full bg-primary/30" />
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground animate-pulse">Generating on-chain risk analysis...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <button onClick={() => { setSections(null); setError(null); run(); }} className="mt-3 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition">
                Retry Analysis
              </button>
            </div>
          ) : sections ? (
            <div className="grid gap-3 py-2">
              {sections.map((s, i) => (
                <div key={i} className={`rounded-xl border p-4 ${s.type === 'strength' ? 'border-primary/20 bg-primary/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                  <div className="mb-1.5 flex items-center gap-2">
                    {s.type === 'strength'
                      ? <CheckCircle2 className="h-4 w-4 text-primary" />
                      : <AlertTriangle className="h-4 w-4 text-amber-500" />}
                    <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{s.content}</p>
                </div>
              ))}
              <p className="text-center text-[10px] text-muted-foreground">Powered by AI · Not financial advice</p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
