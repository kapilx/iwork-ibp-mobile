import React from 'react';
import { Approval } from './../type';
import { NormalActivityContainer, NormalHeader, NormalInfo, NormalTaskMeta, EllipsisTaskName, NormalChip, CompanyActivityRow } from './styles';
import { Box } from '@mui/material';
import { ChipRenderer } from "@ui/ui-lib";
import { CalendarBadge } from '../../../assets/svgs/calendar-badge';

interface ApprovalCardProps {
  approval: Approval & { meetingDate?: string };
}

const ApprovalCard: React.FC<ApprovalCardProps> = ({ approval }) => {
  const dueDate = approval.meetingDate;
  const dateObj = dueDate ? new Date(dueDate) : null;
  const month = dateObj ? dateObj.toLocaleString('en-US', { month: 'short' }) : '';
  const date = dateObj ? dateObj.getDate() : 0;
  const time = dateObj ? dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true }) : '';
  return (
    <NormalActivityContainer>
        <NormalInfo>
      <NormalHeader>
        <EllipsisTaskName title={approval.approvalName}>
          {approval.approvalName}
        </EllipsisTaskName>
        <NormalChip priority={approval.status}>
            <ChipRenderer
              value={approval.status}
              variant="withDot"
              styleMap={{ default: { color: '#F8A500', dotColor: '#F8A500' } }}
              size="small"
              ChipStyles={{ width: 'auto', minWidth: 0 }}
            />
          </NormalChip>
      </NormalHeader>
       <CompanyActivityRow>
            {approval.company && (
          <NormalTaskMeta as="span">
            {approval.company.displayName || approval.company.name}
          </NormalTaskMeta>
        )}
        {approval.activity && (
          <NormalTaskMeta as="span">
            {approval.activity.activityName}
          </NormalTaskMeta>
        )}
          </CompanyActivityRow>
         
        </NormalInfo>
    </NormalActivityContainer>
  );
};

export default ApprovalCard;
