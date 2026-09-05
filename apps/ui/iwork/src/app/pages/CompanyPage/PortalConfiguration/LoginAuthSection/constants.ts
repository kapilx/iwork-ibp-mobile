// Authentication Method Labels
export const AUTH_METHOD_LABELS = {
    EMAIL_PASSWORD: 'Email + Password',
    EMAIL_OTP: 'Email + OTP',
    MOBILE_OTP: 'Mobile + OTP',
    PHONE_PASSWORD: 'Phone Number + Password',
    EMPLOYEE_ID: 'Employee ID + Year of Birth',
} as const;

// Authentication Method Descriptions
export const AUTH_METHOD_DESCRIPTIONS = {
    EMAIL_PASSWORD: 'Email & password login',
    EMAIL_OTP: 'Email with OTP verification',
    MOBILE_OTP: 'SMS verification',
    PHONE_PASSWORD: 'Phone & password login',
    EMPLOYEE_ID: 'ID and year of birth',
} as const;

// Section Titles
export const SECTION_TITLES = {
    PASSWORD_POLICY: 'Password Policy',
    ACCOUNT_LOCKOUT:"Account Lockout Policy",
    PASSWORD_EXPIRY: 'Password Expiry',
    ACCOUNT_LOCKOUT_POLICY: 'Account Lockout Policy',
    CHANGE_PASSWORD_POLICY: 'Change Password Policy',
    SESSION_TIMEOUT: 'Session Timeout',
    TWO_FACTOR_AUTH: '2 Factor Authentication',
    OTP_CONFIGURATION: 'OTP Configuration',
    SESSION_SETTINGS: 'Session Settings',
    AUTHENTICATION_CONFIG: 'Authentication Config',
    SECURITY_SETTINGS: 'Security Settings',
} as const;

// Section Descriptions
export const SECTION_DESCRIPTIONS = {
    TWO_FACTOR_AUTH:"Add extra security layer with OTP verification",
    SELECT_AUTH_METHOD: 'Select one authentication method for employee login',
    CHANGE_PASSWORD_POLICY:"Define password change requirements",
    ACCOUNT_LOCKOUT:"Configure failed login attempt limits",
    PASSWORD_REQUIREMENTS: 'Define password requirements',
    PASSWORD_EXPIRATION: 'Set password expiration period',
    PASSWORD_EXPIRY_PERIOD: 'Set expiration period',
    LOCKOUT_SETTINGS: 'Configure lockout settings',
    PASSWORD_CHANGE_REQUIREMENTS: 'Define password change requirements',
    AUTO_LOGOUT_INACTIVITY: 'Auto-logout after period of inactivity',
    AUTO_LOGOUT: 'Auto-logout after inactivity',
    EXTRA_SECURITY_OTP: 'Add extra security layer with OTP verification',
    OTP_EMAIL_SETTINGS: 'Configure OTP settings for email',
    OTP_MOBILE_SETTINGS: 'Configure OTP settings for mobile authentication',
    SESSION_TIMEOUT_BEHAVIOR: 'Configure session timeout behavior',
    EMPLOYEE_ID_VALIDATION: 'Configure employee ID format validation',
    ACCOUNT_SECURITY_POLICIES: 'Configure account security policies',
    CONFIGURE_AUTH_SETTINGS: 'Configure authentication settings',
    PASSWORD_EXPIRY:'Set password expiration period'
} as const;

// Field Labels
export const FIELD_LABELS = {
    MIN_PASSWORD_LENGTH: 'Minimum Password Length',
    OTP_DELIVERY_DESCRIPTION:"Select one or more delivery methods",
    DURATION: 'Expiry Duration',
    MUST_INCLUDE: 'Must Include',
    EXPIRY_DURATION: 'Expiry Duration',
    FAILED_LOGIN_LIMIT: 'Failed Login Attempt Limit',
    MAX_LOGIN_ATTEMPTS: 'Allowed Login Attempts',
    LOCKOUT_DURATION: 'Lockout Duration',
    SESSION_TIMEOUT: 'Session Timeout',
    OTP_DELIVERY_METHOD: 'OTP Delivery Method',
    OTP_DELIVERY: 'OTP Delivery Method',
    OTP_LENGTH: 'OTP Length',
    OTP_VALIDITY_DURATION: 'OTP Validity Duration',
    OTP_VALIDITY: 'OTP Validity Duration',
    RESEND_OTP_COOLDOWN: 'Resend OTP Cooldown',
    RESEND_COOLDOWN: 'Resend OTP Cooldown',
    OTP_RESEND_COOLDOWN: 'OTP Resend Cooldown',
    MAX_OTP_ATTEMPTS: 'Maximum OTP Attempts',
    OTP_RETRY_LIMIT: 'OTP Retry Limit',
    OTP_RETRY_LIMIT_INCORRECT: 'OTP Retry Limit (Incorrect Attempts)',
    MAX_FAILED_ATTEMPTS: 'Max Failed Attempts',
} as const;

// Toggle Labels
export const TOGGLE_LABELS = {
    UPPERCASE: 'Uppercase (A-Z)',
    LOWERCASE: 'Lowercase (a-z)',
    NUMBERS: 'Number (0-9)',
    SPECIAL_CHARS: 'Special ([!@#$%^&*])',
    REQUIRE_OLD_PASSWORD: 'Require Old Password to Change Password',
    CHANGE_PASSWORD_FIRST_LOGIN: 'Change Password After First Login',
    CHANGE_PASSWORD_ON_FIRST_LOGIN: 'Force Change Password on First Login',
    ENABLE_2FA: 'Enable 2 Factor Authentication',
    EMPLOYEE_ID_VALIDATION: 'Employee ID Format Validation',
} as const;

