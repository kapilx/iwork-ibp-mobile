import { Box, Typography } from "@mui/material";
import {
  Building2,
  CalendarDays,
  ChevronDown,
  CircleDollarSign,
  Eye,
  MapPin,
  Search,
  Stethoscope,
} from "lucide-react";
import {
  DataTable,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
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
  StatLabel,
  StatValue,
  StatusChip,
  SubnavBar,
  SubnavTab,
  SubnavTabs,
  TableScroll,
  TableShell,
  ToolbarFilters,
} from "./styles";

const metrics = [
  {
    label: "Total Network Hospitals",
    value: "12",
    helper: "Across 7 cities",
    tint: "#FFFFFF",
    accent: "#2B7FFF",
    Icon: Building2,
  },
  {
    label: "Hospitals Used This Year",
    value: "12",
    helper: "100% network utilisation",
    tint: "#FFFFFF",
    accent: "#00BC7D",
    Icon: Stethoscope,
  },
  {
    label: "Top Claim Hospital",
    value: "Apollo",
    helper: "142 claims · ₹21.84L",
    tint: "#FFFFFF",
    accent: "#FE9A00",
    Icon: Building2,
  },
  {
    label: "Avg Claim per Hospital",
    value: "₹10,01,300",
    helper: "Across all active hospitals",
    tint: "#FFFFFF",
    accent: "#FF2056",
    Icon: CircleDollarSign,
  },
];

const hospitalRows = [
  {
    name: "Apollo Hospitals",
    type: "Multi-Specialty",
    city: "Chennai",
    state: "Tamil Nadu",
    specialties: ["Cardiology", "Oncology", "+2"],
    claims: "142",
    amount: "₹21.84L",
    avgClaim: "₹15,380",
  },
  {
    name: "Fortis Hospital",
    type: "Multi-Specialty",
    city: "Delhi",
    state: "Delhi",
    specialties: ["Orthopedics", "Cardiology", "+2"],
    claims: "98",
    amount: "₹14.56L",
    avgClaim: "₹14,857",
  },
  {
    name: "KIMS Hospitals",
    type: "Multi-Specialty",
    city: "Hyderabad",
    state: "Telangana",
    specialties: ["Neurology", "Gastroenterology", "+2"],
    claims: "87",
    amount: "₹13.24L",
    avgClaim: "₹15,218",
  },
  {
    name: "Manipal Hospital",
    type: "Multi-Specialty",
    city: "Bangalore",
    state: "Karnataka",
    specialties: ["Orthopedics", "Cardiology", "+2"],
    claims: "76",
    amount: "₹11.80L",
    avgClaim: "₹15,526",
  },
  {
    name: "Aster Medcity",
    type: "Multi-Specialty",
    city: "Kochi",
    state: "Kerala",
    specialties: ["Cardiology", "Orthopedics", "+2"],
    claims: "58",
    amount: "₹8.76L",
    avgClaim: "₹15,103",
  },
];

