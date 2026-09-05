/**
 * Makes raw Handlebars-templated HTML email safe to round-trip through a
 * browser-DOM-based visual editor (GrapesJS) without corruption.
 *
 * Two concrete corruption modes were found and verified against this app's
 * real seeded templates (headless-Chrome tests, not just theory) before
 * this was written:
 *
 * 1. TABLE FOSTER-PARENTING: `{{#each policies}}` / `{{/each}}` markers
 *    that sit as direct text between `<tr>` elements (a very common
 *    pattern — repeating table rows per item) get silently relocated by
 *    the HTML5 parsing algorithm's foster-parenting rule for non-whitespace
 *    text in "in table" insertion mode — moved to BEFORE the whole
 *    `<table>`, breaking the block's association with the row it wraps.
 *    This happens in ANY browser-DOM parse (`innerHTML`, `DOMParser`),
 *    independent of which editor library is used on top.
 *    Fix: HTML comments are exempt from this rule (verified) — a token
 *    sitting immediately next to a `<table>`/`<tbody>`/`<thead>`/`<tr>`
 *    boundary (only whitespace in between) is replaced with an inert
 *    `<!--HBS_N-->` comment BEFORE any DOM parsing happens at all (a pure
 *    string regex pass). Ordering matters: doing this after even one DOM
 *    parse (e.g. while hunting for attribute-embedded tokens, below) is
 *    too late — the damage from the first parse already happened.
 *
 *    Deliberately NOT applied to every `{{token}}` in the document,
 *    only ones actually adjacent to a table boundary: an ordinary inline
 *    value like `Hello {{userName}},` inside a heading was never at risk
 *    of foster-parenting (that rule only relocates bare text sitting
 *    directly inside `<table>`/`<tbody>`/`<tr>`), but comment-protecting
 *    it anyway made it invisible in GrapesJS's canvas — the comment
 *    renders as nothing, so the edit view showed a blank gap where the
 *    token used to be, while Live Preview (which renders the real,
 *    unprotected HTML) showed the token text just fine. Confirmed via a
 *    real-browser repro: the Live Login OTP template's edit pane showed
 *    "Hello ," and an empty OTP box with all three inline tokens
 *    ({{userName}}, {{otpCode}}, {{expiryMinutes}}) silently gone, while
 *    Live Preview showed them correctly. Leaving non-risky tokens as
 *    literal text means they parse and display normally — visible,
 *    double-click-editable, and identical to what Live Preview shows.
 *
 * 2. ATTRIBUTE-EMBEDDED TOKENS: patterns like `src="{{logoUrl}}"` or
 *    `class="row{{#unless @first}} sep{{/unless}}"` can't be protected by
 *    a comment (comments have no special meaning inside an attribute
 *    value string), and editors commonly sanitize/normalize attribute
 *    values (especially `class`) in ways that can silently drop anything
 *    that doesn't look like a real value. These are never visible text
 *    either way (attribute values aren't rendered as page content), so
 *    unlike case 1 there's no editability downside to always protecting
 *    them regardless of position.
 *    Fix: comment-protect every attribute-embedded token unconditionally
 *    (a pure string pass, same ordering requirement as above — before any
 *    DOM parse), then walk the DOM once; for every attribute whose value
 *    still contains an `HBS_N` marker, stash the ORIGINAL (unprotected)
 *    value in a `data-hbs-attrs` JSON blob on that element and replace the
 *    live attribute with an editor-safe placeholder. Verified GrapesJS
 *    preserves arbitrary `data-*` attributes through its import/export
 *    cycle.
 *
 * Both were verified end-to-end against the most complex real template in
 * this codebase (life-event-confirmation, nested {{#each}} inside tables,
 * conditional classes, an image src token) — 0 tokens lost, correct
 * position preserved, visual layout unchanged.
 */

