export type WellnessLinkType = 'DIRECT_URL' | 'SSO_REDIRECT';

export interface WellnessCardLink {
    type: WellnessLinkType;
    url?: string;
    ssoAppKey?: string;
}

export interface WellnessCard {
    id: string;
    order: number;
    thumbnailFileId?: number | null;
    heading: string;
    subheading?: string;
    tags?: string[];
    link: WellnessCardLink;
    /** Colour template key (Section A / C tiles only) — see tileColorPalette.ts */
    colorTemplate?: string;
    /** Resolved colour persisted for IBP render (Section A / C tiles only):
     *  swatch hex + the section-appropriate gradient (soft for Health
     *  assessment, vivid for Explore by need) + a readable text colour. */
    colorCode?: string;
    gradient?: string;
    textColor?: string;
    /** Wellness Library cards only — media format + duration label. */
    format?: WellnessMediaFormat;
    durationLabel?: string;
}

/**
 * How a SECTION is sourced (configured per section, not per card):
 *  - STATIC  (default): the admin-entered cards below are shown as-is.
 *  - DYNAMIC: the section's cards are prefilled from an external API. The API
 *    itself (which one, how it's identified, how its response maps to cards) is
 *    NOT known yet — this only records the choice; the fetch/prefill is wired
 *    later. The same card editors are reused; DYNAMIC just means "these will be
 *    prefilled from the API".
 */
export type WellnessCardDataSource = 'STATIC' | 'DYNAMIC';

/** One wellness section: a list of cards + how the section is sourced. */
export interface WellnessSection {
    cards: WellnessCard[];
    dataSource?: WellnessCardDataSource;
    /** DYNAMIC only — the External API Config (appRef) picked for this section.
     *  Its label is used as the magic-url appKey to prefill the cards. */
    apiRefId?: number | null;
}

/** A saved External API Config, as offered in the section's dynamic picker. */
export interface ExternalApiConfigOption {
    id: number;
    /** appRef label — also the magic-url appKey. */
    label: string;
}

/** Wellness Library media types (drives the badge + play-icon in IBP). */
export type WellnessMediaFormat = 'VIDEO' | 'ARTICLE' | 'QUICKBYTE' | 'WEBINAR' | 'AUDIO';

export const WELLNESS_MEDIA_FORMATS: { value: WellnessMediaFormat; label: string }[] = [
    { value: 'VIDEO', label: 'Video' },
    { value: 'ARTICLE', label: 'Article' },
    { value: 'QUICKBYTE', label: 'QuickBytes' },
    { value: 'WEBINAR', label: 'Webinar' },
    { value: 'AUDIO', label: 'Audio' },
];

// All sections hold a variable, admin-managed list of the same card shape.
// "tile" sections (Health Assessment / Explore by Need) hide the
// thumbnail/tags fields; Wellness Library adds media format + duration.
export interface WellnessConfigState {
    /** Master switch — when false, IBP hides the entire wellness section. */
    enabled: boolean;
    healthAssessment: WellnessSection;
    organisationBenefits: WellnessSection;
    exploreByNeed: WellnessSection;
    explorePrograms: WellnessSection;
    wellnessLibrary: WellnessSection;
    /** Rendered in the IBP employee Profile page (not the dashboard). Same card
     *  fields as Section B (Benefits from our Organisation). */
    profileWellnessSection: WellnessSection;
}

const emptyLink = (): WellnessCardLink => ({ type: 'DIRECT_URL', url: '' });

export const createEmptyWellnessCard = (order: number): WellnessCard => ({
    id: `card-${Math.random().toString(36).slice(2, 10)}`,
    order,
    thumbnailFileId: null,
    heading: '',
    subheading: '',
    tags: [],
    link: emptyLink(),
});

const buildStarterCards = (count: number): WellnessCard[] =>
    Array.from({ length: count }, (_, index) => createEmptyWellnessCard(index));

// Data-source-level defaults — every section always starts with at least one
// editable card. Never rely on a mount-time effect to "seed" an empty array:
// that races against the parent's API-hydration effect (which re-runs
// mapWellnessConfigFromApi on every refetch) and the seed gets wiped out.
const ensureAtLeastOneCard = (cards: WellnessCard[] | undefined, starterCount = 1): WellnessCard[] => {
    if (Array.isArray(cards) && cards.length > 0) return cards;
    return buildStarterCards(starterCount);
};

export const buildDefaultWellnessConfig = (): WellnessConfigState => ({
    enabled: false,
    healthAssessment: { cards: buildStarterCards(3), dataSource: 'STATIC' },
    organisationBenefits: { cards: buildStarterCards(1), dataSource: 'STATIC' },
    exploreByNeed: { cards: buildStarterCards(4), dataSource: 'STATIC' },
    explorePrograms: { cards: buildStarterCards(1), dataSource: 'STATIC' },
    wellnessLibrary: { cards: buildStarterCards(1), dataSource: 'STATIC' },
    profileWellnessSection: { cards: buildStarterCards(1), dataSource: 'STATIC' },
});

/** DYNAMIC only if explicitly stored; anything else → STATIC. */
const readDataSource = (raw: any): WellnessCardDataSource =>
    raw?.dataSource === 'DYNAMIC' ? 'DYNAMIC' : 'STATIC';

export const mapWellnessConfigFromApi = (
    raw: Record<string, any> | null | undefined
): WellnessConfigState => {
    if (!raw) return buildDefaultWellnessConfig();

    return {
        // Absent => disabled (default false); only an explicit true enables it.
        enabled: raw?.enabled === true,
        healthAssessment: {
            cards: ensureAtLeastOneCard(raw?.healthAssessment?.cards, 3),
            dataSource: readDataSource(raw?.healthAssessment),
            apiRefId: raw?.healthAssessment?.apiRefId ?? null,
        },
        organisationBenefits: {
            cards: ensureAtLeastOneCard(raw?.organisationBenefits?.cards, 1),
            dataSource: readDataSource(raw?.organisationBenefits),
        },
        exploreByNeed: {
            cards: ensureAtLeastOneCard(raw?.exploreByNeed?.cards, 4),
            dataSource: readDataSource(raw?.exploreByNeed),
        },
        explorePrograms: {
            cards: ensureAtLeastOneCard(raw?.explorePrograms?.cards, 1),
            dataSource: readDataSource(raw?.explorePrograms),
        },
        wellnessLibrary: {
            cards: ensureAtLeastOneCard(raw?.wellnessLibrary?.cards, 1),
            dataSource: readDataSource(raw?.wellnessLibrary),
        },
        profileWellnessSection: {
            cards: ensureAtLeastOneCard(raw?.profileWellnessSection?.cards, 1),
            dataSource: readDataSource(raw?.profileWellnessSection),
        },
    };
};
