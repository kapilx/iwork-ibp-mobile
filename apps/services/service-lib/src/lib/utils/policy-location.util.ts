import type { EntityManager } from "typeorm";
import type Redis from "ioredis";

const COUNTRY_CODE_CACHE_TTL_SECONDS = 3600;
const countryCodeCacheKey = (policyId: number) => `country-calling-code:policy:${policyId}`;

/**
 * Normalizes an Associated Location "Location Code" cell value for comparison.
 * Strips ALL whitespace and lower-cases so `"  ABC 01  "` matches `"abc01"`.
 * Used consistently across upload validation (scheduler + employee upload
 * util) and the per-company validation in the company sync helper.
 */
export const normalizePolicyLocationCode = (value: unknown): string =>
    String(value ?? "").toLowerCase().replace(/\s+/g, "");

/**
 * Fetches the set of valid Policy Location codes (and a map back to the
 * corresponding `company_policy_configuration_location.id`) for a given
 * policy. Both the scheduler and the per-row upload validator key off
 * this identical query, so it lives here once.
 */
export const fetchValidPolicyLocations = async (
    entityManager: EntityManager,
    policyId: number
): Promise<{
    validCodes: Set<string>;
    addressIdMap: Map<string, number>;
    phoneCodeByCpclId: Map<number, string>;
    rawRows: { location_code: string | null; cpcl_id: number; phone_number_code: string | null }[];
}> => {
    const rawRows = await entityManager
        .createQueryBuilder()
        .select("a.location_code", "location_code")
        .addSelect("cpcl.id", "cpcl_id")
        .addSelect("lc.phone_number_code", "phone_number_code")
        .from("address", "a")
        .innerJoin(
            "company_policy_configuration_location",
            "cpcl",
            "cpcl.address_id = a.id AND cpcl.deleted_at IS NULL"
        )
        .innerJoin("policy", "p", "p.company_id = cpcl.company_id")
        .leftJoin("country", "c", "c.id = a.country_id")
        .leftJoin(
            "localization_country",
            "lc",
            "LOWER(TRIM(lc.name)) = LOWER(TRIM(c.name))"
        )
        .where("p.id = :policyId", { policyId })
        .getRawMany<{ location_code: string | null; cpcl_id: number; phone_number_code: string | null }>();

    const validCodes = new Set<string>();
    const addressIdMap = new Map<string, number>();
    const phoneCodeByCpclId = new Map<number, string>();
    for (const r of rawRows) {
        const key = normalizePolicyLocationCode(r.location_code);
        if (!key) continue;
        validCodes.add(key);
        addressIdMap.set(key, r.cpcl_id);
        if (r.phone_number_code) {
            phoneCodeByCpclId.set(r.cpcl_id, r.phone_number_code);
        }
    }
    return { validCodes, addressIdMap, phoneCodeByCpclId, rawRows };
};

/**
 * Fallback country calling code for a policy, used when a row's Location Code doesn't
 * resolve (or the policy doesn't have policy locations enabled at all). Resolution
 * order: the policy's own `country_id` -> its organisation's `country_id` -> its
 * company's `country_id` -- whichever is set first, in that order.
 */
export const fetchDefaultCountryCallingCode = async (
    entityManager: EntityManager,
    policyId: number,
    redis?: Redis | null
): Promise<string | null> => {
    const cacheKey = countryCodeCacheKey(policyId);
    if (redis) {
        const cached = await redis.get(cacheKey);
        // Cache stores "" for a confirmed "no code found" result, distinct from a cache miss.
        if (cached !== null) {
            return cached || null;
        }
    }

    const row = await entityManager
        .createQueryBuilder()
        .select("lc.phone_number_code", "phone_number_code")
        .from("policy", "p")
        .leftJoin("organisation", "o", "o.id = p.organisation_id")
        .leftJoin("company", "comp", "comp.id = p.company_id")
        .leftJoin(
            "country",
            "c",
            "c.id = COALESCE(p.country_id, o.country_id, comp.country_id)"
        )
        .leftJoin(
            "localization_country",
            "lc",
            "LOWER(TRIM(lc.name)) = LOWER(TRIM(c.name))"
        )
        .where("p.id = :policyId", { policyId })
        .getRawOne<{ phone_number_code: string | null }>();

    const resolved = row?.phone_number_code ?? null;
    if (redis) {
        await redis.set(cacheKey, resolved ?? "", "EX", COUNTRY_CODE_CACHE_TTL_SECONDS);
    }
    return resolved;
};
