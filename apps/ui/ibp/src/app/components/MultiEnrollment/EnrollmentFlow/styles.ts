import {
  Box,
  Button,
  Divider,
  Typography,
  IconButton,
  Dialog,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import accordionBg from "../../../assets/svgs/basepolicy-background.svg";
import { DialogActions } from "@mui/material";
import CommonChip from "../../../common/CommonChip";

export const MemberSelectionHeaderRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "2fr 1fr 2fr",
  alignItems: "center",
  padding: theme.spacing(2, 0),
  marginBottom: theme.spacing(1),
}));

export const MemberHeaderText = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  color: "#222222",
  fontWeight: 400,
  opacity: 0.6,
  fontFamily: theme.typography.fontFamily,
}));
export const AccordionContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  minWidth: 0,
  width: "100%",
}));
export const BasePolicyContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(2),
}));
export interface AccordionItemProps {
  isExpanded?: boolean;
  colorIndex?: number;
}

export const NotEnrolledIconWrapperStyled = styled("div")(({ theme }) => ({
  backgroundColor: "#F0F0F0",
  marginTop: theme.spacing(6),
  marginBottom: theme.spacing(3),
  paddingRight: theme.spacing(2.5),
  paddinLeft: theme.spacing(2.5),
  paddingTop: theme.spacing(1.7),
  paddingBottom: theme.spacing(1.7),
  borderRadius: theme.spacing(3),
  display: "flex",
  justifyContent: "space-between",
  flexDirection: "row",
  alignItems: "center",
  minHeight: theme.spacing(10.5),
  padding: theme.spacing(5),
}));

export const PolicyHeaderStack = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(1),
}));

export const EnrollmentOpensBadge = styled("div")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(0.75),
  padding: theme.spacing(0.5, 1),
  borderRadius: theme.spacing(3),
  backgroundColor: theme.palette.grey[100],
  color: theme.palette.text.primary,
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.regular,
  border: `1px solid ${theme.palette.border.lightGrey}`,
  marginLeft: theme.spacing(3),
  justifyContent: "center",
}));

export const EnrollmentOpensIcon = styled("img")(({ theme }) => ({
  width: theme.spacing(2),
  height: theme.spacing(2),
}));

export const PolicyHeaderRow = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
}));

export const PolicyHeaderColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  // alignItems: "center",
  gap: theme.spacing(0.375),
  justifyContent: "center",
}));

export const NotifyText = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.medium,
  color: theme.palette.warning.main,
  // marginTop: theme.spacing(0.5),
  fontWeight: theme.typography.fontWeights.semiBold,
  cursor: "pointer",
  paddingRight: theme.spacing(5),
}));

export const AccordionWrapper = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(3),
}));
export const AccordionItem = styled("div", {
  shouldForwardProp: (prop) => prop !== "isExpanded" && prop !== "colorIndex",
})<AccordionItemProps>(({ theme, isExpanded, colorIndex = 0 }) => {
  const gradients = [
    "linear-gradient(216.85deg, #FCFCFC -40.03%, #B6E4BF 252.14%)",
    "linear-gradient(157.86deg, #FFFFFF -45.96%, #1740D2 624.02%)",
    "linear-gradient(183.37deg, #FCFCFC -124.84%, #FFB0B0 207.34%)",
    "linear-gradient(218.83deg, #E3F1FF 35.03%, #B8DAFF 97.53%)",
  ];

  const selectedGradient = gradients[colorIndex % gradients.length];

  return {
    padding: isExpanded ? theme.spacing(5) : theme.spacing(5),
    marginTop: theme.spacing(2.5),
    backgroundColor: theme.palette.background.paper,
    border: "1px solid #CACBCC",
    // cursor: "pointer",
    flexDirection: "column",
    display: "flex",
    marginBottom: theme.spacing(2.5),
    borderRadius: theme.spacing(3),
    overflow: "hidden",

    // background: isExpanded ? `url("${accordionBg}")` : "#FCFCFC",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "94% 44%",
    // backgroundPositionX:"100%"
    boxShadow: "0 5px 10px 0 rgba(202, 203, 204, 0.5)",
    transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), background 0.7s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease",
    ...(!isExpanded && {
      "&:hover": {
        transform: "scale(1.010)",
        background: "linear-gradient(355deg, rgba(5, 109, 210, 0.03) 21.39%, rgba(5, 109, 210, 0.23) 183.31%)",
      },
    }),
  };
});
export const AccordionFlow = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.light,
  fontSize: theme.typography.fontSizes.large,
  color: theme.palette.background.paper,
  marginRight: theme.spacing(7.5),
  marginLeft: theme.spacing(1),
}));
export interface AccordionTitleProps {
  enrolled?: boolean;
  isExpanded?: boolean;
}
export const PreviousPageImage = styled("img")({
  cursor: "pointer",
});
export const EmployeeImage = styled("img")({});
export const BasePolicyImage = styled("img")({});
export const EnrollmentHeadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(4),
  marginBottom: theme.spacing(4),
  paddingBottom: theme.spacing(3),
  borderBottom: `1px solid #C8C8C8`,
}));

