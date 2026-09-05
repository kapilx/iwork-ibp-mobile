import { Box, Typography, Button, Stack } from "@mui/material";
import { styled } from "@mui/material/styles";

export const ModalHeadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
}));

export const ModalMainHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: 600,
  color: theme.palette.text.primary,
}));

export const ModalSubHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  // color: theme.palette.text.primary,
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  marginTop: theme.spacing(6),
}));

export const StyledCancelButton = styled(Button)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: 600,
  border: `1px solid ${theme.palette.divider}`,
  color: theme.palette.primary.main,
}));

export const StyledUploadButton = styled(Button)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: 600,
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  "&:disabled": {
    backgroundColor: theme.palette.action.disabledBackground,
  },
}));

export const StyledStack = styled(Stack)(({ theme }) => ({
  maxHeight: '60vh',
  overflowY: 'auto',
  // paddingTop: theme.spacing(1.5),
  paddingRight: '20px',
  marginRight: '-20px', // shift scrollbar slightly out of view so it isn't flush with content
}));

export const ContactInfoContainer = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "300px 1fr 1fr",
  alignItems: "center",
  gap: "10%",
  marginBottom: theme.spacing(1),
  width: "100%",
}));

export const DropdownWrapper = styled(Box)({
  minWidth: "250px",
});

export const ContactDetailsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const ContactDetailItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

export const ContactLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: 600,
  color: theme.palette.text.primary,
  letterSpacing: "0.5px",
}));

export const ContactValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: 400,
  color: theme.palette.text.primary,
}));

export const SectionContainer = styled(Box)(() => ({
  // Container for TPA/Insurer sections
}));

export const SectionHeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '16px',
  fontWeight: 600,
}));

export const SubsectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  fontSize: '14px',
  fontWeight: 600,
}));

export const SubsectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(4),
}));

export const SubsectionHeaderWithMarginTop = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: theme.spacing(5),
  marginBottom: theme.spacing(4),
}));

export const SubsectionTitleText = styled(Typography)(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 600,
}));

export const EditIconButton = styled('div')(({ theme }) => ({
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '24px',
  paddingTop: theme.spacing(3.5),
  '&:hover': {
    opacity: 0.7,
  },
}));

export const SubsectionTitleWithMarginTop = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(4),
  fontSize: '14px',
  fontWeight: 500,
}));

export const DropdownContainer = styled(Box)(() => ({
  flex: '0 0 300px',
  minWidth: '300px',
}));

export const ContactDetailsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(5),
  flex: 1,
  alignItems: 'center',
  paddingTop: theme.spacing(3.5),
}));

export const ContactInfoWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: theme.spacing(1),
  minWidth: '180px',
}));

export const ContactRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(10),
  width: '100%',
  
}));

export const SectionDivider = styled(Box)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  marginTop: theme.spacing(8),
  marginBottom: theme.spacing(4),
}));

                    
