# Colosseum Frontier Hackathon — Implementation Plan

**Hackathon:** Solana Frontier (Colosseum)
**Deadline:** May 11, 2026
**Status:** LIVE — Started April 6, 2026

---

## Phase 1: Critical Fixes & Deploy-Ready ✅
**Goal:** Build passes, all pages load, demo accounts work

- [x] Fix missing @react-three dependencies
- [x] Wire InvestorHub into sidebar navigation
- [x] Fix auth loading timeout (3s safety)
- [x] Fix demo login UX (3 prominent role buttons)
- [x] Gate console statements behind DEV flag
- [x] Lazy-load Portfolio3D and NLQueryBar to prevent Dashboard crash

## Phase 2: Hackathon Submission Essentials
**Goal:** Everything judges need to evaluate us

- [ ] 2a. Create /hackathon landing page — one-page pitch for judges
- [ ] 2b. Add "What makes us different" section with live verification demo
- [ ] 2c. Clean up demo data — make 6 startups look realistic with real names
- [ ] 2d. Add guided walkthrough/tour for first-time judge visitors
- [ ] 2e. Ensure every feature is clickable and functional (no dead buttons)

## Phase 3: Devnet Deployment Prep
**Goal:** Real on-chain transactions visible to judges

- [ ] 3a. Verify Anchor program compiles (`anchor build`)
- [ ] 3b. Generate deployment keypair if needed
- [ ] 3c. Deploy to Solana devnet (`anchor deploy --provider.cluster devnet`)
- [ ] 3d. Update VITE_SOLANA_PROGRAM_ID with real program ID
- [ ] 3e. Run initialization transactions (registry, vault, DAO, token)
- [ ] 3f. Test all hooks against deployed program
- [ ] 3g. Record one real on-chain verification for demo

## Phase 4: Judge-Facing Polish
**Goal:** First 10 seconds must impress — judges review hundreds of projects

- [ ] 4a. Optimize landing page for instant clarity (problem → solution → CTA)
- [ ] 4b. Add "Powered by" badges (Solana, Pyth, Metaplex, Supabase)
- [ ] 4c. Add live Solana network status indicator on landing
- [ ] 4d. Ensure mobile works perfectly (judges may review on phone)
- [ ] 4e. Performance audit — lazy load everything, reduce initial bundle
- [ ] 4f. Add OG meta tags for Twitter/X card previews

## Phase 5: Differentiator Features ✅
**Goal:** Features no other hackathon project has

- [x] 5a. One-click verification flow — inline wallet verifier on /hackathon page
- [x] 5b. Live Pyth price feed visible on hackathon page + InvestorHub
- [x] 5c. cNFT certificate minting on verification dashboard
- [ ] 5d. ZK range proof demo (prove revenue > $100K without revealing exact number)
- [ ] 5e. Shareable verification Blink URL (paste in Twitter, shows preview)
- [x] 5f. 5 hedge fund quant models (momentum, vol targeting, relative value, macro regime, risk factors)
- [x] 5g. Macro Regime Detection panel in InvestorHub with Pyth-powered indicators
- [x] 5h. Quant Models tab in StartupDetail (momentum signals, relative value z-scores, factor decomposition)

## Phase 6: Traction & Social Proof
**Goal:** Judges explicitly look for early traction signals

- [ ] 6a. Create @ChainTrustSOL Twitter/X account
- [ ] 6b. Post daily build updates during remaining hackathon weeks
- [ ] 6c. Get 5-10 beta testers to use the platform and share feedback
- [ ] 6d. Create a Telegram/Discord for early community
- [ ] 6e. Document user feedback and incorporate into submission

## Phase 7: Video Production
**Goal:** Two required videos — pitch (3 min) and technical demo (2-3 min)

- [ ] 7a. Script the 3-minute pitch: team → problem → market → solution → why Solana → vision
- [ ] 7b. Script the technical demo: architecture → on-chain flow → Pyth → cNFT → ZK → verification
- [ ] 7c. Record pitch video (max 3 minutes — judges skip longer ones)
- [ ] 7d. Record technical demo (2-3 minutes — show code, not just UI)
- [ ] 7e. Upload to YouTube/Loom

## Phase 8: Submission Package
**Goal:** Complete submission before May 11

- [ ] 8a. Make GitHub repo public (or grant judge access)
- [ ] 8b. Deploy production build to Vercel/Netlify (free tier)
- [ ] 8c. Fill every field on Colosseum submission form
- [ ] 8d. Link pitch video, technical demo, live site, GitHub, Twitter
- [ ] 8e. Submit before deadline
- [ ] 8f. Apply to Superteam regional side tracks for bonus prizes

---

## Key Dates

| Date | Milestone |
|------|-----------|
| Apr 15 | Phase 2 complete — submission essentials |
| Apr 18 | Phase 3 complete — devnet deployment |
| Apr 22 | Phase 4 complete — judge-facing polish |
| Apr 28 | Phase 5 complete — differentiator features |
| May 3 | Phase 6 complete — traction evidence |
| May 8 | Phase 7 complete — videos recorded |
| May 10 | Phase 8 complete — submission package |
| **May 11** | **DEADLINE — Submit to Colosseum** |

---

## What Judges Score On (from Colosseum blog)

1. **Functionality** — Does it work?
2. **Business viability** — Is this a real startup?
3. **Problem-solution fit** — Real problem, real users?
4. **Founder intent** — Building full-time?
5. **Market opportunity** — How big?
6. **Solana integration** — Why Solana? Real on-chain logic?
7. **Early traction** — Twitter, Telegram, beta testers?
8. **Team quality** — Domain expertise?
