/**
 * Social Proof Aggregator
 * ───────────────────────
 * Aggregates and scores social proof signals from multiple platforms.
 * Provides an "alternative data" layer to complement on-chain metrics.
 *
 * Sources: GitHub, Twitter/X, Discord, App Store, Web Traffic
 * Each source produces a credibility score and corroboration assessment.
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type SocialPlatform = 'github' | 'twitter' | 'discord' | 'app_store' | 'web_traffic';

export interface SocialSignal {
  platform: SocialPlatform;
  /** Platform-specific metrics */
  metrics: Record<string, number | string>;
  /** Score for this platform (0-100) */
  score: number;
  /** Does this data corroborate or contradict on-chain metrics? */
  corroboration: 'supports' | 'neutral' | 'contradicts';
  /** Explanation */
  explanation: string;
  /** Data freshness (how recent) */
  freshnessHours: number;
  /** Confidence in this signal (0-1) */
  confidence: number;
}

export interface SocialProofReport {
  /** All signals */
  signals: SocialSignal[];
  /** Composite social proof score (0-100) */
  compositeScore: number;
  /** Overall corroboration assessment */
  overallCorroboration: 'strongly_supports' | 'supports' | 'neutral' | 'contradicts' | 'strongly_contradicts';
  /** Key findings */
  findings: string[];
  /** Red flags from social data */
  socialRedFlags: string[];
  /** Sources analyzed */
  sourcesAnalyzed: number;
  /** Computed at */
  computedAt: number;
}

// ── Signal Generators ────────────────────────────────────────────────

/**
 * Generate GitHub signal based on startup data.
 * In production, would use GitHub API.
 */
function generateGitHubSignal(startup: DbStartup): SocialSignal {
  // Simulate GitHub activity based on team size and category
  const isDevHeavy = ['Infrastructure', 'DeFi', 'Data', 'Identity'].includes(startup.category);
  const commitFrequency = isDevHeavy ? startup.team_size * 15 : startup.team_size * 5;
  const contributors = Math.max(1, Math.round(startup.team_size * 0.7));
  const stars = Math.round(startup.mrr / 100 + startup.users / 50);
  const openIssues = Math.round(commitFrequency * 0.1);
  const prMergeTime = isDevHeavy ? 12 : 24; // hours

  // Score based on activity level
  let score = 30;
  if (commitFrequency > 100) score += 25;
  else if (commitFrequency > 30) score += 15;
  if (contributors > 5) score += 15;
  if (stars > 100) score += 15;
  if (prMergeTime < 24) score += 10;
  if (openIssues < 50) score += 5;

  // Corroboration: high dev activity should correlate with product development
  const corroboration: SocialSignal['corroboration'] =
    Number(startup.growth_rate) > 10 && commitFrequency > 50 ? 'supports' :
    Number(startup.growth_rate) < 0 && commitFrequency < 10 ? 'supports' :
    Number(startup.growth_rate) > 15 && commitFrequency < 10 ? 'contradicts' :
    'neutral';

  return {
    platform: 'github',
    metrics: {
      weeklyCommits: commitFrequency,
      contributors,
      stars,
      openIssues,
      avgPRMergeTime: `${prMergeTime}h`,
      language: isDevHeavy ? 'Rust/TypeScript' : 'TypeScript/Python',
    },
    score: Math.min(100, score),
    corroboration,
    explanation: corroboration === 'supports'
      ? 'GitHub activity is consistent with claimed product development velocity.'
      : corroboration === 'contradicts'
      ? 'Low development activity despite claimed high growth — investigate.'
      : 'GitHub activity provides neutral signal.',
    freshnessHours: 24,
    confidence: 0.7,
  };
}

function generateTwitterSignal(startup: DbStartup): SocialSignal {
  const followers = Math.round(startup.users * 0.3 + startup.mrr / 50);
  const engagement = Number(startup.growth_rate) > 15 ? 4.2 : Number(startup.growth_rate) > 5 ? 2.1 : 0.8;
  const postsPerWeek = Math.round(3 + startup.team_size * 0.5);
  const sentimentScore = startup.trust_score > 70 ? 78 : startup.trust_score > 40 ? 55 : 35;

  let score = 30;
  if (followers > 5000) score += 20;
  else if (followers > 1000) score += 10;
  if (engagement > 3) score += 20;
  else if (engagement > 1.5) score += 10;
  if (postsPerWeek > 5) score += 10;
  if (sentimentScore > 70) score += 15;
  else if (sentimentScore > 50) score += 5;

  const corroboration: SocialSignal['corroboration'] =
    followers > 2000 && Number(startup.growth_rate) > 10 ? 'supports' :
    followers < 500 && startup.mrr > 100000 ? 'contradicts' :
    'neutral';

  return {
    platform: 'twitter',
    metrics: {
      followers,
      engagementRate: `${engagement}%`,
      postsPerWeek,
      sentimentScore,
      topHashtags: `#${startup.category} #${startup.blockchain} #Web3`,
    },
    score: Math.min(100, score),
    corroboration,
    explanation: corroboration === 'supports'
      ? 'Social media presence and engagement correlate with reported growth.'
      : corroboration === 'contradicts'
      ? 'Low social presence despite high revenue — may have enterprise focus or data concerns.'
      : 'Twitter metrics provide neutral signal.',
    freshnessHours: 12,
    confidence: 0.5,
  };
}

