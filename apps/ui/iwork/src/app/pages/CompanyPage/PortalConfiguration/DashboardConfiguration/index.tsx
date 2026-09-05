import React from 'react';
import { DashboardContainer } from './styles';
import {
    DashboardConfigurationContent,
    DashboardConfigState,
} from '../DashboardConfigurationContent';

interface DashboardConfigurationProps {
    isEditMode: boolean;
    config: DashboardConfigState;
    onChange: (config: DashboardConfigState) => void;
}

export const DashboardConfiguration: React.FC<DashboardConfigurationProps> = ({
    isEditMode: _isEditMode,
    config,
    onChange,
}) => {
    return (
        <DashboardContainer>
            <DashboardConfigurationContent config={config} onChange={onChange} />
        </DashboardContainer>
    );
};
