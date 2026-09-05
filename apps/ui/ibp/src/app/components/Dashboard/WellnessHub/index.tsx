import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { apiRequest, endPoints } from "@ui/ui-lib";
import { setToastMessage } from "../../../redux/slice";
import { useCompanyConfig } from "../../../hooks/useCompanyConfig";
import {
  // CardDesc,
  // CardFoot,
  // CardTitle,
  // Chip,
  // Chips,
  BENEFIT_SCENARIOS,
  EMPLOYEE_SCENARIOS,
  buildResponse,
  derive,
} from "./mockData";
import { BenefitCount, EmployeeWellbeingState } from "./types";
import { useOfferBenefitBanners } from "./useOfferBenefitBanners";
import {
  ActiveProgrammesSection,
  BannerCarouselSection,
  BenefitsSection,
  ExploreProgrammesSection,
  KpiRow,
  LibrarySection,
  NeedsSection,
} from "./cards";
import {
  HubCta,
  HubHead,
  HubHeadText,
  HubIconWrap,
  HubSubtitle,
  HubTitle,
  HubTop,
  HubWrapper,
  Media,
  OutlinedBtn,
  ProgramBody,
  ProgramCard,
  ProgramGrid,
  Section,
  SectionHead,
  SectionHeading,
  Shell,
  ThumbWrap,
  LibraryGrid,
  MediaCard,
  Thumb,
  MediaBody,
  MediaFormat,
  FormatTagIcon,
  PlayDot,
  MoreBtn,
  TextLink,
  CardTitle,
  CardDesc,
  Chips,
  CardFoot,
} from "./styles";
import { Box, Chip } from "@mui/material";
import {
  ArticleRounded,
  BedtimeRounded,
  BoltRounded,
  ChevronRightRounded,
  CoPresentRounded,
  MoreHorizRounded,
  OndemandVideoRounded,
  PlayArrowRounded,
} from "@mui/icons-material";
import wellnessIcon from "../../../../assets/svgs/wellness-programmes.svg";
// No-config fallback: the default "welcome" cards are the three getting-started
// KPI tiles (KPI 1/2/3) from the existing mock render path.
// import { buildResponse, derive } from "./mockData";
// import { KpiRow } from "./cards";

/**
 * WELL-BEING
 * Rendered PURELY from the live portal-config response
 * (useCompanyConfig().portalWellnessConfig). Each configured section is a row
 * of simple cards (heading / subheading / link / tags / colour / thumbnail).
 * Thumbnails are downloaded by file id (authorised blob → object URL). Only
 * sections and cards that actually have content are shown; the whole section
 * is hidden when `portalWellnessConfig.enabled === false`.
 */

/* ── portalWellnessConfig shape + normalisation ────────────────────────── */

interface PortalCard {
  id: string;
  link: { url: string; type: string };
  tags: string[];
  order: number;
  heading: string;
  subheading: string;
  colorTemplate?: string;
  colorCode?: string;
  gradient?: string;
  textColor?: string;
  format?: string;
  durationLabel?: string;
  thumbnailFileId: number | null;
}
type PortalWellnessConfig = Record<string, { cards: PortalCard[] } | undefined>;

interface WellnessCard {
  id: string;
  title: string;
  subtitle: string;
  thumbnailFileId: number | null;
  url: string;
  tags: string[];
  colorTemplate?: string;
  colorCode?: string;
  gradient?: string;
  textColor?: string;
  format?: string;
  durationLabel?: string;
}
interface WellnessSection {
  key: string;
  title: string;
  cards: WellnessCard[];
}

/** Section render order + display titles. */
const SECTION_META: { key: string; title: string }[] = [
  { key: "healthAssessment", title: "Health assessment" },
  { key: "organisationBenefits", title: "Benefits from your organisation" },
  { key: "exploreByNeed", title: "Explore by need" },
  { key: "explorePrograms", title: "Explore programmes" },
  { key: "wellnessLibrary", title: "Wellness Library" },
];

/** Media format → display label + whether it shows a ▶ play overlay. */
const FORMAT_LABEL: Record<string, string> = {
  VIDEO: "Video",
  ARTICLE: "Article",
  QUICKBYTE: "QuickBytes",
  WEBINAR: "Webinar",
  AUDIO: "Audio",
};
const isPlayable = (f?: string) => f === "VIDEO" || f === "WEBINAR" || f === "AUDIO";

