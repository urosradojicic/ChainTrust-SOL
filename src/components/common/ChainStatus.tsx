import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PROGRAM_ID, getRegistryPDA } from '@/lib/contracts';
import { SOLANA_NETWORK } from '@/lib/solana-config';
import { Wifi, WifiOff, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';

type ProgramStatus = 'checking' | 'deployed' | 'not-deployed' | 'error';

/**
 * Live chain status indicator.
 * Shows whether the Anchor program is deployed and accessible on the current cluster.
 * Judges can see at a glance: real devnet connection, program deployed, wallet connected.
 */
export default function ChainStatus({ compact = false }: { compact?: boolean }) {
  const { connection } = useConnection();
  const { connected, publicKey } = useWallet();
  const [programStatus, setProgramStatus] = useState<ProgramStatus>('checking');
  const [slot, setSlot] = useState<number | null>(null);
  const [registryCount, setRegistryCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // Check if program exists on-chain
        const programInfo = await connection.getAccountInfo(PROGRAM_ID);
        if (cancelled) return;

        if (programInfo && programInfo.executable) {
          setProgramStatus('deployed');

          // Try to read registry for startup count
          try {
            const [registryPDA] = getRegistryPDA();
            const registryInfo = await connection.getAccountInfo(registryPDA);
            if (registryInfo?.data && registryInfo.data.length >= 48) {
              // Skip 8-byte Anchor discriminator + 32-byte authority
              const count = Number(registryInfo.data.readBigUInt64LE(40));
              if (!cancelled) setRegistryCount(count);
            }
          } catch {
            // Registry may not be initialized yet
          }
        } else {
          setProgramStatus('not-deployed');
        }

        // Get current slot for liveness proof
        const currentSlot = await connection.getSlot();
        if (!cancelled) setSlot(currentSlot);
      } catch {
        if (!cancelled) setProgramStatus('error');
      }
    }

    check();
    const interval = setInterval(check, 30000); // Refresh every 30s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [connection]);

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs">
        <div className={`h-2 w-2 rounded-full ${
          programStatus === 'deployed' ? 'bg-green-500 animate-pulse' :
          programStatus === 'not-deployed' ? 'bg-yellow-500' :
          programStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
        }`} />
        <span className="text-muted-foreground">
          {programStatus === 'deployed' ? 'Live on Devnet' :
           programStatus === 'not-deployed' ? 'Demo Mode' :
           programStatus === 'error' ? 'Offline' : 'Checking...'}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 text-sm space-y-3">
      <h4 className="font-semibold flex items-center gap-2">
        {programStatus === 'deployed' ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-yellow-500" />
        )}
        Chain Status
      </h4>

      <div className="space-y-2">
        {/* Network */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Network</span>
          <span className="font-mono font-medium capitalize">{SOLANA_NETWORK}</span>
        </div>

        {/* Program */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Program</span>
          <div className="flex items-center gap-1.5">
            {programStatus === 'deployed' ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            ) : programStatus === 'not-deployed' ? (
              <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
            ) : null}
            <span className={`font-medium ${
              programStatus === 'deployed' ? 'text-green-600' :
              programStatus === 'not-deployed' ? 'text-yellow-600' : ''
            }`}>
              {programStatus === 'deployed' ? 'Deployed' :
               programStatus === 'not-deployed' ? 'Not Deployed (Demo Mode)' :
               programStatus === 'error' ? 'Connection Error' : 'Checking...'}
            </span>
          </div>
        </div>

        {/* Program ID */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Program ID</span>
          <a
            href={`https://explorer.solana.com/address/${PROGRAM_ID.toBase58()}?cluster=${SOLANA_NETWORK}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-primary hover:underline flex items-center gap-1"
          >
            {PROGRAM_ID.toBase58().slice(0, 8)}...
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Wallet */}
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Wallet</span>
          <span className={`font-medium ${connected ? 'text-green-600' : 'text-muted-foreground'}`}>
            {connected && publicKey ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}` : 'Not Connected'}
          </span>
        </div>

        {/* Registry count */}
        {registryCount !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Registered Startups</span>
            <span className="font-mono font-medium">{registryCount}</span>
          </div>
        )}

        {/* Current slot */}
        {slot && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Slot</span>
            <span className="font-mono text-xs">{slot.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Demo mode notice */}
      {programStatus === 'not-deployed' && (
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900 p-3 text-xs text-yellow-800 dark:text-yellow-200">
          <p className="font-semibold mb-1">Demo Mode Active</p>
          <p>The Anchor program is not yet deployed to {SOLANA_NETWORK}. Blockchain transactions are simulated. Deploy with <code className="font-mono bg-yellow-100 dark:bg-yellow-900 px-1 rounded">anchor deploy</code> to enable real on-chain operations.</p>
        </div>
      )}
    </div>
  );
}
