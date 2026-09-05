import React, { useEffect, useState } from "react";
import { Tooltip } from "@mui/material";
import {
  ArticleRounded,
  AssignmentOutlined,
  BedtimeRounded,
  BoltRounded,
  CalendarMonthOutlined,
  CardGiftcardRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
  CoPresentRounded,
  DescriptionOutlined,
  DirectionsRunRounded,
  FactCheckRounded,
  LinkedIn,
  LinkRounded,
  MedicalServicesRounded,
  MonitorHeartOutlined,
  MoreHorizRounded,
  NorthEastRounded,
  OndemandVideoRounded,
  PlayArrowRounded,
  RestaurantRounded,
  WhatsApp,
} from "@mui/icons-material";
import { ScoreRing } from "./Illustrations";
import photoCheckup from "../../../../assets/pngs/wellness-promo-checkup.jpg";
import photoFitness from "../../../../assets/pngs/wellness-promo-fitness.jpg";
import photoNutrition from "../../../../assets/pngs/wellness-promo-nutrition.jpg";
import photoConsult from "../../../../assets/pngs/wellness-seminar-eating.jpg";
import photoSleep from "../../../../assets/pngs/wellness-seminar-sleep.jpg";
import photoStretch from "../../../../assets/pngs/wellness-seminar-stretch.jpg";
import logoRootally from "../../../../assets/partners/wellness-partner-rootally.webp";
import logoNidhi from "../../../../assets/partners/wellness-partner-nidhi.webp";
import logoAH from "../../../../assets/partners/wellness-partner-ah.svg";
import bannerCheckup from "../../../../assets/banners/wellness-banner-checkup.webp";
import bannerFitness from "../../../../assets/banners/wellness-banner-fitness.webp";
import bannerNutrition from "../../../../assets/banners/wellness-banner-nutrition.webp";
import {
  ActivityCard,
  DerivedWellbeing,
  ExploreNeed,
  HealthAssessment,
  HealthReport,
  LibraryItem,
  NeedKey,
  OrganisationBenefit,
  Programme,
  PromoBanner,
} from "./types";
import {
  ActiveBody,
  ActiveCard,
  ActiveGrid,
  ActiveMedia,
  BenefitBody,
  BenefitCard,
  BenefitGrid,
  CardDesc,
  CardFoot,
  CardTitle,
  CarouselArrow,
  CarouselBox,
  CarouselCaption,
  CarouselCaptionDescription,
  CarouselCaptionTitle,
  CarouselDot,
  CarouselDots,
  CarouselPlaceholder,
  CarouselSlide,
  CarouselTrack,
  Chip,
  Chips,
  ThumbBadge,
  ThumbWrap,
  KPI_TINT,
  KpiCard,
  KpiArrow,
  KpiBand,
  KpiBlock,
  KpiGrid,
  KpiHead,
  KpiHeadNote,
  KpiHeadText,
  KpiIcon,
  KpiState,
  KpiStatePill,
  KpiStateRow,
  KpiTitle,
  KpiEmptyValue,
  KpiHeadValue,
  KpiVMeta,
  KpiVTitle,
  KpiVTitleRow,
  KpiVTitleText,
  LibraryGrid,
  Media,
  MediaBody,
  MediaCard,
  MediaFormat,
  FormatTagIcon,
  MoreBtn,
  NeedCard,
  OutlinedBtn,
  NeedCopy,
  NeedCta,
  NeedIcon,
  NeedTitle,
  NeedsGrid,
  PartnerLogo,
  PartnerLogoChip,
  PlayDot,
  Price,
  PriceNow,
  PriceWas,
  ProgramBody,
  ProgramCard,
  ProgramGrid,
  Section,
  SectionHead,
  SectionHeading,
  ShareMenu,
  Thumb,
  TextLink,
} from "./styles";

interface PortalProps {
  onOpenPortal: () => void;
}

