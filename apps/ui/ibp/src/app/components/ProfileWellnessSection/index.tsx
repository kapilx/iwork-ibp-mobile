import React, { useEffect, useState } from "react";
import { ChevronRightRounded } from "@mui/icons-material";
import { apiRequest, endPoints } from "@ui/ui-lib";
import { useCompanyConfig } from "../../hooks/useCompanyConfig";
import {
  CardDesc,
  CardFoot,
  CardTitle,
  Media,
  OutlinedBtn,
  ProgramBody,
  ProgramCard,
  ProgramGrid,
  Section,
  SectionHead,
  SectionHeading,
  ThumbWrap,
} from "../Dashboard/WellnessHub/styles";

/**
 * Wellness cards shown on the employee Profile page — same card style as the
 * dashboard "Benefits from your organisation" section. Rendered purely from
 * `portalWellnessConfig.profileWellnessSection` (configured in iWork, Section F,
 * same fields as Benefits). Hidden when wellness is disabled or empty.
 */

interface RawProfileCard {
  id: string;
  heading?: string;
  subheading?: string;
  thumbnailFileId?: number | null;
  link?: { url?: string };
  /** DEMO only — a direct image URL (real cards use thumbnailFileId instead). */
  demoImage?: string;
}

/** Self-contained placeholder image for the demo cards (no network needed). */
const DEMO_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='200'><rect width='100%' height='100%' fill='#E5E7EB'/><text x='50%' y='50%' font-family='sans-serif' font-size='22' fill='#6B7280' text-anchor='middle' dominant-baseline='middle'>example image</text></svg>`
  );

/* ── TEMPORARY DEMO — remove once real Profile Wellness cards are configured ──
 * With DEMO_PROFILE_WELLNESS = true this section shows sample cards even when no
 * cards are configured (and ignores the enable gate), so the Profile render is
 * visible. Real configured cards always take precedence. Set to false (or delete
 * this block + its use below) to restore normal config-driven behaviour. */
const DEMO_PROFILE_WELLNESS = true;
const DEMO_CARDS: RawProfileCard[] = [
  { id: "demo-1", heading: "example", subheading: "example", link: { url: "" }, demoImage: DEMO_IMG },
  { id: "demo-2", heading: "example", subheading: "example", link: { url: "" }, demoImage: DEMO_IMG },
  { id: "demo-3", heading: "example", subheading: "example", link: { url: "" }, demoImage: DEMO_IMG },
];

const chevron = <ChevronRightRounded sx={{ fontSize: 16 }} />;

/** Authorised thumbnail — download the file by id, render as an object URL. */
const CardThumb: React.FC<{ fileId: number; alt: string }> = ({ fileId, alt }) => {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    apiRequest(endPoints.ibpFileUploadDownloadById(fileId), { responseType: "blob" })
      .then((res: any) => {
        const blob = (res?.data ?? res) as Blob;
        if (!active || !blob) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);
  if (!src) return null;
  return (
    <Media
      src={src}
      alt={alt}
      style={{ height: 120, aspectRatio: "auto", objectFit: "cover", width: "100%" }}
    />
  );
};

const ProfileWellnessSection: React.FC = () => {
  const { portalWellnessConfig } = useCompanyConfig();
  const cfg = portalWellnessConfig as
    | { enabled?: boolean; profileWellnessSection?: { cards?: RawProfileCard[] } }
    | null
    | undefined;

  const enabled = cfg?.enabled === true;
  const configured = (cfg?.profileWellnessSection?.cards ?? []).filter((c) => c.heading?.trim());

  // Real configured cards win; the demo fills in only when nothing is configured.
  const demoFallback = DEMO_PROFILE_WELLNESS ? DEMO_CARDS : [];
  const cards = configured.length ? configured : demoFallback;

  // Normally: wellness disabled for the company, or nothing configured → hide.
  // With the demo on, always show (so the render is verifiable).
  const visible = DEMO_PROFILE_WELLNESS || (enabled && cards.length > 0);
  if (!visible || !cards.length) return null;

  const openCard = (url?: string) => {
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Section style={{ marginTop: 20 }}>
      <SectionHead>
        <SectionHeading>Wellness Subscriptions</SectionHeading>
      </SectionHead>
      <ProgramGrid cols={4}>
        {cards.map((c) => {
          let thumb: React.ReactNode = null;
          if (c.thumbnailFileId != null) {
            thumb = (
              <ThumbWrap>
                <CardThumb fileId={c.thumbnailFileId} alt={c.heading ?? ""} />
              </ThumbWrap>
            );
          } else if (c.demoImage) {
            thumb = (
              <ThumbWrap>
                <Media
                  src={c.demoImage}
                  alt={c.heading ?? ""}
                  style={{ height: 120, aspectRatio: "auto", objectFit: "cover", width: "100%" }}
                />
              </ThumbWrap>
            );
          }
          return (
          <ProgramCard key={c.id} onClick={() => openCard(c.link?.url)}>
            {thumb}
            <ProgramBody>
              <CardTitle>{c.heading}</CardTitle>
              {c.subheading ? <CardDesc>{c.subheading}</CardDesc> : null}
              <CardFoot>
                <span />
                <OutlinedBtn
                  onClick={(e) => {
                    e.stopPropagation();
                    openCard(c.link?.url);
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
    </Section>
  );
};

export default ProfileWellnessSection;
