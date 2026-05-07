/**
 * Narrative Engine
 * ────────────────
 * Transforms raw data into compelling human stories.
 * Makes investing feel like reading a novel, not a spreadsheet.
 *
 * Instead of "MRR: $142,000, Growth: 23.4%"
 * We say: "PayFlow is on a tear — revenue nearly tripled this year,
 *          growing faster than 85% of its peers."
 *
 * Narratives are contextual, comparative, and emotionally resonant.
 */

import type { DbStartup, DbMetricsHistory } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface Narrative {
  /** Headline — the one-line story */
  headline: string;
  /** The full narrative (2-3 sentences) */
  story: string;
  /** Emotional tone */
  tone: 'exciting' | 'positive' | 'neutral' | 'cautious' | 'concerning';
  /** Key number that anchors the story */
  anchorStat: { label: string; value: string };
  /** Context that makes the number meaningful */
  context: string;
  /** What to watch next */
  watchNext: string;
}

export interface StartupNarrative {
  /** Overall company narrative */
  companyStory: Narrative;
  /** Growth narrative */
  growthStory: Narrative;
  /** Financial narrative */
  financialStory: Narrative;
  /** Trust narrative */
  trustStory: Narrative;
  /** One-line pitch (what an investor would tell their partner) */
  elevatorPitch: string;
  /** The "so what" — why should anyone care? */
  soWhat: string;
}

// ── Narrative Builders ───────────────────────────────────────────────

function buildCompanyNarrative(
  startup: DbStartup,
  allStartups: DbStartup[],
): Narrative {
  const growth = Number(startup.growth_rate);
  const categoryPeers = allStartups.filter(s => s.category === startup.category);
  const mrrRank = categoryPeers.filter(s => s.mrr > startup.mrr).length + 1;
  const totalInCategory = categoryPeers.length;

  // Determine the company's "character"
  let archetype: string;
  let tone: Narrative['tone'];
  if (growth >= 30 && startup.trust_score >= 80) {
    archetype = 'rocket ship';
    tone = 'exciting';
  } else if (growth >= 15 && startup.mrr >= 100000) {
    archetype = 'rising star';
    tone = 'positive';
  } else if (growth >= 5 && startup.verified) {
    archetype = 'steady builder';
    tone = 'positive';
  } else if (growth < 0) {
    archetype = 'facing headwinds';
    tone = 'concerning';
  } else {
    archetype = 'early-stage explorer';
    tone = 'neutral';
  }

  const headline = growth >= 20
    ? `${startup.name} is a ${archetype} in ${startup.category}`
    : growth >= 5
    ? `${startup.name} is quietly building momentum`
    : growth >= 0
    ? `${startup.name} is finding its footing`
    : `${startup.name} needs to turn things around`;

  const rankText = mrrRank <= 2
    ? `the #${mrrRank} player`
    : mrrRank <= Math.ceil(totalInCategory / 2)
    ? `in the top half`
    : `still climbing the ranks`;

  const story = `${startup.name} is a ${startup.category} startup on ${startup.blockchain}, ${rankText} among ${totalInCategory} ${startup.category} companies on ChainTrust. ` +
    `With $${(startup.mrr / 1000).toFixed(0)}K in monthly recurring revenue and a team of ${startup.team_size}, ` +
    `${growth >= 15 ? "they're executing at a pace that turns heads" : growth >= 5 ? "they're making steady progress" : "they're working to find product-market fit"}.` +
    `${startup.verified ? ' Their metrics are on-chain verified — what you see is what you get.' : ''}`;

  return {
    headline,
    story,
    tone,
    anchorStat: { label: 'MRR', value: `$${(startup.mrr / 1000).toFixed(0)}K` },
    context: `#${mrrRank} of ${totalInCategory} in ${startup.category}`,
    watchNext: growth >= 15
      ? 'Watch for sustained growth above 15% — the hallmark of product-market fit'
      : 'Watch for an inflection point — growth acceleration would change the thesis',
  };
}

