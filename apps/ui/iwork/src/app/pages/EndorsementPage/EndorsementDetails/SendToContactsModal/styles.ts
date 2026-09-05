import {
  Box,
  Button as MuiButton,
  Checkbox,
  IconButton,
  TextField,
  Typography,
  styled,
} from "@mui/material";

export const ModalContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "90%",
  maxWidth: "1100px",
  maxHeight: "90vh",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[24],
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
}));

export const ModalHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(4),
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const ModalHeaderLeft = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const SendIconContainer = styled(Box)(({ theme }) => ({
  width: 38,
  height: 38,
  borderRadius: theme.spacing(1.5),
  backgroundColor: theme.palette.background.violet,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color:theme.palette.text.secondary,
}));

export const ModalHeaderContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

export const ModalTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.text.primary,
}));

export const ModalSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.grey,
}));

export const CloseButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.grey,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
  },
}));

export const ModalBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  overflowY: "auto",
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const ContactCard = styled(Box)<{ isChecked?: boolean }>(
  ({ theme, isChecked }) => ({
    border: `1px solid ${isChecked ? theme.palette.background.violet : theme.palette.divider}`,
    borderRadius: theme.spacing(2),
    padding: theme.spacing(3),
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(2),
    transition: "all 0.2s ease",
    backgroundColor: isChecked ? theme.palette.background.paper : theme.palette.background.paper,
    "&:hover": {
      boxShadow: theme.shadows[2],
    },
  }),
);

export const ContactHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

export const ContactInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flex: 1,
}));

export const ContactName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
}));

export const ContactMeta = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.grey,
}));

export const ContactActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));

export const ActionIcon = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(1),
  color: theme.palette.text.grey,
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    color: theme.palette.primary.main,
  },
}));

export const EmailChipsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  paddingLeft: theme.spacing(6),
}));

export const EmailChip = styled(Box)<{ isSelected?: boolean }>(
  ({ theme, isSelected }) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: theme.spacing(1),
    padding: `${theme.spacing(1)} ${theme.spacing(2)}`,
    borderRadius: theme.spacing(3),
    backgroundColor: isSelected ? theme.palette.background.ToggleThumb : theme.palette.grey[100],
    color: isSelected ? theme.palette.text.secondary : theme.palette.text.primary,
    fontSize: theme.typography.fontSizes.sm,
    cursor: "pointer",
    transition: "all 0.2s ease",
    "&:hover": {
      backgroundColor: isSelected ? theme.palette.background.violet : theme.palette.grey[200],
    },
  }),
);

export const EmailChipIcon = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  fontSize: 16,
}));

export const WarningBanner = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  padding: `${theme.spacing(2)} ${theme.spacing(3)}`,
  backgroundColor: theme.palette.kpiColors.yellow,
  border: `1px solid ${theme.palette.chips.quinary}`, 
  borderRadius: theme.spacing(1),
  marginLeft: theme.spacing(6),
}));

export const WarningText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.orange,
  flex: 1,
}));

export const AddEmailButton = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  color: theme.palette.text.darkOrange,
  cursor: "pointer",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  "&:hover": {
    textDecoration: "underline",
  },
}));

export const AddEmailContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginLeft: theme.spacing(6),
  marginTop: theme.spacing(1),
}));

export const EmailInputWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  flex: 1,
  padding: theme.spacing(1.5),
  border: `2px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
}));

export const EmailInput = styled(TextField)(({ theme }) => ({
  flex: 1,
  "& .MuiInputBase-root": {
    padding: 0,
  },
  "& .MuiOutlinedInput-notchedOutline": {
    border: "none",
  },
}));

export const AddNewContactButton = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(3),
  border: `2px dashed ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  cursor: "pointer",
  transition: "all 0.2s ease",
  color: theme.palette.text.primary,
  "&:hover": {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    backgroundColor: theme.palette.action.hover,
  },
}));

