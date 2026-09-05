import { Box, Button, Typography, keyframes, styled } from "@mui/material";
import { ibpTheme } from "@ui/ui-lib";
import { LibraryItem, NeedKey } from "./types";

/**
 * WELL-BEING — styles, aligned to the IIRM IBP implementation spec (§4) and
 * the IIRM brand system. Enterprise, calm, COMPACT, premium. Rules:
 *  · 8px corner radius everywhere (§4.1)
 *  · IIRM Figtree type with a 14px minimum — sizes come from theme tokens,
 *    never hardcoded sub-14px px (brand fidelity)
 *  · subtle 1px borders, very light shadows only (§4.3) — no glow/glass
 *  · IIRM-blue solid primary CTA, blue text/soft secondary (§4.2)
 *  · gradients ONLY on the 4 "Explore by need" tiles + promo banner (§4.4)
 *  · tight vertical rhythm — reduced bulk across KPIs, tiles, programmes
 */

/* ── Tokens — all derived from ibpTheme (IIRM design system), no local
 *    hard-coded values. Sourced once at module level so the many styled
 *    components below can share them. ─────────────────────────────────── */

const { palette, shape, shadows } = ibpTheme;

export const R = shape.borderRadii.medium; // 8px inner-element radius (§4.1)
export const BLUE = palette.text.blue; // IIRM primary blue
export const BLUE_DK = palette.background.buttonbackground; // pressed/hover blue
export const LINK_BLUE = palette.text.blue;
export const YELLOW = palette.secondary.main; // promo accent only (§4.2)
export const INK = palette.text.primary;
export const MUTED = palette.text.mediumGrey;
export const LINE = palette.border.gray; // inner hairlines
export const SURFACE = palette.background.paper;

/** Very light resting shadow; a soft lift on hover. No glow (§4.3). */
export const SOFT_SHADOW = shadows[6];
export const HOVER_SHADOW = shadows[9];

/**
 * Explore-by-need gradients — the only card gradients allowed (§4.4, §14).
 * Refreshed to a cleaner, more modern, enterprise-calm palette: deep indigo,
 * fresh teal-green, warm coral, and a confident IIRM-leaning blue.
 */
export const NEED_GRADIENT: Record<NeedKey, string> = {
  assessment: "linear-gradient(135deg, #5B4BE0 0%, #7C6BF5 100%)",
  nutrition: "linear-gradient(135deg, #0FA36B 0%, #34C08A 100%)",
  care: "linear-gradient(135deg, #F0596B 0%, #F7857E 100%)",
  fitness: "linear-gradient(135deg, #1E7FD6 0%, #46A7F0 100%)",
};

/** Same-hue drop shadows so each tile's elevation matches its gradient. */
export const NEED_SHADOW: Record<NeedKey, string> = {
  assessment: "rgba(91,75,224,0.38)",
  nutrition: "rgba(15,163,107,0.38)",
  care: "rgba(240,89,107,0.38)",
  fitness: "rgba(30,127,214,0.38)",
};

const rise = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

/* ── Page scaffold — one white container (§5) ──────────────────────────── */

export const HubWrapper = styled(Box)(() => ({ width: "100%" }));

/** Enrolled-policies card family (PolicySummaryCard/styles.ts) — the client's
 *  reference surface. Applied to the hub shell and every photo card so the
 *  whole module reads as one family with the policy cards above it. KPI cards
 *  and the Explore-by-need tiles keep their category colours (client). */
const FAMILY_GRAD = "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)";
const FAMILY_GRAD_HOVER =
  "linear-gradient(355deg, rgba(5, 109, 210, 0.03) 21.39%, rgba(5, 109, 210, 0.23) 183.31%)";
const FAMILY_BORDER = "1px solid #FFFFFF";
const FAMILY_SHADOW = "0px 6px 100px 0px #0000001A";

/** One white Well-being container; every subsection stacks inside it (§5).
 *  Outer surface mirrors the policy cards (StyledInsuranceCard): 16px radius,
 *  1px border.main stroke, paper background. */
export const Shell = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(10), // 40px between subsections
  padding: theme.spacing(6),
  borderRadius: theme.spacing(4),
  // Pure white shell (client): the grey family gradient on this large surface
  // read as muddy — white lets the gradient cards pop, matching how the
  // enrolled policy cards sit on the light page background.
  background: theme.palette.background.paper,
  border: FAMILY_BORDER,
  boxShadow: FAMILY_SHADOW,
  animation: `${rise} .35s ease both`,
  [theme.breakpoints.down("sm")]: { padding: theme.spacing(4), gap: theme.spacing(5) },
}));

/** The single top-level title row (§4.5, §22 — one title only). Mirrors the
 *  policy accordion header (ShieldIconWrapper + SectionTitle/SectionSubtitle
 *  in DashboardBenifitsSection): 60px icon tile left, title + one-liner. */
export const HubTop = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
}));

export const HubHead = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(4),
}));

export const HubIconWrap = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 60,
  height: 60,
  "& img": { width: "100%", height: "100%" },
}));

export const HubHeadText = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
}));

export const HubTitle = styled(Typography)(({ theme }) => ({
  fontSize: 28,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: palette.text.tertiary,
  [theme.breakpoints.between("sm", "lg")]: { fontSize: 22 },
  [theme.breakpoints.down("sm")]: { fontSize: 18 },
}));

export const HubSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: palette.text.tertiary,
}));

/** Filled primary CTA in the hub header — mirrors the app's ContinueButton
 *  ("Continue to Summary" in BottomFooter/styles.ts): navy fill, 6px radius. */
