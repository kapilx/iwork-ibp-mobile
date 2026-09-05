import { Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

export const DonutChartWrapper = styled("div")<{ isTotalGraph?: boolean }>(
  ({ isTotalGraph, theme }) => ({
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    // width: "200px",
    // height: "280px", // Increased height to accommodate dual footer
    cursor: isTotalGraph ? "pointer !important" : "default",
    ":hover": {
      scale: isTotalGraph ? "1.01" : "1",
      transition: "transform 0.2s ease-in-out",
      boxShadow: isTotalGraph ? theme.shadows[11] : "none",
      borderRadius: "4px",
    },
  })
);

export const Subtitle = styled("div")({
  marginTop: "8px",
  fontWeight: 600,
  color: "#111111",
});

export const CenterText = styled("div")({
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  fontSize: "24px",
  color: "#111111",
});

export const Target = styled("div")({
  color: "#111111",
  fontSize: "12px",
});

export const ChartWrapper = styled(Box)<{
  gaugeSize: number;
  isTotalGraph?: boolean;
}>(({ gaugeSize, isTotalGraph }) => ({
  position: "relative",
  width: "200px",
  height: 180,
  margin: "0 auto",
  ":hover": {},
  "&:last-child": {
    borderRight: "none !important",
  },
  "& canvas": {
    cursor: isTotalGraph ? "pointer !important" : "default",
  },
}));

export const DonutChartFooter = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  width: "80%",
  marginBottom: theme.spacing(3),
}));

export const TargetValue = styled(Typography)(({ theme }) => ({
  fontSize: "20px",
  margin: 0,
}));

export const AchievedValue = styled(Typography)(({ theme }) => ({
  fontSize: "20px",
  margin: 0,
}));

export const DividerText = styled(Typography)(({ theme }) => ({
  width: "0.5px",
  backgroundColor: "#CCCCCC",
  height: "16px",
}));

export const PercentValue = styled(Typography)<{ $color: string }>(
  ({ theme, $color }) => ({
    fontSize: "20px",
    margin: 0,
    fontWeight: 600,
    color: $color,
  })
);

export const AchievedContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: "8px",
}));

export const TargetContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "start",
}));

export const ValueUnit = styled(Typography)(({ theme }) => ({
  fontSize: "16px",
  fontWeight: 400,
  marginLeft: "2px",
  color: theme.palette.neutral?.dark || "#666666",
  display: "inline",
}));

export const PercentSymbol = styled(Typography)<{ $color: string }>(
  ({ theme, $color }) => ({
    fontSize: "16px",
    fontWeight: 600,
    marginLeft: "2px",
    color: $color,
    display: "inline",
  })
);

// New styles for dual gauge variant
export const DualMetricsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1.5),
  width: "100%",
  alignItems: "center",
}));

export const DualMetricItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  borderRadius: "8px",
  minWidth: "160px",
  transition: "background-color 0.2s ease",
  "&:hover": {
    backgroundColor: "#f8f9fa",
  },
}));

export const DualArrowIndicator = styled(Box)<{ $color: string }>(
  ({ theme, $color }) => ({
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    backgroundColor: $color,
    flexShrink: 0,
    position: "relative",
    "&::after": {
      content: '""',
      position: "absolute",
      top: "50%",
      left: "100%",
      transform: "translateY(-50%)",
      width: 0,
      height: 0,
      borderStyle: "solid",
      borderWidth: "4px 0 4px 6px",
      borderColor: `transparent transparent transparent ${$color}`,
      marginLeft: "2px",
    },
  })
);

export const DualMetricValue = styled(Typography)<{ $color: string }>(
  ({ theme, $color }) => ({
    fontSize: "18px",
    fontWeight: 600,
    color: $color,
    display: "flex",
    alignItems: "baseline",
    gap: theme.spacing(0.25),
    flex: 1,
    minWidth: "80px",
  })
);

export const DualMetricLabel = styled(Typography)(({ theme }) => ({
  fontSize: "12px",
  fontWeight: 500,
  color: "#666666",
  textTransform: "capitalize",
  minWidth: "60px",
  textAlign: "right",
}));
