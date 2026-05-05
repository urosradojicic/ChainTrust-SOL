import { useMemo } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
// Import each adapter from its own package rather than the
// `@solana/wallet-adapter-wallets` meta-package: that meta dragged in Trezor
// and Torus adapters whose deep transitive deps (protobufjs, bigint-buffer,
// crypto-browserify) carried 8 critical npm advisories. We never instantiate
// those adapters anyway.
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { SOLANA_RPC_URL } from '@/lib/solana-config';

import '@solana/wallet-adapter-react-ui/styles.css';

export default function Web3Provider({ children }: { children: React.ReactNode }) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
    ],
    [],
  );

  return (
    <ConnectionProvider endpoint={SOLANA_RPC_URL}>
      {/*
        autoConnect intentionally disabled — auto-reconnecting to the last
        wallet would let a previous user's session carry over on shared
        machines. Users must explicitly click "Connect Wallet".
      */}
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          {children}
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