function buildGrowthNarrative(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): Narrative {
  const growth = Number(startup.growth_rate);
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));

  // Growth trajectory
  let trajectory = 'stable';
  if (sorted.length >= 4) {
    const recent = sorted.slice(-3).map(m => Number(m.growth_rate));
    const avg = recent.reduce((s, g) => s + g, 0) / recent.length;
    if (recent[2] > recent[0] * 1.2) trajectory = 'accelerating';
    else if (recent[2] < recent[0] * 0.8) trajectory = 'decelerating';
  }

  // Peer comparison
  const peerGrowth = allStartups
    .filter(s => s.category === startup.category)
    .map(s => Number(s.growth_rate));
  const percentile = peerGrowth.filter(g => g < growth).length / Math.max(peerGrowth.length, 1) * 100;

  let headline: string;
  let tone: Narrative['tone'];

  if (growth >= 30) {
    headline = `${startup.name} is growing at a blistering ${growth}% per month`;
    tone = 'exciting';
  } else if (growth >= 15) {
    headline = `${startup.name} is hitting its stride at ${growth}% monthly growth`;
    tone = 'positive';
  } else if (growth >= 5) {
    headline = `${startup.name} is growing, but hasn't found escape velocity yet`;
    tone = 'neutral';
  } else if (growth > 0) {
    headline = `${startup.name}'s growth is sputtering at ${growth}%`;
    tone = 'cautious';
  } else {
    headline = `${startup.name} is losing ground — revenue declining ${Math.abs(growth)}% per month`;
    tone = 'concerning';
  }

  const story = trajectory === 'accelerating'
    ? `Growth is ${trajectory} — each month is faster than the last. At ${growth}%, ${startup.name} outpaces ${percentile.toFixed(0)}% of ${startup.category} peers. If this holds, they'll double revenue in ${(72 / growth).toFixed(0)} months.`
    : trajectory === 'decelerating'
    ? `Growth has been ${trajectory} recently, dropping from higher rates to ${growth}%. While still positive, the deceleration warrants attention. ${startup.name} sits at the ${percentile.toFixed(0)}th percentile among peers.`
    : `At ${growth}% monthly, ${startup.name} is ${growth >= 15 ? 'outperforming' : growth >= 5 ? 'tracking with' : 'trailing'} the ${startup.category} average. They rank in the ${percentile.toFixed(0)}th percentile.`;

  return {
    headline,
    story,
    tone,
    anchorStat: { label: 'Growth', value: `${growth}% MoM` },
    context: `${percentile.toFixed(0)}th percentile in ${startup.category} | Trajectory: ${trajectory}`,
    watchNext: trajectory === 'accelerating'
      ? 'This is the ideal pattern. Watch for sustainability — can they maintain this pace?'
      : trajectory === 'decelerating'
      ? 'Deceleration is natural at scale, but monitor for a growth stall'
      : 'Look for catalysts — new features, markets, or partnerships that could shift the curve',
  };
}

