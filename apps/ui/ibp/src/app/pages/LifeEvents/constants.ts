export type LifeEventFlowType = 'addition' | 'deletion';
export type LifeEventStepIconKey =
  | 'select_reason'
  | 'dependent_details'
  | 'choose_components'
  | 'select_dependent'
  | 'review_premium'
  | 'review_summary'
  | 'confirm_removal'
  | 'upload_documents'
  | 'confirmation';

export interface LifeEventStepConfig {
  key: LifeEventStepIconKey;
  label: string;
}

export const LIFE_EVENTS_PAGE_COPY = {
  backLabel: 'Back',
  title: 'Life Events Management',
  subtitle:
    'Adjust your dependents in benefits coverage during qualifying life events.',
  commonReasonsLabel: 'Common reasons:',
} as const;

export const LIFE_EVENTS_DEPENDENT_REMOVAL_COPY = {
  emptyStateTitle: 'Select Dependent to Remove',
  noEligibleDependentsMessage:
    'No eligible dependents found for the selected life event:',
  requiredRelationshipsMessage:
    'This life event requires dependents with relationships:',
  deletionReasonLabel: 'Deletion Reason',
  yearsOldSuffix: 'years old',
  selectionSummaryPrefix: 'dependent(s) selected for removal',
} as const;

export const getRemovalComponentsLabel = (count: number) =>
  `Enrolled in ${count} component(s):`;

export const getRemovalSelectionSummary = (count: number) =>
  `${count} ${LIFE_EVENTS_DEPENDENT_REMOVAL_COPY.selectionSummaryPrefix}`;

export const LIFE_EVENTS_CONFIRM_REMOVAL_COPY = {
  selectReasonTitle: 'Select the reason for removing a dependent',
  noLifeEventsMessage: 'No life events available for your current policy configuration.',
  requiredDocumentsLabel: 'Required Documents:',
  selectDependentFirstMessage: 'Please select a life event first.',
  dependentInformationTitle: 'Dependent Information',
  nameLabel: 'Name',
  relationshipLabel: 'Relationship',
  dateOfBirthLabel: 'Date of Birth',
  dateUnavailable: 'Not available',
  componentsTitle: 'Components to be Removed',
  componentsDescription:
    'The dependent will be removed from the following components:',
  importantNoticeTitle: 'Important Notice',
  importantNoticeDescription:
    'Once confirmed, this dependent will be removed from all enrolled components. This action cannot be undone. Your premium will be adjusted accordingly after approval.',
  selectDependentsFirstMessage: 'Please select dependents to remove first.',
} as const;

export const getComponentFallbackLabel = (id: number | string) => `Component ${id}`;

export const LIFE_EVENTS_DEPENDENT_MANAGEMENT_COPY = {
  selectedReasonLabel: 'Selected Reason',
  noLifeEventSelected: 'No life event selected',
  policyTitle: 'Group Mediclaim Policy (Base Policy)',
  formTitle: 'Dependent Information',
  editFormTitle: 'Edit Dependent',
  formIntroTitle: 'Add Dependent Details',
  formIntroDescription:
    'Enter the information for the dependent you want to add',
  documentsTitle: 'Required Documents',
  documentsSubtitle: 'Upload the necessary documents to support your life event',
  uploadTitle: 'Click to upload or drag and drop',
  uploadSubtitle: 'PDF, JPG, PNG upto 5MB',
  membersTitle: 'Select Members to Include',
  noDependentsAdded: 'No dependents added yet.',
  tableNameHeader: 'Name',
  tableRelationshipHeader: 'Relation',
  tableGenderHeader: 'Gender',
  tableDobHeader: 'Date Of Birth',
  tableActionsHeader: 'Actions',
  backButton: 'Back',
  continueButton: 'Continue',
  editButton: 'Edit',
  removeButton: 'Remove',
  removeModalTitle: 'Remove Dependent',
  removeModalMessage: 'Are you sure you want to remove this dependent?',
  removeModalCancel: 'Cancel',
  removeModalConfirm: 'Remove',
  nameLabel: 'Name',
  namePlaceholder: 'Enter full name',
  relationshipLabel: 'Relationship',
  relationshipPlaceholder: 'Select relationship',
  genderLabel: 'Gender',
  genderPlaceholder: 'Select gender',
  dobLabel: 'Date of Birth',
  dobPlaceholder: 'dd/mm/yyyy',
  cancelButton: 'Cancel',
  addButton: 'Add',
  updateButton: 'Update',
  nameRequired: 'Name is required',
  nameMaxLength: 'Name cannot exceed 100 characters',
  relationshipRequired: 'Relationship is required',
  genderRequired: 'Gender is required',
  dobRequired: 'Date of birth is required',
} as const;

