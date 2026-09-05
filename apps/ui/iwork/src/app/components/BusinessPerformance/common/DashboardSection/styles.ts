import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const SectionWrapper = styled(Box)({
  // marginTop: 20,
  marginBottom: 8,
});

export const SectionTitle = styled(Typography)({
  fontSize: "18px",
  fontWeight: 700,
  color: "#555555",
  // padding: "0 10px",
  marginBottom: 4,
});

export const SectionSubtitle = styled(Typography)({
  fontSize: "14px",
  fontWeight: 400,
  color: "#94a3b8",
  // padding: "0 10px",
  marginBottom: 16,
});
