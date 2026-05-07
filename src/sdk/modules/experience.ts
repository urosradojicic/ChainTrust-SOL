/**
 * Experience Module — barrel export
 * UX engines: narratives, discovery, engagement, preferences.
 */

export { generateStartupNarrative, generateCardInsight, generateComparisonNarrative, type StartupNarrative } from '@/lib/intelligence/narrative-engine';
export { searchCommands, getRecentPages, recordPageVisit } from '@/lib/intelligence/command-palette';
export { getContextualHint, dismissHint, markFeatureDiscovered, getDiscoveryProgress } from '@/lib/intelligence/feature-discovery';
export { generateDailyBriefing, recordLogin, getAchievements, unlockAchievement, getOnboardingSteps, completeOnboardingStep, generateWeeklyDigest, type DailyBriefing } from '@/lib/intelligence/investor-engagement';
export { loadPreferences, savePreferences, createFromPreset, getPersonalizedQuerySuggestions, type InvestorPreferences } from '@/lib/intelligence/investor-preferences';
export { logDecision, reviewOutcome, computeConvictionStats, getDecisionTemplate, type ConvictionEntry } from '@/lib/intelligence/conviction-tracker';
export { executeQuery, EXAMPLE_QUERIES, type QueryResult } from '@/lib/intelligence/nl-query';
