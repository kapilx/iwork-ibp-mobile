/**
 * WELL-BEING — preview data + selection logic.
 * Encodes the IIRM IBP Well-being spec: three employee states (§20) crossed
 * with an organisation-benefit count (§12), plus the §21 selection and
 * de-duplication pass so no programme/benefit/appointment repeats across the
 * page. Replace with the real Well-being response once the contract is wired;
 * the preview control bar is design-review only and never ships (§6).
 */
import {
  ActivityCard,
  BenefitCount,
  BenefitScenarioMeta,
  DerivedWellbeing,
  EmployeeScenarioMeta,
  EmployeeWellbeingState,
  ExploreNeed,
  LibraryItem,
  OrganisationBenefit,
  Programme,
  WellbeingResponse,
} from "./types";

const link = (label: string, url: string) => ({
  label,
  url,
  opensExternalPortal: true,
});

/* ── Preview scenario chips (§6) ───────────────────────────────────────── */

export const EMPLOYEE_SCENARIOS: EmployeeScenarioMeta[] = [
  { id: "FIRST_TIME", label: "First-time" },
  { id: "ONE_PROGRAMME", label: "1 programme" },
  { id: "MULTIPLE_OR_APPOINTMENT", label: "Multiple / appointment" },
];

export const BENEFIT_SCENARIOS: BenefitScenarioMeta[] = [
  { id: "THREE", label: "3" },
  { id: "TWO", label: "2" },
  { id: "ONE", label: "1" },
  { id: "NONE", label: "None" },
];

/* ── Explore by need — 4 fixed gradient tiles, always visible (§14) ────── */

export const NEEDS: ExploreNeed[] = [
  {
    id: "assessment",
    kicker: "Assessment",
    title: "Health assessments",
    action: link("Explore assessments", "/wellness/needs/assessments"),
  },
  {
    id: "nutrition",
    kicker: "Nutrition",
    title: "Diet & healthy habits",
    action: link("Explore nutrition", "/wellness/needs/nutrition"),
  },
  {
    id: "care",
    kicker: "Care",
    title: "Consultations",
    action: link("Explore care", "/wellness/needs/consultations"),
  },
  {
    id: "fitness",
    kicker: "Fitness",
    title: "Fitness & movement",
    action: link("Explore fitness", "/wellness/needs/fitness"),
  },
];

/* ── Organisation benefits pool (§12) ──────────────────────────────────── */

const ALL_BENEFITS: OrganisationBenefit[] = [
  {
    id: "ben-checkup",
    title: "Full body health profile",
    description: "Blood test at home covering key preventive health parameters.",
    thumbnail: { imageKey: "photoCheckup", alt: "Home blood-test health check-up" },
    fundingType: "FULL",
    valueLabel: "Included in your benefits",
    partnerMark: "Apollo Health",
    partnerLogoKey: "ah",
    action: link("View benefit", "/wellness/benefits/full-body-profile"),
  },
  {
    id: "ben-yoga",
    title: "High intensity fitness yoga",
    description: "Guided strength and flexibility sessions with a certified coach.",
    thumbnail: { imageKey: "photoFitness", alt: "Guided fitness yoga session" },
    fundingType: "PARTIAL",
    valueLabel: "10 sessions",
    includedSessions: 10,
    partnerMark: "Yoga with Nidhi",
    partnerLogoKey: "nidhi",
    action: link("Get started", "/wellness/benefits/fitness-yoga"),
  },
  {
    id: "ben-consult",
    title: "Doctor consultation",
    description: "Speak with a doctor online for everyday health concerns.",
    thumbnail: { imageKey: "photoConsult", alt: "Online doctor consultation" },
    fundingType: "PARTIAL",
    valueLabel: "30% subsidised",
    priceAfterContribution: 699,
    partnerMark: "Rootally AI",
    partnerLogoKey: "rootally",
    action: link("View benefit", "/wellness/benefits/doctor-consultation"),
  },
];

/** §12 visibility: 3 → all, 2 → first two, 1 → first one, none → hidden. */
const benefitsFor = (count: BenefitCount): OrganisationBenefit[] => {
  if (count === "NONE") return [];
  if (count === "ONE") return ALL_BENEFITS.slice(0, 1);
  if (count === "TWO") return ALL_BENEFITS.slice(0, 2);
  return ALL_BENEFITS;
};

