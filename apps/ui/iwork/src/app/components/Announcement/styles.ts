import { Box, styled, Typography, Divider } from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";

export const Container = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  maxHeight: "calc(100vh - 198px)",
  minHeight: "220px",
  overflowY: "auto",
  marginTop: theme.spacing(2),
  scrollbarWidth: "none",
}));

export const Header = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  marginBottom: "10px",
}));

export const AnnouncementIcon = styled("img")(({ theme }) => ({
  width: "24px",
  height: "24px",
  marginRight: theme.spacing(1),
}));

export const Heading = styled(Typography)(({ theme }) => ({
  fontSize: "16px",
  fontWeight: "bold",
  color: theme.palette.primary.main,
}));

export const Card = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: "8px",
}));

export const CustomDivider = styled(Divider)(({ theme }) => ({
  border: "none",
  borderTop: `1px solid ${theme.palette.divider}`,
  margin: "0px",
}));

export const CardContentLeft = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  gap: theme.spacing(2),
}));

export const CardContentRight = styled(Box)(({ theme }) => ({
  fontSize: "14px",
}));

export const Title = styled(Typography)(({ theme }) => ({
  fontSize: "16px",
  fontWeight: "600",
}));

export const Description = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  wordWrap: "break-word",
}));

export const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 120,
  padding: theme.spacing(4),
  textAlign: "center",
}));

export const IconTitleWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

export const StyledCampaignIcon = styled(CampaignIcon)(({ theme }) => ({
  marginRight: theme.spacing(0.8),
  marginTop: theme.spacing(1),
  color: "#1976d2",
}));
