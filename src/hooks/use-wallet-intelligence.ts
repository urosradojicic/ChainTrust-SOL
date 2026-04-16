/**
 * Wallet intelligence — tag known wallets, detect wash trading,
 * and compute real (filtered) transaction volume.
 * Inspired by Nansen/Arkham wallet tagging approach.
 */
import { useConnection } from '@solana/wallet-adapter-react';
import { useState, useCallback } from 'react';
import { PublicKey } from '@solana/web3.js';

// Known wallet tags (in production, this would be a backend database)
const KNOWN_WALLETS: Record<string, { label: string; type: WalletType }> = {
  // Exchanges
  'FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5': { label: 'Binance Hot Wallet', type: 'exchange' },
  '2AQdpHJ2JpcEgPiATUXjQxA8QmafFegfQwSLWSprPicm': { label: 'Coinbase', type: 'exchange' },
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': { label: 'Kraken', type: 'exchange' },
  // DeFi Protocols
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': { label: 'Jupiter Aggregator', type: 'defi' },
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': { label: 'Orca Whirlpool', type: 'defi' },
  // VCs / Funds
  'a16zCrypto111111111111111111111111111111111': { label: 'a16z Crypto', type: 'vc' },
  'MulticoinCap11111111111111111111111111111111': { label: 'Multicoin Capital', type: 'vc' },
  // Solana Foundation
  'SoLFuNd1111111111111111111111111111111111111': { label: 'Solana Foundation', type: 'foundation' },
};

type WalletType = 'exchange' | 'defi' | 'vc' | 'foundation' | 'whale' | 'retail' | 'contract' | 'unknown';

export interface WalletTag {
  address: string;
  label: string;
  type: WalletType;
  confidence: number; // 0-1
}

export interface WalletIntelligence {
  address: string;
  tag: WalletTag;
  balanceSol: number;
  transactionCount: number;
  firstSeen: string | null;
  lastActive: string | null;
  interactsWith: WalletTag[]; // top counterparties
  suspiciousPatterns: string[];
}

export interface VolumeFilter {
  totalVolume: number;
  realVolume: number; // excludes wash trading
  washTradingPct: number;
  selfTransfers: number;
  circularTransfers: number;
  uniqueSenders: number;
  uniqueReceivers: number;
}

/**
 * Tag a wallet address — checks known wallets database,
 * then falls back to heuristic classification.
 */
export function tagWallet(address: string): WalletTag {
  // Check known wallets
  const known = KNOWN_WALLETS[address];
  if (known) {
    return { address, label: known.label, type: known.type, confidence: 1.0 };
  }

  // Heuristic: addresses starting with certain patterns
  // In production, this would call a backend API
  return { address, label: `${address.slice(0, 4)}...${address.slice(-4)}`, type: 'unknown', confidence: 0.5 };
}

/**
 * Hook: Analyze a wallet's on-chain behavior and tag it.
 */
export function useWalletIntelligence() {
  const { connection } = useConnection();
  const [data, setData] = useState<WalletIntelligence | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const analyze = useCallback(async (walletAddress: string): Promise<WalletIntelligence | null> => {
    setIsLoading(true);
    try {
      const pubkey = new PublicKey(walletAddress);
      const tag = tagWallet(walletAddress);

      // Get balance
      const balanceLamports = await connection.getBalance(pubkey);
      const balanceSol = balanceLamports / 1e9;

      // Get recent signatures
      const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 100 });
      const counterparties = new Map<string, number>();
      const suspiciousPatterns: string[] = [];

      // Analyze transaction patterns
      const txCount = signatures.length;
      const firstSeen = txCount > 0 ? new Date((signatures[txCount - 1].blockTime ?? 0) * 1000).toISOString() : null;
      const lastActive = txCount > 0 ? new Date((signatures[0].blockTime ?? 0) * 1000).toISOString() : null;

      // Parse recent transactions to extract counterparties
      const recentBatch = signatures.slice(0, 20);
      for (const sig of recentBatch) {
        try {
          const tx = await connection.getParsedTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });
          if (!tx?.transaction?.message?.accountKeys) continue;
          for (const key of tx.transaction.message.accountKeys) {
            const addr = typeof key === 'string' ? key : (key as any).pubkey?.toBase58?.();
            if (addr && addr !== walletAddress) {
              counterparties.set(addr, (counterparties.get(addr) ?? 0) + 1);
            }
          }
        } catch { /* skip unparseable txs */ }
      }

      // Check for suspicious patterns
      if (txCount > 50) {
        // Rapid burst detection: times are descending (newest first)
        const recentTimes = signatures.slice(0, 20).map(s => s.blockTime ?? 0);
        const timeDiffs = recentTimes.slice(1).map((t, i) => Math.abs(recentTimes[i] - t));
        const avgTimeBetween = timeDiffs.length > 0
          ? timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length
          : Infinity;

        if (avgTimeBetween < 5) {
          suspiciousPatterns.push('Rapid-fire transactions detected (<5s between txs)');
        }
      }

      // Classify wallet type based on behavior — create a new tag object to avoid mutating shared KNOWN_WALLETS
      const classifiedTag = { ...tag };
      if (classifiedTag.type === 'unknown') {
        if (balanceSol > 10000) classifiedTag.type = 'whale';
        else if (txCount > 500) classifiedTag.type = 'contract';
        else if (txCount > 50) classifiedTag.type = 'retail';
      }

      // Get top counterparties
      const topCounterparties = [...counterparties.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([addr]) => tagWallet(addr));

      const result: WalletIntelligence = {
        address: walletAddress,
        tag: classifiedTag,
        balanceSol,
        transactionCount: txCount,
        firstSeen,
        lastActive,
        interactsWith: topCounterparties,
        suspiciousPatterns,
      };

      setData(result);
      return result;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  return { analyze, data, isLoading };
}

