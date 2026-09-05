import { Box, styled, Typography, Modal } from "@mui/material";
interface StyledModalBoxProps {
  customStyles?: React.CSSProperties;
}

export const StyledModalBox = styled(Box)<StyledModalBoxProps>(
  ({ theme, customStyles }) => ({
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    maxWidth: "80%",
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadii.semiRounded,
    boxShadow: theme.shadows[4],
    padding: `${theme.spacing(0)} ${theme.spacing(4)} ${theme.spacing(
      4.75
    )} ${theme.spacing(6)}`,
    outline: "none",
    ...customStyles,
  })
);

export const ModalStyledCard = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingBottom: theme.spacing(2),
  borderBottom: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.divider}`,
  columnGap: theme.spacing(5),
  position: "sticky",
    top: 0,
    backgroundColor: theme.palette.background.paper,
    zIndex: 999,
    paddingTop: theme.spacing(1),
}));

export const StyledModalHeading = styled(Typography)<StyledModalBoxProps>(
  ({ theme, customStyles }) => ({
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.palette.chips.quaternary,
    padding: `${theme.spacing(2)} 0`,
    ...customStyles,
  })
);

interface StyledChildrenProps {
  noPadding?: boolean;
}

export const StyledChildren = styled(Box)<StyledChildrenProps>(({ theme, noPadding }) => ({
  paddingTop: noPadding ? 0 : theme.spacing(4),
  paddingBottom: noPadding ? 0 : theme.spacing(4),
}));

export const StyledCloseIcon = styled("img")(({ theme }) => ({
  cursor: "pointer",
  width: "16px",
  height: "16px",
  marginRight: theme.spacing(4),
}));

export const StyledButtons = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(2.5),
}));

export const StyledModal = styled(Modal)(({ theme }) => ({
  zIndex: 1700, // Ensure modal is above other content
}));
