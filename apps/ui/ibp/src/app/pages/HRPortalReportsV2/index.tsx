import { Box, Button, Typography } from "@mui/material";
import {
  ArrowRight,
  Banknote,
  FileSpreadsheet,
  Mail,
  Users,
} from "lucide-react";
import {
  FourUpGrid,
  HeroSubtitle,
  HeroTitle,
  PreviewPage,
  PreviewSection,
  PreviewSectionBody,
  RowSubtitle,
  RowTitle,
} from "./styles";

const categoryCards = [
  {
    title: "Employee Reports",
    description: "Employee data, enrollment, and demographic reports.",
    count: "4 reports",
    accent: "#2B7FFF",
    bg: "#EFF6FF",
    Icon: Users,
    active: true,
  },
  {
    title: "Claims Reports",
    description: "Claim performance, TAT, and status reports.",
    count: "4 reports",
    accent: "#8B5CF6",
    bg: "#F5F3FF",
    Icon: FileSpreadsheet,
  },
  {
    title: "Communication Reports",
    description: "Email and communication tracking reports.",
    count: "2 reports",
    accent: "#10B981",
    bg: "#ECFDF5",
    Icon: Mail,
  },
  {
    title: "Finance Reports",
    description: "Premium payments and financial tracking reports.",
    count: "1 reports",
    accent: "#F59E0B",
    bg: "#FFFBEB",
    Icon: Banknote,
  },
];

const employeeReports = [
  {
    title: "Demography Report",
    description:
      "Age, gender, and city distribution across the enrolled workforce.",
    updated: "25 Feb 2026",
    metric: "1,185 employees",
    accent: "#8B5CF6",
  },
  {
    title: "Enrollment Report",
    description:
      "View enrollment status by employee across all active policies.",
    updated: "28 Feb 2026",
    metric: "1,185 records",
    accent: "#2B7FFF",
  },
  {
    title: "Employee Difference Report",
    description: "Compare base roster vs endorsement additions and deletions.",
    updated: "20 Feb 2026",
    metric: "42 changes",
    accent: "#F59E0B",
  },
  {
    title: "Login Credential Report",
    description: "Employees with missing or unset portal login credentials.",
    updated: "01 Mar 2026",
    metric: "22 missing",
    accent: "#FB2C36",
  },
];

export const HRPortalReportsV2 = () => {
  return (
    <PreviewPage>
      <Box sx={{ px: 0.5 }}>
        <HeroTitle>Reports</HeroTitle>
        <HeroSubtitle>
          Generate and export HR insurance data reports.
        </HeroSubtitle>
      </Box>

      <FourUpGrid>
        {categoryCards.map((card) => (
          <PreviewSection
            key={card.title}
            sx={{
              background: card.active ? "#EFF6FF" : "#FFFFFF",
              border: card.active ? "2px solid #2B7FFF" : "2px solid #F3F4F6",
              minHeight: 201,
            }}
          >
            <PreviewSectionBody>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: card.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <card.Icon size={18} color={card.accent} />
                </Box>
                <ArrowRight
                  size={16}
                  color={card.active ? "#2B7FFF" : "#9CA3AF"}
                />
              </Box>
              <Typography
                sx={{
                  mt: 3,
                  color: card.active ? "#2B7FFF" : "#101828",
                  fontSize: 15, lineHeight: 1.7,
                  fontWeight: 700,
                  lineHeight: "20px",
                }}
              >
                {card.title}
              </Typography>
              <Typography
                sx={{
                  mt: 1,
                  color: card.active ? "rgba(43, 127, 255, 0.78)" : "#99A1AF",
                  fontSize: 15, lineHeight: 1.7,
                  lineHeight: "19px",
                }}
              >
                {card.description}
              </Typography>
              <Box
                sx={{
                  mt: 3,
                  display: "inline-flex",
                  px: 1.25,
                  py: 0.75,
                  borderRadius: 999,
                  background: card.active
                    ? "rgba(255,255,255,0.55)"
                    : "#F3F4F6",
                  color: card.active ? "#2B7FFF" : "#6A7282",
                  fontSize: 15, lineHeight: 1.7,
                  fontWeight: 600,
                }}
              >
                {card.count}
              </Box>
            </PreviewSectionBody>
          </PreviewSection>
        ))}
      </FourUpGrid>

      <PreviewSection sx={{ background: "#EFF6FF" }}>
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={16} color="#2B7FFF" />
            </Box>
            <Box>
              <Typography
                sx={{ color: "#2B7FFF", fontSize: 20, lineHeight: 1.4, letterSpacing: "-0.2px", fontWeight: 700 }}
              >
                Employee Reports
              </Typography>
              <Typography sx={{ color: "rgba(43,127,255,0.6)", fontSize: 15, lineHeight: 1.7 }}>
                4 reports
              </Typography>
            </Box>
          </Box>
          <ArrowRight size={14} color="#9CA3AF" />
        </Box>

        <PreviewSectionBody sx={{ pt: 2.5 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 2,
              "@media (max-width: 900px)": {
                gridTemplateColumns: "1fr",
              },
            }}
          >
            {employeeReports.map((report) => (
              <Box
                key={report.title}
                sx={{
                  background: "rgba(249,250,251,0.75)",
                  borderRadius: 2.5,
                  p: 3,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  alignItems: "flex-start",
                }}
              >
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FileSpreadsheet size={16} color={report.accent} />
                  </Box>
                  <Box>
                    <RowTitle>{report.title}</RowTitle>
                    <RowSubtitle sx={{ maxWidth: 360 }}>
                      {report.description}
                    </RowSubtitle>
                    <Box sx={{ display: "flex", gap: 2, mt: 1.5 }}>
                      <Typography sx={{ color: "#99A1AF", fontSize: 15, lineHeight: 1.7 }}>
                        {report.updated}
                      </Typography>
                      <Typography sx={{ color: "#4A5565", fontSize: 15, lineHeight: 1.7 }}>
                        {report.metric}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Button
                  endIcon={<ArrowRight size={12} />}
                  sx={{
                    textTransform: "none",
                    borderRadius: 16,
                    height: 32,
                    color: "#2B7FFF",
                    background: "#EFF6FF",
                    px: 1.5,
                  }}
                >
                  Open
                </Button>
              </Box>
            ))}
          </Box>
        </PreviewSectionBody>
      </PreviewSection>
    </PreviewPage>
  );
};

export default HRPortalReportsV2;
