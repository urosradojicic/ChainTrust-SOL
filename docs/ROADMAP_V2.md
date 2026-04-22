# ChainTrust Roadmap V2 — Deep Research & Implementation Plan

**Date:** April 22, 2026
**Hackathon deadline:** May 11, 2026 (19 days)
**Scope:** Blockchain, quant, UI/UX, backend, algorithms, devtools
**Sources:** 5 parallel Opus 4.7 research agents + internet competitive analysis (Apr 2026)

---

## Research Findings Summary

### A. Blockchain (Anchor program) gaps
- Milestone-based escrow (release funds on KPI hit)
- Real oracle integration (Pyth + Switchboard fallback)
- Multi-sig treasury (currently single authority)
- Recurring / subscription payments
- Revenue-sharing / protocol fee collection
- Dispute resolution (council-based)
- Cross-program invocations to Jupiter, Serum, Marinade
- Token bonding curves
- Time-locked vesting (only soulbound badges exist)
- Access control: only binary authority vs caller — no RBAC roles

### B. Quant model gaps
- Black-Scholes / binomial option pricing
- Kalman filter for noisy-metric smoothing
- LSTM / transformer forecasting (pure JS)
- Cointegration (Johansen test) for pairs trading
- Hidden Markov regime switching at startup level
- Portfolio optimization (Markowitz, Black-Litterman)
- Copula tail-dependence modeling
- Kelly criterion for position sizing
- Rolling Sharpe / Sortino / Calmar visualization (computed but unused in UI)
- VaR/CVaR dashboard (computed but hidden in SDK)

### C. UI/UX gaps
- Command palette missing pro features (slash commands, help overlay `?`)
- No sortable column headers with indicators, no sparklines in tables
- No drag-to-reorder watchlists, no customizable dashboards
- No mobile bottom sheets for filters
- Accessibility: empty alt text, WCAG AA contrast gaps, no `prefers-reduced-motion`
- No breadcrumbs on detail pages
- No real-time price tickers in main dashboard
- Charts lack dual-axis comparisons, heatmaps, candlesticks

### D. Backend / database gaps
- **Critical:** zero indexes across any table (sequential scans at scale)
- Overly permissive RLS on proposals + votes (any auth user can insert)
- React Query missing `staleTime` / `gcTime` (refetches on every nav)
- Silent error fallbacks hide real outages
- Full-text search absent (needed for screener)
- Notifications, deal pipeline, documents, API keys, webhooks — all missing
- No consent log / data export audit (GDPR blocker)

### E. Intelligence library gaps
- No sentiment analysis (news, social, press)
- No topic modeling (LDA, BERT-lite)
- No causal inference (propensity score, DoubleML)
- No change-point detection (PELT, Bayesian blocks)
- No SHAP-style explainability across models (only gradient-boost has it)
- No ensemble voting / stacking across existing models
- No collaborative filtering for investor-startup matching
- No ARIMA-residual anomaly detection
- No Granger causality / Durbin-Watson

### F. Competitor parity gaps (Apr 2026 market)
- **Arkham-style entity dossiers** — highest visual differentiator
- **Nansen-style smart-money labels** — seed ~200 known Solana VC wallets
- **Dune-style query editor** — at minimum saved-view presets over our data
- **Pitchbook-grade profile fields** — founding team, rounds, valuations, investors
- **Bloomberg-style command palette** — Cmd+K with slash commands, `?` shortcut overlay
- **Carta token cap tables** — on-chain vesting reader (Streamflow, Jupiter Lock)
- **AngelList Deal Rooms** — fundraise pipeline with pledge tracking
- **Helius real-time webhooks** — sub-second treasury alerts
- **Squads multi-sig detection** — "3-of-5 vault, 24h timelock" badge
- **Light ZK Compression** — 5000× cost reduction for proof storage
- **Pyth Publisher** — publish verification scores as an on-chain oracle feed

---

## Five Competing Implementation Plans

### Plan A — "Hackathon Winner" (judge-optimized)
Pure focus on May 11 demo. Tier-1 must-haves from internet research only.

