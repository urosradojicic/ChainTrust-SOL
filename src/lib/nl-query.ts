/**
 * Natural Language Query Engine
 * ─────────────────────────────
 * Translates natural language investor queries into structured filters
 * and executes them against the startup database.
 *
 * No LLM API calls — uses pattern matching and NLP heuristics.
 * Fast, free, and deterministic.
 *
 * Supported query patterns:
 *   - "Show me SaaS startups with MRR over 100k"
 *   - "Find DeFi projects with growth above 20%"
 *   - "Which startups have trust score above 80 and are verified?"
 *   - "Top 5 startups by growth rate"
 *   - "Compare PayFlow and DeFiYield"
 *   - "Average MRR across all startups"
 *   - "How many startups are verified?"
 */

import type { DbStartup } from '@/types/database';

/** Safe dynamic field access for startup properties */
function getField(s: DbStartup, field: string): unknown {
  return (s as Record<string, unknown>)[field];
}

// ── Types ────────────────────────────────────────────────────────────

export type QueryResultType = 'list' | 'comparison' | 'aggregate' | 'count' | 'single' | 'error';

export interface QueryResult {
  type: QueryResultType;
  /** Natural language answer */
  answer: string;
  /** Filtered/sorted startups (for list/comparison) */
  startups: DbStartup[];
  /** Aggregate value (for aggregate queries) */
  aggregateValue?: number;
  /** What the query was interpreted as */
  interpretation: string;
  /** Filters that were applied */
  filtersApplied: string[];
  /** Sort that was applied */
  sortApplied: string | null;
  /** Limit applied */
  limit: number | null;
}

// ── Token Definitions ────────────────────────────────────────────────

interface FilterRule {
  field: keyof DbStartup | 'growth_rate' | 'whale_concentration' | 'inflation_rate';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number | string | boolean;
}

const CATEGORY_KEYWORDS: Record<string, string> = {
  saas: 'SaaS', defi: 'DeFi', fintech: 'Fintech', nft: 'NFT',
  infrastructure: 'Infrastructure', infra: 'Infrastructure',
  identity: 'Identity', data: 'Data', 'supply chain': 'Supply Chain',
  supply: 'Supply Chain', gaming: 'Gaming', social: 'Social',
};

const METRIC_KEYWORDS: Record<string, { field: string; label: string }> = {
  mrr: { field: 'mrr', label: 'MRR' },
  revenue: { field: 'mrr', label: 'MRR' },
  users: { field: 'users', label: 'Users' },
  growth: { field: 'growth_rate', label: 'Growth Rate' },
  'growth rate': { field: 'growth_rate', label: 'Growth Rate' },
  trust: { field: 'trust_score', label: 'Trust Score' },
  'trust score': { field: 'trust_score', label: 'Trust Score' },
  sustainability: { field: 'sustainability_score', label: 'Sustainability' },
  treasury: { field: 'treasury', label: 'Treasury' },
  whale: { field: 'whale_concentration', label: 'Whale Concentration' },
  'whale concentration': { field: 'whale_concentration', label: 'Whale Concentration' },
  inflation: { field: 'inflation_rate', label: 'Inflation Rate' },
  team: { field: 'team_size', label: 'Team Size' },
  'team size': { field: 'team_size', label: 'Team Size' },
};

const COMPARISON_OPERATORS: Record<string, '>' | '<' | '>=' | '<='> = {
  'above': '>', 'over': '>', 'more than': '>', 'greater than': '>', 'exceeds': '>',
  'below': '<', 'under': '<', 'less than': '<', 'lower than': '<',
  'at least': '>=', 'minimum': '>=', 'min': '>=',
  'at most': '<=', 'maximum': '<=', 'max': '<=',
};

const AGGREGATE_KEYWORDS = ['average', 'avg', 'mean', 'total', 'sum', 'count', 'how many', 'median', 'highest', 'lowest'];
const SORT_KEYWORDS = ['top', 'best', 'highest', 'most', 'largest', 'biggest'];
const SORT_DESC_KEYWORDS = ['bottom', 'worst', 'lowest', 'least', 'smallest', 'fewest'];

