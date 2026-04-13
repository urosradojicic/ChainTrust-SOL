# ChainTrust-SOL — Complete Architecture Documentation

> **Generated:** April 13, 2026
> **Total Lines of Code:** 56,203
> **Engine Libraries:** 75
> **Pages:** 24
> **Algorithms:** 17

---

## Quick Start

```typescript
// One import to access everything
import { ChainTrust } from '@/sdk';

// Run comprehensive analysis
const result = await ChainTrust.analyze(startup, metrics, allStartups);

// Individual capabilities
const memo = await ChainTrust.memos.generate(startup, metrics, peers);
const risk = await ChainTrust.risk.quant(startup, metrics, peers, allMetrics);
const dna = await ChainTrust.intelligence.dna(startup, metrics, peers, allMetrics);
const proof = await ChainTrust.zk.generateProof('mrr', 142000, 50000, 500000);
```

---

## Code Statistics

| Category | Lines | Files |
|----------|-------|-------|
| Engine Libraries (src/lib/) | 24,276 | 75 |
| Components (src/components/) | 12,310 | 60+ |
| Pages (src/pages/) | 9,006 | 24 |
| Hooks (src/hooks/) | 2,006 | 9 |
| SDK (src/sdk/) | 1,108 | 11 |
| Blockchain/Rust (blockchain/) | 1,448 | 3 |
| Contexts (src/contexts/) | 406 | 3 |
| CSS | 252 | 1 |
| Documentation (*.md) | 3,090 | 7 |
| **TOTAL** | **56,203** | — |

---

## 75 Engine Libraries

### AI & Analytics (11)
| Engine | Function | Lines |
|--------|----------|-------|
| `red-flag-detection` | 6-category statistical anomaly detection | ~340 |
| `reputation-score` | ChainTrust Score (CTS) — 100-point, 6 components | ~320 |
| `claim-verification` | Cross-references 7 claim categories vs data | ~380 |
| `investment-memo` | Institutional-grade investment memo generator | ~350 |
| `competitive-intel` | Competitive landscape, moat ID, battle cards | ~310 |
| `cohort-analysis` | Retention curves, unit economics, PMF detection | ~330 |
| `governance-analytics` | DAO health, voting patterns, power concentration | ~270 |
| `revenue-quality` | 7-dimension revenue quality scoring | ~310 |
| `founder-score` | 6-dimension founder/team assessment | ~310 |
| `audit-intelligence` | Data manipulation detection from change history | ~280 |
| `ai-agent` | 5 autonomous agent types for portfolio monitoring | ~360 |

### Machine Learning (3)
| Engine | Algorithm | Lines |
|--------|-----------|-------|
| `isolation-forest` | Random binary tree anomaly detection (proper ML) | ~350 |
| `gradient-boost` | Decision stump ensemble with residual fitting | ~310 |
| `pattern-recognition` | 8 growth patterns (T2D3, hockey stick, etc.) | ~340 |

### Statistics (2)
| Engine | Tests | Lines |
|--------|-------|-------|
| `statistical-tests` | Mann-Whitney U, KS, Welch's t-test, proportion | ~280 |
| `bayesian-inference` | Normal-Normal conjugate, predictive probabilities | ~310 |

### Quantitative Finance (5)
| Engine | Metrics | Lines |
|--------|---------|-------|
| `quant-risk` | VaR, Sharpe, Sortino, Calmar, Beta, Alpha, factors | ~380 |
| `portfolio-optimizer` | Markowitz efficient frontier, 4 strategies | ~310 |
| `return-calculator` | IRR (Newton-Raphson), TVPI, DPI, RVPI, MOIC | ~280 |
| `signal-engine` | Momentum, mean reversion, cross-sectional, quality | ~310 |
| `fx-engine` | 14 currencies, FX VaR, hedging, settlement | ~260 |

