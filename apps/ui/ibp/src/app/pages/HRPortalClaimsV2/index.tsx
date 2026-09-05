import { Box, Typography } from "@mui/material";
import { capitalizeFirst } from "../../utils";
import {
  CalendarDays,
  ChevronDown,
  Download,
  Search,
  Upload,
} from "lucide-react";
import { CLAIMS_KPIS, CLAIMS_ROWS, CLAIMS_TABS } from "./constants";
import {
  ActionButton,
  DataTable,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  GhostButton,
  HeroRow,
  HeroSubtitle,
  HeroTitle,
  InputLike,
  PreviewPage,
  PreviewSection,
  PreviewSectionBody,
  RowSubtitle,
  RowTitle,
  SearchBox,
  StatCard,
  StatLabel,
  StatValue,
  StatsGrid,
  StatusChip,
  SubnavBar,
  SubnavTab,
  SubnavTabs,
  TableScroll,
  TableShell,
  ToolbarFilters,
  ToolbarRow,
} from "./styles";

const statusStyles = {
  Paid: { bg: "#ECFDF3", color: "#027A48", border: "#ABEFC6" },
  Outstanding: { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" },
  Rejected: { bg: "#FEF2F2", color: "#B42318", border: "#FECDCA" },
  Closed: { bg: "#F2F4F7", color: "#344054", border: "#D0D5DD" },
  Denied: { bg: "#FEF3F2", color: "#912018", border: "#F4C7C3" },
  Processing: { bg: "#EFF8FF", color: "#175CD3", border: "#B2DDFF" },
};

const tatStyles = (tat: number) => {
  if (tat <= 10) {
    return { bg: "#ECFDF3", color: "#027A48", border: "#ABEFC6" };
  }

  if (tat <= 20) {
    return { bg: "#FFF7ED", color: "#C2410C", border: "#FED7AA" };
  }

  return { bg: "#FEF2F2", color: "#B42318", border: "#FECDCA" };
};

export const HRPortalClaimsV2 = () => {
  return (
    <PreviewPage>
      <PreviewSection>
        <PreviewSectionBody>
          <HeroRow>
            <Box>
              <HeroTitle>All Claims</HeroTitle>
              <HeroSubtitle>15 of 25 claims</HeroSubtitle>
            </Box>
            <ActionButton startIcon={<Upload size={16} />}>
              Upload
            </ActionButton>
          </HeroRow>
        </PreviewSectionBody>
      </PreviewSection>

      <PreviewSection>
        <PreviewSectionBody sx={{ py: 0 }}>
          <SubnavBar>
            <SubnavTabs>
              {CLAIMS_TABS.map((tab) => (
                <SubnavTab key={tab.id} active={tab.active}>
                  {tab.label}
                </SubnavTab>
              ))}
            </SubnavTabs>
            <ToolbarFilters sx={{ justifyContent: "flex-start", flex: 1 }}>
              <InputLike>
                Group Health Insurance
                <ChevronDown size={16} color="#6A7282" />
              </InputLike>
              <InputLike sx={{ ml: "auto" }}>
                <CalendarDays size={16} color="#6A7282" />
                Apr 2025 - Mar 2026
                <ChevronDown size={16} color="#6A7282" />
              </InputLike>
            </ToolbarFilters>
          </SubnavBar>
        </PreviewSectionBody>
      </PreviewSection>

      <StatsGrid>
        {CLAIMS_KPIS.map((item) => (
          <StatCard key={item.id} tint={item.tint}>
            <StatLabel>{item.label}</StatLabel>
            <StatValue>{item.value}</StatValue>
          </StatCard>
        ))}
      </StatsGrid>

      <PreviewSection>
        <PreviewSectionBody>
          <ToolbarRow>
            <ToolbarFilters>
              <SearchBox>
                <Search size={16} color="#9CA3AF" />
                Search claim, employee or TPA
              </SearchBox>
              <InputLike>
                Claim Status
                <ChevronDown size={16} color="#6A7282" />
              </InputLike>
              <InputLike>
                Claim Type
                <ChevronDown size={16} color="#6A7282" />
              </InputLike>
              <InputLike>
                Date Range
                <ChevronDown size={16} color="#6A7282" />
              </InputLike>
            </ToolbarFilters>
            <GhostButton startIcon={<Download size={16} />}>Export</GhostButton>
          </ToolbarRow>

          <TableShell sx={{ mt: 3 }}>
            <TableScroll>
              <DataTable>
                <DataTableHead>
                  <tr>
                    <DataTableHeaderCell>Claim Number</DataTableHeaderCell>
                    <DataTableHeaderCell>Employee ID</DataTableHeaderCell>
                    <DataTableHeaderCell>Employee Name</DataTableHeaderCell>
                    <DataTableHeaderCell>Relation</DataTableHeaderCell>
                    <DataTableHeaderCell>TPA ID</DataTableHeaderCell>
                    <DataTableHeaderCell>Claim Type</DataTableHeaderCell>
                    <DataTableHeaderCell>Claim Date</DataTableHeaderCell>
                    <DataTableHeaderCell>Claim Amount</DataTableHeaderCell>
                    <DataTableHeaderCell>Settled Amount</DataTableHeaderCell>
                    <DataTableHeaderCell>Status</DataTableHeaderCell>
                    <DataTableHeaderCell>TAT / Aging</DataTableHeaderCell>
                  </tr>
                </DataTableHead>
                <tbody>
                  {CLAIMS_ROWS.map((row) => {
                    const tatStyle = tatStyles(row.tat);

                    return (
                      <tr key={row.id}>
                        <DataTableCell>
                          <RowTitle>{row.id}</RowTitle>
                          <RowSubtitle>{row.dept}</RowSubtitle>
                        </DataTableCell>
                        <DataTableCell>{row.empId}</DataTableCell>
                        <DataTableCell>
                          <RowTitle>{row.empName}</RowTitle>
                          <RowSubtitle>{capitalizeFirst(row.relation)}</RowSubtitle>
                        </DataTableCell>
                        <DataTableCell>{capitalizeFirst(row.relation)}</DataTableCell>
                        <DataTableCell>{row.tpaId}</DataTableCell>
                        <DataTableCell>{row.claimType}</DataTableCell>
                        <DataTableCell>{row.claimDate}</DataTableCell>
                        <DataTableCell>{row.claimAmountExact}</DataTableCell>
                        <DataTableCell>{row.settledAmountExact}</DataTableCell>
                        <DataTableCell>
                          <StatusChip
                            label={row.status}
                            chipbg={statusStyles[row.status].bg}
                            chipcolor={statusStyles[row.status].color}
                            chipborder={statusStyles[row.status].border}
                          />
                        </DataTableCell>
                        <DataTableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <StatusChip
                              label={`${row.tat} days`}
                              chipbg={tatStyle.bg}
                              chipcolor={tatStyle.color}
                              chipborder={tatStyle.border}
                            />
                            <Typography
                              sx={{
                                color: "#6A7282",
                                fontSize: 15, lineHeight: 1.7,
                                lineHeight: "16px",
                              }}
                            >
                              aging
                            </Typography>
                          </Box>
                        </DataTableCell>
                      </tr>
                    );
                  })}
                </tbody>
              </DataTable>
            </TableScroll>
          </TableShell>
        </PreviewSectionBody>
      </PreviewSection>
    </PreviewPage>
  );
};

export default HRPortalClaimsV2;