/* ── Programmes pool (§15, §16) ────────────────────────────────────────── */

/** Available (discoverable) programmes shown under "Explore programmes". */
const AVAILABLE_PROGRAMMES: Programme[] = [
  {
    id: "prog-pt",
    title: "1-on-1 physical training",
    description: "Personal guidance to build strength and everyday fitness.",
    status: "AVAILABLE",
    thumbnail: { imageKey: "photoFitness", alt: "Personal training session" },
    price: 1999,
    originalPrice: 2700,
    sessions: 4,
    action: link("View plans", "/wellness/programmes/physical-training"),
  },
  {
    id: "prog-nutri",
    title: "Nutri connect",
    description: "Personalised diet plans with one-on-one counselling.",
    status: "AVAILABLE",
    thumbnail: { imageKey: "photoNutrition", alt: "Nutrition counselling" },
    price: 999,
    originalPrice: 1500,
    durationLabel: "4 weeks",
    action: link("View plans", "/wellness/programmes/nutri-connect"),
  },
  {
    id: "prog-sleep",
    title: "Sleep better, live better",
    description: "A science-backed programme to help you sleep deeper.",
    status: "AVAILABLE",
    thumbnail: { imageKey: "photoSleep", alt: "Better sleep programme" },
    sessions: 6,
    action: link("View details", "/wellness/programmes/sleep-better"),
  },
  {
    id: "prog-healthy",
    title: "Healthy you",
    description: "Build sustainable habits for a healthier, happier you.",
    status: "AVAILABLE",
    thumbnail: { imageKey: "photoNutrition", alt: "Healthy habits programme" },
    included: true,
    sessions: 5,
    action: link("View details", "/wellness/programmes/healthy-you"),
  },
];

/** The single enrolled programme used by the ONE_PROGRAMME state (KPI 3). */
const ENROLLED_ONE: Programme = {
  id: "prog-nutrition-coaching",
  title: "Nutrition coaching",
  description: "One-on-one plan to build healthy eating habits.",
  status: "ENROLLED",
  thumbnail: { imageKey: "photoNutrition", alt: "Nutrition coaching" },
  durationLabel: "1-month plan",
  action: link("View programme", "/wellness/programmes/nutrition-coaching"),
};

/** Enrolled programmes for the MULTIPLE state. The appointment (below) links
 *  to prog-nutrition-coaching, so §21 excludes it from "Other active". */
const ENROLLED_MANY: Programme[] = [
  ENROLLED_ONE,
  {
    id: "prog-fitness-yoga",
    title: "High intensity fitness yoga",
    description: "Boost strength and flexibility with dynamic yoga blends.",
    status: "ENROLLED",
    thumbnail: { imageKey: "photoFitness", alt: "Fitness yoga programme" },
    sessions: 12,
    durationLabel: "6 weeks",
    nextSessionAt: "2026-07-28T07:00:00",
    nextSessionLabel: "28 Jul",
    action: link("View programme", "/wellness/programmes/fitness-yoga"),
  },
  {
    id: "prog-habit",
    title: "Habit-able coaching",
    description: "Build sustainable habits with expert coaching and accountability.",
    status: "ENROLLED",
    thumbnail: { imageKey: "photoConsult", alt: "Habit coaching programme" },
    sessions: 8,
    durationLabel: "8 weeks",
    action: link("View programme", "/wellness/programmes/habit-coaching"),
  },
];

/* ── Wellness Library (§17) ────────────────────────────────────────────── */

const LIBRARY: LibraryItem[] = [
  {
    id: "lib-video",
    format: "VIDEO",
    title: "Morning stretches for a fresh start",
    description: "Simple stretches to energise your body and mind every morning.",
    thumbnail: { imageKey: "photoStretch", alt: "Morning stretches video" },
    durationLabel: "8 min",
  },
  {
    id: "lib-article",
    format: "ARTICLE",
    title: "5 foods that boost immunity",
    description: "Natural foods that help strengthen your immune system.",
    thumbnail: { imageKey: "photoEating", alt: "Immunity-boosting foods article" },
    durationLabel: "5 min read",
  },
  {
    id: "lib-quick",
    format: "QUICKBYTE",
    title: "Power snacks for busy days",
    description: "Healthy snack ideas to keep your energy up all day.",
    thumbnail: { imageKey: "photoNutrition", alt: "Healthy power snacks" },
    durationLabel: "3 min",
    completionState: "READ",
  },
  {
    id: "lib-webinar",
    format: "WEBINAR",
    title: "Managing stress at work",
    description: "Expert tips and techniques to manage stress and stay productive.",
    thumbnail: { imageKey: "photoSleep", alt: "Managing stress webinar" },
    durationLabel: "45 min",
  },
];