export const HubCta = styled(Button)(({ theme }) => ({
  textTransform: "none",
  padding: theme.spacing(2, 4),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: palette.neutral.veryLight,
  background: palette.background.buttonbackground,
  borderRadius: theme.spacing(1.5),
  boxShadow: "none",
  whiteSpace: "nowrap",
  "& .MuiButton-endIcon": { marginLeft: theme.spacing(0.5) },
  "&:hover": {
    background: palette.background.buttonbackground,
    filter: "brightness(1.15)",
    boxShadow: "none",
  },
}));

export const Section = styled(Box)(() => ({ animation: `${rise} .35s ease both` }));

export const SectionHead = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(2.5),
}));

export const SectionHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg, // 18px
  fontWeight: theme.typography.fontWeights.bold,
  color: INK,
  lineHeight: "130%",
}));

export const TextLink = styled(Button)(({ theme }) => ({
  minWidth: 0,
  padding: theme.spacing(0.5, 0),
  textTransform: "none",
  fontSize: theme.typography.fontSizes.sm, // 15px
  fontWeight: theme.typography.fontWeights.semiBold,
  color: LINK_BLUE,
  "& .MuiButton-endIcon": { marginLeft: theme.spacing(0.25) },
  "&:hover": { background: "transparent", textDecoration: "underline" },
}));

/* ── Buttons (§4.2) ────────────────────────────────────────────────────── */

/** Solid IIRM-blue primary CTA — one per card state. */
export const PrimaryBtn = styled(Button)(({ theme }) => ({
  alignSelf: "flex-start",
  width: "max-content",
  textTransform: "none",
  padding: theme.spacing(1.1, 2.25),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  borderRadius: R,
  color: palette.neutral.veryLight,
  background: BLUE,
  boxShadow: "none",
  "&:hover": { background: BLUE_DK, boxShadow: "none" },
}));

/** Secondary — light blue-tinted fill, blue text. */
export const SoftBtn = styled(Button)(({ theme }) => ({
  alignSelf: "flex-start",
  width: "max-content",
  textTransform: "none",
  padding: theme.spacing(1.1, 2.25),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  borderRadius: R,
  color: LINK_BLUE,
  background: palette.button.primaryBlueHover,
  boxShadow: "none",
  "&:hover": { background: palette.background.tableHeaderHover, boxShadow: "none" },
}));

/** Outlined secondary button — matches the app's existing "View Policy Details"
 *  secondary CTA (BenifitsCard/ArrowButton): navy border + navy text, transparent
 *  fill, filling navy with white text on hover. */
const NAVY = palette.background.buttonbackground;
export const OutlinedBtn = styled(Button)(({ theme }) => ({
  alignSelf: "flex-start",
  width: "max-content",
  textTransform: "none",
  padding: theme.spacing(1.1, 2.5),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  borderRadius: 6,
  color: NAVY,
  background: "transparent",
  border: `1px solid ${NAVY}`,
  boxShadow: "none",
  "& .MuiButton-endIcon": { marginLeft: theme.spacing(0.5) },
  "&:hover": {
    background: NAVY,
    color: palette.neutral.veryLight,
    border: `1px solid ${NAVY}`,
    boxShadow: "none",
  },
}));

/** Ghost blue text CTA with chevron. */
export const GhostBtn = styled(Button)(({ theme }) => ({
  alignSelf: "flex-start",
  minWidth: 0,
  padding: theme.spacing(0.5, 0),
  textTransform: "none",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: LINK_BLUE,
  "& .MuiButton-endIcon": { marginLeft: theme.spacing(0.25), transition: "transform .2s ease" },
  "&:hover": {
    background: "transparent",
    textDecoration: "underline",
    "& .MuiButton-endIcon": { transform: "translateX(3px)" },
  },
}));

/* ── KPI row — exactly 3 cards on calm surfaces (§8) ────────────────────── */

export const KpiGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: theme.spacing(4), // 16px — uniform card gap across the hub
  [theme.breakpoints.down("lg")]: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
  [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
}));

/* ── KPI card — reference "State Kit" anatomy ────────────────────────────
 * Every card follows the reference kit exactly and identically:
 *   1. HEADER (white) — a soft-tinted rounded-square category icon (light
 *      background, coloured glyph) + title and state label + a small ↗
 *      navigation arrow on the right.
 *   2. MATRIX BAND (light category tint) — the large primary value/message
 *      and its supporting caption.
 *   3. CTA (bottom) — a single category-coloured action link.
 * Colour identifies the KPI CATEGORY, never the engagement state:
 *   purple = Health assessment · orange = Health check-up · green = activity.
 * Cards are equal width/height and 8px radius. */

/** Per-category colour tokens. `glyph` = coloured icon fg; `ink` = CTA/value
 *  accent; `iconGrad` = soft diagonal gradient behind the glyph; `bandGrad` =
 *  the matrix band's vertical white→tint gradient (per the reference). */
