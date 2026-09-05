// Portal Configuration Constants

// Section Titles
export const SECTION_TITLES = {
    PORTAL_SETUP: 'Portal Setup',
    PORTAL_URL_DOMAIN: 'Portal URL & Domain',
    LOGIN_AUTHENTICATION: 'Login & Authentication',
    BRANDING: 'Branding & Appearance',
    NOTIFICATION_SETTINGS: 'Notification & Email Settings',
} as const;

// Section Subtitles
export const SECTION_SUBTITLES = {
    PORTAL_SETUP: 'Configure URL, domain, and authentication settings',
    PORTAL_URL_DOMAIN: 'Configure URL, domain, and authentication settings',
    LOGIN_AUTHENTICATION: 'Configure authentication methods and security settings',
    BRANDING: 'Customize your portal appearance and branding',
    NOTIFICATION_SETTINGS: 'Choose the mail service used to send all IBP emails for this company',
} as const;

// Page Titles
export const PAGE_TITLES = {
    CONFIGURE_IBP_PORTAL: 'Configure IBP Portal',
    COMPANY_CONFIGURATION: 'Company Configuration',
    DASHBOARD_CONFIGURATION: 'Dashboard Configuration',
    POLICY_CONFIGURATION: 'Policy Configuration',
} as const;

// Button Labels
export const BUTTON_LABELS = {
    BACK: 'Back',
    EDIT: 'Edit',
    SAVE: 'Save',
    SAVE_PUBLISH: 'Save & Publish',
    SUBMIT_FOR_APPROVAL: 'Submit for Approval',
    APPROVE: 'Approve',
    REJECT: 'Reject',
    COMMENTS: 'Comments',
    CANCEL: 'Cancel',
    CONFIRM: 'Confirm',
    TRIGGER_ONBOARDING_MAILS: 'Trigger Onboarding Mails',
    TRIGGER_CONFIRMATION_MAILS: 'Trigger Confirmation Mails',
    SEND_TEST_EMAILS: 'Send Email',
    CANCEL_TEST: 'Cancel Test',
} as const;

export const ONBOARDING_MAIL_MODE = {
    CRON: 'cron',
    MANUAL: 'manual',
} as const;

// Status Labels
export const STATUS_LABELS = {
    DRAFT: 'Draft',
    PENDING: 'Pending',
    UNDER_REVIEW: 'Under Review',
    REJECTED: 'Rejected',
    ACTIVE: 'Active',
} as const;

// Tab Labels
export const TAB_LABELS = {
    COMPANY: 'Company Configuration for IBP Portal',
    DASHBOARD: 'Dashboard Configuration for IBP Portal',
    POLICY: 'Policy Configuration for IBP Portal',
    WELLNESS: 'Wellness Configuration for IBP Portal',
    POLICY_FEATURE_DOCUMENT: 'Upload Policy Feature Document',
    ADDITIONAL_DOCUMENTS: 'Additional Documents',
    OFFERS_BENEFITS: 'Offers & Benefits',
} as const;

// Tab Keys
export const TAB_KEYS = {
    COMPANY: 'company',
    DASHBOARD: 'dashboard',
    POLICY: 'policy',
    WELLNESS: 'wellness',
    POLICY_FEATURE_DOCUMENT: 'policy-feature-document',
    ADDITIONAL_DOCUMENTS: 'additional-documents',
    OFFERS_BENEFITS: 'offers-benefits',
} as const;

// Breadcrumb Labels
export const BREADCRUMB_LABELS = {
    MY_COMPANIES: 'My Companies',
    CONFIGURE_IBP_PORTAL: 'Configure IBP Portal',
} as const;

// Policy IDs
export const POLICY_IDS = {
    GMC: 'GMC',
    GTL: 'GTL',
    GPA: 'GPA',
} as const;

// Policy Names
export const POLICY_NAMES = {
    GMC: 'Group Mediclaim',
    GTL: 'Group Term Life',
    GPA: 'Group Personal Accident',
} as const;

