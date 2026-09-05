import { endPoints } from "@ui/ui-lib/constants";
import { convertToTreeData } from "@ui/ui-lib/utils";
import { FormFieldConfig } from "@ui/ui-lib";
import dayjs from "dayjs";

export const bulkEditConfig = (entityKey: string, defaultValues: any) => {
  switch (entityKey) {
    case "COMPANY":
      return bulkEditCompanyConfig(defaultValues);
    case "SALES_OPPORTUNITY":
      return bulkEditOpportunityConfig(defaultValues);
    case "RENEWAL_OPPORTUNITY":
      return bulkEditOpportunityConfig(defaultValues);
    case "POLICY":
      return bulkEditPolicyConfig(defaultValues);
    default:
      return [];
  }
};
export const hierarchyField: FormFieldConfig = {
  key: "userId",
  name: "userId",
  label: "Owner",
  type: "treeSelect",
  apiDependencies: {
    endPoint: endPoints.totalEmployeeHierarchy,
    utilityFunction: convertToTreeData,
    // clearFieldsOnChange: ["owner"],
  },
  componentProps: {
    fullWidth: true,
  },
} as const;
interface BulkEditSection {
  key: string;
  title: string;
  enableSmartSearch: boolean;
  config: FormFieldConfig[];
  containerStyles: Record<string, string>;
  defaultValues: Record<string, any>;
}

export const bulkEditCompanyConfig = (
  defaultValues: any
): BulkEditSection[] => {
  return [
    {
      key: "owners",
      title: "Owners",
      enableSmartSearch: true,
      config: [
        {
          key: "leadCrm",
          name: "leadCrm",
          label: "Lead CRM",
          type: "treeSelect",
          gridColumn: 9,
          apiDependencies: hierarchyField.apiDependencies,
          componentProps: {
            ...hierarchyField.componentProps,
            controlledSearchInput: false,
          },
        },
        {
          key: "accountManager",
          name: "accountManager",
          type: "treeSelect",
          label: "Account Manager",
          gridColumn: 9,
          // rules: {
          //   required: {
          //     value: true,
          //     message: "Account Manager is required.",
          //   },
          // },
          // apiDependencies: {
          //   endPoint: endPoints.accountManager,
          //   dependentField: "leadCrm",
          //   utilityFunction: accountManagerUtilityFunction,
          // },
          apiDependencies: hierarchyField.apiDependencies,
          componentProps: {
            ...hierarchyField.componentProps,
            controlledSearchInput: false,
          },
        },
      ],

      containerStyles: {
        display: "flex",
        gap: "16px",
        flexDirection: "column",
      },
      defaultValues: {
        // leadCrm:
        //   defaultValues?.ownerId?.value !== undefined &&
        //   defaultValues?.ownerId?.value !== null
        //     ? {
        //         value: String(defaultValues.ownerId.value),
        //         label:
        //           defaultValues.ownerId.label ??
        //           defaultValues.ownerId.name ??
        //           String(defaultValues.ownerId.value),
        //       }
        //     : null,
        // accountManager : null,
      },
    },
    {
      key: "additionalInfo",
      title: "Company details",
      enableSmartSearch: true,
      config: [
        {
          key: "priorityLid",
          name: "priorityLid",
          type: "select",
          label: "Priority",
          gridColumn: 9,
          // rules: {
          //   required: {
          //     value: true,
          //     message: "Priority is required.",
          //   },
          // },
          apiDependencies: {
            // Priority's lookup_order now reads Low..VIMP ascending (fixed to match
            // standard severity-word ordering for table sort); request DESC here so
            // this dropdown keeps showing VIMP first, matching existing user expectation.
            endPoint: endPoints.lookUpByName("PRIORITY", "DESC"),
          },
          placeholder: "Search ",
          componentProps: {
            fullWidth: true,
          },
        },
        // {
        //   key: "statusLid",
        //   name: "statusLid",
        //   label: "Company status",
        //   type: "select",
        //   gridColumn: 9,
        //   apiDependencies: {
        //     endPoint: endPoints.lookUpByName("COMPANY_STATUS"),
        //   },
        //   placeholder: "Search ",
        // },
      ],

      containerStyles: {
        display: "flex",
        gap: "16px",
        flexDirection: "column",
      },
      defaultValues: {
        //   priorityLid: null,
        //   statusLid: null,
      },
    },
  ];
};

