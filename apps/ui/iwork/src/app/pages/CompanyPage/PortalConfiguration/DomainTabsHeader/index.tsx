import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

export interface DomainTab {
  configId: number;
  subDomain: string | null;
  fullUrl: string | null;
  status: { key: string; value: string } | null;
  scopeCount: number;
}

interface DomainTabsHeaderProps {
  tabs: DomainTab[];
  activeConfigId: number | null;
  onTabChange: (configId: number) => void;
  onAddDomain: () => void;
  unscopedPolicyCount: number;
  isEditMode: boolean;
  isCreating?: boolean;
  isPendingNewDomain?: boolean;
}

const STATUS_CHIP_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  active:       { backgroundColor: '#ECFDF5', color: '#059669' },
  draft:        { backgroundColor: '#F3F4F6', color: '#6B7280' },
  pending:      { backgroundColor: '#FEF3C7', color: '#D97706' },
  'under review':{ backgroundColor: '#EFF6FF', color: '#2563EB' },
  rejected:     { backgroundColor: '#FEF2F2', color: '#DC2626' },
};

export const DomainTabsHeader: React.FC<DomainTabsHeaderProps> = ({
  tabs,
  activeConfigId,
  onTabChange,
  onAddDomain,
  unscopedPolicyCount,
  isEditMode,
  isCreating = false,
  isPendingNewDomain = false,
}) => {
  const getTabLabel = (tab: DomainTab, index: number) => {
    if (tab.subDomain) return tab.subDomain;
    return `Domain ${index + 1}`;
  };

  return (
    <Box sx={{ mb: 3 }}>
      {/* Tab strip */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          borderBottom: '1px solid #E5E7EB',
          pb: 0,
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.configId === activeConfigId;
          const statusKey = (tab.status?.key ?? '').toLowerCase().replace(/_/g, ' ');
          return (
            <Box
              key={tab.configId}
              onClick={() => onTabChange(tab.configId)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1.25,
                cursor: 'pointer',
                borderBottom: isActive ? '2px solid #4F46E5' : '2px solid transparent',
                mb: '-1px',
                borderRadius: '4px 4px 0 0',
                backgroundColor: isActive ? '#F5F3FF' : 'transparent',
                transition: 'background-color 0.15s',
                '&:hover': {
                  backgroundColor: isActive ? '#F5F3FF' : '#F9FAFB',
                },
              }}
            >
              <Typography
                sx={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#4F46E5' : '#374151',
                  whiteSpace: 'nowrap',
                }}
              >
                {getTabLabel(tab, index)}
              </Typography>
              {tab.status && (
                <Box
                  sx={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    px: 0.75,
                    py: 0.25,
                    borderRadius: '3px',
                    ...(STATUS_CHIP_STYLES[statusKey] ?? STATUS_CHIP_STYLES.draft),
                  }}
                >
                  {tab.status.value}
                </Box>
              )}
            </Box>
          );
        })}

        {/* Pending new domain tab — shown while user is filling in a new domain before first save */}
        {isPendingNewDomain && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1.25,
              borderBottom: '2px solid #4F46E5',
              mb: '-1px',
              borderRadius: '4px 4px 0 0',
              backgroundColor: '#F5F3FF',
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#4F46E5', whiteSpace: 'nowrap' }}>
              New Domain
            </Typography>
            <Box sx={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', px: 0.75, py: 0.25, borderRadius: '3px', backgroundColor: '#FEF3C7', color: '#D97706' }}>
              Unsaved
            </Box>
          </Box>
        )}

        {/* Add Domain button — always visible */}
        <Tooltip title="Create a new portal for this company with a different domain and policy scope">
          <Box
            onClick={isCreating ? undefined : onAddDomain}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 1.5,
              py: 1.25,
              cursor: isCreating ? 'default' : 'pointer',
              mb: '-1px',
              borderBottom: '2px solid transparent',
              borderRadius: '4px 4px 0 0',
              color: '#6B7280',
              fontSize: 13,
              '&:hover': { backgroundColor: isCreating ? 'transparent' : '#F9FAFB', color: isCreating ? '#6B7280' : '#374151' },
              opacity: isCreating ? 0.5 : 1,
            }}
          >
            <AddIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 13, fontWeight: 500 }}>
              {isCreating ? 'Adding...' : 'Add Domain'}
            </Typography>
          </Box>
        </Tooltip>
      </Box>

      {/* Unscoped policies banner */}
      {unscopedPolicyCount > 0 && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mt: 1.5,
            px: 2,
            py: 1,
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '6px',
          }}
        >
          <WarningAmberIcon sx={{ fontSize: 16, color: '#D97706', flexShrink: 0 }} />
          <Typography sx={{ fontSize: 12.5, color: '#92400E' }}>
            <strong>{unscopedPolicyCount} {unscopedPolicyCount === 1 ? 'policy' : 'policies'}</strong> not yet assigned to any domain.
            {isEditMode && (
              <Box
                component="span"
                onClick={onAddDomain}
                sx={{ ml: 0.5, color: '#D97706', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
              >
                Add a domain to cover {unscopedPolicyCount === 1 ? 'it' : 'them'}.
              </Box>
            )}
          </Typography>
        </Box>
      )}
    </Box>
  );
};
