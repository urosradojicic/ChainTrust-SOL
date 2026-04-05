import { useEffect } from 'react';
import { FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PROGRAM_ID } from '@/lib/contracts';
import SimulatedTerminal from './SimulatedTerminal';

const MOCK_STARTUP = {
  name: 'PayFlow',
  category: 'Fintech',
  description: 'Decentralized payment infrastructure for emerging markets',
  website: 'https://payflow.xyz',
  metadataURI: 'ipfs://QmX7b5jxn7bqvBuYCfhEqm4DfkNdEzWzqPfeGRhYJFKpvA',
};

const MOCK_WALLET = '7Kp2…xQ4f';
const MOCK_TX = '5Ht9kZ3bN7qR…';
const MOCK_STARTUP_ID = '7';

interface StepProps {
  playing: boolean;
  onComplete: () => void;
}

export default function StepRegister({ playing, onComplete }: StepProps) {
  const terminalLines = [
    `❯ Connecting wallet ${MOCK_WALLET}…`,
    '✓ Wallet connected to Solana Devnet',
    '',
    `❯ chainmetrics::register_startup("${MOCK_STARTUP.name}", "${MOCK_STARTUP.category}", "${MOCK_STARTUP.metadataURI}")`,
    `⏳ Sending transaction to ${PROGRAM_ID.toBase58().slice(0, 10)}…`,
    `⏳ Confirming… slot #248,921,733`,
    `✓ Transaction confirmed: ${MOCK_TX}`,
    `✓ Startup registered with ID: ${MOCK_STARTUP_ID}`,
    '',
    '✓ Metadata pinned to IPFS',
    `✓ Program log: StartupRegistered { id: ${MOCK_STARTUP_ID}, owner: ${MOCK_WALLET} }`,
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
            <FileText className="h-4 w-4 text-primary" /> Startup Details
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {Object.entries(MOCK_STARTUP).map(([k, v]) => (
              <div key={k}>
                <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1')}</span>
                <p className="font-medium truncate">{v}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {playing && <SimulatedTerminal lines={terminalLines} speed={80} />}
    </div>
  );
}
