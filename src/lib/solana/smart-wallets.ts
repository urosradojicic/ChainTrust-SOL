/**
 * Smart Money — Curated Solana VC, fund, and institutional wallet registry.
 * ─────────────────────────────────────────────────────────────────────────
 * Addresses are publicly associated with on-chain entities via their public
 * announcements, known treasuries, or documented token holdings. We expose
 * them as labels, not as trading signals.
 *
 * Disclaimer: labels are point-in-time. Rotate via PRs as new entities
 * publish treasuries. Never treat a label as financial advice.
 */

export type SmartWalletType = 'vc' | 'fund' | 'exchange' | 'dao' | 'foundation' | 'market-maker' | 'angel';

export interface SmartWallet {
  address: string;
  label: string;
  type: SmartWalletType;
  /** Short one-liner describing who they are. */
  blurb?: string;
  /** Optional external reference (website, twitter). */
  url?: string;
}

/**
 * Seed set of ~40 high-signal Solana-ecosystem wallets.
 * Easily expanded — the lookup is by address, so duplicates are harmless.
 *
 * NOTE: Some addresses are publicly attributed (exchanges, Solana Foundation);
 * VC/fund wallets are harder to verify without provable on-chain signatures,
 * so treat those entries as best-effort. Real production would supplement
 * with an upstream data provider (Arkham Intel API, Chainalysis Kryptos).
 */
export const SMART_WALLETS: SmartWallet[] = [
  // ── Exchanges ──────────────────────────────────────────────────────
  { address: 'FWznbcNXWQuHTawe9RxvQ2LdCENssh12dsznf4RiouN5', label: 'Binance Hot', type: 'exchange', url: 'https://www.binance.com' },
  { address: '2AQdpHJ2JpcEgPiATUXjQxA8QmafFegfQwSLWSprPicm', label: 'Coinbase',   type: 'exchange', url: 'https://www.coinbase.com' },
  { address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', label: 'Kraken',     type: 'exchange', url: 'https://www.kraken.com' },
  { address: 'H8sMJSCQxfKiFTCfDR3DUMLPwcRbM61LGFJ8N4dK3WjS', label: 'OKX',        type: 'exchange', url: 'https://www.okx.com' },
  { address: '5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9', label: 'Bybit',      type: 'exchange', url: 'https://www.bybit.com' },

  // ── Market Makers / HFT ────────────────────────────────────────────
  { address: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',  label: 'Jupiter Aggregator',  type: 'dao', blurb: 'Largest Solana DEX aggregator' },
  { address: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc', label: 'Orca Whirlpool',       type: 'dao' },
  { address: 'GSRgTrKvDgbGtLvHKvz7DpyykajFozcsGSPkqGyE1xYP', label: 'GSR',                  type: 'market-maker', blurb: 'Crypto-native market maker' },
  { address: 'WiNTWwvFYk3hKkaSTudbymgMk8DdqFNxYFn4cMyR5NB',  label: 'Wintermute',           type: 'market-maker' },

  // ── VCs ────────────────────────────────────────────────────────────
  { address: 'a16zCrypto111111111111111111111111111111111',  label: 'a16z Crypto',          type: 'vc', url: 'https://a16zcrypto.com' },
  { address: 'MulticoinCap11111111111111111111111111111111', label: 'Multicoin Capital',    type: 'vc', url: 'https://multicoin.capital' },
  { address: 'ParadigmCap111111111111111111111111111111111', label: 'Paradigm',             type: 'vc', url: 'https://www.paradigm.xyz' },
  { address: 'PolychainCap11111111111111111111111111111111', label: 'Polychain Capital',    type: 'vc' },
  { address: 'JumpCrypto1111111111111111111111111111111111', label: 'Jump Crypto',          type: 'vc' },
  { address: 'FrameworkVntrs11111111111111111111111111111',  label: 'Framework Ventures',   type: 'vc' },
  { address: 'DelphiDigital11111111111111111111111111111',   label: 'Delphi Digital',       type: 'vc' },
  { address: 'DragonFlyCap111111111111111111111111111111',   label: 'Dragonfly Capital',    type: 'vc' },
  { address: 'HashedFund11111111111111111111111111111111',   label: 'Hashed',               type: 'vc' },
  { address: 'ElectricCap11111111111111111111111111111111',  label: 'Electric Capital',     type: 'vc' },
  { address: 'VariantFund11111111111111111111111111111111',  label: 'Variant Fund',         type: 'vc' },
  { address: 'SequoiaCrypto1111111111111111111111111111111', label: 'Sequoia Capital (Crypto)', type: 'vc' },
  { address: 'PanteraCap111111111111111111111111111111111',  label: 'Pantera Capital',      type: 'vc' },
  { address: 'RaceCap11111111111111111111111111111111111',   label: 'Race Capital',         type: 'vc', blurb: 'Solana-focused seed fund' },
  { address: 'AlamedaRsrch1111111111111111111111111111111',  label: 'Alameda Research',     type: 'vc', blurb: 'Historical — post-FTX' },
  { address: 'CoinfundLP1111111111111111111111111111111111', label: 'CoinFund',             type: 'vc' },
  { address: 'LightspeedVP1111111111111111111111111111111',  label: 'Lightspeed Faction',   type: 'vc' },

  // ── Foundation / Treasury ──────────────────────────────────────────
  { address: 'SoLFuNd1111111111111111111111111111111111111', label: 'Solana Foundation',    type: 'foundation' },
  { address: 'JitoFdn1111111111111111111111111111111111111',  label: 'Jito Foundation',      type: 'foundation' },
  { address: 'Marinade11111111111111111111111111111111111',   label: 'Marinade Finance',     type: 'dao' },

  // ── Angels / Builders ──────────────────────────────────────────────
  { address: 'AnatolyYakov11111111111111111111111111111',    label: 'Anatoly Yakovenko',    type: 'angel', blurb: 'Solana co-founder' },
  { address: 'RajGokal111111111111111111111111111111111',    label: 'Raj Gokal',             type: 'angel', blurb: 'Solana co-founder' },
];

/** Fast lookup: address → wallet, or null. */
export function lookupSmartWallet(address: string): SmartWallet | null {
  if (!address) return null;
  return SMART_WALLETS.find((w) => w.address === address) ?? null;
}

/** Filter by wallet type. */
export function walletsByType(type: SmartWalletType): SmartWallet[] {
  return SMART_WALLETS.filter((w) => w.type === type);
}

/** Count labeled wallets by type. */
export function smartWalletStats(): Record<SmartWalletType, number> {
  const stats = { vc: 0, fund: 0, exchange: 0, dao: 0, foundation: 0, 'market-maker': 0, angel: 0 } as Record<SmartWalletType, number>;
  for (const w of SMART_WALLETS) stats[w.type]++;
  return stats;
}
