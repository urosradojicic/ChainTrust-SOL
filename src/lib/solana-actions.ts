/**
 * Solana Actions & Blinks
 * ───────────────────────
 * Generate shareable verification links (Blinks) that can be embedded
 * on Twitter, Discord, websites — anyone can verify a startup with one click.
 *
 * Solana Actions are URLs that return serialized transactions.
 * Blinks render these as interactive cards on social platforms.
 *
 * This module generates the metadata for ChainTrust verification Blinks.
 */

import type { DbStartup } from '@/types/database';

// ── Types ────────────────────────────────────────────────────────────

export interface BlinkMetadata {
  /** Action icon URL */
  icon: string;
  /** Action title */
  title: string;
  /** Action description */
  description: string;
  /** Action label (button text) */
  label: string;
  /** Links to related actions */
  links?: {
    actions: BlinkAction[];
  };
  /** Whether this action is disabled */
  disabled?: boolean;
  /** Error message if disabled */
  error?: { message: string };
}

export interface BlinkAction {
  /** Action endpoint URL */
  href: string;
  /** Button label */
  label: string;
  /** Optional parameters */
  parameters?: BlinkParameter[];
}

export interface BlinkParameter {
  name: string;
  label: string;
  required: boolean;
}

export interface ShareableLink {
  /** Full URL for sharing */
  url: string;
  /** Title for social sharing */
  title: string;
  /** Description for social sharing */
  description: string;
  /** Twitter share URL */
  twitterShareUrl: string;
  /** Embeddable HTML badge */
  embedHtml: string;
  /** Markdown badge */
  markdownBadge: string;
}

// ── Blink Metadata Generators ────────────────────────────────────────

/**
 * Generate Blink metadata for verifying a startup's metrics.
 */
export function generateVerifyBlink(startup: DbStartup, baseUrl: string): BlinkMetadata {
  return {
    icon: `${baseUrl}/logo.svg`,
    title: `Verify ${startup.name} on ChainTrust`,
    description: `${startup.name} is a ${startup.category} startup on ${startup.blockchain} with ${startup.verified ? 'verified' : 'unverified'} metrics. Trust Score: ${startup.trust_score}/100. MRR: $${(startup.mrr / 1000).toFixed(0)}K.`,
    label: 'Verify On-Chain',
    links: {
      actions: [
        {
          href: `${baseUrl}/api/actions/verify?startup=${startup.id}`,
          label: `Verify ${startup.name}`,
        },
        {
          href: `${baseUrl}/startup/${startup.id}`,
          label: 'View Details',
        },
      ],
    },
  };
}

/**
 * Generate Blink metadata for a governance vote.
 */
export function generateVoteBlink(
  proposalTitle: string,
  proposalId: string,
  baseUrl: string,
): BlinkMetadata {
  return {
    icon: `${baseUrl}/logo.svg`,
    title: `Vote: ${proposalTitle}`,
    description: `Cast your vote on this ChainTrust governance proposal. Voting power is based on your staked CMT tokens.`,
    label: 'Vote Now',
    links: {
      actions: [
        { href: `${baseUrl}/api/actions/vote?proposal=${proposalId}&vote=for`, label: 'Vote For' },
        { href: `${baseUrl}/api/actions/vote?proposal=${proposalId}&vote=against`, label: 'Vote Against' },
        { href: `${baseUrl}/api/actions/vote?proposal=${proposalId}&vote=abstain`, label: 'Abstain' },
      ],
    },
  };
}

/**
 * Generate Blink metadata for staking CMT tokens.
 */
export function generateStakeBlink(baseUrl: string): BlinkMetadata {
  return {
    icon: `${baseUrl}/logo.svg`,
    title: 'Stake CMT on ChainTrust',
    description: 'Stake CMT tokens to unlock premium features, earn rewards, and participate in governance. Tiers: Basic (any amount), Pro (5,000+ CMT), Whale (50,000+ CMT).',
    label: 'Stake CMT',
    links: {
      actions: [
        {
          href: `${baseUrl}/api/actions/stake`,
          label: 'Stake CMT',
          parameters: [
            { name: 'amount', label: 'Amount of CMT to stake', required: true },
          ],
        },
      ],
    },
  };
}

// ── Shareable Link Generators ────────────────────────────────────────

/**
 * Generate shareable verification link for a startup.
 * Includes social media share URLs and embeddable badges.
 */
export function generateShareableLink(startup: DbStartup, baseUrl: string): ShareableLink {
  const verifyUrl = `${baseUrl}/verify?startup=${startup.id}`;
  const detailUrl = `${baseUrl}/startup/${startup.id}`;

  const title = `${startup.name} — Verified on ChainTrust`;
  const description = `Trust Score: ${startup.trust_score}/100 | ${startup.category} | $${(startup.mrr / 1000).toFixed(0)}K MRR | ${startup.verified ? 'On-chain verified' : 'Self-reported'}`;

  const twitterText = encodeURIComponent(
    `${startup.name} is verified on @ChainTrust with a Trust Score of ${startup.trust_score}/100.\n\n` +
    `${startup.category} | $${(startup.mrr / 1000).toFixed(0)}K MRR | ${Number(startup.growth_rate)}% Growth\n\n` +
    `Verify on-chain:`
  );
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${twitterText}&url=${encodeURIComponent(verifyUrl)}`;

  const embedHtml = `<a href="${detailUrl}" target="_blank" rel="noopener"><img src="${baseUrl}/api/badge/${startup.id}" alt="ChainTrust Verified: ${startup.name} — Trust Score ${startup.trust_score}/100" /></a>`;

  const markdownBadge = `[![ChainTrust Verified](${baseUrl}/api/badge/${startup.id})](${detailUrl})`;

  return {
    url: verifyUrl,
    title,
    description,
    twitterShareUrl,
    embedHtml,
    markdownBadge,
  };
}

/**
 * Generate an actions.json manifest for the Solana Actions standard.
 * This would be served at /.well-known/actions.json
 */
export function generateActionsManifest(baseUrl: string): object {
  return {
    rules: [
      { pathPattern: '/api/actions/verify*', apiPath: '/api/actions/verify*' },
      { pathPattern: '/api/actions/vote*', apiPath: '/api/actions/vote*' },
      { pathPattern: '/api/actions/stake*', apiPath: '/api/actions/stake*' },
    ],
  };
}

/**
 * Generate Open Graph meta tags for a startup verification page.
 * Used for rich link previews on social media.
 */
export function generateOGTags(startup: DbStartup, baseUrl: string): Record<string, string> {
  return {
    'og:title': `${startup.name} — ChainTrust Verified`,
    'og:description': `Trust Score: ${startup.trust_score}/100 | ${startup.category} on ${startup.blockchain} | $${(startup.mrr / 1000).toFixed(0)}K MRR | ${Number(startup.growth_rate)}% MoM Growth`,
    'og:image': `${baseUrl}/api/og/${startup.id}`,
    'og:url': `${baseUrl}/startup/${startup.id}`,
    'og:type': 'website',
    'twitter:card': 'summary_large_image',
    'twitter:title': `${startup.name} — ChainTrust Verified`,
    'twitter:description': `Trust Score: ${startup.trust_score}/100 | ${startup.verified ? 'On-chain verified' : 'Self-reported'} metrics`,
    'twitter:image': `${baseUrl}/api/og/${startup.id}`,
  };
}
