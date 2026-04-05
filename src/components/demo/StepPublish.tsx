import { useEffect } from 'react';
import { Database } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import SimulatedTerminal from './SimulatedTerminal';

const MOCK_METRICS = {
  mrr: 142000,
  totalUsers: 12847,
  activeUsers: 8934,
  burnRate: 89000,
  runway: 18,
  growthRate: 23,
  carbonOffset: 45,
  proofHash: 'Qm8f14e45fceea167a5a36dedd4bea2543…',
};

const MOCK_STARTUP_ID = '7';

interface StepProps {
  playing: boolean;
  onComplete: () => void;
}

export default function StepPublish({ playing, onComplete }: StepProps) {
  const terminalLines = [
    `❯ Fetching Stripe MRR data via oracle adapter…`,
    `✓ Stripe MRR: $${MOCK_METRICS.mrr.toLocaleString()}`,
    `❯ Fetching analytics data…`,
    `✓ Total Users: ${MOCK_METRICS.totalUsers.toLocaleString()} | Active: ${MOCK_METRICS.activeUsers.toLocaleString()}`,
    '',
    `❯ Computing proof hash…`,
    `✓ SHA-256(mrr | users | growth | burn | runway) = ${MOCK_METRICS.proofHash}`,
    '',
    `❯ chainmetrics::publish_metrics(${MOCK_STARTUP_ID}, ${MOCK_METRICS.mrr}, ${MOCK_METRICS.totalUsers}, …, proofHash)`,
    `⏳ Sending transaction…`,
    `⏳ Confirming… slot #248,921,740`,
    `✓ Transaction confirmed`,
    `✓ Program log: MetricsPublished { id: ${MOCK_STARTUP_ID}, timestamp: ${Math.floor(Date.now() / 1000)} }`,
  ];

  useEffect(() => {
    if (playing) {
      const timer = setTimeout(onComplete, terminalLines.length * 80 + 500);
      return () => clearTimeout(timer);
    }
  }, [playing]);

  return (
    <div className="space-y-5">
      <Card className="border-border/60">
        <CardContent className="p-5">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Database className="h-4 w-4 text-accent" /> Published Metrics
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            {[
              ['MRR', `$${MOCK_METRICS.mrr.toLocaleString()}`],
              ['Total Users', MOCK_METRICS.totalUsers.toLocaleString()],
              ['Active Users', MOCK_METRICS.activeUsers.toLocaleString()],
              ['Burn Rate', `$${MOCK_METRICS.burnRate.toLocaleString()}/mo`],
              ['Runway', `${MOCK_METRICS.runway} months`],
              ['Growth', `+${MOCK_METRICS.growthRate}%`],
              ['Carbon Offset', `${MOCK_METRICS.carbonOffset} tons`],
            ].map(([label, val]) => (
              <div key={label}>
                <span className="text-muted-foreground">{label}</span>
                <p className="font-bold font-mono">{val}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {playing && <SimulatedTerminal lines={terminalLines} speed={80} />}
    </div>
  );
}
