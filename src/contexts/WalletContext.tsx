import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useWallet as useSolanaWallet, useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { getInvestorPDA, getTokenConfigPDA, computeTier, CMT_DECIMALS } from '@/lib/contracts';

interface WalletState {
  connected: boolean;
  connecting: boolean;
  address: string;
  balance: number;
  cmtBalance: number;
  tier: 'Free' | 'Basic' | 'Pro' | 'Whale';
  stakedAmount: number;
  walletType: string | null;
  bookmarkedStartups: string[];
}

interface WalletContextType extends WalletState {
  connect: (walletType: string) => Promise<void>;
  disconnect: () => void;
  toggleBookmark: (startupId: string) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Tier thresholds match on-chain Rust program (in base units with 6 decimals)
function getTier(stakedBaseUnits: number): 'Free' | 'Basic' | 'Pro' | 'Whale' {
  return computeTier(stakedBaseUnits);
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const solanaWallet = useSolanaWallet();
  const { connection } = useConnection();
  const [bookmarkedStartups, setBookmarkedStartups] = useState<string[]>([]);
  const [solBalance, setSolBalance] = useState(0);
  const [cmtBalance, setCmtBalance] = useState(0);
  const [stakedAmount, setStakedAmount] = useState(0);

  // Fetch SOL balance and staked CMT when wallet connects
  useEffect(() => {
    if (solanaWallet.publicKey) {
      connection.getBalance(solanaWallet.publicKey).then((balance) => {
        setSolBalance(balance / LAMPORTS_PER_SOL);
      }).catch(() => setSolBalance(0));

      // Read InvestorAccount PDA to get real staked amount
      const [investorPDA] = getInvestorPDA(solanaWallet.publicKey);
      connection.getAccountInfo(investorPDA).then((info) => {
        if (info?.data && info.data.length >= 56) {
          // Skip 8-byte discriminator + 32-byte user pubkey, then read u64 staked_amount
          const staked = Number(info.data.readBigUInt64LE(40));
          setStakedAmount(staked);
        } else {
          setStakedAmount(0);
        }
      }).catch(() => setStakedAmount(0));
      // Try to read CMT token balance via token accounts
      connection.getParsedTokenAccountsByOwner(solanaWallet.publicKey, {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      }).then(({ value }) => {
        // Sum all SPL token balances with 6 decimals (CMT)
        const cmtAccounts = value.filter(
          (a) => a.account.data.parsed?.info?.tokenAmount?.decimals === 6,
        );
        const total = cmtAccounts.reduce(
          (s, a) => s + Number(a.account.data.parsed?.info?.tokenAmount?.uiAmount ?? 0),
          0,
        );
        setCmtBalance(total);
      }).catch(() => setCmtBalance(0));
    } else {
      setSolBalance(0);
      setCmtBalance(0);
      setStakedAmount(0);
    }
  }, [solanaWallet.publicKey, connection]);

  const address = solanaWallet.publicKey?.toBase58() || '';
  const connected = solanaWallet.connected;
  const connecting = solanaWallet.connecting;

  const state: WalletState = {
    connected,
    connecting,
    address,
    balance: solBalance,
    cmtBalance,
    tier: getTier(stakedAmount),
    stakedAmount,
    walletType: solanaWallet.wallet?.adapter.name || null,
    bookmarkedStartups,
  };

  const connect = useCallback(async (_walletType: string) => {
    // Solana wallet-adapter handles connection via its own modal
    await solanaWallet.connect();
  }, [solanaWallet]);

  const disconnect = useCallback(() => {
    solanaWallet.disconnect();
    setBookmarkedStartups([]);
  }, [solanaWallet]);

  const toggleBookmark = useCallback((startupId: string) => {
    setBookmarkedStartups((prev) =>
      prev.includes(startupId)
        ? prev.filter((id) => id !== startupId)
        : [...prev, startupId],
    );
  }, []);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, toggleBookmark }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be inside WalletProvider');
  return ctx;
}
