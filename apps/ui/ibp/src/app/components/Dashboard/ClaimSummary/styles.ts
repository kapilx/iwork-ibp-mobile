import { styled } from "@mui/material/styles";
import { Box, Typography, Chip } from "@mui/material";
import Slider from "react-slick";
import { style } from "node_modules/@mui/system/esm/Stack/createStack";

export const StyledContainer = styled(Box)(({ theme }) => ({
  // padding: theme.spacing(0, 18.75, 10),
  maxWidth: "1366px",
  // margin: "auto",
}));

export const StyledHeader = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xl,
  fontWeight: theme.typography.fontWeights.semiBold,
  marginBottom: theme.spacing(4),
  color: theme.palette.text.LightDark,
  lineHeight: "100%",
}));

export const StyledCard = styled(Box)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(4),
  padding: theme.spacing(5),
  boxShadow: "0px 5px 10px 0px #26262614",

}));

export const StyledStatusBar = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2),
  marginBottom: theme.spacing(6),
  flexWrap: "wrap",
}));

export const StyledStatusBarTitle = styled(Box)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.LightDark,
}));

export const StyledStatusBarValue = styled(Box)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.LightDark,
}));

export const StyledPolicySection = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-start",
  alignItems: "center",
  paddingBottom: theme.spacing(4),
  marginBottom: theme.spacing(4),
  flexWrap: "wrap",
  gap: theme.spacing(15),
}));

export const StyledPolicyInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(10),
  flexWrap: "wrap",
}));

export const StyledPolicyItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",

  // gap: theme.spacing(0.5),
}));
export const StyledEmployeePolicyItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  // gap: theme.spacing(0.5),
}));

export const StyledPolicyNumber = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.LightDark,
}));

export const StyledPolicyLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const StyledAmountSection = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(10),
  flexWrap: "wrap",
  [theme.breakpoints.down(768)]: {
    gap: theme.spacing(3),
  },
}));

export const StyledDividerLine = styled(Box)<{ indicatorcolor: string }>(
  ({ indicatorcolor }) => ({
    width: 1,
    height: 78,
    // borderRadius: 4,
    backgroundColor: indicatorcolor,
  })
);
export const DividerLine = styled(Box)<{ indicatorcolor: string }>(
  ({ indicatorcolor }) => ({
    width: 1,
    height: 30,
    // borderRadius: 4,
    backgroundColor: indicatorcolor,
    alignSelf: "center",
  })
);
export const StyledGaugeContainer = styled(Box)(({ theme }) => ({
  width: "56px",
  height: "44px",
  minWidth: "56px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

export const StyledAmountBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  padding: theme.spacing(1, 2),
  borderRadius: theme.spacing(0.75),
}));

export const StyledAmount = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.LightDark,
}));

export const StyledAmountLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
 color: theme.palette.text.tertiary,
  opacity: 0.6,
}));

export const StyledAmountContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  // gap: theme.spacing(0.5),
}));

export const StyledAmountIndicator = styled(Box)<{ indicatorcolor: string }>(
  ({ indicatorcolor }) => {
    let style: any = {
      width: 5,
      height: 40,
      borderRadius: 40,
    };
    if (indicatorcolor === "#ffa726") {
      style.height = 40;
      style.width = 5;
      style.borderRadius = 40;
      style.background = "linear-gradient(171.6deg, #FFF765 -12.28%, #E4C40E 131.34%)";
    } else if (indicatorcolor === "#2e7d32") {
      style.height = 40;
      style.width = 5;
      style.borderRadius = 40;
      style.background = "linear-gradient(180deg, #88DB8B 0%, #27A62C 100%)";
    } else if (indicatorcolor === "#d32f2f") {
      style.height = 40;
      style.width = 5;
      style.borderRadius = 40;
      style.background = "linear-gradient(155.16deg, #FFAE65 18.69%, #E4520E 92.69%)";
    } else if (indicatorcolor === "#187FE3") {
      style.background = "#187FE3";
    }else {
      style.backgroundColor = indicatorcolor;
    }
    return style;
  }
);