// ── Parser ───────────────────────────────────────────────────────────

function parseNumber(text: string): number | null {
  // Handle "100k", "1m", "50K", etc.
  const cleaned = text.toLowerCase().replace(/[$,]/g, '').trim();
  const match = cleaned.match(/^(\d+(?:\.\d+)?)\s*(k|m|b)?$/);
  if (!match) return null;
  const base = parseFloat(match[1]);
  const suffix = match[2];
  if (suffix === 'k') return base * 1000;
  if (suffix === 'm') return base * 1000000;
  if (suffix === 'b') return base * 1000000000;
  return base;
}

function extractFilters(query: string): { filters: FilterRule[]; descriptions: string[] } {
  const lower = query.toLowerCase();
  const filters: FilterRule[] = [];
  const descriptions: string[] = [];

  // Category filter
  for (const [keyword, category] of Object.entries(CATEGORY_KEYWORDS)) {
    if (lower.includes(keyword)) {
      filters.push({ field: 'category', operator: '==', value: category });
      descriptions.push(`Category = ${category}`);
      break;
    }
  }

  // Verified filter
  if (lower.includes('verified') && !lower.includes('not verified') && !lower.includes('unverified')) {
    filters.push({ field: 'verified', operator: '==', value: true });
    descriptions.push('Verified = true');
  }
  if (lower.includes('unverified') || lower.includes('not verified')) {
    filters.push({ field: 'verified', operator: '==', value: false });
    descriptions.push('Verified = false');
  }

  // Metric + operator + value filters
  for (const [keyword, metric] of Object.entries(METRIC_KEYWORDS)) {
    const keywordIndex = lower.indexOf(keyword);
    if (keywordIndex === -1) continue;

    // Look for operator after the metric keyword
    const afterKeyword = lower.substring(keywordIndex + keyword.length);

    for (const [opKeyword, operator] of Object.entries(COMPARISON_OPERATORS)) {
      const opIndex = afterKeyword.indexOf(opKeyword);
      if (opIndex === -1) continue;

      // Extract number after operator
      const afterOp = afterKeyword.substring(opIndex + opKeyword.length).trim();
      const numberMatch = afterOp.match(/^(\$?\d+(?:\.\d+)?(?:k|m|b)?%?)/i);
      if (!numberMatch) continue;

      let valueStr = numberMatch[1].replace(/[$%]/g, '');
      const num = parseNumber(valueStr);
      if (num === null) continue;

      filters.push({ field: metric.field, operator, value: num });
      descriptions.push(`${metric.label} ${operator} ${num.toLocaleString()}`);
      break;
    }
  }

  return { filters, descriptions };
}

function extractSort(query: string): { field: string; direction: 'asc' | 'desc'; label: string } | null {
  const lower = query.toLowerCase();

  // "top N by metric" or "best/highest metric"
  for (const keyword of SORT_KEYWORDS) {
    if (lower.includes(keyword)) {
      for (const [metricKey, metric] of Object.entries(METRIC_KEYWORDS)) {
        if (lower.includes(metricKey)) {
          return { field: metric.field, direction: 'desc', label: `${metric.label} (highest first)` };
        }
      }
      // Default sort by trust score
      return { field: 'trust_score', direction: 'desc', label: 'Trust Score (highest first)' };
    }
  }

  for (const keyword of SORT_DESC_KEYWORDS) {
    if (lower.includes(keyword)) {
      for (const [metricKey, metric] of Object.entries(METRIC_KEYWORDS)) {
        if (lower.includes(metricKey)) {
          return { field: metric.field, direction: 'asc', label: `${metric.label} (lowest first)` };
        }
      }
    }
  }

  // "sort by" or "order by"
  const sortMatch = lower.match(/(?:sort|order|rank)\s*(?:by)\s+(\w+)/);
  if (sortMatch) {
    const metricKey = sortMatch[1];
    const metric = METRIC_KEYWORDS[metricKey];
    if (metric) {
      return { field: metric.field, direction: 'desc', label: `${metric.label} (highest first)` };
    }
  }

  return null;
}