### Financial Instruments (10)
| Engine | Instrument | Lines |
|--------|-----------|-------|
| `term-sheet` | SAFE, convertible, series preferred + benchmarks | ~350 |
| `cap-table` | Shareholders, waterfall, SAFE auto-conversion | ~330 |
| `milestone-escrow` | Programmable money — oracle-verified auto-release | ~300 |
| `prediction-market` | LMSR binary markets, oracle-resolved | ~320 |
| `streaming-rewards` | Per-second reward accrual at 60fps | ~230 |
| `valuation-suite` | 5 methods: multiples, comps, scorecard, Berkus, VC | ~340 |
| `time-series` | Trend decomposition, changepoints, SNR, forecast | ~350 |
| `deal-flow-analytics` | Funnel metrics, conversion, velocity, forecast | ~300 |
| `protocol-revenue` | Real yield vs inflationary yield decomposition | ~280 |
| `deal-scoring` | 14-criteria weighted scoring matrix | ~300 |

### Deep Intelligence (7)
| Engine | What It Does | Lines |
|--------|-------------|-------|
| `startup-dna` | 16D fingerprint, 8 archetypes, cosine similarity | ~360 |
| `network-effects` | 5 network effect types, viral coefficient | ~280 |
| `moat-scorer` | Buffett-style 6-moat analysis, competitive shield | ~310 |
| `tokenomics-simulator` | 24-month supply projection, health scoring | ~250 |
| `execution-velocity` | 5 velocity metrics, speed grades (Lightning→Stalled) | ~280 |
| `lifecycle-detector` | 7 stages, transition signals, timing assessment | ~300 |
| `smart-money` | Whale wallet intelligence, flow direction | ~280 |

### Simulation (4)
| Engine | Method | Lines |
|--------|--------|-------|
| `monte-carlo` | 5K iterations, Box-Muller, fan charts | ~280 |
| `survival-predictor` | Sigmoid-weighted probability badges | ~250 |
| `scenario-planning` | 8 what-if templates, 12-month projections | ~290 |
| `auto-simulator` | Background RAF processing, job queue, pub/sub | ~280 |

### Experience (7)
| Engine | Purpose | Lines |
|--------|---------|-------|
| `narrative-engine` | Transforms metrics into compelling stories | ~300 |
| `command-palette` | Cmd+K fuzzy search across everything | ~250 |
| `feature-discovery` | Contextual hints, never overwhelming | ~200 |
| `investor-engagement` | Daily briefings, streaks, 20 badges, onboarding | ~400 |
| `investor-preferences` | 8 investor type presets, personalization | ~280 |
| `conviction-tracker` | Decision journal, bias detection, hit rate | ~300 |
| `nl-query` | Natural language → structured database queries | ~320 |

### Infrastructure (12)
| Engine | Purpose | Lines |
|--------|---------|-------|
| `wallet-abstraction` | Provider-agnostic wallet for Privy/embedded | ~160 |
| `solana-actions` | Shareable Blinks for social media | ~180 |
| `deal-room` | Data room with SHA-256 hashing | ~280 |
| `investment-flow` | 9-stage pipeline, 24-item DD checklist | ~280 |
| `dd-workflow` | Interactive 7-phase DD process | ~380 |
| `smart-alerts` | Configurable threshold-based alerts | ~260 |
| `token-gating` | 37 features mapped to 4 CMT tiers | ~250 |
| `benchmarking` | 12-metric percentile ranking | ~280 |
| `investor-matching` | 8-dimension thesis matching, 5 templates | ~340 |
| `market-timing` | 7 indicators, regime detection | ~280 |
| `social-proof` | GitHub/Twitter/Discord/Web alternative data | ~280 |
| `lp-portal` | Professional quarterly LP reports | ~280 |

### Regulatory (3)
| Engine | Jurisdictions | Lines |
|--------|--------------|-------|
| `regulatory-compliance` | US (Reg D/CF/A+), EU (MiCA, GDPR), UAE (VARA) | ~320 |
| `apac-regulatory` | HK SFC, SG MAS, JP JFSA, AU ASIC, KR FSC, IN SEBI | ~350 |
| `geopolitical-risk` | 8 jurisdictions, sanctions, domain authority | ~300 |

### Other (6)
| Engine | Purpose | Lines |
|--------|---------|-------|
| `esg-taxonomy` | EU SFDR, PAI, carbon footprint, UN SDGs | ~380 |
| `macro-indicators` | 12 macro indicators, cycle phase, allocation | ~290 |
| `zk-range-proof` | Pedersen commitments, Fiat-Shamir ZK proofs | ~350 |
| `knowledge-graph` | BFS pathfinding, community detection, influence | ~330 |
| `cross-chain` | 8 blockchains, unified portfolio | ~290 |
| `license-guard` | HMAC-SHA256 license keys, 5 tiers, domain lock | ~350 |
| `integrity-guard` | Fingerprinting, checksums, usage audit trail | ~300 |

