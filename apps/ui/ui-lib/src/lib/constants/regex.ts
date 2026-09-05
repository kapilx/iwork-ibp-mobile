export const REGEX_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^[+]?[0-9]{10,12}$/,
  MULTI_SECTION_PREFIX_REGEX: /^([^.]+\.[^.]+\.)/,
  PIN_CODE: /^[0-9]{6}$/,
  LANDLINE_PHONE_MOBILE: /^(?:\+?\d{1,4}[-.\s]?)?(?:\(?\d{2,4}\)?[-.\s]?)?\d{6,10}$/,
  FAX: /^[+]?[0-9]{8,12}$/,
  MOBILE: /^[+]?[0-9]{10,12}$/,
  FIRST_NAME: /^[a-zA-Z]{2,30}$/,
  LAST_NAME: /^[a-zA-Z]{2,30}$/,
  DISPLAY_NAME: /^[a-zA-Z0-9\s]{3,50}$/,
  ADDRESS: /^[a-zA-Z0-9\s,.-]{3,100}$/,
  AREA: /^[a-zA-Z0-9\s,.-]{3,50}$/,
  DEPARTMENT: /^[a-zA-Z0-9\s&-]{2,50}$/,
  DESIGNATION: /^[a-zA-Z0-9\s&-]{2,50}$/,
  NUMERIC: /^[0-9]+$/,
  ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
  ALPHANUMERIC_WITH_SPECIALS:
    /^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]+$/,
  NO_SPECIAL_CHARS: /^[a-zA-Z0-9\s]+$/,
  NO_NUMBERS: /^[a-zA-Z\s]+$/,
  URL: /^(?:(?:[Hh][Tt][Tt][Pp][Ss]?):\/\/)?(?:(?:[Ww][Ww][Ww])\.)?[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}(?::\d{1,5})?(?:\/\S*)?$/,
  DOMAIN: /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/,
  DATE: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
  TIME: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&()[\]{}^#_+\-=|\\:;\'",.<>/~`])[A-Za-z\d@$!%*?&()[\]{}^#_+\-=|\\:;\'",.<>/~`]{8,}$/,
  CURRENCY: /^\d+(\.\d{1,2})?$/,
  PERCENTAGE: /^100(\.0{1,2})?$|^\d{1,2}(\.\d{1,2})?$/,
  
  // Name Validations
  NAME: /^[a-zA-Z\s]{2,50}$/,

  // URL and Web
  LINKEDINURL:
    /^(https?:\/\/)?(www\.)?linkedin\.com\/(in|pub|company)\/[a-zA-Z0-9_-]+\/?$/,

  PAN_CARD: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  TAN_NUMBER: /^[A-Z]{4}[0-9]{5}[A-Z]{1}$/,
  REGISTRATION_NUMBER: /^U\d{5}[A-Z]{2}\d{4}PLC\d{6}$/,
  YEAR: /^\d{4}$/,
  GST_NUMBER: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
};

const isNotEmpty = (str: string): boolean =>  !!str && str.trim().length > 0;

export const PASSWORD_GUIDELINES = [
  {
    label: "Contains at least 8 characters",
    test: (pw: string) => pw.length >= 8,
  },
  {
    label: "Contains both lower (a-z) and upper case letters (A-Z)",
    test: (pw: string) => /[a-z]/.test(pw) && /[A-Z]/.test(pw),
  },
  {
    label: "Contains at least one number (0-9)",
    test: (pw: string) => /\d/.test(pw),
  },
  {
    label: "Contains at least one special character (@, $, % etc)",
    test: (pw: string) => /[@$!%*?&()[\]{}^#_+\-=|\\:;\'\",.<>\/~`]/.test(pw),
  },
  {
    label: "Does not contain sequential numbers or letters (e.g., 123, abc)",
    test: (pw: string) =>
      isNotEmpty(pw) &&
      !/(012|123|234|345|456|567|678|789|abc|bcd|cde|def|efg|fgh)/i.test(pw),
  },
  {
    label: "Does not contain keyboard patterns (e.g., qwerty, asdf)",
    test: (pw: string) => isNotEmpty(pw) && !/(qwerty|asdf|zxcv)/i.test(pw),
  },
  {
    label: "Does not contain common or easily guessable words",
    test: (pw: string) => {
      if (!isNotEmpty(pw)) return false;
      const commonWords = [
        'password', 'admin', 'welcome', 'letmein', 'login',
        'secure', 'reset', 'default', 'access', 'portal',
        'system', 'manager', 'user', 'temp', 'change',
        'app', 'core', 'control', 'gate', 'lock',
        'home', 'role', 'account', 'pass', 'test'
      ];
      const lowerPw = pw.toLowerCase();
      return !commonWords.some(word => lowerPw.includes(word));
    },
  },
  {
    label: "Does not contain repeated characters (e.g., aaa, 111)",
    test: (pw: string) => isNotEmpty(pw) && !/(.)\1{2,}/.test(pw),
  },
];
