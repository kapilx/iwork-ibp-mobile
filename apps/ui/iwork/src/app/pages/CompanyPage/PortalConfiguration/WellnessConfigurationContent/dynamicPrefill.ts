import { apiRequest, endPoints } from '@ui/ui-lib';
import { WellnessCard, createEmptyWellnessCard } from './types';

/**
 * Temporary dynamic-section prefill via the existing magic-url executor
 * (`POST external-app-sso/magic-url` → `executeExternalAppSSO(appKey)`), reused
 * until a real external wellness API is integrated. It resolves an appRef by
 * `label === appKey` and, for a DISPLAY-flow config, returns the mapped
 * response. Until a `wellness-content` DISPLAY appRef exists this returns
 * nothing usable and the caller keeps the static placeholder cards.
 *
 * The response→card mapping here is deliberately defensive (candidate key
 * names) because the real response shape is not known yet — tighten it once the
 * external API is defined and its response mappings use wellness standard keys.
 */

const HEADING_KEYS = ['HEADING', 'heading', 'title', 'TITLE', 'name', 'NAME', 'label'];
const SUBHEADING_KEYS = ['SUBHEADING', 'subheading', 'subtitle', 'SUBTITLE', 'description', 'DESCRIPTION', 'desc'];
const URL_KEYS = ['LINK_URL', 'REDIRECT_URL', 'url', 'URL', 'link', 'href'];

const pick = (obj: Record<string, any>, keys: string[]): string | undefined => {
    for (const key of keys) {
        const value = obj?.[key];
        if (value != null && value !== '') return String(value);
    }
    return undefined;
};

const hasAnyMappableField = (obj: Record<string, any>): boolean =>
    [...HEADING_KEYS, ...SUBHEADING_KEYS, ...URL_KEYS].some((k) => obj?.[k] != null && obj?.[k] !== '');

/** Coerce a magic-url DISPLAY response into a list of card-like items. */
const toItems = (result: any): Record<string, any>[] => {
    if (Array.isArray(result)) return result.filter((x) => x && typeof x === 'object');
    if (result && typeof result === 'object') {
        // A nested array of objects (e.g. { data: [...] }) → that array.
        for (const value of Object.values(result)) {
            if (Array.isArray(value) && value.some((x) => x && typeof x === 'object')) {
                return (value as any[]).filter((x) => x && typeof x === 'object');
            }
        }
        // Otherwise a single flat object → one card, if it has anything mappable.
        if (hasAnyMappableField(result)) return [result];
    }
    return [];
};

/**
 * Fetch `appKey`'s DISPLAY data via magic-url and map it onto cards, reusing the
 * existing cards' colour templates/ids by index. Returns null when there is no
 * usable data (no configured external API yet) so the caller can keep the
 * static cards.
 */
export const prefillCardsFromMagicUrl = async (
    appKey: string,
    existing: WellnessCard[]
): Promise<WellnessCard[] | null> => {
    const res = await apiRequest(endPoints.alyveWellnessUrl, {
        method: 'POST',
        data: { appKey, dynamicFields: {} },
    });
    const result = (res as any)?.data?.data ?? (res as any)?.data ?? {};
    const items = toItems(result);
    if (!items.length) return null;

    return items.map((item, index) => {
        const base = existing[index] ?? createEmptyWellnessCard(index);
        return {
            ...base,
            order: index,
            heading: pick(item, HEADING_KEYS) ?? base.heading,
            subheading: pick(item, SUBHEADING_KEYS) ?? base.subheading,
            link: {
                ...base.link,
                type: base.link?.type ?? 'DIRECT_URL',
                url: pick(item, URL_KEYS) ?? base.link?.url,
            },
        };
    });
};
