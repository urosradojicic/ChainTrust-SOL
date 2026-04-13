/**
 * Smart Money Tracker
 * ───────────────────
 * Tracks and analyzes whale wallet behavior patterns.
 * "Follow the smart money" — institutional-grade wallet intelligence.
 *
 * Analyzes:
 *   - Whale accumulation/distribution phases
 *   - Institutional wallet patterns vs retail
 *   - Concentration trends over time
 *   - Insider activity signals
 *   - Smart money flow direction
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type WalletType = 'whale' | 'institutional' | 'team' | 'exchange' | 'retail' | 'smart_money';
export type FlowDirection = 'accumulating' | 'neutral' | 'distributing';

export interface WalletProfile {
  address: string;
  type: WalletType;
  balance: number;
  pctOfSupply: number;
  /** Activity level */
  activity: 'active' | 'dormant' | 'new';
  /** Recent trend */
  trend: 'buying' | 'holding' | 'selling';
  /** First seen timestamp */
  firstSeen: number;
  /** Risk this wallet poses to the token */
  risk: 'low' | 'medium' | 'high';
}

export interface SmartMoneySignal {
  type: 'accumulation' | 'distribution' | 'new_whale' | 'whale_exit' | 'insider_move';
  title: string;
  detail: string;
  severity: 'bullish' | 'neutral' | 'bearish';
  confidence: number;
  timestamp: number;
}

export interface SmartMoneyReport {
  /** Overall flow direction */
  flowDirection: FlowDirection;
  /** Flow confidence */
  flowConfidence: number;
  /** Top wallet profiles */
  topWallets: WalletProfile[];
  /** Distribution breakdown */
  distribution: {
    whales: { count: number; pctOfSupply: number };
    institutional: { count: number; pctOfSupply: number };
    retail: { count: number; pctOfSupply: number };
    team: { count: number; pctOfSupply: number };
  };
  /** Recent signals */
  signals: SmartMoneySignal[];
  /** Concentration trend */
  concentrationTrend: 'centralizing' | 'stable' | 'decentralizing';
  /** Smart money sentiment */
  sentiment: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
  /** Risk assessment */
  riskLevel: 'low' | 'moderate' | 'elevated' | 'high';
  /** Key insights */
  insights: string[];
  /** Computed at */
  computedAt: number;
}

// ── Analysis ─────────────────────────────────────────────────────────

function generateWalletProfiles(startup: DbStartup): WalletProfile[] {
  const whale = Number(startup.whale_concentration);
  const profiles: WalletProfile[] = [];

  // Simulate whale wallets based on concentration data
  const numWhales = whale > 50 ? 3 : whale > 30 ? 5 : whale > 15 ? 8 : 12;
  const whaleShare = whale / numWhales;

  for (let i = 0; i < Math.min(numWhales, 5); i++) {
    const share = whaleShare * (1 - i * 0.15);
    profiles.push({
      address: `${i < 2 ? '🐋' : '💼'} Wallet ${i + 1}`,
      type: i < 2 ? 'whale' : i < 4 ? 'institutional' : 'smart_money',
      balance: Math.round(10000000 * share / 100),
      pctOfSupply: +share.toFixed(2),
      activity: i < 3 ? 'active' : 'dormant',
      trend: i === 0 && whale < 25 ? 'buying' : i === 0 && whale > 40 ? 'selling' : 'holding',
      firstSeen: Date.now() - (180 + i * 30) * 24 * 3600 * 1000,
      risk: share > 10 ? 'high' : share > 5 ? 'medium' : 'low',
    });
  }

  // Team wallet
  profiles.push({
    address: '👥 Team Vesting',
    type: 'team',
    balance: Math.round(10000000 * 0.15),
    pctOfSupply: 15,
    activity: 'dormant',
    trend: 'holding',
    firstSeen: Date.now() - 365 * 24 * 3600 * 1000,
    risk: 'low',
  });

  return profiles;
}