---

## SDK Architecture (src/sdk/)

```
src/sdk/
├── index.ts           — Single entry point
├── chaintrust.ts      — Unified facade (ChainTrust.analyze(), .risk.*, .zk.*)
├── registry.ts        — 73-engine catalog with metadata & dependency graph
├── event-bus.ts       — 22 typed event channels, pub/sub
├── config.ts          — Runtime feature flags, 4-level priority merge
├── plugins.ts         — Third-party extension lifecycle
└── modules/
    ├── analysis.ts    — AI, ML, statistics
    ├── finance.ts     — Financial instruments
    ├── intelligence.ts — Deep intelligence
    ├── risk.ts        — Quant, regulatory, ESG
    ├── simulation.ts  — Monte Carlo, scenarios
    └── experience.ts  — UX engines
```

---

## 17 Algorithms Implemented

| # | Algorithm | Domain | Where |
|---|-----------|--------|-------|
| 1 | Isolation Forest | ML | `isolation-forest.ts` |
| 2 | Gradient Boosting | ML | `gradient-boost.ts` |
| 3 | Bayesian Inference | Statistics | `bayesian-inference.ts` |
| 4 | Monte Carlo Simulation | Simulation | `monte-carlo.ts` |
| 5 | Markowitz MVO | Finance | `portfolio-optimizer.ts` |
| 6 | LMSR Pricing | Finance | `prediction-market.ts` |
| 7 | Newton-Raphson | Numerical | `return-calculator.ts` |
| 8 | Mann-Whitney U | Statistics | `statistical-tests.ts` |
| 9 | Kolmogorov-Smirnov | Statistics | `statistical-tests.ts` |
| 10 | Welch's t-test | Statistics | `statistical-tests.ts` |
| 11 | Cosine Similarity | ML | `startup-dna.ts` |
| 12 | Pedersen Commitment | Crypto | `zk-range-proof.ts` |
| 13 | Fiat-Shamir Heuristic | Crypto | `zk-range-proof.ts` |
| 14 | Time-Series Decomposition | Signal | `time-series.ts` |
| 15 | Pattern Recognition (8) | ML | `pattern-recognition.ts` |
| 16 | AMM Slippage Model | DeFi | `liquidity-analysis.ts` |
| 17 | HMAC-SHA256 | Security | `license-guard.ts` |

---

## License Tiers

| Tier | Engines | Price | Key Features |
|------|---------|-------|---|
| Community | 10/73 | Free | Basic analytics, NL query, trust scores |
| Startup | 25/73 | $99/mo | + Monte Carlo, DD scoring, cohort analysis |
| Professional | 50/73 | $499/mo | + Investment memos, VaR, portfolio optimizer |
| Enterprise | 73/73 | Custom | + ZK proofs, 3D, AI agents, SDK, plugins |
| Unlimited | 73/73 | Founders | Full source, white-label rights |

---

## Development History (16 Phases)

| Phase | What Was Built |
|-------|---|
| 1 | Red flags, reputation score, wallet abstraction |
| 2 | Monte Carlo, NL query, survival predictor, Blinks |
| 3 | Claims, cap table, escrow, deal room, term sheets |
| 4 | Portfolio optimizer, prediction markets, benchmarking |
| 5 | **ZK proofs**, **3D WebGL**, knowledge graph |
| 6 | Investment memos, competitive intel, cohort analysis |
| 7 | DD workflows, IRR calculator, founder score |
| 8 | AI agents, cross-chain, compliance, valuations |
| 9 | Quant risk (VaR/Sharpe), ESG taxonomy, APAC regulatory |
| 10 | Isolation Forest ML, Bayesian inference, gradient boosting |
| 11 | Investor Hub, engagement, onboarding, gamification |
| 12 | Command palette, narrative engine, feature discovery |
| 13 | Startup DNA, network effects, moat scoring, tokenomics |
| 14 | Liquidity, smart money, real yield, conviction tracker |
| 15 | **Enterprise SDK** — unified facade, registry, events, plugins |
| 16 | **License system**, integrity guard, IP protection |

---

*ChainTrust-SOL v1.0.0 — Built with Claude Opus 4.6*
