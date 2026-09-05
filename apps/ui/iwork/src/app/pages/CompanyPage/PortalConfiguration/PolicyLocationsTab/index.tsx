import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { AddLocation as AddLocationIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Button, BUTTON_VARIANTS, CommonCheckbox } from '@ui/ui-lib';
import editIcon from '../../../../assets/svgs/edit-icon.svg';
import { POLICY_LOCATIONS_CONSTANTS } from './constants';
import {
    TabContainer,
    HeaderSection,
    LocationRow,
    LocationLabel,
    AddressLine,
    AddressDetail,
    ActionsBox,
    EditActionIcon,
    FooterActions,
    EmptyStateText,
    HeaderDescription,
    HeaderTitle,
    StyledFormControlLabel,
} from './styles';

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

interface PolicyLocationsTabProps {
    policyConfigurationLocations: PolicyLocation[];
    selectedLocationIds: { id: number; address_1: string }[];
    isEditMode: boolean;
    companyId: string | number;
    returnTo?: string;
    onSelectionChange: (locations: { id: number; address_1: string }[]) => void;
}

const buildAddressDetail = (address: PolicyLocation['address']): string => {
    const parts: string[] = [];
    if (address.area) parts.push(address.area);
    if (address.cityId?.name) parts.push(address.cityId.name);
    if (address.stateId?.name) parts.push(address.stateId.name);
    if (address.pinCode) parts.push(address.pinCode);
    return parts.join(', ');
};

export const PolicyLocationsTab: React.FC<PolicyLocationsTabProps> = ({
    policyConfigurationLocations,
    selectedLocationIds,
    isEditMode,
    companyId,
    returnTo,
    onSelectionChange,
}) => {
    const navigate = useNavigate();

    const handleCheckboxChange = (location: PolicyLocation, checked: boolean) => {
        const next = checked
            ? [...selectedLocationIds, { id: location.id, address_1: location.address?.address1 ?? '' }]
            : selectedLocationIds.filter((l) => l.id !== location.id);
        onSelectionChange(next);
    };

    const handleEditAddress = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/companies/${companyId}/edit`, {
            state: { openAtStep: 4, returnTo },
        });
    };

    const handleAddNewAddress = () => {
        navigate(`/companies/${companyId}/edit`, {
            state: { openAtStep: 4, returnTo },
        });
    };

    return (
        <TabContainer>
            <HeaderSection>
                <HeaderTitle>{POLICY_LOCATIONS_CONSTANTS.HEADER.TITLE}</HeaderTitle>
                <HeaderDescription>{POLICY_LOCATIONS_CONSTANTS.HEADER.DESCRIPTION}</HeaderDescription>
            </HeaderSection>

            {policyConfigurationLocations.length === 0 ? (
                <EmptyStateText>{POLICY_LOCATIONS_CONSTANTS.EMPTY_STATE.MESSAGE}</EmptyStateText>
            ) : (
                policyConfigurationLocations.map((location) => {
                    const isChecked = selectedLocationIds.some((l) => l.id === location.id);
                    const address1 = location.address?.address1 || POLICY_LOCATIONS_CONSTANTS.FALLBACK.NO_ADDRESS_LINE;
                    const detail = buildAddressDetail(location.address);

                    return (
                        <LocationRow key={location.id}>
                            <StyledFormControlLabel
                                control={
                                    <CommonCheckbox
                                        checked={isChecked}
                                        disabled={!isEditMode}
                                        onChange={(e) =>
                                            handleCheckboxChange(location, e.target.checked)
                                        }
                                        size="small"
                                    />
                                }
                                label={
                                    <LocationLabel>
                                        <AddressLine>{address1}</AddressLine>
                                        {detail && <AddressDetail>{detail}</AddressDetail>}
                                    </LocationLabel>
                                }
                            />
                            <ActionsBox>
                                {isEditMode && (
                                    <Tooltip title={POLICY_LOCATIONS_CONSTANTS.TOOLTIPS.EDIT_ADDRESS}>
                                        <IconButton size="small" onClick={handleEditAddress}>
                                            <EditActionIcon src={editIcon} alt="Edit" />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </ActionsBox>
                        </LocationRow>
                    );
                })
            )}

            <FooterActions>
                <Button
                    variantType={BUTTON_VARIANTS.SECONDARY}
                    startIcon={<AddLocationIcon />}
                    onClick={handleAddNewAddress}
                >
                    {POLICY_LOCATIONS_CONSTANTS.BUTTONS.ADD_NEW_ADDRESS}
                </Button>
            </FooterActions>
        </TabContainer>
    );
};