export const StyledClaimItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  border: `1px solid ${theme.palette.border.main}`,
  borderRadius: theme.spacing(3),
  overflow: "hidden",
  background: theme.palette.background.paper,
  transition: "box-shadow 0.15s ease, border-color 0.15s ease",
  "&:hover": {
    boxShadow: "0px 4px 16px rgba(18, 40, 76, 0.08)",
  },
}));

export const StyledClaimHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: theme.spacing(3),
  padding: theme.spacing(4, 5),
  background: "linear-gradient(180deg, #F7F8FA 0%, #FFFFFF 100%)",
  borderBottom: `1px solid ${theme.palette.border.main}`,
}));

export const StyledClaimLeft = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2.5),
  minWidth: 0,
  flex: "1 1 220px",
}));

export const StyledClaimIcon = styled(Box)(({ theme }) => ({
  width: "40px",
  height: "40px",
  flexShrink: 0,
  borderRadius: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#EEF3FB",
  "& img": {
    width: "20px",
    height: "20px",
  },
}));

export const StyledClaimInfo = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.25),
  minWidth: 0,
}));

export const StyledClaimName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.fadeGrey,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export const StyledClaimId = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.LightDark,
  fontWeight: theme.typography.fontWeights.semiBold,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export const StyledClaimDetails = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: theme.spacing(3),
  padding: theme.spacing(4, 5),
}));

export const StyledClaimDetail = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  padding: theme.spacing(2.5, 3),
  borderRadius: theme.spacing(2),
  background: "#F7F8FA",
  minWidth: 0,
  overflow: "hidden",
}));
export const StyledClaimLabelDetail = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  padding: theme.spacing(4.5, 2.5, 4.5, 5),
    maxWidth:"328px",

  background: "linear-gradient(143.21deg, rgba(5, 109, 210, 0.03) 21.39%, rgba(5, 109, 210, 0.23) 183.31%)",
  // gap: theme.spacing(0.5),
}));
export const StyledClaimStatusDetail = styled(Box)<{ statustype: string }>(({ theme, statustype }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(0.5),
  minWidth: "110px",
  flexShrink: 0,
  padding: theme.spacing(2, 3),
  borderRadius: theme.spacing(2),
  overflow: "hidden",

  ...(statustype === "Settled" && {
    background: "linear-gradient(143.21deg, rgba(46, 125, 50, 0.04) 21.39%, rgba(46, 125, 50, 0.12) 183.31%)",
  }),
  ...(statustype === "Rejected" && {
    background: "linear-gradient(143.21deg, rgba(214, 0, 0, 0.04) 21.39%, rgba(177, 26, 26, 0.12) 183.31%)",
  }),
  ...(statustype === "Pending" && {
    background: "linear-gradient(143.21deg, rgba(228, 196, 14, 0.04) 21.39%, rgba(228, 196, 14, 0.3) 183.31%)",
  }),
  ...(statustype === "Action Required" && {
    backgroundColor: "rgba(33, 150, 243, 0.04)",
  }),
  ...(statustype === "Intimated" && {
    backgroundColor: "rgba(33, 150, 243, 0.04)",
  }),
}));
export const StyledClaimValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.LightDark,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

