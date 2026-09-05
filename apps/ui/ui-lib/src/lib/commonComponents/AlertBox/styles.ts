import { styled, Typography, Box } from "@mui/material";

export const AlertContainer = styled(Box)(({ theme }) => ({
  border: "0.5px solid #E70707",
  borderRadius: "16px",
  padding: theme.spacing(1.1, 5),
  marginTop:theme.spacing(4)
//   boxShadow: "0px 16px 24px 0px #FFF9E5",
}));

export const IconWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  paddingBottom:theme.spacing(1), 
  gap: theme.spacing(1),
}));

export const ContentWrapper = styled(Box)(({theme}) => ({
  display: "flex",
  flexDirection: "column",
  gap:"8px",
  fontFamily:theme.typography.fontFamily, 
}));


export const TitleText = styled(Typography)(({ theme }) => ({
  fontWeight:theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,  
  color: theme.palette.text.priorityHigh,
}));

export const MessageText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color:"#2E2E2E",
  fontStyle:"italic",
  fontWeight:theme.typography.fontWeights.regular,
}));