**Scope:** Command palette, Nansen-style smart-money labels, Arkham-style entity
dossiers, Pitchbook profile fields, Helius webhooks, Squads multisig detection,
AngelList Deal Rooms, Light ZK Compression narrative.

**Strengths:** Highest probability of winning. Every feature is visible in a
demo. Matches the pattern of 2025 Cypherpunk winners (Unruggable, Pythia).
Narrative: "Arkham + Nansen + Carta + Squads, purpose-built for startups."

**Weaknesses:** Shallow on math. Judges with quant backgrounds will notice
missing substance. No compliance / institutional story beyond the demo.

### Plan B — "Institutional Grade" (BlackRock-ready)
Focus on what LP-grade capital actually requires: SOC2 audit trail, multi-tenancy,
compliance engine, notifications, SSO, data export, document management.

**Scope:** User audit log, consent log, notifications, deal pipeline tables,
file storage (pitch decks / data rooms), API keys + rate limiting, multi-tenant
orgs, email digests, GDPR data export.

**Strengths:** Unblocks BlackRock/Vanguard/YC-grade sales. Differentiated from
95% of hackathon projects. Creates monetization path (enterprise tier).

**Weaknesses:** Judges won't care in 19 days. Most features invisible in a
3-min demo. High engineering load for dashboard-invisible work.

### Plan C — "AI / Quant Powerhouse"
Deepen the intelligence stack — this is where ChainTrust's moat lives.

**Scope:** Sentiment analysis (lexicon + headline parsing), change-point
detection (PELT), Granger causality, Durbin-Watson, SHAP values for all
models, ensemble voting (GB + IF + Bayesian), causal inference (propensity
score matching), collaborative filtering, attention-weighted time-series.

**Strengths:** Unique competitive moat — nobody in the Solana space has this.
Institutional capital loves explainability. "Why is trust score 75?" has a
real answer. Deep intellectual content.

**Weaknesses:** Hard to demo visually. Judges skim the UI; they won't read a
SHAP waterfall. Time-consuming to implement cleanly.

### Plan D — "Blockchain-First"
Push the Anchor program into territory no other hackathon project will have.

**Scope:** Milestone escrow, recurring subscription payments, multi-sig via
Squads CPI, revenue-sharing, dispute resolution council, CPI to Jupiter for
treasury swaps, Light ZK Compression for proof storage, Pyth Publisher for
verification score as oracle feed, Token-2022 transfer hook for soulbound
badges.

**Strengths:** Peak Solana-primitive narrative. Judges running a Solana
accelerator are looking for exactly this. Novel on-chain patterns.

**Weaknesses:** Program complexity increases audit surface. Each new
instruction needs IDL + hook + UI. Risk of broken demos if integrations fail.

### Plan E — "Developer Platform"
Lean into the existing SDK + plugin scaffolding. Make ChainTrust a platform
other builders extend.

**Scope:** Full SDK docs site, plugin marketplace, API keys + rate limiting,
webhook subscriptions, public REST endpoints, GraphQL layer, embeddable
widgets (verification badge iframe), npm package, example plugins.

**Strengths:** "Stripe for startup verification" narrative. Sustainable
long-term strategy. SDK foundation already exists (`src/sdk/`).

**Weaknesses:** Takes 6+ months to build a real developer community.
Hackathon judges won't evaluate a platform story from launch-day state.

---

## Debate / Synthesis

| Dimension | A | B | C | D | E |
|-----------|---|---|---|---|---|
| Demo-stopping features | **9/10** | 3/10 | 5/10 | 8/10 | 4/10 |
| Judge appeal (Frontier) | **10/10** | 4/10 | 7/10 | **9/10** | 5/10 |
| Intellectual depth | 5/10 | 7/10 | **10/10** | 8/10 | 7/10 |
| Institutional credibility | 6/10 | **10/10** | 8/10 | 8/10 | 7/10 |
| Time cost (19 days) | 60h | 120h | 80h | 70h | 150h |
| Solana-native | 7/10 | 3/10 | 4/10 | **10/10** | 6/10 |
| Durability post-hackathon | 6/10 | **9/10** | **9/10** | 7/10 | **9/10** |