/** Photo assets resolved by imageKey (real 16:9 photography). */
const PHOTO: Record<string, string> = {
  photoCheckup,
  photoFitness,
  photoNutrition,
  photoConsult,
  photoSleep,
  photoStretch,
  photoEating: photoNutrition, // immunity-foods article reuses the nutrition photo
};
const photo = (key: string) => PHOTO[key] ?? photoNutrition;

/** Partner logo assets resolved by key. Real partner brand marks; add a new
 *  entry + asset here when another partner is onboarded. */
const PARTNER_LOGO: Record<string, string> = {
  rootally: logoRootally,
  nidhi: logoNidhi,
  ah: logoAH,
};

const chevron = <ChevronRightRounded sx={{ fontSize: 16 }} />;

/* ── One crafted MUI icon per Explore-by-need tile (§14, no scene/dupe) ─── */

const NEED_ICON: Record<NeedKey, React.ReactNode> = {
  assessment: <FactCheckRounded />,
  nutrition: <RestaurantRounded />,
  care: <MedicalServicesRounded />,
  fitness: <DirectionsRunRounded />,
};

/* ══ KPI ROW — exactly 3 cards (§8) ═════════════════════════════════════ */

/** Shared card shell: header (icon + title/state + ↗) then a tinted matrix
 *  band with the value/message and a single CTA link. One anatomy, three
 *  cards — colour identifies the category, never the engagement state. */
const arrow = <NorthEastRounded />;

const KpiShell: React.FC<{
  tint: "purple" | "orange" | "green";
  icon: React.ReactNode;
  title: string;
  /** Hidden for first-timers — the state line only appears once engaged. */
  state?: string;
  statePill?: string;
  /** Replaces the icon tile in the header — e.g. the score donut (reference:
   *  scored cards show the donut where the icon normally sits). */
  visual?: React.ReactNode;
  /** Message under the title/state, beside the visual (donut cards). */
  note?: string;
  /** Bold value + meta group in the text column (donut cards) — mirrors the
   *  siblings' bold-value/meta anatomy beside the visual. */
  headBlock?: React.ReactNode;
  onOpenPortal: () => void;
  children?: React.ReactNode;
}> = ({ tint, icon, title, state, statePill, visual, note, headBlock, onOpenPortal, children }) => (
  <KpiCard tint={tint} onClick={onOpenPortal} role="button" tabIndex={0}>
    <KpiHead fill={Boolean(visual) && !children}>
      {visual ?? <KpiIcon tint={tint}>{icon}</KpiIcon>}
      <KpiHeadText>
        <KpiTitle>{title}</KpiTitle>
        {state && (
          <KpiStateRow>
            <KpiState>{state}</KpiState>
            {statePill && <KpiStatePill tint={tint}>{statePill}</KpiStatePill>}
          </KpiStateRow>
        )}
        {headBlock}
        {note && <KpiHeadNote>{note}</KpiHeadNote>}
      </KpiHeadText>
      <KpiArrow className="kpi-arrow" aria-hidden>{arrow}</KpiArrow>
    </KpiHead>
    {children && <KpiBand>{children}</KpiBand>}
  </KpiCard>
);

/** KPI 1 — Health assessment (§9). Category colour: purple.
 *  Content per the "KPI combinations" reference: state label under the title,
 *  bold value (with a score arc when a score exists) or a bold invitation
 *  message when getting started, one meta line, then the CTA. */