export const KPI_TINT = {
  purple: {
    glyph: "#6B54C6",
    ink: "#5A45B8",
    stroke: "#CFC0F4",
    shadow: "0 8px 20px -6px rgba(107, 84, 198, 0.18)",
    shadowHover: "0 12px 28px -6px rgba(107, 84, 198, 0.30)",
    iconGrad: "linear-gradient(135deg, #F3EFFD 0%, #E6DEFA 100%)",
    bandGrad: "linear-gradient(180deg, #FDFCFF 0%, #ECE4FF 100%)",
    bandGradHover: "linear-gradient(180deg, #F2EBFF 0%, #DCCBFC 100%)",
  },
  orange: {
    glyph: "#E38315",
    ink: "#C46A0A",
    stroke: "#F4D3A4",
    shadow: "0 8px 20px -6px rgba(227, 131, 21, 0.18)",
    shadowHover: "0 12px 28px -6px rgba(227, 131, 21, 0.30)",
    iconGrad: "linear-gradient(135deg, #FDF2E3 0%, #FADEBF 100%)",
    bandGrad: "linear-gradient(180deg, #FFFEFB 0%, #FFE9CE 100%)",
    bandGradHover: "linear-gradient(180deg, #FFF6E8 0%, #FFDFB8 100%)",
  },
  green: {
    glyph: "#149A63",
    ink: "#0F7D50",
    stroke: "#ABE3C8",
    shadow: "0 8px 20px -6px rgba(20, 154, 99, 0.18)",
    shadowHover: "0 12px 28px -6px rgba(20, 154, 99, 0.30)",
    iconGrad: "linear-gradient(135deg, #E6F7EF 0%, #D0F0E1 100%)",
    bandGrad: "linear-gradient(180deg, #FCFFFD 0%, #D9F6E7 100%)",
    bandGradHover: "linear-gradient(180deg, #F0FBF5 0%, #C8F0DC 100%)",
  },
} as const;

export type KpiTint = keyof typeof KPI_TINT;

/** Whole card carries the soft vertical gradient (reference: uniform tint).
 *  The card itself is the click target (no bottom CTA — the ↗ arrow signals
 *  navigation), so it lifts on hover and the arrow nudges towards its corner. */
export const KpiCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== "tint",
})<{ tint: KpiTint }>(({ tint }) => ({
  display: "flex",
  flexDirection: "column",
  minHeight: 170,
  borderRadius: R,
  background: KPI_TINT[tint].bandGrad,
  border: `1px solid ${KPI_TINT[tint].stroke}`,
  boxShadow: KPI_TINT[tint].shadow, // category-tinted resting shadow
  overflow: "hidden",
  cursor: "pointer",
  transition: "background .2s ease, border-color .2s ease, box-shadow .2s ease",
  "&:hover": {
    background: KPI_TINT[tint].bandGradHover,
    boxShadow: KPI_TINT[tint].shadowHover,
    "& .kpi-arrow": { color: KPI_TINT[tint].ink },
  },
}));

/** Header zone (white) — icon + title/state + navigation arrow. `fill` makes
 *  the header the card's ONLY zone (donut cards): it stretches top-to-bottom
 *  so the scaled-up donut sits on the centre line with small padding. */
export const KpiHead = styled(Box, {
  shouldForwardProp: (prop) => prop !== "fill",
})<{ fill?: boolean }>(({ theme, fill }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3), // 12px
  padding: theme.spacing(4, 4, 3), // 16px / 16px / 12px — compact
  ...(fill && {
    flexGrow: 1,
    alignItems: "stretch", // text column spans the card: title top, note bottom
    padding: theme.spacing(4), // same 16px top as the other KPI headers
    "& > svg": { alignSelf: "center" }, // donut stays on the centre line
    // Sibling cards centre their title/state block and arrow against a 48px
    // icon tile; mirror those offsets so all three headers share one line.
    "& > div:not(.kpi-arrow)": { paddingTop: "3px" },
    "& .kpi-arrow": { alignSelf: "flex-start", marginTop: "13px" }, // arrow top-right, on the shared line
  }),
}));

/** Soft-gradient rounded-square category icon — diagonal tint, coloured glyph. */
export const KpiIcon = styled(Box, {
  shouldForwardProp: (prop) => prop !== "tint",
})<{ tint: KpiTint }>(({ tint }) => ({
  width: 48,
  height: 48,
  flexShrink: 0,
  borderRadius: 12,
  display: "grid",
  placeItems: "center",
  color: KPI_TINT[tint].glyph,
  background: KPI_TINT[tint].iconGrad,
  "& svg": { fontSize: 26 },
}));

/** Title + state label stack, between the icon and the arrow. */
export const KpiHeadText = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  flexGrow: 1,
  minWidth: 0,
}));

export const KpiTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md, // 16px
  fontWeight: theme.typography.fontWeights.semiBold,
  color: INK,
  lineHeight: "130%",
}));

/** State row under the KPI title — label plus an optional attention pill. */
export const KpiStateRow = styled(Box)(({ theme }) => ({
  marginTop: 2,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2), // 8px
}));

/** Message under the title/state stack on donut cards (reference: "Please
 *  retake your assessment" sits beside the donut, not down in the band). */
/** Bold value + meta group inside the donut card's text column — fills the
 *  otherwise-empty lower right so the card matches its siblings' anatomy.
 *  marginTop auto floats it towards the bottom of the stretched column. */
export const KpiHeadValue = styled(Box)(({ theme }) => ({
  marginTop: "auto",
  paddingTop: theme.spacing(2),
}));

export const KpiHeadNote = styled(Typography)(({ theme }) => ({
  marginTop: "auto", // bottom of the card on full-height donut cards
  paddingTop: theme.spacing(1),
  fontSize: theme.typography.fontSizes.xs, // 14px floor
  color: MUTED,
  lineHeight: "140%",
}));

/** State label under the KPI title, e.g. "Score available" / "In progress". */
export const KpiState = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs, // 14px floor
  color: MUTED,
  lineHeight: "130%",
}));

