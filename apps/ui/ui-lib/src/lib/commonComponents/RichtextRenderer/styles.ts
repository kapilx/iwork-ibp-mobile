import { styled } from "@mui/material/styles";

export const RichTextRendererStyledContainer = styled("div")(({ theme }) => ({
  lineHeight: 1.6,

  "& p": {
    margin: 0,
    color: `${theme.palette.text.primary} !important`,
  },

  "& span": {
    color: theme.palette.text.primary,
  },

  "& .ql-size-small": {
    fontSize: "0.75em",
  },
  "& .ql-size-large": {
    fontSize: "1.5em",
  },
  "& .ql-size-huge": {
    fontSize: "2.5em",
  },

  "& .ql-font-serif": {
    fontFamily: "serif",
  },
  "& .ql-font-monospace": {
    fontFamily: "monospace",
  },

  "& strong": {
    fontWeight: 700,
  },
  "& em": {
    fontStyle: "italic",
  },
  "& u": {
    textDecoration: "underline",
  },

  "& a": {
    color: "#1a0dab",
    textDecoration: "underline",
  },

  "& .ql-align-center": {
    textAlign: "center",
  },
  "& .ql-align-right": {
    textAlign: "right",
  },
  "& .ql-align-justify": {
    textAlign: "justify",
  },

  "& .ql-indent-1": {
    paddingLeft: "2em",
  },
  "& .ql-indent-2": {
    paddingLeft: "4em",
  },
  "& .ql-indent-3": {
    paddingLeft: "6em",
  },
  "& .ql-indent-4": {
    paddingLeft: "8em",
  },

  "& ol": {
    listStyleType: "decimal",
    paddingLeft: "1.5em",
  },
  "& ul": {
    listStyleType: "disc",
    paddingLeft: "1.5em",
  },
  "& li": {
    marginBottom: theme.spacing(0.5),
  },
}));
