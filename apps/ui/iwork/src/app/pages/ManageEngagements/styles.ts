import { styled, Box } from "@mui/material";

interface HeaderContainerProps {
  customStyles?: React.CSSProperties;
}

export const HeaderContainer = styled(Box)<HeaderContainerProps>(
  ({ theme, customStyles }) => ({
    display: "flex",
    flexDirection: "column",
    width: "100%",
    marginBottom: theme.spacing(3),
    backgroundColor: theme.palette.background.covers,
    overflow: "auto",
    height: "calc(100vh - 65px)",
    ...(customStyles || {}),
  })
);

export const HeadingAndButtonWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: theme.spacing(7),
  marginLeft: theme.spacing(4),

  [theme.breakpoints.down(800)]: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(3),
  },
}));

export const TabsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  width: "calc(100% - 20px)",
  gap: theme.spacing(2),
  paddingLeft: theme.spacing(4),
}));

export const ButtonAndToggleWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "20px",
  marginRight: theme.spacing(12),

  [theme.breakpoints.down(800)]: {
    flexWrap: "wrap",
  },
}));
