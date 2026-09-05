export const POLICY_CONFIGURATION_CONSTANTS = {
    HEADER: {
        TITLE: 'Policy Configuration',
        DESCRIPTION: 'Configure enrollment settings and employer contributions for each insurance policy',
    },
    BUTTONS: {
        BULK_CONFIGURATION: 'Bulk Configuration',
        EXIT_BULK_CONFIGURATION: 'Exit Bulk Configuration',
        APPLY_TO_SELECTED_POLICIES: 'Apply to Selected Policies',
        APPLY_CONFIGURATION: 'Apply Configuration',
        CANCEL: 'Cancel',
    },
    BULK_CONFIG: {
        TITLE: 'Bulk Configuration',
        DESCRIPTION: 'Configure common settings for multiple policies at once',
    },
    DATE_FIELDS: {
        ENROLLMENT_START_DATE: 'Enrollment Start Date',
        ENROLLMENT_END_DATE: 'Enrollment End Date',
        START_DATE: 'Start Date',
        END_DATE: 'End Date',
    },
    TOGGLES: {
        REQUIRE_CONFIRMATION: {
            TITLE: 'Require Confirmation',
            DESCRIPTION: 'Employees must confirm selections',
            FULL_TITLE: 'Require Confirmation Before Final Submission',
            FULL_DESCRIPTION: 'Employees must review and confirm selections',
        },
        AUTO_LOCK_ENROLLMENT: {
            TITLE: 'Auto-Lock Enrollment',
            DESCRIPTION: 'Lock after cut-off date',
            FULL_TITLE: 'Auto-Lock Enrollment After Cut-Off Date',
            FULL_DESCRIPTION: 'Prevent new enrollments after end date',
        },
    },
    POLICY_STATUS: {
        CONFIGURED: 'Configured',
        NOT_CONFIGURED: 'Not Configured',
    },
    ENROLLMENT_PERIOD: 'Inception Enrollment Period',
    POLICY_SELECTION: {
        TITLE: 'Select Policies',
        DESCRIPTION: 'Choose which policies should receive the bulk configuration settings',
    },
    UPLOAD: {
        CLICK_TO_UPLOAD: 'Click to upload logo',
        RECOMMENDED_SIZE: 'Recommended: 200x200px, PNG or SVG',
    },
};

export const POLICIES_LIST = [
    {
        id: 'GMC',
        name: 'Group Mediclaim',
        fullName: 'Group Mediclaim Policy',
    },
    {
        id: 'GTL',
        name: 'Group Term Life',
        fullName: 'Group Term Life Insurance',
    },
    {
        id: 'GPA',
        name: 'Group Personal Accident',
        fullName: 'Group Personal Accident Insurance',
    },
];

export const DEFAULT_BULK_CONFIG_DAYS = 30;
export const DEFAULT_EMPLOYER_CONTRIBUTION = '75';
