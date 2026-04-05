import { useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { getRegistryPDA, getVaultPDA, getDaoPDA, PROGRAM_ID } from '@/lib/contracts';
import { SOLANA_NETWORK } from '@/lib/solana-config';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

export default function BlockchainStatus() {
  const { connection } = useConnection();
  const [isDemo, setIsDemo] = useState(false);
  const [checked, setChecked] = useState(false);
  const [slot, setSlot] = useState<number | null>(null);
  const [networkOk, setNetworkOk] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const [registryPDA] = getRegistryPDA();
        const [vaultPDA] = getVaultPDA();
        const [daoPDA] = getDaoPDA();

        const [registryInfo, vaultInfo, daoInfo, currentSlot] = await Promise.all([
          connection.getAccountInfo(registryPDA),
          connection.getAccountInfo(vaultPDA),
          connection.getAccountInfo(daoPDA),
          connection.getSlot().catch(() => null),
        ]);

        setIsDemo(!registryInfo || !vaultInfo || !daoInfo);
        setSlot(currentSlot);
        setNetworkOk(true);
      } catch (err) {
        setIsDemo(true);
        setNetworkOk(false);
        console.warn('[BlockchainStatus] Network check failed:', err);
      }
      setChecked(true);
    };
    check();

    // Re-check every 30s
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [connection]);

  if (!checked) return null;

  return (
    <div className={`mx-auto mb-4 flex max-w-5xl items-center gap-2 rounded-lg border px-4 py-2 text-sm ${
      isDemo
        ? 'border-amber-500/20 bg-amber-500/5'
        : 'border-accent/20 bg-accent/5'
    }`}>
      {isDemo ? (
        <>
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">Demo mode</span> — Programs not deployed on Solana {SOLANA_NETWORK}. Transactions use simulated signatures.
          </span>
        </>
      ) : (
        <>
          {networkOk ? (
            <Wifi className="h-4 w-4 shrink-0 text-accent" />
          ) : (
            <WifiOff className="h-4 w-4 shrink-0 text-destructive" />
          )}
          <span className="text-muted-foreground">
            <span className="font-medium text-accent">Live on Solana {SOLANA_NETWORK}</span>
            {slot && <span className="ml-2 font-mono text-xs">Slot #{slot.toLocaleString()}</span>}
            <span className="ml-2 font-mono text-[10px] text-muted-foreground">{PROGRAM_ID.toBase58().slice(0, 12)}...</span>
          </span>
        </>
      )}
    </div>
  );
}