export const EditContactPanel = styled(Box)(({ theme }) => ({
  border: `2px solid ${theme.palette.background.violetVarient}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.lightGrey,
  marginBottom: theme.spacing(2),
}));

export const EditContactHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.violetVarient,
  borderRadius: theme.spacing(1),
  color: theme.palette.text.secondary,
}));

export const AddContactPanel = styled(Box)(({ theme }) => ({
  border: `2px solid ${theme.palette.background.paleGreen}`,
  borderRadius: theme.spacing(2),
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.lightGrey,
  marginBottom: theme.spacing(2),
}));

export const AddContactHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paleGreen,
  borderRadius: theme.spacing(1),
  color:theme.palette.text.secondary,
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const FormRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

export const EmailListContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

export const EmailItemRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const DeleteEmailButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(1),
  color: theme.palette.text.failed,
  "&:hover": {
    backgroundColor: theme.palette.background.lightGrey,
  },
}));

export const AddAnotherEmailButton = styled(Box)(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1),
  color: theme.palette.text.primary,
  cursor: "pointer",
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  marginTop: theme.spacing(1),
  "&:hover": {
    color: theme.palette.primary.main,
  },
}));

export const FormActions = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  marginTop: theme.spacing(3),
}));

export const ModalFooter = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: theme.spacing(3, 4),
  borderTop: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
}));

export const FooterInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const SelectionIndicator = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
}));

export const CheckCircle = styled(Box)(({ theme }) => ({
  width: 32,
  height: 32,
  borderRadius: "50%",
  backgroundColor: theme.palette.background.paleGreen,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: theme.palette.text.primary,
}));

export const SelectionText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.primary,
}));

export const SelectionSubtext = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
}));

export const FooterActions = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
}));

export const StyledCheckbox = styled(Checkbox)(({ theme }) => ({
  color:theme.palette.text.grey,
  "&.Mui-checked": {
    color: theme.palette.background.violet,
  },
}));

export const RequiredAsterisk = styled("span")(({ theme }) => ({
  color: theme.palette.text.failed,
  marginLeft: theme.spacing(0.5),
}));

export const LoaderContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  padding: theme.spacing(5),
}));

export const EmailFieldLabel = styled("label")(({ theme }) => ({
  display: "block",
  marginBottom: theme.spacing(1),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.background.darkGray,
}));

export const EmailFieldRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
  alignItems: "center",
}));

export const EmailFieldWrapper = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const DeleteEmailButtonStyled = styled(MuiButton)(({ theme }) => ({
  minWidth: "40px",
  color: theme.palette.text.failed,
  padding: theme.spacing(0.75),
}));

export const AddAnotherEmailButtonStyled = styled(MuiButton)(({ theme }) => ({
  color: theme.palette.text.primary,
  textTransform: "none",
  marginTop: theme.spacing(0.5),
}));

export const SaveEditButton = styled(MuiButton)(({ theme }) => ({
  backgroundColor: theme.palette.background.violetVarient,
}));
export const SaveContactButton = styled(MuiButton)(({ theme }) => ({
  backgroundColor: theme.palette.background.paleGreen,
}));

export const AddEmailInlineButton = styled(MuiButton)(({ theme }) => ({
  backgroundColor: theme.palette.background.violet,
}));

export const SendButton = styled(MuiButton)(({ theme }) => ({
  backgroundColor: theme.palette.background.violet,
  color: theme.palette.text.secondary,
}));

export const SelectionTextColored = styled(SelectionText)(({ theme }) => ({
  color: theme.palette.text.grey,
}));

// Compose Email Step Styles
export const ComposeEmailContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const EmailFieldContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const EmailFieldLabelTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  marginBottom: theme.spacing(1),
  color: theme.palette.text.primary,
}));

export const EmailFieldValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.grey,
  paddingLeft: theme.spacing(2),
}));

export const EmailChipsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  paddingLeft: theme.spacing(2),
  margin: theme.spacing(1),
}));

export const EmailFieldHelperText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.primary.main,
  paddingLeft: theme.spacing(2),
  marginTop: theme.spacing(0.5),
}));

export const CCTextField = styled(TextField)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  "& .MuiOutlinedInput-root": {
    fontSize: theme.typography.fontSizes.sm,
  },
}));

// Email chip style configuration
export const emailChipStyleConfig = {
  backgroundColor: "#E8F0FE",
  color: "#1967D2",
  borderColor: "#C2DCFF",
};
