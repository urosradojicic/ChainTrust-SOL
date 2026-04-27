/**
 * Investor Engagement Engine
 * ──────────────────────────
 * Retention hooks that keep investors coming back daily.
 * Tracks engagement, generates personalized content, and
 * creates "aha moments" that drive habit formation.
 *
 * Psychology-backed engagement loops:
 *   1. Daily Briefing   — personalized morning summary
 *   2. Alert Triggers   — real-time notifications on portfolio changes
 *   3. Discovery Feed   — new opportunities matched to thesis
 *   4. Progress Tracking — portfolio value and milestone tracking
 *   5. Social Proof      — what other investors are watching
 *   6. Streaks           — consecutive days of platform usage
 *   7. Achievement Badges — gamification for engagement milestones
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface DailyBriefing {
  /** Greeting */
  greeting: string;
  /** Date */
  date: string;
  /** Portfolio summary */
  portfolioSummary: {
    totalValue: number;
    dayChange: number;
    dayChangePct: number;
    topMover: { name: string; change: number };
    alertCount: number;
  };
  /** Key events today */
  events: BriefingEvent[];
  /** New opportunities */
  newOpportunities: { name: string; matchScore: number; reason: string }[];
  /** Market pulse */
  marketPulse: { indicator: string; value: string; trend: 'up' | 'flat' | 'down' }[];
  /** Recommended actions */
  actions: { action: string; priority: 'high' | 'medium' | 'low'; link: string }[];
}

export interface BriefingEvent {
  type: 'metric_change' | 'milestone' | 'red_flag' | 'verification' | 'funding' | 'governance';
  title: string;
  detail: string;
  startupId: string | null;
  importance: 'critical' | 'high' | 'medium' | 'low';
  timestamp: number;
}

export interface EngagementStreak {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  lastActiveDate: string;
  streakReward: string | null;
}

export interface AchievementBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt: number | null;
  progress: number; // 0-100
  requirement: string;
  category: 'engagement' | 'analysis' | 'portfolio' | 'community';
}

export interface InvestorProfile {
  /** Engagement score (0-100) */
  engagementScore: number;
  /** Streak data */
  streak: EngagementStreak;
  /** Earned badges */
  badges: AchievementBadge[];
  /** Feature usage stats */
  featureUsage: { feature: string; uses: number; lastUsed: number }[];
  /** Preferred sections (most visited) */
  preferredSections: string[];
  /** Activity heat map (hour of day × day of week) */
  activityPattern: { dayOfWeek: number; hourOfDay: number; count: number }[];
  /** Recommendations based on behavior */
  personalizedRecommendations: string[];
}

// ── Achievement Definitions ──────────────────────────────────────────

