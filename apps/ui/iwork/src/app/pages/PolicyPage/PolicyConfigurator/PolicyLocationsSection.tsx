import React from 'react';
import { FormControlLabel } from '@mui/material';
import { CommonCheckbox } from '@ui/ui-lib';
// import { PolicyLocationsTab } from '../../CompanyPage/PortalConfiguration/PolicyLocationsTab';

interface PolicyLocation {
    id: number;
    addressId: number;
    isPrimary: boolean;
    address: {
        id: number;
        address1: string | null;
        address2?: string | null;
        area?: string | null;
        pinCode?: string | null;
        cityId?: { name: string; id: number } | null;
        stateId?: { name: string; id: number } | null;
        countryId?: { name: string; id: number } | null;
    };
}

interface PolicyLocationsSectionProps {
    companyId: number;
    policyConfigurationLocations: PolicyLocation[];
    selectedLocationIds: { id: number; address_1: string }[];
    isEditable: boolean;
    returnTo?: string;
    onSelectionChange: (locations: { id: number; address_1: string }[]) => void;
    enablePolicyLocations: boolean;
    onEnablePolicyLocationsChange: (enabled: boolean) => void;
}

export const PolicyLocationsSection: React.FC<PolicyLocationsSectionProps> = ({
    // companyId,
    // policyConfigurationLocations,
    // selectedLocationIds,
    isEditable,
    // returnTo,
    // onSelectionChange,
    enablePolicyLocations,
    onEnablePolicyLocationsChange,
}) => {
    return (
        <>
            <FormControlLabel
                control={
                    <CommonCheckbox
                        checked={enablePolicyLocations}
                        onChange={(e) => onEnablePolicyLocationsChange(e.target.checked)}
                        disabled={!isEditable}
                    />
                }
                label="Enable Policy Locations"
                sx={{ mb: 1, ml : 3 }}
            />
            {/* PolicyLocationsTab is parked for future use — do not delete
            <PolicyLocationsTab
                policyConfigurationLocations={policyConfigurationLocations}
                selectedLocationIds={selectedLocationIds}
                isEditMode={isEditable}
                companyId={companyId}
                returnTo={returnTo}
                onSelectionChange={onSelectionChange}
            />
            */}
        </>
    );
};

export default PolicyLocationsSection;
