import type { Schema, Struct } from '@strapi/strapi';

export interface CompanyTemplateCompanyTemplateConfig
  extends Struct.ComponentSchema {
  collectionName: 'components_company_template_company_template_configs';
  info: {
    description: '';
    displayName: 'Company Template Config';
  };
  attributes: {
    contactMatrix: Schema.Attribute.Component<
      'company-template.contact-matrix',
      false
    >;
    disclaimerNotes: Schema.Attribute.Component<
      'company-template.disclaimer-note',
      true
    >;
    enrollmentYearRange: Schema.Attribute.Component<
      'dashboard.enrollment-year-range',
      false
    >;
    faqs: Schema.Attribute.Component<'company-template.faq-item', true>;
    footer: Schema.Attribute.Component<'company-template.footer', false>;
  };
}

export interface CompanyTemplateContactGroup extends Struct.ComponentSchema {
  collectionName: 'components_company_template_contact_groups';
  info: {
    description: '';
    displayName: 'Contact Group';
  };
  attributes: {
    isRequired: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<true>;
    primaryEscalation: Schema.Attribute.Component<
      'company-template.contact-person',
      false
    >;
    secondaryEscalation: Schema.Attribute.Component<
      'company-template.contact-person',
      false
    >;
  };
}

export interface CompanyTemplateContactMatrix extends Struct.ComponentSchema {
  collectionName: 'components_company_template_contact_matrices';
  info: {
    description: '';
    displayName: 'Contact Matrix';
  };
  attributes: {
    broker: Schema.Attribute.Component<'company-template.contact-group', false>;
    dpoContacts: Schema.Attribute.Component<
      'company-template.contact-group',
      false
    >;
    grievanceContacts: Schema.Attribute.Component<
      'company-template.contact-group',
      false
    >;
    hrContacts: Schema.Attribute.Component<
      'company-template.contact-group',
      false
    >;
    supportTimings: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Monday to Friday, 9:00 AM to 6:00 PM'>;
    tpa: Schema.Attribute.Component<'company-template.contact-group', false>;
  };
}

export interface CompanyTemplateContactPerson extends Struct.ComponentSchema {
  collectionName: 'components_company_template_contact_people';
  info: {
    description: '';
    displayName: 'Contact Person';
  };
  attributes: {
    email: Schema.Attribute.Email;
    name: Schema.Attribute.String;
    phone: Schema.Attribute.String;
  };
}

export interface CompanyTemplateDisclaimerNote extends Struct.ComponentSchema {
  collectionName: 'components_company_template_disclaimer_notes';
  info: {
    description: '';
    displayName: 'Disclaimer Note';
  };
  attributes: {
    isMandatory: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    text: Schema.Attribute.Text;
  };
}

export interface CompanyTemplateEscalationLevel extends Struct.ComponentSchema {
  collectionName: 'components_company_template_escalation_levels';
  info: {
    description: '';
    displayName: 'Escalation Level';
  };
  attributes: {
    primary: Schema.Attribute.Component<
      'company-template.contact-person',
      true
    >;
  };
}

export interface CompanyTemplateFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_company_template_faq_items';
  info: {
    description: '';
    displayName: 'FAQ Item';
  };
  attributes: {
    answer: Schema.Attribute.RichText &
      Schema.Attribute.CustomField<'plugin::jodit-editor.jodit'>;
    category: Schema.Attribute.String;
    question: Schema.Attribute.Text;
    sequencenumber: Schema.Attribute.BigInteger;
  };
}

export interface CompanyTemplateFooter extends Struct.ComponentSchema {
  collectionName: 'components_company_template_footers';
  info: {
    description: '';
    displayName: 'Footer';
  };
  attributes: {
    companyName: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'India Insure Risk Management & Insurance Broking'>;
    copyright: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Copyright \u00A9 2026 India Insure Risk Management & Insurance Broking Services Pvt. Ltd.'>;
    license: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'Composite Broker IRDA Licence No. 101\u2022Valid till 29.01.2027\u2022CIN No: U67120TG1999PTC031412'>;
  };
}