// Default Values
export const DEFAULT_VALUES = {
    PORTAL_SLUG: 'payline-india',
    BASE_URL: 'https://benefits.iirm.com',
    BRANDING_HEADING: 'Welcome to Insurance and Wellness Hub',
    BRANDING_BODY_TEXT: 'Complete healthcare coverage for you and your family',
    LAST_UPDATED: 'Last Updated: Dec 8, 2025 10:30 AM',
    INDUSTRY: 'Service',
} as const;

// Method Codes
export const METHOD_CODES = {
    EMAIL_PASSWORD: 'EMAIL_PASSWORD',
    PHONE_PASSWORD: 'PHONE_PASSWORD',
    USERNAME_PASSWORD: 'USERNAME_PASSWORD',
    EMAIL_OTP: 'EMAIL_OTP',
    PHONE_OTP: 'PHONE_OTP',
    GOOGLE_OAUTH: 'GOOGLE_OAUTH',
    MICROSOFT_OAUTH: 'MICROSOFT_OAUTH',
} as const;

// Allowed Method Codes
export const ALLOWED_METHOD_CODES = new Set([
    METHOD_CODES.EMAIL_PASSWORD,
    METHOD_CODES.PHONE_PASSWORD,
    METHOD_CODES.USERNAME_PASSWORD,
    METHOD_CODES.EMAIL_OTP,
    METHOD_CODES.PHONE_OTP,
]);

// Authentication Method Keys
export const AUTH_METHOD_KEYS = {
    EMAIL_PASSWORD: 'email-password',
    EMAIL_OTP: 'email-otp',
    MOBILE_OTP: 'mobile-otp',
    PHONE_PASSWORD: 'phone-password',
    EMPLOYEE_ID: 'employee-id',
    OAUTH: 'oauth',
} as const;

// Query Keys
export const QUERY_KEYS = {
    COMPANY_PORTAL_CONFIG: 'company-portal-config',
    COMPANY_DETAILS: 'company-details',
    AUTHENTICATION_METHODS: 'authentication-methods',
    AUTH_CONFIG: 'auth-config',
} as const;

// Toast Messages
export const TOAST_MESSAGES = {
    SAVE_SUCCESS: 'Portal configuration saved successfully.',
    SAVE_ERROR: 'Failed to save portal configuration.',
    SUBMIT_SUCCESS: 'Configuration submitted for approval.',
    APPROVE_SUCCESS: 'Configuration approved.',
    REJECT_SUCCESS: 'Configuration rejected.',
    SUBMIT_NEEDS_SAVE: 'Please save the configuration before submitting for approval.',
    ACTION_ERROR: 'Unable to process the request. Please try again.',
} as const;

// Status Keys
export const STATUS_KEYS = {
    UNDER_REVIEW: 'UNDER_REVIEW',
    DRAFT: 'draft',
    PENDING: 'pending',
    REJECTED: 'rejected',
    ACTIVE: 'active',
} as const;

// Portal Status Style Map (colors)
export const PORTAL_STATUS_COLORS = {
    ACTIVE: {
        backgroundColor: '#E8F5E9',
        color: '#4CAF50',
    },
    DRAFT: {
        backgroundColor: '#F5F5F5',
        color: '#6B7280',
    },
    PENDING: {
        backgroundColor: '#FFCD0529',
        color: '#FFCD05',
    },
    REJECTED: {
        backgroundColor: '#FF710426',
        color: '#FF4800',
    },
    UNDER_REVIEW: {
        backgroundColor: '#fef9c2',
        color: '#894b00',
    },
} as const;

// Icon Colors
export const ICON_COLORS = {
    PRIMARY_BLUE: '#3B82F6',
    EDIT_BUTTON: '#6366F1',
    EDIT_BUTTON_HOVER: '#4F46E5',
} as const;

// Configuration Accordion Numbers
export const ACCORDION_NUMBERS = {
    URL_DOMAIN: 1,
    LOGIN_AUTH: 2,
    BRANDING: 3,
    NOTIFICATION_SETTINGS: 4,
} as const;