function extractLimit(query: string): number | null {
  const lower = query.toLowerCase();
  const match = lower.match(/(?:top|first|show|limit)\s+(\d+)/);
  if (match) return parseInt(match[1], 10);
  return null;
}

function extractComparisonNames(query: string, startups: DbStartup[]): DbStartup[] {
  const lower = query.toLowerCase();
  if (!lower.includes('compare') && !lower.includes('vs') && !lower.includes('versus')) return [];

  const matched: DbStartup[] = [];
  for (const startup of startups) {
    if (lower.includes(startup.name.toLowerCase())) {
      matched.push(startup);
    }
  }
  return matched;
}

function isAggregateQuery(query: string): { type: 'average' | 'sum' | 'count' | 'median' | 'max' | 'min'; metric: string; label: string } | null {
  const lower = query.toLowerCase();

  for (const keyword of AGGREGATE_KEYWORDS) {
    if (!lower.includes(keyword)) continue;

    let aggType: 'average' | 'sum' | 'count' | 'median' | 'max' | 'min' = 'average';
    if (keyword === 'count' || keyword === 'how many') aggType = 'count';
    else if (keyword === 'total' || keyword === 'sum') aggType = 'sum';
    else if (keyword === 'median') aggType = 'median';
    else if (keyword === 'highest') aggType = 'max';
    else if (keyword === 'lowest') aggType = 'min';

    // Find which metric
    for (const [metricKey, metric] of Object.entries(METRIC_KEYWORDS)) {
      if (lower.includes(metricKey)) {
        return { type: aggType, metric: metric.field, label: metric.label };
      }
    }

    // Count queries don't need a specific metric
    if (aggType === 'count') {
      return { type: 'count', metric: '', label: 'startups' };
    }
  }

  return null;
}

// ── Query Execution ──────────────────────────────────────────────────

function applyFilters(startups: DbStartup[], filters: FilterRule[]): DbStartup[] {
  return startups.filter(s => {
    return filters.every(f => {
      const value = getField(s, f.field as string);
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      const filterValue = f.value;

      switch (f.operator) {
        case '>': return numValue > filterValue;
        case '<': return numValue < filterValue;
        case '>=': return numValue >= filterValue;
        case '<=': return numValue <= filterValue;
        case '==': return typeof filterValue === 'boolean' ? value === filterValue : String(value).toLowerCase() === String(filterValue).toLowerCase();
        case '!=': return value !== filterValue;
        default: return true;
      }
    });
  });
}

function applySort(startups: DbStartup[], sort: { field: string; direction: 'asc' | 'desc' }): DbStartup[] {
  return [...startups].sort((a, b) => {
    const aVal = Number(getField(a, sort.field)) || 0;
    const bVal = Number(getField(b, sort.field)) || 0;
    return sort.direction === 'desc' ? bVal - aVal : aVal - bVal;
  });
}