/** Format-type icon shown in the library card's media badge. */
const FORMAT_ICON: Record<string, React.ReactNode> = {
  VIDEO: <OndemandVideoRounded />,
  ARTICLE: <ArticleRounded />,
  WEBINAR: <CoPresentRounded />,
  QUICKBYTE: <BoltRounded />,
  AUDIO: <BedtimeRounded />,
};

/** colorTemplate → accent used as a thin card top-border. */
const ACCENT: Record<string, string> = {
  purple: "#7C4DFF",
  orange: "#E8833A",
  green: "#1FA97A",
};



/** Fixed columns per section (mirrors the design's 3-up / 4-up rows). Using a
 *  fixed count instead of the card count keeps cards ~1/3–1/4 width so the
 *  16:9 thumbnails render at a consistent height regardless of how many cards
 *  a section has. Fewer cards than columns simply leave trailing empty cells. */
const SECTION_COLUMNS: Record<string, number> = {
  healthAssessment: 3,
  organisationBenefits: 3,
  exploreByNeed: 4,
  explorePrograms: 3,
  wellnessLibrary: 4,
};
const DEFAULT_COLUMNS = 3;

/** Sections that collapse to 3 cards with an expandable "View all" link. */
const SECTION_VIEW_ALL = new Set([
  "organisationBenefits",
  "explorePrograms",
  "wellnessLibrary",
]);
const COLLAPSED_COUNT = 3;

/** Normalise the config into render-ready sections — only what has content. */
const buildSections = (cfg: PortalWellnessConfig): WellnessSection[] => {
  return SECTION_META.map(({ key, title }) => ({
    key,
    title,
    cards: (cfg[key]?.cards ?? [])
      .filter((c) => c.heading?.trim())
      .sort((a, b) => a.order - b.order)
      .map((c) => ({
        id: c.id,
        title: c.heading.trim(),
        subtitle: c.subheading?.trim() ?? "",
        thumbnailFileId: c.thumbnailFileId,
        url: c.link?.url ?? "",
        tags: c.tags ?? [],
        colorTemplate: c.colorTemplate,
        colorCode: c.colorCode,
        gradient: c.gradient,
        textColor: c.textColor,
        format: c.format,
        durationLabel: c.durationLabel,
      })),
  })).filter((s) => s.cards.length > 0);
};

/* ── Authorised thumbnail — download the file by id, render as object URL ── */

const CardThumb: React.FC<{ fileId: number; alt: string }> = ({ fileId, alt }) => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    // Same download route as the header company logo — note the required
    // `company-employee` segment; employee-scoped auth (Authorization + userid)
    // is applied by the axios interceptor.
    apiRequest(endPoints.ibpFileUploadDownloadById(fileId), {
      responseType: "blob",
    })
      .then((res: any) => {
        const blob = (res?.data ?? res) as Blob;
        if (!active || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => undefined); // no thumbnail → card renders without an image
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);
  if (!src) return null;
  // Fixed height (with object-fit cover) so every image card is the same
  // height regardless of card width / column count — overrides Media's 16:9.
  return (
    <Media
      src={src}
      alt={alt}
      style={{ height: 170, aspectRatio: "auto", objectFit: "cover", width: "100%" }}
    />
  );
};

const chevron = <ChevronRightRounded sx={{ fontSize: 16 }} />;

