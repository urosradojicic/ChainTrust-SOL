/**
 * Command Palette / Smart Navigation
 * ────────────────────────────────────
 * Cmd+K / Ctrl+K to search EVERYTHING — pages, startups, features, actions.
 * Users never get lost. One shortcut to find anything.
 *
 * Think: Spotlight (macOS), Raycast, Linear's Cmd+K, VS Code Command Palette.
 *
 * Categories:
 *   - Pages        — navigate to any page
 *   - Startups     — jump to any startup
 *   - Actions      — run any analysis directly
 *   - Shortcuts    — keyboard shortcuts reference
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export type CommandCategory = 'page' | 'startup' | 'action' | 'shortcut' | 'recent';

export interface Command {
  id: string;
  label: string;
  description: string;
  category: CommandCategory;
  icon: string;
  /** Navigation path or action identifier */
  action: string;
  /** Keyboard shortcut (if any) */
  shortcut: string | null;
  /** Search keywords for fuzzy matching */
  keywords: string[];
  /** Priority for sorting (lower = higher priority) */
  priority: number;
}

export interface CommandSearchResult {
  commands: Command[];
  query: string;
  totalResults: number;
}

// ── Static Commands ──────────────────────────────────────────────────

const PAGE_COMMANDS: Command[] = [
  { id: 'nav-hub', label: 'Investor Hub', description: 'Your daily briefing and command center', category: 'page', icon: '🏠', action: '/investor-hub', shortcut: 'G H', keywords: ['home', 'hub', 'briefing', 'morning', 'dashboard'], priority: 1 },
  { id: 'nav-dashboard', label: 'Dashboard', description: 'All startups overview with 3D visualization', category: 'page', icon: '📊', action: '/dashboard', shortcut: 'G D', keywords: ['dashboard', 'overview', 'startups', 'grid', '3d'], priority: 2 },
  { id: 'nav-screener', label: 'Screener', description: 'Filter and sort startups by any metric', category: 'page', icon: '🎯', action: '/screener', shortcut: 'G S', keywords: ['screener', 'filter', 'search', 'sort', 'find'], priority: 3 },
  { id: 'nav-compare', label: 'Compare', description: 'Side-by-side startup comparison', category: 'page', icon: '⚖️', action: '/compare', shortcut: 'G C', keywords: ['compare', 'side by side', 'versus', 'vs'], priority: 4 },
  { id: 'nav-portfolio', label: 'Portfolio', description: 'Your watchlist and tracked startups', category: 'page', icon: '⭐', action: '/portfolio', shortcut: 'G P', keywords: ['portfolio', 'watchlist', 'bookmarks', 'tracking'], priority: 5 },
  { id: 'nav-analytics', label: 'Analytics', description: 'Platform-wide KPIs and insights', category: 'page', icon: '📈', action: '/analytics', shortcut: 'G A', keywords: ['analytics', 'kpis', 'metrics', 'insights'], priority: 6 },
  { id: 'nav-staking', label: 'Staking', description: 'Stake CMT tokens and earn streaming rewards', category: 'page', icon: '💰', action: '/staking', shortcut: 'G T', keywords: ['staking', 'stake', 'cmt', 'rewards', 'tier'], priority: 7 },
  { id: 'nav-governance', label: 'Governance', description: 'DAO proposals and voting', category: 'page', icon: '🗳️', action: '/governance', shortcut: 'G V', keywords: ['governance', 'dao', 'vote', 'proposal'], priority: 8 },
  { id: 'nav-leaderboard', label: 'Leaderboard', description: 'Ranked startups by trust score', category: 'page', icon: '🏆', action: '/leaderboard', shortcut: null, keywords: ['leaderboard', 'ranking', 'top', 'best'], priority: 9 },
  { id: 'nav-verify', label: 'Public Verifier', description: 'Verify any startup on-chain (no wallet needed)', category: 'page', icon: '🔍', action: '/verify', shortcut: null, keywords: ['verify', 'proof', 'on-chain', 'check'], priority: 10 },
  { id: 'nav-cost', label: 'Cost Calculator', description: 'Compare ChainTrust costs vs traditional audits', category: 'page', icon: '🧮', action: '/cost-calculator', shortcut: null, keywords: ['cost', 'calculator', 'price', 'roi'], priority: 11 },
  { id: 'nav-tokenomics', label: 'Tokenomics', description: 'CMT token distribution and economics', category: 'page', icon: '🪙', action: '/tokenomics', shortcut: null, keywords: ['tokenomics', 'token', 'cmt', 'distribution'], priority: 12 },
];

const ACTION_COMMANDS: Command[] = [
  { id: 'act-nlquery', label: 'Ask a Question', description: 'Natural language query — type anything', category: 'action', icon: '💬', action: 'focus-nl-query', shortcut: '/', keywords: ['ask', 'question', 'query', 'search', 'natural language'], priority: 1 },
  { id: 'act-3d', label: 'Open 3D Universe', description: 'View startups as orbiting planets', category: 'action', icon: '🌌', action: 'scroll-3d', shortcut: null, keywords: ['3d', 'universe', 'planets', 'visualization'], priority: 3 },
  { id: 'act-export', label: 'Export Data', description: 'Export screener results as CSV', category: 'action', icon: '📋', action: '/screener#export', shortcut: null, keywords: ['export', 'csv', 'download', 'data'], priority: 5 },
];