function buildFinancialNarrative(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
): Narrative {
  const sorted = [...metrics].sort((a, b) => a.month_date.localeCompare(b.month_date));
  let runway = 999;
  let isProfitable = false;
  let burnRate = 0;

  if (sorted.length >= 2) {
    const lastRev = Number(sorted[sorted.length - 1].revenue);
    const lastCost = Number(sorted[sorted.length - 1].costs);
    isProfitable = lastRev >= lastCost;
    burnRate = Math.max(0, lastCost - lastRev);
    runway = burnRate > 0 ? startup.treasury / burnRate : 999;
  }

  let headline: string;
  let tone: Narrative['tone'];

  if (isProfitable) {
    headline = `${startup.name} is profitable — a rare achievement in crypto startups`;
    tone = 'exciting';
  } else if (runway >= 24) {
    headline = `${startup.name} has ${Math.round(runway)} months of runway — plenty of strategic breathing room`;
    tone = 'positive';
  } else if (runway >= 12) {
    headline = `${startup.name} has ${Math.round(runway)} months before they need more capital`;
    tone = 'neutral';
  } else if (runway >= 6) {
    headline = `Clock is ticking — ${startup.name} has ${Math.round(runway)} months of cash left`;
    tone = 'cautious';
  } else {
    headline = `Red alert — ${startup.name} has less than ${Math.round(runway)} months of runway`;
    tone = 'concerning';
  }

  const story = isProfitable
    ? `With $${(startup.mrr / 1000).toFixed(0)}K in monthly revenue exceeding costs, ${startup.name} doesn't depend on external funding. ` +
      `Their $${(startup.treasury / 1000000).toFixed(1)}M treasury is growing, not shrinking. This is the financial independence every startup dreams of.`
    : `${startup.name} burns $${(burnRate / 1000).toFixed(0)}K per month against $${(startup.mrr / 1000).toFixed(0)}K in revenue. ` +
      `With $${(startup.treasury / 1000000).toFixed(1)}M in the treasury, they have roughly ${Math.round(runway)} months of runway. ` +
      `${runway >= 18 ? "Comfortable, but the clock always ticks." : "They need to either grow into profitability or raise more capital soon."}`;

  return {
    headline,
    story,
    tone,
    anchorStat: { label: isProfitable ? 'Status' : 'Runway', value: isProfitable ? 'Profitable' : `${Math.round(runway)} months` },
    context: `Treasury: $${(startup.treasury / 1000000).toFixed(1)}M | Burn: $${(burnRate / 1000).toFixed(0)}K/mo`,
    watchNext: isProfitable
      ? 'Monitor margin expansion and reinvestment strategy'
      : runway >= 12
      ? 'Track burn efficiency — are they getting more revenue per dollar spent?'
      : 'This startup needs funding or a dramatic efficiency improvement',
  };
}

function buildTrustNarrative(startup: DbStartup): Narrative {
  const trust = startup.trust_score;
  const verified = startup.verified;
  const whale = Number(startup.whale_concentration);

  let headline: string;
  let tone: Narrative['tone'];

  if (trust >= 85 && verified) {
    headline = `${startup.name} has earned elite trust status — verified, transparent, and accountable`;
    tone = 'exciting';
  } else if (trust >= 70) {
    headline = `${startup.name} has a strong trust profile that institutional investors look for`;
    tone = 'positive';
  } else if (trust >= 50) {
    headline = `${startup.name}'s trust score is adequate but has room for improvement`;
    tone = 'neutral';
  } else {
    headline = `${startup.name} needs to build more trust before attracting serious capital`;
    tone = 'cautious';
  }

  const story = verified
    ? `${startup.name} has taken the bold step of verifying their metrics on-chain — what they report is cryptographically proven. ` +
      `With a trust score of ${trust}/100${whale < 20 ? ' and excellent token distribution' : ''}, they've built the kind of credibility that opens doors to institutional capital.`
    : `${startup.name}'s metrics are self-reported and unverified. While this is common in early stages, ` +
      `completing on-chain verification would significantly boost their trust score (currently ${trust}/100) ` +
      `and unlock access to institutional investors who require verified data.`;

  return {
    headline,
    story,
    tone,
    anchorStat: { label: 'Trust', value: `${trust}/100` },
    context: `${verified ? 'On-chain verified' : 'Self-reported'} | Whale: ${whale}%`,
    watchNext: verified
      ? 'Maintain verification consistency — gaps erode trust quickly'
      : 'Complete on-chain verification to transform the investment thesis',
  };
}

// ── Main Entry Points ────────────────────────────────────────────────

/**
 * Generate complete narrative package for a startup.
 */
