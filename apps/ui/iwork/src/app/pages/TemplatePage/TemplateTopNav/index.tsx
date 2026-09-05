import React from 'react';
import { NavContainer, NavItem } from './styles';
import { useSelector } from 'react-redux';
import { TEMPLATE_MANAGEMENT_BASE_PATH } from '../../../routes/template-management.route';
import { FeatureKey, selectHasPermission } from '@ui/ui-lib';

const TemplateTopNav: React.FC = () => {
    const hasApprovePermission = useSelector((state: any) =>
        selectHasPermission(FeatureKey.APPROVE_TEMPLATE_MANAGEMENT)(state)
    );
    const hasRejectPermission = useSelector((state: any) =>
        selectHasPermission(FeatureKey.REJECT_TEMPLATE_MANAGEMENT)(state)
    );

    const canAccessPendingApprovals = hasApprovePermission || hasRejectPermission;

    return (
        <NavContainer>
            <NavItem to={`/${TEMPLATE_MANAGEMENT_BASE_PATH}`} end>
                Home
            </NavItem>

            {canAccessPendingApprovals && (
                <NavItem to={`/${TEMPLATE_MANAGEMENT_BASE_PATH}/pending-approvals`}>
                    Pending Approvals
                </NavItem>
            )}
        </NavContainer>
    );
};

export default TemplateTopNav;