const SHORTCUT_COMMANDS: Command[] = [
  { id: 'key-cmdk', label: 'Command Palette', description: 'Open this dialog', category: 'shortcut', icon: '⌘', action: '', shortcut: 'Cmd+K', keywords: ['command', 'palette', 'search'], priority: 1 },
  { id: 'key-slash', label: 'Focus Search', description: 'Jump to the NL query bar', category: 'shortcut', icon: '/', action: '', shortcut: '/', keywords: ['search', 'focus'], priority: 2 },
  { id: 'key-escape', label: 'Close / Go Back', description: 'Close dialog or go back', category: 'shortcut', icon: '⎋', action: '', shortcut: 'Escape', keywords: ['close', 'back', 'escape'], priority: 3 },
  { id: 'key-gh', label: 'Go to Hub', description: 'Navigate to Investor Hub', category: 'shortcut', icon: '🏠', action: '/investor-hub', shortcut: 'G then H', keywords: ['go', 'hub'], priority: 4 },
  { id: 'key-gd', label: 'Go to Dashboard', description: 'Navigate to Dashboard', category: 'shortcut', icon: '📊', action: '/dashboard', shortcut: 'G then D', keywords: ['go', 'dashboard'], priority: 5 },
  { id: 'key-gs', label: 'Go to Screener', description: 'Navigate to Screener', category: 'shortcut', icon: '🎯', action: '/screener', shortcut: 'G then S', keywords: ['go', 'screener'], priority: 6 },
];

// ── Search Engine ────────────────────────────────────────────────────

/**
 * Fuzzy-match a query against a command's searchable text.
 * Returns a score (higher = better match, 0 = no match).
 */
function fuzzyScore(query: string, command: Command): number {
  const q = query.toLowerCase();
  const searchText = [command.label, command.description, ...command.keywords].join(' ').toLowerCase();

  // Exact label match (highest score)
  if (command.label.toLowerCase() === q) return 100;

  // Label starts with query
  if (command.label.toLowerCase().startsWith(q)) return 80;

  // Label contains query
  if (command.label.toLowerCase().includes(q)) return 60;

  // Any keyword exact match
  if (command.keywords.some(k => k.toLowerCase() === q)) return 70;

  // Any keyword starts with
  if (command.keywords.some(k => k.toLowerCase().startsWith(q))) return 50;

  // Full text contains
  if (searchText.includes(q)) return 30;

  // Character-by-character fuzzy match
  let qi = 0;
  for (let i = 0; i < searchText.length && qi < q.length; i++) {
    if (searchText[i] === q[qi]) qi++;
  }
  if (qi === q.length) return 10 + qi;

  return 0;
}

/**
 * Search all commands by query.
 */
export function searchCommands(
  query: string,
  startups: DbStartup[] = [],
  recentPaths: string[] = [],
): CommandSearchResult {
  const allCommands: Command[] = [...PAGE_COMMANDS, ...ACTION_COMMANDS, ...SHORTCUT_COMMANDS];

  // Add startup commands dynamically
  for (const startup of startups) {
    allCommands.push({
      id: `startup-${startup.id}`,
      label: startup.name,
      description: `${startup.category} — $${(startup.mrr / 1000).toFixed(0)}K MRR, ${startup.growth_rate}% growth, trust: ${startup.trust_score}`,
      category: 'startup',
      icon: startup.verified ? '✓' : '○',
      action: `/startup/${startup.id}`,
      shortcut: null,
      keywords: [startup.name.toLowerCase(), startup.category.toLowerCase(), startup.blockchain.toLowerCase()],
      priority: 20,
    });
  }

  // Add recent pages
  for (const path of recentPaths.slice(0, 5)) {
    const existing = allCommands.find(c => c.action === path);
    if (existing) {
      allCommands.push({
        ...existing,
        id: `recent-${existing.id}`,
        category: 'recent',
        priority: 0, // Highest priority
      });
    }
  }

  if (!query.trim()) {
    // No query — show recent + top pages
    const recent = allCommands.filter(c => c.category === 'recent').slice(0, 3);
    const pages = PAGE_COMMANDS.slice(0, 6);
    const actions = ACTION_COMMANDS.slice(0, 3);
    return {
      commands: [...recent, ...pages, ...actions],
      query: '',
      totalResults: allCommands.length,
    };
  }

  // Score and sort
  const scored = allCommands
    .map(cmd => ({ command: cmd, score: fuzzyScore(query, cmd) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score || a.command.priority - b.command.priority)
    .slice(0, 15);

  return {
    commands: scored.map(s => s.command),
    query,
    totalResults: scored.length,
  };
}

/**
 * Get all keyboard shortcuts for reference.
 */
export function getKeyboardShortcuts(): Command[] {
  return [...SHORTCUT_COMMANDS, ...PAGE_COMMANDS.filter(c => c.shortcut)];
}

// ── Recent Pages Tracking ────────────────────────────────────────────

const RECENT_STORAGE_KEY = 'chaintrust_recent_pages';

/**
 * Record a page visit for recent navigation.
 */
export function recordPageVisit(path: string): void {
  const stored = localStorage.getItem(RECENT_STORAGE_KEY);
  let recent: string[] = stored ? JSON.parse(stored) : [];
  recent = [path, ...recent.filter(p => p !== path)].slice(0, 10);
  localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recent));
}

/**
 * Get recent page visits.
 */
export function getRecentPages(): string[] {
  const stored = localStorage.getItem(RECENT_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}