/**
 * Hook: Filter volume to detect and exclude wash trading.
 * Wash trading = transfers between wallets controlled by the same entity.
 */
export function useVolumeFilter() {
  const { connection } = useConnection();
  const [data, setData] = useState<VolumeFilter | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filter = useCallback(async (walletAddress: string, days: number = 30): Promise<VolumeFilter | null> => {
    setIsLoading(true);
    try {
      const pubkey = new PublicKey(walletAddress);
      const cutoff = Math.floor(Date.now() / 1000) - days * 86400;
      const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 200 });
      const recentSigs = signatures.filter(s => (s.blockTime ?? 0) >= cutoff);

      const senders = new Set<string>();
      const receivers = new Set<string>();
      let totalVolume = 0;
      let selfTransfers = 0;
      let circularTransfers = 0;
      const walletStr = walletAddress;

      // Parse transactions for volume analysis
      for (const sig of recentSigs.slice(0, 50)) {
        const tx = await connection.getParsedTransaction(sig.signature, { maxSupportedTransactionVersion: 0 });
        if (!tx?.meta) continue;

        const keys = tx.transaction.message.accountKeys;
        for (let i = 0; i < keys.length; i++) {
          const addr = typeof keys[i] === 'string' ? keys[i] : (keys[i] as any).pubkey?.toBase58();
          if (!addr) continue;

          const diff = ((tx.meta.postBalances[i] ?? 0) - (tx.meta.preBalances[i] ?? 0)) / 1e9;
          if (Math.abs(diff) > 0.001) {
            totalVolume += Math.abs(diff);
            if (diff > 0) receivers.add(addr);
            else senders.add(addr);

            // Self-transfer detection
            if (addr === walletStr && diff > 0) {
              // Check if same wallet also sent (circular)
              const otherSide = keys.find((k, j) => {
                const otherAddr = typeof k === 'string' ? k : (k as any).pubkey?.toBase58();
                return j !== i && otherAddr === walletStr;
              });
              if (otherSide) selfTransfers++;
            }
          }
        }
      }

      // Wash trading heuristic: if same addresses appear as both sender and receiver frequently
      const overlap = [...senders].filter(s => receivers.has(s));
      circularTransfers = overlap.length;
      const washTradingPct = totalVolume > 0 ? Math.min(100, (selfTransfers + circularTransfers) / recentSigs.length * 100) : 0;
      const realVolume = totalVolume * (1 - washTradingPct / 100);

      const result: VolumeFilter = {
        totalVolume: Math.round(totalVolume * 1000) / 1000,
        realVolume: Math.round(realVolume * 1000) / 1000,
        washTradingPct: Math.round(washTradingPct * 10) / 10,
        selfTransfers,
        circularTransfers,
        uniqueSenders: senders.size,
        uniqueReceivers: receivers.size,
      };

      setData(result);
      return result;
    } catch {
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  return { filter, data, isLoading };
}
