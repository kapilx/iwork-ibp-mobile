import { ValidationErrors } from '../constants/errors';
import { REGEX_PATTERNS } from '../constants/regex';

const testRegex = (re: RegExp, s: string): boolean => re.test(s);

export const validators = {
    // Basic validators
    nonEmpty: (value: string | number | null | undefined) => {
        if (value === null || value === undefined) {
            return ValidationErrors.NON_EMPTY;
        }
        if (typeof value === 'string' && value.trim() === '') {
            return ValidationErrors.NON_EMPTY;
        }
        return null;
    },

    // Contact validators
    email: (value: string) => 
        testRegex(REGEX_PATTERNS.EMAIL, value) ? null : ValidationErrors.EMAIL,
    phone: (value: string) =>
        testRegex(REGEX_PATTERNS.PHONE, value) ? null : ValidationErrors.PHONE,
    mobile: (value: string) =>
        testRegex(REGEX_PATTERNS.MOBILE, value) ? null : ValidationErrors.MOBILE,
    fax: (value: string) =>
        testRegex(REGEX_PATTERNS.FAX, value) ? null : ValidationErrors.FAX,

    // Name validators
    firstName: (value: string) =>
        testRegex(REGEX_PATTERNS.FIRST_NAME, value) ? null : ValidationErrors.FIRST_NAME,
    lastName: (value: string) =>
        testRegex(REGEX_PATTERNS.LAST_NAME, value) ? null : ValidationErrors.LAST_NAME,
    displayName: (value: string) =>
        testRegex(REGEX_PATTERNS.DISPLAY_NAME, value) ? null : ValidationErrors.DISPLAY_NAME,

    // Address validators
    pinCode: (value: string) =>
        testRegex(REGEX_PATTERNS.PIN_CODE, value) ? null : ValidationErrors.PIN_CODE,
    address: (value: string) =>
        testRegex(REGEX_PATTERNS.ADDRESS, value) ? null : ValidationErrors.ADDRESS_LINE,
    area: (value: string) =>
        testRegex(REGEX_PATTERNS.AREA, value) ? null : ValidationErrors.AREA,

    // Business validators
    department: (value: string) =>
        testRegex(REGEX_PATTERNS.DEPARTMENT, value) ? null : ValidationErrors.DEPARTMENT,
    designation: (value: string) =>
        testRegex(REGEX_PATTERNS.DESIGNATION, value) ? null : ValidationErrors.DESIGNATION,

    // Length validators
    minLength: (min: number) => (value: string) =>
        value.length >= min ? null : ValidationErrors.MIN_LENGTH,
    maxLength: (max: number) => (value: string) =>
        value.length <= max ? null : ValidationErrors.MAX_LENGTH,

    // Format validators
    numeric: (value: string) =>
        testRegex(REGEX_PATTERNS.NUMERIC, value) ? null : ValidationErrors.NUMERIC,
    alphanumeric: (value: string) =>
        testRegex(REGEX_PATTERNS.ALPHANUMERIC, value) ? null : ValidationErrors.ALPHANUMERIC,
    noSpecialChars: (value: string) =>
        testRegex(REGEX_PATTERNS.NO_SPECIAL_CHARS, value) ? null : ValidationErrors.INVALID_FORMAT,
    noNumbers: (value: string) =>
        testRegex(REGEX_PATTERNS.NO_NUMBERS, value) ? null : ValidationErrors.INVALID_FORMAT,

    // Web validators
    url: (value: string) =>
        testRegex(REGEX_PATTERNS.URL, value) ? null : ValidationErrors.URL,
    domain: (value: string) =>
        testRegex(REGEX_PATTERNS.DOMAIN, value) ? null : ValidationErrors.INVALID_FORMAT,

    // Date and Time validators
    date: (value: string) =>
        testRegex(REGEX_PATTERNS.DATE, value) ? null : ValidationErrors.DATE,
    time: (value: string) =>
        testRegex(REGEX_PATTERNS.TIME, value) ? null : ValidationErrors.INVALID_FORMAT,

    // Special validators
    password: (value: string) =>
        testRegex(REGEX_PATTERNS.PASSWORD, value) ? null : ValidationErrors.PASSWORD,
    currency: (value: string) =>
        testRegex(REGEX_PATTERNS.CURRENCY, value) ? null : ValidationErrors.INVALID_FORMAT,
    percentage: (value: string) =>
        testRegex(REGEX_PATTERNS.PERCENTAGE, value) ? null : ValidationErrors.INVALID_FORMAT,

    // Dropdown validators
    required: (value: any) =>
        value ? null : ValidationErrors.REQUIRED_SELECTION,
    
    // Custom validators
    matchValue: (matchWith: any) => (value: any) =>
        value === matchWith ? null : ValidationErrors.INVALID_INPUT,
    
    range: (min: number, max: number) => (value: number) =>
        value >= min && value <= max ? null : `Value must be between ${min} and ${max}`
}; 