export enum MaskingPattern {
  FULL            = 'FULL',           // "John"       → "xxxx"
  LAST_N_VISIBLE  = 'LAST_N_VISIBLE', // "9876543210" → "xxxxxx3210" (n=4)
  FIRST_N_VISIBLE = 'FIRST_N_VISIBLE',// "9876543210" → "9876xxxxxx" (n=4)
  EMAIL_STANDARD  = 'EMAIL_STANDARD', // "u@g.com"    → "u***@g***.com"
  DIGITS_MASK     = 'DIGITS_MASK',    // "1990-05-20" → "****-**-**"
  ALTERNATE_CHARS = 'ALTERNATE_CHARS',// "AAACH1104K" → "AxAxCx1x0x"
  MIDDLE_MASK     = 'MIDDLE_MASK',    // "John"       → "J**n"
  /**
   * Pick a masking pattern at runtime based on the value of a sibling field.
   * Useful when one field holds different data types (e.g. communicationDetails
   * can be an email or a phone number depending on communicationType).
   *
   * @example
   * {
   *   pattern: MaskingPattern.CONDITIONAL,
   *   typeField: 'communicationType',
   *   typeMap: {
   *     email: { pattern: MaskingPattern.EMAIL_STANDARD },
   *     phone: { pattern: MaskingPattern.LAST_N_VISIBLE, visibleCount: 4 },
   *   },
   * }
   */
  CONDITIONAL     = 'CONDITIONAL',
}

export type MaskingConfig =
  | { pattern: MaskingPattern.FULL }
  | { pattern: MaskingPattern.LAST_N_VISIBLE;  visibleCount: number }
  | { pattern: MaskingPattern.FIRST_N_VISIBLE; visibleCount: number }
  | { pattern: MaskingPattern.EMAIL_STANDARD }
  | { pattern: MaskingPattern.DIGITS_MASK }
  | { pattern: MaskingPattern.ALTERNATE_CHARS }
  | { pattern: MaskingPattern.MIDDLE_MASK; visibleEachSide?: number }
  | {
      pattern: MaskingPattern.CONDITIONAL;
      /** Name of the sibling field whose value selects the pattern */
      typeField: string;
      /** Map from sibling-field value → the actual MaskingConfig to apply */
      typeMap: Record<string, Exclude<MaskingConfig, { pattern: MaskingPattern.CONDITIONAL }>>;
    };