const HBS_TOKEN_RE = /\{\{[^}]*\}\}/g;
const HBS_MARKER_IN_ATTR_RE = /<!--HBS_\d+-->/g;
// A boundary is only "risky" for foster-parenting when a token sits right
// next to (only whitespace between) one of these table-structural tags —
// open or close, any of table/tbody/thead/tr.
const TABLE_BOUNDARY_TAG_RE = '(?:table|tbody|thead|tr)';
const TABLE_TAG_BEFORE_RE = new RegExp(`<\\/?${TABLE_BOUNDARY_TAG_RE}(?:\\s[^>]*)?>$`, 'i');
const TABLE_TAG_AFTER_RE = new RegExp(`^<\\/?${TABLE_BOUNDARY_TAG_RE}(?:\\s[^>]*)?>`, 'i');
// Matches a whole `name="...{{...}}..."` / `name='...{{...}}...'` attribute
// assignment so attribute-embedded tokens can be found and protected before
// any DOM parse, independent of surrounding table structure (see case 2).
const ATTR_WITH_TOKEN_RE = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)=("|')([^"']*?)\2/g;

// 1x1 transparent-ish placeholder so a real <img> renders as *something*
// sane inside the editor instead of a jarring broken-image icon; the real
// {{...}} src is always restored before saving, this never reaches the DB.
const PLACEHOLDER_IMAGE_SRC =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiPjxyZWN0IHdpZHRoPSIxMjAiIGhlaWdodD0iNDAiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSI2MCIgeT0iMjQiIGZvbnQtc2l6ZT0iMTEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NDc0OGIiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIj5JbWFnZTwvdGV4dD48L3N2Zz4=';

export interface ProtectedHtml {
  /** Safe to hand to setComponents()/innerHTML — no bare {{...}} left in a
   * risky position; ordinary inline tokens are left as visible literal
   * text on purpose (see header, case 1). */
  protectedHtml: string;
  /** tokens[N] is the original text that <!--HBS_N--> stands in for. */
  tokens: string[];
}

export function protectHandlebarsHtml(fullHtml: string): ProtectedHtml {
  const tokens: string[] = [];
  const remember = (match: string): number => tokens.push(match) - 1;

  // Step 1a — pure string op, must run before ANY DOM parsing (see header
  // case 2). Every attribute-embedded token is protected regardless of
  // position; attributes are never visible text, so there's no editability
  // tradeoff here like there is for case 1 below.
  let working = fullHtml.replace(ATTR_WITH_TOKEN_RE, (attrMatch, name, quote, value) => {
    if (!/\{\{[^}]*\}\}/.test(value)) return attrMatch;
    const replacedValue = value.replace(/\{\{[^}]*\}\}/g, (m: string) => `<!--HBS_${remember(m)}-->`);
    return `${name}=${quote}${replacedValue}${quote}`;
  });

  // Step 1b — pure string op, must run before ANY DOM parsing (see header
  // case 1). Only tokens sitting directly against a table-structural
  // boundary get comment-protected; everything else is left as literal,
  // visible text.
  const commentProtected = working.replace(HBS_TOKEN_RE, (match, offset: number, str: string) => {
    const before = str.slice(0, offset).replace(/\s+$/, '');
    const after = str.slice(offset + match.length).replace(/^\s+/, '');
    const risky = TABLE_TAG_BEFORE_RE.test(before) || TABLE_TAG_AFTER_RE.test(after);
    return risky ? `<!--HBS_${remember(match)}-->` : match;
  });

  // Step 2 — now safe to parse. Move attribute-embedded markers (from step
  // 1a) to data-hbs-attrs, replacing the live attribute with a safe
  // placeholder.
  const doc = new DOMParser().parseFromString(commentProtected, 'text/html');

  doc.querySelectorAll('*').forEach((el) => {
    const toFix: Record<string, string> = {};
    Array.from(el.attributes).forEach((attr) => {
      if (attr.value.includes('<!--HBS_')) {
        const original = attr.value.replace(
          /<!--HBS_(\d+)-->/g,
          (_match, idx: string) => tokens[Number(idx)] ?? ''
        );
        toFix[attr.name] = original;
      }
    });

    if (Object.keys(toFix).length === 0) return;

    el.setAttribute('data-hbs-attrs', JSON.stringify(toFix));
    Object.entries(toFix).forEach(([name, original]) => {
      if (name === 'src') {
        el.setAttribute('src', PLACEHOLDER_IMAGE_SRC);
      } else if (name === 'class') {
        el.setAttribute('class', original.replace(HBS_MARKER_IN_ATTR_RE, '').trim());
      } else {
        el.setAttribute(name, original.replace(HBS_MARKER_IN_ATTR_RE, ''));
      }
    });
  });

  const doctypePrefix = /^\s*<!doctype/i.test(fullHtml) ? '<!DOCTYPE html>\n' : '';
  return { protectedHtml: doctypePrefix + doc.documentElement.outerHTML, tokens };
}

export function restoreHandlebarsHtml(exportedHtml: string, tokens: string[]): string {
  const doc = new DOMParser().parseFromString(exportedHtml, 'text/html');

  doc.querySelectorAll('[data-hbs-attrs]').forEach((el) => {
    try {
      const map = JSON.parse(el.getAttribute('data-hbs-attrs') || '{}') as Record<string, string>;
      Object.entries(map).forEach(([name, original]) => {
        el.setAttribute(name, original);
      });
    } finally {
      el.removeAttribute('data-hbs-attrs');
    }
  });

  let restored = doc.documentElement.outerHTML;
  tokens.forEach((tok, idx) => {
    restored = restored.split(`<!--HBS_${idx}-->`).join(tok);
  });

  const doctypePrefix = /^\s*<!doctype/i.test(exportedHtml) ? '' : '<!DOCTYPE html>\n';
  return doctypePrefix + restored;
}