/* ── Base response shared across states ─────────────────────────────────── */

/** Banner carousel below the Wellness Library — full-artwork slides. */
const BANNERS = [
  {
    id: "ban-checkup",
    imageKey: "bannerCheckup",
    alt: "Health checks made simple — book scans, tests and wellness screenings with ease",
    action: link("Book now", "/wellness/checkups"),
  },
  {
    id: "ban-fitness",
    imageKey: "bannerFitness",
    alt: "Build strength, feel better — personal training, fitness plans and recovery programmes",
    action: link("Join now", "/wellness/fitness"),
  },
  {
    id: "ban-nutrition",
    imageKey: "bannerNutrition",
    alt: "Nutrition for everyday wellness — smart meals, supplements and products for a healthier you",
    action: link("Shop now", "/wellness/nutrition"),
  },
];

const base = (
  state: EmployeeWellbeingState,
  benefitCount: BenefitCount
): Omit<WellbeingResponse, "assessment" | "reports" | "appointments" | "programmes"> => ({
  state,
  organisationBenefits: benefitsFor(benefitCount),
  needs: NEEDS,
  library: LIBRARY,
  banners: BANNERS,
});

/* ── State builders (§9, §10, §11, §18) ────────────────────────────────── */

const firstTime = (benefitCount: BenefitCount): WellbeingResponse => ({
  ...base("FIRST_TIME", benefitCount),
  assessment: { status: "NOT_STARTED" },
  reports: [],
  appointments: [],
  programmes: AVAILABLE_PROGRAMMES,
});

const oneProgramme = (benefitCount: BenefitCount): WellbeingResponse => ({
  ...base("ONE_PROGRAMME", benefitCount),
  assessment: { status: "STALE", score: 61, completedAt: "23 January 2026" },
  reports: [
    {
      id: "rep-1",
      name: "Full body check-up",
      reportType: "HEALTH_CHECKUP",
      completedAt: "11 January 2026",
    },
  ],
  appointments: [],
  programmes: [ENROLLED_ONE, ...AVAILABLE_PROGRAMMES.slice(1)],
});

const multipleOrAppointment = (benefitCount: BenefitCount): WellbeingResponse => ({
  ...base("MULTIPLE_OR_APPOINTMENT", benefitCount),
  assessment: { status: "COMPLETED", score: 72, completedAt: "23 June 2026" },
  reports: [
    { id: "rep-1", name: "Full body check-up", reportType: "HEALTH_CHECKUP", completedAt: "18 April 2026" },
    { id: "rep-2", name: "Fitness summary", reportType: "HEALTH_CHECKUP", completedAt: "2 March 2026" },
    { id: "rep-3", name: "Blood work report", reportType: "HEALTH_CHECKUP", completedAt: "11 January 2026" },
  ],
  appointments: [
    {
      id: "appt-1",
      programmeId: "prog-nutrition-coaching",
      title: "Nutrition consultation",
      startAt: "2026-07-28T16:00:00",
      scheduledLabel: "28 July 2026 · 4:00 PM · Online",
      mode: "ONLINE",
      status: "CONFIRMED",
    },
    {
      id: "appt-2",
      title: "Fitness review",
      startAt: "2026-08-02T10:00:00",
      scheduledLabel: "2 August 2026 · 10:00 AM · Online",
      mode: "ONLINE",
      status: "CONFIRMED",
    },
    {
      id: "appt-3",
      title: "Physiotherapy session",
      startAt: "2026-08-05T11:30:00",
      scheduledLabel: "5 August 2026 · 11:30 AM · In person",
      mode: "IN_PERSON",
      status: "CONFIRMED",
    },
  ],
  programmes: [...ENROLLED_MANY, ...AVAILABLE_PROGRAMMES.slice(2)],
});

