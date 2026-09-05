import { Box, styled, Typography } from "@mui/material";
import { ACTIVE, CLICKED, DISABLED } from "../../constants";
import CardsBackground from "../../../assets/svgs/cards-background.svg";

export const Container = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isReadOnly",
})<{
  onClick?: () => void;
  state: string;
  isReadOnly?: boolean;
  isSingleChoice?: boolean;
}>(({ theme, state, isReadOnly, isSingleChoice }) => ({
  width: "100%",
  minHeight: "85px",
  border: state === CLICKED ? "1px solid #62B1FF" : "1px solid white",
  display: "flex",
  flexDirection: "row",
  cursor: isReadOnly || isSingleChoice ? "default" : "pointer",
  overflow: "hidden",
  background: state === CLICKED
    ? "linear-gradient(to top, #c9e4ff, #F1F8FF)"
    : "linear-gradient(180deg, #FEFEFE 0%, #EDEDED 100%)",
  padding: `${theme.spacing(7)} ${theme.spacing(4)} ${theme.spacing(3)} ${theme.spacing(4)}`,
  alignItems: "center",
  justifyContent: "space-between",
  borderRadius: theme.spacing(3),
  zIndex: 1,
  filter: isReadOnly ? "grayscale(100%)" : "none",
  position: "relative",
  ...(state !== DISABLED &&
    !isReadOnly && {
      "&:hover": {
        boxShadow: "0px -1px 24px 0px #187FE21A",
        transition: "box-shadow 0.3s, transform 0.3s",
      },
    }),
  "@media (min-width: 360px) and (max-width: 1024px)": {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: theme.spacing(2),
    padding: `${theme.spacing(6)} ${theme.spacing(2.5)} ${theme.spacing(2.5)} ${theme.spacing(2.5)}`,
  },
}));

export const ContainerHolder = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  flex: 1,
  "@media (min-width: 360px) and (max-width: 1024px)": {
    flexWrap: "wrap",
    gap: theme.spacing(2),
    width: "100%",
  },
}));

export const SubContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  marginRight: theme.spacing(2.5),
  "@media (min-width: 360px) and (max-width: 1024px)": {
    marginRight: 0,
    flexShrink: 0,
  },
}));

export const SumInsuredContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));

export const CommonContainerStyles = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2.5),
  "@media (min-width: 360px) and (max-width: 1024px)": {
    flexWrap: "wrap",
    gap: theme.spacing(2),
  },
}));

export const CommonCardContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
}));
export const CommonCardDivider = styled("div")(({ theme }) => ({
  width: "1.33px",
  height: "34px",
  backgroundColor: "#E9E9E9",
  // marginRight: theme.spacing(7.5),
  // marginLeft: theme.spacing(7.5),
}));
export const MyPayContainer = styled(Box)<{ state: string }>(
  ({ theme, state }) => ({
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1),
    alignSelf: "flex-end",
    "@media (min-width: 360px) and (max-width: 1024px)": {
      alignSelf: "flex-end",
      paddingTop: theme.spacing(0.5),
      borderTop: "1px solid #E9E9E9",
      gap: theme.spacing(3),
      justifyContent: "center",
    },
  })
);

export const CommonCardTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: 400,
  fontSize: '14px',
  color: theme.palette.text.tertiary,
  opacity: 0.6,
  lineHeight: '20px',
}));

export const CommonCardNumberTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: 400,
  fontSize: '18px',
  color: theme.palette.text.primary,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  lineHeight: '26px',
  "@media (min-width: 1024px) and (max-width: 1366px)": {
    fontSize: '15px',
    lineHeight: '22px',
    flexDirection: 'column',
  },
  "@media (min-width: 360px) and (max-width: 1024px)": {
    fontSize: '15px',
    lineHeight: '22px',
    flexDirection: 'column',
  },
}));

export const CommonMainTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: 400,
  fontSize: '14px',
  color: theme.palette.text.labelColor,
  lineHeight: '20px',
}));

export const CommonMainNumberTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: 400,
  fontSize: '18px',
  color: theme.palette.text.primary,
  lineHeight: '26px',
  "@media (min-width: 360px) and (max-width: 1024px)": {
    fontSize: '15px',
    lineHeight: '22px',
  },
}));

export const LogoContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

export const MyPayTypography = styled(Typography)<{ state: string }>(
  ({ theme, state }) => ({
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    fontSize: '18px',
    color: theme.palette.neutral.dark,
    lineHeight: '20px',
    "@media (min-width: 360px) and (max-width: 1024px)": {
      fontSize: '15px',
    },
  })
);

export const MyPayNumberTypography = styled(Typography)<{ state: string }>(
  ({ theme, state }) => ({
    fontFamily: theme.typography.fontFamily,
    fontWeight: 500,
    fontSize: '18px',
    color: theme.palette.neutral.dark,
    lineHeight: '26px',
    "@media (min-width: 360px) and (max-width: 1024px)": {
      fontSize: '15px',
    },
  })
);

export const ShieldImg = styled("img")(({ theme }) => ({
  width: "40px",
  height: "40px",
}));

export const PolicyDisplayNameContainer = styled(Box)(({ theme }) => ({
  position: "absolute",
  top: theme.spacing(1.5),
  left: theme.spacing(8), // Move more to the right
  display: "flex",
  justifyContent: "flex-start",
  zIndex: 2,
}));

export const PolicyDisplayNameTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  fontSize: '16px',
  color: theme.palette.text.tertiary,
  lineHeight: '20px',
  // marginBottom: theme.spacing(1.25),
}));
export const ShieldImgUnselected = styled("img")(({ theme }) => ({
  width: "25px",
  height: "25px",
  margin : theme.spacing(2)
}));
