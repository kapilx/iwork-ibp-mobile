import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, CircularProgress, Tooltip, Typography } from '@mui/material';
import {
  AlertTriangle,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Clock,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Search,
  Shield,
  TrendingUp,
  MapPin,
  Briefcase,
  X,
} from 'lucide-react';
import { endPoints, useLocalization } from '@ui/ui-lib';
import { apiRequest } from '@ui/ui-lib/utils/apiRequest';
import { useHRReport } from '../../hooks/useHRReport';
import { getCompanyId, getCompanyName } from '../../utils/companyConfig';
import { formatINR } from '../../utils/hrAnalytics';

// ─── API row types ────────────────────────────────────────────────────────────

type KpiRow = {
  totalCompanies: number;
  totalPolicies: number;
  activePolicies: number;
  inactivePolicies: number;
  totalLives: number;
  totalPremium: number;
};

type PolicyApiRow = {
  policyId: number;
  companyId: number;
  policyTypeCode: string;
  policyTypeName: string;
  insurerName: string | null;
  tpaName: string | null;
  policyNumber: string | null;
  premiumAmount: number | string | null;
  startDate: string | null;
  endDate: string | null;
  policyStatus: 'Active' | 'Renewal Due' | 'Expired';
};

// ─── Display types ────────────────────────────────────────────────────────────

type PolicyItem = {
  policyId: number;
  type: string;
  typeName: string;
  policyNo: string | null;
  insurer: string;
  tpaName: string;
  premium: string;
  premiumRaw: number;
  status: 'Active' | 'Renewal Due' | 'Expired';
  startDate: string;
  endDate: string;
};

type CompanyItem = {
  companyId: number;
  name: string;
  industry: string;
  location: string;
  employees: number;
  rmName: string;
  policyCount: number;
  activePolicyCount: number;
  inactivePolicyCount: number;
  lhPolicyCount: number;
  tpaId: string;
  isGroupParent?: boolean;
};

