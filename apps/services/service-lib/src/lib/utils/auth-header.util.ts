// Some TPAs return their session/access token already including its own scheme
// word (e.g. accessToken: "Token eyJ..." instead of just the raw JWT). If we
// always prepend the configured tokenHeaderPrefix, those TPAs end up with a
// doubled prefix ("Token Token eyJ...") and reject the request. This builds
// the Authorization header value while avoiding that double-prefix case.
export function buildAuthorizationHeaderValue(prefix: string, token: string): string {
    const trimmedToken = token.trim();
    if (trimmedToken.toLowerCase().startsWith(`${prefix.toLowerCase()} `)) return trimmedToken;
    return `${prefix} ${trimmedToken}`;
}
