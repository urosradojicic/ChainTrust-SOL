/**
 * Pyth Network price feed hook.
 * Reads real-time SOL/USD and other prices from Pyth's Hermes endpoint.
 * Zero cost — Hermes is a free public endpoint, no API key required.
 */
import { useState, useCallback, useEffect, useRef } from 'react';

// Pyth Hermes endpoint (public, no key required)
const HERMES_URL = 'https://hermes.pyth.network';

// Price feed IDs (from https://pyth.network/developers/price-feed-ids)
export const PYTH_FEEDS = {
  SOL_USD: '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  BTC_USD: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  ETH_USD: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  USDC_USD: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
} as const;

export interface PythPrice {
  price: number;
  confidence: number;
  expo: number;
  publishTime: Date;
  feedId: string;
}

export interface TreasuryValuation {
  solBalance: number;
  solPrice: number;
  solValueUsd: number;
  totalUsd: number;
  confidence: number;
  priceSource: 'Pyth Network';
  publishTime: Date;
  lastUpdated: number;
}

/**
 * Fetch a price from Pyth Hermes (free, no API key).
 */
async function fetchPythPrice(feedId: string): Promise<PythPrice | null> {
  try {
    const res = await fetch(
      `${HERMES_URL}/v2/updates/price/latest?ids[]=${feedId}&parsed=true`,
    );
    if (!res.ok) return null;

    const data = await res.json();
    const feed = data.parsed?.[0];
    if (!feed) return null;

    const priceData = feed.price;
    const price = Number(priceData.price) * Math.pow(10, priceData.expo);
    const confidence = Number(priceData.conf) * Math.pow(10, priceData.expo);

    return {
      price,
      confidence,
      expo: priceData.expo,
      publishTime: new Date(priceData.publish_time * 1000),
      feedId,
    };
  } catch {
    return null;
  }
}

/**
 * Hook: get live SOL/USD price from Pyth Network.
 * Auto-refreshes every 30 seconds.
 */
export function useSolPrice(refreshIntervalMs = 30_000) {
  const [price, setPrice] = useState<PythPrice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const p = await fetchPythPrice(PYTH_FEEDS.SOL_USD);
    if (p) setPrice(p);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    intervalRef.current = setInterval(refresh, refreshIntervalMs);
    return () => clearInterval(intervalRef.current);
  }, [refresh, refreshIntervalMs]);

  return { price, isLoading, refresh };
}

/**
 * Hook: compute live treasury USD valuation using Pyth.
 */
export function useTreasuryValuation(solBalance: number | null) {
  const { price: solPrice, isLoading } = useSolPrice();
  const [valuation, setValuation] = useState<TreasuryValuation | null>(null);

  useEffect(() => {
    if (solPrice && solBalance !== null) {
      const solValueUsd = solBalance * solPrice.price;
      setValuation({
        solBalance,
        solPrice: solPrice.price,
        solValueUsd,
        totalUsd: solValueUsd,
        confidence: solPrice.confidence,
        priceSource: 'Pyth Network',
        publishTime: solPrice.publishTime,
        lastUpdated: Date.now(),
      });
    }
  }, [solPrice, solBalance]);

  return { valuation, isLoading };
}