/** Small attention pill beside the state label (reference: "Refresh due"). */
export const KpiStatePill = styled(Box, {
  shouldForwardProp: (prop) => prop !== "tint",
})<{ tint: KpiTint }>(({ theme, tint }) => ({
  padding: theme.spacing(0.5, 1.75), // 2px / 7px
  borderRadius: 999,
  fontSize: theme.typography.fontSizes.xxs, // 14px floor
  fontWeight: theme.typography.fontWeights.semiBold,
  color: KPI_TINT[tint].ink,
  background: palette.background.paper,
  border: `1px solid ${LINE}`,
  lineHeight: "130%",
  whiteSpace: "nowrap",
}));

/** Value + score-arc row (reference: big number left, gauge right). */
export const KpiScoreRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(3),
}));

/** Small ↗ navigation arrow, top-right — decorative cue; the whole card is
 *  the click target. Nudges towards the corner on card hover (see KpiCard). */
export const KpiArrow = styled(Box)(() => ({
  flexShrink: 0,
  width: 22,
  height: 22,
  display: "grid",
  placeItems: "center",
  color: palette.neutral.lightMedium,
  transition: "transform .2s ease, color .2s ease",
  "& svg": { fontSize: 18 },
}));

/** Content zone below the header — transparent now that the WHOLE card is
 *  tinted (reference: uniform gradient). flexGrow keeps every card's zone the
 *  same height so CTAs bottom-align. */
export const KpiBand = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(0, 4, 4), // 0 top (header provides it) / 16px sides+bottom
}));

/** Value + visual row inside the band (report-stack + labels). */
export const KpiVisualRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.75),
}));

/** Plain value block inside the band (text-only KPI content). */
export const KpiBlock = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  marginTop: "auto", // the value + meta group pins to the card bottom as ONE unit
}));

/** Horizontal value layout (reference kit): big value on the LEFT, a two-line
 *  meta stack on the RIGHT, vertically centred — e.g. "98 · New: 34 / Annual
 *  Change: 65%". */
export const KpiValueRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3), // 12px between value and the two-line meta
}));

/** The two-line meta stack shown to the right of the value. Both lines share
 *  one size; no gap between them (tight two-line block per the reference). */
export const KpiMetaStack = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  minWidth: 0,
}));

/** One line of the two-line meta stack (14px, muted). */
export const KpiMetaLine = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs, // 14px floor
  color: MUTED,
  lineHeight: "140%",
}));

/** The large primary value line, e.g. "72/100", "3 reports", "1 planned".
 *  The leading number is heavy; the trailing unit is lighter and muted (kit). */
export const KpiVTitle = styled(Typography)(({ theme }) => ({
  fontSize: 26, // large primary value (compact)
  fontWeight: theme.typography.fontWeights.bold,
  color: INK,
  lineHeight: "115%",
  whiteSpace: "nowrap",
  flexShrink: 0,
  "& .unit": {
    marginLeft: 6, // same size/weight as the number — one continuous value
  },
}));

/** A title-cased primary value used when the KPI value is text, not a number
 *  (e.g. an appointment/programme title) — same size as the numeric value so
 *  sibling KPI cards read as one row. */
export const KpiVTitleText = styled(Typography)(({ theme }) => ({
  fontSize: 26, // matches KpiVTitle
  fontWeight: theme.typography.fontWeights.bold,
  color: INK,
  lineHeight: "115%",
  display: "-webkit-box",
  WebkitLineClamp: 2, // spec: bold primary line never exceeds two lines
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
}));

/** One-line variant for aggregated names ("A · B · +1"). The names truncate
 *  with an ellipsis while the "+N" count stays pinned and always visible —
 *  the hover tooltip carries the full list. */
export const KpiVTitleRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "baseline",
  minWidth: 0,
  fontSize: 26, // matches KpiVTitle
  fontWeight: theme.typography.fontWeights.bold,
  color: INK,
  lineHeight: "115%",
  "& .names": {
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    minWidth: 0,
  },
  "& .plus": {
    whiteSpace: "nowrap",
    flexShrink: 0,
    marginLeft: 6,
  },
}));

/** The "—" placeholder shown for empty states so a numeric "0" never appears
 *  (reference kit: Not started / No records / Zero active all show a dash). */
/** Empty-state value line — a bold dark headline (e.g. "No score yet") shown
 *  in place of a number for first-time/empty states. No secondary caption; the
 *  CTA below is the only follow-on. */
export const KpiEmptyValue = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "tint",
})<{ tint: KpiTint }>(({ theme, tint }) => ({
  fontSize: 26, // matches KpiVTitle — the empty state IS the card's bold value
  fontWeight: theme.typography.fontWeights.bold,
  color: KPI_TINT[tint].ink, // category-coloured invitation
  lineHeight: "115%",
  display: "-webkit-box",
  WebkitLineClamp: 2, // wraps once if needed; never truncates mid-word ugly
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
}));

/** Muted supporting line under the first-timer invitation headline. */
export const KpiEmptySub = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
  fontSize: theme.typography.fontSizes.sm, // 15px
  color: MUTED,
  lineHeight: "145%",
}));

export const KpiVMeta = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1), // tight to the value — same group
  fontSize: theme.typography.fontSizes.xs, // 14px floor
  color: MUTED,
  lineHeight: "145%",
}));

/** Empty-state message inside the band — never a numeric "0". */
export const KpiEmpty = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm, // 15px
  fontWeight: theme.typography.fontWeights.semiBold,
  color: INK,
  lineHeight: "145%",
}));

/** Bottom row of the band holding the CTA — pushed to the band's base so the
 *  action lines up across all three cards regardless of content height. */
export const KpiCta = styled(Box)(({ theme }) => ({
  marginTop: "auto",
  paddingTop: theme.spacing(4), // 16px gap between value and CTA
}));

