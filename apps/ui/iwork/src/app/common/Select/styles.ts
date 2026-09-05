import { styled } from "@mui/material/styles";
import FormControl from "@mui/material/FormControl";
import { Typography } from "@mui/material";

export const FormControlStyles = styled(FormControl)(({ theme }) => ({
  ".MuiOutlinedInput-root": {
    borderRadius: "8px",
  },
  "& .MuiSelect-select": {
    padding: "10px",
  },
}));

export const SelectLabel = styled(Typography)(({ theme }) => ({
  maxWidth: "100%",
  textOverflow: "ellipsis",
  overflow: "hidden",
}));
