# 👋 For the judges

**Welcome.** This folder is the only place you need to look. Everything is curated, ordered, and short.

---

## In 30 seconds

ChainTrust is the **trust layer for Solana startup fundraising**. Founders publish metrics on-chain (SHA-256 hashed → Solana PDAs). Independent oracles verify them. Investors browse a screener / due-diligence stack backed by **real cryptographic proof chains**, not self-reported decks.

What makes this different from the 200 other projects you'll review this week:

| Most hackathon projects | ChainTrust |
|---|---|
| 1–2 smart-contract instructions | **24 Anchor instructions** in production-quality Rust |
| "Demo" = screenshot or simulated tx | **Real signed Solana Devnet tx** — click `/testnet-demo`, watch the Explorer link |
| 0 audits | **3 prior smart-contract audits** + 1 internal deep adversarial pass — every Critical / High closed |
| 5–15 npm vulnerabilities | **0 critical** npm vulnerabilities (we dropped the wallet-adapter-wallets meta-package to kill 8 in one move) |
| Float math on token amounts | **BigInt fixed-point** parsing — no float drift, regression-tested |
| Loose CSP that allows inline scripts | **`script-src 'self'`** in production CSP — no inline-script allowance |
| One file per page, hope for the best | Layered architecture, documented import rules ([ARCHITECTURE.md](../ARCHITECTURE.md)) |

This is what production looks like, not what a hackathon usually looks like.

---

## See it run, in 3 clicks

1. **Most-impactful path** — open [`/testnet-demo`](../src/pages/LiveTestnetDemo.tsx) after `npm run dev`. Connect Phantom on Devnet. Click *Airdrop*. Click *Anchor proof*. Click the **Solana Explorer** link in the toast. *That is a real, signed, confirmed transaction on the actual Solana network.* It cost ~5,000 lamports.
2. **Sign in as any role with one click** — visit [`/login`](../src/pages/Login.tsx). The "Explore as Investor / Startup / Admin" buttons handle the auth. Demo creds:

   | Role | Email | Password |
   |---|---|---|
   | Investor (start here) | `investor@chainmetrics.io` | `investor1` |
   | Startup | `startup@chainmetrics.io` | `startup1` |
   | Admin | `admin@chainmetrics.io` | `admin123` |

   Sessions expire after 24 hours. Demo users are **read-only** — RLS rejects every write.
3. **Click around for 90 seconds**:
   - `/dashboard` — KPI tiles + verified-startup list with on-chain status banner
   - `/screener` — institutional filters (trust score, sustainability, whale concentration)
   - Click any row → 14-tab due-diligence panel including AI risk analysis, ZK proofs, cap table, escrow
   - `/governance` — three live proposals with weighted vote tallies
   - `/staking` — Free / Basic / Pro / Whale tier system + APY rewards calculator

If you only have 30 seconds, do step 1.

---

## What to read next, in priority order

| | What | Time | Why |
|---|---|---|---|
| 1 | **[01-why-we-win.md](01-why-we-win.md)** | 2 min | The differentiated narrative — what makes this project deserve to win Frontier |
| 2 | **[02-three-minute-tour.md](02-three-minute-tour.md)** | 3 min | Long-form guided tour with file pointers — for technical reviewers |
| 3 | **[03-demo-video.md](03-demo-video.md)** | 3 min | Embedded screenshots of every demo scene, plus the recording script |
| 4 | **[04-security-summary.md](04-security-summary.md)** | 2 min | One-page security distillation — full audit history + every defense linked to its file |

Need to dig into a specific concern? Jump straight to:

- **Security details** → [`/SECURITY.md`](../SECURITY.md) (root) — pointer-list, every defense maps to a file
- **Architecture** → [`/ARCHITECTURE.md`](../ARCHITECTURE.md) (root) — layer rules + import boundaries + request lifecycle
- **The full audit reports** → [`/docs/internal/security-audit/`](../docs/internal/security-audit/) — threat model + 60-finding deep audit
- **The Anchor program** → [`blockchain/programs/chainmetrics/src/`](../blockchain/programs/chainmetrics/src/) — 24 instructions, hardened in May 2026

---

## What's in this folder

| File / folder | Purpose |
|---|---|
| `README.md` (this file) | Curated entry point |
| `01-why-we-win.md` | Differentiation narrative — read first |
| `02-three-minute-tour.md` | Long-form file-pointer tour |
| `03-demo-video.md` | 3-minute submission video script with verified screenshots of every scene |
| `04-security-summary.md` | One-page security posture |
| `screenshots/` | Demo-scene PNGs taken from a real browser walkthrough |

— Built for **Colosseum Frontier · May 11, 2026**.