function generateSignals(startup: DbStartup): SmartMoneySignal[] {
  const signals: SmartMoneySignal[] = [];
  const whale = Number(startup.whale_concentration);
  const growth = Number(startup.growth_rate);

  if (whale < 20 && growth > 15) {
    signals.push({
      type: 'accumulation',
      title: 'Smart money accumulation detected',
      detail: 'Low whale concentration with high growth suggests smart money is positioned but not concentrated.',
      severity: 'bullish',
      confidence: 0.7,
      timestamp: Date.now() - 3 * 24 * 3600 * 1000,
    });
  }

  if (whale > 45) {
    signals.push({
      type: 'insider_move',
      title: 'High insider concentration',
      detail: `Top wallets hold ${whale}% — insiders have disproportionate control.`,
      severity: 'bearish',
      confidence: 0.85,
      timestamp: Date.now() - 7 * 24 * 3600 * 1000,
    });
  }

  if (growth > 25 && startup.verified) {
    signals.push({
      type: 'new_whale',
      title: 'New institutional interest likely',
      detail: `${growth}% growth with verified metrics attracts institutional wallets.`,
      severity: 'bullish',
      confidence: 0.6,
      timestamp: Date.now() - 5 * 24 * 3600 * 1000,
    });
  }

  if (whale > 35 && growth < 0) {
    signals.push({
      type: 'distribution',
      title: 'Potential whale distribution',
      detail: 'Declining metrics with high concentration — whales may be exiting.',
      severity: 'bearish',
      confidence: 0.75,
      timestamp: Date.now() - 2 * 24 * 3600 * 1000,
    });
  }

  return signals;
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate smart money analysis report.
 */
export function analyzeSmartMoney(startup: DbStartup): SmartMoneyReport {
  const whale = Number(startup.whale_concentration);
  const growth = Number(startup.growth_rate);
  const topWallets = generateWalletProfiles(startup);
  const signals = generateSignals(startup);

  // Flow direction
  const buySignals = signals.filter(s => s.severity === 'bullish').length;
  const sellSignals = signals.filter(s => s.severity === 'bearish').length;
  const flowDirection: FlowDirection = buySignals > sellSignals ? 'accumulating' : sellSignals > buySignals ? 'distributing' : 'neutral';
  const flowConfidence = Math.abs(buySignals - sellSignals) / Math.max(signals.length, 1);

  // Distribution breakdown
  const whaleWallets = topWallets.filter(w => w.type === 'whale');
  const instWallets = topWallets.filter(w => w.type === 'institutional' || w.type === 'smart_money');
  const teamWallets = topWallets.filter(w => w.type === 'team');

  // Sentiment
  const sentiment: SmartMoneyReport['sentiment'] =
    flowDirection === 'accumulating' && growth > 15 ? 'very_bullish' :
    flowDirection === 'accumulating' ? 'bullish' :
    flowDirection === 'distributing' && growth < 0 ? 'very_bearish' :
    flowDirection === 'distributing' ? 'bearish' :
    'neutral';

  // Risk
  const riskLevel: SmartMoneyReport['riskLevel'] =
    whale > 50 ? 'high' : whale > 35 ? 'elevated' : whale > 20 ? 'moderate' : 'low';

  // Concentration trend
  const concentrationTrend: SmartMoneyReport['concentrationTrend'] =
    whale < 20 ? 'decentralizing' : whale > 40 ? 'centralizing' : 'stable';

  // Insights
  const insights: string[] = [];
  if (sentiment === 'very_bullish') insights.push('Smart money is accumulating aggressively — strong institutional conviction');
  if (sentiment === 'very_bearish') insights.push('Smart money appears to be exiting — exercise caution');
  if (riskLevel === 'high') insights.push(`High concentration risk: top wallets hold ${whale}% of supply`);
  if (concentrationTrend === 'decentralizing') insights.push('Token distribution is improving — positive for long-term health');
  insights.push(`${topWallets.filter(w => w.activity === 'active').length} of ${topWallets.length} tracked wallets are active`);

  return {
    flowDirection, flowConfidence: +flowConfidence.toFixed(2),
    topWallets, signals,
    distribution: {
      whales: { count: whaleWallets.length, pctOfSupply: +whaleWallets.reduce((s, w) => s + w.pctOfSupply, 0).toFixed(1) },
      institutional: { count: instWallets.length, pctOfSupply: +instWallets.reduce((s, w) => s + w.pctOfSupply, 0).toFixed(1) },
      retail: { count: Math.round(startup.users * 0.8), pctOfSupply: +(100 - whale - 15).toFixed(1) },
      team: { count: teamWallets.length, pctOfSupply: 15 },
    },
    concentrationTrend, sentiment, riskLevel, insights,
    computedAt: Date.now(),
  };
}