export const HealthPolicyImage = styled("img")({});
export const HealthContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));
export const EnrollmentHeading = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.xl,
  color: theme.palette.text.LightDark,
}));

export const CompulsoryBadge = styled("span")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  backgroundColor: " #DFDFDF",
  marginLeft: theme.spacing(1),
  borderRadius: theme.spacing(5),
  padding: theme.spacing(1.5, 2.5),
}));

export const AccordionTitle = styled("span", {
  shouldForwardProp: (prop) => prop !== "enrolled",
})<AccordionTitleProps>(({ theme, enrolled }) => ({
  color: theme.palette.text.LightDark,
  fontWeight: 600,
  maxWidth: "100%",
  fontSize: theme.typography.fontSizes.xll,
  textTransform: "capitalize",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "block",
  flex: "1",
  minWidth: 0,
  "@media (min-width: 769px) and (max-width: 1024px)": {
    fontSize: theme.typography.fontSizes.lg,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.md,
  },
}));

export const PolicyTitle = styled("span", {
  shouldForwardProp: (prop) => prop !== "enrolled",
})<AccordionTitleProps>(({ theme, enrolled }) => ({
  color: theme.palette.text.tertiary,
  fontWeight: 600,
  fontSize: theme.typography.fontSizes.xll,
  textTransform: "capitalize",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "block",
}));

export const ExpandedAccordionTitle = styled("span", {
  shouldForwardProp: (prop) => prop !== "enrolled",
})<AccordionTitleProps>(({ theme, enrolled }) => ({
  color: theme.palette.text.tertiary,
  fontWeight: 600,
  fontSize: theme.typography.fontSizes.xll,
  textTransform: "capitalize",
  "@media (min-width: 769px) and (max-width: 1024px)": {
    fontSize: theme.typography.fontSizes.lg,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.md,
  },
}));

export const NotEnrolledIconWrapper = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(0),
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  minWidth: "120px",
  rowGap: theme.spacing(1.5),
  width: "100%",
}));

export const AccordionAction = styled("span")(({ theme }) => ({
  marginLeft: theme.spacing(2),
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.low,
  fontSize: theme.typography.fontSizes.sm,
  cursor: "pointer",
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(1),
}));

export const AccordionActionColumn = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  textAlign: "right",
  gap: theme.spacing(0.5),
}));

export const AccordionActionRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(0.75),
}));

export const PopupDialog = styled(Dialog)(({ theme }) => ({
  ".css-16rs8zy-MuiPaper-root-MuiDialog-paper": {
    padding: theme.spacing(3),
  },
}));
export const EnrollmentSection = styled("div")(({ theme }) => ({
  flex: 1,
  width: "100%",
  minWidth: 0,
  maxWidth: "1200px",
  margin: "0 auto",
  padding: theme.spacing(0, 2),
  [theme.breakpoints.down("lg")]: {
    maxWidth: "100%",
    padding: theme.spacing(0, 1.5),
  },
  [theme.breakpoints.down("md")]: {
    padding: theme.spacing(0, 1),
  },
}));

export const CompulsoryOptionalContainer = styled("div")(({ theme }) => ({
  margin: "20px"
}));