type PortfolioData = {
  isGroup: boolean;
  parentCompany: { id: number; name: string } | null;
  companies: CompanyItem[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_COLOR_PALETTE: { bg: string; color: string; border: string }[] = [
  { bg: '#EBF3FF', color: '#1C57B8', border: '#BFDBFE' },
  { bg: '#F3F0FF', color: '#7C3AED', border: '#DDD6FE' },
  { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
  { bg: '#FFF7ED', color: '#D97706', border: '#FED7AA' },
  { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
  { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA' },
  { bg: '#ECFEFF', color: '#0E7490', border: '#A5F3FC' },
  { bg: '#FDF4FF', color: '#9333EA', border: '#E9D5FF' },
  { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0' },
  { bg: '#FFF1F2', color: '#BE185D', border: '#FBCFE8' },
  { bg: '#FFFBEB', color: '#B45309', border: '#FDE68A' },
  { bg: '#EFF6FF', color: '#1D4ED8', border: '#C7D2FE' },
];

const TYPE_COLOR_CACHE = new Map<string, { bg: string; color: string; border: string }>();

function getPolicyTypeColor(type: string) {
  if (!type || type === '—') return { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' };
  if (TYPE_COLOR_CACHE.has(type)) return TYPE_COLOR_CACHE.get(type)!;
  const hash = type.toLowerCase().split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const color = TYPE_COLOR_PALETTE[hash % TYPE_COLOR_PALETTE.length];
  TYPE_COLOR_CACHE.set(type, color);
  return color;
}

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  Active: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  'Renewal Due': { bg: '#FFF7ED', color: '#C2410C', border: '#FED7AA' },
  Expired: { bg: '#FEF2F2', color: '#B91C1C', border: '#FECACA' },
};

const GROUP_COLORS = [
  '#1B4E9B', '#007CC3', '#2D8653', '#C0392B', '#FF6B00', '#0066B3',
  '#7B3F00', '#1A5276', '#6C3483', '#148F77', '#B7950B', '#922B21',
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function parsePolicyTypeCode(raw: string | null | undefined): string {
  if (!raw) return '—';
  const match = raw.match(/^POLICY_TYPE[_|](.+)/i);
  if (match) return match[1].split('_')[0];
  return raw;
}

function groupLogoColor(groupId: number | string): string {
  const idx = Math.abs(String(groupId).split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % GROUP_COLORS.length;
  return GROUP_COLORS[idx];
}

function groupInitials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
}

function parseEndDate(endDate: string | null | undefined): Date | null {
  if (!endDate || endDate === '—') return null;
  const trimmed = String(endDate).trim();
  // Always try DD/MM/YYYY or DD-MM-YYYY first (format coming from SQL TO_CHAR)
  const dmy = trimmed.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (dmy) {
    const d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
    if (!Number.isNaN(d.getTime())) return d;
  }
  // Fallback for ISO / other formats
  const d = new Date(trimmed);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isExpiringIn60Days(endDate: string): boolean {
  const end = parseEndDate(endDate);
  if (!end) return false;
  const diff = (end.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 60;
}

function daysUntilExpiry(endDate: string): number {
  const end = parseEndDate(endDate);
  if (!end) return 999;
  return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function isPolicyExpired(endDate: string): boolean {
  const end = parseEndDate(endDate);
  if (!end) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today;
}

function makeCompanyItem(c: { id: number; name: string }, extra?: Partial<CompanyItem>): CompanyItem {
  return {
    companyId: c.id,
    name: c.name,
    industry: '—',
    location: '—',
    employees: 0,
    rmName: '',
    policyCount: 1,
    activePolicyCount: 0,
    inactivePolicyCount: 0,
    lhPolicyCount: 0,
    tpaId: '—',
    ...extra,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ icon, value, label, accent }: { icon: React.ReactNode; value: string | number; label: string; accent: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 2.5, borderRadius: '12px', bgcolor: '#F5F6F8', border: '1px solid #ECEEF1', flex: 1, minWidth: 0 }}>
      <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: `${accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: accent }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{value}</Typography>
        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#6B7280', mt: 0.75 }}>{label}</Typography>
      </Box>
    </Box>
  );
}

function PolicySplitStatCard({
  total, active, inactive, statusFilter, onFilter,
}: {
  total: number; active: number; inactive: number;
  statusFilter: 'All' | 'Active' | 'Inactive';
  onFilter: (f: 'All' | 'Active' | 'Inactive') => void;
}) {
  const activeOn = statusFilter === 'Active';
  const inactiveOn = statusFilter === 'Inactive';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 2.5, borderRadius: '12px', bgcolor: '#F5F6F8', border: '1px solid #ECEEF1', flex: 1, minWidth: 0 }}>
      <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: '#0F766E18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#0F766E' }}>
        <Shield size={18} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 24, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{active}</Typography>
        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#6B7280', mt: 0.75 }}>Active Policies </Typography>
        {/* <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.75 }}>
          <Box
            onClick={() => onFilter(activeOn ? 'All' : 'Active')}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: '20px', border: activeOn ? '1px solid #6EE7B7' : '1px solid #E5E7EB', bgcolor: activeOn ? '#ECFDF5' : '#F9FAFB', cursor: 'pointer', transition: 'all 0.15s', '&:hover': { border: '1px solid #6EE7B7', bgcolor: '#ECFDF5' } }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: activeOn ? '#059669' : '#9CA3AF', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 15, fontWeight: activeOn ? 700 : 500, color: activeOn ? '#065F46' : '#6B7280', lineHeight: 1 }}>{active} Inactive</Typography>
          </Box>
          <Box
            onClick={() => onFilter(inactiveOn ? 'All' : 'Inactive')}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: '20px', border: inactiveOn ? '1px solid #FCD34D' : '1px solid #E5E7EB', bgcolor: inactiveOn ? '#FFFBEB' : '#F9FAFB', cursor: 'pointer', transition: 'all 0.15s', '&:hover': { border: '1px solid #FCD34D', bgcolor: '#FFFBEB' } }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: inactiveOn ? '#D97706' : '#9CA3AF', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 15, fontWeight: inactiveOn ? 700 : 500, color: inactiveOn ? '#92400E' : '#6B7280', lineHeight: 1 }}>{inactive} Total</Typography>
          </Box>
        </Box> */}
      </Box>
    </Box>
  );
}

function SectionError({ label, onRetry }: { label: string; onRetry: () => void }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 3, py: 2, borderRadius: '8px', bgcolor: '#FEF2F2', border: '1px solid #FECACA' }}>
      <AlertTriangle size={16} color="#B91C1C" />
      <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#B91C1C', flex: 1 }}>
        Failed to load {label}.{' '}
        <Box component="span" onClick={onRetry} sx={{ fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>Retry</Box>
      </Typography>
    </Box>
  );
}

function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Box key={i} sx={{ height: 64, borderRadius: '10px', background: 'linear-gradient(90deg, #E7EAEE 25%, #F0F3F6 50%, #E7EAEE 75%)', backgroundSize: '800px 100%', animation: 'skelshimmer 1.4s infinite linear' }} />
      ))}
    </Box>
  );
}

const COL = {
  policyNo:     { flex: '0 0 140px',  minWidth: 140,  pr: 2.5 },
  name:         { flex: '1 1 200px',  minWidth: 200,  pr: 4   },
  insurer:      { flex: '1 1 140px',  minWidth: 140,  pr: 4   },
  tpa:          { flex: '0 0 110px',  minWidth: 110,  pr: 4   },
  premium:      { flex: '0 0 110px',  minWidth: 110,  pr: 4   },
  period:       { flex: '0 0 200px',  minWidth: 200,  pr: 4   },
  status:       { flex: '0 0 195px',  minWidth: 195,  pr: 2   },
  action:       { flex: '0 0 310px',  minWidth: 310,  pl: 0   },
} as const;

function PolicyTableHeader() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1.5, bgcolor: '#4B6B8A', borderBottom: '1px solid rgba(255,255,255,0.15)', width: '100%', boxSizing: 'border-box' }}>
      <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: '#fff', letterSpacing: 0.6, flex: COL.policyNo.flex, minWidth: COL.policyNo.minWidth, pr: COL.policyNo.pr, overflow: 'hidden' }}>POLICY NO.</Typography>
      <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: '#fff', letterSpacing: 0.6, flex: COL.name.flex,     minWidth: COL.name.minWidth,     pr: COL.name.pr,     overflow: 'hidden' }}>POLICY TYPE</Typography>
      <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: '#fff', letterSpacing: 0.6, flex: COL.insurer.flex,  minWidth: COL.insurer.minWidth,  pr: COL.insurer.pr,  overflow: 'hidden' }}>INSURER</Typography>
      <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: '#fff', letterSpacing: 0.6, flex: COL.tpa.flex,      minWidth: COL.tpa.minWidth,      pr: COL.tpa.pr,      overflow: 'hidden' }}>TPA</Typography>
      <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: '#fff', letterSpacing: 0.6, flex: COL.premium.flex,  minWidth: COL.premium.minWidth,  pr: COL.premium.pr,  overflow: 'hidden' }}>PREMIUM</Typography>
      <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: '#fff', letterSpacing: 0.6, flex: COL.period.flex,   minWidth: COL.period.minWidth,   pr: COL.period.pr,   overflow: 'hidden' }}>POLICY PERIOD</Typography>
      <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: '#fff', letterSpacing: 0.6, flex: COL.status.flex,   minWidth: COL.status.minWidth,   pr: COL.status.pr,   overflow: 'hidden' }}>STATUS</Typography>
      <Typography sx={{ fontSize: 15, lineHeight: 1.5, fontWeight: 600, color: '#fff', letterSpacing: 0.6, flex: COL.action.flex, minWidth: COL.action.minWidth, overflow: 'hidden', textAlign: 'center' }}>ACTIONS</Typography>
    </Box>
  );
}

function PolicyRow({ policy, companyName, companyId, locationIds }: { policy: PolicyItem; companyName?: string; companyId?: number; locationIds?: string }) {
  const navigate = useNavigate();
  const sColor = STATUS_COLORS[policy.status] ?? STATUS_COLORS.Active;
  const expired = isPolicyExpired(policy.endDate);
  const expiring = !expired && isExpiringIn60Days(policy.endDate);
  const daysLeft = expiring ? daysUntilExpiry(policy.endDate) : 0;
  const rowBg = expired ? '#FFF5F5' : expiring ? '#FFFDF5' : 'transparent';
  const rowBorder = expired ? '3px solid #F87171' : expiring ? '3px solid #F59E0B' : '3px solid transparent';
  const dateRange = `${policy.startDate} – ${policy.endDate}`;

  return (
    <Box
      sx={{ display: 'flex', alignItems: 'center', px: 3, py: 1, borderTop: '1px solid #EEF2F7', bgcolor: rowBg, transition: 'background 0.15s', borderLeft: rowBorder, width: '100%', boxSizing: 'border-box' }}
    >
      <Box sx={{ flex: COL.policyNo.flex, minWidth: COL.policyNo.minWidth, pr: COL.policyNo.pr, overflow: 'hidden' }}>
        <Tooltip title={policy.policyNo || `POL-${policy.policyId}`} placement="bottom" arrow>
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 500, color: '#374151', fontFamily: 'monospace', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{policy.policyNo || `POL-${policy.policyId}`}</Typography>
        </Tooltip>
      </Box>
      <Box sx={{ flex: COL.name.flex, minWidth: COL.name.minWidth, pr: COL.name.pr, overflow: 'hidden' }}>
        <Tooltip title={policy.typeName} placement="bottom" arrow>
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{policy.typeName}</Typography>
        </Tooltip>
      </Box>
      <Box sx={{ flex: COL.insurer.flex, minWidth: COL.insurer.minWidth, pr: COL.insurer.pr, overflow: 'hidden' }}>
        <Tooltip title={policy.insurer} placement="bottom" arrow>
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{policy.insurer}</Typography>
        </Tooltip>
      </Box>
      <Box sx={{ flex: COL.tpa.flex, minWidth: COL.tpa.minWidth, pr: COL.tpa.pr, overflow: 'hidden' }}>
        <Tooltip title={policy.tpaName} placement="bottom" arrow>
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{policy.tpaName}</Typography>
        </Tooltip>
      </Box>
      <Box sx={{ flex: COL.premium.flex, minWidth: COL.premium.minWidth, pr: COL.premium.pr, overflow: 'hidden' }}>
        <Tooltip title={policy.premium} placement="bottom" arrow>
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{policy.premium}</Typography>
        </Tooltip>
      </Box>
      <Box sx={{ flex: COL.period.flex, minWidth: COL.period.minWidth, pr: COL.period.pr, overflow: 'hidden' }}>
        <Tooltip title={dateRange} placement="bottom" arrow>
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{dateRange}</Typography>
        </Tooltip>
      </Box>
      <Box sx={{ flex: COL.status.flex, minWidth: COL.status.minWidth, pr: COL.status.pr }}>
        {expired
          ? <Box sx={{ display: 'inline-flex', px: 1.25, py: 0.35, borderRadius: '5px', border: '1px solid #FECACA', bgcolor: '#FEF2F2', color: '#DC2626', fontSize: 15, lineHeight: 1.7, fontWeight: 600, whiteSpace: 'nowrap' }}>Expired</Box>
          : expiring
            ? <Box sx={{ display: 'inline-flex', px: 1.25, py: 0.35, borderRadius: '5px', border: '1px solid #FCD34D', bgcolor: '#FEF3C7', color: '#B45309', fontSize: 15, lineHeight: 1.7, fontWeight: 600, whiteSpace: 'nowrap' }}>{`Expiring Soon (${daysLeft}d)`}</Box>
            : <Box sx={{ display: 'inline-flex', px: 1.25, py: 0.35, borderRadius: '5px', border: `1px solid ${sColor.border}`, bgcolor: sColor.bg, color: sColor.color, fontSize: 15, lineHeight: 1.7, fontWeight: 600, whiteSpace: 'nowrap' }}>{policy.status}</Box>
        }
      </Box>
      <Box sx={{ flex: COL.action.flex, minWidth: COL.action.minWidth, pl: COL.action.pl, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <Box
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/hr-portal/policy-feature/${policy.policyId}`, {
              state: { policyTypeName: policy.typeName },
            });
          }}
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: '5px', border: '1px solid #DDD6FE', bgcolor: '#F5F3FF', '&:hover': { bgcolor: '#EDE9FE', borderColor: '#C4B5FD' }, transition: 'all 0.15s', cursor: 'pointer' }}
        >
          <FileText size={10} color="#7C3AED" />
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#7C3AED', fontWeight: 600, whiteSpace: 'nowrap' }}>Policy Feature</Typography>
        </Box>
        <Box
          onClick={(e) => {
            e.stopPropagation();
            navigate('/hr-portal/dashboard', { state: { companyId, companyName, locationIds, policyId: policy.policyId } });
          }}
          sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: '5px', border: '1px solid #BFDBFE', bgcolor: '#EFF6FF', '&:hover': { bgcolor: '#DBEAFE', borderColor: '#93C5FD' }, transition: 'all 0.15s', cursor: 'pointer' }}
        >
          <ExternalLink size={10} color="#1D4ED8" />
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#1D4ED8', fontWeight: 600, whiteSpace: 'nowrap' }}>View Dashboard</Typography>
        </Box>
      </Box>
    </Box>
  );
}

function CompanyPoliciesPanel({ companyId, policyCache, policyLoadingSet, companyName, locationIds }: {
  companyId: number;
  policyCache: Map<number, PolicyItem[]>;
  policyLoadingSet: Set<number>;
  companyName?: string;
  locationIds?: string;
}) {
  const policies = policyCache.get(companyId);
  const isLoading = policyLoadingSet.has(companyId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={20} sx={{ color: '#1C57B8' }} />
      </Box>
    );
  }
  if (policies === undefined) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={20} sx={{ color: '#1C57B8' }} />
      </Box>
    );
  }
  if (policies.length === 0) {
    return (
      <Box sx={{ px: 3, py: 2 }}>
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <Briefcase size={20} color="#9CA3AF" />
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#374151', lineHeight: 1.5, mb: 0.75 }}>No policies found</Typography>
          <Typography sx={{ fontSize: 15, color: '#9CA3AF', lineHeight: 1.7 }}>No policies linked to this company.</Typography>
        </Box>
      </Box>
    );
  }
  const activePolicies = policies.filter(p => !isPolicyExpired(p.endDate ?? ''));
  if (activePolicies.length === 0) {
    return (
      <Box sx={{ px: 3, py: 2 }}>
        <Box sx={{ py: 5, textAlign: 'center' }}>
          <Box sx={{ width: 48, height: 48, borderRadius: '50%', bgcolor: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
            <Briefcase size={20} color="#9CA3AF" />
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 600, color: '#374151', lineHeight: 1.5, mb: 0.75 }}>No active policies found</Typography>
          <Typography sx={{ fontSize: 15, color: '#9CA3AF', lineHeight: 1.7 }}>All policies for this company have expired.</Typography>
        </Box>
      </Box>
    );
  }
  const sorted = [...activePolicies].sort((a, b) => {
    const aExp = isExpiringIn60Days(a.endDate);
    const bExp = isExpiringIn60Days(b.endDate);
    if (aExp && !bExp) return -1;
    if (!aExp && bExp) return 1;
    if (aExp && bExp) return daysUntilExpiry(a.endDate) - daysUntilExpiry(b.endDate);
    return 0;
  });
  return <>{sorted.map((p) => <PolicyRow key={p.policyId} policy={p} companyName={companyName} companyId={companyId} locationIds={locationIds} />)}</>;
}

