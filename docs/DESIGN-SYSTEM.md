# Design System

## Typography

| Use | Font | Weight | Tracking |
|-----|------|--------|----------|
| Display / Headings | Lexend | 700-800 | -0.02em to -0.04em |
| Body text | Inter | 300-600 | normal |
| Code / Data | JetBrains Mono | 400-600 | normal |

### Scale

| Token | Size | Line Height |
|-------|------|-------------|
| xs | 0.75rem | 1rem |
| sm | 0.8125rem | 1.25rem |
| base | 0.875rem | 1.5rem |
| lg | 1rem | 1.5rem |
| xl | 1.25rem | 1.75rem |
| 2xl | 1.5rem | 2rem |
| 3xl | 2rem | 2.25rem |
| 4xl | 2.75rem | 3rem |
| 5xl | 3.5rem | 3.75rem |

## Color System

All colors use HSL CSS variables for light/dark theme switching.

### Light Theme (Default)

| Token | HSL | Usage |
|-------|-----|-------|
| background | 220 20% 97% | Page background |
| foreground | 222 47% 11% | Primary text |
| card | 0 0% 100% | Card surfaces |
| primary | 221 83% 53% | Brand blue, CTAs |
| secondary | 220 14% 96% | Subtle backgrounds |
| muted | 220 14% 96% | Disabled states |
| muted-foreground | 220 9% 43% | Secondary text |
| border | 220 13% 90% | Borders, dividers |
| destructive | 0 72% 51% | Errors, delete |
| warning | 38 92% 50% | Warnings |

### Dark Theme

| Token | HSL | Usage |
|-------|-----|-------|
| background | 222 47% 5% | Page background |
| foreground | 210 20% 88% | Primary text |
| card | 222 35% 8% | Card surfaces |
| primary | 217 91% 60% | Brand blue (lighter) |
| secondary | 222 30% 13% | Subtle backgrounds |
| muted-foreground | 215 15% 50% | Secondary text |
| border | 222 25% 14% | Borders, dividers |

### Semantic Colors (Both Themes)

| Color | Usage |
|-------|-------|
| `text-emerald-400` | Success, verified, positive trends |
| `text-amber-400` | Warnings, in-progress, medium risk |
| `text-red-400` | Errors, destructive, negative trends |
| `text-blue-400` | Info, links, secondary emphasis |
| `text-purple-400` | Soulbound badges, premium features |

## Component Library

Built on shadcn/ui (Radix UI primitives) with custom styling.

### 49 UI Primitives

Accordion, Alert, AlertDialog, AspectRatio, Avatar, Badge, Breadcrumb, Button, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Command, ContextMenu, Dialog, Drawer, DropdownMenu, Form, HoverCard, Input, InputOTP, Label, Menubar, NavigationMenu, Pagination, Popover, Progress, RadioGroup, Resizable, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Switch, Table, Tabs, Textarea, Toast, Toaster, Toggle, ToggleGroup, Tooltip

### Custom Components (43)

**Startup Analysis (18):**
AIDueDiligence, ComplianceDashboard, FundFlowSankey, FundingRounds, ImpactPL, MetricCard, MultiSigTreasury, OnChainActions, PercentileRank, ProofChainVisualizer, RetentionChart, SoulboundBadge, SustainabilityGauge, TimeRangeSelector, TokenUnlockCalendar, TransactionHistory, TrustScoreBreakdown, ValuationMetrics

**Layout (3):**
Navbar (sidebar + header), Footer (5-column), PageTransition (Framer Motion)

**Visualization (4):**
BlockchainStatus, NetworkPulse, LiveFeed, EcosystemHeatmap

## Utility Classes

| Class | Effect |
|-------|--------|
| `.card-elevated` | Card with soft shadow, hover lift |
| `.glass-card` | Frosted glass (dark mode only) |
| `.gradient-border` | Gradient border via ::before |
| `.startup-card-hover` | translateY(-2px) on hover |
| `.tabular-nums` | Monospaced numerals for data |
| `.glow-dot` | Glowing status indicator |

## Spacing

- Cards: `p-5` or `p-6`
- Sections: `py-8` to `py-20`
- Grid gaps: `gap-3` to `gap-8`
- Border radius: `rounded-lg` (0.5rem), `rounded-xl` (0.75rem), `rounded-2xl` (1rem)

## Animation

- Page transitions: Framer Motion `fade + translateY(8px)`
- Micro-interactions: `transition` (200ms default)
- Charts: `whileInView` with staggered delays
- Institutional mode: All animations disabled via CSS override
