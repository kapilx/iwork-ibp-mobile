import { CardBackground } from "@ui/ui-lib";
import { styled } from "@mui/material/styles";

export const CardGridBackground = styled(CardBackground)(({ theme }) => ({
  marginTop: theme.spacing(4),
  padding: theme.spacing(4, 4),
  boxShadow: "none",
  border: "none",
}));
