import { useConnection } from '@solana/wallet-adapter-react';
import { useState, useCallback } from 'react';
import { PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';

export interface PaymentVolume {
  totalTransfers: number;
  inboundVolumeSol: number;
  outboundVolumeSol: number;
  netFlowSol: number;
  inboundVolumeUsdc: number;
  outboundVolumeUsdc: number;
  netFlowUsdc: number;
  uniqueCounterparties: number;
  periodDays: number;
  transactions: {
    signature: string;
    type: 'inbound' | 'outbound';
    amount: number;
    token: string;
    counterparty: string;
    timestamp: number;
  }[];
  verifiedAt: number;
}

// Known USDC mint addresses
const USDC_MINTS = [
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC mainnet
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // USDC devnet
];

export function useVerifyPaymentVolume() {
  const { connection } = useConnection();
  const [data, setData] = useState<PaymentVolume | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const verify = useCallback(async (walletAddress: string, days: number = 30): Promise<PaymentVolume | null> => {
    setIsLoading(true);
    setProgress(0);
    try {
      const pubkey = new PublicKey(walletAddress);
      const cutoff = Math.floor(Date.now() / 1000) - days * 86400;

      // Get recent signatures
      setProgress(10);
      const signatures = await connection.getSignaturesForAddress(pubkey, { limit: 200 });
      const recentSigs = signatures.filter(s => (s.blockTime ?? 0) >= cutoff);

      if (recentSigs.length === 0) {
        const empty: PaymentVolume = {
          totalTransfers: 0, inboundVolumeSol: 0, outboundVolumeSol: 0, netFlowSol: 0,
          inboundVolumeUsdc: 0, outboundVolumeUsdc: 0, netFlowUsdc: 0,
          uniqueCounterparties: 0, periodDays: days, transactions: [], verifiedAt: Date.now(),
        };
        setData(empty);
        return empty;
      }

      // Fetch parsed transactions in batches
      setProgress(30);
      const BATCH_SIZE = 10;
      const allTxs: (ParsedTransactionWithMeta | null)[] = [];
      for (let i = 0; i < recentSigs.length; i += BATCH_SIZE) {
        const batch = recentSigs.slice(i, i + BATCH_SIZE);
        const txs = await Promise.all(
          batch.map(s => connection.getParsedTransaction(s.signature, { maxSupportedTransactionVersion: 0 })),
        );
        allTxs.push(...txs);
        setProgress(30 + Math.round((i / recentSigs.length) * 50));
      }

      // Parse transfers
      setProgress(85);
      let inSol = 0, outSol = 0, inUsdc = 0, outUsdc = 0;
      const counterparties = new Set<string>();
      const transactions: PaymentVolume['transactions'] = [];
      const walletStr = pubkey.toBase58();

      for (const tx of allTxs) {
        if (!tx?.meta) continue;

        // Native SOL transfers
        if (tx.meta.preBalances && tx.meta.postBalances && tx.transaction.message.accountKeys) {
          const keys = tx.transaction.message.accountKeys;
          for (let i = 0; i < keys.length; i++) {
            const addr = typeof keys[i] === 'string' ? keys[i] : (keys[i] as any).pubkey?.toBase58();
            if (addr === walletStr) {
              const diff = ((tx.meta.postBalances[i] ?? 0) - (tx.meta.preBalances[i] ?? 0)) / 1e9;
              if (Math.abs(diff) > 0.001) {
                if (diff > 0) inSol += diff;
                else outSol += Math.abs(diff);
              }
            }
          }
        }

        // SPL token transfers (USDC etc.)
        for (const inner of tx.meta.innerInstructions ?? []) {
          for (const ix of inner.instructions) {
            if ('parsed' in ix && ix.parsed?.type === 'transfer') {
              const info = ix.parsed.info;
              const amount = Number(info.amount) / 1e6; // Assuming 6 decimals (USDC)
              if (amount > 0) {
                const isInbound = info.destination === walletStr || info.authority !== walletStr;
                if (isInbound) inUsdc += amount;
                else outUsdc += amount;
                if (info.authority && info.authority !== walletStr) counterparties.add(info.authority);
              }
            }
          }
        }

        // Record transaction
        const blockTime = tx.blockTime ?? 0;
        const sig = tx.transaction.signatures[0];
        if (sig) {
          transactions.push({
            signature: sig,
            type: inSol > 0 || inUsdc > 0 ? 'inbound' : 'outbound',
            amount: Math.max(inSol, inUsdc, outSol, outUsdc),
            token: inUsdc > 0 || outUsdc > 0 ? 'USDC' : 'SOL',
            counterparty: counterparties.size > 0 ? [...counterparties][0] : 'unknown',
            timestamp: blockTime * 1000,
          });
        }
      }

      setProgress(100);
      const result: PaymentVolume = {
        totalTransfers: recentSigs.length,
        inboundVolumeSol: Math.round(inSol * 1000) / 1000,
        outboundVolumeSol: Math.round(outSol * 1000) / 1000,
        netFlowSol: Math.round((inSol - outSol) * 1000) / 1000,
        inboundVolumeUsdc: Math.round(inUsdc * 100) / 100,
        outboundVolumeUsdc: Math.round(outUsdc * 100) / 100,
        netFlowUsdc: Math.round((inUsdc - outUsdc) * 100) / 100,
        uniqueCounterparties: counterparties.size,
        periodDays: days,
        transactions: transactions.slice(0, 20),
        verifiedAt: Date.now(),
      };

      setData(result);
      return result;
    } catch (e) {
      if (import.meta.env.DEV) console.warn('[payment] verify:', e);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [connection]);

  return { verify, data, isLoading, progress };
}
