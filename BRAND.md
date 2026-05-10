# ChainTrust — Brand & Design System

> The source of truth. Every color, type choice, asset, and voice rule lives here. If you're shipping anything visual, read this first.

---

## Tokens

### Color

ChainTrust uses **3 brand colors + 1 neutral ramp**. No more. The discipline is: if you find yourself reaching for a fourth color, you're probably making a UI mistake.

| Role | Token | Hex | Used for |
|---|---|---|---|
| **Primary brand** | `--ink` | `#0B1437` | Backgrounds on dark surfaces, body text on light |
| **Accent** | `--solana-purple` | `#9945FF` | Interactive elements, primary CTA, links |
| **Success / KPI** | `--mint` | `#14F195` | Numbers we want to draw the eye to, success states |
| **Neutral 50** | `--neutral-50` | `#F4F6FB` | Page backgrounds (light mode) |
| **Neutral 200** | `--neutral-200` | `#DDE3F0` | Borders, dividers |
| **Neutral 500** | `--neutral-500` | `#4A5478` | Muted text, secondary information |
| **Neutral 800** | `--neutral-800` | `#1A2050` | Body text on light, dark surfaces |
| **Warning** | `--warn` | `#E94560` | Errors, destructive actions |
| **Caution** | `--gold` | `#F59E0B` | Cautions, "needs review" states |

#### Contrast rules

- **Body text ≥ AA (4.5:1)**, headings ≥ AA-Large (3:1), interactive elements ≥ AA.
- `#0B1437` on `#F4F6FB`: **17.4:1** (AAA ✓)
- `#9945FF` on `#FFFFFF`: **5.8:1** (AA ✓ — borderline; use 600 weight or larger for body)
- `#14F195` on `#0B1437`: **9.4:1** (AAA ✓)
- `#14F195` on `#FFFFFF`: **1.6:1** (FAIL — never use mint as a color *on* white; use it as fill *behind* dark text or as an accent stripe)

### Typography

**Two typefaces. Period.**

| Role | Family | Where it ships from |
|---|---|---|
| **Display + body** | Inter | Google Fonts (preconnected in `index.html`) |
| **Code + numerics** | JetBrains Mono | Google Fonts (preconnected) |

#### Type scale (rem-based; matches the live Tailwind config)

| Token | Size | Use |
|---|---|---|
| `text-xs` | 0.75 rem (12 px) | Badges, micro-labels |
| `text-sm` | 0.875 rem (14 px) | UI body, table cells |
| `text-base` | 1.0 rem (16 px) | Default body |
| `text-lg` | 1.125 rem (18 px) | Lead paragraph |
| `text-xl` | 1.25 rem (20 px) | Section subheadings |
| `text-2xl` | 1.5 rem (24 px) | Page subheadings |
| `text-3xl` | 1.875 rem (30 px) | Page titles |
| `text-4xl` | 2.25 rem (36 px) | Hero subheadings |
| `text-5xl` | 3.0 rem (48 px) | Hero |
| `text-6xl` | 3.75 rem (60 px) | Brand splash only |

**Letter-spacing**: tighten display sizes (–1 to –2 px). Body keeps default. Mono never tightens.

**Line-height**: 1.55 body, 1.15–1.3 headings, 1.45 mono.

### Spacing

Multiples of 4 px. **Stop using arbitrary spacing values.** If your spacing isn't in this list, pick the nearest one in the list.

| Token | px |
|---|---|
| `space-1` | 4 |
| `space-2` | 8 |
| `space-3` | 12 |
| `space-4` | 16 |
| `space-6` | 24 |
| `space-8` | 32 |
| `space-12` | 48 |
| `space-16` | 64 |
| `space-24` | 96 |

### Radius

| Token | px | Use |
|---|---|---|
| `radius-sm` | 4 | Buttons, badges, inline pills |
| `radius-md` | 6 | Cards, inputs, alerts |
| `radius-lg` | 8 | Modals, large surfaces |
| `radius-xl` | 12 | Full-page cards (rare) |
| `radius-full` | 9999 | Pills, avatars, circles |

### Elevation (shadow)

| Token | Value |
|---|---|
| `shadow-sm` | `0 1px 2px rgba(11,20,55,0.04)` |
| `shadow-md` | `0 1px 2px rgba(11,20,55,0.04), 0 8px 24px rgba(11,20,55,0.06)` |
| `shadow-lg` | `0 8px 32px rgba(11,20,55,0.08), 0 24px 64px rgba(11,20,55,0.10)` |