const ACHIEVEMENT_DEFINITIONS: Omit<AchievementBadge, 'earned' | 'earnedAt' | 'progress'>[] = [
  // Engagement
  { id: 'first-login', name: 'First Steps', description: 'Log in to ChainTrust for the first time', icon: '🚀', requirement: 'Login once', category: 'engagement' },
  { id: 'streak-7', name: 'Weekly Warrior', description: '7-day login streak', icon: '🔥', requirement: '7 consecutive days', category: 'engagement' },
  { id: 'streak-30', name: 'Monthly Master', description: '30-day login streak', icon: '💎', requirement: '30 consecutive days', category: 'engagement' },
  { id: 'streak-100', name: 'Centurion', description: '100-day login streak', icon: '👑', requirement: '100 consecutive days', category: 'engagement' },
  { id: 'night-owl', name: 'Night Owl', description: 'Use the platform after midnight', icon: '🦉', requirement: 'Active after midnight', category: 'engagement' },

  // Analysis
  { id: 'first-dd', name: 'Due Diligence Initiate', description: 'Run your first AI Due Diligence report', icon: '🔬', requirement: 'View AI DD tab', category: 'analysis' },
  { id: 'monte-carlo', name: 'Fortune Teller', description: 'Run a Monte Carlo simulation', icon: '🎲', requirement: 'Use Digital Twin', category: 'analysis' },
  { id: 'zk-proof', name: 'Cryptographer', description: 'Generate a Zero-Knowledge proof', icon: '🔐', requirement: 'Generate ZK proof', category: 'analysis' },
  { id: 'memo-gen', name: 'Memo Machine', description: 'Generate an investment memo', icon: '📄', requirement: 'Generate investment memo', category: 'analysis' },
  { id: 'nl-query', name: 'Data Whisperer', description: 'Ask a natural language query', icon: '💬', requirement: 'Use NL query bar', category: 'analysis' },
  { id: 'ten-startups', name: 'Ecosystem Explorer', description: 'Analyze 10 different startups', icon: '🗺️', requirement: 'View 10 startups', category: 'analysis' },
  { id: '3d-view', name: 'Dimension Shifter', description: 'View the 3D Portfolio Universe', icon: '🌌', requirement: 'Use 3D view', category: 'analysis' },

  // Portfolio
  { id: 'first-bookmark', name: 'Watchlist Started', description: 'Add first startup to watchlist', icon: '⭐', requirement: 'Bookmark a startup', category: 'portfolio' },
  { id: 'five-bookmarks', name: 'Portfolio Builder', description: 'Track 5 startups in your watchlist', icon: '📊', requirement: '5 bookmarks', category: 'portfolio' },
  { id: 'compare', name: 'Comparison King', description: 'Compare 2+ startups side by side', icon: '⚖️', requirement: 'Use Compare page', category: 'portfolio' },
  { id: 'screener', name: 'Deal Screener', description: 'Use the advanced screener with filters', icon: '🎯', requirement: 'Use Screener', category: 'portfolio' },
  { id: 'export-pdf', name: 'Report Generator', description: 'Export a PDF report', icon: '📋', requirement: 'Export PDF', category: 'portfolio' },

  // Community
  { id: 'first-vote', name: 'Governance Participant', description: 'Cast your first governance vote', icon: '🗳️', requirement: 'Vote on proposal', category: 'community' },
  { id: 'stake-cmt', name: 'Staker', description: 'Stake CMT tokens', icon: '💰', requirement: 'Stake any amount', category: 'community' },
  { id: 'pro-tier', name: 'Pro Investor', description: 'Reach Pro staking tier (5,000 CMT)', icon: '⚡', requirement: 'Stake 5,000+ CMT', category: 'community' },
  { id: 'whale-tier', name: 'Whale', description: 'Reach Whale staking tier (50,000 CMT)', icon: '🐋', requirement: 'Stake 50,000+ CMT', category: 'community' },
];

// ── Daily Briefing Generation ────────────────────────────────────────

/**
 * Generate a personalized daily briefing for an investor.
 */