export const EmployeeDetailsCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[2],
  padding: theme.spacing(5),
}));

export const EmployeeDetailsHeaderTitle = styled("h3")<{ isEdit?: boolean }>(
  ({ theme, isEdit }) => ({
    color: theme.palette.primary.LightDark,
    fontWeight: theme.typography.fontWeights.semiBold,
    fontSize: theme.typography.fontSizes.md,
    margin: theme.spacing(0),
    marginTop: isEdit ? theme.spacing(2) : theme.spacing(0),
  }),
);

export const EmployeeDetailsKeyValue = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
}));

export const EmployeeDetailsLabel = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeightRegular,
  color: theme.palette.grey[700],
}));

export const EmployeeDetailsItem = styled(Box)(({ theme }) => ({
  minWidth: "235px",
  marginBottom: theme.spacing(0),
}));

export const EmployeeDetailsGrid = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  columnGap: theme.spacing(2.5),
  rowGap: theme.spacing(7.5),
  marginBottom: theme.spacing(2.5),
}));

export const EnrolledIconStyles = styled("img")(({ theme }) => ({}));

export const AccordionCollapsedIconStyles = styled("img", {
  shouldForwardProp: (prop) => prop !== "expanded",
})<{ expanded?: boolean }>(({ theme, expanded }) => ({
  width: "20px",
  height: "20px",
  transform: expanded ? "rotate(-180deg)" : "rotate(0deg)",
}));

export const AccordionHeaderContent = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  minWidth: 0,
  flexDirection:"column",
  marginRight: theme.spacing(2),
  flex: "1",
  overflow: "hidden",
  [theme.breakpoints.up("md")]: {
    marginRight: theme.spacing(4),
  },
  [theme.breakpoints.up("lg")]: {
    marginRight: theme.spacing(10),
  },
}));
export const SheildWrapper = styled(Box)(({ theme }) => ({
  display:"flex",
  alignItems:"center",
  gap: theme.spacing(3.5),
}));
export const AccordionTitleRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "wrap",
  rowGap: theme.spacing(1),
}));
export const PolicyNameContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flex: "1",
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
}));
export const AccordionTitleRowCollapsed = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
  flexWrap: "nowrap",
  rowGap: theme.spacing(1),
  width: "100%",
  justifyContent: "space-between",
  minWidth: 0,
  overflow: "hidden",
}));

export const PolicyChip = styled(CommonChip)(({ theme }) => ({
  height: "auto",
  borderRadius: theme.spacing(4),
  padding: theme.spacing(0, 1.5),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  border: `1px solid ${theme.palette.border.lightGrey}`,
  backgroundColor: theme.palette.background.paper,
  "& .MuiChip-label": {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
}));

export interface PolicySummaryContainerProps {
  isExpanded?: boolean;
}

export const PolicySummaryContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isExpanded",
})<PolicySummaryContainerProps>(({ theme, isExpanded }) => ({
  display: "grid",
  gridTemplateRows: isExpanded ? "0fr" : "1fr",
  transition: "grid-template-rows 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
  overflow: "hidden",
  width: "100%",
  minWidth: 0,
  "& > div": {
    overflow: "hidden",
    minWidth: 0,
  },
}));

export const PolicySummaryWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  columnGap: theme.spacing(3),
  rowGap: theme.spacing(2),
  width: "100%",
  alignItems: "flex-start",
  minHeight: 0,
  [theme.breakpoints.up("sm")]: {
    columnGap: theme.spacing(4),
  },
  [theme.breakpoints.up("md")]: {
    columnGap: theme.spacing(5),
  },
  [theme.breakpoints.up("lg")]: {
    columnGap: theme.spacing(6),
  },
}));

export const PolicySummaryStatusItem = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "flex-end",
  marginLeft: "auto",
  minWidth: "fit-content",
  flexShrink: 0,
  order: 999,
}));

export const SelectedStatusBadge = styled("span")(({ theme }) => ({
  display: "inline-flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  backgroundColor: "#EC6C27",
  color: "#FFFFFF",
  borderRadius: theme.spacing(5),
  padding: theme.spacing(1.25, 2.5),
}));