export const LIFE_EVENTS_CHOOSE_BENEFITS_COPY = {
  fallbackTitle: 'Choices',
  subtitle:
    'Segregated into compulsory and optional plans based on relation eligibility.',
  noChoicesMessage: 'No choices available.',
  compulsoryTitle: 'Compulsory',
  compulsoryDescription: 'Automatically provided to all employees',
  optionalTitle: 'Optional',
  optionalDescription: 'Additional coverage you can choose',
  sumInsuredLabel: 'Sum Insured',
  totalPremiumLabel: 'Total Premium',
  companyContributionLabel: 'Company Contribution',
  yourContributionLabel: 'Your Contribution',
  continueButton: 'Continue',
  selectionRequiredError: 'Please select at least one policy choice to continue.',
  defaultPolicyLabel: 'Policy',
  basePolicyBadge: 'Base Policy',
  includedBadge: 'Included',
  optionalBadge: 'Optional',
} as const;

const toTitleCase = (value: string) =>
  value
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

export const getChooseBenefitsTitle = (selectedRelations?: string[]) => {
  const normalizedRelations = Array.from(
    new Set(
      (selectedRelations || [])
        .filter((relation): relation is string => typeof relation === 'string' && relation.trim().length > 0)
        .map((relation) => relation.trim().toLowerCase()),
    ),
  );

  if (normalizedRelations.length === 0) {
    return LIFE_EVENTS_CHOOSE_BENEFITS_COPY.fallbackTitle;
  }

  return `${normalizedRelations.map(toTitleCase).join(', ')} choices`;
};

export const LIFE_EVENTS_PREMIUM_SUMMARY_COPY = {
  additionReasonLabel: 'Addition Reason',
  addingPrefix: 'Adding',
  unavailableValue: '--',
  premiumBreakdownTitle: 'Premium Breakdown',
  selectedComponentsTitle: 'Selected Components',
  additionalPrefix: 'Additional:',
  currentTotalPremiumLabel: 'Current Total Premium (Annual)',
  additionalPremiumLabel: 'Additional Premium for New Dependent',
  newTotalPremiumLabel: 'New Total Premium (Annual)',
  monthlyDeductionLabel: 'Monthly Deduction',
  monthlySuffix: '/month',
  notePrefix: 'Note:',
  noteText:
    'The updated premium will be effective from the next billing cycle after approval.',
  backButton: 'Back to Components',
  continueButton: 'Submit Request',
} as const;

export const LIFE_EVENTS_STEP_ACTION_COPY = {
  back: 'Back',
  continue: 'Continue',
  finish: 'Finish',
  backToDependentSelection: 'Back to Dependent Selection',
  confirmAndContinue: 'Confirm and Continue',
  continueToConfirmation: 'Continue',
  continueToUploadDocuments: 'Continue',
  backToComponents: 'Back to Components',
} as const;

export const LIFE_EVENTS_UPLOAD_DOCUMENTS_COPY = {
  additionReasonLabel: 'Addition Reason',
  deletionReasonLabel: 'Deletion Reason',
  dependentBeingRemovedLabel: 'Dependent Being Removed',
  requiredDocumentsLabel: 'Required Documents',
  uploadFilesLabel: 'Upload Files',
  uploadTitle: 'Click to upload or drag and drop',
  uploadSubtitle: 'PDF, JPG, PNG up to 10MB each',
  importantPrefix: 'Important:',
  importantMessage:
    'Please ensure all documents are clear and readable. Blurred or incomplete documents may delay the approval process.',
  submitLabel: 'Submit Request',
  backToPremiumSummary: 'Back to Premium Summary',
} as const;

export const LIFE_EVENTS_FLOW_CARDS = [
  {
    flowType: 'addition' as const,
    title: 'Natural Addition',
    description:
      'Add a new dependent to your benefits coverage due to life events like marriage, childbirth, or adoption',
    ctaLabel: 'Start Addition Process',
    reasons: ['Marriage', 'Childbirth', 'Adoption'],
  },
  {
    flowType: 'deletion' as const,
    title: 'Natural Deletion',
    description:
      'Remove a dependent from your benefits coverage due to divorce, age eligibility changes, or other qualifying events',
    ctaLabel: 'Start Deletion Process',
    reasons: ['Divorce', 'Age Limit', 'Eligibility Change'],
  },
] as const;