const AssessmentKpi: React.FC<{ a: HealthAssessment } & PortalProps> = ({ a, onOpenPortal }) => {
  const hasScore = a.status === "COMPLETED" || a.status === "STALE";
  const pct = hasScore ? a.score ?? 0 : a.progressPercent ?? 0;
  const state =
    a.status === "NOT_STARTED" ? undefined
    : a.status === "IN_PROGRESS" ? "In progress"
    : a.status === "STALE" ? "Latest score"
    : "Score available";
  // Any percentage renders as a donut in the icon tile's place (reference).
  const donut =
    a.status === "NOT_STARTED" ? undefined : (
      <ScoreRing value={pct} size={132} color={KPI_TINT.purple.glyph} unit="%" />
    );
  // Interpretation band — provisional thresholds pending product sign-off;
  // ideally the backend supplies this label alongside the score.
  const scoreBand = pct >= 70 ? "Good" : pct >= 40 ? "Fair" : "Needs attention";
  return (
    <KpiShell
      tint="purple"
      icon={<AssignmentOutlined />}
      visual={donut}
      title="Health assessment"
      state={state}
      statePill={a.status === "STALE" ? "Refresh due" : undefined}
      headBlock={
        hasScore ? (
          <KpiHeadValue>
            <KpiVTitleText>{scoreBand}</KpiVTitleText>
            {/* Date comes from the backend's completedAt — omitted when absent. */}
            {a.completedAt && <KpiVMeta>Assessed {a.completedAt}</KpiVMeta>}
          </KpiHeadValue>
        ) : undefined
      }
      note={
        a.status === "IN_PROGRESS" ? "Continue where you left off"
        : a.status === "STALE" ? "Please retake your assessment"
        : undefined
      }
      onOpenPortal={onOpenPortal}
    >
      {a.status === "NOT_STARTED" && (
        <KpiBlock>
          <KpiEmptyValue tint="purple">Start with a quick health assessment</KpiEmptyValue>
        </KpiBlock>
      )}
    </KpiShell>
  );
};

/** Hover reveal for truncated/aggregated KPI lines — lists every underlying
 *  item so "+N more" and counts are never a dead end. */