// ── Company row used inside the group accordion ──────────────────────────────

const GroupMemberRow = React.memo(function GroupMemberRow({
  company, isExpanded, onToggle, policyCache, policyLoadingSet, locationIds,
}: {
  company: CompanyItem; isExpanded: boolean; onToggle: () => void;
  policyCache: Map<number, PolicyItem[]>; policyLoadingSet: Set<number>; locationIds?: string;
}) {
  const navigate = useNavigate();
  const { localizationData } = useLocalization();
  const cachedPolicies = policyCache.get(company.companyId);
  const isLoadingPolicies = policyLoadingSet.has(company.companyId);
  const activePolicies = cachedPolicies != null ? cachedPolicies.filter(p => !isPolicyExpired(p.endDate ?? '')) : null;
  // allExpired: fetch complete, company is assigned, but zero active policies (includes 0 total)
  const allExpired = !isLoadingPolicies && cachedPolicies != null && activePolicies != null && activePolicies.length === 0;
  const displayPolicyCount = activePolicies != null ? activePolicies.length : null;

  return (
    <Box sx={{ ml: 2, mb: 1 }}>
      <Box
        onClick={onToggle}
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          px: 3, py: 2,
          bgcolor: allExpired ? '#FAFAFA' : (company.isGroupParent ? '#EFF6FF' : '#F8FAFC'),
          borderRadius: '8px',
          border: allExpired ? '1px solid #F3F4F6' : (company.isGroupParent ? '1.5px solid #BFDBFE' : '1px solid #EEF2F7'),
          cursor: 'pointer',
          opacity: allExpired ? 0.75 : 1,
          '&:hover': { bgcolor: allExpired ? '#F3F4F6' : (company.isGroupParent ? '#DBEAFE' : '#F1F5FB'), borderColor: allExpired ? '#E5E7EB' : (company.isGroupParent ? '#93C5FD' : '#D0DAE8') },
          transition: 'all 0.15s',
        }}
      >
        {/* Left: chevron + icon + name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: '#9CA3AF', flexShrink: 0 }}>
            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </Box>
          <Box sx={{ width: 30, height: 30, borderRadius: '7px', bgcolor: company.isGroupParent ? '#DBEAFE' : '#EEF2F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={14} color={company.isGroupParent ? '#1D4ED8' : '#64748B'} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company.name}</Typography>
              {company.isGroupParent && (
                <Box sx={{ px: 1, py: 0.15, borderRadius: '4px', bgcolor: '#1D4ED8', flexShrink: 0 }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.5, letterSpacing: 0.3 }}>GROUP CO.</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Center: stats — true center of the row */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 4, width:"500px", justifyContent:"flex-end" }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: allExpired ? '#9CA3AF' : '#059669', lineHeight: 1 }}>{displayPolicyCount ?? company.activePolicyCount}</Typography>
            <Typography sx={{ fontSize: 10, color: '#6B7280', mt: 0.4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Active Policies</Typography>
          </Box>
          <Box sx={{ width: '1px', height: 32, bgcolor: '#D1D5DB', mx: 3, flexShrink: 0 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: allExpired ? '#9CA3AF' : '#4C1D95', lineHeight: 1 }}>
              {cachedPolicies ? formatINR(cachedPolicies.filter(p => !isPolicyExpired(p.endDate ?? '')).reduce((s, p) => s + p.premiumRaw, 0), localizationData?.data) : '—'}
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#6B7280', mt: 0.4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Active Premium</Typography>
          </Box>
        </Box>

        {/* Right: View Policies + View Dashboard */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          {allExpired ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: '6px', border: '1px solid #FEE2E2', bgcolor: '#FEF2F2' }}>
              <Typography sx={{ fontSize: 12, lineHeight: 1.5, color: '#DC2626', fontWeight: 600 }}>No Policies Found</Typography>
            </Box>
          ) : (
            <>
              <Box
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: '6px', border: isExpanded ? '1px solid #6EE7B7' : '1px solid #A7F3D0', bgcolor: isExpanded ? '#ECFDF5' : '#F0FDF4', cursor: 'pointer', '&:hover': { bgcolor: '#DCFCE7', borderColor: '#6EE7B7' }, transition: 'all 0.15s' }}
              >
                <Shield size={11} color="#059669" />
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#059669', fontWeight: 600 }}>{isExpanded ? 'Hide Policies' : 'View Policies'}</Typography>
              </Box>
              <Box
                onClick={(e) => { e.stopPropagation(); navigate('/hr-portal/dashboard', { state: { companyId: company.companyId, companyName: company.name, locationIds } }); }}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: '6px', border: '1px solid #BFDBFE', bgcolor: '#EFF6FF', cursor: 'pointer', '&:hover': { bgcolor: '#DBEAFE' }, transition: 'all 0.15s' }}
              >
                <LayoutDashboard size={11} color="#1D4ED8" />
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#1D4ED8', fontWeight: 600 }}>View Dashboard</Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {isExpanded && (
        <Box sx={{ ml: 1.5, mt: 0.75, mb: 0.75, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #EEF2F7', overflowX: 'auto', overflowY: 'hidden' }}>
          <Box sx={{ minWidth: 1450, width: '100%' }}>
            <PolicyTableHeader />
            <CompanyPoliciesPanel companyId={company.companyId} policyCache={policyCache} policyLoadingSet={policyLoadingSet} companyName={company.name} locationIds={locationIds} />
          </Box>
        </Box>
      )}
    </Box>
  );
}, (prev, next) =>
  prev.isExpanded === next.isExpanded &&
  prev.company === next.company &&
  prev.locationIds === next.locationIds &&
  prev.policyCache.get(prev.company.companyId) === next.policyCache.get(next.company.companyId) &&
  prev.policyLoadingSet.has(prev.company.companyId) === next.policyLoadingSet.has(next.company.companyId)
);