export const ADDITION_LIFE_EVENTS = [
  {
    key: 'marriage',
    id: 'marriage',
    title: 'Marriage',
    description: 'Add your spouse as a dependent after marriage.',
    requiredRelationships: ['wife', 'husband', 'spouse', 'partner', 'spouse/partner'],
    requiredDocuments: ['Marriage Certificate', 'Spouse ID Proof'],
  },
  {
    key: 'child_birth',
    id: 'child_birth',
    title: 'Child Birth',
    description: 'Add your new born child as dependent',
    requiredRelationships: ['son', 'daughter', 'child'],
    requiredDocuments: ['Birth Certificate or Hospital Birth Record'],
  },
  {
    key: 'adoption',
    id: 'adoption',
    title: 'Adoption of Child',
    description: 'Add your adopted child as a dependent.',
    requiredRelationships: ['son', 'daughter'],
    requiredDocuments: [
      'Legal Adoption Certificate issued by court / adoption authority',
    ],
  },
  {
    key: 'age_eligibility',
    id: 'age_eligibility',
    title: 'Age-Dependent Addition',
    description: 'Add an age-eligible dependent.',
    requiredRelationships: ['son', 'daughter', 'father', 'mother', 'child'],
    requiredDocuments: ['Birth Certificate / Age Proof of dependent'],
  },
] as const;

export const DELETION_LIFE_EVENTS = [
  {
    key: 'divorce',
    id: 'divorce',
    title: 'Divorce',
    description: 'Removing spouse from coverage after divorce',
    requiredRelationships: ['spouse', 'wife', 'husband', 'partner', 'spouse/partner'],
    requiredDocuments: ['Divorce Decree / Court Order'],
  },
  {
    key: 'dependent_death',
    id: 'dependent_death',
    title: 'Dependent Death',
    description: 'Cancel dependent coverage due to death.',
    requiredRelationships: ['spouse', 'son', 'daughter', 'father', 'mother', 'wife', 'husband', 'partner', 'spouse/partner'],
    requiredDocuments: ['Death Certificate'],
  },
  {
    key: 'eligibility_change',
    id: 'age_limit_exceeded',
    title: 'Age Limit Exceeded',
    description: 'Remove dependents over age eligibility.',
    requiredRelationships: ['son', 'daughter', 'father', 'mother'],
    requiredDocuments: ['Age Proof / Birth Certificate'],
  },
  {
    key: 'no_longer_eligible',
    id: 'no_longer_eligible',
    title: 'No Longer Eligible',
    description: 'Example : Daughter gets married',
    requiredRelationships: ['spouse', 'son', 'daughter', 'father', 'mother', 'wife', 'husband', 'partner', 'spouse/partner'],
    requiredDocuments: ['Eligibility Change Proof'],
  },
] as const;

export const LIFE_EVENTS = ADDITION_LIFE_EVENTS;

export const ADDITION_STEP_CONFIG: readonly LifeEventStepConfig[] = [
  { key: 'dependent_details', label: 'Add Dependent Details' },
  { key: 'choose_components', label: 'Choose Components' },
  { key: 'review_premium', label: 'Review Premium' },
] as const;

export const DELETION_STEP_CONFIG: readonly LifeEventStepConfig[] = [
  { key: 'select_dependent', label: 'Select Dependent' },
  { key: 'upload_documents', label: 'Confirm & Upload Documents' },
  { key: 'review_premium', label: 'Review Premium' },
] as const;

export const ADDITION_STEPS = ADDITION_STEP_CONFIG.map((step) => step.label);
export const DELETION_STEPS = DELETION_STEP_CONFIG.map((step) => step.label);

export const FLOW_TYPE_KEY = 'lifeEvents_flowType';
export const CURRENT_STEP_KEY = 'lifeEvents_currentStep';
export const SELECTED_EVENT_KEY = 'lifeEvents_selectedEvent';
export const DEPENDENTS_DATA_KEY = 'lifeEvents_dependentsData';
export const SELECTED_CHOICE_IDS_KEY = 'lifeEvents_selectedChoiceIds';
export const SUBMISSION_META_KEY = 'lifeEvents_submissionMeta';
export const UPLOADED_DOCUMENTS_KEY = 'lifeEvents_uploadedDocuments';