**Plan A alone** wins the hackathon but leaves no moat.
**Plan B alone** is invisible to judges.
**Plan C alone** is hard to demo in 3 minutes.
**Plan D alone** looks like a library integration exercise.
**Plan E alone** is a post-hackathon strategy.

**The right answer is to cross-pollinate:**
- Plan A's Entity Dossier, Smart Money labels, Command Palette (visible)
- Plan D's Squads detection, Helius webhooks, ZK Compression (Solana moat)
- Plan C's sentiment + change-point + SHAP (intellectual depth)
- Plan B's indexes + RLS fixes (infrastructure, few hours)
- Plan E's narrative only (no implementation pre-May 11)

---

## Final Unified Plan — "ChainTrust V2"

**Thesis:** Win Frontier by stacking four high-signal layers the judges and
investors can't ignore:
1. **Visible Bloomberg-grade UI** (Command Palette, Entity Dossier, Smart Money)
2. **Solana-primitive depth** (Squads, Helius real-time, ZK Compression)
3. **Intelligence the competition can't match** (Sentiment, SHAP, Change Points)
4. **Infrastructure that scales** (indexes, RLS, cache)

Leave Plans B and E for post-hackathon.

---

## Phased Upgrade List — 8 Phases

Every phase is designed to ship independently — if time runs short, earlier
phases are demo-ready on their own.

### Phase 1 — Infrastructure Hardening (Day 1-2, ~8h)
**Goal:** Prevent performance regressions as Phases 2-8 add features.

1. Create migration `20260422_indexes_and_rls.sql`:
   - Index `startups(blockchain, verified, category)`
   - Index `metrics_history(startup_id, month_date DESC)`
   - Index `startup_audit_log(startup_id, changed_at DESC)`
   - Index `votes(proposal_id, user_id)`
   - Index `funding_rounds(startup_id, round_date DESC)`
   - Index `profiles(user_id)`
2. Tighten RLS:
   - `proposals` INSERT → admin + investor role only (currently any auth user)
   - `votes` INSERT → investor + admin role only, rate-limit via trigger
3. React Query: set `staleTime: 5 min`, `gcTime: 30 min`, `refetchOnWindowFocus: false`
4. CHECK constraints: `trust_score 0-100`, `sustainability_score 0-100`, `metrics_history` positive non-null
5. Replace silent error swallowing with `logDataError()` helper in `src/lib/error-handler.ts`

**Deliverables:** one migration file, one helper, updated hooks.

### Phase 2 — Bloomberg Command Palette v2 (Day 3, ~6h)
**Goal:** Make the product feel institutional in one keystroke.

1. Expand `src/components/CommandPalette.tsx` with slash commands:
   - `/screen <filter>` — jump to Screener with pre-applied filter
   - `/compare <a> <b>` — open /compare with two startups
   - `/export <csv|pdf>` — trigger export on current page
   - `/go <startup>` — navigate to startup detail (Bloomberg `<GO>`)
   - `/watch <startup>` — add to watchlist
2. Help overlay on `?` key: full keyboard-shortcut list, keyboard visualization
3. Bloomberg-style ticker syntax `$CT-<startup-id>` that routes anywhere
4. Command history in `localStorage`, arrow-key replay

**Deliverables:** CommandPalette.tsx v2, new `KeyboardHelpOverlay.tsx`.

### Phase 3 — Arkham-Style Entity Dossier (Day 4-5, ~14h)
**Goal:** The single biggest visual upgrade available.

1. New page `src/pages/EntityDossier.tsx` at route `/entity/:id`
2. Layout inspired by Arkham's BlackRock profile:
   - Header: entity name, verified badge, tier (Bronze/Silver/Gold/Platinum)
   - Holdings graph (USD value over time)
   - Wallet roster (all addresses associated with this startup)
   - Tag cloud (industry, stage, verified, sustainable, etc.)
   - Related entities (investors, partners, competitors from knowledge graph)
3. `src/lib/entity-aggregator.ts` — merges multi-wallet holdings per entity
4. Private Labels: user-created tags persisted to Supabase (`user_private_tags` table)

**Deliverables:** New page, new lib, new table migration.

### Phase 4 — Nansen Smart Money + Helius Real-Time (Day 6-7, ~15h)
**Goal:** Two integrations, two huge signals.

