import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { ArrowLeft, ChevronDown, Download, Eye, RotateCcw, Search } from "lucide-react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import {
  endPoints,
  formatAmountWithCurrency, getCurrencySymbolPrefix,
  LocalizationConfig,
  useLocalization,
} from "@ui/ui-lib";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { getCompanyId } from "../../utils/companyConfig";
import {
  PORTAL_HEADER_GRADIENT,
  PORTAL_HEADER_TITLE_SX,
  PortalSelectControl,
} from "../HRPortal/controls";
import { SectionCard } from "../HRPortal/styles";

// ─── API Response Types ────────────────────────────────────────────────────────

type KpiData = {
  totalDepositBalance: number;
  activeCdAccountsCount: number;
  utilisedAmount: number;
  utilisedPercent: number;
  lastDepositDate: string | null;
  lastDepositAmount: number | null;
  lastDepositBank: string | null;
  balanceTrendData: unknown;
};

type AccountRow = {
  cdAccountId: number;
  cdAccountNumber: string;
  cdAccountName: string;
  policyNumber: string;
  policyId: number;
  depositBalance: number;
  utilisedAmount: number;
  utilisationPercent: number | null;
  lastUpdated: string;
};

type TxRow = {
  txnId: number;
  txnDate: string;
  txnType: "Deposit" | "Deduction";
  amount: number;
  policyNumber: string | null;
  bankName: string | null;
  referenceId: string | null;
  runningBalance: string | null;
  endorsementNumber: string | null;
  endorsementType: string | null;
  transactionValueDate: string | null;
  createdBy: string | null;
  remarks: string | null;
  ifscCode: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (amount: number, localization?: LocalizationConfig) =>
  amount >= 100000
    ? `${getCurrencySymbolPrefix(localization)}${(amount / 100000).toFixed(2)}L`
    : `${formatAmountWithCurrency(amount, localization)}`;

const dash = (value: string | null | undefined) =>
  value && value.trim() ? value : "--";

const DATE_RANGE_OPTIONS = [
  "Last 1 Month",
  "Last 3 Months",
  "Last 6 Months",
  "Last 12 Months",
];

const getDateBounds = (range: string): { startDate: string; endDate: string } => {
  const now = new Date();
  const end = now.toISOString().split("T")[0];
  const monthsBack: Record<string, number> = {
    "Last 1 Month": 1,
    "Last 3 Months": 3,
    "Last 6 Months": 6,
    "Last 12 Months": 12,
  };
  const months = monthsBack[range];
  if (!months) return { startDate: "", endDate: "" };
  const start = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  return { startDate: start.toISOString().split("T")[0], endDate: end };
};

const utilisationColor = (pct: number | null) => {
  if (pct === null) return "#22C55E";
  if (pct > 80) return "#EF4444";
  if (pct > 50) return "#F59E0B";
  return "#22C55E";
};

const utilisationTextColor = (pct: number) => {
  if (pct > 80) return "#B91C1C";
  if (pct > 50) return "#B54708";
  return "#166534";
};

const getTxDetailFields = (tx: TxRow): [string, string | null][] =>
  tx.txnType === "Deposit"
    ? [
        ["Reference ID", tx.referenceId],
        ["Bank", tx.bankName],
        ["Value Date", tx.transactionValueDate],
        ["IFSC Code", tx.ifscCode],
        ["Created By", tx.createdBy],
        ["Remarks", tx.remarks],
      ]
    : [
        ["Endorsement Ref", tx.endorsementNumber],
        ["Endorsement Type", tx.endorsementType],
        ["Reference ID", tx.referenceId],
        ["IFSC Code", tx.ifscCode],
        ["Created By", tx.createdBy],
        ["Remarks", tx.remarks],
      ];

// ─── Page Component ────────────────────────────────────────────────────────────

export function HRPortalFinance() {
  const location = useLocation();
  const companyId = getCompanyId();
  const { localizationData } = useLocalization();

  // ── View state: null = overview, number = transactions view (policyId) ──
  const [viewPolicyId, setViewPolicyId] = useState<number | null>(
    null
  );

  // ── KPI state ──
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [kpiLoading, setKpiLoading] = useState(true);

  // ── Account Details state ──
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountSearch, setAccountSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // ── Transactions state ──
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [txnCount, setTxnCount] = useState(0);
  const [txnLoading, setTxnLoading] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  // ── Transaction filters ──
  const [txnDateRange, setTxnDateRange] = useState("Last 6 Months");
  const [txnTypeFilter, setTxnTypeFilter] = useState("All Types");
  const [txnSearch, setTxnSearch] = useState("");
  const [debouncedTxnSearch, setDebouncedTxnSearch] = useState("");

  // ── Export loading state ──
  const [accountsExporting, setAccountsExporting] = useState(false);
  const [txnsExporting, setTxnsExporting] = useState(false);

  const pageSize = 8;

  // Seed view state from location (e.g. navigated here via "View CD Accounts")
  const locationAccountCode = (location.state as { accountCode?: string } | null)
    ?.accountCode ?? null;
  const seededRef = useRef(false);

  // ── Debounce account search ──
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(accountSearch), 300);
    return () => clearTimeout(timer);
  }, [accountSearch]);

  // ── Debounce transaction search ──
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTxnSearch(txnSearch);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [txnSearch]);

  // ── Fetch KPI ──
  useEffect(() => {
    if (!companyId) return;
    setKpiLoading(true);
    apiRequest(endPoints.generateHRReports + "cd_kpi_summary", {
      method: "POST",
      data: { companyId },
    })
      .then((res) => {
        setKpi(res?.data?.data?.[0] ?? null);
      })
      .catch(() => setKpi(null))
      .finally(() => setKpiLoading(false));
  }, [companyId]);

  // ── Fetch Account Details ──
  useEffect(() => {
    if (!companyId) return;
    setAccountsLoading(true);
    apiRequest(endPoints.generateHRReports + "cd_account_details", {
      method: "POST",
      data: { companyId, search: debouncedSearch },
    })
      .then((res) => {
        const rows: AccountRow[] = res?.data?.data ?? [];
        setAccounts(rows);
        // Seed view from location state once accounts are loaded
        if (!seededRef.current && locationAccountCode) {
          seededRef.current = true;
          const match = rows.find((a) => a.cdAccountNumber === locationAccountCode);
          if (match) {
            setViewPolicyId(match.policyId);
          }
        }
      })
      .catch(() => setAccounts([]))
      .finally(() => setAccountsLoading(false));
  }, [companyId, debouncedSearch]);

  // ── Fetch Transactions ──
  const fetchTransactions = useCallback(() => {
    if (!companyId || !viewPolicyId) return;
    const policyId = String(viewPolicyId);
    const txnTypeApi =
      txnTypeFilter === "Deposit"
        ? "CREDIT_TRANSACTION"
        : txnTypeFilter === "Deduction"
        ? "DEBIT_TRANSACTION"
        : "";
    const { startDate, endDate } = getDateBounds(txnDateRange);
    setTxnLoading(true);
    apiRequest(
      `${endPoints.generateHRReports}cd_transactions?page=${page}&limit=${pageSize}`,
      {
        method: "POST",
        data: {
          companyId,
          policyId,
          startDate,
          endDate,
          txnType: txnTypeApi,
          search: debouncedTxnSearch,
        },
      }
    )
      .then((res) => {
        setTransactions(res?.data?.data ?? []);
        setTxnCount(res?.data?.count ?? 0);
      })
      .catch(() => {
        setTransactions([]);
        setTxnCount(0);
      })
      .finally(() => setTxnLoading(false));
  }, [companyId, viewPolicyId, txnDateRange, txnTypeFilter, debouncedTxnSearch, page]);

  useEffect(() => {
    if (viewPolicyId !== null) {
      fetchTransactions();
    }
  }, [viewPolicyId, fetchTransactions]);

  // ── Export handlers ──
  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAccountsExport = useCallback(async () => {
    if (accountsExporting || !companyId) return;
    setAccountsExporting(true);
    try {
      const response = await apiRequest(
        endPoints.downloadHRReports + "cd_account_details",
        { method: "POST", data: { companyId, search: debouncedSearch }, responseType: "blob" },
      );
      triggerBlobDownload(response.data as Blob, "cd-account-details.csv");
    } catch {
      // silently ignore — no toast infra in this component
    } finally {
      setAccountsExporting(false);
    }
  }, [companyId, debouncedSearch, accountsExporting]);

  const handleTxnsExport = useCallback(async () => {
    if (txnsExporting || !companyId || !viewPolicyId) return;
    setTxnsExporting(true);
    const txnTypeApi =
      txnTypeFilter === "Deposit"
        ? "CREDIT_TRANSACTION"
        : txnTypeFilter === "Deduction"
        ? "DEBIT_TRANSACTION"
        : "";
    const { startDate, endDate } = getDateBounds(txnDateRange);
    try {
      const response = await apiRequest(
        endPoints.downloadHRReports + "cd_transactions",
        {
          method: "POST",
          data: {
            companyId,
            policyId: String(viewPolicyId),
            startDate,
            endDate,
            txnType: txnTypeApi,
            search: debouncedTxnSearch,
          },
          responseType: "blob",
        },
      );
      triggerBlobDownload(response.data as Blob, "cd-transactions.csv");
    } catch {
      // silently ignore
    } finally {
      setTxnsExporting(false);
    }
  }, [companyId, viewPolicyId, txnDateRange, txnTypeFilter, debouncedTxnSearch, txnsExporting]);

  // ── Derived totals ──
  const totalDeposit = useMemo(
    () => accounts.reduce((s, a) => s + (a.depositBalance || 0), 0),
    [accounts]
  );
  const totalUtilised = useMemo(
    () => accounts.reduce((s, a) => s + (a.utilisedAmount || 0), 0),
    [accounts]
  );

  const activeAccount = accounts.find((a) => a.policyId === viewPolicyId);
  const totalPages = Math.max(1, Math.ceil(txnCount / pageSize));
  const currentPage = Math.min(page, totalPages);

  // Parse balanceTrendData — PostgreSQL json_agg may arrive as a JSON string
  const sparkPoints: number[] = (() => {
    const raw = kpi?.balanceTrendData;
    if (!raw) return [];
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? (parsed as number[]) : [];
  })();

  // ── KPI card config ──
  const kpis = [
    {
      label: "Total Deposit Balance",
      value: kpiLoading ? "--" : fmt(kpi?.totalDepositBalance ?? 0, localizationData?.data),
      note: kpiLoading
        ? "Loading…"
        : `Across ${kpi?.activeCdAccountsCount ?? 0} active account${(kpi?.activeCdAccountsCount ?? 0) !== 1 ? "s" : ""}`,
    },
    {
      label: "Utilised Amount",
      value: kpiLoading ? "--" : fmt(kpi?.utilisedAmount ?? 0, localizationData?.data),
      note: kpiLoading
        ? "Loading…"
        : `${kpi?.utilisedPercent ?? 0}% of total deposit`,
    },
    {
      label: "Total Deductions",
      value: kpiLoading ? "--" : fmt(kpi?.utilisedAmount ?? 0, localizationData?.data),
      note: kpiLoading ? "Loading…" : "Cumulative debited amount",
    },
    {
      label: "Last Deposit Date",
      value: kpiLoading ? "--" : dash(kpi?.lastDepositDate),
      note: kpiLoading
        ? "Loading…"
        : kpi?.lastDepositAmount
        ? `${fmt(kpi.lastDepositAmount, localizationData?.data)}${kpi.lastDepositBank ? ` · ${kpi.lastDepositBank}` : ""}`
        : "No deposits recorded",
    },
  ];

  // ─── Overview ──────────────────────────────────────────────────────────────

  const renderOverview = () => (
    <>
      <Box
        sx={{
          position: "sticky",
          top: -1,
          zIndex: 10,
          bgcolor: "#ffffff",
          pt: 3.5,
          pb: 3,
          mx: -3,
          px: 3,
          borderBottom: "1px solid #E8EFF6",
          boxShadow: "0 2px 12px rgba(28,87,184,0.07)",
        }}
      >
        <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827" }}>
          CD Manage
        </Typography>
        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mt: 0.75 }}>
          Manage Cash Deposit balances across all policies
        </Typography>
      </Box>

      <Box sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2.5 }}>
        {/* KPI Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            overflow: "hidden",
            background: "linear-gradient(180deg, #EDEDED 0%, #FEFEFE 100%)",
            border: "1px solid #FFF",
            borderRadius: "8px",
            boxShadow: "0 6px 100px 0 rgba(0, 0, 0, 0.10)",
          }}
        >
          {kpis.map((kpi, index) => (
            <Box
              key={kpi.label}
              sx={{
                p: 1.5,
                borderLeft: index === 0 ? "none" : "1px solid #E4EAF2",
              }}
            >
              <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#687686" }}>
                {kpi.label}
              </Typography>
              <Typography
                sx={{ mt: 0.75, fontSize: 28, lineHeight: 1.25, letterSpacing: "-0.4px", fontWeight: 600, color: "#1f2937" }}
              >
                {kpi.value}
              </Typography>
              {/* {index === 0 && sparkPoints.length > 1 && (
                <Box sx={{ mt: 0.75, height: 32 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={sparkPoints.map((v, i) => ({ i, v }))}
                      margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
                    >
                      <Line
                        type="monotone"
                        dataKey="v"
                        stroke="#3B82F6"
                        strokeWidth={1.6}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )} */}
              <Typography sx={{ mt: 0.75, fontSize: 15, lineHeight: 1.7, color: "#8d99a6" }}>
                {kpi.note}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#1F2937" }}>
          Account Details
        </Typography>

        <SectionCard
          sx={{
            mb: 0,
            p: 0,
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "none",
          }}
        >
          {/* Account Details Toolbar */}
          <Box
            sx={{
              px: 1.2,
              py: 1.1,
              borderBottom: "1px solid #E9EEF5",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                flex: 1,
                height: 32,
                borderRadius: "8px",
                border: "1px solid #D7E2EE",
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                px: 1.2,
                background: "#fff",
              }}
            >
              <Search size={14} color="#98A2B3" />
              <Box
                component="input"
                value={accountSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setAccountSearch(e.target.value)
                }
                placeholder="Search account name or policy number..."
                sx={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 15, lineHeight: 1.7,
                  color: "#4B5563",
                  background: "transparent",
                }}
              />
            </Box>

            <Box
              onClick={handleAccountsExport}
              sx={{
                height: 32,
                px: 1.4,
                borderRadius: "8px",
                background: accountsExporting ? "#6B8FC4" : "#1C57B8",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.65,
                fontSize: 15, lineHeight: 1.7,
                fontWeight: 600,
                cursor: accountsExporting ? "not-allowed" : "pointer",
                opacity: accountsExporting ? 0.75 : 1,
              }}
            >
              <Download size={14} />
              {accountsExporting ? "Exporting…" : "Export"}
              {!accountsExporting && <ChevronDown size={12} />}
            </Box>
          </Box>

          {/* Account Details Table */}
          <Box sx={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 320px)" }}>
            <Box sx={{ minWidth: 1020 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1.8fr 1.1fr 1fr 1fr 1fr 1fr 1.15fr",
                  px: 1.4,
                  py: 1.05,
                  background: "#F8FAFC",
                  borderBottom: "1px solid #E9EEF5",
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                }}
              >
                {[
                  "CD Account Name",
                  "Policy Number",
                  "Deposit Balance",
                  "Utilised Amount",
                  "Utilisation",
                  "Last Updated",
                  "Action",
                ].map((label) => (
                  <Typography
                    key={label}
                    sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#6B7280" }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>

              {accountsLoading ? (
                <Box
                  sx={{
                    py: 4,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <CircularProgress size={20} sx={{ color: "#1C57B8" }} />
                </Box>
              ) : accounts.length === 0 ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                    <Eye size={20} color="#9CA3AF" />
                  </Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151", lineHeight: 1.5, mb: 0.75 }}>No CD accounts found</Typography>
                  <Typography sx={{ fontSize: 15, color: "#9CA3AF", lineHeight: 1.7 }}>No active CD accounts are linked to this company.</Typography>
                </Box>
              ) : (
                <>
                  {accounts.map((account) => {
                    const pct = account.utilisationPercent ?? 0;
                    const barColor = utilisationColor(account.utilisationPercent);
                    return (
                      <Box
                        key={account.cdAccountId}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1.8fr 1.1fr 1fr 1fr 1fr 1fr 1.15fr",
                          px: 1.4,
                          py: 1.1,
                          alignItems: "center",
                          borderBottom: "1px solid #EEF2F6",
                          minHeight: 60,
                        }}
                      >
                        <Box>
                          <Typography
                            sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#1F2937" }}
                          >
                            {account.cdAccountName}
                          </Typography>
                          <Typography
                            sx={{ mt: 0.75, fontSize: 15, lineHeight: 1.7, color: "#98A2B3" }}
                          >
                            {account.cdAccountNumber}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085" }}>
                          {dash(account.policyNumber)}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#1F2937" }}
                        >
                          {fmt(account.depositBalance, localizationData?.data)}
                        </Typography>
                        <Typography
                          sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#F04438" }}
                        >
                          {fmt(account.utilisedAmount, localizationData?.data)}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                          <Box
                            sx={{
                              width: 76,
                              height: 6,
                              borderRadius: 999,
                              background: "#E5E7EB",
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                width: `${Math.min(pct, 100)}%`,
                                height: "100%",
                                borderRadius: 999,
                                background: barColor,
                              }}
                            />
                          </Box>
                          <Typography
                            sx={{
                              fontSize: 15, lineHeight: 1.7,
                              color: utilisationTextColor(pct),
                            }}
                          >
                            {account.utilisationPercent !== null
                              ? `${account.utilisationPercent}%`
                              : "0%"}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085" }}>
                          {dash(account.lastUpdated)}
                        </Typography>
                        <Box
                          onClick={() => {
                            setViewPolicyId(account.policyId);
                            setPage(1);
                            setTxnSearch("");
                            setExpandedTxId(null);
                          }}
                          sx={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 0.55,
                            color: "#1D57B7",
                            fontSize: 15, lineHeight: 1.7,
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <Eye size={12} />
                          View Transactions
                        </Box>
                      </Box>
                    );
                  })}

                  {/* Total row */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1.8fr 1.1fr 1fr 1fr 1fr 1fr 1.15fr",
                      px: 1.4,
                      py: 1,
                      background: "#FCFCFD",
                    }}
                  >
                    <Typography
                      sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#1F2937" }}
                    >
                      Total
                    </Typography>
                    <Box />
                    <Typography
                      sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#1F2937" }}
                    >
                      {fmt(totalDeposit, localizationData?.data)}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#F04438" }}
                    >
                      {fmt(totalUtilised, localizationData?.data)}
                    </Typography>
                    <Box />
                    <Box />
                    <Box />
                  </Box>
                </>
              )}
            </Box>
          </Box>
        </SectionCard>
      </Box>
    </>
  );

  // ─── Transactions View ─────────────────────────────────────────────────────

  const renderTransactions = () => (
    <>
      <Box
        sx={{
          position: "sticky",
          top: -1,
          zIndex: 10,
          bgcolor: "#ffffff",
          pt: 3.5,
          pb: 3,
          mx: -3,
          px: 3,
          borderBottom: "1px solid #E8EFF6",
          boxShadow: "0 2px 12px rgba(28,87,184,0.07)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px", fontWeight: 700, color: "#111827" }}>
            CD Manage / {activeAccount.id} Transactions
          </Typography>
          <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#6B7280", mt: 0.75 }}>
            {activeAccount.id} deposit transaction history
          </Typography>
        </Box>
        <Box
          onClick={() => {
            setViewPolicyId(null);
            setPage(1);
            setTxnSearch("");
            setExpandedTxId(null);
          }}
          sx={{
            height: 34,
            px: 1.5,
            borderRadius: "8px",
            border: "1px solid #D0D5DD",
            display: "inline-flex",
            alignItems: "center",
            gap: 0.65,
            fontSize: 15, lineHeight: 1.7,
            fontWeight: 500,
            color: "#374151",
            cursor: "pointer",
            "&:hover": { bgcolor: "#F9FAFB" },
          }}
        >
          <ArrowLeft size={14} />
          Back
        </Box>
        <Typography sx={{ color: "#fff", ...PORTAL_HEADER_TITLE_SX }}>
          CD Manage / {activeAccount?.cdAccountName ?? "Transactions"}
        </Typography>
      </Box>

      <Box sx={{ p: 3 }}>
        <Typography
          sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#1F2937", mb: 1.25 }}
        >
          Deposit Transactions
        </Typography>

        <SectionCard
          sx={{
            mb: 0,
            p: 0,
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "none",
          }}
        >
          {/* Transactions Toolbar */}
          <Box
            sx={{
              px: 1.2,
              py: 1.1,
              borderBottom: "1px solid #E9EEF5",
              display: "grid",
              gridTemplateColumns: "1fr auto auto auto auto auto",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                height: 32,
                minWidth: 0,
                borderRadius: "8px",
                border: "1px solid #D7E2EE",
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                px: 1.2,
                background: "#fff",
              }}
            >
              <Search size={14} color="#98A2B3" />
              <Box
                component="input"
                value={txnSearch}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTxnSearch(e.target.value)
                }
                placeholder="Search reference, remarks..."
                sx={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  fontSize: 15, lineHeight: 1.7,
                  color: "#4B5563",
                  background: "transparent",
                }}
              />
            </Box>

            <PortalSelectControl
              value={txnDateRange}
              onChange={(v) => {
                setTxnDateRange(v);
                setPage(1);
              }}
              options={DATE_RANGE_OPTIONS}
              width={120}
              height={32}
              borderRadius="8px"
              fontSize={11}
            />
            <PortalSelectControl
              value={txnTypeFilter}
              onChange={(v) => {
                setTxnTypeFilter(v);
                setPage(1);
              }}
              options={["All Types", "Deposit", "Deduction"]}
              width={116}
              height={32}
              borderRadius="8px"
              fontSize={11}
            />

            <Box
              onClick={() => {
                setTxnDateRange("Last 6 Months");
                setTxnTypeFilter("All Types");
                setTxnSearch("");
                setDebouncedTxnSearch("");
                setPage(1);
              }}
              sx={{
                height: 32,
                px: 1.2,
                borderRadius: "8px",
                border: "1px solid #D7E2EE",
                background: "#fff",
                color: "#667085",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: 15, lineHeight: 1.7,
                cursor: "pointer",
              }}
            >
              <RotateCcw size={12} />
              Reset
            </Box>

            <Box
              onClick={handleTxnsExport}
              sx={{
                height: 32,
                px: 1.4,
                borderRadius: "8px",
                background: txnsExporting ? "#6B8FC4" : "#1C57B8",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                gap: 0.65,
                fontSize: 15, lineHeight: 1.7,
                fontWeight: 600,
                cursor: txnsExporting ? "not-allowed" : "pointer",
                opacity: txnsExporting ? 0.75 : 1,
              }}
            >
              <Download size={14} />
              {txnsExporting ? "Exporting…" : "Export"}
              {!txnsExporting && <ChevronDown size={12} />}
            </Box>
          </Box>

          {/* Transactions Table */}
          <Box sx={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 320px)" }}>
            <Box sx={{ minWidth: 1100 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    "0.9fr 1fr 0.9fr 0.8fr 1fr 0.8fr 0.5fr",
                  px: 1.4,
                  py: 1.05,
                  background: "#F8FAFC",
                  borderBottom: "1px solid #E9EEF5",
                  position: "sticky",
                  top: 0,
                  zIndex: 2,
                }}
              >
                {[
                  "Date",
                  "Policy",
                  "Amount",
                  "Type",
                  "Reference ID",
                  "Running Balance",
                  "Actions",
                ].map((label) => (
                  <Typography
                    key={label}
                    sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#6B7280" }}
                  >
                    {label}
                  </Typography>
                ))}
              </Box>

              {txnLoading ? (
                <Box
                  sx={{
                    py: 4,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <CircularProgress size={20} sx={{ color: "#1C57B8" }} />
                </Box>
              ) : transactions.length === 0 ? (
                <Box sx={{ py: 8, textAlign: "center" }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: "50%", bgcolor: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2 }}>
                    <RotateCcw size={20} color="#9CA3AF" />
                  </Box>
                  <Typography sx={{ fontSize: 15, fontWeight: 600, color: "#374151", lineHeight: 1.5, mb: 0.75 }}>No transactions</Typography>
                  <Typography sx={{ fontSize: 15, color: "#9CA3AF", lineHeight: 1.7 }}>No transactions match the selected filters.</Typography>
                </Box>
              ) : (
                transactions.map((tx) => {
                  const isDeposit = tx.txnType === "Deposit";
                  const amountColor = isDeposit ? "#17B26A" : "#F04438";
                  const amountPrefix = isDeposit ? "+" : "−";

                  return (
                    <Box key={tx.txnId}>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns:
                            "0.9fr 1fr 0.9fr 0.8fr 1fr 0.8fr 0.5fr",
                          px: 1.4,
                          py: 1,
                          alignItems: "center",
                          borderBottom:
                            expandedTxId === tx.txnId
                              ? "1px solid #D5E3F2"
                              : "1px solid #EEF2F6",
                          minHeight: 56,
                          background:
                            expandedTxId === tx.txnId ? "#EAF4FF" : "#FFFFFF",
                        }}
                      >
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085" }}>
                          {dash(tx.txnDate)}
                        </Typography>
                        <Box>
                          <Typography
                            sx={{ fontSize: 15, lineHeight: 1.7, fontWeight: 600, color: "#1F2937" }}
                          >
                            {dash(tx.policyNumber)}
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            fontSize: 15, lineHeight: 1.7,
                            fontWeight: 600,
                            color: amountColor,
                          }}
                        >
                          {amountPrefix}
                          {formatAmountWithCurrency(Math.abs(tx.amount), localizationData?.data)}
                        </Typography>
                        <Box>
                          <Box
                            sx={{
                              width: "fit-content",
                              px: 0.7,
                              py: 0.22,
                              borderRadius: 999,
                              background: isDeposit ? "#ECFDF3" : "#FEF3F2",
                              color: isDeposit ? "#027A48" : "#B42318",
                              border: isDeposit
                                ? "1px solid #ABEFC6"
                                : "1px solid #FECDCA",
                              fontSize: 15, lineHeight: 1.7,
                              fontWeight: 600,
                            }}
                          >
                            {tx.txnType}
                          </Box>
                        </Box>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#98A2B3" }}>
                          {dash(tx.referenceId)}
                        </Typography>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085" }}>
                          {dash(tx.runningBalance)}
                        </Typography>
                        <Box
                          onClick={() =>
                            setExpandedTxId(
                              expandedTxId === tx.txnId ? null : tx.txnId
                            )
                          }
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            color: "#1F2937",
                            cursor: "pointer",
                          }}
                        >
                          <ChevronDown
                            size={16}
                            style={{
                              transform:
                                expandedTxId === tx.txnId
                                  ? "rotate(180deg)"
                                  : "none",
                              transition: "transform 0.18s ease",
                            }}
                          />
                        </Box>
                      </Box>

                      {expandedTxId === tx.txnId && (
                        <Box
                          sx={{
                            px: 1.4,
                            py: 1.5,
                            background: "#EAF4FF",
                            borderBottom: "1px solid #D5E3F2",
                          }}
                        >
                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1.8fr",
                              gap: 1.25,
                            }}
                          >
                            {getTxDetailFields(tx).map(([label, value], i, arr) => (
                              <Box
                                key={label}
                                sx={{
                                  minHeight: 84,
                                  pr: 1.2,
                                  borderRight:
                                    i < arr.length - 1
                                      ? "1px solid #C9D8E8"
                                      : "none",
                                }}
                              >
                                <Typography
                                  sx={{ fontSize: 15, lineHeight: 1.7, color: "#667085", mb: 1 }}
                                >
                                  {label}
                                </Typography>
                                <Typography
                                  sx={{
                                    fontSize: 15, lineHeight: 1.7,
                                    fontWeight: 600,
                                    color: "#243447",
                                    lineHeight: 1.45,
                                  }}
                                >
                                  {dash(value ?? null)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}
                    </Box>
                  );
                })
              )}
            </Box>
          </Box>

          {/* Pagination */}
          <Box
            sx={{
              px: 1.4,
              py: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #E9EEF5",
            }}
          >
            <Typography sx={{ fontSize: 15, lineHeight: 1.7, color: "#98A2B3" }}>
              {txnCount > 0
                ? `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(
                    currentPage * pageSize,
                    txnCount
                  )} of ${txnCount} transactions`
                : "No transactions"}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.55 }}>
              {[
                "Previous",
                ...Array.from({ length: Math.min(totalPages, 5) }, (_, i) =>
                  String(i + 1)
                ),
                "Next",
              ].map((item) => {
                const active = item === String(currentPage);
                return (
                  <Box
                    key={item}
                    onClick={() => {
                      if (item === "Previous") {
                        setPage((p) => Math.max(1, p - 1));
                        return;
                      }
                      if (item === "Next") {
                        setPage((p) => Math.min(totalPages, p + 1));
                        return;
                      }
                      setPage(Number(item));
                    }}
                    sx={{
                      minWidth: item.length > 1 ? 52 : 28,
                      height: 28,
                      px: item.length > 1 ? 1.1 : 0,
                      borderRadius: 999,
                      border: active ? "none" : "1px solid #E4E7EC",
                      background: active ? "#2F74D6" : "#fff",
                      color: active ? "#fff" : "#667085",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 15, lineHeight: 1.7,
                      cursor: "pointer",
                    }}
                  >
                    {item}
                  </Box>
                );
              })}
            </Box>
          </Box>
        </SectionCard>
      </Box>
    </>
  );

  return (
    <Box
      sx={{
        mx: -3,
        mt: -0.5,
        minHeight: "100%",
        background: "#EBF6FF",
      }}
    >
      {viewPolicyId !== null ? renderTransactions() : renderOverview()}
    </Box>
  );
}

export default HRPortalFinance;
