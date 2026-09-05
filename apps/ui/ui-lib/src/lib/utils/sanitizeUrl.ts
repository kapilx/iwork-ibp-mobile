/**
 * Sanitizes a URL before it is used in an anchor `href` (or similar) to prevent
 * script injection via dangerous schemes such as `javascript:`, `data:` and `vbscript:`.
 *
 * Allows only http, https, mailto and tel schemes, plus relative URLs.
 * Anything else (including malformed input) collapses to "#".
 *
 * @param url - The potentially unsafe URL string
 * @returns A safe URL string, or "#" if the input is unsafe/invalid
 */
const SAFE_RELATIVE_PREFIXES = ["/", "./", "../", "#", "?"];

export const sanitizeUrl = (url: string | null | undefined): string => {
  if (!url) return "#";

  const trimmed = String(url).trim();
  if (!trimmed) return "#";

  // Allow relative URLs and in-page anchors/queries.
  if (SAFE_RELATIVE_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    return trimmed;
  }

  try {
    const { protocol } = new URL(trimmed);
    const allowed = ["http:", "https:", "mailto:", "tel:"];
    return allowed.includes(protocol.toLowerCase()) ? trimmed : "#";
  } catch {
    // Not a parseable absolute URL — treat as unsafe.
    return "#";
  }
};