export interface CompanyTemplateFooterPoint extends Struct.ComponentSchema {
  collectionName: 'components_company_template_footer_points';
  info: {
    description: '';
    displayName: 'Footer Point';
  };
  attributes: {
    text: Schema.Attribute.RichText &
      Schema.Attribute.CustomField<'plugin::jodit-editor.jodit'>;
  };
}

export interface DashboardActionItem extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_action_items';
  info: {
    description: '';
    displayName: 'Action Item';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface DashboardBannerCard extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_banner_cards';
  info: {
    description: '';
    displayName: 'Banner Card';
  };
  attributes: {
    content: Schema.Attribute.Text & Schema.Attribute.Required;
    heading: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface DashboardBenefitFeature extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_benefit_features';
  info: {
    description: 'Individual benefit feature/bullet point';
    displayName: 'Benefit Feature';
  };
  attributes: {
    text: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface DashboardBenefitsSections extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_benefits_sections';
  info: {
    description: 'Benefits sections content';
    displayName: 'Benefits Sections';
  };
  attributes: {
    compulsoryBenefits: Schema.Attribute.Component<
      'dashboard.compulsory-benefits',
      false
    >;
  };
}

export interface DashboardClaimSummaryLabels extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_claim_summary_labels';
  info: {
    description: '';
    displayName: 'Claim Summary Labels';
  };
  attributes: {
    actionRequired: Schema.Attribute.String & Schema.Attribute.Required;
    approved: Schema.Attribute.String & Schema.Attribute.Required;
    available: Schema.Attribute.String & Schema.Attribute.Required;
    claimAmount: Schema.Attribute.String & Schema.Attribute.Required;
    claimed: Schema.Attribute.String & Schema.Attribute.Required;
    claimRequested: Schema.Attribute.String & Schema.Attribute.Required;
    claimStatus: Schema.Attribute.String & Schema.Attribute.Required;
    pageTitle: Schema.Attribute.String & Schema.Attribute.Required;
    pending: Schema.Attribute.String & Schema.Attribute.Required;
    policyExpiry: Schema.Attribute.String & Schema.Attribute.Required;
    policyNumber: Schema.Attribute.String & Schema.Attribute.Required;
    sumInsured: Schema.Attribute.String & Schema.Attribute.Required;
    totalClaims: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface DashboardCompulsoryBenefits extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_compulsory_benefits';
  info: {
    description: 'Compulsory benefits section content';
    displayName: 'Compulsory Benefits';
  };
  attributes: {
    buttonText: Schema.Attribute.String &
      Schema.Attribute.DefaultTo<'View Policy Details'>;
    features: Schema.Attribute.Component<'dashboard.benefit-feature', true>;
    heading: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Compulsory Benefits'>;
    subheading: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Automatically provided to all employees'>;
  };
}

export interface DashboardEmployeeDetailsSection
  extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_employee_details_sections';
  info: {
    description: 'Employee details section content';
    displayName: 'Employee Details Section';
  };
  attributes: {
    buttonText: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Start Your Enrolment'>;
    enrollmentInfoText: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<"Open until 28 Feb'26,\nEnroll in 4 policies now!\nEnrollment ends in 14 days">;
    greetingText: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Hello'>;
    noteText: Schema.Attribute.Text &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'If these details are incorrect please contact your HR to make corrections.'>;
  };
}

export interface DashboardEnrollmentBannerItem extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_enrollment_banner_items';
  info: {
    description: 'Individual enrollment banner item';
    displayName: 'Enrollment Banner Item';
  };
  attributes: {
    background: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'linear-gradient(90deg, #9BE8F6 0%, #67DFE8 99.39%)'>;
    buttonText: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'Start Your Enrolment'>;
    header: Schema.Attribute.String & Schema.Attribute.Required;
    subheader: Schema.Attribute.Text & Schema.Attribute.Required;
  };
}

export interface DashboardEnrollmentBanners extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_enrollment_banners';
  info: {
    description: 'Enrollment banner cards';
    displayName: 'Enrollment Banners';
  };
  attributes: {
    banner1: Schema.Attribute.Component<
      'dashboard.enrollment-banner-item',
      false
    >;
    banner2: Schema.Attribute.Component<
      'dashboard.enrollment-banner-item',
      false
    >;
  };
}

