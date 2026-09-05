interface FieldConfig {
  label: string;
  key: string;
}

// Helper function to generate dynamic employee details fields
export const generateEmployeeDetailsFields = (userDetails: Record<string, unknown>): FieldConfig[] => {
  const baseFields: FieldConfig[] = [
    {
      label: "Name",
      key: "displayName",
    },
    {
      label: "Employee ID",
      key: "companyEmployeeId",
    },
    // {
    //   label: "Company ID",
    //   key: "employeeCompanyId",
    // },
    {
      label: "Phone",
      key: "phone",
    },
    {
      label: "Email",
      key: "email",
    },
    {
      label: "Date of Birth",
      key: "dateOfBirth",
    },
    {
      label: "Marital Status",
      key: "maritalStatus",
    },
    {
      label: "Alternate Phone",
      key: "alternatePhone",
    },
    {
      label: "Alternate Email",
      key: "alternateEmail",
    }
  ];

  return baseFields;
};

export const employDetailsSection = [
  {
    sectionTitle: "Employee Details",
    hideTitle: true,
    fields: [
      {
        label: "Name",
        key: "displayName",
      },
      {
        label: "Employee ID",
        key: "companyEmployeeId",
      },
      {
        label: "Company ID",
        key: "employeeCompanyId",
      },
      {
        label: "Email",
        key: "email",
      },
      {
        label: "Phone",
        key: "phone",
      },
      {
        label: "Designation",
        key: "designation",
      },
      {
        label: "Date of Birth",
        key: "dateOfBirth",
      },
      {
        label: "Gender",
        key: "gender",
      },
      {
        label: "Marital Status",
        key: "maritalStatus",
      },
    ],
  },
];