export const PolicySummaryItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  minWidth: "120px",
  flex: "0 1 auto",
  [theme.breakpoints.up("sm")]: {
    minWidth: "140px",
  },
  [theme.breakpoints.up("md")]: {
    minWidth: "150px",
  },
}));

export const PolicySummaryLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.fadeGrey,
  textTransform: "capitalize",
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.xs,
  },
}));

export const PolicySummaryValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.lg,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.LightDark,
  "@media (min-width: 769px) and (max-width: 1024px)": {
    fontSize: theme.typography.fontSizes.md,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.sm,
  },
}));

export const AccordionButtonsRow = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(10),
  display: "flex",
  justifyContent: "flex-end",
  gap: theme.spacing(3),
}));

export const CancelSelectionButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  padding: theme.spacing(1.5, 5),
  borderColor: theme.palette.border.secondary,
  color: theme.palette.text.primary,
  "&:hover": {
    borderColor: theme.palette.border.secondary,
    backgroundColor: theme.palette.action.hover,
  },
}));

export const EnrollNowButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.semiBold,
  padding: theme.spacing(1.5, 6),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  boxShadow: "none",
  "&:hover": {
    backgroundColor: theme.palette.primary.dark,
    boxShadow: "none",
  },
  "&.Mui-disabled": {
    backgroundColor: theme.palette.button.disabled,
    color: theme.palette.neutral.veryLight,
  },
}));

export const CardContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.spacing(3),
  border: `0.5px solid ${theme.palette.background.greyBorderColor}`,
  boxShadow: "0px 4px 14px rgba(239, 230, 227, 0.6)",
  marginTop: theme.spacing(7.5),
  padding: theme.spacing(5, 5, 6, 5),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(4),
}));

export const Header = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

export const Title = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.LightDark,
}));

export const AddDependentButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.primary.LightDark,
  minWidth: "auto",
  padding: 0,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  "&:hover": {
    backgroundColor: "transparent",
    color: theme.palette.chips.septenary,
  },
  "& .MuiButton-startIcon": {
    marginRight: 0,
    marginBottom: theme.spacing(0.5),
  },
}));

export const SectionDivider = styled(Divider)(({ theme }) => ({
  borderColor: theme.palette.border.main,
  borderBottomWidth: 0.5,
  opacity: 1,
}));

export const DependentRow = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));

export const FieldsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2.5),
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));

export const FieldItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  // "&:nth-child(1)": {
  minWidth: "250px",
  // },
}));
export const FamilyImage = styled("img")({});
export const FieldTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.text.LightDark,
  textTransform: "capitalize",
}));

export const FieldSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  color: theme.palette.text.fadeGrey,
}));

export const DeleteButton = styled(Button)(({ theme }) => ({
  color: theme.palette.chips.senary,
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.sm,
  textTransform: "none",
  padding: 0,
  minWidth: "auto",
  "&:hover": {
    backgroundColor: "transparent",
    color: theme.palette.chips.septenary,
  },
}));

export const DeleteButtonWrapper = styled(Box)(({ theme }) => ({
  display: "block",
  [theme.breakpoints.down("xs")]: {
    display: "none",
  },
}));
export const FamilyContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2.5),
}));

export const AddPolicyButton = styled(Button)(({ theme }) => ({
  background: "#093F84",
  color: theme.palette.background.paper,
  fontWeight: theme.typography.fontWeights.medium,
  lineHeight: "100%",
  padding: "14px 40px",
  position: "relative",
  overflow: "hidden",
}));

export const AnimatedButtonWrapper = styled(Box)(() => ({
  position: "relative",
  display: "inline-flex",
  overflow: "hidden",
}));

export const AnimatedLayer = styled(Box)(() => ({
  position: "absolute",
  bottom: 0,
  left: 0,
  right: 0,
  backgroundColor: "#EC6C27",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
  fontWeight: 500,
  transformOrigin: "bottom",
}));

export const ButtonTextWrapper = styled(Box)(() => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
  transformOrigin: "center",
}));

export const CancelButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  border: `1px solid ${theme.palette.border.grey}`,
  fontWeight: theme.typography.fontWeights.medium,
}));

