/**
 * Entity type codes for unique reference key generation
 */
export enum EntityTypeCode {
    COMPANY = 'CMP',
    POLICY = 'PLC',
    OPPORTUNITY = 'OPT',
    ENDORSEMENT = 'END',
    CLAIM = 'CLM',
    CONTACT = 'CNT',
    BROKER = 'BRK',
    INSURER = 'INS',
    INVOICE = 'INV',
    COMPANY_CONTACT = 'CMC',
    INSURER_CONTACT = 'INC',
    BROKER_CONTACT = 'BRC',
}

/**
 * Generates a random 6-digit number between 100000 and 999999
 * @returns Random 6-digit number as string
 */
function generateRandomSixDigitNumber(): string {
    const min = 100000;
    const max = 999999;
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber.toString();
}

/**
 * Generates a random 2-character uppercase string
 * @returns Random 2-character uppercase string
 */
function generateRandomTwoCharString(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 2; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

/**
 * Generates a unique reference key for an entity
 * Format: entityCode + 6-digit-random-number + 2-char-random-uppercase-string
 * Example: PLC456789XY
 * 
 * @param entityType - The entity type code from EntityTypeCode enum
 * @returns Unique reference key string
 * 
 * @example
 * ```typescript
 * const policyKey = generateUniqueRefKey(EntityTypeCode.POLICY);
 * // Returns something like: "PLC456789XY"
 * 
 * const opportunityKey = generateUniqueRefKey(EntityTypeCode.OPPORTUNITY);
 * // Returns something like: "OPT123456AB"
 * ```
 */
export function generateUniqueRefKey(entityType: EntityTypeCode): string {
    const randomNumber = generateRandomSixDigitNumber();
    const randomChars = generateRandomTwoCharString();
    return `${entityType}${randomNumber}${randomChars}`;
}
