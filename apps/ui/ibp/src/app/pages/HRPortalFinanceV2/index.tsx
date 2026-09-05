import { useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { useLocation } from "react-router-dom";
import {
  Banknote,
  CalendarClock,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Download,
  Search,
  Wallet,
} from "lucide-react";
import {
  DataTable,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  FooterNote,
  FourUpGrid,
  HeroSubtitle,
  HeroTitle,
  InputLike,
  PreviewPage,
  PreviewSection,
  PreviewSectionBody,
  RowSubtitle,
  RowTitle,
  SearchBox,
  StatusChip,
  TableScroll,
  TableShell,
  ToolbarFilters,
} from "./styles";

const kpis = [
  {
    value: "₹48.50L",
    label: "Total Deposit Balance",
    helper: "Across 3 active policies",
    trend: "+₹18.0L",
    subtrend: "vs last qtr",
    accent: "#3B82F6",
    Icon: Wallet,
  },
  {
    value: "₹31.20L",
    label: "Utilised Amount",
    helper: "64.3% of total deposit",
    trend: "+₹6.2L",
    subtrend: "vs last mth",
    accent: "#8B5CF6",
    Icon: CircleDollarSign,
  },
  {
    value: "₹6.84L",
    label: "Pending Claims",
    helper: "2 in progress",
    trend: "2 pending",
    subtrend: "awaiting approval",
    accent: "#F59E0B",
    Icon: Banknote,
  },
  {
    value: "15 Feb 2026",
    label: "Last Deposit Date",
    helper: "GMC - ₹10.0L via RTGS",
    trend: "On schedule",
    subtrend: "next due in 12d",
    accent: "#10B981",
    Icon: CalendarClock,
  },
];

const accountRows = [
  {
    name: "Group Mediclaim Cover",
    code: "GMC",
    number: "GHI-2025-001",
    balance: "₹25.00L",
    pendingClaims: "₹4,20,500",
    utilised: "₹18.45L",
    utilisation: 74,
    updated: "15 Feb 2026",
  },
  {
    name: "Group Personal Accident",
    code: "GPA",
    number: "GPA-2025-001",
    balance: "₹14.50L",
    pendingClaims: "₹1,84,700",
    utilised: "₹8.96L",
    utilisation: 62,
    updated: "10 Feb 2026",
  },
  {
    name: "Group Term Life",
    code: "GTL",
    number: "GTL-2025-001",
    balance: "₹9.00L",
    pendingClaims: "₹79,000",
    utilised: "₹3.79L",
    utilisation: 42,
    updated: "28 Jan 2026",
  },
];

const transactionRows = [
  {
    date: "20 Feb 2026",
    policy: "GMC",
    policyNo: "GHI-2025-001",
    employee: "Ramesh Kulkarni",
    initials: "RK",
    amount: "-₹1,85,400",
    type: "Deduction",
    mode: "NEFT",
    status: "Completed",
    reference: "TXN202602200001",
  },
  {
    date: "18 Feb 2026",
    policy: "GMC",
    policyNo: "GHI-2025-001",
    employee: "—",
    initials: "",
    amount: "+₹10,00,000",
    type: "Deposit",
    mode: "RTGS",
    status: "Completed",
    reference: "TXN202602180001",
  },
  {
    date: "15 Feb 2026",
    policy: "GPA",
    policyNo: "GPA-2025-001",
    employee: "Lalitha Menon",
    initials: "LM",
    amount: "-₹1,12,200",
    type: "Deduction",
    mode: "NEFT",
    status: "Completed",
    reference: "TXN202602150001",
  },
  {
    date: "12 Feb 2026",
    policy: "GMC",
    policyNo: "GHI-2025-001",
    employee: "Suresh Pillai",
    initials: "SP",
    amount: "-₹98,600",
    type: "Deduction",
    mode: "NEFT",
    status: "Processing",
    reference: "TXN202602120001",
  },
  {
    date: "10 Feb 2026",
    policy: "GTL",
    policyNo: "GTL-2025-001",
    employee: "—",
    initials: "",
    amount: "+₹5,00,000",
    type: "Deposit",
    mode: "RTGS",
    status: "Completed",
    reference: "TXN202602100001",
  },
];

const statusConfig = {
  Completed: { bg: "#ECFDF3", color: "#027A48", border: "#ABEFC6" },
  Processing: { bg: "#EFF8FF", color: "#175CD3", border: "#B2DDFF" },
  Pending: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
};

export const HRPortalFinanceV2 = () => {
  const location = useLocation();
  const highlightedAccount = (location.state as { accountCode?: string } | null)?.accountCode ?? null;

  useEffect(() => {
    if (highlightedAccount) {
      setTimeout(() => {
        document.getElementById(`cd-account-${highlightedAccount}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 200);
    }
  }, [highlightedAccount]);

  return (
    <PreviewPage>
      <Box sx={{ px: 0.5 }}>
        <HeroTitle>CD Manage</HeroTitle>
        <HeroSubtitle>Cash Deposit Management</HeroSubtitle>
      </Box>

      <FourUpGrid>
        {kpis.map((kpi) => (
          <PreviewSection key={kpi.label}>
            <PreviewSectionBody>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: `${kpi.accent}14`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <kpi.Icon size={17} color={kpi.accent} />
                </Box>
                <Typography
                  sx={{ color: "#101828", fontSize: 28, lineHeight: 1.25, letterSpacing: "-0.4px", fontWeight: 700 }}
                >
                  {kpi.value}
                </Typography>
              </Box>
              <Box
                sx={{
                  mt: 2,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    height: 36,
                    borderRadius: 2,
                    background:
                      "linear-gradient(180deg, rgba(59,130,246,0.10) 0%, rgba(255,255,255,0) 100%)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      position: "absolute",
                      inset: "auto 0 10px 0",
                      height: 2,
                      background: kpi.accent,
                    }}
                  />
                </Box>
                <Box sx={{ pl: 2, borderLeft: "1px solid #E5E7EB" }}>
                  <Typography
                    sx={{ color: kpi.accent, fontSize: 15, lineHeight: 1.7, fontWeight: 700 }}
                  >
                    {kpi.trend}
                  </Typography>
                  <Typography sx={{ color: "#99A1AF", fontSize: 15, lineHeight: 1.7 }}>
                    {kpi.subtrend}
                  </Typography>
                </Box>
              </Box>
              <Typography
                sx={{
                  color: "#364153",
                  fontSize: 15, lineHeight: 1.7,
                  fontWeight: 600,
                  mt: 2.5,
                }}
              >
                {kpi.label}
              </Typography>
              <Typography sx={{ color: "#99A1AF", fontSize: 15, lineHeight: 1.7, mt: 0.75 }}>
                {kpi.helper}
              </Typography>
            </PreviewSectionBody>
          </PreviewSection>
        ))}
      </FourUpGrid>

      <PreviewSection>
        <Box
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #F3F4F6",
          }}
        >
          <RowTitle sx={{ fontSize: 24, lineHeight: 1.35, letterSpacing: "-0.3px" }}>Account Details</RowTitle>
          <ToolbarFilters sx={{ justifyContent: "flex-end", flex: "unset" }}>
            <SearchBox sx={{ minWidth: 208, height: 32 }}>
              <Search size={16} color="#9CA3AF" />
              Search policy, reference...
            </SearchBox>
            <InputLike sx={{ minWidth: 102, height: 32 }}>
              <Download size={14} color="#6A7282" />
              Export
              <ChevronDown size={12} color="#6A7282" />
            </InputLike>
          </ToolbarFilters>
        </Box>

        <TableShell sx={{ mx: 3, mt: 3 }}>
          <TableScroll>
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeaderCell>Policy Name</DataTableHeaderCell>
                  <DataTableHeaderCell>Policy Number</DataTableHeaderCell>
                  <DataTableHeaderCell>Deposit Balance</DataTableHeaderCell>
                  <DataTableHeaderCell>Pending Claims</DataTableHeaderCell>
                  <DataTableHeaderCell>Utilised Amount</DataTableHeaderCell>
                  <DataTableHeaderCell>Utilisation</DataTableHeaderCell>
                  <DataTableHeaderCell>Last Updated</DataTableHeaderCell>
                  <DataTableHeaderCell>Action</DataTableHeaderCell>
                </tr>
              </DataTableHead>
              <tbody>
                {accountRows.map((row) => (
                  <tr key={row.name} id={`cd-account-${row.code}`} style={highlightedAccount === row.code ? { background: "#EEF6FF", outline: "2px solid #3158F5" } : undefined}>
                    <DataTableCell>
                      <RowTitle>{row.name}</RowTitle>
                      <Box
                        sx={{
                          mt: 1,
                          display: "inline-flex",
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 999,
                          background: "#EEF2FF",
                          color: "#155DFC",
                          fontSize: 15, lineHeight: 1.7,
                          fontWeight: 600,
                        }}
                      >
                        {row.code}
                      </Box>
                    </DataTableCell>
                    <DataTableCell>{row.number}</DataTableCell>
                    <DataTableCell>{row.balance}</DataTableCell>
                    <DataTableCell sx={{ color: "#F54900" }}>
                      {row.pendingClaims}
                    </DataTableCell>
                    <DataTableCell sx={{ color: "#FB2C36" }}>
                      {row.utilised}
                    </DataTableCell>
                    <DataTableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 94,
                            height: 6,
                            borderRadius: 999,
                            background: "#E5E7EB",
                          }}
                        >
                          <Box
                            sx={{
                              width: `${row.utilisation}%`,
                              height: "100%",
                              borderRadius: 999,
                              background:
                                row.utilisation > 70
                                  ? "#F59E0B"
                                  : row.utilisation > 50
                                  ? "#FBBF24"
                                  : "#10B981",
                            }}
                          />
                        </Box>
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7 }}>
                          {row.utilisation}%
                        </Typography>
                      </Box>
                    </DataTableCell>
                    <DataTableCell>{row.updated}</DataTableCell>
                    <DataTableCell>
                      <Typography
                        sx={{ color: "#155DFC", fontSize: 15, lineHeight: 1.7, fontWeight: 600 }}
                      >
                        View Transactions
                      </Typography>
                    </DataTableCell>
                  </tr>
                ))}
                <tr>
                  <DataTableCell>
                    <RowTitle>Total</RowTitle>
                  </DataTableCell>
                  <DataTableCell />
                  <DataTableCell>₹48.50L</DataTableCell>
                  <DataTableCell sx={{ color: "#F54900" }}>
                    ₹6,84,200
                  </DataTableCell>
                  <DataTableCell sx={{ color: "#FB2C36" }}>
                    ₹31.20L
                  </DataTableCell>
                  <DataTableCell />
                  <DataTableCell />
                  <DataTableCell />
                </tr>
              </tbody>
            </DataTable>
          </TableScroll>
        </TableShell>
      </PreviewSection>

      <PreviewSection>
        <Box
          sx={{
            px: 3,
            py: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #F3F4F6",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Clock3 size={14} color="#6A7282" />
            <RowTitle>Deposit Transactions</RowTitle>
            <Typography sx={{ color: "#D1D5DC", fontSize: 15, lineHeight: 1.7 }}>
              20 records
            </Typography>
          </Box>
          <InputLike sx={{ minWidth: 102, height: 32 }}>
            <Download size={14} color="#6A7282" />
            Export
            <ChevronDown size={12} color="#6A7282" />
          </InputLike>
        </Box>

        <PreviewSectionBody>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <ToolbarFilters>
              <InputLike sx={{ minWidth: 90, height: 32 }}>
                All Policies
                <ChevronDown size={12} color="#6A7282" />
              </InputLike>
              <InputLike sx={{ minWidth: 78, height: 32 }}>
                This Year
                <ChevronDown size={12} color="#6A7282" />
              </InputLike>
              <InputLike sx={{ minWidth: 86, height: 32 }}>
                All Types
                <ChevronDown size={12} color="#6A7282" />
              </InputLike>
              <InputLike sx={{ minWidth: 86, height: 32 }}>
                All Status
                <ChevronDown size={12} color="#6A7282" />
              </InputLike>
            </ToolbarFilters>
            <SearchBox sx={{ minWidth: 188, height: 32 }}>
              <Search size={16} color="#9CA3AF" />
              Search employee, reference...
            </SearchBox>
          </Box>
        </PreviewSectionBody>

        <TableShell sx={{ mx: 3, mb: 3 }}>
          <TableScroll>
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeaderCell>Date</DataTableHeaderCell>
                  <DataTableHeaderCell>Policy</DataTableHeaderCell>
                  <DataTableHeaderCell>Employee Name</DataTableHeaderCell>
                  <DataTableHeaderCell>Amount</DataTableHeaderCell>
                  <DataTableHeaderCell>Type</DataTableHeaderCell>
                  <DataTableHeaderCell>Mode</DataTableHeaderCell>
                  <DataTableHeaderCell>Status</DataTableHeaderCell>
                  <DataTableHeaderCell>Reference ID</DataTableHeaderCell>
                </tr>
              </DataTableHead>
              <tbody>
                {transactionRows.map((row) => (
                  <tr key={row.reference}>
                    <DataTableCell>{row.date}</DataTableCell>
                    <DataTableCell>
                      <RowTitle>{row.policy}</RowTitle>
                      <RowSubtitle>{row.policyNo}</RowSubtitle>
                    </DataTableCell>
                    <DataTableCell>
                      <Box
                        sx={{ display: "flex", gap: 1, alignItems: "center" }}
                      >
                        {row.initials ? (
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: "50%",
                              background: "#DBEAFE",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#155DFC",
                              fontSize: 15, lineHeight: 1.7,
                              fontWeight: 700,
                            }}
                          >
                            {row.initials}
                          </Box>
                        ) : null}
                        <Typography sx={{ fontSize: 15, lineHeight: 1.7 }}>
                          {row.employee}
                        </Typography>
                      </Box>
                    </DataTableCell>
                    <DataTableCell
                      sx={{
                        color: row.amount.startsWith("+")
                          ? "#00A76F"
                          : "#FB2C36",
                        fontWeight: 700,
                      }}
                    >
                      {row.amount}
                    </DataTableCell>
                    <DataTableCell>
                      <StatusChip
                        label={row.type}
                        chipbg={row.type === "Deposit" ? "#ECFDF3" : "#FEF2F2"}
                        chipcolor={
                          row.type === "Deposit" ? "#027A48" : "#B42318"
                        }
                        chipborder={
                          row.type === "Deposit" ? "#ABEFC6" : "#FECDCA"
                        }
                      />
                    </DataTableCell>
                    <DataTableCell>{row.mode}</DataTableCell>
                    <DataTableCell>
                      <StatusChip
                        label={row.status}
                        chipbg={
                          statusConfig[row.status as keyof typeof statusConfig]
                            .bg
                        }
                        chipcolor={
                          statusConfig[row.status as keyof typeof statusConfig]
                            .color
                        }
                        chipborder={
                          statusConfig[row.status as keyof typeof statusConfig]
                            .border
                        }
                      />
                    </DataTableCell>
                    <DataTableCell>{row.reference}</DataTableCell>
                  </tr>
                ))}
              </tbody>
            </DataTable>
          </TableScroll>
        </TableShell>

        <Box
          sx={{
            px: 3,
            pb: 2.5,
            display: "flex",
            justifyContent: "space-between",
            color: "#99A1AF",
            fontSize: 15, lineHeight: 1.7,
          }}
        >
          <Typography sx={{ fontSize: 15, lineHeight: 1.7 }}>
            Showing 1-8 of 20 transactions
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {["Previous", "1", "2", "3", "Next"].map((item) => (
              <InputLike
                key={item}
                sx={{
                  minWidth: item.length > 1 ? "auto" : 28,
                  height: 28,
                  justifyContent: "center",
                  px: item.length > 1 ? 1.5 : 1,
                  background: item === "1" ? "#F59E0B" : "#FFFFFF",
                  color: item === "1" ? "#FFFFFF" : "#6A7282",
                }}
              >
                {item}
              </InputLike>
            ))}
          </Box>
        </Box>
      </PreviewSection>

      <FooterNote>
        CD Manage · FY 2025-26 · GMC GHI-2025-001 · Data as of 02 Mar 2026 · All
        amounts in INR
      </FooterNote>
    </PreviewPage>
  );
};

export default HRPortalFinanceV2;