**4a. Smart Money (8h)**
1. `src/lib/smart-wallets.ts` — curated list of ~200 Solana VC/angel/fund wallets
   (a16z Crypto, Multicoin, Solana Ventures, Jump, Pantera, Polychain, Framework,
   Delphi, Hashed, DragonFly, Paradigm, GSR, Sequoia Capital Crypto, Variant,
   Electric Capital, etc.)
2. "Smart Investor Activity" panel on each startup — shows when any labeled
   wallet interacted with treasury or minted a verification cert
3. Notification badge on Dashboard when smart money touches a watchlisted startup

**4b. Helius Real-Time (6h)**
1. `src/lib/helius.ts` wrapper — DAS endpoint for cNFT reads, enhanced tx parsing
2. Webhook handler Supabase Edge Function subscribes to startup treasury addrs
3. Realtime Supabase channel fires toast + sidebar alert within 2s of on-chain tx
4. Transaction history uses Helius `parsed` labels ("Jupiter swap", "Staking deposit", "cNFT mint") — zero more base58 signatures

**Deliverables:** Two libs, one Edge Function, updated transaction history component.

### Phase 5 — Squads Multisig + Pitchbook Profile Fields (Day 8-9, ~12h)
**Goal:** Trust signals + data depth.

**5a. Squads Detection (5h)**
1. `src/lib/squads-detect.ts` — identifies Squads vault via PDA pattern match
2. Badge on Entity Dossier: "3-of-5 Squads vault, 24h timelock"
3. Deep-link to app.squads.so
4. Migrate `MultiSigTreasury.tsx` to display real Squads data when detected

**5b. Pitchbook Profile Fields (7h)**
1. Extend `startups` schema: `founding_team JSONB`, `headquarters`, `employee_count`,
   `linkedin_url`, `sector_tags TEXT[]`, `stage` (pre-seed/seed/A/B/C)
2. Round history migration: `funding_rounds` already exists — add `round_type`,
   `lead_investor`, `participating_investors JSONB`, `safe_or_priced`
3. Investor roster on startup detail — links verified wallet to human investor
4. "Cap Table Snapshot" component reading on-chain token distribution

**Deliverables:** Two new libs, one migration, extended forms/pages.

### Phase 6 — Intelligence: Sentiment + Change Points + SHAP (Day 10-12, ~16h)
**Goal:** Competition-beating intellectual depth.

**6a. Sentiment lexicon (4h)**
1. `src/lib/sentiment.ts` — financial lexicon (5k positive / 5k negative terms
   curated from Loughran-McDonald dictionary)
2. Score startup description, recent audit entries, proposals
3. Display sentiment timeline in Entity Dossier

**6b. Change-point detection — PELT (5h)**
1. `src/lib/change-points.ts` — Pruned Exact Linear Time algorithm
2. Run on monthly revenue / MAU / runway time series
3. Annotate charts with "inflection detected at month N" badges
4. Wire into Red Flag engine (`red-flag-detection.ts`) as a new flag type

**6c. SHAP-like explainability (5h)**
1. `src/lib/shap-approx.ts` — coalition-based Shapley approximation (20 samples)
2. Apply to: reputation-score, deal-scoring, red-flag-detection, survival-predictor
3. Add "Why this score?" button on each scoring surface — opens waterfall chart

**6d. Ensemble voting (2h)**
1. `src/lib/ensemble.ts` — weighted average of gradient-boost + isolation-forest +
   bayesian predictions, with calibration
2. Replaces single-model scoring in deal-scoring.ts

**Deliverables:** Four libs, one UI component (WaterfallExplanation.tsx).

### Phase 7 — AngelList Deal Rooms (Day 13-14, ~10h)
**Goal:** Position ChainTrust as the deal pipeline for Solana.

1. New page `src/pages/DealRoom.tsx` at route `/deals/:id`
2. Schema: `deal_rooms` table (startup_id, target_amount, min_ticket,
   accepted_tokens, deadline, terms JSONB, status)
3. Pledge table already exists — extend with `deal_room_id` FK + `pledge_status`
4. On-chain pledge flow: stake in escrow PDA until deadline, auto-refund if
   target not hit (milestone-escrow pattern, simplified)
