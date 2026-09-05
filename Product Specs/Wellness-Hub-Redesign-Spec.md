# Wellness Hub — Layout & Presentation Rethink

Companion to `Wellness-Hub-Landing-Requirements.md`. Answers: what are the
sections, what are the features, how is each presented, and how the layout
stays **fully filled** in every scenario.

## 1. Sections & features (what exists)

| # | Section | Features | Visibility rule |
|---|---------|----------|-----------------|
| 0 | Hub header | Title, "Powered by Alyve", Open Portal CTA | Always (wellness on) |
| 1 | Sponsored benefits | N benefit cards, enrolled/coverage state, activate CTA | Case B only — shown FIRST (req §3) |
| 2 | HRA | Score gauge, freshness status, take/retake/insights CTA | Always — **hero tile** |
| 3 | Health check-up | Last-report state, book/access CTA | Always — feature tile |
| 4 | Appointments | Next 2 bookings, manage CTA | **Only with data** (req: hide/minimal) |
| 5 | Programs | Enrolled programs, continue CTA | **Only with data** (req: hidden until signup) |
| 6 | Nudge rail | 3 contextual one-line prompts (absorbs empty states of 4/5) | Always |
| 7 | Seminars | Next 3 events as equal-width cards | **Only with data** (req: hide) |
| P | Promo banner | Rotating offers, copy + one-sided image | Always (wellness on) |
| 8 | Custom benefits | CMS info cards, partner tag | Case C only |

## 2. Layout principle: adaptive bento, no orphaned space

Bento-grid guidance (see sources): tile size = importance, one hero max
per band, identical gutters, 6–12 blocks. Layout on a 12-col grid,
16px gutter (`theme.spacing(4)`), 32px between bands (page container gap).

**Hero band composes by tile count** — empty sections don't render a
begging card; their pitch collapses into the nudge rail:

```
4 tiles (appts + programs)        3 tiles (one of them)      2 tiles (neither)
┌──────6──────┬──────6──────┐    ┌──────6──────┬─────6─────┐  ┌──────7──────┬────5────┐
│  HRA hero   │  Check-up   │    │  HRA hero   │ Check-up  │  │  HRA hero   │Check-up │
│  (2 rows)   ├──3───┬──3───┤    │  (2 rows)   ├───────────┤  └─────────────┴─────────┘
│             │Appts │Progs │    │             │ the other │
└─────────────┴──────┴──────┘    └─────────────┴───────────┘
```

- HRA is the hero (only graph, most decision value). Gauge 132px,
  gradient stroke, draw-in animation.
- Every tile: gradient from `theme.palette.summaryCards[n]`, its `.text`
  color, 16px radius, 20/24px padding, CTA pinned bottom-left.

**Nudge rail**: horizontal strip, each nudge `flex: 1` — the row is always
edge-to-edge regardless of count (1–3 nudges).

**Seminars**: not a list in a wide card (that stranded a half-empty card).
Three equal-width event cards — date badge + kind chip, two-line title,
speaker — the band self-fills. Hidden when no events.

**Promo banner**: full-width band, ~180–200px tall on desktop (slim
"leaderboard" proportion ≈ 1366×180; hero-banner guidance says 300–600px
is for page heroes — a mid-page promo should stay slim). Copy left within
the safe center, illustration bleeding on the right column (340px), CTA +
rotation dots under the copy. Never boxed into a widget column.

**Sponsored/custom benefits**: `auto-fill minmax(280px,1fr)` grid — a lone
card keeps card width instead of stretching edge-to-edge.

## 3. Presentation tokens (from IBP theme only)

- Type: Figtree; band title 24px/semiBold (`fontSizes.xll`), section
  headings 18px/semiBold, card titles 20px, body 15px with 22px
  line-height, meta 14px.
- Spacing: 4px base; 24px card padding, 16px gutters, 32px band gap.
- Radius: 16px cards, 12px inner rows/badges, 8px buttons (4px on
  banner-style white CTAs), 80px pills.
- Color: `summaryCards` gradients (teal/yellow/blue/purple) for tiles,
  WellnessBanner green family as the single accent, `border.main` on white
  cards, `shadows[10]`.
- Motion: staggered 500ms rise-in per band and per tile (60–70ms offsets),
  4px hover lift, CTA arrow slide, gauge draw-in — all guarded by
  `prefers-reduced-motion`.

## 4. Scenario coverage (why nothing is ever sparse)

| Scenario | Bands rendered |
|----------|----------------|
| Marketplace · new | Header · 2-tile hero (HRA/check-up promos) · 3-nudge rail · seminars · banner |
| Marketplace · engaged | Header · 3–4-tile hero with data · nudges · seminars · banner |
| Sponsored (B/B'/B'') | Header · sponsored grid first · hero band · nudges · seminars · banner |
| Custom (C) | …plus CMS info grid at the end |
| Wellness off (D) | Nothing renders (preview-only slate in dev) |

Every interactive element deep-links to Alyve via the existing magic-URL
SSO (`openPortal`) — live-portal tagging needs no rework.

## 5. Sources

- Bento sizing/gutters/limits: [orbix.studio bento dashboard guide](https://www.orbix.studio/blogs/bento-grid-dashboard-design-aesthetics),
  [saasframe.io practical bento guide](https://www.saasframe.io/blog/designing-bento-grids-that-actually-work-a-2026-practical-guide),
  [baltech.in bento for dashboards](https://baltech.in/blog/bento-grids-for-ai-dashboards/)
- Banner proportions/safe area: [crazyegg hero image sizes](https://www.crazyegg.com/blog/hero-image-size/),
  [shortpixel banner dimensions](https://shortpixel.com/blog/website-banner-dimensions/),
  [shopify image size guide](https://www.shopify.com/blog/image-sizes)
