import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";

export const DetailsStyledCard = styled(Card)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  transition: "all 0.3s ease",
  "&:hover": {
    boxShadow: theme.shadows[3],
    transform: "translateY(-4px)",
  },
}));

export const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  paddingBottom: theme.spacing(1),
  paddingTop: theme.spacing(2),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  backgroundColor: theme.palette.action.hover,
}));

export const StyledCardHeaderBox = styled(Box)({
  display: "flex",
  alignItems: "center",
});

// export const StyledChip = styled(Chip)(({ theme }) => ({
//   backgroundColor: theme.palette.primary.light,
//   color: theme.palette.primary.dark,
//   fontWeight: 500,
// }));

export const StyledEditIcon = styled(EditIcon)(({ theme }) => ({
  fontSize: theme.typography.pxToRem(18),
}));

export const DetailsCardStyledCardContent = styled(CardContent)(
  ({ theme }) => ({
    paddingTop: theme.spacing(2),
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
  })
);

export const DetailedCardStyledTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.primary,
}));

export const AddressStyledBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));
