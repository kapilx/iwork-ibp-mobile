/**
 * Helpers for building the `covers_meta` render config and the field key/name
 * for a master cover (`mstr_cover`). Generation runs ONCE, at cover creation.
 * `mstr_cover_template` copies `covers_meta` verbatim and never regenerates it.
 *
 * See docs/cover_template_map/cover-template-map-spec.md (§6.2) for the locked shape.
 */

export type CoverInputType = "text" | "textarea" | "dropdown";

/** A cover's list-of-values: a flat `{ key: label }` map (jsonb input_lov). */
export type CoverInputLov = Record<string, string>;

const DEFAULT_GRID_COLUMN = 9;
const REQUIRED_RULE = {
  required: { value: true, message: "This is required field" },
} as const;

/**
 * Converts a cover name into the field key/name used by `formConfig`.
 * First whitespace-delimited token is lower-cased on its first character,
 * every subsequent token is upper-cased on its first character, then joined
 * without spaces. Punctuation inside tokens is preserved.
 *
 * Examples:
 *   "24 Hours Cover" -> "24HoursCover"
 *   "72 Hours Sudden and Accidental Pollution" -> "72HoursSuddenAndAccidentalPollution"
 *   "Cover of extra charges for overtime, night work" ->
 *     "coverOfExtraChargesForOvertime,NightWork"
 */
export function buildCoverFieldKey(name: string): string {
  const tokens = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return tokens
    .map((token, index) =>
      index === 0
        ? token.charAt(0).toLowerCase() + token.slice(1)
        : token.charAt(0).toUpperCase() + token.slice(1)
    )
    .join("");
}

/**
 * Builds the `componentProps` for a given input type.
 */
function buildComponentProps(inputType: CoverInputType): Record<string, unknown> {
  if (inputType === "textarea") {
    return { rows: 3, fullWidth: true, multiline: true };
  }
  return { fullWidth: true };
}

/**
 * Maps the LOV values into DynamicForm select options. The select stores the
 * value text (label and value are both the LOV value), matching existing data.
 */
function buildSelectOptions(
  inputLov?: CoverInputLov
): Array<{ label: string; value: string }> {
  return Object.values(inputLov ?? {}).map((value) => ({ label: value, value }));
}

/**
 * Builds the `covers_meta` object for a cover from its name and input type.
 * Returns the shape `{ formConfig: [ ... ] }` consumed by
 * buildSectionAwareCoverConfig on the frontend. For `dropdown` covers the field
 * becomes a `select` with options derived from `inputLov`.
 */
export function buildCoversMeta(
  name: string,
  inputType: CoverInputType,
  inputLov?: CoverInputLov,
  gridColumn: number = DEFAULT_GRID_COLUMN
): { formConfig: Array<Record<string, unknown>> } {
  const key = buildCoverFieldKey(name);
  const isDropdown = inputType === "dropdown";
  return {
    formConfig: [
      {
        key,
        name: key,
        type: isDropdown ? "select" : inputType,
        label: name,
        rules: REQUIRED_RULE,
        ...(isDropdown ? { options: buildSelectOptions(inputLov) } : {}),
        gridColumn,
        componentProps: buildComponentProps(inputType),
      },
    ],
  };
}
