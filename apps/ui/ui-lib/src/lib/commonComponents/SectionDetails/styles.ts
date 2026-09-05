import { Box, Button, Paper, Typography } from "@mui/material";
import styled from "styled-components";

export const SectionDetailsStyledPaper = styled(Paper)({
  padding: "24px",
  marginBottom: "32px",
  borderRadius: "12px",
});

export const SectionDetailsStyledBox = styled(Box)({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
});

export const SectionDetailsIconContainer = styled(Box)({
  display: "inline-flex",
  backgroundColor: "#E3F2FD",
  color: "#1976D2",
  padding: "16px",
  borderRadius: "50%",
  marginRight: "12px",
});

export const PlaceholderBox = styled(Box)({
  textAlign: "center",
  padding: "48px 0",
  border: "1px dashed",
  borderColor: "#BDBDBD",
  borderRadius: "8px",
});

export const FormActionsContainer = styled(Box)({
  display: "flex",
  gap: "20px",
  justifyContent: "flex-end",
  alignItems: "center",
  maxWidth: "1254px",
  margin: "0 auto",
  paddingTop: "10px",
});

export const IconAndTitle = styled(Box)({
  display: "flex",
  alignItems: "center",
});

export const ItemText = styled(Typography)({
  marginTop: "4px",
});

export const FirstItemButton = styled(Button)({
  marginTop: "8px",
});
