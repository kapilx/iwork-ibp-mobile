import { Padding } from "@mui/icons-material";
import {
  Box,
  Typography,
  Radio,
  FormControlLabel,
  LinearProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";

export const Container = styled(Box)(({ theme }) => ({
  width: "100%",
  // margin: "0 auto",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
}));

export const Title = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: "18px",
}));

export const CustomRadio = styled(Radio)(({ theme }) => ({
  color: theme.palette.neutral.dark,
  "&.Mui-checked": {
    color: theme.palette.chips.senary,
  },
}));

export const RadioLabel = styled(FormControlLabel)(({ theme }) => ({
  marginRight: theme.spacing(3),
  "& .MuiButtonBase-root": {
    padding: theme.spacing(0, 2),
  },
}));

export const UploadBox = styled(Box)(({ theme }) => ({
  border: `2px dashed ${theme.palette.chips.senary}`,
  backgroundColor: theme.palette.background.uploadFile,
  padding: theme.spacing(6, 5),
  textAlign: "center",
  borderRadius: "8px",
  width: "100%",
  minHeight: "55vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  marginTop: theme.spacing(2),
}));

export const UploadContentWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  height: "100%",
  flex: 1,
}));

export const UploadCenterBox = styled(Box)(({ theme }) => ({
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export const UploadText = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(1),
  cursor: "pointer",
  fontSize: "16px",
  flex: 1,
}));

export const UploadLink = styled("span")(({ theme }) => ({
  color: theme.palette.button.secondary,
  fontWeight: 500,
  cursor: "pointer",
}));

export const PointsNote = styled(Box)(({ theme }) => ({
  textAlign: "left",
  alignSelf: "flex-start",
  fontSize: "14px",
  marginTop: theme.spacing(3),
}));

export const NoteHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.paletteGrey,
}));

export const ProgressBox = styled(Box)(({ theme }) => ({
  width: "100%",
  textAlign: "center",
  padding: theme.spacing(4),
}));

export const ButtonContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(2),
  marginTop: theme.spacing(6),
}));

export const UploadContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(6),
}));

export const StyledProgressBox = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(2),
  width: "100%",
}));

export const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 8,
  borderRadius: 4,
  width: "100%",
  [`& .MuiLinearProgress-bar`]: {
    backgroundColor: theme.palette.chips.senary,
  },
}));

export const StyledTypography = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(2),
}));

export const StyledList = styled("ul")(({ theme }) => ({
  listStyleType: "disc",
  paddingLeft: theme.spacing(3.5),
  marginTop: theme.spacing(2),
}));
