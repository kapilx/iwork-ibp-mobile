import { styled } from "@mui/material/styles";

export const InsurerConfigContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  padding: theme.spacing(5),
  gap: theme.spacing(3),
}));