/** KPI action link — a single text CTA tinted to the KPI category, matching
 *  the reference kit ("Start assessment →", "View insights →"). */
export const KpiLink = styled(Button, {
  shouldForwardProp: (prop) => prop !== "tint",
})<{ tint: KpiTint }>(({ theme, tint }) => ({
  minWidth: 0,
  padding: 0,
  textTransform: "none",
  fontSize: theme.typography.fontSizes.sm, // 15px
  fontWeight: theme.typography.fontWeights.semiBold,
  color: KPI_TINT[tint].ink,
  "& .MuiButton-endIcon": { marginLeft: theme.spacing(0.5) },
  "&:hover": { background: "transparent", textDecoration: "underline" },
}));

/** Layered report-stack visual for KPI 2. */
export const ReportStack = styled(Box)(() => ({
  position: "relative",
  width: 58,
  height: 56,
  flexShrink: 0,
  "& span": {
    position: "absolute",
    width: 40,
    height: 48,
    borderRadius: 7,
    border: `1px solid ${LINE}`,
    background: palette.background.paper,
    boxShadow: "0 3px 8px -4px rgba(36,62,94,0.18)",
  },
  "& span:nth-of-type(1)": { left: 14, transform: "rotate(5deg)", background: palette.background.tableHeader },
  "& span:nth-of-type(2)": { left: 7, top: 3, transform: "rotate(-3deg)", background: palette.background.lightBlue },
  "& span:nth-of-type(3)": { left: 0, top: 6 },
}));

/* ── Organisation benefits (§12) ───────────────────────────────────────── */

export const BenefitGrid = styled(Box, {
  shouldForwardProp: (prop) => prop !== "count",
})<{ count: number }>(({ theme, count }) => ({
  display: "grid",
  gridTemplateColumns:
    count === 1 ? "minmax(0, 760px)" : `repeat(${Math.min(count, 3)}, minmax(0, 1fr))`,
  gap: theme.spacing(4), // 16px — uniform card gap across the hub
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: count === 1 ? "minmax(0, 760px)" : "repeat(2, minmax(0, 1fr))",
  },
  [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
}));

/** Card. wide (1–2 items) → horizontal (thumb left / content right, §12);
 *  3 items → vertical (thumb top). Matches the shared programme rule. */
export const BenefitCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== "wide",
})<{ wide: boolean }>(({ theme, wide }) => ({
  display: wide ? "grid" : "flex",
  flexDirection: "column",
  gridTemplateColumns: wide ? "minmax(150px, 34%) 1fr" : undefined,
  overflow: "hidden",
  borderRadius: R,
  background: FAMILY_GRAD,
  border: FAMILY_BORDER,
  boxShadow: FAMILY_SHADOW,
  transition: "background .2s ease, transform .2s ease",
  "&:hover": { background: FAMILY_GRAD_HOVER, transform: "translateY(-2px)" },
  [theme.breakpoints.down("sm")]: { display: "flex", flexDirection: "column" },
}));

/** Relative wrapper so a status badge can overlay the thumbnail. Stretches
 *  with the grid cell so the image inside can fill it (horizontal cards). */
export const ThumbWrap = styled(Box)(() => ({
  position: "relative",
  minWidth: 0,
}));

/** Solid green "Enrolled" pill overlaid top-left on the thumbnail — enrolled
 *  cards only (client). Solid base of the palette lightGreen token. */
export const ThumbBadge = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(3), // 12px
  left: theme.spacing(3),
  padding: theme.spacing(1, 3), // 4px 12px
  borderRadius: R,
  background: "#16A249",
  color: "#FFFFFF",
  fontSize: theme.typography.fontSizes.xs, // 14px floor
  fontWeight: theme.typography.fontWeights.semiBold,
  lineHeight: "145%",
}));

/** 16:9 media band (§12). */
export const Media = styled("img")(() => ({
  display: "block",
  width: "100%",
  aspectRatio: "16 / 9",
  objectFit: "cover",
}));

export const BenefitBody = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2), // 8px between title / description / chips
  padding: theme.spacing(6), // 24px content padding (base unit is 4px) — consistent everywhere
  minWidth: 0,
  flexGrow: 1, // fill card height so the footer (marginTop:auto) pins to bottom
  height: "100%", // stretch inside the grid cell for the wide/horizontal card
}));

export const CardTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md, // 16px
  fontWeight: theme.typography.fontWeights.semiBold,
  color: INK,
  lineHeight: "138%",
}));

export const CardDesc = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm, // 15px
  color: MUTED,
  lineHeight: "150%",
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
}));

export const ValueLabel = styled(Typography)(({ theme }) => ({
  marginTop: 2,
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.bold,
  color: palette.text.lightGreen,
}));

/**
 * Card footer group: partner logo (left) + CTA (right) on one line, always
 * pinned to the bottom of the card (marginTop:auto) so CTAs align across cards
 * of different heights. Law of Proximity — a generous top gap (no divider)
 * separates this action group from the content above (title/desc/chip).
 */
export const CardFoot = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1),
  marginTop: "auto",
}));

/** Partner logo mark — real logo image, height-constrained, no text. */
/** White rounded chip that hosts a partner logo. Normalises logos of any
 *  aspect ratio or baked-in background into one consistent partner badge, so
 *  a transparent wordmark and a solid-background tile read alike in the row. */
export const PartnerLogoChip = styled(Box)(({ theme }) => ({
  height: 48,
  maxWidth: 176,
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(0.5, 0.75),
  borderRadius: 8,
  background: palette.background.paper,
  overflow: "hidden",
}));

