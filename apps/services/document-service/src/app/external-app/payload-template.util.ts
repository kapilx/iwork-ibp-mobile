/**
 * Generic Payload Template Resolver
 * 
 * Resolves {{placeholder}} tokens in a JSON payload template
 * with actual values from a provided fields map.
 * 
 * @example
 * const template = { "userName": "{{userName}}", "password": "{{password}}" };
 * const fields = { userName: "IIRMHO", password: "IIRMHO" };
 * const resolved = resolvePayloadTemplate(template, fields);
 * // → { "userName": "IIRMHO", "password": "IIRMHO" }
 */

/**
 * Replace {{placeholder}} tokens in any value (string, object, array)
 * with actual values from the fields map.
 * 
 * @param {any} value - The value to resolve (can be string, object, array, or primitive)
 * @param {Record<string, any>} fields - Key-value map of placeholder values
 * @returns {any} The resolved value with all placeholders replaced
 */
const MONTHS_UPPER = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

export function applyTransform(rawValue: string, transform: string): string {
    if (transform.startsWith('date:')) {
        const fmt = transform.slice(5);
        // Incoming dates are typically full ISO datetimes ("2026-07-08T00:00:00.000Z"),
        // not bare "YYYY-MM-DD" — strip any time component first so the day segment
        // below doesn't end up with "08T00:00:00.000Z" stuck to it.
        const datePart = rawValue.split('T')[0];
        const parts = datePart.split('-');
        if (parts.length !== 3) return rawValue;
        const [year, month, day] = parts;
        const mon = parseInt(month, 10);
        return fmt
            .replace('DD', day.padStart(2, '0'))
            .replace('MON', MONTHS_UPPER[mon - 1] ?? month)
            .replace('MM', month.padStart(2, '0'))
            .replace('YYYY', year)
            .replace('YY', year.slice(-2));
    }
    // {{fieldName|map:CASHLESS:1,REIMBURSEMENT:2}} — translates a canonical internal value
    // (e.g. our claimType) into a TPA-specific code/label entirely via admin-configured
    // template, with no per-TPA code. Unmapped values pass through unchanged.
    if (transform.startsWith('map:')) {
        const pairs = transform.slice(4).split(',');
        for (const pair of pairs) {
            const sepIdx = pair.indexOf(':');
            if (sepIdx === -1) continue;
            const from = pair.slice(0, sepIdx).trim();
            const to = pair.slice(sepIdx + 1).trim();
            if (from === rawValue) return to;
        }
        return rawValue;
    }
    return rawValue;
}

function replaceInValue(value: any, fields: Record<string, any>): any {
    if (typeof value === "string") {
        // {{fieldName|number}} — only when the ENTIRE string is exactly this one
        // placeholder: returns a real JSON number instead of a quoted numeric string.
        // Some TPAs (FHPL) validate numeric fields strictly and reject "1234" where a
        // bare 1234 is required. Doesn't apply to placeholders mixed with other text.
        const numberMatch = value.match(/^\{\{(\w+)\|number\}\}$/);
        if (numberMatch) {
            const raw = fields[numberMatch[1]];
            if (raw === undefined) return value;
            const num = Number(raw);
            return Number.isNaN(num) ? value : num;
        }
        // {{fieldName|<transform>|number}} — chains one more transform (e.g. map:) before
        // converting to a real JSON number. Needed for fields like FHPL's Type_of_Claim,
        // which is both TPA-code-mapped (our claimType -> "1"/"2") AND must be a bare
        // number, not a quoted string.
        const chainedNumberMatch = value.match(/^\{\{(\w+)\|([^}]+)\|number\}\}$/);
        if (chainedNumberMatch) {
            const raw = fields[chainedNumberMatch[1]];
            if (raw === undefined) return value;
            const transformed = applyTransform(String(raw), chainedNumberMatch[2]);
            const num = Number(transformed);
            return Number.isNaN(num) ? value : num;
        }
        // Replace {{key}}, {{key|transform}}, or {{env:KEY_NAME}} patterns with actual values.
        // {{env:KEY_NAME}} reads from process.env at runtime — actual value never stored in DB.
        return value.replace(/\{\{(env:[\w_]+|\w+)(?:\|([^}]+))?\}\}/g, (match, key, transform) => {
            if (key.startsWith("env:")) {
                const envKey = key.slice(4);
                const envVal = process.env[envKey];
                return envVal !== undefined ? envVal : match;
            }
            if (fields[key] === undefined) return match;
            const raw = String(fields[key]);
            return transform ? applyTransform(raw, transform) : raw;
        });
    }

    if (Array.isArray(value)) {
        return value.map((item) => replaceInValue(item, fields));
    }

    if (typeof value === "object" && value !== null) {
        // { "$forEach": "documents", "as": { "File": "{{fileBase64}}", ... } } — repeats
        // the "as" template once per item in fields["documents"] (a caller-supplied array
        // of plain objects), instead of the fixed-length arrays plain templates give.
        // Needed for TPA calls that carry a variable number of documents/bills in one
        // request. "as" can be an object template (FHPL's "Documents": [{documentName,
        // documentCategory, File}, ...]) or a plain string template producing an array of
        // scalars (Health India's "pdF_BYTES": ["{{fileBase64}}", ...]) — both are valid
        // shapes TPAs actually use, not specific to either integration.
        if (typeof (value as any).$forEach === "string" && "as" in (value as any)) {
            const items = fields[(value as any).$forEach];
            if (!Array.isArray(items)) return [];
            return items.map((item) => replaceInValue((value as any).as, { ...fields, ...item }));
        }

        const result: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
            result[k] = replaceInValue(v, fields);
        }
        return result;
    }

    // For numbers, booleans, null — return as-is
    return value;
}

/**
 * Resolve a JSON payload template by replacing all {{placeholder}} tokens
 * with actual values from the fields map.
 * 
 * @param {Record<string, any>} template - JSON payload template with {{placeholder}} tokens
 * @param {Record<string, any>} fields - Key-value map of placeholder values
 * @returns {Record<string, any>} Resolved JSON payload
 * 
 * @example
 * // Simple replacement
 * resolvePayloadTemplate(
 *   { "email": "{{userEmail}}" },
 *   { userEmail: "user@example.com" }
 * );
 * // → { "email": "user@example.com" }
 * 
 * @example
 * // Multiple fields
 * resolvePayloadTemplate(
 *   { "userName": "{{userName}}", "password": "{{password}}" },
 *   { userName: "admin", password: "secret" }
 * );
 * // → { "userName": "admin", "password": "secret" }
 * 
 * @example
 * // Unresolved placeholders are left as-is
 * resolvePayloadTemplate(
 *   { "name": "{{name}}", "age": "{{age}}" },
 *   { name: "John" }
 * );
 * // → { "name": "John", "age": "{{age}}" }
 */
/**
 * Extract a value from a nested object using dot-notation path.
 * Numeric path segments are treated as array indices (e.g. "members.0.id").
 * Returns empty string if path not found.
 */
export function extractDotNotation(obj: any, path: string): string {
    const value = path.split(".").reduce((acc: any, key: string) => {
        if (acc === undefined || acc === null) return undefined;
        if (Array.isArray(acc)) return acc[Number(key)];
        return acc[key];
    }, obj);
    if (value === undefined || value === null) return "";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
}

export function resolvePayloadTemplate(
    template: Record<string, any>,
    fields: Record<string, any>
): Record<string, any> {
    if (!template || typeof template !== "object") {
        return {};
    }

    // Deep clone to avoid mutating the original template
    const cloned = JSON.parse(JSON.stringify(template));
    return replaceInValue(cloned, fields);
}