const WellnessHub: React.FC<{ userName?: string }> = () => {
  const dispatch = useDispatch();
  const { portalWellnessConfig, loading: isConfigLoading } = useCompanyConfig();
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  // Per-section expand state: collapsed shows the first 3 cards; "View all"
  // toggles it open to reveal every card in that section (inline, no portal).
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleSection = (key: string) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const sections = buildSections(
    (portalWellnessConfig ?? {}) as PortalWellnessConfig
  );
  // Master switch from the portal config — absent => disabled (default false);
  // only an explicit true shows the wellness section.
  const wellnessEnabled =
    (portalWellnessConfig as { enabled?: boolean } | null | undefined)?.enabled === true;

  /** Same magic-URL SSO flow as the rest of the app — the header CTA. */
  // Real Offers & Benefits (Company Configuration → Offers & Benefits in
  // iwork) take over the promo carousel when this DOMAIN (subdomain-resolved,
  // same as branding/auth via useCompanyConfig) has any configured; otherwise
  // it falls back to the mock banners above so the preview/demo states keep
  // working.
  const { offersAndBenefits, offersAndBenefitsEnabled } = useCompanyConfig();
  const { banners: offerBenefitBanners } = useOfferBenefitBanners(
    offersAndBenefits,
    offersAndBenefitsEnabled
  );
  const banners = offerBenefitBanners.length
    ? offerBenefitBanners
    : buildResponse("FIRST_TIME", "THREE").banners;

  /** Same magic-URL SSO flow as the rest of the app. */
  const openPortal = async () => {
    if (isPortalLoading) return;
    const userDetails = JSON.parse(sessionStorage.getItem("user") || "{}");
    setIsPortalLoading(true);
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(
        "<html><body style='font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#f8fafc'><p style='color:#555;font-size:15px'>Redirecting to Wellness Portal...</p></body></html>"
      );
      win.document.close();
    }
    try {
      const res = await apiRequest(endPoints.alyveWellnessUrl, {
        method: "POST",
        data: {
          appKey: "alyve-wellness",
          dynamicFields: {
            mobile:
              userDetails?.phone ??
              userDetails?.mobile ??
              userDetails?.phoneNumber ??
              "",
            name: userDetails?.employeeName ?? userDetails?.fullName ?? "",
            gender: String(
              userDetails?.gender?.value ?? userDetails?.gender ?? ""
            ).toLowerCase(),
            dob: (userDetails?.dateOfBirth ?? userDetails?.dob ?? "")
              .toString()
              .slice(0, 10),
          },
        },
      });
      const redirectUrl =
        (res as any)?.data?.jsonData?.redirect_url ??
        (res as any)?.jsonData?.redirect_url;
      if (redirectUrl && win && !win.closed) {
        win.location.replace(redirectUrl);
        win.focus();
      } else {
        win?.close();
        const msg = (res as any)?.data?.message ?? (res as any)?.message;
        dispatch(
          setToastMessage({
            message: msg || "Unable to open Wellness portal. Please try again.",
            type: "error",
          })
        );
      }
    } catch (err: any) {
      win?.close();
      const msg = err?.response?.data?.message ?? err?.message;
      dispatch(
        setToastMessage({
          message: msg || "Unable to open Wellness portal. Please try again.",
          type: "error",
        })
      );
    } finally {
      setIsPortalLoading(false);
    }
  };

  /** A card opens its configured link; empty links fall back to the portal. */
  const openCard = (url: string) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
    else openPortal();
  };

  // While the config is still loading, render nothing (avoid flashing cards).
  if (isConfigLoading) return null;
  // Master switch — only an explicit enabled === true shows the wellness
  // section. When disabled (or no config saved at all), render nothing — not
  // even the welcome cards.
  if (!wellnessEnabled) return null;
  // Enabled, but the admin hasn't configured any cards yet → show the default
  // getting-started "welcome" cards (KPI 1/2/3) as a fallback.
  if (sections.length === 0) {
    const data = buildResponse("FIRST_TIME", "THREE");
    const derived = derive(data);
    return (
      <HubWrapper>
        <Shell>
          <HubTop>
            <HubHead>
              <HubIconWrap>
                <img src={wellnessIcon} alt="Wellness Programmes Icon" />
              </HubIconWrap>
              <HubHeadText>
                <HubTitle>Wellness Programmes</HubTitle>
                <HubSubtitle>
                  Explore programmes and resources that keep you at your best
                </HubSubtitle>
              </HubHeadText>
            </HubHead>
            <HubCta variant="contained" onClick={openPortal} endIcon={chevron}>
              View all wellness options
            </HubCta>
          </HubTop>
          <KpiRow
            assessment={data.assessment}
            reports={data.reports}
            activityCard={derived.activityCard}
            onOpenPortal={openPortal}
          />
          {/* Offers & Benefits is configured separately from the wellness
              sections, so it must render here too — not only when sections
              exist. */}
          <BannerCarouselSection banners={banners} onOpenPortal={openPortal} />
        </Shell>
      </HubWrapper>
    );
  }

  return (
    <HubWrapper>
      <Shell>
        <HubTop>
          <HubHead>
            <HubIconWrap>
              <img src={wellnessIcon} alt="Wellness Programmes Icon" />
            </HubIconWrap>
            <HubHeadText>
              <HubTitle>Wellness Programmes</HubTitle>
              <HubSubtitle>
                Explore programmes and resources that keep you at your best
              </HubSubtitle>
            </HubHeadText>
          </HubHead>
          <HubCta variant="contained" onClick={openPortal} endIcon={chevron}>
            View all wellness options
          </HubCta>
        </HubTop>

        {sections.map((s) => {
          const canViewAll = SECTION_VIEW_ALL.has(s.key) && s.cards.length > COLLAPSED_COUNT;
          const isOpen = !!expandedSections[s.key];
          // Collapsed → first 3 cards; expanded (or ≤3) → all cards.
          const visibleCards =
            canViewAll && !isOpen ? s.cards.slice(0, COLLAPSED_COUNT) : s.cards;
          return (
          <Section key={s.key}>
            <SectionHead>
              <SectionHeading>{s.title}</SectionHeading>
              {canViewAll && (
                <TextLink onClick={() => toggleSection(s.key)} endIcon={chevron}>
                  {isOpen ? "View less" : "View all"}
                </TextLink>
              )}
            </SectionHead>
            {s.key === "wellnessLibrary" ? (
              <LibraryGrid>
                {visibleCards.map((c) => (
                  <MediaCard key={c.id} onClick={() => openCard(c.url)}>
                    <Thumb>
                      {c.thumbnailFileId != null && (
                        <CardThumb fileId={c.thumbnailFileId} alt={c.title} />
                      )}
                      <MoreBtn
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Options"
                      >
                        <MoreHorizRounded />
                      </MoreBtn>
                      {isPlayable(c.format) && (
                        <PlayDot>
                          <PlayArrowRounded />
                        </PlayDot>
                      )}
                    </Thumb>
                    <MediaBody>
                      <CardTitle>{c.title}</CardTitle>
                      {c.subtitle && <CardDesc>{c.subtitle}</CardDesc>}
                      {c.format && (
                        <MediaFormat>
                          <FormatTagIcon format={c.format as never}>
                            {FORMAT_ICON[c.format]}
                          </FormatTagIcon>
                          {`${FORMAT_LABEL[c.format] ?? c.format}${
                            c.durationLabel ? ` · ${c.durationLabel}` : ""
                          }`}
                        </MediaFormat>
                      )}
                    </MediaBody>
                  </MediaCard>
                ))}
              </LibraryGrid>
            ) : (
            <ProgramGrid cols={SECTION_COLUMNS[s.key] ?? DEFAULT_COLUMNS}>
              {visibleCards.map((c) => {
                // Colour comes straight from the config (iwork sends the #code
                // + section-appropriate gradient); ACCENT is a back-compat
                // fallback for older cards that only carried the key name.
                const accent =
                  c.colorCode ?? (c.colorTemplate ? ACCENT[c.colorTemplate] : undefined);
                const textStyle = c.textColor ? { color: c.textColor } : undefined;
                return (
                <ProgramCard
                  key={c.id}
                  onClick={() => openCard(c.url)}
                  style={{
                    ...(c.gradient ? { background: c.gradient } : {}),
                    ...(c.textColor ? { color: c.textColor } : {}),
                    ...(accent ? { borderTop: `3px solid ${accent}` } : {}),
                  }}
                >
                  {c.thumbnailFileId != null && (
                    <ThumbWrap>
                      <CardThumb fileId={c.thumbnailFileId} alt={c.title} />
                      {isPlayable(c.format) && (
                        <Box
                          sx={{
                            position: "absolute",
                            inset: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            pointerEvents: "none",
                          }}
                        >
                          <Box
                            sx={{
                              width: 44,
                              height: 44,
                              borderRadius: "50%",
                              bgcolor: "rgba(0,0,0,0.55)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <PlayArrowRounded />
                          </Box>
                        </Box>
                      )}
                    </ThumbWrap>
                  )}
                  <ProgramBody>
                    <CardTitle style={textStyle}>{c.title}</CardTitle>
                    {c.subtitle && <CardDesc style={textStyle}>{c.subtitle}</CardDesc>}
                    {c.tags.length > 0 && (
                      <Chips>
                        {c.tags.map((t) => (
                          <Chip key={t}>{t}</Chip>
                        ))}
                      </Chips>
                    )}
                    {c.format && (
                      <Chips>
                        <Chip>
                          {`${FORMAT_LABEL[c.format] ?? c.format}${
                            c.durationLabel ? ` · ${c.durationLabel}` : ""
                          }`}
                        </Chip>
                      </Chips>
                    )}
                    <CardFoot>
                      <span />
                      <OutlinedBtn
                        onClick={(e) => {
                          e.stopPropagation();
                          openCard(c.url);
                        }}
                        endIcon={chevron}
                      >
                        View details
                      </OutlinedBtn>
                    </CardFoot>
                  </ProgramBody>
                </ProgramCard>
                );
              })}
            </ProgramGrid>
            )}
          </Section>
          );
        })}

        {/* Offers & Benefits is its own section — it is configured separately
            from the wellness sections above and must not depend on any of them
            being present. */}
        <BannerCarouselSection banners={banners} onOpenPortal={openPortal} />
      </Shell>
    </HubWrapper>
  );
};

export default WellnessHub;
