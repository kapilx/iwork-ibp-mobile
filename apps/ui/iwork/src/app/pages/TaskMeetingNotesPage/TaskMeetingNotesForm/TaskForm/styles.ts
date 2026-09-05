import { styled ,Box} from "@mui/material";
import { Button } from "@ui/ui-lib";

export const FormStyles = {
  "& .MuiGrid-root": {
    rowGap: "20px",
    width :"100%"
  },
  "& .MuiTypography-root": {
    fontWeight: "400",
  }
};

export const ButtonContainersBox = styled(Box)({
  display: "flex",
  gap: "16px", // Equivalent to gap: 2 (assuming theme spacing(2) = 8px)
  marginTop: "70px", // Equivalent to mt: 2
  padding: "16px", // Equivalent to p: 2
  justifyContent: "flex-end",
});


export const StyledButton1 = styled(Button)(({ theme }) => ({
    "&.button":{
        minWidth: "unset",
    }
}));

export const StyledFormBox = styled("div")(({ theme }) => ({
  paddingTop: theme.spacing(6),
  height: "calc(100vh - 125px)", // Assuming you want to leave some space for other elements
  display: "flex",
  flexDirection: "column",
  gap: "24px",
  overflowY: "auto",

  // Firefox
  scrollbarWidth: "thin",
  scrollbarColor: `${theme.palette.grey[400]} ${theme.palette.background.paper}`,

  "&::-webkit-scrollbar": {
    width: "8px",
  },
  "&::-webkit-scrollbar-track": {
    background: theme.palette.background.paper,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.grey[400], // light grey thumb
  },
}));

