import React from 'react';
import { WellnessContainer } from './styles';
import {
    WellnessConfigurationContent,
    WellnessConfigState,
} from '../WellnessConfigurationContent';

interface WellnessConfigurationProps {
    isEditMode: boolean;
    companyId?: string | number;
    config: WellnessConfigState;
    onChange: (config: WellnessConfigState) => void;
}

export const WellnessConfiguration: React.FC<WellnessConfigurationProps> = ({
    isEditMode,
    companyId,
    config,
    onChange,
}) => {
    return (
        <WellnessContainer>
            <WellnessConfigurationContent
                config={config}
                companyId={companyId}
                disabled={!isEditMode}
                onChange={onChange}
            />
        </WellnessContainer>
    );
};
