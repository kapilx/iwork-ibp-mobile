import { endPoints, FormFieldConfig, requiredErrorMessage } from "@ui/ui-lib";

/**
 * Utility function to transform company API response
 */
export const companyUtilityFunction = (data: any) => {
    return data?.data?.data?.map((company: any) => ({
        value: company?.companyId,
        label: company?.displayName,
    }));
};

/**
 * Utility function to transform policy list API response
 */
export const policyListUtilityFunction = (data: any) => {
    return data?.data?.data?.map((policy: any) => ({
        value: policy.policyId,
        label: `${policy.policyNumber || policy.policyName || 'Policy'} (ID: ${policy.policyId})`,
    }));
};

/**
 * Utility function to transform policy types API response
 */
export const policyTypesUtilityFunction = (data: any) => {
    return data?.data?.data?.map((policyType: any) => ({
        value: policyType.policyTypeLid,
        label: policyType.policyTypeValue || policyType.policyTypeKey,
    })) || [];
};

/**
 * Utility function to transform API response for live configurations
 * into options for the select field
 */
export const liveConfigurationUtilityFunction = (data: any) => {
    return data?.data?.map((option: any) => ({
        value: option.id,
        label: `${option.policyName} (Policy ID: ${option.policyId}, v${option.version})`,
    })) || [];
};

/**
 * Configuration for the Export Policy modal form
 * Now includes Company and Policy Type selection
 */
export const exportPolicyFormConfig = (watch?: any): FormFieldConfig[] => [
    {
        key: "companyId",
        name: "companyId",
        label: "Company",
        type: "selectFieldByApi" as const,
        gridColumn: 12,
        componentProps: {
            fullWidth: true,
            disablePortal: true,
        },
        apiDependencies: {
            endPoint: endPoints.companiesWithPortalConfiguration,
            utilityFunction: companyUtilityFunction,
            clearFieldsOnChange: ["policyTypeLid", "selectedExportConfigurationId"],
            customParams: { viewBy: "team" },
        },
        rules: {
            required: {
                value: true,
                message: requiredErrorMessage("Company"),
            },
        },
    },
    {
        key: "policyTypeLid",
        name: "policyTypeLid",
        label: "Policy Type",
        type: "selectFieldByApi" as const,
        gridColumn: 12,
        componentProps: {
            fullWidth: true,
            disablePortal: true,
        },
        apiDependencies: {
            endPoint: endPoints.policyTypesByCompany,
            dependentField: "companyId",
            utilityFunction: policyTypesUtilityFunction,
            clearFieldsOnChange: ["selectedExportConfigurationId"],
        },
        rules: {
            required: {
                value: true,
                message: requiredErrorMessage("Policy Type"),
            },
        },
    },
    {
        key: "selectedExportConfigurationId",
        name: "selectedExportConfigurationId",
        label: "Live Configurations",
        type: "selectFieldByApi",
        gridColumn: 12,
        componentProps: {
            fullWidth: true,
            disablePortal: true,
        },
        apiDependencies: {
            endPoint: (policyTypeLid: number) => {
                const companyId = watch?.('companyId');
                return companyId && policyTypeLid 
                    ? endPoints.policyConfigurationExportLiveOptions(companyId, policyTypeLid)
                    : '';
            },
            dependentField: "policyTypeLid",
            showCondition: (w: any) => !!w('companyId') && !!w('policyTypeLid'),
            utilityFunction: liveConfigurationUtilityFunction,
        },
        rules: {
            required: {
                value: true,
                message: "Please select a LIVE configuration to import.",
            },
        },
    },
];

/**
 * Default values for the export policy form
 */
export const exportPolicyDefaultValues = {
    companyId: null,
    policyTypeLid: null,
    selectedExportConfigurationId: null,
};
