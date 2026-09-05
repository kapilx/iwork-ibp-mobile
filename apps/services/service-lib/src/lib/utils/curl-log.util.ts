const SENSITIVE_KEY_PATTERN = /password|secret|token|auth|apikey|api_key/i;

function redactValue(key: string, value: unknown): unknown {
    if (SENSITIVE_KEY_PATTERN.test(key)) return "[REDACTED]";
    return value;
}

function redactDeep(obj: unknown): unknown {
    if (Array.isArray(obj)) return obj.map((item) => redactDeep(item));
    if (obj && typeof obj === "object") {
        return Object.fromEntries(
            Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
                k,
                SENSITIVE_KEY_PATTERN.test(k) ? "[REDACTED]" : redactDeep(v),
            ]),
        );
    }
    return obj;
}

function appendQueryParams(url: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) return url;
    const qs = new URLSearchParams(
        Object.entries(params).map(([k, v]) => [k, String(v ?? "")]),
    ).toString();
    return `${url}${url.includes("?") ? "&" : "?"}${qs}`;
}

export function buildRedactedCurlLog(
    method: string,
    url: string,
    headers: Record<string, unknown> = {},
    body?: unknown,
    queryParams?: Record<string, unknown>,
): string {
    const fullUrl = appendQueryParams(url, queryParams);
    const parts = [`curl -X ${method.toUpperCase()} '${fullUrl}'`];

    for (const [key, value] of Object.entries(headers)) {
        parts.push(`-H '${key}: ${redactValue(key, value)}'`);
    }

    if (body !== undefined && body !== null) {
        const redactedBody = typeof body === "string" ? body : redactDeep(body);
        const bodyStr =
            typeof redactedBody === "string" ? redactedBody : JSON.stringify(redactedBody);
        parts.push(`--data-raw '${bodyStr}'`);
    }

    return parts.join(" \\\n  ");
}
