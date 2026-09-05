
export const policyKeys = {
  GMC: "Group Mediclaim Policy",
  GPA: "Group Personal Accident Policy",
  GTL: "Group Term Life Insurance (GTL)",
};

export const policyTypeKeys = {
  GMC: "POLICY_TYPE_GMC",
  GPA: "POLICY_TYPE_GPA",
  GTL: "POLICY_TYPE_GTL",
};

export const policyNames = {
  [policyKeys.GMC]: "GMC",
  [policyKeys.GPA]: "GPA",
  [policyKeys.GTL]: "GTL",
};

export const UnKnownPolicyDescription =
  "A Group Mediclaim health insurance policy covering hospitalization expenses for employees and dependents. Provides cashless treatment at network hospitals. Typically includes standard room rent limits, co-pay clauses, and sum insured based on company policy.";
  
export const benefitsAccordionData = [
  {
    title: "Compulsory Benefits",
    description:
      "These benefits allow you to structure and modify compulsory benefits components as per your requirements.",
    children: [
      {
        title: "GMC (Group Mediclaim)",
        description:
          "A Group Mediclaim health insurance policy covering hospitalization expenses for employees and dependents. Provides cashless treatment at network hospitals. Typically includes standard room rent limits, co-pay clauses, and sum insured based on company policy.",
        isEnrolled: true,
        key: policyKeys.GMC,
      },
      {
        title: "GPA (Group Personal Accident)",
        description:
          "A Group Mediclaim health insurance policy covering hospitalization expenses for employees and dependents. Provides cashless treatment at network hospitals. Typically includes standard room rent limits, co-pay clauses, and sum insured based on company policy.",
        isEnrolled: false,
        key: policyKeys.GPA,
      },
      {
        title: "GTL (Group Term Life)",
        description:
          "A life insurance plan providing a lump sum to the nominee in case of employee’s death during the coverage period. Offers uniform or salary-linked sum insured. Covers natural and accidental causes of death.",
        isEnrolled: false,
        key: policyKeys.GTL,
      },
    ],
  },
  {
    title: "Flex Benefits",
    description:
      "These benefits allow you to structure and modify compulsory benefits components as per your requirements.",
    children: [
      {
        title: "GMC (Group Mediclaim)",
        description:
          "A Group Mediclaim health insurance policy covering hospitalization expenses for employees and dependents. Provides cashless treatment at network hospitals. Typically includes standard room rent limits, co-pay clauses, and sum insured based on company policy.",
        isEnrolled: true,
      },
      {
        title: "Parental Base Policy",
        description:
          "A Group Mediclaim health insurance policy covering hospitalization expenses for employees and dependents. Provides cashless treatment at network hospitals. Typically includes standard room rent limits, co-pay clauses, and sum insured based on company policy.",
        isEnrolled: true,
      },
      {
        title: "GPA (Group Personal Accident)",
        description:
          "A Group Mediclaim health insurance policy covering hospitalization expenses for employees and dependents. Provides cashless treatment at network hospitals. Typically includes standard room rent limits, co-pay clauses, and sum insured based on company policy.",
        isEnrolled: false,
      },
      {
        title: "GTL (Group Term Life)",
        description:
          "A life insurance plan providing a lump sum to the nominee in case of employee’s death during the coverage period. Offers uniform or salary-linked sum insured. Covers natural and accidental causes of death.",
        isEnrolled: false,
      },
    ],
  },
  {
    title: "Optional Benefits",
    description:
      "These are additional benefits carefully selected for your wellbeing.",
    children: [
      {
        title: "GMC (Group Mediclaim)",
        description:
          "A Group Mediclaim health insurance policy covering hospitalization expenses for employees and dependents. Provides cashless treatment at network hospitals. Typically includes standard room rent limits, co-pay clauses, and sum insured based on company policy.",
        isEnrolled: true,
      },
      {
        title: "Parental Base Policy",
        description:
          "A Group Mediclaim health insurance policy covering hospitalization expenses for employees and dependents. Provides cashless treatment at network hospitals. Typically includes standard room rent limits, co-pay clauses, and sum insured based on company policy.",
        isEnrolled: true,
      },
      {
        title: "GPA (Group Personal Accident)",
        description:
          "A Group Mediclaim health insurance policy covering hospitalization expenses for employees and dependents. Provides cashless treatment at network hospitals. Typically includes standard room rent limits, co-pay clauses, and sum insured based on company policy.",
        isEnrolled: false,
      },
      {
        title: "GTL (Group Term Life)",
        description:
          "A life insurance plan providing a lump sum to the nominee in case of employee’s death during the coverage period. Offers uniform or salary-linked sum insured. Covers natural and accidental causes of death.",
        isEnrolled: false,
      },
    ],
  },
];

export const BannerData = {
  title: "Your Insurance. Your Wellness. Your Way",
  subtitle:
    "Confirm from a range of compulsory, flexible, and optional insurance benefits tailored for you. Secure your future with confidence and peace of mind",
  ButtonText: "Start Choosing Your Benefits",
};
export const EnrollmentBottomSection = {
  EnrollmentText:
    "You can conveniently enroll all of your policies at once, streamlining the process . This single-step enrollment allows you to manage everything efficiently.",
  PrimaryButtonText: "View Past Enrolment Summaries",
  SecondaryButtonText: "Enroll All",
};
