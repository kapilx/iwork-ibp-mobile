import { styled, keyframes, Box } from "@mui/material";
import { Switch } from "@mui/material";

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;
export const List = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  rowGap: theme.spacing(2),
}));

export const ListItem = styled("div")<{ read?: boolean; removing?: boolean }>(
  ({ theme, read, removing }) => ({
    cursor: "pointer",
    padding: theme.spacing(4),
    borderRadius: theme.shape.borderRadius,
    backgroundColor: read ? "transparent" : theme.palette.background.paper,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(1),
    "&:hover": {
      backgroundColor: theme.palette.button.hover,
    },
    ...(removing && {
      animation: `${slideOut} 0.3s forwards`,
    }),
  })
);

export const DrawerHeader = styled("div")(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const ItemIcon = styled("img")({
  width: 16,
  height: 16,
});

export const StyledBodyText = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
}));

export const StyledNotificationMessage = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
}));

export const StyledLoadMore = styled("span")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.button.secondary,
  cursor: "pointer",
  fontWeight: theme.typography.fontWeights.semiBold,
  marginTop: theme.spacing(4),
  marginLeft: "auto",
  marginRight: "auto",
}));

export const HeaderRow = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

export const CloseIcon = styled("img")(({ theme }) => ({
  width: 10,
  height: 10,
  marginLeft: "auto",
  cursor: "pointer",
}));

export const StyledDrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  width: "100%",
  marginBottom: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  borderBottom: `1px solid ${theme.palette.background.divider}`,
}));

export const StyledSwicthBlock = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.primary,
}));

export const StyledNotificationTitle = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  width: "100%",
  justifyContent: "space-between",
}));

export const StyledSwitchBlock = styled(Switch)(({ theme }) => ({
  "& .MuiSwitch-switchBase.Mui-checked": {
    color: theme.palette.chips.senary,
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
    backgroundColor: theme.palette.chips.senary,
  },
}));

export const LoaderOverlay = styled("div")(({ theme }) => ({
  position: "absolute",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(255, 255, 255, 0.7)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 2,
}));

export const StyledDate = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.neutral.lightMedium,
  marginTop: theme.spacing(0.5),
  position: "relative",
  paddingLeft: theme.spacing(2),
  " &:before": {
    content: "''",
    color: theme.palette.text.secondary,
    position: "absolute",
    width: 4,
    height: 4,
    top: "7px",
    left: "0px",
    borderRadius: "50%",
    backgroundColor: theme.palette.button.secondary,
  },
}));

export const Loader = styled(Box)(({ theme }) => ({
  position: "fixed",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: theme.zIndex.modal + 1,
  background: "rgba(255, 255, 255, 0.5)",
}));