// Button container for action buttons (Cancel/Enroll)
export const ActionButtonsContainer = styled(Box)<{
  children?: React.ReactNode;
}>(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(5),
  justifyContent: "flex-end",
  alignItems: "center",
  width: "100%",
  marginTop: theme.spacing(4),
  marginRight: theme.spacing(5),
}));

export const FormWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(5),
  backgroundColor: theme.palette.background.paper,
  paddingTop: theme.spacing(7.5),
  borderTop: `0.5px solid ${theme.palette.border.main}`,
}));

export const AccordionActionStyles = styled(Box)(({ theme }) => ({
  display: "flex",
  flex: 1,
  flexDirection: "column",
  gap: theme.spacing(5),
  minWidth: 0,
  overflow: "hidden",
}));

export const PolicyItemsContainer = styled(Box)<{ isExpanded?: boolean }>(({ theme, isExpanded }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(3),
  marginTop: theme.spacing(5),
  opacity: isExpanded ? 1 : 0,
  maxHeight: isExpanded ? "100px" : 0,
  overflow: "hidden",
  transition: "opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1), max-height 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
}));

export const PolicyItemsTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  fontSize: "20px",
  // color: theme.palette.text.neutralwhite,
  color: "rgba(34, 34, 34, 0.6)",
  borderRadius: theme.spacing(1),
}));

export const ArrowContainer = styled(Box)(() => ({
  display: "flex",
  gap: "24px",
  alignItems: "center",
}));

export const ArrowButton = styled(IconButton)(({ theme }) => ({
  padding: "0px",
  "&:disabled": {
    opacity: 0.4,
  },
}));

export const Chevron = styled("img")(() => ({
  width: "24px",
  height: "24px",
}));

export const CarouselWrapper = styled(Box)(() => ({
  overflow: "hidden",
  width: "100%",
  // maxWidth: "1066px",
}));

export const CardsContainer = styled(Box)<{ isExpanded?: boolean }>(({ theme, isExpanded }) => ({
  display: "grid",
  gridTemplateRows: isExpanded ? "1fr" : "0fr",
  transition: "grid-template-rows 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
  overflow: "hidden",
  "& > div": {
    overflow: "hidden",
    minHeight: 0,
  },
}));

export interface StyledPolicySectionProps {
  isExpanded?: boolean;
}

export const StyledPolicySection = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isExpanded",
})<StyledPolicySectionProps>(({ theme, isExpanded }) => ({
  display: "grid",
  gridTemplateRows: isExpanded ? "1fr" : "0fr",
  transition: "grid-template-rows 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
  overflow: "hidden",
  "& > div": {
    overflow: "hidden",
  },
}));

export const StyledPolicySectionContent = styled(Box)(({ theme }) => ({
  minHeight: 0,
}));
export const BasePolicyExpandedContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  minWidth: "122px",
  maxWidth: "122px",
}));
export const PolicyCardsBox = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
}));

export const LoadingContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  padding: theme.spacing(10, 0),
  minHeight: "120px",
}));

export const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  paddingRight: theme.spacing(5),
  paddingBottom: theme.spacing(5),
}));

// Section styled components
export const SectionsContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isExpanded",
})<{ isExpanded?: boolean }>(({ theme, isExpanded }) => ({
  marginTop: theme.spacing(10),
  boxShadow:"0px 8px 24px 0px rgba(38, 38, 38, 0.14)",
  borderRadius: "12px",
  borderStyle: "solid",
  borderColor: "#EC6C27",
  borderWidth: isExpanded ? "4px 2px 2px 2px" : "1px",
  background: "#FFF",
  transition: "border-width 0.7s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
}));
export const SectionsContainerForOptions = styled(Box, {
  shouldForwardProp: (prop) => prop !== "isExpanded",
})<{ isExpanded?: boolean }>(({ theme, isExpanded }) => ({
  marginTop: theme.spacing(10),
  boxShadow:"0px 8px 24px 0px rgba(38, 38, 38, 0.14)",
  borderRadius: "12px",
  borderStyle: "solid",
  borderColor: "#54BE58",
  borderWidth: isExpanded ? "4px 2px 2px 2px" : "1px",
  background: "#FFF",
  marginBottom: theme.spacing(5),
  transition: "border-width 0.7s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
}));

