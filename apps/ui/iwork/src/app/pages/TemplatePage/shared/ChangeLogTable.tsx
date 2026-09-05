import React from 'react';
import {
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { styled } from '@mui/material/styles';

/**
 * Shared rendering for notification_template_change_log entries — used both
 * by the default template's dedicated Workflow History page
 * (TemplateHistory/index.tsx) and the company/domain override editor's
 * inline History toggle (TemplateOverrideEditor.tsx). Those two used to
 * render this same data as two visually unrelated UIs (a formatted table on
 * one, a plain list of boxes on the other) — this is the one place that
 * layout lives now, so both stay in sync automatically.
 */
export interface ChangeLogEntryLike {
  action: string;
  oldSubject?: string | null;
  newSubject?: string | null;
  oldBody?: string | null;
  newBody?: string | null;
  changedBy: number;
  changedByName?: string;
  changedAt: string | Date;
}

const StyledTableContainer = styled(TableContainer)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  overflow: 'hidden',
}));

const StyledTableCellHead = styled(TableCell)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
  fontWeight: 600,
  color: theme.palette.primary.light,
}));

const WhatChangedCell = styled(TableCell)({
  maxWidth: 500,
});

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

export const ChangeLogTable: React.FC<{
  entries: ChangeLogEntryLike[];
  emptyMessage?: string;
}> = ({ entries, emptyMessage }) => {
  if (entries.length === 0) {
    return (
      <Alert severity="info">
        {emptyMessage || 'No content edits recorded yet.'}
      </Alert>
    );
  }

  return (
    <StyledTableContainer>
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow>
            <StyledTableCellHead>Date & Time</StyledTableCellHead>
            <StyledTableCellHead>Changed By</StyledTableCellHead>
            <StyledTableCellHead>Action</StyledTableCellHead>
            <StyledTableCellHead>What Changed</StyledTableCellHead>
          </TableRow>
        </TableHead>
        <TableBody>
          {entries.map((entry, idx) => {
            // Body is never shown verbatim here — it's raw HTML, unreadable
            // dumped into a table cell — just whether it changed. Subject
            // gets the actual old → new text since it's short and plain.
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
                  <Typography
                    variant="caption"
                    fontWeight={600}
                    color="primary"
                    sx={{ textTransform: 'uppercase' }}
                  >
                    {entry.action.replace(/_/g, ' ')}
                  </Typography>
                </TableCell>
                <WhatChangedCell>
                  {subjectChanged && (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      Subject: <s>{entry.oldSubject || '(none)'}</s> → {entry.newSubject || '(none)'}
                    </Typography>
                  )}
                  {bodyChanged && (
                    <Typography variant="body2">Body content was updated.</Typography>
                  )}
                  {!subjectChanged && !bodyChanged && (
                    <Typography variant="body2">-</Typography>
                  )}
                </WhatChangedCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </StyledTableContainer>
  );
};