export function generateDailyBriefing(
  portfolioStartups: DbStartup[],
  allStartups: DbStartup[],
  investorName: string = 'Investor',
): DailyBriefing {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? `Good morning, ${investorName}` : hour < 18 ? `Good afternoon, ${investorName}` : `Good evening, ${investorName}`;

  // Portfolio summary
  const totalValue = portfolioStartups.reduce((s, st) => s + st.mrr * 20, 0); // Rough valuation: 20x MRR
  const dayChange = totalValue * (Math.random() * 0.04 - 0.01); // Simulated daily change
  const sortedByGrowth = [...portfolioStartups].sort((a, b) => Number(b.growth_rate) - Number(a.growth_rate));
  const topMover = sortedByGrowth[0];

  // Events
  const events: BriefingEvent[] = [];
  for (const startup of portfolioStartups) {
    if (Number(startup.growth_rate) > 25) {
      events.push({
        type: 'metric_change',
        title: `${startup.name} growing at ${startup.growth_rate}%`,
        detail: 'Growth rate exceeds 25% — exceptional momentum',
        startupId: startup.id,
        importance: 'high',
        timestamp: Date.now(),
      });
    }
    if (!startup.verified) {
      events.push({
        type: 'verification',
        title: `${startup.name} still unverified`,
        detail: 'Encourage on-chain verification for data integrity',
        startupId: startup.id,
        importance: 'medium',
        timestamp: Date.now(),
      });
    }
    if (Number(startup.whale_concentration) > 45) {
      events.push({
        type: 'red_flag',
        title: `${startup.name}: whale concentration at ${startup.whale_concentration}%`,
        detail: 'Token concentration exceeds comfort threshold',
        startupId: startup.id,
        importance: 'high',
        timestamp: Date.now(),
      });
    }
  }

  // New opportunities (not in portfolio)
  const notInPortfolio = allStartups
    .filter(s => !portfolioStartups.find(p => p.id === s.id))
    .filter(s => s.verified && Number(s.growth_rate) > 15 && s.trust_score > 60)
    .sort((a, b) => Number(b.growth_rate) - Number(a.growth_rate))
    .slice(0, 3);

  const newOpportunities = notInPortfolio.map(s => ({
    name: s.name,
    matchScore: Math.min(95, Math.round(Number(s.growth_rate) * 2 + s.trust_score * 0.5)),
    reason: `${s.category} | ${s.growth_rate}% growth | Trust: ${s.trust_score}`,
  }));

  // Market pulse
  const avgGrowth = allStartups.reduce((s, st) => s + Number(st.growth_rate), 0) / allStartups.length;
  const avgTrust = allStartups.reduce((s, st) => s + st.trust_score, 0) / allStartups.length;
  const verifiedPct = (allStartups.filter(s => s.verified).length / allStartups.length * 100);
  const marketPulse = [
    { indicator: 'Ecosystem Growth', value: `${avgGrowth.toFixed(1)}% avg`, trend: avgGrowth > 15 ? 'up' as const : 'flat' as const },
    { indicator: 'Avg Trust Score', value: `${avgTrust.toFixed(0)}/100`, trend: avgTrust > 70 ? 'up' as const : 'flat' as const },
    { indicator: 'Verification Rate', value: `${verifiedPct.toFixed(0)}%`, trend: verifiedPct > 60 ? 'up' as const : 'flat' as const },
    { indicator: 'Total Startups', value: `${allStartups.length}`, trend: 'up' as const },
  ];

  // Recommended actions
  const actions: DailyBriefing['actions'] = [];
  if (events.filter(e => e.importance === 'high').length > 0) {
    actions.push({ action: 'Review high-priority alerts in your portfolio', priority: 'high', link: '/portfolio' });
  }
  if (newOpportunities.length > 0) {
    actions.push({ action: `Check ${newOpportunities.length} new opportunities matching your thesis`, priority: 'medium', link: '/screener' });
  }
  actions.push({ action: 'Run updated analysis on your top holding', priority: 'low', link: portfolioStartups[0] ? `/startup/${portfolioStartups[0].id}` : '/dashboard' });

  return {
    greeting,
    date: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    portfolioSummary: {
      totalValue,
      dayChange: +dayChange.toFixed(0),
      dayChangePct: totalValue > 0 ? +(dayChange / totalValue * 100).toFixed(2) : 0,
      topMover: topMover ? { name: topMover.name, change: Number(topMover.growth_rate) } : { name: 'N/A', change: 0 },
      alertCount: events.filter(e => e.importance === 'high' || e.importance === 'critical').length,
    },
    events: events.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.importance] - order[b.importance];
    }).slice(0, 8),
    newOpportunities,
    marketPulse,
    actions,
  };
}

// ── Streak Management ────────────────────────────────────────────────

const STREAK_STORAGE_KEY = 'chaintrust_streak';

/**
 * Record a login and update streak.
 */
export function recordLogin(): EngagementStreak {
  const stored = localStorage.getItem(STREAK_STORAGE_KEY);
  const today = new Date().toISOString().split('T')[0];

  const streak: EngagementStreak = stored ? JSON.parse(stored) : {
    currentStreak: 0, longestStreak: 0, totalDaysActive: 0, lastActiveDate: '', streakReward: null,
  };

  if (streak.lastActiveDate === today) return streak; // Already counted today

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (streak.lastActiveDate === yesterday) {
    streak.currentStreak++;
  } else {
    streak.currentStreak = 1;
  }

  streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
  streak.totalDaysActive++;
  streak.lastActiveDate = today;

  // Streak rewards
  if (streak.currentStreak === 7) streak.streakReward = 'Weekly Warrior badge earned!';
  else if (streak.currentStreak === 30) streak.streakReward = 'Monthly Master badge earned!';
  else if (streak.currentStreak === 100) streak.streakReward = 'Centurion badge earned!';
  else streak.streakReward = null;

  localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streak));
  return streak;
}