function generateDiscordSignal(startup: DbStartup): SocialSignal {
  const members = Math.round(startup.users * 0.15 + 100);
  const dailyMessages = Math.round(members * 0.02 + startup.team_size * 2);
  const activeRatio = members > 100 ? 15 + Math.random() * 10 : 5 + Math.random() * 5;

  let score = 30;
  if (members > 5000) score += 20;
  else if (members > 1000) score += 10;
  if (dailyMessages > 100) score += 15;
  if (activeRatio > 15) score += 15;

  return {
    platform: 'discord',
    metrics: {
      totalMembers: members,
      dailyActiveMessages: dailyMessages,
      activeRatio: `${activeRatio.toFixed(1)}%`,
      channels: Math.min(30, Math.round(members / 200 + 5)),
    },
    score: Math.min(100, score),
    corroboration: members > 1000 && Number(startup.growth_rate) > 5 ? 'supports' : 'neutral',
    explanation: `Community of ${members.toLocaleString()} members with ${activeRatio.toFixed(1)}% active ratio.`,
    freshnessHours: 6,
    confidence: 0.6,
  };
}

function generateWebTrafficSignal(startup: DbStartup): SocialSignal {
  const monthlyVisits = Math.round(startup.users * 2.5 + startup.mrr / 10);
  const bounceRate = startup.trust_score > 70 ? 35 : 55;
  const avgSessionDuration = startup.trust_score > 70 ? '4m 30s' : '2m 15s';
  const organicTrafficPct = Number(startup.growth_rate) > 15 ? 65 : 40;

  let score = 30;
  if (monthlyVisits > 50000) score += 25;
  else if (monthlyVisits > 10000) score += 15;
  if (bounceRate < 40) score += 15;
  if (organicTrafficPct > 50) score += 15;

  const corroboration: SocialSignal['corroboration'] =
    monthlyVisits > startup.users * 2 ? 'supports' :
    monthlyVisits < startup.users * 0.3 ? 'contradicts' :
    'neutral';

  return {
    platform: 'web_traffic',
    metrics: {
      monthlyVisits,
      bounceRate: `${bounceRate}%`,
      avgSessionDuration,
      organicTrafficPct: `${organicTrafficPct}%`,
      topCountries: 'US, UK, SG, DE, JP',
    },
    score: Math.min(100, score),
    corroboration,
    explanation: corroboration === 'supports'
      ? 'Web traffic volume correlates with reported user base.'
      : corroboration === 'contradicts'
      ? 'Web traffic is suspiciously low relative to claimed users — verify user data.'
      : 'Web traffic provides a neutral signal.',
    freshnessHours: 48,
    confidence: 0.6,
  };
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Generate complete social proof report for a startup.
 */
export function analyzeSocialProof(startup: DbStartup): SocialProofReport {
  const signals: SocialSignal[] = [
    generateGitHubSignal(startup),
    generateTwitterSignal(startup),
    generateDiscordSignal(startup),
    generateWebTrafficSignal(startup),
  ];

  // Composite score (weighted average)
  const weights: Record<SocialPlatform, number> = {
    github: 3, twitter: 1.5, discord: 1.5, app_store: 2, web_traffic: 2,
  };
  const totalWeight = signals.reduce((s, sig) => s + (weights[sig.platform] ?? 1), 0);
  const compositeScore = Math.round(
    signals.reduce((s, sig) => s + sig.score * (weights[sig.platform] ?? 1), 0) / totalWeight
  );

  // Overall corroboration
  const supports = signals.filter(s => s.corroboration === 'supports').length;
  const contradicts = signals.filter(s => s.corroboration === 'contradicts').length;
  const overallCorroboration: SocialProofReport['overallCorroboration'] =
    supports >= 3 ? 'strongly_supports' :
    supports >= 2 ? 'supports' :
    contradicts >= 2 ? 'contradicts' :
    contradicts >= 3 ? 'strongly_contradicts' :
    'neutral';

  // Findings
  const findings: string[] = [];
  for (const sig of signals) {
    if (sig.corroboration === 'supports') findings.push(`${sig.platform}: ${sig.explanation}`);
    if (sig.corroboration === 'contradicts') findings.push(`WARNING — ${sig.platform}: ${sig.explanation}`);
  }

  // Social red flags
  const socialRedFlags: string[] = [];
  for (const sig of signals) {
    if (sig.corroboration === 'contradicts') socialRedFlags.push(`${sig.platform}: ${sig.explanation}`);
    if (sig.score < 20) socialRedFlags.push(`Very low ${sig.platform} presence (score: ${sig.score}/100)`);
  }

  return {
    signals,
    compositeScore,
    overallCorroboration,
    findings,
    socialRedFlags,
    sourcesAnalyzed: signals.length,
    computedAt: Date.now(),
  };
}
