import { Box, Typography, styled } from "@mui/material";
import {
  DragAndDropText,
  EndorsementDocContainer,
  EndorsementDocContainerWrapper,
  UploadInstruction,
} from "@ui/ui-lib/commonComponents/FormComponent/Fields/styles";

export const TabContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
}));

export const HeaderContainer = styled(Box)(({ theme }) => ({
  maxWidth: "760px",
  margin: theme.spacing(3),
  paddingTop: theme.spacing(4)

}));

export const SectionHeading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: 500,
  lineHeight: "36px",
  color: theme.palette.text.tertiary,
  marginBottom: theme.spacing(1),
}));

export const SectionSubheading = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  lineHeight: "22px",
  color: theme.palette.text.tertiary,
}));

export const UploadAreaWrapper = styled(EndorsementDocContainerWrapper)(
  ({ theme }) => ({
    minHeight: "420px",
    paddingTop: theme.spacing(7),
    paddingRight: theme.spacing(4),
    paddingBottom: theme.spacing(5),
    paddingLeft: theme.spacing(4),
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.palette.common.white,
  })
);

export const UploadAreaContent = styled(EndorsementDocContainer)(
  ({ theme }) => ({
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    padding: 0,
    gap: theme.spacing(2),
    justifyContent: "center",
  })
);

export const UploadHeading = styled(DragAndDropText)(({ theme }) => ({
  textAlign: "center",
  maxWidth: "520px",
  margin: "0 auto",
}));

export const UploadButtonRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginTop: theme.spacing(1),
  flexWrap: "wrap",
  justifyContent: "center",
}));

export const UploadHelpText = styled(UploadInstruction)(() => ({
  textAlign: "center",
}));

export const SelectedFileCard = styled(Box)(({ theme }) => ({
  border: "1px solid #D0D5DD",
  borderRadius: theme.spacing(1.75),
  padding: theme.spacing(2),
  width: "100%",
  maxWidth: "420px",
  marginTop: theme.spacing(5),
  backgroundColor: "#F8FAFC",
  marginLeft: "auto",
  marginRight: "auto",
  textAlign: "left",
}));

export const SelectedFileMeta = styled(Box)(() => ({
  minWidth: 0,
  flex: 1,
}));

export const SelectedFileLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  lineHeight: "18px",
  color: theme.palette.text.tertiary,
}));

export const SelectedFileName = styled(Typography)(() => ({
  fontWeight: 600,
  wordBreak: "break-word",
}));

export const SelectedFileTimestamp = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  lineHeight: "18px",
  color: theme.palette.text.tertiary,
  marginTop: theme.spacing(0.5),
}));

export const ActionRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1.5),
  width: "100%",
  maxWidth: "460px",
  justifyContent: "center",
  marginLeft: "auto",
  marginRight: "auto",
  marginTop: theme.spacing(1),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
  },
}));

export const FileInfoRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
}));

export const FileActionRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  marginLeft: "auto",
}));

export const FileActionIcon = styled("img")(({ theme }) => ({
  width: "18px",
  height: "18px",
  cursor: "pointer",
  flexShrink: 0,
  transition: "transform 0.2s ease, opacity 0.2s ease",
  "&:hover": {
    opacity: 0.85,
    transform: "scale(1.05)",
  },
}));

export const PreviewModalContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  padding: theme.spacing(3),
}));

export const SelectedFileIcon = styled("img")(() => ({
  width: "20px",
  height: "20px",
  flexShrink: 0,
}));
