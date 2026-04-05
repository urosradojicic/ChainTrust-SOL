import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useWallet } from '@/contexts/WalletContext';
import { CheckCircle2 } from 'lucide-react';

const WALLETS = [
  {
    name: 'Phantom',
    icon: 'https://phantom.app/img/phantom-logo.svg',
  },
  {
    name: 'Solflare',
    icon: 'https://solflare.com/favicon.ico',
  },
  {
    name: 'Coinbase Wallet',
    icon: 'https://altcoinsbox.com/wp-content/uploads/2022/12/coinbase-logo-300x300.webp',
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WalletConnectModal({ open, onOpenChange }: Props) {
  const { connected, address } = useWallet();
  const { setVisible } = useWalletModal();

  const handlePick = () => {
    // Use the Solana wallet-adapter's built-in modal
    onOpenChange(false);
    setVisible(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-lg">
            {connected ? 'Connected!' : 'Connect Wallet'}
          </DialogTitle>
        </DialogHeader>

        {connected ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <CheckCircle2 className="h-10 w-10 text-primary" />
            <p className="font-mono text-sm text-foreground">
              {address.slice(0, 4)}...{address.slice(-4)}
            </p>
            <p className="text-xs text-muted-foreground">Solana Devnet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 py-2">
            {WALLETS.map((w) => (
              <button
                key={w.name}
                onClick={handlePick}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left transition hover:bg-secondary"
              >
                <img src={w.icon} alt={w.name} className="h-8 w-8 rounded-lg object-contain" />
                <span className="text-sm font-medium text-foreground">{w.name}</span>
              </button>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