export const HRPortalHospitalsV2 = () => {
  return (
    <PreviewPage>
      <PreviewSectionBody sx={{ pt: 0 }}>
        <SubnavBar sx={{ borderBottom: "1px solid #E5E7EB", pb: 0 }}>
          <SubnavTabs>
            <SubnavTab active>Network Hospitals</SubnavTab>
            <SubnavTab>Claims by Hospital</SubnavTab>
            <SubnavTab>Performance</SubnavTab>
            <SubnavTab>Agreements</SubnavTab>
          </SubnavTabs>
          <ToolbarFilters sx={{ justifyContent: "flex-end", flex: "unset" }}>
            <InputLike sx={{ background: "#093F84", color: "#FFFFFF" }}>
              GMC
              <ChevronDown size={16} color="#FFFFFF" />
            </InputLike>
            <InputLike>
              <CalendarDays size={16} color="#6A7282" />
              Apr 2025 - Mar 2026
              <ChevronDown size={16} color="#6A7282" />
            </InputLike>
          </ToolbarFilters>
        </SubnavBar>
      </PreviewSectionBody>

      <Box sx={{ px: 0.5 }}>
        <HeroTitle>Network Hospital Directory</HeroTitle>
        <HeroSubtitle>12 empanelled hospitals · GHI-2025-001</HeroSubtitle>
      </Box>

      <FourUpGrid>
        {metrics.map((metric) => (
          <PreviewSection
            key={metric.label}
            sx={{ borderTop: `4px solid ${metric.accent}` }}
          >
            <PreviewSectionBody>
              <Box sx={{ display: "flex", gap: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: `${metric.accent}14`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <metric.Icon size={20} color={metric.accent} />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <StatLabel>{metric.label}</StatLabel>
                  <StatValue
                    sx={{ fontSize: metric.value.length > 8 ? 24 : 28 }}
                  >
                    {metric.value}
                  </StatValue>
                  <Box
                    sx={{
                      mt: 1.5,
                      pt: 1.5,
                      borderTop: "1px solid #F3F4F6",
                    }}
                  >
                    <Typography sx={{ color: "#99A1AF", fontSize: 15, lineHeight: 1.7 }}>
                      {metric.helper}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </PreviewSectionBody>
          </PreviewSection>
        ))}
      </FourUpGrid>

      <PreviewSection>
        <PreviewSectionBody sx={{ pb: 0 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <ToolbarFilters>
              <SearchBox sx={{ minWidth: 208 }}>
                <Search size={14} color="#9CA3AF" />
                Search hospital or city...
              </SearchBox>
              <InputLike sx={{ minWidth: 94 }}>
                All Cities
                <ChevronDown size={14} color="#6A7282" />
              </InputLike>
              <InputLike sx={{ minWidth: 123 }}>
                All Specialties
                <ChevronDown size={14} color="#6A7282" />
              </InputLike>
              <InputLike sx={{ minWidth: 98 }}>
                All Status
                <ChevronDown size={14} color="#6A7282" />
              </InputLike>
              <InputLike sx={{ minWidth: 58 }}>
                All
                <ChevronDown size={14} color="#6A7282" />
              </InputLike>
            </ToolbarFilters>
            <Typography sx={{ color: "#99A1AF", fontSize: 15, lineHeight: 1.7 }}>
              12 results
            </Typography>
          </Box>
        </PreviewSectionBody>

        <TableShell sx={{ mx: 3, mb: 3 }}>
          <TableScroll>
            <DataTable>
              <DataTableHead>
                <tr>
                  <DataTableHeaderCell>Hospital Name</DataTableHeaderCell>
                  <DataTableHeaderCell>City</DataTableHeaderCell>
                  <DataTableHeaderCell>Specialities</DataTableHeaderCell>
                  <DataTableHeaderCell>Cashless</DataTableHeaderCell>
                  <DataTableHeaderCell>Total Claims</DataTableHeaderCell>
                  <DataTableHeaderCell>Total Amount</DataTableHeaderCell>
                  <DataTableHeaderCell>Avg Claim</DataTableHeaderCell>
                  <DataTableHeaderCell>Status</DataTableHeaderCell>
                  <DataTableHeaderCell>Action</DataTableHeaderCell>
                </tr>
              </DataTableHead>
              <tbody>
                {hospitalRows.map((row) => (
                  <tr key={row.name}>
                    <DataTableCell>
                      <Box
                        sx={{
                          display: "flex",
                          gap: 1.25,
                          alignItems: "center",
                        }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: "#CBFBF1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#0F766E",
                            fontSize: 15, lineHeight: 1.7,
                            fontWeight: 700,
                          }}
                        >
                          {row.name
                            .split(" ")
                            .slice(0, 2)
                            .map((word) => word[0])
                            .join("")}
                        </Box>
                        <Box>
                          <RowTitle>{row.name}</RowTitle>
                          <RowSubtitle>{row.type}</RowSubtitle>
                        </Box>
                      </Box>
                    </DataTableCell>
                    <DataTableCell>
                      <Box sx={{ display: "flex", gap: 0.75 }}>
                        <MapPin size={12} color="#99A1AF" />
                        <Box>
                          <Typography sx={{ fontSize: 15, lineHeight: 1.7 }}>
                            {row.city}
                          </Typography>
                          <RowSubtitle sx={{ mt: 0 }}>{row.state}</RowSubtitle>
                        </Box>
                      </Box>
                    </DataTableCell>
                    <DataTableCell>
                      <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
                        {row.specialties.map((specialty) => (
                          <Box
                            key={`${row.name}-${specialty}`}
                            sx={{
                              px: specialty.startsWith("+") ? 0 : 0.75,
                              py: specialty.startsWith("+") ? 0.5 : 0.25,
                              borderRadius: 999,
                              background: specialty.startsWith("+")
                                ? "transparent"
                                : "#EFF6FF",
                              color: specialty.startsWith("+")
                                ? "#99A1AF"
                                : "#155DFC",
                              fontSize: 15, lineHeight: 1.7,
                            }}
                          >
                            {specialty}
                          </Box>
                        ))}
                      </Box>
                    </DataTableCell>
                    <DataTableCell>
                      <StatusChip
                        label="Yes"
                        chipbg="#ECFDF3"
                        chipcolor="#027A48"
                        chipborder="#ABEFC6"
                      />
                    </DataTableCell>
                    <DataTableCell>{row.claims}</DataTableCell>
                    <DataTableCell>{row.amount}</DataTableCell>
                    <DataTableCell>{row.avgClaim}</DataTableCell>
                    <DataTableCell>
                      <StatusChip
                        label="Active"
                        chipbg="#ECFDF3"
                        chipcolor="#027A48"
                        chipborder="#ABEFC6"
                      />
                    </DataTableCell>
                    <DataTableCell>
                      <Box
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          color: "#10B981",
                          fontSize: 15, lineHeight: 1.7,
                          fontWeight: 600,
                        }}
                      >
                        <Eye size={12} />
                        View Details
                      </Box>
                    </DataTableCell>
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
          <Typography sx={{ fontSize: 15, lineHeight: 1.7 }}>Showing 1-8 of 12</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <InputLike sx={{ minWidth: 75, height: 28, fontSize: 15, lineHeight: 1.7 }}>
              Previous
            </InputLike>
            <InputLike
              sx={{ minWidth: 28, height: 28, justifyContent: "center" }}
            >
              1
            </InputLike>
            <InputLike
              sx={{ minWidth: 28, height: 28, justifyContent: "center" }}
            >
              2
            </InputLike>
            <InputLike sx={{ minWidth: 53, height: 28, fontSize: 15, lineHeight: 1.7 }}>
              Next
            </InputLike>
          </Box>
        </Box>
      </PreviewSection>
    </PreviewPage>
  );
};

export default HRPortalHospitalsV2;