function computeAggregate(
  startups: DbStartup[],
  aggType: 'average' | 'sum' | 'count' | 'median' | 'max' | 'min',
  field: string,
): number {
  if (aggType === 'count') return startups.length;

  const values = startups.map(s => Number(getField(s, field)) || 0);
  if (values.length === 0) return 0;

  switch (aggType) {
    case 'sum': return values.reduce((s, v) => s + v, 0);
    case 'average': return values.reduce((s, v) => s + v, 0) / values.length;
    case 'median': {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    case 'max': return Math.max(...values);
    case 'min': return Math.min(...values);
  }
}

function formatValue(value: number, field: string): string {
  if (['mrr', 'treasury'].includes(field)) return `$${value.toLocaleString()}`;
  if (['growth_rate', 'inflation_rate', 'whale_concentration'].includes(field)) return `${value.toFixed(1)}%`;
  return value.toLocaleString();
}

// ── Main Entry Point ─────────────────────────────────────────────────

/**
 * Execute a natural language query against the startup database.
 *
 * @param query     - Natural language query string
 * @param startups  - All startups to query against
 * @returns         - Structured query result
 */
export function executeQuery(query: string, startups: DbStartup[]): QueryResult {
  if (!query.trim()) {
    return {
      type: 'error',
      answer: 'Please enter a query.',
      startups: [],
      interpretation: '',
      filtersApplied: [],
      sortApplied: null,
      limit: null,
    };
  }

  // Check for comparison query
  const comparisonStartups = extractComparisonNames(query, startups);
  if (comparisonStartups.length >= 2) {
    return {
      type: 'comparison',
      answer: `Comparing ${comparisonStartups.map(s => s.name).join(' vs ')}.`,
      startups: comparisonStartups,
      interpretation: `Compare: ${comparisonStartups.map(s => s.name).join(', ')}`,
      filtersApplied: [],
      sortApplied: null,
      limit: null,
    };
  }

  // Check for aggregate query
  const aggregate = isAggregateQuery(query);
  if (aggregate) {
    const { filters, descriptions } = extractFilters(query);
    const filtered = applyFilters(startups, filters);
    const value = computeAggregate(filtered, aggregate.type, aggregate.metric);
    const formattedValue = aggregate.type === 'count'
      ? value.toString()
      : formatValue(value, aggregate.metric);

    const scope = descriptions.length > 0
      ? ` (filtered by ${descriptions.join(', ')})`
      : ' across all startups';

    return {
      type: 'aggregate',
      answer: `The ${aggregate.type} ${aggregate.label}${scope} is **${formattedValue}**.`,
      startups: filtered,
      aggregateValue: value,
      interpretation: `${aggregate.type}(${aggregate.label})${scope}`,
      filtersApplied: descriptions,
      sortApplied: null,
      limit: null,
    };
  }

  // Standard filter + sort + limit query
  const { filters, descriptions } = extractFilters(query);
  const sort = extractSort(query);
  const limit = extractLimit(query);

  let result = applyFilters(startups, filters);
  if (sort) result = applySort(result, sort);
  if (limit) result = result.slice(0, limit);

  // Generate answer
  let answer: string;
  if (result.length === 0) {
    answer = 'No startups match your criteria.';
    if (descriptions.length > 0) {
      answer += ` Filters applied: ${descriptions.join(', ')}.`;
    }
  } else if (result.length === 1) {
    const s = result[0];
    answer = `Found **${s.name}** (${s.category}) — $${(s.mrr / 1000).toFixed(0)}K MRR, ${Number(s.growth_rate)}% growth, trust score ${s.trust_score}.`;
  } else {
    const filterDesc = descriptions.length > 0 ? ` matching ${descriptions.join(', ')}` : '';
    const sortDesc = sort ? `, sorted by ${sort.label}` : '';
    answer = `Found **${result.length} startups**${filterDesc}${sortDesc}.`;
  }

  return {
    type: result.length === 1 ? 'single' : 'list',
    answer,
    startups: result,
    interpretation: [
      descriptions.length > 0 ? `Filters: ${descriptions.join(', ')}` : 'No filters',
      sort ? `Sort: ${sort.label}` : '',
      limit ? `Limit: ${limit}` : '',
    ].filter(Boolean).join(' | '),
    filtersApplied: descriptions,
    sortApplied: sort?.label ?? null,
    limit,
  };
}

/** Example queries for user guidance */
export const EXAMPLE_QUERIES = [
  'Show me all SaaS startups with MRR over 100k',
  'Top 5 startups by growth rate',
  'Find verified DeFi projects with trust score above 80',
  'Average MRR across all startups',
  'Which startups have whale concentration below 15%?',
  'How many startups are verified?',
  'Startups with growth above 20% and treasury over 1m',
  'Compare PayFlow and DeFiYield',
  'Lowest inflation rate startups',
  'Top 3 by sustainability score',
];