export interface DashboardEnrollmentYearRange extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_enrollment_year_ranges';
  info: {
    description: 'Date range representing the enrollment policy year';
    displayName: 'Enrollment Year Range';
  };
  attributes: {
    endDate: Schema.Attribute.Date;
    startDate: Schema.Attribute.Date;
  };
}

export interface DashboardMedicalCover extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_medical_covers';
  info: {
    description: '';
    displayName: 'Medical Cover';
  };
  attributes: {
    benefitItems: Schema.Attribute.JSON & Schema.Attribute.Required;
    buttonEditLabel: Schema.Attribute.String & Schema.Attribute.Required;
    buttonLabel: Schema.Attribute.String & Schema.Attribute.Required;
    buttonText: Schema.Attribute.String & Schema.Attribute.Required;
    buttonViewLabel: Schema.Attribute.String & Schema.Attribute.Required;
    headerPrefix: Schema.Attribute.String & Schema.Attribute.Required;
    headerSubtitle: Schema.Attribute.String & Schema.Attribute.Required;
    headerTitle: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface DashboardPersonalInsurancesHeading
  extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_personal_insurances_headings';
  info: {
    description: '';
    displayName: 'Personal Insurances Heading';
  };
  attributes: {
    heading: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface DashboardWellnessBenefitCard extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_wellness_benefit_cards';
  info: {
    description: '';
    displayName: 'Wellness Benefit Card';
  };
  attributes: {
    buttonLabel: Schema.Attribute.String & Schema.Attribute.Required;
    date: Schema.Attribute.String & Schema.Attribute.Required;
    descriptionItems: Schema.Attribute.JSON & Schema.Attribute.Required;
    subtitle: Schema.Attribute.String & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface DashboardWellnessJourneyCard extends Struct.ComponentSchema {
  collectionName: 'components_dashboard_wellness_journey_cards';
  info: {
    description: '';
    displayName: 'Wellness Journey Card';
  };
  attributes: {
    buttonLabel: Schema.Attribute.String & Schema.Attribute.Required;
    description: Schema.Attribute.Text & Schema.Attribute.Required;
    features: Schema.Attribute.JSON & Schema.Attribute.Required;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface PolicyTemplateComponentInfoPoints
  extends Struct.ComponentSchema {
  collectionName: 'components_policy_template_component_info_points';
  info: {
    description: '';
    displayName: 'Component Info Points';
  };
  attributes: {
    componentId: Schema.Attribute.String;
    infoPoints: Schema.Attribute.Component<'policy-template.info-point', true>;
    label: Schema.Attribute.String;
  };
}

export interface PolicyTemplateDisclaimerNote extends Struct.ComponentSchema {
  collectionName: 'components_policy_template_disclaimer_notes';
  info: {
    description: '';
    displayName: 'Disclaimer Note';
  };
  attributes: {
    isMandatory: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    text: Schema.Attribute.Text;
  };
}

export interface PolicyTemplateEnrollmentWindow extends Struct.ComponentSchema {
  collectionName: 'components_policy_template_enrollment_windows';
  info: {
    description: '';
    displayName: 'Enrollment Window';
  };
  attributes: {
    endDate: Schema.Attribute.Date;
    startDate: Schema.Attribute.Date;
  };
}

export interface PolicyTemplateFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_policy_template_faq_items';
  info: {
    description: '';
    displayName: 'FAQ Item';
  };
  attributes: {
    answer: Schema.Attribute.RichText &
      Schema.Attribute.CustomField<'plugin::jodit-editor.jodit'>;
    category: Schema.Attribute.String;
    question: Schema.Attribute.Text;
    sequencenumber: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
  };
}

export interface PolicyTemplateInfoPoint extends Struct.ComponentSchema {
  collectionName: 'components_policy_template_info_points';
  info: {
    description: '';
    displayName: 'Info Point';
  };
  attributes: {
    text: Schema.Attribute.Text;
  };
}

export interface PolicyTemplateInfoPointsSection
  extends Struct.ComponentSchema {
  collectionName: 'components_policy_template_info_points_sections';
  info: {
    description: '';
    displayName: 'Info Points Section';
  };
  attributes: {
    infoPoints: Schema.Attribute.Component<'policy-template.info-point', true>;
  };
}

export interface PolicyTemplatePolicyTemplateConfig
  extends Struct.ComponentSchema {
  collectionName: 'components_policy_template_policy_template_configs';
  info: {
    description: '';
    displayName: 'Policy Template Config';
  };
  attributes: {
    autoLockEnrollmentAfterConfirm: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    compulsory: Schema.Attribute.Component<
      'policy-template.component-info-points',
      true
    >;
    disclaimerNotes: Schema.Attribute.Component<
      'policy-template.disclaimer-note',
      true
    >;
    faqs: Schema.Attribute.Component<'policy-template.faq-item', true>;
    flex: Schema.Attribute.Component<
      'policy-template.component-info-points',
      true
    >;
    optional: Schema.Attribute.Component<
      'policy-template.component-info-points',
      true
    >;
    policyFeaturesDoc: Schema.Attribute.RichText &
      Schema.Attribute.CustomField<'plugin::jodit-editor.jodit'>;
    requireConfirmationBeforeSubmit: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
    showCompanyContribution: Schema.Attribute.Boolean &
      Schema.Attribute.DefaultTo<false>;
  };
}

export interface TermsAndConditionsTcSection extends Struct.ComponentSchema {
  collectionName: 'components_terms_and_conditions_tc_sections';
  info: {
    description: 'A titled section within a terms and conditions document';
    displayName: 'TC Section';
  };
  attributes: {
    content: Schema.Attribute.RichText &
      Schema.Attribute.CustomField<'plugin::jodit-editor.jodit'>;
    sequenceNumber: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    title: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'company-template.company-template-config': CompanyTemplateCompanyTemplateConfig;
      'company-template.contact-group': CompanyTemplateContactGroup;
      'company-template.contact-matrix': CompanyTemplateContactMatrix;
      'company-template.contact-person': CompanyTemplateContactPerson;
      'company-template.disclaimer-note': CompanyTemplateDisclaimerNote;
      'company-template.escalation-level': CompanyTemplateEscalationLevel;
      'company-template.faq-item': CompanyTemplateFaqItem;
      'company-template.footer': CompanyTemplateFooter;
      'company-template.footer-point': CompanyTemplateFooterPoint;
      'dashboard.action-item': DashboardActionItem;
      'dashboard.banner-card': DashboardBannerCard;
      'dashboard.benefit-feature': DashboardBenefitFeature;
      'dashboard.benefits-sections': DashboardBenefitsSections;
      'dashboard.claim-summary-labels': DashboardClaimSummaryLabels;
      'dashboard.compulsory-benefits': DashboardCompulsoryBenefits;
      'dashboard.employee-details-section': DashboardEmployeeDetailsSection;
      'dashboard.enrollment-banner-item': DashboardEnrollmentBannerItem;
      'dashboard.enrollment-banners': DashboardEnrollmentBanners;
      'dashboard.enrollment-year-range': DashboardEnrollmentYearRange;
      'dashboard.medical-cover': DashboardMedicalCover;
      'dashboard.personal-insurances-heading': DashboardPersonalInsurancesHeading;
      'dashboard.wellness-benefit-card': DashboardWellnessBenefitCard;
      'dashboard.wellness-journey-card': DashboardWellnessJourneyCard;
      'policy-template.component-info-points': PolicyTemplateComponentInfoPoints;
      'policy-template.disclaimer-note': PolicyTemplateDisclaimerNote;
      'policy-template.enrollment-window': PolicyTemplateEnrollmentWindow;
      'policy-template.faq-item': PolicyTemplateFaqItem;
      'policy-template.info-point': PolicyTemplateInfoPoint;
      'policy-template.info-points-section': PolicyTemplateInfoPointsSection;
      'policy-template.policy-template-config': PolicyTemplatePolicyTemplateConfig;
      'terms-and-conditions.tc-section': TermsAndConditionsTcSection;
    }
  }
}
