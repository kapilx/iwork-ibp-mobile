/**
 * WELL-BEING — types.
 * Mirrors the IIRM IBP Well-being implementation spec (§20 data model). One
 * Well-being response drives every subsection; the employee state and the
 * organisation-benefit count decide what renders. Sections render strictly
 * from data — missing data hides the subsection (§5, §12).
 */

/** Employee engagement state (§20). Preview-switchable (§6, control group 1). */
export type EmployeeWellbeingState =
  | "FIRST_TIME"
  | "ONE_PROGRAMME"
  | "MULTIPLE_OR_APPOINTMENT";

/** Organisation-benefit count preview control (§6, control group 2). */
export type BenefitCount = "THREE" | "TWO" | "ONE" | "NONE";

export interface LinkTarget {
  label: string;
  url: string;
  opensExternalPortal: boolean;
}

/** A real 16:9 thumbnail (photo). Alt text is required for accessibility (§23). */
export interface Thumbnail {
  /** Imported asset key resolved to a real photo in cards.tsx. */
  imageKey: string;
  alt: string;
}

/* ── KPI 1 — Health assessment (§9) ────────────────────────────────────── */

export interface HealthAssessment {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "STALE";
  score?: number;
  /** Pre-formatted "23 June 2026". */
  completedAt?: string;
  progressPercent?: number;
}

/* ── KPI 2 — Health check-up (§10) ─────────────────────────────────────── */

export interface HealthReport {
  id: string;
  name: string;
  reportType: "HEALTH_CHECKUP";
  /** Pre-formatted "18 April 2026". */
  completedAt: string;
}

/* ── KPI 3 — Your wellness activity (§11) ──────────────────────────────── */

export interface Appointment {
  id: string;
  /** Links this appointment to a programme so it can be de-duped (§21). */
  programmeId?: string;
  title: string;
  /** Sortable ISO start, used to pick the nearest appointment (§21). */
  startAt: string;
  /** Pre-formatted "28 July 2026 · 4:00 PM". */
  scheduledLabel: string;
  mode: "ONLINE" | "IN_PERSON";
  status: "CONFIRMED" | "CANCELLED" | "PAST" | "TENTATIVE";
}

/* ── Programmes (§15, §16) ─────────────────────────────────────────────── */

export interface Programme {
  id: string;
  title: string;
  description: string;
  status: "AVAILABLE" | "ENROLLED" | "READY_TO_START" | "COMPLETED";
  thumbnail: Thumbnail;
  /** Current price. Shown as plain text in the card footer (left of the CTA). */
  price?: number;
  /** Original (pre-discount) price, struck through beside `price` when present. */
  originalPrice?: number;
  sessions?: number;
  /** Pre-formatted "4 weeks". */
  durationLabel?: string;
  /** Sortable ISO start of the next confirmed session, when the backend knows
   *  one. Never derived locally — absent means no session line is shown. */
  nextSessionAt?: string;
  /** Pre-formatted short date for the session line, e.g. "28 Jul". */
  nextSessionLabel?: string;
  included?: boolean;
  /** Set when a programme is delivered as an organisation benefit (§21 de-dup). */
  organisationBenefitId?: string;
  action: LinkTarget;
}

/* ── Benefits from your organisation (§12) ─────────────────────────────── */

export interface OrganisationBenefit {
  id: string;
  title: string;
  description: string;
  thumbnail: Thumbnail;
  fundingType: "FULL" | "PARTIAL";
  /** e.g. "Included", "10 sessions included", "30% subsidised". */
  valueLabel: string;
  priceAfterContribution?: number;
  includedSessions?: number;
  /** Partner display name (used for the logo alt text / accessibility). */
  partnerMark?: string;
  /** Partner logo image key, resolved to a real logo in cards.tsx. When the
   *  backend provides real partner logos, only this mapping changes. */
  partnerLogoKey?: string;
  action: LinkTarget;
}

/* ── Explore by need (§14) — 4 fixed gradient navigation tiles ─────────── */

export type NeedKey = "assessment" | "nutrition" | "care" | "fitness";

export interface ExploreNeed {
  id: NeedKey;
  /** Small category label, e.g. "Assessment". */
  kicker: string;
  /** Main title, e.g. "Health assessments". */
  title: string;
  action: LinkTarget;
}

/* ── Wellness Library (§17) ────────────────────────────────────────────── */

export interface LibraryItem {
  id: string;
  format: "VIDEO" | "ARTICLE" | "WEBINAR" | "QUICKBYTE" | "AUDIO";
  title: string;
  description: string;
  thumbnail: Thumbnail;
  /** Duration or read time, e.g. "8 min", "5 min read". */
  durationLabel: string;
  completionState?: "WATCHED" | "READ" | "LISTENED";
}

/* ── Promotional banner carousel (below the Wellness Library) ──────────── */

/**
 * One full-artwork promo banner slide (2048×768, text baked into the art).
 * Mock slides resolve `imageKey` against the bundled BANNER_ART map in
 * cards.tsx. Real slides (Company Configuration → Offers & Benefits) instead
 * carry a resolved `imageUrl` (blob URL from an authenticated file download)
 * and their own `redirectionUrl` to open on click.
 */
export interface PromoBanner {
  id: string;
  /** Imported banner artwork key resolved in cards.tsx (mock slides only). */
  imageKey?: string;
  /** Resolved image blob URL (real Offers & Benefits slides only). */
  imageUrl?: string;
  /** Destination to open on click (real Offers & Benefits slides only). */
  redirectionUrl?: string;
  /** Caption shown below the image (real Offers & Benefits slides only). */
  title?: string;
  description?: string;
  alt: string;
  action?: LinkTarget;
}

/* ── The full Well-being response ──────────────────────────────────────── */

export interface WellbeingResponse {
  state: EmployeeWellbeingState;
  assessment: HealthAssessment;
  reports: HealthReport[];
  appointments: Appointment[];
  programmes: Programme[];
  organisationBenefits: OrganisationBenefit[];
  needs: ExploreNeed[];
  library: LibraryItem[];
  /** Banner carousel shown below the Wellness Library. */
  banners: PromoBanner[];
}

/**
 * Result of the §21 selection + de-dup pass — computed once, consumed by the
 * sections so no programme/benefit/appointment is repeated across the page.
 */
export type ActivityCard =
  | {
      type: "APPOINTMENT";
      /** Nearest confirmed future appointment. */
      appointment: Appointment;
      moreCount: number;
      /** All confirmed future appointments, nearest first — the multi-
       *  appointment face lists their names programme-style. */
      upcoming: Appointment[];
    }
  | { type: "ONE_PROGRAMME"; programme: Programme }
  | {
      type: "MULTIPLE_PROGRAMMES";
      programmes: Programme[];
      /** Earliest known future session across the programmes — supporting line
       *  renders only when this is genuinely available. */
      nextSessionLabel?: string;
    }
  | { type: "SPONSORED"; programme: Programme }
  | { type: "EXPLORE" };

export interface DerivedWellbeing {
  activityCard: ActivityCard;
  /** Enrolled programmes shown in "Other active programmes" (§15), de-duped. */
  otherActiveProgrammes: Programme[];
  /** Available programmes for "Explore programmes" (§16), de-duped. */
  discoverableProgrammes: Programme[];
  /** True once one programme is enrolled → "Explore more programmes" (§16). */
  exploreMoreTitle: boolean;
}

/* ── Preview-only scenario metadata (§6; design review, never production) ── */

export interface EmployeeScenarioMeta {
  id: EmployeeWellbeingState;
  label: string;
}

export interface BenefitScenarioMeta {
  id: BenefitCount;
  label: string;
}
