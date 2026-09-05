# IBP Wellness Hub — Landing Page Requirements

Source: IIRM Req. Session (Wellness) transcript, 7 Jul 2026 + reference dashboard image.

## 1. Context

IBP (Integrated Benefits Portal) landing page must blend three benefit streams:

1. **Corporate insurance benefits** — already in IBP (policies, claims, e-card).
2. **Personal/retail insurance** — OPEN. Insure Easy is a sales-team (B2B) tool, not B2C-pluggable. Clarity expected in ~2 weeks. Do not design around it yet.
3. **Wellness** — via **Alive Wellness** (third-party partner, not IIRM-owned). IBP shows a thin "flavour" of wellness; every click deep-links into Alive.

The interim two-banner approach on the post-login page is CLOSED. This work replaces it with a functional wellness presence on the landing page.

## 2. Wellness sections agreed (per transcript)

Five fixed sections + one rotating promotional banner. All data pulled from Alive (daily refresh expected). Every element click-throughs to Alive.

| # | Section | Has data | No data |
|---|---------|----------|---------|
| 1 | **HRA (Health Risk Assessment)** | Show score. If <recency threshold (e.g. 10 days) — "you're fine". If >3–6 months — "redo your HRA" nudge | Promo: "Take your Health Risk Assessment now" |
| 2 | **Health Check-up** (fixed card, not just banner) | "Last check-up on <date> — access your report" | Promo: "Book your health check-up" (esp. if none in 6–8 months) |
| 3 | **Upcoming appointments** | List booked appointments | Hide or minimal empty state |
| 4 | **Upcoming seminars / trainings** | Webinars/health videos pulled from Alive, topics rotate | Hide |
| 5 | **My signed-up programs** | Programs user enrolled in (yoga, nutrition, gym…) — reminder/re-entry point into Alive | Not shown until first signup |
| P | **Promotional banner** (rotating) | Rotating offers — health check-up discount prioritised, then dental, vision, etc. Also carries corporate benefit promos | Always present when wellness enabled |

Explicitly out of scope: full Alive dashboard replication, per-family-member check-up tracking, orders/medicine history, wearable/health-device sync (Alive has it; asked to keep hidden — no premium-linked incentive exists in India, regulator disallows premium discounts), ambulance/emergency features.

## 3. Use-case matrix (what the user sees)

| Case | Scenario | Landing behaviour |
|------|----------|-------------------|
| A | **Nothing sponsored** (no corporate plan, no IIRM plan) — ~50% of base | Alive = open discounted marketplace. Show the 5 sections + promo in "generic marketplace" mode. Empty states are promotional nudges |
| B | **Corporate-sponsored** benefits via Alive | FIRST show "Your company gives you these N benefits" (dedicated sponsored-benefits section — user cannot know otherwise without entering Alive). Then signup states reflect enrolment ("you're signed up for nutrition, gym…") |
| B' | **IIRM-sponsored** (IIRM pays as deal sweetener) | Identical to B for the employee — no visual or technical difference. Employee never knows who pays |
| B'' | **Combined / part-paid** (e.g. corporate pays 50% of gym) | Same as B; cost-split is an Alive-side concern |
| C | **Custom informational benefit** (e.g. local gym deal, own wellness network — not via Alive) | CMS-driven informational section only. Display details; no integration, no tracking. Corporate's own network integration = future customisation, handled when it comes |
| D | **Wellness disabled by corporate** | Entire wellness presence hidden AND SSO/auto-provisioning to Alive disabled. No leak |

Cases compose: A/B + C can coexist. Every section is independently configurable per corporate (turn HRA off, turn health reports off, etc.) — IBP's existing config-toggle pattern.

## 4. Access & identity rules

- **One-directional**: user must enter Alive through IBP. No Alive → IBP, no direct Alive access.
- **Seamless SSO**: no re-registration, no visible onboarding. Alive receives user identity from IBP's IDP. Mechanism (SSO vs API provisioning, dynamic vs bulk) — TBD with Alive.
- Turning wellness off for a corporate must also disable the auto-provisioning.
- No compliance blockers flagged for auto-provisioning (per Kapil).

## 5. Reference-image sections to adopt

From the shared dashboard reference, bring these patterns into the design:

- **Hero + Benefits Wallet** — welcome strip with cover summary; wallet listing GMC/top-up/check-up/teleconsult/coins/gym-discount statuses.
- **Quick Actions** — three groups: Insurance (e-card, claims, hospital network, documents), Wellness (health check-up, teleconsult, emotional wellness, programs), Family protection (buy/term/parents/all products).
- **Your Active Policies** — base + top-up policy cards with sum insured, utilisation, period, members.
- **Your Wellness Journey** — wellness score ring + activity/sleep/nutrition/stress tiles + "recommended for you". NOTE: tracker tiles (steps/sleep) depend on device sync which is currently hidden on Alive — treat as future/optional; wellness score maps to HRA score.
- **Health Insights & Nudges** — the nudge row (book check-up, complete HRA, wellness coins, add nominee) — matches the nudges-mix Kapil described.
- **Extend Protection** cross-sell row — maps to the personal-insurance stream; keep as placeholder until that decision lands.

## 6. Open points / dependencies

1. **Alive feasibility** — Kapil to confirm with Alive which data points are shareable (API vs batch, daily refresh). Whole design gated on this.
2. **Personal insurance** journey — decision in ~2 weeks.
3. **Profile migration** (employee exits corporate): port login to personal email/mobile; corporate record stays, individual profile carries personally-paid Alive subscriptions and ported policies. Edge cases: joining another IIRM corporate (profile merge?), user never set alternate contact. ON HOLD — business (VRK et al.) to decide; design only needs to not preclude it.
4. **HR/admin view** of wellness consumption — check if Alive offers an HR interface; avoid building our own.
5. **Enrollment tracking dashboard** (Suryamohan, urgent, separate from wellness): HR/CRM view of live enrolment status — enrolled vs pending, reminder actions. Enrollment window already running; flagged as embarrassing gap.

## 7. Design deliverables implied

1. Landing page layout with the 5 wellness sections + promo banner, per-section empty/filled states.
2. State matrix renderings: Case A (marketplace), Case B (sponsored list + signups), Case C (custom info section), Case D (off).
3. Config model: per-corporate toggles per section.
4. Redirect behaviour spec: every wellness element → Alive deep link.
