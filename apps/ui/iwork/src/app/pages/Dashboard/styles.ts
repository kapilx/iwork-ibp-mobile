import { Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { CardBackground } from "@ui/ui-lib";

export const DashboardContainer = styled(Box)({
  width: "100%",
});

export const DashboardHeader = styled(Box)(({ theme }) => ({
  padding: "40px 32px",
  backgroundColor: "#000000",
}));

export const DashboardTitle = styled(Box)(({ theme }) => ({
  fontSize: "30px",
  fontWeight: 700,
  color: "#ffffff",
}));

export const DashboardSubtitle = styled(Box)(({ theme }) => ({
  fontSize: "18px",
  color: "#ffffff",
}));

export const DashboardMainContent = styled(Box)(({ theme }) => ({
  display: "flex",
  width: "calc(100% - 20px)",
  gap: "20px",
  padding: "20px",
}));

export const DashboardLeftColumn = styled(Box)(({ theme }) => ({
  gap: "20px",
  display: "flex",
  flexDirection: "column",
  width: "70%",
}));

export const DashboardRightColumn = styled(Box)(({ theme }) => ({
  width: "30%",
  gap: "20px",
  display: "flex",
  flexDirection: "column",
}));

export const SectionHeader = styled(Box)(({ theme }) => ({
  fontSize: "18px",
  fontWeight: 700,
  padding: "10px",
  color: theme.palette.text.grey,
}));

export const ANNOUNCEMENT_GRADIENT_BG =
  "linear-gradient(180deg, #EDF4FF -60%, #FFFFFF 70%)";
export const ANNOUNCEMENT_BORDER_COLOR = "#7BBFF6";

export const ANNOUNCEMENT_ACCORDION_STYLES = {
  background: ANNOUNCEMENT_GRADIENT_BG,
  border: `1px solid ${ANNOUNCEMENT_BORDER_COLOR}`,
  borderRadius: "8px",
  position: "sticky",
  top: "30px",
} as const;

export const GraphContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  rowGap: theme.spacing(10),
}));

export const LeaderBoardSection = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
}));

export const LeaderBoardList = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  rowGap: theme.spacing(2),
}));

export const ImageCardContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  rowGap: theme.spacing(9),
  marginTop: theme.spacing(9),
}));

export const IframeWrapper = styled("div")`
  width: 100%;
  height: 100%;
`;

export const LoaderOverlay = styled("div")`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;

export const MeetingsContainer = styled(Box)(({ theme }) => ({
  height: "unset",
}));

export const StyledCardBackground = styled(CardBackground)(({ theme }) => ({
  height: "calc(100vh - 306px)",
}));

export const SubSectionHeader = styled(Box)(({ theme }) => ({
  fontSize: "18px",
  fontWeight: 700,
  borderTop: "1px solid #ccc",
  padding: "10px 10px 0px 10px",
  margin: "20px 0px",
  color: theme.palette.text.grey,
}));

export const IframeDashboardContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  height: "100%",
}));

export const LeftCardBackground = styled("div")<{
  customStyles?: React.CSSProperties;
}>(({ theme, customStyles }) => ({
  width: "100%",
  backgroundColor: "#EDF4FF",
  borderRadius: theme.shape.borderRadii.medium,
  padding: theme.spacing(4.25, 4),
  boxShadow: theme.shadows[12],
  border: `${theme.shape.borderSizes.thin} solid ${ANNOUNCEMENT_BORDER_COLOR}`,
  // marginTop: theme.spacing(4),
  ...customStyles,
}));

interface RightCardBackgroundProps {
  customStyles?: React.CSSProperties;
  sticky?: boolean;
}

export const RightCardBackground = styled("div", {
  shouldForwardProp: (prop) => prop !== "customStyles" && prop !== "sticky",
})<RightCardBackgroundProps>(({ theme, customStyles, sticky }) => ({
  width: "100%",
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadii.medium,
  padding: theme.spacing(4.25, 4),
  boxShadow: theme.shadows[12],
  border: `${theme.shape.borderSizes.thin} solid ${theme.palette.neutral.tableBorder}`,
  // marginTop: theme.spacing(4),
  ...(sticky && {
    position: "sticky",
    top: theme.spacing(3.75),
  }),
  ...customStyles,
}));

export const CenteredLoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  minHeight: "200px",
  width: "100%",
}));
