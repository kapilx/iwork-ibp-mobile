import { Box, styled, Typography } from "@mui/material";

export const ModalHeadingContainer = styled(Typography)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "6px",
}));

export const ModalMainHeading = styled(Typography)(({ theme }) => ({
  fontSize: "19px",
  color: "black",
}));

export const ModalSubHeading = styled(Typography)(({ theme }) => ({
  fontSize: "15px",
  color: "black",
}));

export const ModalLastUpdated = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  color: theme.palette.text.lightGrey,
}));

export const ContentHeading = styled(Typography)(({ theme }) => ({
  fontSize: "18px",
  fontWeight: 500,
}));

export const CardContainer = styled(Box)(({ theme }) => ({
  borderRadius: "16px",
  border: `1px solid ${theme.palette.divider}`,
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  boxShadow: "0px 2px 8px rgba(0,0,0,0.05)",
  gap: "15px",
  minHeight: "210px",
}));

export const IconWrapper = styled(Box)(({ theme }) => ({
  background: "#EAF1FF",
  padding: "12px",
  borderRadius: "12px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

export const ConfigurationIcon = styled("img")(({ theme }) => ({
  width: "36px",
  height: "36px",
}));

export const InfoText = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
}));

export const StatusText = styled("span")(({ theme }) => ({
  fontSize: "14px",
  color: theme.palette.success.main,
  fontWeight: 500,
  marginLeft: "4px",
}));

export const ContentInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  alignItems: "center",
}));

export const Description = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: "4px",
}));

export const ButtonsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: "10px",
}));

export const ConfigureButton = styled("button")(({ theme }) => ({
  backgroundColor: "#0A5FFF",
  color: "#fff",
  border: "none",
  borderRadius: "8px",
  padding: "8px 24px",
  fontSize: "14px",
  cursor: "pointer",
  minWidth: "150px",
}));

export const ViewButton = styled("button")(({ theme }) => ({
  background: "#fff",
  border: "1px solid #E0E0E0",
  borderRadius: "8px",
  padding: "8px 24px",
  fontSize: "14px",
  cursor: "pointer",
  minWidth: "150px",
}));
