/**
 * Experience Module — barrel export
 * UX engines: narratives, discovery, engagement, preferences.
 */

export { generateStartupNarrative, generateCardInsight, generateComparisonNarrative, type StartupNarrative } from '@/lib/narrative-engine';
export { searchCommands, getRecentPages, recordPageVisit } from '@/lib/command-palette';
export { getContextualHint, dismissHint, markFeatureDiscovered, getDiscoveryProgress } from '@/lib/feature-discovery';
export { generateDailyBriefing, recordLogin, getAchievements, unlockAchievement, getOnboardingSteps, completeOnboardingStep, generateWeeklyDigest, type DailyBriefing } from '@/lib/investor-engagement';
export { loadPreferences, savePreferences, createFromPreset, getPersonalizedQuerySuggestions, type InvestorPreferences } from '@/lib/investor-preferences';
export { logDecision, reviewOutcome, computeConvictionStats, getDecisionTemplate, type ConvictionEntry } from '@/lib/conviction-tracker';
export { executeQuery, EXAMPLE_QUERIES, type QueryResult } from '@/lib/nl-query';