/** Build the response for a given preview combination. */
export const buildResponse = (
  state: EmployeeWellbeingState,
  benefitCount: BenefitCount
): WellbeingResponse => {
  if (state === "FIRST_TIME") return firstTime(benefitCount);
  if (state === "ONE_PROGRAMME") return oneProgramme(benefitCount);
  return multipleOrAppointment(benefitCount);
};

/* ── §21 selection + de-duplication ────────────────────────────────────── */

/**
 * Runs the spec's selection logic against a response and returns the derived,
 * de-duplicated view the sections render from. Guarantees no programme,
 * benefit or appointment is repeated across the page (§7, §21).
 */
export const derive = (data: WellbeingResponse): DerivedWellbeing => {
  const now = Date.now();

  // Only CONFIRMED, strictly future appointments may claim the card —
  // cancelled, tentative or past ones never override programme information.
  const confirmedAppointments = data.appointments
    .filter((a) => a.status === "CONFIRMED" && +new Date(a.startAt) > now)
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt));
  const nextAppointment = confirmedAppointments[0];

  const enrolledProgrammes = data.programmes.filter(
    (p) => p.status === "ENROLLED"
  );
  // Sponsored programme ready to activate — lowest data-backed state.
  const sponsoredReady = data.programmes.find(
    (p) => p.status === "READY_TO_START"
  );

  // Earliest genuinely-known future session across enrolled programmes. The
  // backend supplies the label; we never manufacture a date to fill the line.
  const nextSessionProgramme = enrolledProgrammes
    .filter((p) => p.nextSessionAt && +new Date(p.nextSessionAt) > now && p.nextSessionLabel)
    .sort((a, b) => +new Date(a.nextSessionAt ?? 0) - +new Date(b.nextSessionAt ?? 0))[0];

  // Priority (spec): confirmed appointment → confirmed next session → one
  // programme → multiple programmes → sponsored ready to activate → explore.
  // The next-session date rides as the supporting line of the programme states.
  const activityCard: ActivityCard = nextAppointment
    ? {
        type: "APPOINTMENT",
        appointment: nextAppointment,
        moreCount: confirmedAppointments.length - 1,
        upcoming: confirmedAppointments,
      }
    : enrolledProgrammes.length === 1
    ? { type: "ONE_PROGRAMME", programme: enrolledProgrammes[0] }
    : enrolledProgrammes.length > 1
    ? {
        type: "MULTIPLE_PROGRAMMES",
        programmes: enrolledProgrammes,
        nextSessionLabel: nextSessionProgramme?.nextSessionLabel,
      }
    : sponsoredReady
    ? { type: "SPONSORED", programme: sponsoredReady }
    : { type: "EXPLORE" };

  // Exclude the programme surfaced in KPI 3 (appointment-linked, the single
  // enrolled programme, or the sponsored one) from "Other active programmes"
  // (§15, §21) so an appointment's linked programme is never repeated below.
  const excludedProgrammeIds = new Set<string>();
  if (nextAppointment?.programmeId) excludedProgrammeIds.add(nextAppointment.programmeId);
  if (!nextAppointment && enrolledProgrammes.length === 1)
    excludedProgrammeIds.add(enrolledProgrammes[0].id);
  if (activityCard.type === "SPONSORED") excludedProgrammeIds.add(activityCard.programme.id);

  const otherActiveProgrammes = enrolledProgrammes.filter(
    (p) => !excludedProgrammeIds.has(p.id)
  );

  // Discoverable = available, not already surfaced, not an org-funded benefit (§16, §21).
  const discoverableProgrammes = data.programmes.filter((p) => {
    if (p.status !== "AVAILABLE") return false;
    if (excludedProgrammeIds.has(p.id)) return false;
    if (p.organisationBenefitId) return false;
    return true;
  });

  return {
    activityCard,
    otherActiveProgrammes,
    discoverableProgrammes,
    // One enrolled programme → the discovery section becomes "Explore more
    // programmes"; anything with active programmes uses the same title (§16).
    exploreMoreTitle: enrolledProgrammes.length >= 1,
  };
};