5. "Follow Investor" — alert when a smart-money wallet pledges
6. Leaderboard of active deals on main Dashboard

**Deliverables:** New page, migration, new Anchor instruction `create_deal_room`.

### Phase 8 — Light ZK Compression + Pyth Publisher (Day 15-17, ~12h)
**Goal:** Solana-native narrative peaks.

**8a. ZK Compression (6h)**
1. Migrate `publish_metrics` proof hashes from regular PDAs to compressed state
   via Light Protocol SDK
2. Cost delta prominently shown: "1M verifications: $0.26k → $50"
3. Landing page + Hackathon page copy updates

**8b. Pyth Publisher (6h — stretch goal)**
1. Register ChainTrust as a Pyth publisher (devnet first)
2. Publish aggregate ecosystem "Trust Score Index" as a Pyth feed
3. Show on Hackathon page + include in demo script
4. If time constrained: skip real publisher, prototype with Switchboard custom job

**Deliverables:** Light SDK integration, Pyth publisher setup.

---

## Time Budget

| Phase | Hours | Cumulative | Day (starting Apr 22) |
|-------|-------|------------|----------------------|
| 1     | 8     | 8          | Apr 23               |
| 2     | 6     | 14         | Apr 24               |
| 3     | 14    | 28         | Apr 26               |
| 4     | 15    | 43         | Apr 28               |
| 5     | 12    | 55         | Apr 30               |
| 6     | 16    | 71         | May 2                |
| 7     | 10    | 81         | May 4                |
| 8     | 12    | 93         | May 6                |
| Demo + submission | 15 | 108 | May 7-11 |

**Buffer:** 4 days for polish, demo video, submission form.

---

## Quality Gates

Every phase must pass before the next begins:
1. `npm run build` — clean, zero errors
2. `npm run typecheck` — no TS errors
3. Manual smoke test — feature works with both real data and demo fallback
4. Test credentials (admin/investor/startup@chainmetrics.io) still work
5. Commit with descriptive message + co-author
6. Push to master

---

## What We Explicitly Are Not Doing Pre-May 11

These belong to ChainTrust V3 (post-hackathon):
- Plan B features: multi-tenant orgs, SSO, email digests, SOC2 audit, GDPR data export
- Plan C deep: causal inference with propensity score matching, LSTM forecasting,
  copula tail models, portfolio optimization
- Plan E entirety: SDK docs site, plugin marketplace, npm package, public REST API,
  GraphQL, embeddable widgets
- Mobile-native app
- Email notification system
- Quant-finance extensions (Black-Scholes, Kalman, HMM)

These are all valuable — they're just not demo-winning in 19 days.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Light Protocol integration fails | Medium | Phase 8a | Fall back to narrative-only mention |
| Pyth Publisher takes >6h | High | Phase 8b | Use Switchboard custom job prototype instead |
| Helius webhook infrastructure complex | Medium | Phase 4b | Poll every 10s instead; keep in UI |
| Supabase migration breaks demo data | Low | Phase 1 | Test against DEMO_STARTUPS fallback first |
| Squads PDA pattern detection false-positive | Medium | Phase 5a | Confirm via Squads IDL parse |
| SHAP approximation too slow | Low | Phase 6c | Cap sample count at 20, cache results |

---

## Success Criteria

We win Frontier if the judges can, in a 3-minute demo:
1. See a **live Pyth SOL/USD ticker** in the hero (already shipped)
2. Press **Cmd+K**, type `/go Acme`, land on an Entity Dossier page
3. Watch a **Smart Money Badge** light up when a labeled wallet touches the startup
4. See a **Squads multisig detection** confirming "3-of-5 vault"
5. Click **"Why this trust score?"** and see a SHAP waterfall
6. See a **Change-Point marker** on a revenue chart with "inflection detected"
7. Hear "all of this runs at 5000× lower cost via ZK Compression" — with the math
8. Close with "ChainTrust publishes the Solana Startup Trust Index as a Pyth oracle feed"

If we hit 6 of 8, we're in the top 20. If we hit all 8, we're the Grand Champion.