export function generateStartupNarrative(
  startup: DbStartup,
  metrics: DbMetricsHistory[],
  allStartups: DbStartup[],
): StartupNarrative {
  const companyStory = buildCompanyNarrative(startup, allStartups);
  const growthStory = buildGrowthNarrative(startup, metrics, allStartups);
  const financialStory = buildFinancialNarrative(startup, metrics);
  const trustStory = buildTrustNarrative(startup);

  const growth = Number(startup.growth_rate);

  // Elevator pitch — one sentence an investor would say to their partner
  const elevatorPitch = growth >= 20 && startup.verified
    ? `${startup.name} is a verified ${startup.category} rocket ship doing $${(startup.mrr / 1000).toFixed(0)}K MRR at ${growth}% monthly growth — we should move fast.`
    : growth >= 10
    ? `${startup.name} is a ${startup.category} company with solid traction at $${(startup.mrr / 1000).toFixed(0)}K MRR and ${growth}% growth — worth a deeper look.`
    : `${startup.name} is early-stage ${startup.category} at $${(startup.mrr / 1000).toFixed(0)}K MRR — interesting thesis but needs more traction to de-risk.`;

  // The "so what" — why should anyone care?
  const soWhat = growth >= 20 && startup.mrr >= 50000
    ? `At this trajectory, ${startup.name} could reach $${((startup.mrr * Math.pow(1 + growth / 100, 12)) / 1000000).toFixed(1)}M ARR in 12 months. That's a potential category leader.`
    : startup.verified && startup.trust_score >= 75
    ? `${startup.name} stands out for transparency — on-chain verified with a ${startup.trust_score} trust score. In a market full of black boxes, that matters.`
    : `${startup.name} is one to watch. The fundamentals need strengthening, but the ${startup.category} market opportunity is real.`;

  return { companyStory, growthStory, financialStory, trustStory, elevatorPitch, soWhat };
}

/**
 * Generate a one-line insight for a startup card.
 * This is what makes startup cards feel alive instead of just numbers.
 */
export function generateCardInsight(startup: DbStartup, allStartups: DbStartup[]): string {
  const growth = Number(startup.growth_rate);
  const peers = allStartups.filter(s => s.category === startup.category);
  const percentile = Math.round((peers.filter(s => Number(s.growth_rate) < growth).length / Math.max(peers.length, 1)) * 100);

  if (growth >= 30) return `Growing faster than ${percentile}% of ${startup.category} peers`;
  if (growth >= 15 && startup.verified) return `Verified and outperforming — ${growth}% MoM`;
  if (startup.trust_score >= 85) return `Elite trust score — top ${100 - Math.round(peers.filter(s => s.trust_score > startup.trust_score).length / peers.length * 100)}%`;
  if (startup.mrr >= 200000) return `$${(startup.mrr / 1000).toFixed(0)}K MRR — serious traction`;
  if (growth >= 5) return `Steady at ${growth}% — watching for acceleration`;
  if (growth > 0) return `Early traction — ${growth}% growth, building momentum`;
  return `Pre-growth — finding product-market fit`;
}

/**
 * Generate a brief comparative narrative between two startups.
 */
export function generateComparisonNarrative(a: DbStartup, b: DbStartup): string {
  const aGrowth = Number(a.growth_rate);
  const bGrowth = Number(b.growth_rate);

  if (aGrowth > bGrowth * 1.5 && a.mrr > b.mrr) {
    return `${a.name} dominates on both growth and revenue — ${b.name} needs a catalyst to catch up.`;
  }
  if (a.mrr > b.mrr * 2 && bGrowth > aGrowth * 1.5) {
    return `Classic tortoise vs hare: ${a.name} has scale, but ${b.name} is growing much faster.`;
  }
  if (a.trust_score > b.trust_score + 20) {
    return `${a.name} has a significant trust advantage (${a.trust_score} vs ${b.trust_score}) — this matters for institutional capital.`;
  }
  return `${a.name} and ${b.name} are closely matched — dig into the details to find the edge.`;
}