export const PartnerLogo = styled("img")(() => ({
  height: "100%",
  width: "auto",
  maxWidth: "100%",
  objectFit: "contain",
  objectPosition: "left center",
  display: "block",
}));

/* ── Explore by need — 4 compact gradient tiles, one row (§14) ─────────── */

export const NeedsGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: theme.spacing(4), // 16px — uniform card gap across the hub
  [theme.breakpoints.down("lg")]: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
  [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
}));

/** Gradient tile (reference: game-category cards) — single title + CTA on the
 *  left, one large TILTED line icon offset off the right edge (~70% visible),
 *  and a soft drop shadow in the tile's own hue. */
export const NeedCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== "need",
})<{ need: NeedKey }>(({ theme, need }) => ({
  position: "relative",
  minHeight: 128,
  overflow: "hidden",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(6), // 24px
  borderRadius: R,
  color: palette.neutral.veryLight,
  background: NEED_GRADIENT[need],
  boxShadow: `0 14px 26px -12px ${NEED_SHADOW[need]}`,
  transition: "transform .2s ease, box-shadow .2s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: `0 20px 34px -12px ${NEED_SHADOW[need]}`,
  },
}));

export const NeedCopy = styled(Box)(() => ({
  position: "relative",
  zIndex: 2,
  width: "78%",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
}));

export const NeedTitle = styled(Typography)(({ theme }) => ({
  maxWidth: 190,
  fontSize: theme.typography.fontSizes.lg, // 18px
  fontWeight: theme.typography.fontWeights.bold,
  lineHeight: "120%",
  letterSpacing: "-0.01em",
  color: palette.neutral.veryLight,
}));

export const NeedCta = styled(Button)(({ theme }) => ({
  minWidth: 0,
  marginTop: theme.spacing(3), // 12px gap between title and CTA
  padding: 0,
  textTransform: "none",
  fontSize: theme.typography.fontSizes.xs, // 14px floor
  fontWeight: theme.typography.fontWeights.semiBold,
  color: palette.neutral.veryLight,
  "& .MuiButton-endIcon": { marginLeft: theme.spacing(0.5), transition: "transform .2s ease" },
  "&:hover": { background: "transparent", "& .MuiButton-endIcon": { transform: "translateX(3px)" } },
}));

/** One large line icon, tilted and cut off at the right edge (~70% visible),
 *  in a translucent tone of the tile colour (§14 — one icon, no scene). */
export const NeedIcon = styled(Box)(() => ({
  position: "absolute",
  top: "50%",
  right: -26,
  zIndex: 1,
  transform: "translateY(-50%) rotate(-14deg)",
  color: "rgba(255,255,255,0.30)",
  pointerEvents: "none",
  lineHeight: 0,
  "& svg": { fontSize: 104 },
}));

/* ── Programme cards — vertical (Explore) + horizontal (active, §15/§16) ── */

export const ProgramGrid = styled(Box, {
  shouldForwardProp: (prop) => prop !== "cols",
})<{ cols: number }>(({ theme, cols }) => ({
  display: "grid",
  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
  gap: theme.spacing(4), // 16px — uniform card gap across the hub
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: `repeat(${Math.min(cols, 2)}, minmax(0, 1fr))`,
  },
  [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
}));

export const ProgramCard = styled(Box)(() => ({
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRadius: R,
  background: FAMILY_GRAD,
  border: FAMILY_BORDER,
  boxShadow: FAMILY_SHADOW,
  transition: "background .2s ease, transform .2s ease",
  "&:hover": { background: FAMILY_GRAD_HOVER, transform: "translateY(-2px)" },
}));

export const ProgramBody = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2), // 8px between title / description / chips
  padding: theme.spacing(3, 6), // 24px content padding (base unit is 4px) — consistent everywhere
  minWidth: 0,
  flexGrow: 1, // fill card height so the footer pins to the bottom
  height: "100%",
}));

/**
 * COMPACT horizontal active-programme card (fixes #3): thumbnail left,
 * content right — mirrors the org-benefit horizontal treatment so two sit
 * neatly side by side without dominating the page.
 */
export const ActiveGrid = styled(Box, {
  shouldForwardProp: (prop) => prop !== "cols",
})<{ cols: number }>(({ theme, cols }) => ({
  display: "grid",
  gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
  gap: theme.spacing(4), // 16px — uniform card gap across the hub
  [theme.breakpoints.down("md")]: { gridTemplateColumns: "1fr" },
}));

export const ActiveCard = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "minmax(150px, 34%) 1fr",
  overflow: "hidden",
  borderRadius: R,
  background: FAMILY_GRAD,
  border: FAMILY_BORDER,
  boxShadow: FAMILY_SHADOW,
  transition: "background .2s ease, transform .2s ease",
  "&:hover": { background: FAMILY_GRAD_HOVER, transform: "translateY(-2px)" },
  [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
}));

export const ActiveMedia = styled("img")(({ theme }) => ({
  display: "block",
  width: "100%",
  height: "100%",
  minHeight: 132,
  objectFit: "cover",
  [theme.breakpoints.down("sm")]: { aspectRatio: "16 / 9", height: "auto" },
}));

export const ActiveBody = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2), // 8px between title / description / chips
  padding: theme.spacing(6), // 24px content padding (base unit is 4px) — consistent everywhere
  minWidth: 0,
  flexGrow: 1, // fill card height so the footer pins to the bottom
  height: "100%",
}));

export const Chips = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(0.75),
}));

export const Chip = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.5, 1.25),
  borderRadius: R,
  fontSize: theme.typography.fontSizes.xs, // 14px floor
  fontWeight: theme.typography.fontWeights.semiBold,
  color: palette.text.grey,
  background: palette.background.calendarDay,
}));