// ── Achievement Tracking ─────────────────────────────────────────────

const ACHIEVEMENTS_STORAGE_KEY = 'chaintrust_achievements';

/**
 * Initialize achievements with progress tracking.
 */
export function getAchievements(): AchievementBadge[] {
  const stored = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
  if (stored) return JSON.parse(stored);

  return ACHIEVEMENT_DEFINITIONS.map(def => ({
    ...def,
    earned: false,
    earnedAt: null,
    progress: 0,
  }));
}

/**
 * Unlock an achievement.
 */
export function unlockAchievement(achievementId: string): AchievementBadge[] {
  const achievements = getAchievements();
  const badge = achievements.find(a => a.id === achievementId);
  if (badge && !badge.earned) {
    badge.earned = true;
    badge.earnedAt = Date.now();
    badge.progress = 100;
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
  }
  return achievements;
}

/**
 * Update achievement progress.
 */
export function updateAchievementProgress(achievementId: string, progress: number): AchievementBadge[] {
  const achievements = getAchievements();
  const badge = achievements.find(a => a.id === achievementId);
  if (badge && !badge.earned) {
    badge.progress = Math.min(100, progress);
    if (badge.progress >= 100) {
      badge.earned = true;
      badge.earnedAt = Date.now();
    }
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(achievements));
  }
  return achievements;
}

// ── Weekly Digest ────────────────────────────────────────────────────

export interface WeeklyDigest {
  weekOf: string;
  portfolioPerformance: { totalValue: number; weekChange: number; weekChangePct: number };
  topPerformers: { name: string; growth: number }[];
  underperformers: { name: string; growth: number }[];
  newVerifications: string[];
  redFlagsRaised: { startup: string; flag: string }[];
  marketTrends: string[];
  recommendedActions: string[];
  engagementStats: { daysActive: number; featuresUsed: number; startupsAnalyzed: number };
}

/**
 * Generate a weekly digest summary.
 */
export function generateWeeklyDigest(
  portfolioStartups: DbStartup[],
  allStartups: DbStartup[],
): WeeklyDigest {
  const now = new Date();
  const weekStart = new Date(now.getTime() - 7 * 86400000);

  const totalValue = portfolioStartups.reduce((s, st) => s + st.mrr * 20, 0);
  const weekChange = totalValue * 0.03; // Simulated

  const sorted = [...portfolioStartups].sort((a, b) => Number(b.growth_rate) - Number(a.growth_rate));
  const topPerformers = sorted.slice(0, 3).map(s => ({ name: s.name, growth: Number(s.growth_rate) }));
  const underperformers = sorted.slice(-2).filter(s => Number(s.growth_rate) < 5).map(s => ({ name: s.name, growth: Number(s.growth_rate) }));

  return {
    weekOf: `${weekStart.toLocaleDateString()} — ${now.toLocaleDateString()}`,
    portfolioPerformance: {
      totalValue,
      weekChange: +weekChange.toFixed(0),
      weekChangePct: totalValue > 0 ? +(weekChange / totalValue * 100).toFixed(2) : 0,
    },
    topPerformers,
    underperformers,
    newVerifications: portfolioStartups.filter(s => s.verified).map(s => s.name).slice(0, 2),
    redFlagsRaised: portfolioStartups
      .filter(s => Number(s.whale_concentration) > 40 || Number(s.growth_rate) < 0)
      .map(s => ({ startup: s.name, flag: Number(s.growth_rate) < 0 ? 'Negative growth' : 'High whale concentration' }))
      .slice(0, 3),
    marketTrends: [
      `Ecosystem average growth: ${(allStartups.reduce((s, st) => s + Number(st.growth_rate), 0) / allStartups.length).toFixed(1)}%`,
      `${allStartups.filter(s => s.verified).length} of ${allStartups.length} startups verified on-chain`,
    ],
    recommendedActions: [
      'Review red flags on underperforming portfolio companies',
      'Check new opportunities in the Screener',
      'Update your investment thesis if market conditions changed',
    ],
    engagementStats: { daysActive: 5, featuresUsed: 12, startupsAnalyzed: 8 },
  };
}

