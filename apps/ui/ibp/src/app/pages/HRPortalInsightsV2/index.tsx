import { Box, Typography } from "@mui/material";
import { Construction } from "lucide-react";

export function HRPortalInsightsV2() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 560,
        py: 8,
        px: 3,
        textAlign: "center",
      }}
    >
      {/* Icon badge */}
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: "20px",
          bgcolor: "#FFF7ED",
          border: "2px solid #FED7AA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 3,
        }}
      >
        <Construction size={36} color="#F97316" />
      </Box>

      {/* Heading */}
      <Typography
        sx={{
          fontSize: 26,
          fontWeight: 800,
          color: "#111827",
          lineHeight: 1.3,
          mb: 1.5,
        }}
      >
        Work in Progress
      </Typography>

      {/* Subtitle */}
      <Typography
        sx={{
          fontSize: 16,
          color: "#6B7280",
          maxWidth: 420,
          lineHeight: 1.7,
          mb: 3,
        }}
      >
        The <strong>Support Ticket</strong> feature is currently under development.
        We're working hard to bring it to you soon.
      </Typography>

      {/* Badge */}
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          px: 2,
          py: 0.75,
          borderRadius: "20px",
          bgcolor: "#FFF7ED",
          border: "1px solid #FED7AA",
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "#F97316",
            animation: "pulse 1.5s ease-in-out infinite",
            "@keyframes pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.3 },
            },
          }}
        />
        <Typography sx={{ fontSize: 14, fontWeight: 600, color: "#C2410C" }}>
          Coming Soon
        </Typography>
      </Box>
    </Box>
  );
}

export default HRPortalInsightsV2;