export const StyledClaimLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.fadeGrey,
  fontWeight: theme.typography.fontWeights.medium,
  textTransform: "uppercase",
  letterSpacing: "0.03em",
}));
export const StyledClaimLabelText = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.fadeGrey,
  fontWeight: theme.typography.fontWeights.regular,
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
  textOverflow: "ellipsis",
}));
export const StyledClaimLabelWithStatus = styled(StyledClaimLabel)<{ statustype: string }>(
  ({ theme, statustype }) => ({
    borderRadius: "16px",
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semiBold,
    textTransform: "none",
    letterSpacing: "normal",
    height: "auto",
    display: "inline-block",
    ...(statustype === "Settled" && {
      backgroundColor: "transparent",

      color: theme.palette.text.lightGreen,
    }),
    ...(statustype === "Rejected" && {
      color: theme.palette.text.lightRed,
      backgroundColor: "transparent",
    }),
    ...(statustype === "Pending" && {
      backgroundColor: "transparent",
      color: theme.palette.text.lightOrange,
    }),
    ...(statustype === "Action Required" && {
      backgroundColor: "transparent",
      color: theme.palette.text.blue,
    }),
    ...(statustype === "Intimated" && {
      backgroundColor: "transparent",
      color: theme.palette.text.blue,
    }),
    // Interim "received by us, delivering to TPA in the background" state —
    // orange like "Pending" (signals "not yet confirmed, still in motion"),
    // kept visually distinct from blue "Intimated" (TPA has confirmed it) so
    // a claims list isn't showing two different confirmation states under
    // the same color/label.
    ...(statustype === "Processing" && {
      backgroundColor: "transparent",
      color: theme.palette.text.lightOrange,
    }),
  })
);
export const StyledStatusChip = styled(Chip)<{ statustype: string }>(
  ({ theme, statustype }) => ({
    borderRadius: "16px",
    fontSize: theme.typography.fontSizes.xs,
    fontWeight: theme.typography.fontWeights.medium,
    padding: theme.spacing(1.25, 2.5),
    height: "auto",
    ...(statustype === "Settled" && {
      backgroundColor: "transparent",
      color: theme.palette.text.lightGreen,
      border: `1px solid ${theme.palette.border.lightGreen}`,
    }),
    ...(statustype === "Rejected" && {
      backgroundColor: "transparent",
      color: theme.palette.text.lightRed,
      border: `1px solid ${theme.palette.border.red}`,
    }),
    ...(statustype === "Pending" && {
      backgroundColor: "transparent",
      color: theme.palette.text.lightOrange,
      border: `1px solid ${theme.palette.text.lightOrange}`,
    }),
    ...(statustype === "Action Required" && {
      backgroundColor: "transparent",
      color: theme.palette.text.blue,
      border: `1px solid ${theme.palette.border.quaternary}`,
    }),
  })
);

export const StyledFamilySection = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
  paddingTop: theme.spacing(3),
  display: "flex",
  gap: theme.spacing(7.5),
}));

export const StyledFamilyHeader = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  marginBottom: theme.spacing(2),
  color: theme.palette.text.LightDark,
}));

export const StyledFamilyMembers = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(7.5),
  flexWrap: "wrap",
}));

export const StyledFamilyMember = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  // gap: theme.spacing(0.5),
}));

export const StyledFamilyName = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.LightDark,
}));

export const StyledFamilyRelation = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.fadeGrey,
  fontWeight: theme.typography.fontWeights.regular,
}));

export const StyledBadge = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.chips.secondary,
  color: theme.palette.text.secondary,
  padding: theme.spacing(0.5, 1.5),
  borderRadius: theme.spacing(0.75),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  display: "inline-flex",
  alignItems: "center",
  // gap: theme.spacing(0.5),
}));
export const BottomContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  marginTop: theme.spacing(4),
}));
export const BottomContainerImage = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(20),
}));
export const BottomContainerContent = styled(Box)<{ hasClaims?: boolean }>(
  ({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(4),
  })
);

export const CarouselWrapper = styled(Box)(({ theme }) => ({
  position: "relative",
  paddingTop: theme.spacing(1),
}));

export const CarouselControls = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
}));

export const CarouselStatus = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.fadeGrey,
}));

export const CarouselActions = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
}));

export const CarouselActionButton = styled("button")(({ theme }) => ({
  border: `1px solid ${theme.palette.border.main}`,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.LightDark,
  borderRadius: "50%",
  width: 32,
  height: 32,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 18px rgba(0,0,0,0.08)",
}));

export const StyledSlider = styled(Slider)(({ theme }) => ({
  ".slick-slide > div": {
    paddingRight: theme.spacing(2),
  },
}));