// Button Labels
export const BUTTON_LABELS = {
    CONFIGURE_SETTINGS: 'Configure Settings',
    SAVE_CONFIGURATION: 'Save Configuration',
    CANCEL: 'Cancel',
    EMAIL: 'Email',
    MOBILE_NUMBER: 'Mobile Number',
} as const;

// Option Labels
export const OPTION_LABELS = {
    EMAIL: 'Email',
    SMS: 'SMS',
    BOTH: 'Both',
    DAYS_30: '30 days',
    DAYS_60: '60 days',
    DAYS_90: '90 days',
    DAYS_120: '120 days',
    NEVER: 'Never',
    ATTEMPTS_3: '3 attempts',
    ATTEMPTS_5: '5 attempts',
    ATTEMPTS_10: '10 attempts',
    MIN_15: '15 min',
    MIN_30: '30 min',
    MIN_60: '60 min',
    MINUTES_15: '15 minutes',
    MINUTES_30: '30 minutes',
    MINUTES_60: '60 minutes',
    DIGITS_4: '4 digits',
    DIGITS_6: '6 digits',
    DIGITS_8: '8 digits',
    SEC_30: '30 sec',
    SEC_60: '60 sec',
    SEC_90: '90 sec',
    SEC_120: '120 sec',
    SECONDS_30: '30 seconds',
    SECONDS_60: '60 seconds',
    SECONDS_90: '90 seconds',
    SECONDS_120: '120 seconds',
} as const;

// Helper Text
export const HELPER_TEXT = {
    PASSWORD_LENGTH: '4-20 characters',
    PASSWORD_LENGTH_RANGE: '4–20 characters',
    MAX_ATTEMPTS: 'Account locked after exceeding failed attempts (1–10)',
    LOCKOUT_DURATION: '1–36 hours',
    OTP_VALIDITY: '5 minutes',
    OTP_VALIDITY_RANGE: '1–15 minutes',
    RESEND_COOLDOWN: 'Time before user can request a new OTP',
    ACCOUNT_LOCKED: 'Account locked after exceeding failed attempts (1–10)',
    USERS_ENTER_CURRENT_PASSWORD: 'Users must enter their current password',
    REQUIRE_CHANGE_FIRST_LOGIN: 'Require users to change password on first login',
    REQUIRE_OTP_AFTER_PASSWORD: 'Require OTP verification after password login',
    OTP_WINDOW: 'Time window for OTP to remain valid',
    EMPLOYEE_ID_FORMAT: 'Use X for any character, 9 for digits',
    MAX_FAILED_LOCK_ACCOUNT: 'Lock user account after exceeding wrong attempts',
} as const;

// Alert Messages
export const ALERT_MESSAGES = {
    EMAIL_ONBOARDING: 'Onboarding welcome message will be sent via email',
    SMS_ONBOARDING: 'Onboarding welcome message will be sent via SMS',
    NO_ONBOARDING: 'No onboarding welcome message for this authentication method',
    OTP_BEHAVIOR: 'OTP Behavior: OTP will be sent to user after successful password login.',
} as const;

// Configuration Titles
export const CONFIG_TITLES = {
    EMAIL_PASSWORD: 'Email + Password Configuration',
    EMAIL_OTP: 'Email + OTP Configuration',
    MOBILE_OTP: 'Mobile + OTP Configuration',
    PHONE_PASSWORD: 'Phone + Password Configuration',
    EMPLOYEE_ID_YOB: 'Employee ID + YOB Configuration',
    SSO: 'Single Sign-On Configuration',
} as const;

// Default Values
export const DEFAULT_VALUES = {
    MIN_PASSWORD_LENGTH: '8',
    PASSWORD_EXPIRY: '90',
    ENROLLMENT_REMINDER_DAYS: [0, 1, 2, 3],
    ALLOWED_LOGIN_ATTEMPTS: '5',
    LOCKOUT_DURATION: '5',
    SESSION_TIMEOUT: '30',
    OTP_DELIVERY: 'email',
    OTP_LENGTH: '6',
    OTP_VALIDITY: '5',
    RESEND_OTP_COOLDOWN: '60',
    MAX_OTP_ATTEMPTS: '3',
    EMPLOYEE_ID_FORMAT: 'EMP-XXXXX',
    MAX_FAILED_ATTEMPTS: '5',
} as const;

// Method Codes
export const METHOD_CODES = {
    EMAIL_PASSWORD: 'EMAIL_PASSWORD',
    PHONE_PASSWORD: 'PHONE_PASSWORD',
    USERNAME_PASSWORD: 'USERNAME_PASSWORD',
    EMAIL_OTP: 'EMAIL_OTP',
    PHONE_OTP: 'PHONE_OTP',
} as const;

// Method Keys
export const METHOD_KEYS = {
    EMAIL_PASSWORD: 'email-password',
    EMAIL_OTP: 'email-otp',
    MOBILE_OTP: 'mobile-otp',
    PHONE_PASSWORD: 'phone-password',
    EMPLOYEE_ID: 'employee-id',
} as const;