/** Pricing block shown as plain text on the LEFT of the card footer: current
 *  price + struck-through original price. Not a chip. */
export const Price = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "baseline",
  gap: theme.spacing(1.5), // 6px
}));

export const PriceNow = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg, // 18px
  fontWeight: theme.typography.fontWeights.bold,
  color: INK,
  lineHeight: 1,
}));

export const PriceWas = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm, // 15px
  fontWeight: theme.typography.fontWeights.semiBold,
  color: MUTED,
  textDecoration: "line-through",
  lineHeight: 1,
}));

export const IncludedChip = styled(Chip)(() => ({
  color: palette.text.lightGreen,
  background: palette.gradients.lightGreen.end,
}));

/** Enrolled state chip — green with a tick mark, always the first chip. */
export const EnrolledChip = styled(IncludedChip)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1), // 4px between tick and label
  "& svg": { fontSize: 14 },
}));

/* ── Wellness Library (§17) ────────────────────────────────────────────── */

export const LibraryGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
  gap: theme.spacing(4), // 16px — uniform card gap across the hub
  [theme.breakpoints.down("lg")]: { gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
  [theme.breakpoints.down("sm")]: { gridTemplateColumns: "1fr" },
}));

export const MediaCard = styled(Box)(() => ({
  position: "relative",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  borderRadius: R,
  background: FAMILY_GRAD,
  border: FAMILY_BORDER,
  boxShadow: FAMILY_SHADOW,
  transition: "background .2s ease, transform .2s ease",
  "&:hover": { background: FAMILY_GRAD_HOVER, transform: "translateY(-2px)" },
}));

export const Thumb = styled(Box)(() => ({ position: "relative" }));

export const FormatTag = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: 10,
  left: 10,
  zIndex: 2,
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  padding: theme.spacing(0.5, 1),
  borderRadius: R,
  fontSize: theme.typography.fontSizes.xs, // 14px floor
  fontWeight: theme.typography.fontWeights.semiBold,
  color: INK,
  background: "rgba(255,255,255,0.94)",
}));

/** Per-format icon inside the format tag. */
export const FormatTagIcon = styled(Box, {
  shouldForwardProp: (prop) => prop !== "format",
})<{ format: LibraryItem["format"] }>(({ format }) => {
  const map: Record<LibraryItem["format"], string> = {
    VIDEO: "#E23B4E",
    ARTICLE: "#2F7AC7",
    WEBINAR: "#0E9488",
    QUICKBYTE: "#7A56D6",
    AUDIO: "#5B4BE0",
  };
  return {
    display: "grid",
    placeItems: "center",
    color: map[format],
    "& svg": { fontSize: 15 },
  };
});

/** Three-dot share trigger (§17). */
export const MoreBtn = styled("button")(() => ({
  position: "absolute",
  top: 10,
  right: 10,
  zIndex: 3,
  width: 30,
  height: 30,
  display: "grid",
  placeItems: "center",
  border: "1px solid rgba(255,255,255,0.7)",
  borderRadius: R,
  background: "rgba(255,255,255,0.92)",
  color: INK,
  cursor: "pointer",
  opacity: 0.6,
  transition: "opacity .2s ease",
  "& svg": { fontSize: 18 },
}));

/** Centre play — playable formats only (§17). */
export const PlayDot = styled(Box)(() => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  zIndex: 2,
  width: 46,
  height: 46,
  display: "grid",
  placeItems: "center",
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.6)",
  background: "rgba(18,28,44,0.72)",
  color: palette.neutral.veryLight,
  transform: "translate(-50%,-50%)",
  "& svg": { fontSize: 22, marginLeft: 2 },
}));

export const MediaBody = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  gap: theme.spacing(2), // 8px between title / description / format
  padding: theme.spacing(6), // 24px content padding (base unit is 4px) — consistent everywhere
}));

export const MediaFormat = styled(Typography)(({ theme }) => ({
  display: "flex",
  marginTop: "auto", // pin the format · time row to the card bottom
  alignItems: "center",
  gap: theme.spacing(1.5), // 6px between the format icon and the label
  fontSize: theme.typography.fontSizes.xs, // 14px floor
  fontWeight: theme.typography.fontWeights.semiBold,
  color: MUTED, // grey label (client) — only the format icon stays coloured
}));

/** Title + format-type icon on one row. */
export const CompletionState = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  marginTop: theme.spacing(0.5),
  fontSize: theme.typography.fontSizes.xs, // 14px floor
  fontWeight: theme.typography.fontWeights.semiBold,
  color: palette.text.lightGreen,
  "& svg": { fontSize: 15 },
}));

/** Share menu popover (§17) — IIRM styling: 8px radius, soft hairline border,
 *  refined elevation, and each item is an icon + label row with a muted icon
 *  that adopts the IIRM blue on hover. */
export const ShareMenu = styled(Box, {
  shouldForwardProp: (prop) => prop !== "open",
})<{ open: boolean }>(({ theme, open }) => ({
  position: "absolute",
  top: 44,
  right: 10,
  zIndex: 6,
  width: 208,
  display: open ? "flex" : "none",
  flexDirection: "column",
  gap: 2,
  padding: theme.spacing(1),
  borderRadius: R,
  border: `1px solid ${LINE}`,
  background: SURFACE,
  boxShadow: "0 12px 32px -8px rgba(21,55,82,0.20)",
  "& button": {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(2.5), // 10px between icon and label
    width: "100%",
    border: 0,
    borderRadius: 6,
    padding: theme.spacing(2, 2.5), // 8px / 10px
    textAlign: "left",
    background: "transparent",
    color: INK,
    fontSize: theme.typography.fontSizes.xs, // 14px floor
    fontWeight: theme.typography.fontWeights.semiBold,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: "background .15s ease, color .15s ease",
    "& svg": { fontSize: 18, color: MUTED, flexShrink: 0, transition: "color .15s ease" },
    "&:hover": { background: palette.button.primaryBlueHover, color: LINK_BLUE, "& svg": { color: LINK_BLUE } },
  },
}));

