import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    Button,
    CircularProgress,
    Alert,
    Typography,
    IconButton
} from '@mui/material';
import { ArrowBack as BackIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useApiQuery, endPoints } from '@ui/ui-lib';
import { TemplateLayout } from '../TemplateLayout';
import {
    StyledContainer,
    HeaderSection,
    StyledTableContainer,
    StyledTableCellHead,
    StatusChip,
    ActionText,
    StyledTable,
    CommentsTableCell,
    CommentText,
    HeaderActionsBox,
    LoadingBox,
    StatusChangeBox
} from './styles';
import { HistoryRecord } from './types';
// Content-edit history (who changed the subject/body, when, old → new) is
// tracked in a completely separate table (notification_template_change_log)
// from approval-workflow status transitions (notification_template_approval_history,
// fetched above) — see docs/IBP-Email-Notification-Company-Templates. This
// page only ever rendered the latter, so any plain content edit that never
// went through Submit/Approve looked like "no history" here even though it
// was recorded — just on a different endpoint this page never called.
import { TemplateChangeLogEntry } from '../TemplateCustomisation/types';

const formatDateTime = (value?: string | Date): string => {
    if (!value) return '--';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '--';
    const datePart = new Intl.DateTimeFormat('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(d);
    return `${datePart}, ${d.toLocaleTimeString()}`;
};

const TemplateHistory: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const templateId = searchParams.get('id');

    const {
        data: apiResponse,
        isLoading,
        error,
        refetch
    } = useApiQuery({
        queryKey: ['template-workflow-history', templateId],
        url: templateId ? endPoints.templateWorkflowHistory(templateId) : '',
        enabled: !!templateId,
    });

    const historyData: HistoryRecord[] = apiResponse?.data || [];

    const {
        data: changeLogResponse,
        isLoading: isChangeLogLoading,
        error: changeLogError,
        refetch: refetchChangeLog,
    } = useApiQuery({
        queryKey: ['template-change-log', templateId],
        url: templateId ? endPoints.templateChangeLog(templateId) : '',
        enabled: !!templateId,
    });

    const changeLogData: TemplateChangeLogEntry[] = (changeLogResponse as any)?.data || [];

    const handleBack = () => {
        navigate(-1);
    };

    const handleRefresh = () => {
        refetch();
        refetchChangeLog();
    };

    return (
        <TemplateLayout title="Workflow History">
            <StyledContainer>
                <HeaderSection>
                    <HeaderActionsBox>
                        <Button
                            startIcon={<BackIcon />}
                            onClick={handleBack}
                            variant="outlined"
                            size="small"
                        >
                            Back
                        </Button>
                        {/* <Box>
                            <Typography variant="h5" fontWeight={600}>
                                Workflow History
                            </Typography>
                            <Typography variant="caption">
                                Template ID: {templateId}
                            </Typography>
                        </Box> */}
                    </HeaderActionsBox>
                    <IconButton size="small" onClick={handleRefresh}>
                        <RefreshIcon />
                    </IconButton>
                </HeaderSection>

                {isLoading || isChangeLogLoading ? (
                    <LoadingBox>
                        <CircularProgress />
                    </LoadingBox>
                ) : error && changeLogError ? (
                    <Alert severity="error">
                        Failed to load history data. Please try again later.
                    </Alert>
                ) : historyData.length === 0 && changeLogData.length === 0 ? (
                    <Alert severity="info">
                        No history records found for this template.
                    </Alert>
                ) : (
                    <>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                            Approval Workflow
                        </Typography>
                        {error ? (
                            <Alert severity="error" sx={{ mb: 3 }}>
                                Failed to load workflow history. Please try again later.
                            </Alert>
                        ) : historyData.length === 0 ? (
                            <Alert severity="info" sx={{ mb: 3 }}>
                                No approval-workflow actions recorded for this template yet.
                            </Alert>
                        ) : (
                            <StyledTableContainer sx={{ mb: 3 }}>
                                <StyledTable>
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCellHead>Date & Time</StyledTableCellHead>
                                            <StyledTableCellHead>Performed By</StyledTableCellHead>
                                            <StyledTableCellHead>Action</StyledTableCellHead>
                                            <StyledTableCellHead>Status Change</StyledTableCellHead>
                                            <StyledTableCellHead>Comments</StyledTableCellHead>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {historyData.map((record) => (
                                            <TableRow key={record.id} hover>
                                                <TableCell>{formatDateTime(record.performedAt)}</TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" fontWeight={500}>
                                                        {record.performedByName || `User ${record.performedBy}`}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <ActionText color="primary">
                                                        {record.action}
                                                    </ActionText>
                                                </TableCell>
                                                <TableCell>
                                                    <StatusChangeBox>
                                                        <StatusChip
                                                            label={record.fromStatus || 'N/A'}
                                                            status={record.fromStatus}
                                                            size="small"
                                                        />
                                                        <Typography variant="body2">
                                                            →
                                                        </Typography>
                                                        <StatusChip
                                                            label={record.toStatus}
                                                            status={record.toStatus}
                                                            size="small"
                                                        />
                                                    </StatusChangeBox>
                                                </TableCell>
                                                <CommentsTableCell>
                                                    <CommentText variant="body2">
                                                        {record.comment || '-'}
                                                    </CommentText>
                                                </CommentsTableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </StyledTable>
                            </StyledTableContainer>
                        )}

                        {/* Content edits (subject/body changes) — tracked separately from
                            approval-workflow status transitions above, see
                            notification_template_change_log. A plain edit that never went
                            through Submit/Approve only ever shows up here, not in the table
                            above. */}
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                            Content Changes
                        </Typography>
                        {changeLogError ? (
                            <Alert severity="error">
                                Failed to load content change history. Please try again later.
                            </Alert>
                        ) : changeLogData.length === 0 ? (
                            <Alert severity="info">
                                No content edits recorded for this template yet.
                            </Alert>
                        ) : (
                            <StyledTableContainer>
                                <StyledTable>
                                    <TableHead>
                                        <TableRow>
                                            <StyledTableCellHead>Date & Time</StyledTableCellHead>
                                            <StyledTableCellHead>Changed By</StyledTableCellHead>
                                            <StyledTableCellHead>Action</StyledTableCellHead>
                                            <StyledTableCellHead>What Changed</StyledTableCellHead>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {changeLogData.map((entry, idx) => {
                                            const subjectChanged = entry.oldSubject !== entry.newSubject;
                                            const bodyChanged = entry.oldBody !== entry.newBody;
                                            return (
                                                <TableRow key={idx} hover>
                                                    <TableCell>{formatDateTime(entry.changedAt)}</TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={500}>
                                                            {entry.changedByName || `User ${entry.changedBy}`}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <ActionText color="primary">
                                                            {entry.action.replace(/_/g, ' ')}
                                                        </ActionText>
                                                    </TableCell>
                                                    <CommentsTableCell>
                                                        {subjectChanged && (
                                                            <CommentText variant="body2">
                                                                Subject: <s>{entry.oldSubject || '(none)'}</s> →{' '}
                                                                {entry.newSubject || '(none)'}
                                                            </CommentText>
                                                        )}
                                                        {bodyChanged && (
                                                            <CommentText variant="body2">
                                                                Body content was updated.
                                                            </CommentText>
                                                        )}
                                                        {!subjectChanged && !bodyChanged && (
                                                            <CommentText variant="body2">-</CommentText>
                                                        )}
                                                    </CommentsTableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </StyledTable>
                            </StyledTableContainer>
                        )}
                    </>
                )}
            </StyledContainer>
        </TemplateLayout>
    );
};

export default TemplateHistory;