export const SectionContainer = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const SectionTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  color: '#333',
  fontSize: '28px',
}));

export const NoDataMessage = styled(Typography)(({ theme }) => ({
  color: '#666',
  fontStyle: 'italic',
}));

// Section Accordion Components (copied from DashboardBenefitsSection)
export const SectionAccordionWrapper = styled(Box)(({ theme }) => ({
  borderRadius: "12px !important",
  padding: theme.spacing(7.5, 5),
  borderBottom: `1px solid ${theme.palette.neutral.accordianBorder}`,
  backgroundColor: theme.palette.background.paper,
  boxShadow: "none",
  transition: "margin 0.3s ease-in-out",
  "&:before": {
    display: "none",
  },
  "&.Mui-expanded": {
    margin: `0 0 ${theme.spacing(3)} 0`,
  },
}));

export const SectionAccordionHeader = styled(Box)<{ isExpanded: boolean }>(({ theme, isExpanded }) => ({
  marginBottom: isExpanded ? theme.spacing(6.5) : 0,
  borderRadius: "8px",
  cursor: 'pointer',
  marginLeft: theme.spacing(4),
  transition: "margin-bottom 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
  "& .MuiAccordionSummary-content": {
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(4),
    "&.Mui-expanded": {
      margin: 0,
    },
  },
  "& .MuiAccordionSummary-expandIconWrapper": {
    transition: "none",
    transform: "none !important",
  },
}));

export const SectionAccordionTitle = styled(Typography)(({ theme }) => ({
  fontSize: 28,
  fontWeight: 600,
  color: "#222222",
  fontFamily: theme.typography.fontFamily,
  marginBottom: theme.spacing(1),
  "@media (min-width: 769px) and (max-width: 1024px)": {
    fontSize: 22,
  },
  "@media (max-width: 768px)": {
    fontSize: 18,
  },
}));

export const SectionAccordionSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 400,
  color: "#222222",
  fontFamily: theme.typography.fontFamily,
}));

export const SectionAccordionContent = styled(Box)<{ isExpanded: boolean }>(({ theme, isExpanded }) => ({
  display: "grid",
  gridTemplateRows: isExpanded ? "1fr" : "0fr",
  opacity: isExpanded ? 1 : 0,
  transition: "grid-template-rows 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
  pointerEvents: isExpanded ? "auto" : "none",
  "& > div": {
    overflow: "hidden",
    minHeight: 0,
  },
}));

export const SectionHeaderRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
}));

export const SectionIconWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 60,
  height: 60,
  borderRadius: 12,
  "& svg": {
    fontSize: theme.typography.fontSizes.xxl,
    color: theme.palette.secondary.main,
  },
}));

export const SectionLeftWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const SectionHeaderContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
}));
export const ShieldIconWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: 60,
  height: 60,
  borderRadius: 12,
  "& svg": {
    fontSize: theme.typography.fontSizes.xxl,
    color: theme.palette.secondary.main,
  },
}));
export const SectionSheidlTitle = styled(Typography)(({ theme }) => ({
  fontSize: 28,
  fontWeight: 600,
  color: "#222222",
  fontFamily: theme.typography.fontFamily,
  "@media (min-width: 769px) and (max-width: 1024px)": {
    fontSize: 22,
  },
  "@media (max-width: 768px)": {
    fontSize: 18,
  },
}));

export const SectionSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 400,
  color: "#222222",
  fontFamily: theme.typography.fontFamily,
  "@media (min-width: 769px) and (max-width: 1024px)": {
    fontSize: 12,
  },
  "@media (max-width: 768px)": {
    fontSize: 11,
  },
}));
// Enhanced Accordion Item with hover effects
export const HoverAccordionItem = styled(AccordionItem)<{ isExpanded: boolean; colorIndex: number; sectionType?: "compulsory" | "optional" }>(({ theme, isExpanded, colorIndex, sectionType }) => ({
  cursor: 'pointer',
  borderRadius: '12px',
  overflow: 'hidden',
}));