// ── Onboarding Steps ─────────────────────────────────────────────────

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  link: string;
  completed: boolean;
  icon: string;
  estimatedMinutes: number;
}

/**
 * Get investor onboarding checklist.
 */
export function getOnboardingSteps(): OnboardingStep[] {
  const stored = localStorage.getItem('chaintrust_onboarding');
  const completed: string[] = stored ? JSON.parse(stored) : [];

  const steps: OnboardingStep[] = [
    { id: 'explore-dashboard', title: 'Explore the Dashboard', description: 'See all startups, their metrics, and the NL query bar', action: 'Go to Dashboard', link: '/dashboard', icon: '📊', estimatedMinutes: 2, completed: false },
    { id: 'view-startup', title: 'Analyze Your First Startup', description: 'Click any startup to see 23 tabs of deep analysis', action: 'View a Startup', link: '/dashboard', icon: '🔍', estimatedMinutes: 5, completed: false },
    { id: 'use-screener', title: 'Filter with the Screener', description: 'Use advanced filters to find startups matching your thesis', action: 'Open Screener', link: '/screener', icon: '🎯', estimatedMinutes: 3, completed: false },
    { id: 'add-watchlist', title: 'Build Your Watchlist', description: 'Bookmark startups you want to track', action: 'Add to Portfolio', link: '/portfolio', icon: '⭐', estimatedMinutes: 1, completed: false },
    { id: 'run-dd', title: 'Run AI Due Diligence', description: 'Get an automated investment memo and red flag analysis', action: 'View AI DD', link: '/dashboard', icon: '🤖', estimatedMinutes: 3, completed: false },
    { id: 'try-nlquery', title: 'Ask a Question', description: 'Try "top 5 by growth rate" in the NL query bar', action: 'Ask Anything', link: '/dashboard', icon: '💬', estimatedMinutes: 1, completed: false },
    { id: 'compare-startups', title: 'Compare Startups', description: 'Pick 2+ startups and compare them side by side', action: 'Go to Compare', link: '/compare', icon: '⚖️', estimatedMinutes: 3, completed: false },
    { id: 'explore-3d', title: 'Enter the 3D Universe', description: 'See your portfolio as orbiting planets in 3D', action: 'View 3D', link: '/dashboard', icon: '🌌', estimatedMinutes: 2, completed: false },
    { id: 'stake-cmt', title: 'Stake CMT Tokens', description: 'Stake CMT to unlock Pro features and earn streaming rewards', action: 'Go to Staking', link: '/staking', icon: '💰', estimatedMinutes: 2, completed: false },
    { id: 'vote-governance', title: 'Vote on a Proposal', description: 'Participate in DAO governance', action: 'Go to Governance', link: '/governance', icon: '🗳️', estimatedMinutes: 2, completed: false },
  ];

  return steps.map(s => ({ ...s, completed: completed.includes(s.id) }));
}

/**
 * Mark an onboarding step as complete.
 */
export function completeOnboardingStep(stepId: string): void {
  const stored = localStorage.getItem('chaintrust_onboarding');
  const completed: string[] = stored ? JSON.parse(stored) : [];
  if (!completed.includes(stepId)) {
    completed.push(stepId);
    localStorage.setItem('chaintrust_onboarding', JSON.stringify(completed));
  }
}

/**
 * Get onboarding progress percentage.
 */
export function getOnboardingProgress(): number {
  const steps = getOnboardingSteps();
  const completed = steps.filter(s => s.completed).length;
  return Math.round((completed / steps.length) * 100);
}