const KpiHoverList: React.FC<{
  lines: string[];
  children: React.ReactElement;
}> = ({ lines, children }) => (
  <Tooltip
    arrow
    placement="top-start"
    componentsProps={{
      tooltip: {
        // IIRM tooltip idiom (Policy Periods tooltip): near-black panel,
        // 8px radius, soft shadow, 14px floor type.
        sx: {
          bgcolor: "rgba(33, 33, 33, 0.95)",
          "& .MuiTooltip-arrow": { color: "rgba(33, 33, 33, 0.95)" },
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "14px",
          fontWeight: 500,
          lineHeight: "145%",
          "& > div:not(:last-of-type)": { marginBottom: "6px" },
        },
      },
    }}
    title={
      <>
        {lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </>
    }
  >
    {children}
  </Tooltip>
);

/** Aggregated one-line bold value: first names truncate, "+N" stays pinned.
 *  Forwards ref/props so it can sit directly inside a Tooltip. */
const KpiNamesLine = React.forwardRef<
  HTMLDivElement,
  { titles: string[] } & React.HTMLAttributes<HTMLDivElement>
>(({ titles, ...rest }, ref) => (
  <KpiVTitleRow ref={ref} {...rest}>
    <span className="names">{titles.slice(0, 2).join(" · ")}</span>
    {titles.length > 2 && <span className="plus">· +{titles.length - 2}</span>}
  </KpiVTitleRow>
));
KpiNamesLine.displayName = "KpiNamesLine";

/** KPI 2 — Health check-up (§10). Category colour: orange. */
const CheckupKpi: React.FC<{ reports: HealthReport[] } & PortalProps> = ({ reports, onOpenPortal }) => {
  const count = reports.length;
  const latest = reports[0];
  const state = count === 0 ? undefined : count === 1 ? "Report available" : "Multiple records";
  return (
    <KpiShell tint="orange" icon={<DescriptionOutlined />} title="Health check-up" state={state} onOpenPortal={onOpenPortal}>
      {count === 0 && (
        <KpiBlock>
          <KpiEmptyValue tint="orange">Book your first health check-up</KpiEmptyValue>
        </KpiBlock>
      )}
      {count > 0 && (
        <KpiBlock>
          <KpiHoverList lines={reports.map((r) => `${r.name} — ${r.completedAt}`)}>
            <KpiVTitle>
              {count}<span className="unit">health report{count > 1 ? "s" : ""}</span>
            </KpiVTitle>
          </KpiHoverList>
          <KpiVMeta>{count === 1 ? latest.name : `Latest ${latest.completedAt}`}</KpiVMeta>
        </KpiBlock>
      )}
    </KpiShell>
  );
};

/** KPI 3 — Your wellness activity (adaptive, §11). Category colour: green.
 *  Priority (§11): an upcoming confirmed appointment first, then one enrolled
 *  programme, then multiple, then an Explore fallback. */
/** Short "28 Jul" date for the appointment value (reference layout). */
const apptShortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${d.toLocaleString("en-GB", { month: "short" })}`;
};

/** Time portion of the pre-formatted "28 July 2026 · 4:00 PM · Online" label. */
const apptTime = (scheduledLabel: string) => scheduledLabel.split("·")[1]?.trim() ?? "";

const ActivityKpi: React.FC<{ card: ActivityCard } & PortalProps> = ({ card, onOpenPortal }) => {
  const isAppt = card.type === "APPOINTMENT";
  // Small state label (spec): "Appointment" / "Multiple programmes enrolled" /
  // "1 programme enrolled" / "3 programmes active".
  const state =
    card.type === "APPOINTMENT"
      ? card.moreCount > 0 ? "Multiple programmes enrolled" : "Appointment"
    : card.type === "ONE_PROGRAMME" ? "1 programme enrolled"
    : card.type === "MULTIPLE_PROGRAMMES" ? `${card.programmes.length} programmes active`
    : card.type === "SPONSORED" ? "Sponsored programme"
    : "Programmes available";
  return (
    <KpiShell
      tint="green"
      icon={isAppt ? <CalendarMonthOutlined /> : <MonitorHeartOutlined />}
      title="Your wellness activity"
      state={state}
      onOpenPortal={onOpenPortal}
    >
      {card.type === "APPOINTMENT" && (
        <KpiBlock>
          {/* Multiple upcoming appointments read programme-style: names on ONE
              bold line (truncated, "+N" pinned), a plain count as support —
              per-item schedules live in the hover tooltip. Single stays
              title-first with its own date/time/mode. */}
          {card.moreCount > 0 ? (
            <>
              <KpiHoverList lines={card.upcoming.map((a) => `${a.title} — ${a.scheduledLabel}`)}>
                <KpiNamesLine titles={card.upcoming.map((a) => a.title)} />
              </KpiHoverList>
              <KpiVMeta>{card.upcoming.length} programmes scheduled</KpiVMeta>
            </>
          ) : (
            <>
              <KpiVTitleText>{card.appointment.title}</KpiVTitleText>
              <KpiVMeta>
                {apptShortDate(card.appointment.startAt)} · {apptTime(card.appointment.scheduledLabel)}
                {` · ${card.appointment.mode === "ONLINE" ? "Online" : "In person"}`}
              </KpiVMeta>
            </>
          )}
        </KpiBlock>
      )}
      {card.type === "ONE_PROGRAMME" && (
        <KpiBlock>
          <KpiVTitleText>{card.programme.title}</KpiVTitleText>
          {(card.programme.nextSessionLabel || card.programme.durationLabel) && (
            <KpiVMeta>
              {card.programme.nextSessionLabel
                ? `Next session ${card.programme.nextSessionLabel}`
                : card.programme.durationLabel}
            </KpiVMeta>
          )}
        </KpiBlock>
      )}
      {card.type === "MULTIPLE_PROGRAMMES" && (
        <KpiBlock>
          <KpiHoverList
            lines={card.programmes.map((p) =>
              p.durationLabel ? `${p.title} — ${p.durationLabel}` : p.title
            )}
          >
            <KpiNamesLine titles={card.programmes.map((p) => p.title)} />
          </KpiHoverList>
          {/* Session line only when the date is genuinely known — never manufactured. */}
          {card.nextSessionLabel && (
            <KpiVMeta>Next session {card.nextSessionLabel}</KpiVMeta>
          )}
        </KpiBlock>
      )}
      {card.type === "SPONSORED" && (
        <KpiBlock>
          <KpiVTitleText>{card.programme.title}</KpiVTitleText>
          <KpiVMeta>Ready to activate</KpiVMeta>
        </KpiBlock>
      )}
      {card.type === "EXPLORE" && (
        <KpiBlock>
          <KpiEmptyValue tint="green">Explore wellness programmes</KpiEmptyValue>
        </KpiBlock>
      )}
    </KpiShell>
  );
};

export const KpiRow: React.FC<
  {
    assessment: HealthAssessment;
    reports: HealthReport[];
    activityCard: ActivityCard;
  } & PortalProps
> = ({ assessment, reports, activityCard, onOpenPortal }) => (
  <KpiGrid>
    <AssessmentKpi a={assessment} onOpenPortal={onOpenPortal} />
    <CheckupKpi reports={reports} onOpenPortal={onOpenPortal} />
    <ActivityKpi card={activityCard} onOpenPortal={onOpenPortal} />
  </KpiGrid>
);

/* ══ Benefits from your organisation (§12) ═══════════════════════════════ */

export const BenefitsSection: React.FC<
  { benefits: OrganisationBenefit[] } & PortalProps
> = ({ benefits, onOpenPortal }) => {
  if (!benefits.length) return null; // §12 — none → hide the whole section
  // Count-based rule: 1–2 → compact horizontal cards; 3 → vertical cards.
  const wide = benefits.length <= 2;
  return (
    <Section>
      <SectionHead>
        <SectionHeading>Benefits from your organisation</SectionHeading>
        <TextLink onClick={onOpenPortal} endIcon={chevron}>View all</TextLink>
      </SectionHead>
      <BenefitGrid count={benefits.length}>
        {benefits.map((b) => (
          <BenefitCard key={b.id} wide={wide}>
            {wide ? (
              <ActiveMedia src={photo(b.thumbnail.imageKey)} alt={b.thumbnail.alt} />
            ) : (
              <Media src={photo(b.thumbnail.imageKey)} alt={b.thumbnail.alt} />
            )}
            <BenefitBody>
              <CardTitle>{b.title}</CardTitle>
              <CardDesc>{b.description}</CardDesc>
              {/* Offer as a gray chip, consistent with the programme cards.
                  Fully funded benefits carry no chip — everything shown is
                  already accessible, so "Included" adds no information. */}
              {b.fundingType === "PARTIAL" && (
                <Chips>
                  <Chip>{b.valueLabel}</Chip>
                </Chips>
              )}
              <CardFoot>
                {b.partnerLogoKey && PARTNER_LOGO[b.partnerLogoKey] ? (
                  <PartnerLogoChip>
                    <PartnerLogo
                      src={PARTNER_LOGO[b.partnerLogoKey]}
                      alt={b.partnerMark ?? "Partner"}
                    />
                  </PartnerLogoChip>
                ) : (
                  <span />
                )}
                <OutlinedBtn onClick={onOpenPortal} endIcon={chevron}>View benefit</OutlinedBtn>
              </CardFoot>
            </BenefitBody>
          </BenefitCard>
        ))}
      </BenefitGrid>
    </Section>
  );
};

/* ══ Explore by need — 4 gradient tiles, always visible (§14) ════════════ */

export const NeedsSection: React.FC<{ needs: ExploreNeed[] } & PortalProps> = ({
  needs,
  onOpenPortal,
}) => (
  <Section>
    <SectionHead>
      <SectionHeading>Explore by need</SectionHeading>
    </SectionHead>
    <NeedsGrid>
      {needs.map((n) => (
        <NeedCard key={n.id} need={n.id} onClick={onOpenPortal}>
          <NeedCopy>
            <NeedTitle>{n.title}</NeedTitle>
            <NeedCta
              onClick={(e) => {
                e.stopPropagation();
                onOpenPortal();
              }}
              endIcon={chevron}
            >
              {n.action.label}
            </NeedCta>
          </NeedCopy>
          <NeedIcon>{NEED_ICON[n.id]}</NeedIcon>
        </NeedCard>
      ))}
    </NeedsGrid>
  </Section>
);

/* ══ Programme cards (shared by §15, §16) ════════════════════════════════
 * Count-based layout rule applied everywhere: 1–2 items → compact horizontal
 * cards (thumb left / content right); 3+ items → vertical cards (thumb top).
 * `enrolled` toggles chips + CTA label between active vs discoverable. */

const isHorizontal = (count: number) => count <= 2;

/** Chips + CTA that differ for enrolled (active) vs discoverable programmes. */
const ProgrammeMeta: React.FC<{ p: Programme; enrolled: boolean } & PortalProps> = ({
  p,
  enrolled,
  onOpenPortal,
}) => (
  <>
    <Chips>
      {/* "Enrolled" now overlays the thumbnail (ThumbBadge) — chips carry
          only duration/sessions. */}
      {enrolled && p.durationLabel && <Chip>{p.durationLabel}</Chip>}
      {!enrolled && p.sessions != null && <Chip>{p.sessions} sessions</Chip>}
      {!enrolled && p.durationLabel && <Chip>{p.durationLabel}</Chip>}
    </Chips>
    <CardFoot>
      {/* Pricing as plain text on the left (current + struck original), CTA on
          the right — mirrors the benefits footer (partner logo left / CTA right). */}
      {!enrolled && p.price != null ? (
        <Price>
          <PriceNow>₹{p.price.toLocaleString("en-IN")}</PriceNow>
          {p.originalPrice != null && p.originalPrice > p.price && (
            <PriceWas>₹{p.originalPrice.toLocaleString("en-IN")}</PriceWas>
          )}
        </Price>
      ) : (
        <span />
      )}
      <OutlinedBtn onClick={onOpenPortal} endIcon={chevron}>
        {enrolled ? "View programme" : "View details"}
      </OutlinedBtn>
    </CardFoot>
  </>
);

/** Vertical card (thumb top) — 3+ items. */
const ProgrammeTileV: React.FC<{ p: Programme; enrolled: boolean } & PortalProps> = ({
  p,
  enrolled,
  onOpenPortal,
}) => (
  <ProgramCard>
    <ThumbWrap>
      <Media src={photo(p.thumbnail.imageKey)} alt={p.thumbnail.alt} />
      {enrolled && <ThumbBadge>Enrolled</ThumbBadge>}
    </ThumbWrap>
    <ProgramBody>
      <CardTitle>{p.title}</CardTitle>
      <CardDesc>{p.description}</CardDesc>
      <ProgrammeMeta p={p} enrolled={enrolled} onOpenPortal={onOpenPortal} />
    </ProgramBody>
  </ProgramCard>
);

/** Compact horizontal card (thumb left) — 1–2 items. */
const ProgrammeTileH: React.FC<{ p: Programme; enrolled: boolean } & PortalProps> = ({
  p,
  enrolled,
  onOpenPortal,
}) => (
  <ActiveCard>
    <ThumbWrap>
      <ActiveMedia src={photo(p.thumbnail.imageKey)} alt={p.thumbnail.alt} />
      {enrolled && <ThumbBadge>Enrolled</ThumbBadge>}
    </ThumbWrap>
    <ActiveBody>
      <CardTitle>{p.title}</CardTitle>
      <CardDesc>{p.description}</CardDesc>
      <ProgrammeMeta p={p} enrolled={enrolled} onOpenPortal={onOpenPortal} />
    </ActiveBody>
  </ActiveCard>
);

/** Programme list with the count-based layout rule. */
const ProgrammeCards: React.FC<
  { items: Programme[]; enrolled: boolean } & PortalProps
> = ({ items, enrolled, onOpenPortal }) =>
  isHorizontal(items.length) ? (
    <ActiveGrid cols={items.length}>
      {items.map((p) => (
        <ProgrammeTileH key={p.id} p={p} enrolled={enrolled} onOpenPortal={onOpenPortal} />
      ))}
    </ActiveGrid>
  ) : (
    <ProgramGrid cols={items.length}>
      {items.map((p) => (
        <ProgrammeTileV key={p.id} p={p} enrolled={enrolled} onOpenPortal={onOpenPortal} />
      ))}
    </ProgramGrid>
  );

/* ══ Other active programmes (§15) ═══════════════════════════════════════ */

export const ActiveProgrammesSection: React.FC<
  { programmes: Programme[] } & PortalProps
> = ({ programmes, onOpenPortal }) => {
  // §15: hide for 0 or 1 (single programme lives only in KPI 3).
  if (programmes.length < 2) return null;
  const shown = programmes.slice(0, 3);
  return (
    <Section>
      <SectionHead>
        <SectionHeading>Other active programmes</SectionHeading>
        {programmes.length > 3 && (
          <TextLink onClick={onOpenPortal} endIcon={chevron}>View all</TextLink>
        )}
      </SectionHead>
      <ProgrammeCards items={shown} enrolled onOpenPortal={onOpenPortal} />
    </Section>
  );
};

/* ══ Explore programmes (§16) ════════════════════════════════════════════ */

export const ExploreProgrammesSection: React.FC<
  { programmes: Programme[]; moreTitle: boolean } & PortalProps
> = ({ programmes, moreTitle, onOpenPortal }) => {
  if (!programmes.length) return null;
  const shown = programmes.slice(0, 3);
  return (
    <Section>
      <SectionHead>
        <SectionHeading>{moreTitle ? "Explore more programmes" : "Explore programmes"}</SectionHeading>
        <TextLink onClick={onOpenPortal} endIcon={chevron}>View all</TextLink>
      </SectionHead>
      <ProgrammeCards items={shown} enrolled={false} onOpenPortal={onOpenPortal} />
    </Section>
  );
};

/* ══ Wellness Library (§17) ══════════════════════════════════════════════ */

const FORMAT_LABEL: Record<LibraryItem["format"], string> = {
  VIDEO: "Video",
  ARTICLE: "Article",
  WEBINAR: "Webinar",
  QUICKBYTE: "QuickBytes",
  AUDIO: "Sleep music",
};

/** Format-type icon shown inside the top-left format tag (existing MUI set). */
const FORMAT_ICON: Record<LibraryItem["format"], React.ReactNode> = {
  VIDEO: <OndemandVideoRounded />,
  ARTICLE: <ArticleRounded />,
  WEBINAR: <CoPresentRounded />,
  QUICKBYTE: <BoltRounded />,
  AUDIO: <BedtimeRounded />,
};

const isPlayable = (f: LibraryItem["format"]) => f === "VIDEO" || f === "WEBINAR" || f === "AUDIO";

const LibraryTile: React.FC<{ item: LibraryItem } & PortalProps> = ({ item, onOpenPortal }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <MediaCard onClick={onOpenPortal}>
      <Thumb>
        <Media src={photo(item.thumbnail.imageKey)} alt={item.thumbnail.alt} />
        <MoreBtn
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
          aria-label="Share options"
        >
          <MoreHorizRounded />
        </MoreBtn>
        {isPlayable(item.format) && <PlayDot><PlayArrowRounded /></PlayDot>}
        <ShareMenu open={menuOpen} onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onOpenPortal}>
            <LinkRounded />
            Copy link
          </button>
          <button type="button" onClick={onOpenPortal}>
            <WhatsApp />
            Share via WhatsApp
          </button>
          <button type="button" onClick={onOpenPortal}>
            <LinkedIn />
            Share via LinkedIn
          </button>
        </ShareMenu>
      </Thumb>
      <MediaBody>
        <CardTitle>{item.title}</CardTitle>
        <CardDesc>{item.description}</CardDesc>
        <MediaFormat>
          <FormatTagIcon format={item.format}>{FORMAT_ICON[item.format]}</FormatTagIcon>
          {FORMAT_LABEL[item.format]} · {item.durationLabel}
        </MediaFormat>
      </MediaBody>
    </MediaCard>
  );
};

export const LibrarySection: React.FC<{ items: LibraryItem[] } & PortalProps> = ({
  items,
  onOpenPortal,
}) => {
  if (!items.length) return null;
  return (
    <Section>
      <SectionHead>
        <SectionHeading>Wellness Library</SectionHeading>
        <TextLink onClick={onOpenPortal} endIcon={chevron}>View all</TextLink>
      </SectionHead>
      <LibraryGrid>
        {items.map((item) => (
          <LibraryTile key={item.id} item={item} onOpenPortal={onOpenPortal} />
        ))}
      </LibraryGrid>
    </Section>
  );
};

/* ══ Banner carousel — below the Wellness Library ════════════════════════ */

/** Banner artwork resolved by imageKey (full designs, text baked in). */
const BANNER_ART: Record<string, string> = {
  bannerCheckup,
  bannerFitness,
  bannerNutrition,
};

export const BannerCarouselSection: React.FC<
  { banners: PromoBanner[] } & PortalProps
> = ({ banners, onOpenPortal }) => {
  const [index, setIndex] = useState(0);
  const count = banners.length;

  // Auto-advance every 5s; a single-slide carousel stays still.
  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), 5000);
    return () => clearInterval(timer);
  }, [count]);

  if (!count) return null;
  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);
  const active = banners[index];

  const handleBoxClick = () => {
    if (active?.redirectionUrl) {
      window.open(active.redirectionUrl, "_blank", "noopener,noreferrer");
      return;
    }
    onOpenPortal();
  };

  return (
    <Section>
      <CarouselBox onClick={handleBoxClick}>
        <CarouselTrack index={index}>
          {banners.map((b) => {
            const src = b.imageUrl || BANNER_ART[b.imageKey ?? ""];
            return src ? (
              <CarouselSlide key={b.id} src={src} alt={b.alt} />
            ) : (
              <CarouselPlaceholder key={b.id}>
                <CardGiftcardRounded />
              </CarouselPlaceholder>
            );
          })}
        </CarouselTrack>
        {/* Nothing to navigate to with a single banner — hide the controls. */}
        {count > 1 && (
          <>
            <CarouselArrow
              side="left"
              aria-label="Previous banner"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
            >
              <ChevronLeftRounded />
            </CarouselArrow>
            <CarouselArrow
              side="right"
              aria-label="Next banner"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
            >
              <ChevronRightRounded />
            </CarouselArrow>
            <CarouselDots>
              {banners.map((b, i) => (
                <CarouselDot
                  key={b.id}
                  active={i === index}
                  aria-label={`Go to banner ${i + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                  }}
                />
              ))}
            </CarouselDots>
          </>
        )}
      </CarouselBox>
      {active?.title && (
        <CarouselCaption onClick={handleBoxClick} clickable={Boolean(active.redirectionUrl)}>
          <CarouselCaptionTitle>{active.title}</CarouselCaptionTitle>
          {active.description && (
            <CarouselCaptionDescription>{active.description}</CarouselCaptionDescription>
          )}
        </CarouselCaption>
      )}
    </Section>
  );
};

export type { DerivedWellbeing };
