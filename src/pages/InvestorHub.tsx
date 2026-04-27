/**
 * Investor Hub — The Command Center
 * ───────────────────────────────────
 * The page investors open every morning. Personalized briefing,
 * portfolio overview, alerts, opportunities, and engagement tracking.
 *
 * Designed to be the "Bloomberg Terminal" for startup investing.
 */

import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sun, Moon, TrendingUp, TrendingDown, AlertTriangle, Bell, Star,
  Target, Zap, Award, ChevronRight, BarChart3, Shield, Activity,
  Sparkles, Calendar, Clock, CheckCircle2, ArrowUpRight,
} from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/format';
import { useStartups, useAllMetricsMap } from '@/hooks/use-startups';
import { useWallet } from '@/contexts/WalletContext';
import { scoreDeal, type DealScore } from '@/lib/deal-scoring';
import { optimizePortfolio } from '@/lib/portfolio-optimizer';
import { analyzeCompetitiveLandscape } from '@/lib/competitive-intel';
import { generateComplianceReport } from '@/lib/regulatory-compliance';
import { useSmartAlerts } from '@/hooks/use-smart-monitoring';
import MacroRegimePanel from '@/components/startup/MacroRegimePanel';
import {
  generateDailyBriefing,
  recordLogin,
  getAchievements,
  getOnboardingSteps,
  getOnboardingProgress,
  type DailyBriefing,
  type EngagementStreak,
  type AchievementBadge,
  type OnboardingStep,
} from '@/lib/investor-engagement';

// ── Sub-Components ───────────────────────────────────────────────────

