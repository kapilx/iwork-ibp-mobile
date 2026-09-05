import { Box, Typography, styled } from "@mui/material";

export const MarkdownRendererContainer = styled(Box)(() => ({
  width: "100%",
}));

export const MarkdownContent = styled(Box)(({ theme }) => ({
  width: "100%",
  padding: "16px",
  
  // Typography
  "& p": {
    margin: theme.spacing(1, 0),
    lineHeight: 1.6,
  },
  "& ul, & ol": {
    marginLeft: theme.spacing(3),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    paddingLeft: theme.spacing(2),
  },
  "& li": {
    marginBottom: theme.spacing(0.5),
    lineHeight: 1.6,
  },
  "& strong, & b": {
    fontWeight: theme.typography.fontWeights?.semiBold || 600,
    color: theme.palette.text.primary,
  },
  "& em, & i": {
    fontStyle: "italic",
  },
  "& u": {
    textDecoration: "underline",
  },
  "& a": {
    color: theme.palette.primary.main,
    textDecoration: "underline",
    "&:hover": {
      textDecoration: "none",
      color: theme.palette.primary.dark,
    },
  },
  
  // Professional Table styling
  "& table": {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    border: `1px solid ${theme.palette.divider || "#e0e0e0"}`,
    borderRadius: theme.spacing(1),
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    backgroundColor: theme.palette.background.paper,
  },
  
  "& thead": {
    backgroundColor: theme.palette.background.tableHeader || "#F3F7FF",
  },
  
  "& th": {
    backgroundColor: theme.palette.background.tableHeader || "#F3F7FF",
    color: `${theme.palette.text.primary || "#111111"} !important`,
    padding: theme.spacing(2, 3),
    textAlign: "left",
    fontWeight: theme.typography.fontWeights?.semiBold || 600,
    fontSize: "14px",
    borderBottom: `2px solid ${theme.palette.divider || "#e0e0e0"}`,
    borderRight: `1px solid ${theme.palette.divider || "#e0e0e0"}`,
    whiteSpace: "nowrap",
    "&:first-of-type": {
      borderTopLeftRadius: theme.spacing(1),
    },
    "&:last-child": {
      borderRight: "none",
      borderTopRightRadius: theme.spacing(1),
    },
  },
  
  "& tbody": {
    backgroundColor: theme.palette.background.paper,
  },
  
  // Style first row as header when no thead exists
  "& tbody tr:first-child": {
    backgroundColor: theme.palette.background.tableHeader || "#F3F7FF",
    "&:hover": {
      backgroundColor: theme.palette.background.tableHeaderHover || "#E3F0FF",
    },
  },
  
  "& tbody tr:first-child td": {
    backgroundColor: theme.palette.background.tableHeader || "#F3F7FF",
    color: `${theme.palette.text.primary || "#111111"} !important`,
    padding: theme.spacing(2, 3),
    textAlign: "left",
    fontWeight: theme.typography.fontWeights?.semiBold || 600,
    fontSize: "14px",
    borderBottom: `2px solid ${theme.palette.divider || "#e0e0e0"}`,
    borderRight: `1px solid ${theme.palette.divider || "#e0e0e0"}`,
    whiteSpace: "nowrap",
    "&:first-of-type": {
      borderTopLeftRadius: theme.spacing(1),
    },
    "&:last-child": {
      borderRight: "none",
      borderTopRightRadius: theme.spacing(1),
    },
  },
  
  "& td": {
    padding: theme.spacing(2, 3),
    fontSize: "14px",
    color: `${theme.palette.text.primary} !important`,
    borderBottom: `1px solid ${theme.palette.divider || "#e0e0e0"}`,
    borderRight: `1px solid ${theme.palette.divider || "#e0e0e0"}`,
    verticalAlign: "top",
    "&:last-child": {
      borderRight: "none",
    },
  },
  
  "& tbody tr": {
    transition: "background-color 0.2s ease",
    "&:hover": {
      backgroundColor: theme.palette.action.hover || "#f5f5f5",
    },
    "&:last-child td": {
      borderBottom: "none",
      "&:first-of-type": {
        borderBottomLeftRadius: theme.spacing(1),
      },
      "&:last-child": {
        borderBottomRightRadius: theme.spacing(1),
      },
    },
  },
  
  // Alternating rows (skip first header row)
  "& tbody tr:nth-of-type(even):not(:first-child)": {
    backgroundColor: theme.palette.action.selected || "#fafafa",
    "&:hover": {
      backgroundColor: theme.palette.action.hover || "#f0f0f0",
    },
  },
}));