// ── Group accordion card ─────────────────────────────────────────────────────

function GroupCard({
  parentCompany,
  companies,
  policyCache,
  policyLoadingSet,
  expandedMembers,
  onToggleMember,
  searchTerm,
  onCollapseAll,
  locationIds,
}: {
  parentCompany: { id: number; name: string };
  companies: CompanyItem[];
  policyCache: Map<number, PolicyItem[]>;
  policyLoadingSet: Set<number>;
  expandedMembers: Set<number>;
  onToggleMember: (id: number) => void;
  searchTerm: string;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  locationIds?: string;
}) {
  const [isGroupExpanded, setIsGroupExpanded] = useState(true);
  const { localizationData } = useLocalization();

  const filteredChildren = useMemo(() => {
    if (!searchTerm) return companies;
    const s = searchTerm.toLowerCase();
    return companies.filter((c) => c.name.toLowerCase().includes(s));
  }, [companies, searchTerm]);

  const parentItem = useMemo<CompanyItem>(
    () => makeCompanyItem(parentCompany, { isGroupParent: true }),
    [parentCompany],
  );

  // Show parent in filtered results if search matches it too
  const parentMatches = !searchTerm || parentCompany.name.toLowerCase().includes(searchTerm.toLowerCase());

  // Stats derived from policy cache
  const totalPolicies = useMemo(() => {
    const allIds = [...companies.map((c) => c.companyId), parentCompany.id];
    return allIds.reduce((n, id) => n + (policyCache.get(id)?.length ?? 0), 0);
  }, [companies, parentCompany.id, policyCache]);

  const totalActivePoliciesGroup = useMemo(() => {
    const allIds = [...companies.map((c) => c.companyId), parentCompany.id];
    return allIds.reduce((n, id) => {
      return n + (policyCache.get(id)?.filter((p) => !isPolicyExpired(p.endDate ?? '')).length ?? 0);
    }, 0);
  }, [companies, parentCompany.id, policyCache]);

  const totalActivePremiumGroup = useMemo(() => {
    const allIds = [...companies.map((c) => c.companyId), parentCompany.id];
    return allIds.reduce((sum, id) => {
      const active = policyCache.get(id)?.filter((p) => !isPolicyExpired(p.endDate ?? '')) ?? [];
      return sum + active.reduce((s, p) => s + (parseFloat(String(p.premiumRaw)) || 0), 0);
    }, 0);
  }, [companies, parentCompany.id, policyCache]);

  const groupCacheReady = useMemo(() => {
    const allIds = [...companies.map((c) => c.companyId), parentCompany.id];
    return allIds.length > 0 && allIds.every((id) => policyCache.has(id) && !policyLoadingSet.has(id));
  }, [companies, parentCompany.id, policyCache, policyLoadingSet]);

  const logo = groupInitials(parentCompany.name);
  const logoColor = groupLogoColor(parentCompany.id);
  const totalMembers = companies.length + 1; // children + parent

  return (
    <Box sx={{ mb: 2 }}>
      {/* ── Group header ── */}
      <Box
        onClick={() => setIsGroupExpanded((e) => !e)}
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          px: 3, py: 2.5,
          background: 'linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)',
          border: '1px solid #fff',
          boxShadow: '0 6px 100px 0 rgba(0,0,0,0.10)',
          borderRadius: '10px', cursor: 'pointer',
          '&:hover': { boxShadow: '0 8px 120px 0 rgba(0,0,0,0.14)' },
          transition: 'box-shadow 0.2s',
        }}
      >
        {/* Left: chevron + logo + name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: '#6B7280', flexShrink: 0 }}>
            {isGroupExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </Box>
          <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: logoColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: 0.5 }}>{logo}</Typography>
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parentCompany.name}</Typography>
            <Typography sx={{ fontSize: 13, color: '#6B7280', mt: 0.25 }}>Group Company</Typography>
          </Box>
        </Box>

        {/* Center: stats — true center */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 4,  width:"510px", justifyContent:"flex-end" }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 80 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#1D4ED8', lineHeight: 1 }}>{totalMembers}</Typography>
            <Typography sx={{ fontSize: 11, color: '#6B7280', mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>{totalMembers === 1 ? 'Company' : 'Companies'}</Typography>
          </Box>
          <Box sx={{ width: '1px', height: 44, bgcolor: '#E5E7EB', mx: 3, flexShrink: 0 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#059669', lineHeight: 1 }}>{groupCacheReady ? (totalActivePoliciesGroup || '0') : '—'}</Typography>
            <Typography sx={{ fontSize: 11, color: '#6B7280', mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Active Policies</Typography>
          </Box>
          <Box sx={{ width: '1px', height: 44, bgcolor: '#E5E7EB', mx: 3, flexShrink: 0 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
            <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#4C1D95', lineHeight: 1 }}>{groupCacheReady ? formatINR(totalActivePremiumGroup, localizationData?.data) : '—'}</Typography>
            <Typography sx={{ fontSize: 11, color: '#6B7280', mt: 0.5, textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>Active Premium</Typography>
          </Box>
        </Box>

        {/* Right: View Companies + Collapse All */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          <Box
            onClick={(e) => { e.stopPropagation(); setIsGroupExpanded((v) => !v); }}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: '6px', border: isGroupExpanded ? '1px solid #BFDBFE' : '1px solid #C7D2FE', bgcolor: isGroupExpanded ? '#EFF6FF' : '#EEF2FF', cursor: 'pointer', '&:hover': { bgcolor: '#DBEAFE', borderColor: '#93C5FD' }, transition: 'all 0.15s' }}
          >
            <Building2 size={11} color="#1D4ED8" />
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#1D4ED8', fontWeight: 600 }}>{isGroupExpanded ? 'Hide Companies' : 'View Companies'}</Typography>
          </Box>
          {isGroupExpanded && (
            <Box
              onClick={(e) => {
                e.stopPropagation();
                if (expandedMembers.size > 0) {
                  onCollapseAll();
                } else {
                  // Expand all companies in THIS group directly — no external dependency
                  const ids = [parentCompany.id, ...filteredChildren.map((c) => c.companyId)];
                  ids.forEach((id) => onToggleMember(id));
                }
              }}
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.4, borderRadius: '6px', border: '1px solid #E5E7EB', bgcolor: 'rgba(255,255,255,0.75)', cursor: 'pointer', '&:hover': { bgcolor: '#F3F4F6' }, transition: 'all 0.15s' }}
            >
              {expandedMembers.size > 0
                ? <><ChevronsDownUp size={12} color="#6B7280" /><Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#6B7280', fontWeight: 500 }}>Collapse All</Typography></>
                : <><ChevronsUpDown size={12} color="#6B7280" /><Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#6B7280', fontWeight: 500 }}>Expand All</Typography></>
              }
            </Box>
          )}
        </Box>
      </Box>

      {/* ── Group body ── */}
      {isGroupExpanded && (
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', pt: 0.5, bgcolor: 'rgba(236,242,252,0.35)', borderRadius: '0 0 10px 10px', border: '1px solid #E2ECF6', borderTop: 'none', pb: 1.5, px: 0.5 }}>
          {/* Parent company (GROUP CO.) at the top */}
          {parentMatches && (
            <GroupMemberRow
              key={`parent-${parentCompany.id}`}
              company={parentItem}
              isExpanded={expandedMembers.has(parentCompany.id)}
              onToggle={() => onToggleMember(parentCompany.id)}
              policyCache={policyCache}
              policyLoadingSet={policyLoadingSet}
              locationIds={locationIds}
            />
          )}

          {/* Divider after parent */}
          {parentMatches && filteredChildren.length > 0 && (
            <Box sx={{ mx: 2, my: 1, height: '1px', bgcolor: '#C7D9F0' }} />
          )}

          {/* Child companies */}
          {filteredChildren.map((company) => (
            <GroupMemberRow
              key={company.companyId}
              company={company}
              isExpanded={expandedMembers.has(company.companyId)}
              onToggle={() => onToggleMember(company.companyId)}
              policyCache={policyCache}
              policyLoadingSet={policyLoadingSet}
              locationIds={locationIds}
            />
          ))}

          {filteredChildren.length === 0 && !parentMatches && (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography sx={{ fontSize: 15, color: '#6B7280' }}>No companies match your search.</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

// ── Standalone company card (non-group case) ─────────────────────────────────

const IndividualCompanyCard = React.memo(function IndividualCompanyCard({
  company, isExpanded, onToggle, policyCache, policyLoadingSet, locationIds,
}: {
  company: CompanyItem; isExpanded: boolean; onToggle: () => void;
  policyCache: Map<number, PolicyItem[]>; policyLoadingSet: Set<number>; locationIds?: string;
}) {
  const navigate = useNavigate();
  const { localizationData } = useLocalization();
  const cachedPolicies = policyCache.get(company.companyId);
  const isLoadingPolicies = policyLoadingSet.has(company.companyId);
  const activePolicies = cachedPolicies != null ? cachedPolicies.filter(p => !isPolicyExpired(p.endDate ?? '')) : null;
  const allExpired2 = !isLoadingPolicies && cachedPolicies != null && activePolicies != null && activePolicies.length === 0;
  const displayPolicyCount = activePolicies != null ? activePolicies.length : null;

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        onClick={onToggle}
        sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', px: 3, py: 2.5, background: allExpired2 ? '#FAFAFA' : 'linear-gradient(180deg, #F8FAFF 0%, #FFFFFF 100%)', border: allExpired2 ? '1px solid #F3F4F6' : '1px solid #E0E9F8', boxShadow: allExpired2 ? 'none' : '0 2px 12px 0 rgba(29,78,216,0.06)', borderRadius: '10px', opacity: allExpired2 ? 0.75 : 1, cursor: 'pointer', '&:hover': { boxShadow: allExpired2 ? 'none' : '0 4px 20px 0 rgba(29,78,216,0.12)', borderColor: allExpired2 ? '#E5E7EB' : '#BAD0F8' }, transition: 'all 0.2s' }}
      >
        {/* Left: chevron + icon + name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: '#9CA3AF', flexShrink: 0 }}>
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </Box>
          <Box sx={{ width: 38, height: 38, borderRadius: '9px', bgcolor: '#EFF6FF', border: '1px solid #BFDBFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Building2 size={18} color="#1D4ED8" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 700, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{company.name}</Typography>
          </Box>
        </Box>

        {/* Center: stats — true center */}
        <Box sx={{ display: 'flex', alignItems: 'center', px: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 100 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: allExpired2 ? '#9CA3AF' : '#059669', lineHeight: 1 }}>{displayPolicyCount ?? company.activePolicyCount}</Typography>
            <Typography sx={{ fontSize: 10, color: '#6B7280', mt: 0.4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Active Policies</Typography>
          </Box>
          <Box sx={{ width: '1px', height: 32, bgcolor: '#D1D5DB', mx: 3, flexShrink: 0 }} />
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 120 }}>
            <Typography sx={{ fontSize: 20, fontWeight: 800, color: allExpired2 ? '#9CA3AF' : '#4C1D95', lineHeight: 1 }}>
              {cachedPolicies ? formatINR(cachedPolicies.filter(p => !isPolicyExpired(p.endDate ?? '')).reduce((s, p) => s + p.premiumRaw, 0), localizationData?.data) : '—'}
            </Typography>
            <Typography sx={{ fontSize: 10, color: '#6B7280', mt: 0.4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Active Premium</Typography>
          </Box>
        </Box>

        {/* Right: View Policies + View Dashboard */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          {allExpired2 ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.5, borderRadius: '6px', border: '1px solid #FEE2E2', bgcolor: '#FEF2F2' }}>
              <Typography sx={{ fontSize: 12, lineHeight: 1.5, color: '#DC2626', fontWeight: 600 }}>No Policies Found</Typography>
            </Box>
          ) : (
            <>
              <Box
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.5, borderRadius: '6px', border: isExpanded ? '1px solid #6EE7B7' : '1px solid #A7F3D0', bgcolor: isExpanded ? '#ECFDF5' : '#F0FDF4', cursor: 'pointer', '&:hover': { bgcolor: '#DCFCE7', borderColor: '#6EE7B7' }, transition: 'all 0.15s' }}
              >
                <Shield size={11} color="#059669" />
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#059669', fontWeight: 600 }}>{isExpanded ? 'Hide Policies' : 'View Policies'}</Typography>
              </Box>
              <Box
                onClick={(e) => { e.stopPropagation(); navigate('/hr-portal/dashboard', { state: { companyId: company.companyId, companyName: company.name, locationIds } }); }}
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.5, borderRadius: '6px', border: '1px solid #BFDBFE', bgcolor: '#EFF6FF', cursor: 'pointer', '&:hover': { bgcolor: '#DBEAFE', borderColor: '#93C5FD' }, transition: 'all 0.15s' }}
              >
                <LayoutDashboard size={11} color="#1D4ED8" />
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#1D4ED8', fontWeight: 600 }}>View Dashboard</Typography>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {isExpanded && (
        <Box sx={{ ml: 1.5, mt: 0.75, mb: 0.75, bgcolor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E0E9F8', overflowX: 'auto', overflowY: 'hidden' }}>
          <Box sx={{ minWidth: 1450, width: '100%' }}>
            <PolicyTableHeader />
            <CompanyPoliciesPanel companyId={company.companyId} policyCache={policyCache} policyLoadingSet={policyLoadingSet} companyName={company.name} locationIds={locationIds} />
          </Box>
        </Box>
      )}
    </Box>
  );
}, (prev, next) =>
  prev.isExpanded === next.isExpanded &&
  prev.company === next.company &&
  prev.locationIds === next.locationIds &&
  prev.policyCache.get(prev.company.companyId) === next.policyCache.get(next.company.companyId) &&
  prev.policyLoadingSet.has(prev.company.companyId) === next.policyLoadingSet.has(next.company.companyId)
);

// ─── Main page ────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// NAVIGATION FROM PORTFOLIO → DASHBOARD: TWO SCENARIOS
//
// SCENARIO A — COMPANY CARD BUTTON
//   Where   : Each company card's "View Dashboard" button (~line 529, ~line 820)
//   navigate : { state: { companyId, companyName, locationIds } }
//              NOTE: NO policyId in state
//   Dashboard: loads ALL policies for that company (paginated, infinite scroll)
//
// SCENARIO B — POLICY CARD BUTTON
//   Where   : Each policy tile's "View Dashboard" button (~line 370)
//   navigate : { state: { companyId, companyName, locationIds, policyId } }
//              NOTE: policyId IS present in state
//   Dashboard: loads ONLY that single policy (limit=0, no pagination)
//
// The receiving side (HRPortal/index.tsx) derives portfolioPolicyId via useMemo
// from location.state — so Scenario A gives null, Scenario B gives the policyId.
// ─────────────────────────────────────────────────────────────────────────────
export function HRPortalPortfolio({ locationIds = '' }: { locationIds?: string } = {}) {
  const location = useLocation();
  const companyId = useMemo(() => getCompanyId(), []);
  const { localizationData } = useLocalization();

  // ── Logged-in user role (used for KPI params only) ──
  const [userRole, setUserRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [userCompanyId, setUserCompanyId] = useState<string>('');
  const [roleReady, setRoleReady] = useState(false);

  useEffect(() => {
    void apiRequest(endPoints.employeeDetails, { method: 'GET' }).then((res: any) => {
      const d = res?.data;
      setUserRole(d?.roleKey ?? '');
      setUserId(String(d?.userId ?? d?.id ?? ''));
      setUserCompanyId(String(d?.companyId ?? ''));
    }).catch(() => {
      // For PORTAL_CRM users coming via iWork token redirect, employeeDetails returns nothing.
      // Fall back to sessionStorage so crmUserId is correctly passed in portfolio queries.
      const stored = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (stored?.roleKey) {
        setUserRole(stored.roleKey);
        setUserId(String(stored.userId ?? ''));
        setUserCompanyId(String(stored.companyId ?? ''));
      }
    }).finally(() => setRoleReady(true));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const roleParams = useMemo<Record<string, string>>(() => {
    const params: Record<string, string> = {};
    if (!roleReady) return params;
    if (userRole === 'PORTAL_CRM') params.crmUserId = userId;
    // Always use domain companyId for HR_ADMIN scoping, NOT the user's assigned companyId
    // from employeeDetails — these can differ when switching from HR portal.
    if (userRole === 'HR_ADMIN') params.hrCompanyId = String(companyId ?? '');
    return params;
  }, [roleReady, userRole, userId, companyId]);

  // ── KPI summary ──
  const kpiParams = useMemo(
    () => ({
      companyId: userRole === 'PORTAL_CRM' ? '' : String(companyId ?? ''),
      crmUserId: '',
      hrCompanyId: '',
      locationIds,
      ...roleParams,
    }),
    [companyId, userRole, locationIds, roleParams],
  );
  const kpiQueryParams = useMemo(() => ({ page: 1, limit: 0 }), []);
  const { data: kpiRaw, isLoading: kpiLoading, isError: kpiError, refetch: refetchKpi } =
    useHRReport<KpiRow>('portfolio_kpi_summary', kpiParams, (!!companyId || userRole === 'PORTAL_CRM') && roleReady, kpiQueryParams);
  const kpi = kpiRaw[0] ?? null;

  // ── Portfolio data via admin reports (location-filtered) ──
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioData>({ isGroup: false, parentCompany: null, companies: [] });
  // For PORTAL_CRM: groups separate from individual companies
  const [crmGroups, setCrmGroups] = useState<{ parentCompany: { id: number; name: string }; companies: CompanyItem[] }[]>([]);
  const [portfolioRetry, setPortfolioRetry] = useState(0);

  useEffect(() => {
    if ((!companyId && userRole !== 'PORTAL_CRM') || !roleReady) return;
    setPortfolioLoading(true);
    setPortfolioError(false);
    const base = endPoints.generateHRReports;
    // CRM users: clear companyId/hrCompanyId so the backend returns ALL managed companies
    // via crmUserId, not just the group of the origin company clicked from iWork.
    const isCrm = userRole === 'PORTAL_CRM';
    const params = {
      companyId: isCrm ? '' : String(companyId),
      hrCompanyId: isCrm ? '' : String(companyId),
      crmUserId: '',
      locationIds,
      ...roleParams,
    };
    const toItem = (r: any): CompanyItem => makeCompanyItem(
      { id: r.companyId, name: r.companyName ?? '' },
      {
        industry: r.industry ?? '—',
        location: [r.city, r.state].filter(Boolean).join(', ') || '—',
        rmName: r.rmName ?? '',
        policyCount: r.policyCount ?? 0,
        activePolicyCount: r.activePolicyCount ?? 0,
        inactivePolicyCount: r.inactivePolicyCount ?? 0,
        lhPolicyCount: r.lhPolicyCount ?? 0,
      },
    );
    if (isCrm) {
      // PORTAL_CRM: fetch both group and individual companies in parallel
      Promise.all([
        apiRequest(`${base}portfolio_group_companies?page=1&limit=0`, { method: 'POST', data: params }),
        apiRequest(`${base}portfolio_individual_companies?page=1&limit=0`, { method: 'POST', data: params }),
      ]).then(([groupRes, indRes]: any[]) => {
        const groupRows: any[] = groupRes?.data?.data ?? [];
        const indRows: any[] = indRes?.data?.data ?? [];
        // Group members by their parent (groupId)
        const groupMap = new Map<number, { parentCompany: { id: number; name: string }; companies: CompanyItem[] }>();
        for (const r of groupRows) {
          if (!r.groupId) continue;
          if (!groupMap.has(r.groupId)) {
            groupMap.set(r.groupId, { parentCompany: { id: r.groupId, name: String(r.groupName ?? '') }, companies: [] });
          }
          groupMap.get(r.groupId)!.companies.push(toItem(r));
        }
        setCrmGroups(Array.from(groupMap.values()));
        setPortfolio({ isGroup: false, parentCompany: null, companies: indRows.map(toItem) });
      }).catch(() => setPortfolioError(true))
        .finally(() => setPortfolioLoading(false));
    } else {
      void apiRequest(`${base}portfolio_group_companies?page=1&limit=0`, { method: 'POST', data: params })
        .then((res: any) => {
          const rows: any[] = res?.data?.data ?? [];
          if (rows.length > 0) {
            const parentCompany = rows[0].groupId
              ? { id: rows[0].groupId as number, name: String(rows[0].groupName ?? '') }
              : null;
            setPortfolio({ isGroup: true, parentCompany, companies: rows.map(toItem) });
            return;
          }
          return apiRequest(`${base}portfolio_individual_companies?page=1&limit=0`, { method: 'POST', data: params })
            .then((res2: any) => {
              const rows2: any[] = res2?.data?.data ?? [];
              setPortfolio({ isGroup: false, parentCompany: null, companies: rows2.map(toItem) });
            });
        })
        .catch(() => setPortfolioError(true))
        .finally(() => setPortfolioLoading(false));
    }
  }, [companyId, portfolioRetry, locationIds, roleReady, roleParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Search (client-side within the group body) ──
  const [searchInput, setSearchInput] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const handleSearch = useCallback(() => setCommittedSearch(searchInput.trim()), [searchInput]);

  // ── Per-company policy cache ──
  const policyCacheRef = useRef<Map<number, PolicyItem[]>>(new Map());
  const policyLoadingSetRef = useRef<Set<number>>(new Set());
  const [policyCache, setPolicyCache] = useState<Map<number, PolicyItem[]>>(new Map());
  const [policyLoadingSet, setPolicyLoadingSet] = useState<Set<number>>(new Set());

  const fetchPoliciesForCompany = useCallback(async (targetCompanyId: number) => {
    if (policyCacheRef.current.has(targetCompanyId) || policyLoadingSetRef.current.has(targetCompanyId)) return;
    policyLoadingSetRef.current.add(targetCompanyId);
    setPolicyLoadingSet(new Set(policyLoadingSetRef.current));
    try {
      const res = await apiRequest(
        `${endPoints.generateHRReports}portfolio_company_policies?page=1&limit=0`,
        { method: 'POST', data: { companyId: String(targetCompanyId), locationIds } },
      ) as { data?: { data?: PolicyApiRow[] } };
      const rows: PolicyApiRow[] = res?.data?.data ?? [];
      const items: PolicyItem[] = rows.map((p) => {
        const premiumRaw = p.premiumAmount != null ? parseFloat(String(p.premiumAmount)) : 0;
        return {
          policyId: p.policyId,
          type: parsePolicyTypeCode(p.policyTypeCode),
          typeName: p.policyTypeName ?? p.policyTypeCode ?? '—',
          policyNo: p.policyNumber ?? null,
          insurer: p.insurerName ?? '—',
          tpaName: p.tpaName ?? '—',
          premium: premiumRaw !== 0 ? formatINR(premiumRaw, localizationData?.data) : '—',
          premiumRaw,
          status: p.policyStatus,
          startDate: p.startDate ?? '—',
          endDate: p.endDate ?? '—',
        };
      });
      policyCacheRef.current.set(targetCompanyId, items);
      setPolicyCache(new Map(policyCacheRef.current));
    } catch {
      policyCacheRef.current.set(targetCompanyId, []);
      setPolicyCache(new Map(policyCacheRef.current));
    } finally {
      policyLoadingSetRef.current.delete(targetCompanyId);
      setPolicyLoadingSet(new Set(policyLoadingSetRef.current));
    }
  }, [locationIds]);

  // All companies (children + parent) for pre-fetching and KPI
  const allCompanies = useMemo<CompanyItem[]>(() => {
    const list = [...portfolio.companies];
    if (portfolio.parentCompany) list.push(makeCompanyItem(portfolio.parentCompany));
    return list;
  }, [portfolio]);

  // Pre-fetch policies for all companies once loaded (non-CRM path)
  useEffect(() => {
    for (const c of allCompanies) void fetchPoliciesForCompany(c.companyId);
  }, [allCompanies, fetchPoliciesForCompany]);
  // For PORTAL_CRM: pre-fetch policies for all group members + group parent
  useEffect(() => {
    if (userRole !== 'PORTAL_CRM') return;
    for (const g of crmGroups) {
      void fetchPoliciesForCompany(g.parentCompany.id);
      for (const c of g.companies) void fetchPoliciesForCompany(c.companyId);
    }
  }, [crmGroups, userRole, fetchPoliciesForCompany]);

  // ── Non-group: single company card ──
  const standaloneItem = useMemo<CompanyItem | null>(() => {
    if (portfolio.isGroup || !companyId) return null;
    const name = portfolio.companies[0]?.name || getCompanyName() || '';
    return makeCompanyItem({ id: companyId, name });
  }, [portfolio.isGroup, portfolio.companies, companyId]);

  // ── Expiring policies count ──
  const expiringCount = useMemo(() => {
    let count = 0;
    for (const policies of policyCache.values()) {
      for (const p of policies) {
        if (isExpiringIn60Days(p.endDate)) count++;
      }
    }
    return count;
  }, [policyCache]);

  // ── Derived KPI totals from policy cache ──
  const kpiCompanyIds = useMemo(() => {
    const idSet = new Set<number>(allCompanies.map((c) => c.companyId));
    if (standaloneItem) idSet.add(standaloneItem.companyId);
    // For PORTAL_CRM: add all group members + group parents
    for (const g of crmGroups) {
      idSet.add(g.parentCompany.id);
      for (const c of g.companies) idSet.add(c.companyId);
    }
    return Array.from(idSet);
  }, [allCompanies, standaloneItem, crmGroups]);

  const totalPoliciesDerived = useMemo(() => {
    return kpiCompanyIds.reduce((n, id) => n + (policyCache.get(id)?.length ?? 0), 0);
  }, [kpiCompanyIds, policyCache]);

  const totalActivePoliciesDerived = useMemo(() => {
    return kpiCompanyIds.reduce((n, id) => {
      return n + (policyCache.get(id)?.filter((p) => !isPolicyExpired(p.endDate ?? '')).length ?? 0);
    }, 0);
  }, [kpiCompanyIds, policyCache]);

  const totalInactivePoliciesDerived = useMemo(
    () => Math.max(0, totalPoliciesDerived - totalActivePoliciesDerived),
    [totalPoliciesDerived, totalActivePoliciesDerived],
  );

  const totalActivePremiumDerived = useMemo(() => {
    return kpiCompanyIds.reduce((sum, id) => {
      const active = policyCache.get(id)?.filter((p) => !isPolicyExpired(p.endDate ?? '')) ?? [];
      return sum + active.reduce((s, p) => s + (parseFloat(String(p.premiumRaw)) || 0), 0);
    }, 0);
  }, [kpiCompanyIds, policyCache]);

  // ── Status filter ──
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  useEffect(() => { setStatusFilter('All'); }, [location.pathname]);

  // ── Expand / collapse state for members inside the group ──
  const [expandedMembers, setExpandedMembers] = useState<Set<number>>(new Set());

  // Auto-expand all members on first load
  const initialExpandRef = useRef(false);
  useEffect(() => {
    if (allCompanies.length > 0 && !initialExpandRef.current) {
      initialExpandRef.current = true;
      setExpandedMembers(new Set(allCompanies.map((c) => c.companyId)));
    }
  }, [allCompanies]);

  const toggleMember = useCallback((id: number) => {
    const needsFetch = !policyCacheRef.current.has(id);
    setExpandedMembers((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    if (needsFetch) fetchPoliciesForCompany(id);
  }, [fetchPoliciesForCompany]);

  const collapseAllMembers = useCallback(() => setExpandedMembers(new Set()), []);
  const expandAllMembers = useCallback(() => {
    // Collect IDs from all sources: non-CRM portfolio + CRM groups
    const ids: number[] = [
      ...allCompanies.map((c) => c.companyId),
      ...crmGroups.flatMap((g) => [g.parentCompany.id, ...g.companies.map((c) => c.companyId)]),
    ];
    const unique = [...new Set(ids)];
    setExpandedMembers(new Set(unique));
    unique.forEach((id) => { if (!policyCacheRef.current.has(id)) fetchPoliciesForCompany(id); });
  }, [allCompanies, crmGroups, fetchPoliciesForCompany]);

  // Clear policy cache whenever locationIds changes so stale pre-filter data doesn't linger
  useEffect(() => {
    policyCacheRef.current = new Map();
    policyLoadingSetRef.current = new Set();
    setPolicyCache(new Map());
    setPolicyLoadingSet(new Set());
    initialExpandRef.current = false;
  }, [locationIds]);

  // Pre-fetch and auto-expand the standalone company (not in allCompanies)
  useEffect(() => {
    if (!standaloneItem) return;
    void fetchPoliciesForCompany(standaloneItem.companyId);
    setExpandedMembers((prev) => { const s = new Set(prev); s.add(standaloneItem.companyId); return s; });
  }, [standaloneItem?.companyId, fetchPoliciesForCompany]); // eslint-disable-line react-hooks/exhaustive-deps

  // For PORTAL_CRM: pre-fetch policies for all managed companies
  useEffect(() => {
    if (userRole !== 'PORTAL_CRM' || portfolio.companies.length === 0) return;
    portfolio.companies.forEach((c) => fetchPoliciesForCompany(c.companyId));
  }, [portfolio.companies, userRole, fetchPoliciesForCompany]); // eslint-disable-line react-hooks/exhaustive-deps

  // Include standalone company in derived KPI totals
  const standaloneId = standaloneItem?.companyId ?? null;
  const policyCacheReady = useMemo(() => {
    if (standaloneId != null) return policyCache.has(standaloneId) && !policyLoadingSet.has(standaloneId);
    return allCompanies.length > 0 && allCompanies.every((c) => policyCache.has(c.companyId)) && policyLoadingSet.size === 0;
  }, [allCompanies, standaloneId, policyCache, policyLoadingSet]);
  // ── Non-group: single company card ──

  return (
    <Box sx={{ width: '100%' }}>
      {/* ── Sticky KPI header ── */}
      <Box sx={{ position: 'sticky', top: -1, zIndex: 1, bgcolor: '#ffffff', pt: 3.5, pb: 3, mx: -3, px: 3, borderBottom: '1px solid #E8EFF6', boxShadow: '0 2px 12px rgba(28,87,184,0.07)' }}>
        {kpiError ? (
          <SectionError label="KPI summary" onRetry={refetchKpi} />
        ) : kpiLoading ? (
          <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
            {[0, 1, 2, 3].map((i) => (
              <Box key={i} sx={{ flex: 1, minWidth: 0, height: 72, borderRadius: '12px', background: 'linear-gradient(90deg, #E7EAEE 25%, #F0F3F6 50%, #E7EAEE 75%)', backgroundSize: '800px 100%', animation: 'skelshimmer 1.4s infinite linear' }} />
            ))}
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 2.5, flexWrap: 'wrap' }}>
            <StatCard icon={<Building2 size={17} />} value={userRole === 'PORTAL_CRM' ? crmGroups.reduce((n, g) => n + g.companies.length, 0) + portfolio.companies.length : standaloneItem ? 1 : allCompanies.length} label="Companies" accent="#1D4ED8" />
            <PolicySplitStatCard
              total={totalActivePoliciesDerived + totalInactivePoliciesDerived}
              active={totalActivePoliciesDerived}
              inactive={totalInactivePoliciesDerived}
              statusFilter={statusFilter}
              onFilter={setStatusFilter}
            />
            <StatCard icon={<TrendingUp size={17} />} value={!policyCacheReady ? '—' : formatINR(totalActivePremiumDerived, localizationData?.data)} label="Active Premium" accent="#C2410C" />
            <StatCard icon={<Clock size={17} />} value={expiringCount} label="Policies Expiring (In 60 days)" accent="#D97706" />
          </Box>
        )}
      </Box>

      {/* ── Search bar ── */}
      <Box sx={{ mt: 2.5, mb: 0.75 }}>
        <Box sx={{ display: 'flex', gap: 1.5, maxWidth: 480 }}>
          <Box sx={{ position: 'relative', flex: 1 }}>
            <Box sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF', pointerEvents: 'none' }}>
              <Search size={16} />
            </Box>
            <Box
              component="input"
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Search companies by name…"
              sx={{
                width: '100%', boxSizing: 'border-box',
                pl: '36px', pr: searchInput ? '36px' : '12px', py: '9px',
                fontSize: 15, lineHeight: 1.7, color: '#111827',
                border: '1px solid #D1D9E8', borderRadius: '8px',
                outline: 'none', bgcolor: '#F8FAFC',
                '&:focus': { borderColor: '#93C5FD', bgcolor: '#fff', boxShadow: '0 0 0 3px rgba(147,197,253,0.3)' },
                transition: 'all 0.15s',
              }}
            />
            {searchInput && (
              <Box
                onClick={() => { setSearchInput(''); setCommittedSearch(''); }}
                sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#9CA3AF', '&:hover': { color: '#374151' }, display: 'flex', alignItems: 'center' }}
              >
                <X size={14} />
              </Box>
            )}
          </Box>
          <Box
            onClick={handleSearch}
            sx={{ display: 'flex', alignItems: 'center', gap: 0.75, px: 2, borderRadius: '8px', bgcolor: '#1D4ED8', cursor: 'pointer', flexShrink: 0, '&:hover': { bgcolor: '#1E40AF' }, transition: 'all 0.15s' }}
          >
            <Search size={14} color="#fff" />
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#fff', fontWeight: 600 }}>Search</Typography>
          </Box>
        </Box>
      </Box>

      {/* ── Portfolio body ── */}
      <Box sx={{ mt: 2.5 }}>
        {portfolioError ? (
          <SectionError label="portfolio" onRetry={() => setPortfolioRetry((r) => r + 1)} />
        ) : portfolioLoading ? (
          <SectionSkeleton rows={4} />
        ) : portfolio.isGroup && portfolio.parentCompany ? (
          <GroupCard
            parentCompany={portfolio.parentCompany}
            companies={portfolio.companies}
            policyCache={policyCache}
            policyLoadingSet={policyLoadingSet}
            expandedMembers={expandedMembers}
            onToggleMember={toggleMember}
            searchTerm={committedSearch}
            onCollapseAll={collapseAllMembers}
              onExpandAll={expandAllMembers}
            locationIds={locationIds}
          />
        ) : userRole === 'PORTAL_CRM' ? (
          <>
            {crmGroups.map((g) => (
              <GroupCard
                key={g.parentCompany.id}
                parentCompany={g.parentCompany}
                companies={g.companies}
                policyCache={policyCache}
                policyLoadingSet={policyLoadingSet}
                expandedMembers={expandedMembers}
                onToggleMember={toggleMember}
                searchTerm={committedSearch}
                onCollapseAll={collapseAllMembers}
              onExpandAll={expandAllMembers}
                locationIds={locationIds}
              />
            ))}
            {portfolio.companies.map((company) => (
              <IndividualCompanyCard
                key={company.companyId}
                company={company}
                isExpanded={expandedMembers.has(company.companyId)}
                onToggle={() => toggleMember(company.companyId)}
                policyCache={policyCache}
                policyLoadingSet={policyLoadingSet}
                locationIds={locationIds}
              />
            ))}
            {crmGroups.length === 0 && portfolio.companies.length === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, background: 'linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)', border: '1px solid #fff', boxShadow: '0 6px 100px 0 rgba(0,0,0,0.10)', borderRadius: '10px' }}>
                <Building2 size={36} color="#D1D5DB" />
                <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#6B7280', mt: 1.5, fontWeight: 500 }}>No companies found</Typography>
              </Box>
            )}
          </>
        ) : standaloneItem ? (
          <IndividualCompanyCard
            company={standaloneItem}
            isExpanded={expandedMembers.has(standaloneItem.companyId)}
            onToggle={() => toggleMember(standaloneItem.companyId)}
            policyCache={policyCache}
            policyLoadingSet={policyLoadingSet}
            locationIds={locationIds}
          />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, background: 'linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)', border: '1px solid #fff', boxShadow: '0 6px 100px 0 rgba(0,0,0,0.10)', borderRadius: '10px' }}>
            <Building2 size={36} color="#D1D5DB" />
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: '#6B7280', mt: 1.5, fontWeight: 500 }}>No group companies found</Typography>
          </Box>
        )}
      </Box>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes skelshimmer {
          0% { background-position: -800px 0; }
          100% { background-position: 800px 0; }
        }
      `}</style>
    </Box>
  );
}

export default HRPortalPortfolio;