**Don't use shadows for hierarchy** when border or background-tint will do. Shadows are expensive and look dated when overused.

---

## Assets

All committed assets in `/brand` are the **SVG masters**. Anything else (PNG raster favicons, OG cards, etc.) is derived. If you change a master, regenerate the derivatives via `node scripts/generate-favicons.mjs` (this script is added in Phase 3).

| Asset | Master | Derived | Purpose |
|---|---|---|---|
| Logomark | `brand/logomark.svg` | favicon-{16,32}.png, apple-touch-icon.png, android-chrome-{192,512}.png | square uses (favicon, app icon, avatar) |
| Banner (dark) | `brand/banner-dark.svg` | `judges/banner.svg` (canonical), `public/og-image.svg` | wide hero on dark surfaces |
| Banner (light) | `brand/banner-light.svg` | — | wide hero on light surfaces |
| OG / social card | `brand/og-card.svg` | `public/og-image.svg` (1200×630) | Twitter / LinkedIn / Discord previews |

---

## Voice & vocabulary

### Words we use

| ✅ Use | Why |
|---|---|
| **Trust layer** | What we are |
| **Cryptographic proof** | What we provide |
| **Non-repudiable** | Once posted, can't be denied |
| **Production-grade** | Not "production-ready" |
| **Audited** | Past tense, three times |
| **Verifiable forever** | The on-chain commitment |
| **Anchor** (verb) | What we call "publishing on-chain" |

### Words we avoid

| ❌ Avoid | Why |
|---|---|
| "Disrupting" / "revolutionising" | Empty corporate adjective |
| "Web3 native" | Meaningless |
| "Game-changer" | Cliché |
| "AI-powered" (unless we mean it specifically) | Buzzword without proof |
| "Easy" | Never sounds true |
| "Solution" | Vague — say what we do |
| "Cutting-edge" | Eye-roll signal |

### Tone

- **Confident, not arrogant.** We've shipped, we've been audited, we know what we are.
- **Specific, not vague.** Numbers. File paths. Audit firm names.
- **Empathetic to the investor.** They've been burned; we're the fix.
- **Direct, not corporate.** Short sentences win. No "leveraging synergies."

---

## Emoji policy

### The rule

**Keep emoji. Use them sparingly and consistently.** Six allowed emoji, fixed meanings, no others.

| Emoji | Meaning | Where |
|---|---|---|
| 🛡 | Security | Section markers in security docs, badge in README |
| 🎥 | Video / demo | Demo-video script, recording instructions |
| 📂 | Folder / location | Pointing readers to a directory |
| 🎯 | "Start here" | Above-fold callouts, judge signposts |
| ⚡ | Speed / quickstart | Quick-start blocks, fast-path callouts |
| ✓ / ✗ | Pass / fail | Tables, checklists, audit reports |

**Anything else is forbidden.** No 🚀, no 🔥, no 💯. Excitement is conveyed through specificity, not pictographs.

### Why a small fixed set

- New contributors don't have to guess "is this the right emoji?"
- Search-and-find works (`grep "🛡"` reliably finds security pointers)
- Removes "AI-slop" feel of dense emoji clouds in headings
- Easy to enforce mechanically with a pre-commit hook (future)

---

## Asset policy

1. **Every committed visual asset must have a source file in `/brand`** — SVG, AI, Figma, anything reproducible. Raster-only assets without source are forbidden.
2. **No third-party logos** in our docs without explicit license attribution.
3. **No AI-generated visuals** without disclosure (and only as placeholder, never as final).
4. **Light/dark parity** — every visual asset that ships in the README or docs must work on both GitHub themes (light + dark). Use HTML `<picture>` with `prefers-color-scheme` to swap.

---

## Things we deliberately don't have (yet)

- **Animated logos / motion brand kit** — defer post-launch
- **Print collateral** — N/A
- **Custom typeface** — Inter is good enough; commissioning a custom face is over-scoped
- **Brand voice training set / GPT brand guide** — the rules above are the training set; a model is overkill

---

— *Last updated 2026-05-08 with Phase 3 of the dual-audit response. Next review: when ChainTrust ships v2.0 or earns a meaningful new color (real product launch event).*