export const MarkdownPreviewWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== "$zoom",
})<{ $zoom: number }>(({ $zoom }) => ({
  width: `${$zoom}%`,
  minWidth: '100%',
  fontSize: `${$zoom}%`,
  transition: 'width 0.2s, font-size 0.2s',
  overflow: 'visible',
  display: 'block',
  margin: 0,
  padding: 0,
  textAlign: 'left',
}));

export const MarkdownPreviewScrollArea = styled(Box)(() => ({
  backgroundColor: "#F6F6F6",
  height: "calc(90vh - 140px)",
  overflowY: "auto",
  overflowX: "auto",
  padding: 0,
  margin: 0,
  boxSizing: 'border-box',
}));

export const MarkdownModalCenter = styled(Box)(() => ({
  flex: 1,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  "@media (max-width: 600px)": {
    flex: "unset",
    width: "100%",
  },
}));

export const MarkdownMutedText = styled(Typography)(() => ({
  color: "#696565",
}));

export const MarkdownExportWrapper = styled(Box)(() => ({
  position: "fixed",
  top: 0,
  left: "-10000px",
  width: "794px",
  backgroundColor: "#FFFFFF",
  color: "#000000",
  padding: "24px",
  zIndex: -1,
}));
export const ModalHeadingImage = styled("img")(() => ({
 
}));
export const ModalContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  padding: theme.spacing(0, 4),
}));
export const ModalHeadingTitle = styled(Typography)(({ theme }) => ({
  fontSize: "28px",
  fontWeight: theme.typography.fontWeights.bold,
  color: theme.palette.text.primary,
}));
export const MarkdownExportContent = styled(Box)(({ theme }) => ({
  width: "100%",
  "& h1, & h2, & h3, & h4, & h5, & h6": {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  },
  "& p": {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    lineHeight: 1.6,
  },
  "& ul": {
    paddingLeft: "20px",
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    listStyleType: "disc",
  },

  "& ol": {
    paddingLeft: "20px",
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    listStyleType: "decimal",
  },

  "& li": {
    marginBottom: theme.spacing(0.5),
    display: "list-item",
    lineHeight: 1.6,
  },
  "& blockquote": {
    margin: theme.spacing(2, 0),
    paddingLeft: theme.spacing(2),
    borderLeft: "3px solid #E0E0E0",
  },
  "& pre": {
    backgroundColor: "#F6F6F6",
    padding: theme.spacing(2),
    borderRadius: theme.spacing(1),
    overflowX: "auto",
  },
  "& img": {
    maxWidth: "100%",
    height: "auto",
  },
  "& strong, & b": {
    fontWeight: 600,
  },
  
  // Professional Table styling for PDF export
  "& table": {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    border: "1px solid #e0e0e0",
    borderRadius: theme.spacing(1),
    overflow: "hidden",
    backgroundColor: "#ffffff",
  },
  
  "& thead": {
    backgroundColor: "#1976d2",
  },
  
  "& th": {
    backgroundColor: "#1976d2",
    color: "#ffffff",
    padding: theme.spacing(2, 3),
    textAlign: "left",
    fontWeight: 600,
    fontSize: "14px",
    borderBottom: "2px solid #115293",
    borderRight: "1px solid #115293",
    "&:first-of-type": {
      borderTopLeftRadius: theme.spacing(1),
    },
    "&:last-child": {
      borderRight: "none",
      borderTopRightRadius: theme.spacing(1),
    },
  },
  
  "& tbody": {
    backgroundColor: "#F3F7FF",
  },
  
  // Style first row as header when no thead exists
  "& tbody tr:first-child": {
    backgroundColor: "#F3F7FF",
  },
  
  "& tbody tr:first-child td": {
    backgroundColor: "#F3F7FF",
    color: "#111111 !important",
    padding: theme.spacing(2, 3),
    textAlign: "left",
    fontWeight: 600,
    fontSize: "14px",
    borderBottom: "2px solid #e0e0e0",
    borderRight: "1px solid #e0e0e0",
    "&:first-of-type": {
      borderTopLeftRadius: theme.spacing(1),
    },
    "&:last-child": {
      borderRight: "none",
      borderTopRightRadius: theme.spacing(1),
    },
  },
  
  "& td": {
    padding: theme.spacing(2, 3),
    fontSize: "14px",
    color: "#000000 !important",
    borderBottom: "1px solid #e0e0e0",
    borderRight: "1px solid #e0e0e0",
    verticalAlign: "top",
    "&:last-child": {
      borderRight: "none",
    },
  },
  
  "& tbody tr:last-child td": {
    borderBottom: "none",
    "&:first-of-type": {
      borderBottomLeftRadius: theme.spacing(1),
    },
    "&:last-child": {
      borderBottomRightRadius: theme.spacing(1),
    },
  },
  
  // Alternating rows (skip first header row)
  "& tbody tr:nth-of-type(even):not(:first-child)": {
    backgroundColor: "#fafafa",
  },
}));
