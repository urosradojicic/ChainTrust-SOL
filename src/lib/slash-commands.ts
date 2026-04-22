/**
 * Slash Command Parser
 * ────────────────────
 * Bloomberg-terminal-inspired quick actions. Typed into the command palette.
 *
 * Supported forms:
 *   /go <startup>                 — navigate to startup detail
 *   /watch <startup>              — add startup to local watchlist
 *   /compare <a> <b>              — open /compare?a=<a>&b=<b>
 *   /screen <filter>              — jump to /screener?q=<filter>
 *   /export                       — trigger export on current view
 *
 * Matching rules:
 *   - Case-insensitive
 *   - Fuzzy startup matching (name + ticker-like id)
 *   - Multi-word arguments preserved (e.g. "/go Acme Labs")
 */

import type { DbStartup } from '@/types/database';

export type SlashCommandKind = 'go' | 'watch' | 'compare' | 'screen' | 'export' | 'help';

export interface SlashCommandMatch {
  kind: SlashCommandKind;
  target: string;          // navigation path or action id
  label: string;           // human-readable summary
  description: string;
  valid: boolean;
  hint?: string;           // shown when args are incomplete
}

/** Returns a match if `query` parses as a slash command; otherwise null. */
export function parseSlashCommand(query: string, startups: DbStartup[]): SlashCommandMatch | null {
  const trimmed = query.trim();
  if (!trimmed.startsWith('/')) return null;

  const parts = trimmed.slice(1).split(/\s+/);
  const verb = parts[0]?.toLowerCase() ?? '';
  const rest = parts.slice(1).join(' ').trim();

  switch (verb) {
    case 'go': {
      if (!rest) {
        return invalid('go', 'Jump to a startup', 'Type: /go <name>');
      }
      const startup = findStartup(rest, startups);
      if (!startup) {
        return invalid('go', `No startup matching "${rest}"`, 'Check the spelling or press Esc');
      }
      return {
        kind: 'go',
        target: `/startup/${startup.id}`,
        label: `Go → ${startup.name}`,
        description: `${startup.category} • Trust ${startup.trust_score}`,
        valid: true,
      };
    }

    case 'watch': {
      if (!rest) return invalid('watch', 'Add to watchlist', 'Type: /watch <name>');
      const startup = findStartup(rest, startups);
      if (!startup) return invalid('watch', `No startup matching "${rest}"`);
      return {
        kind: 'watch',
        target: `watch:${startup.id}`,
        label: `Watch → ${startup.name}`,
        description: 'Saves to local watchlist',
        valid: true,
      };
    }

    case 'compare': {
      const [a, ...bParts] = rest.split(/\s+(?:vs|and|,)\s+|\s{2,}|\s+/);
      const bQuery = bParts.join(' ').trim();
      if (!a || !bQuery) {
        return invalid('compare', 'Compare two startups', 'Type: /compare <a> <b>');
      }
      const sA = findStartup(a, startups);
      const sB = findStartup(bQuery, startups);
      if (!sA || !sB) {
        return invalid('compare', `Could not resolve one of "${a}" or "${bQuery}"`);
      }
      return {
        kind: 'compare',
        target: `/compare?a=${encodeURIComponent(sA.id)}&b=${encodeURIComponent(sB.id)}`,
        label: `Compare → ${sA.name} vs ${sB.name}`,
        description: 'Opens side-by-side view',
        valid: true,
      };
    }

    case 'screen': {
      const q = rest || '';
      return {
        kind: 'screen',
        target: q ? `/screener?q=${encodeURIComponent(q)}` : '/screener',
        label: q ? `Screen → filter "${q}"` : 'Open Screener',
        description: 'Filter startups by any metric',
        valid: true,
      };
    }

    case 'export': {
      return {
        kind: 'export',
        target: 'action:export',
        label: 'Export current view',
        description: 'CSV export of visible data',
        valid: true,
      };
    }

    case 'help':
    case '?': {
      return {
        kind: 'help',
        target: 'action:help',
        label: 'Open keyboard help',
        description: 'Show shortcut reference',
        valid: true,
      };
    }

    default:
      return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

function invalid(kind: SlashCommandKind, label: string, hint?: string): SlashCommandMatch {
  return {
    kind,
    target: '',
    label,
    description: hint ?? 'Invalid arguments',
    valid: false,
    hint,
  };
}

/** Fuzzy-match a startup by name or id, returning the closest match. */
function findStartup(query: string, startups: DbStartup[]): DbStartup | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  // Priority: exact-id > exact-name > starts-with > contains
  const exactId = startups.find((s) => s.id === query || s.id.toLowerCase() === q);
  if (exactId) return exactId;

  const exactName = startups.find((s) => s.name.toLowerCase() === q);
  if (exactName) return exactName;

  const startsWith = startups.find((s) => s.name.toLowerCase().startsWith(q));
  if (startsWith) return startsWith;

  const contains = startups.find((s) => s.name.toLowerCase().includes(q));
  return contains ?? null;
}

/** Persist a startup id to a local watchlist in localStorage. */
export function addToWatchlist(startupId: string): void {
  try {
    const raw = localStorage.getItem('chaintrust_watchlist') ?? '[]';
    const list: string[] = JSON.parse(raw);
    if (!list.includes(startupId)) {
      list.unshift(startupId);
      localStorage.setItem('chaintrust_watchlist', JSON.stringify(list.slice(0, 50)));
    }
  } catch {
    // private browsing / quota — swallow silently; watchlist is best-effort
  }
}

/** Read the local watchlist. */
export function readWatchlist(): string[] {
  try {
    const raw = localStorage.getItem('chaintrust_watchlist') ?? '[]';
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