export const CarouselDots = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  gap: theme.spacing(1.5),
  marginTop: theme.spacing(3),
}));

export const CarouselDot = styled("button")<{ active: boolean }>(
  ({ theme, active }) => ({
    width: 30,
    height: 5,
    borderRadius: 6,
    border: "none",
    backgroundColor: active
      ? theme.palette.text.Deeporange
      : theme.palette.border.main,
    cursor: "pointer",
    padding: 0,
    transition: "background-color 0.2s ease",
  })
);

export const ShowMoreButton = styled("button")(({ theme }) => ({
  border: "none",
  background: "transparent",
  color: theme.palette.text.LightDark,
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeightMedium,
  cursor: "pointer",
  margin: `${theme.spacing(3)} auto 0`,
  display: "block",
}));

export const EmptyStateContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  padding: theme.spacing(10, 2),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(2),
  color: theme.palette.text.LightDark,
}));

export const EmptyStateIcon = styled(Box)(({ theme }) => ({
  width: 88,
  height: 88,
  borderRadius: "50%",
  border: `2px solid ${theme.palette.border.lightYellow ?? "#F5C48F"}`,
  backgroundColor: theme.palette.background.paper,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  img: {
    width: 36,
    height: 46,
  },
}));

export const EmptyStateTitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
  textAlign: "center",
}));

export const EmptyStateSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.fadeGrey,
  textAlign: "center",
  lineHeight: 1.4,
}));

export const CardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: theme.spacing(3),
  gap: theme.spacing(2),
  flexWrap: "wrap",
}));

export const ToggleGroup = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(7.5),
}));

export const ToggleSwitch = styled("button")<{ active: boolean }>(
  ({ theme, active }) => ({
    position: "relative",
    width: 44,
    height: 24,
    borderRadius: 24,
    border: `1px solid ${
      active ? theme.palette.primary.main : theme.palette.border.main
    }`,
    backgroundColor: active
      ? theme.palette.primary.main
      : theme.palette.background.paper,
    cursor: "pointer",
    padding: 0,
    display: "flex",
    alignItems: "center",
    transition: "background-color 0.2s ease, border-color 0.2s ease",
  })
);

export const ToggleThumb = styled("span")<{ active: boolean }>(
  ({ theme, active }) => ({
    position: "absolute",
    top: 2,
    left: active ? 22 : 2,
    width: 18,
    height: 18,
    borderRadius: "50%",
    backgroundColor: active
      ? theme.palette.background.paper
      : theme.palette.border.main,
    transition: "left 0.2s ease, background-color 0.2s ease",
  })
);

export const ToggleLabel = styled(Typography)<{ active?: boolean }>(
  ({ theme, active }) => ({
    fontSize: theme.typography.fontSizes.sm,
    color: theme.palette.text.LightDark,
    fontWeight: active
      ? theme.typography.fontWeights.semiBold
      : theme.typography.fontWeights.regular,
  })
);

export const PolicyMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(3),
  flexWrap: "wrap",
}));

export const PolicySeparator = styled(Box)(({ theme }) => ({
  height: 1,
  backgroundColor: theme.palette.text.LightDark,
  opacity: 0.3,
  margin: theme.spacing(6, 0),
  width: "100%",
}));
export const PolicyTypeImage = styled("img")(({ theme }) => ({
  height: "16px",
  width: "20px",
}));

export const CoverageLabel = styled(Box)<{ variant: "base" | "parental" }>(
  ({ theme, variant }) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: theme.spacing(0.5, 1.25),
    marginTop: theme.spacing(1),
    borderRadius: theme.spacing(1),
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    // color: variant === "parental" ? theme.palette.text.LightDark : "#0f5132",
    // backgroundColor:
    //   variant === "parental"
    //     ? theme.palette.background.GreyVariant
    //     : theme.palette.success.main + "1a",
  })
);
export const StyledPolicyTypeTitle = styled(Box)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.LightDark,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
}));