function BriefingCard({ briefing }: { briefing: DailyBriefing }) {
  const isPositive = briefing.portfolioSummary.dayChange >= 0;

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="bg-gradient-to-r from-primary/10 via-blue-500/5 to-emerald-500/10 p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">{briefing.greeting}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {briefing.date}
            </p>
          </div>
          {briefing.portfolioSummary.alertCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 border border-red-500/25 text-red-600 dark:text-red-400">
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-bold tabular-nums">{briefing.portfolioSummary.alertCount} alert{briefing.portfolioSummary.alertCount === 1 ? '' : 's'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        {/* Portfolio summary */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <div>
            <p className="text-xs text-muted-foreground">Portfolio Value</p>
            <p className="text-2xl font-bold font-mono text-foreground">{formatCurrency(briefing.portfolioSummary.totalValue)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Today</p>
            <p className={`text-2xl font-bold font-mono ${isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
              {isPositive ? '+' : ''}{formatCurrency(briefing.portfolioSummary.dayChange)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Top Mover</p>
            <p className="text-lg font-bold text-foreground">{briefing.portfolioSummary.topMover.name}</p>
            <p className="text-xs text-emerald-500">+{briefing.portfolioSummary.topMover.change}%</p>
          </div>
        </div>

        {/* Recommended actions */}
        {briefing.actions.length > 0 && (
          <div className="space-y-2 mb-5">
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-primary" /> Recommended Actions
            </p>
            {briefing.actions.map((action, i) => (
              <Link key={i} to={action.link} className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition group">
                <div className={`w-1.5 h-1.5 rounded-full ${action.priority === 'high' ? 'bg-red-500' : action.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                <span className="text-xs text-foreground flex-1">{action.action}</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition" />
              </Link>
            ))}
          </div>
        )}

        {/* Market pulse — mobile uses 2 cols, desktop uses 4 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {briefing.marketPulse.map((pulse, i) => (
            <div key={i} className="rounded-lg bg-muted/20 p-2 text-center">
              <p className="text-[10px] text-muted-foreground">{pulse.indicator}</p>
              <p className="text-xs font-bold font-mono text-foreground">{pulse.value}</p>
              <span className={`text-[10px] ${pulse.trend === 'up' ? 'text-emerald-500' : pulse.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                {pulse.trend === 'up' ? '↑' : pulse.trend === 'down' ? '↓' : '→'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OpportunitiesCard({ opportunities }: { opportunities: DailyBriefing['newOpportunities'] }) {
  if (opportunities.length === 0) return null;

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-primary" /> New Opportunities
      </h3>
      <div className="space-y-2">
        {opportunities.map((opp, i) => (
          <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/40 transition">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
              {opp.matchScore}%
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{opp.name}</p>
              <p className="text-[10px] text-muted-foreground">{opp.reason}</p>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsCard({ events }: { events: DailyBriefing['events'] }) {
  if (events.length === 0) return null;

  const iconMap = {
    metric_change: TrendingUp, milestone: Star, red_flag: AlertTriangle,
    verification: Shield, funding: Zap, governance: Activity,
  };
  const colorMap = {
    critical: 'text-red-500 bg-red-500/10', high: 'text-orange-500 bg-orange-500/10',
    medium: 'text-amber-500 bg-amber-500/10', low: 'text-blue-500 bg-blue-500/10',
  };

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
        <Bell className="h-4 w-4 text-amber-500" /> Events ({events.length})
      </h3>
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {events.map((event, i) => {
          const Icon = iconMap[event.type] ?? Activity;
          return (
            <Link key={i} to={event.startupId ? `/startup/${event.startupId}` : '/dashboard'} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/20 transition">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${colorMap[event.importance]} mt-0.5`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">{event.title}</p>
                <p className="text-[10px] text-muted-foreground">{event.detail}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StreakCard({ streak }: { streak: EngagementStreak }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔥</span>
          <div>
            <p className="text-sm font-bold text-foreground">{streak.currentStreak}-day streak</p>
            <p className="text-[10px] text-muted-foreground">Longest: {streak.longestStreak} days</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-foreground">{streak.totalDaysActive} total days</p>
          {streak.streakReward && (
            <p className="text-[10px] text-primary">{streak.streakReward}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function OnboardingCard({ steps }: { steps: OnboardingStep[] }) {
  const progress = getOnboardingProgress();
  const nextStep = steps.find(s => !s.completed);
  if (progress >= 100) return null;

  return (
    <div className="rounded-xl border bg-primary/5 border-primary/20 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" /> Getting Started
        </h3>
        <span className="text-xs font-mono text-primary">{progress}%</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8 }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-1.5">
        {steps.slice(0, 5).map(step => (
          <Link key={step.id} to={step.link} className={`flex items-center gap-2 p-2 rounded-lg transition ${step.completed ? 'bg-emerald-500/5' : 'hover:bg-muted/20'}`}>
            {step.completed
              ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              : <span className="text-sm shrink-0">{step.icon}</span>}
            <span className={`text-xs ${step.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
              {step.title}
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">{step.estimatedMinutes}min</span>
          </Link>
        ))}
      </div>

      {nextStep && (
        <Link to={nextStep.link} className="mt-3 w-full inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition">
          {nextStep.icon} {nextStep.action}
        </Link>
      )}
    </div>
  );
}

function AchievementsCard({ badges }: { badges: AchievementBadge[] }) {
  const earned = badges.filter(b => b.earned);
  const recent = earned.sort((a, b) => (b.earnedAt ?? 0) - (a.earnedAt ?? 0)).slice(0, 5);

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-3">
        <Award className="h-4 w-4 text-amber-500" /> Achievements ({earned.length}/{badges.length})
      </h3>
      <div className="flex flex-wrap gap-2">
        {badges.slice(0, 12).map(badge => (
          <div key={badge.id} title={badge.earned ? `${badge.name}: ${badge.description}` : `Locked: ${badge.requirement}`}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${badge.earned ? 'bg-amber-500/10' : 'bg-muted/20 opacity-30 grayscale'}`}>
            {badge.icon}
          </div>
        ))}
      </div>
      {recent.length > 0 && (
        <p className="text-[10px] text-muted-foreground mt-2">
          Latest: {recent[0].name} — {recent[0].description}
        </p>
      )}
    </div>
  );
}

// ── Quick Actions ────────────────────────────────────────────────────

function QuickActions() {
  const actions = [
    { label: 'Dashboard', icon: BarChart3, link: '/dashboard', color: 'bg-blue-500/10 text-blue-500' },
    { label: 'Screener', icon: Target, link: '/screener', color: 'bg-primary/10 text-primary' },
    { label: 'Compare', icon: Activity, link: '/compare', color: 'bg-emerald-500/10 text-emerald-500' },
    { label: 'Portfolio', icon: Star, link: '/portfolio', color: 'bg-amber-500/10 text-amber-500' },
    { label: 'Analytics', icon: TrendingUp, link: '/analytics', color: 'bg-cyan-500/10 text-cyan-500' },
    { label: 'Governance', icon: Shield, link: '/governance', color: 'bg-pink-500/10 text-pink-500' },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {actions.map(action => (
        <Link key={action.label} to={action.link} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-card hover:bg-muted/20 transition">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
            <action.icon className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium text-foreground">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────

export default function InvestorHub() {
  const { data: startups = [] } = useStartups();
  const { bookmarkedStartups } = useWallet();

  // Record login for streak tracking
  const streak = useMemo(() => recordLogin(), []);
  const achievements = useMemo(() => getAchievements(), []);
  const onboardingSteps = useMemo(() => getOnboardingSteps(), []);

  // Portfolio = bookmarked startups (or first 3 for demo)
  const portfolio = useMemo(() => {
    if (bookmarkedStartups.length > 0) {
      return startups.filter(s => bookmarkedStartups.includes(s.id));
    }
    return startups.slice(0, 3); // Demo fallback
  }, [startups, bookmarkedStartups]);

  // Fetch metrics for all startups (for smart alerts + macro regime)
  const allStartupIds = useMemo(() => startups.map(s => s.id), [startups]);
  const { data: metricsMap = new Map() } = useAllMetricsMap(allStartupIds);
  const portfolioIds = useMemo(() => portfolio.map(s => s.id), [portfolio]);
  const { alerts: smartAlerts, criticalCount, warningCount } = useSmartAlerts(startups, metricsMap, portfolioIds);

  const briefing = useMemo(
    () => generateDailyBriefing(portfolio, startups),
    [portfolio, startups],
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Quick Actions */}
      <QuickActions />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main Column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Briefing */}
          <BriefingCard briefing={briefing} />

          {/* Events/Alerts */}
          <EventsCard events={briefing.events} />

          {/* New Opportunities */}
          <OpportunitiesCard opportunities={briefing.newOpportunities} />

          {/* Smart Monitoring Alerts */}
          {smartAlerts.length === 0 && (
            <div className="rounded-xl border bg-card p-5 text-center">
              <Zap className="h-5 w-5 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No alerts right now. Portfolio is healthy.</p>
            </div>
          )}
          {smartAlerts.length > 0 && (
            <div className="rounded-xl border bg-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Smart Monitoring
                </h3>
                <div className="flex gap-2">
                  {criticalCount > 0 && (
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-500">{criticalCount} critical</span>
                  )}
                  {warningCount > 0 && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">{warningCount} warnings</span>
                  )}
                </div>
              </div>
              <div className="divide-y divide-border max-h-80 overflow-y-auto">
                {smartAlerts.slice(0, 8).map(alert => (
                  <Link key={alert.id} to={alert.actionUrl || '/dashboard'} className="flex items-start gap-3 px-5 py-3 transition hover:bg-muted/50">
                    <div className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                      alert.severity === 'critical' ? 'bg-red-500' :
                      alert.severity === 'warning' ? 'bg-amber-500' :
                      alert.severity === 'positive' ? 'bg-emerald-500' :
                      'bg-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.detail}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side Column (1/3) */}
        <div className="space-y-4">
          {/* Macro Regime */}
          <MacroRegimePanel metricsMap={metricsMap} />

          {/* Onboarding (shown until complete) */}
          <OnboardingCard steps={onboardingSteps} />

          {/* Streak */}
          <StreakCard streak={streak} />

          {/* Achievements */}
          <AchievementsCard badges={achievements} />

          {/* Deal Scores */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Target className="h-3 w-3" /> Top Deal Scores
            </h3>
            <div className="space-y-2">
              {startups.slice(0, 5).map(s => {
                const ds = scoreDeal(s, [], startups);
                return (
                  <Link key={s.id} to={`/startup/${s.id}`} className="flex justify-between text-xs hover:text-primary transition">
                    <span className="truncate flex-1">{s.name}</span>
                    <span className={`font-mono font-bold ${ds.totalScore >= 70 ? 'text-emerald-500' : ds.totalScore >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                      {ds.totalScore}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Compliance status */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Shield className="h-3 w-3" /> Compliance Status
            </h3>
            {(() => {
              const report = generateComplianceReport();
              const compliantCount = report.statusCounts.compliant ?? 0;
              const totalCount = report.requirements.length;
              const isCompliant = compliantCount === totalCount && totalCount > 0;
              return (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Score</span>
                    <span className={`font-mono font-bold ${isCompliant ? 'text-emerald-500' : 'text-amber-500'}`}>
                      {report.complianceScore}/100 · Grade {report.grade}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-mono font-bold text-foreground">
                      {compliantCount}/{totalCount} compliant
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Quick stats */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="text-xs font-medium text-muted-foreground mb-2">Your Stats</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Startups tracked</span>
                <span className="font-mono font-bold text-foreground">{portfolio.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Available startups</span>
                <span className="font-mono font-bold text-foreground">{startups.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Verified</span>
                <span className="font-mono font-bold text-emerald-500">
                  {startups.filter(s => s.verified).length}/{startups.length}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Avg Trust Score</span>
                <span className="font-mono font-bold text-foreground">
                  {startups.length > 0 ? Math.round(startups.reduce((s, st) => s + st.trust_score, 0) / startups.length) : 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