/* ── Banner carousel (below the Wellness Library) ──────────────────────── */

export const CarouselBox = styled(Box)(() => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: R,
  border: `1px solid ${LINE}`,
  boxShadow: SOFT_SHADOW,
  cursor: "pointer",
}));

/** Slides laid side by side; the active index slides the track across. */
export const CarouselTrack = styled(Box, {
  shouldForwardProp: (prop) => prop !== "index",
})<{ index: number }>(({ index }) => ({
  display: "flex",
  transform: `translateX(-${index * 100}%)`,
  transition: "transform .55s cubic-bezier(.4,0,.2,1)",
}));

export const CarouselSlide = styled("img")(() => ({
  width: "100%",
  flexShrink: 0,
  display: "block",
  aspectRatio: "2508 / 627", // matches the banner artwork (4:1)
  objectFit: "cover",
}));

/** Shown instead of CarouselSlide when a real offer has no image (or it failed to load). */
export const CarouselPlaceholder = styled(Box)(() => ({
  width: "100%",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  aspectRatio: "2508 / 627",
  background: "linear-gradient(135deg, #DFE7FD 0%, #E2ECE9 100%)",
  "& svg": { fontSize: 40, color: "rgba(21,55,82,0.35)" },
}));

export const CarouselArrow = styled("button", {
  shouldForwardProp: (prop) => prop !== "side",
})<{ side: "left" | "right" }>(({ side }) => ({
  position: "absolute",
  top: "50%",
  [side]: 14,
  transform: "translateY(-50%)",
  zIndex: 2,
  width: 36,
  height: 36,
  display: "grid",
  placeItems: "center",
  border: 0,
  borderRadius: "50%",
  background: "rgba(255,255,255,0.9)",
  color: INK,
  cursor: "pointer",
  boxShadow: "0 4px 12px rgba(21,55,82,0.22)",
  transition: "background .15s ease",
  "&:hover": { background: palette.background.paper },
  "& svg": { fontSize: 20 },
}));

export const CarouselDots = styled(Box)(({ theme }) => ({
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 12,
  zIndex: 2,
  display: "flex",
  justifyContent: "center",
  gap: theme.spacing(1.5), // 6px
}));

export const CarouselDot = styled("button", {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active: boolean }>(({ active }) => ({
  width: active ? 22 : 8,
  height: 8,
  padding: 0,
  border: 0,
  borderRadius: 999,
  cursor: "pointer",
  background: active ? palette.background.paper : "rgba(255,255,255,0.55)",
  boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
  transition: "width .25s ease, background .25s ease",
}));

/** Caption below the image — only rendered for real Offers & Benefits slides (mock art has no title). */
export const CarouselCaption = styled(Box, {
  shouldForwardProp: (prop) => prop !== "clickable",
})<{ clickable?: boolean }>(({ theme, clickable }) => ({
  marginTop: theme.spacing(1.5),
  padding: theme.spacing(1.75, 2.5),
  borderRadius: R,
  border: `1px solid ${LINE}`,
  boxShadow: SOFT_SHADOW,
  background: palette.background.paper,
  cursor: clickable ? "pointer" : "default",
  transition: "box-shadow .15s ease",
  "&:hover": clickable ? { boxShadow: "0 8px 20px -8px rgba(21,55,82,0.28)" } : {},
}));

export const CarouselCaptionTitle = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 700,
  color: INK,
  lineHeight: 1.35,
}));

export const CarouselCaptionDescription = styled(Typography)(() => ({
  marginTop: 2,
  fontSize: 12.5,
  color: MUTED,
  lineHeight: 1.45,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
}));

/* ── Preview control bar (§6; design review only, never production) ─────── */

export const PreviewBar = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: theme.spacing(2.5),
  padding: theme.spacing(1.5, 2.5),
  borderRadius: R,
  color: palette.neutral.veryLight,
  background: INK,
  marginBottom: theme.spacing(2.5),
}));

export const PreviewNote = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs, // 14px floor
  fontWeight: theme.typography.fontWeights.medium,
  opacity: 0.9,
}));

export const PreviewControls = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2.5),
}));

export const PreviewGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  "& .lbl": {
    fontSize: theme.typography.fontSizes.xs, // 14px floor
    fontWeight: theme.typography.fontWeights.bold,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    opacity: 0.72,
  },
}));

export const PreviewSwitch = styled(Box)(() => ({
  display: "flex",
  gap: 3,
  padding: 3,
  borderRadius: R,
  background: "rgba(255,255,255,0.1)",
}));

export const PreviewPill = styled("button", {
  shouldForwardProp: (prop) => prop !== "active",
})<{ active?: boolean }>(({ theme, active }) => ({
  border: 0,
  borderRadius: 6,
  padding: theme.spacing(0.75, 1.5),
  fontSize: theme.typography.fontSizes.xs, // 14px floor
  fontWeight: theme.typography.fontWeights.semiBold,
  fontFamily: "inherit",
  cursor: "pointer",
  color: active ? INK : palette.border.lightGrey,
  background: active ? palette.background.paper : "transparent",
  transition: "all .15s ease",
}));