export const bulkEditOpportunityConfig = (
  defaultValues: any
): BulkEditSection[] => {
  return [
    {
      key: "owners",
      title: "Owners",
      enableSmartSearch: true,
      config: [
        {
          key: "ownerId",
          name: "ownerId",
          type: "treeSelect",
          label: "BD Owner",
          gridColumn: 9,
          // rules: {
          //   required: {
          //     value: true,
          //     message: "BD Owner is required.",
          //   },
          // },
          // apiDependencies: {
          //   endPoint: endPoints.bulkBDRoleUsers(defaultValues?.orgId),
          //   utilityFunction: accountManagerUtilityFunction,
          //   isSmartSearch: true,
          // },
          apiDependencies: hierarchyField.apiDependencies,
          componentProps: {
            ...hierarchyField.componentProps,
            controlledSearchInput: false,
          },
        },
        {
          key: "isgId",
          name: "isgId",
          type: "treeSelect",
          label: "ISG Owner",
          gridColumn: 9,
          // rules: {
          //   required: {
          //     value: true,
          //     message: "ISG Owner is required.",
          //   },
          // },
          // apiDependencies: {
          //   endPoint: endPoints.bulkISGRoleUsers(defaultValues?.orgId),
          //   utilityFunction: accountManagerUtilityFunction,
          //   isSmartSearch: true,
          // },
          apiDependencies: hierarchyField.apiDependencies,
          componentProps: {
            ...hierarchyField.componentProps,
            controlledSearchInput: false,
          },
        },
      ],

      containerStyles: {
        display: "flex",
        gap: "16px",
        flexDirection: "column",
      },
      defaultValues: {
        // ownerId: null,
        // isgId: null,
      },
    },
    {
      key: "additionalInfo",
      title: "Additional Info",
      enableSmartSearch: true,
      config: [
        // {
        //   key: "statusLid",
        //   name: "statusLid",
        //   label: "Status",
        //   type: "select",
        //   gridColumn: 9,
        //   // options: opportunityStatusOptions,
        //   apiDependencies: {
        //     endPoint: endPoints.lookUpByName("OPPORTUNITY_STATUS"),
        //   },
        //   componentProps: {
        //     fullWidth: true,
        //     placeholder: "Select stage",
        //   },
        //   placeholder: "Search",
        // },
        {
          key: "expiryDate",
          name: "expiryDate",
          label: "Expiry date",
          type: "date",
          gridColumn: 9,
          componentProps: {
            fullWidth: true,
            placeholder: "Select expiry date",

            // minDate: dayjs(),
            minDate: dayjs(),
          },
        },
      ],

      containerStyles: {
        display: "flex",
        gap: "16px",
        flexDirection: "column",
      },
      defaultValues: {
        // statusLid: null,
        // expiryDate: null,
      },
    },
  ];
};

export const bulkEditPolicyConfig = (defaultValues: any): BulkEditSection[] => {
  return [
    {
      key: "owners",
      title: "Owners",
      enableSmartSearch: true,
      config: [
        {
          key: "ownerId",
          name: "ownerId",
          label: "BD Owner",
          type: "treeSelect",
          gridColumn: 9,

          // rules: {
          //   required: {
          //     value: true,
          //     message: "Lead CRM is required.",
          //   },
          // },
          apiDependencies: hierarchyField.apiDependencies,
          componentProps: {
            ...hierarchyField.componentProps,
            controlledSearchInput: false,
          },
        },
        {
          key: "isgId",
          name: "isgId",
          type: "treeSelect",
          label: "ISG Owner",
          gridColumn: 9,
          // rules: {
          //   required: {
          //     value: true,
          //     message: "ISG Owner is required.",
          //   },
          // },
          // apiDependencies: {
          //   endPoint: endPoints.bulkISGRoleUsers(defaultValues?.orgId),
          //   utilityFunction: accountManagerUtilityFunction,
          // },
          apiDependencies: hierarchyField.apiDependencies,
          componentProps: {
            ...hierarchyField.componentProps,
            controlledSearchInput: false,
          },
        },
        {
          key: "amId",
          name: "amId",
          type: "treeSelect",
          label: "Account Manager",
          gridColumn: 9,
          // rules: {
          //   required: {
          //     value: true,
          //     message: "Account Manager is required.",
          //   },
          // },
          // apiDependencies: {
          //   endPoint: endPoints.accountManager,
          //   dependentField: "ownerId",
          //   utilityFunction: accountManagerUtilityFunction,
          // },
          apiDependencies: hierarchyField.apiDependencies,
          componentProps: {
            ...hierarchyField.componentProps,
            controlledSearchInput: false,
          },
        },
      ],

      containerStyles: {
        display: "flex",
        gap: "16px",
        flexDirection: "column",
      },
      defaultValues: {
        // ownerId:
        //   defaultValues?.ownerId?.value !== undefined &&
        //   defaultValues?.ownerId?.value !== null
        //     ? {
        //         value: String(defaultValues.ownerId.value),
        //         label:
        //           defaultValues.ownerId.label ??
        //           defaultValues.ownerId.name ??
        //           String(defaultValues.ownerId.value),
        //       }
        //     : null,
        // isgId: null,
        // amId: null,
      },
    },
    // {
    //   key: "additionalInfo",
    //   title: "Additional Info",
    //   enableSmartSearch: true,
    //   config: [
    //     {
    //       key: "policyStatusLid",
    //       name: "policyStatusLid",
    //       label: "Status",
    //       type: "select",
    //       gridColumn: 9,
    //       // rules: {
    //       //   required: {
    //       //     value: true,
    //       //     message: "Status is required.",
    //       //   },
    //       // },
    //       apiDependencies: {
    //         endPoint: endPoints.lookUpByName("COMPANY_STATUS"),
    //       },
    //       placeholder: "Search ",
    //     },
    //   ],

    //   containerStyles: {
    //     display: "flex",
    //     gap: "16px",
    //     flexDirection: "column",
    //   },
    //   defaultValues: {
    //     // policyStatusLid: null,
    //   },
    // },
  ];
};
