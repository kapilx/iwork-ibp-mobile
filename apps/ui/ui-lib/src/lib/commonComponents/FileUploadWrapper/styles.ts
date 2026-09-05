import { styled } from "@mui/material/styles";

export const StyledGridContainer = styled("div")(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
  gap: theme.spacing(2),
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
}));

export const StyledGridItem = styled("div")((theme) => ({
  maxWidth: "unset !important",
  padding: "0px 10px 0px 0px !important",
}));

export const FileUploadForm = styled("div")(({ theme }) => ({
  // cursor: "not-allowed",
  "& .MuiGrid-root": {
    maxWidth: "unset ",
    flexWrap: "nowrap",
    columnGap: "20px",
    marginTop: "6px",
    width: "unset",
    // pointerEvents: "none",
  },
}));
