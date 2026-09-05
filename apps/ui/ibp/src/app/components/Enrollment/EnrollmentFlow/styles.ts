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
import CommonButton from "../../../common/Button";
export const AccordionContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}));
export const BasePolicyContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
}));
export const BasePolicyExpandedContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  minWidth: "122px",
  maxWidth: "122px",
}));
export interface AccordionItemProps {
  isExpanded?: boolean;
  colorIndex?: number;
}
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
    padding: isExpanded ? theme.spacing(5, 5) : theme.spacing(0, 5, 0, 0),
    marginTop: theme.spacing(7.5),
    backgroundColor: theme.palette.background.paper,
    borderBottom: `1px solid ${theme.palette.divider}`,
    cursor: "pointer",
    flexDirection: "column",
    display: "flex",
    marginBottom: theme.spacing(5),
    borderRadius: theme.spacing(3),
    background: isExpanded ? `url("${accordionBg}")` : selectedGradient,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "94% 44%",
    // backgroundPositionX:"100%"
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
}));

export const HealthPolicyImage = styled("img")({});
export const HealthContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(2),
}));

export const EnrollmentHeading = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xl,
  color: theme.palette.background.paper,
  paddingBottom: theme.spacing(5),
  borderBottom: "1px solid #FFFFFF33"
}));

export const AccordionTitle = styled("span", {
  shouldForwardProp: (prop) => prop !== "enrolled",
})<AccordionTitleProps>(({ theme, enrolled }) => ({
  color: theme.palette.text.LightDark,
  // fontWeight: enrolled
  //   ? theme.typography.fontWeights.semiBold
  //   : theme.typography.fontWeightRegular,
  fontWeight: 600,
  minWidth: "152px",
  maxWidth: "152px",
  fontSize: theme.typography.fontSizes.md,
  textTransform: "capitalize",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  display: "block",
}));

export const ExpandedAccordionTitle = styled("span", {
  shouldForwardProp: (prop) => prop !== "enrolled",
})<AccordionTitleProps>(({ theme, enrolled }) => ({
  color: theme.palette.text.LightDark,
  // fontWeight: enrolled
  //   ? theme.typography.fontWeights.semiBold
  //   : theme.typography.fontWeightRegular,
  fontWeight: 600,
  paddingBottom: theme.spacing(2.5),

  fontSize: theme.typography.fontSizes.md,
  textTransform: "capitalize",
}));

export const NotEnrolledIconWrapper = styled("div")(({ theme }) => ({
  marginTop: theme.spacing(0),
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  minWidth: "120px",
  rowGap: theme.spacing(1),
}));

export const AccordionAction = styled("span")(({ theme }) => ({
  marginLeft: theme.spacing(2),
  color: theme.palette.text.primary,
  fontWeight: theme.typography.fontWeights.low,
  fontSize: theme.typography.fontSizes.sm,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
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
  margin: theme.spacing(6, 0, 16),
  paddingTop: theme.spacing(3),
  maxWidth: "none",
  [theme.breakpoints.down("lg")]: {
    margin: theme.spacing(4, 0, 8),
    paddingTop: theme.spacing(2),
  },
}));

export const EmployeeDetailsContainer = styled(Box)(({ theme }) => ({
  // width: "calc(100% + 390px)",
  background:
    "linear-gradient(94.26deg, #1B5092 0%, #266AB7 36.89%, #1675BC 61.3%, #197087 109.99%)",
  boxShadow: "0px 4px 12px 0px rgba(0, 0, 0, 0.08)",
  borderRadius: theme.spacing(0.5),
  padding: theme.spacing(10, 10, 15, 10),
  boxSizing: "border-box",
  overflowX: "hidden",
  marginTop: theme.spacing(12.5),
  [theme.breakpoints.down("lg")]: {
    width: "100%",
    padding: theme.spacing(4),
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3),
  },
  "@media (max-width: 1280px)": {
    marginTop: theme.spacing(10),
  }
}));

export const EmployeeDetailsCard = styled(Box)(({ theme }) => ({
  padding: 0,
  width: "100%",
  maxWidth: "1080px",
  position: "relative",
  boxSizing: "border-box",
  [theme.breakpoints.down("xl")]: {
    maxWidth: "calc(100% - 430px)",
  },
  [theme.breakpoints.down("lg")]: {
    maxWidth: "100%",
  },
}));

export const EmployeeDetailsHeaderTitle = styled("h3")<{ isEdit?: boolean }>(
  ({ theme, isEdit }) => ({
    color: theme.palette.background.paper,
    fontWeight: theme.typography.fontWeights.semiBold,
    fontSize: theme.typography.fontSizes.xxl,
    margin: theme.spacing(0),
    marginTop: isEdit ? theme.spacing(7) : theme.spacing(7),
  }),
);

export const EmployeeDetailsMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  columnGap: theme.spacing(2),
  rowGap: theme.spacing(2),
  marginTop: theme.spacing(4),
  color: theme.palette.background.paper,
}));

export const EmployeeDetailsMetaItem = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.background.paper,
  whiteSpace: "nowrap",
}));

export const EmployeeDetailsValueRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  flexWrap: "wrap",
  minWidth: 0,
}));

export const EmployeeDetailsMetaIcon = styled("img")(() => ({
  width: "34px",
  height: "34px",
  borderRadius: "50%",
  flexShrink: 0,
}));

export const EmployeeDetailsMetaSeparator = styled("span")(({ theme }) => ({
  color: theme.palette.background.paper,
  opacity: 0.55,
  fontSize: theme.typography.fontSizes.xl,
  lineHeight: 1,
  flexShrink: 0,
}));

export const EmployeeDetailsSecondaryMetaRow = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  columnGap: theme.spacing(2),
  rowGap: theme.spacing(1.5),
  marginTop: theme.spacing(3),
  color: theme.palette.background.paper,
}));

export const EmployeeDetailsSecondaryMetaItem = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.background.paper,
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
  overflow: "visible",
}));

export const EmployeeDetailsToggleButton = styled(IconButton)(({ theme }) => ({
  padding: 0,
  width: "20px",
  height: "20px",
  color: theme.palette.text.lightBlue,
  "& img": {
    width: "16px",
    height: "16px",
  },
}));

export const EmployeeDetailsLabel = styled("div")(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeightRegular,
  color: theme.palette.background.paper,
  opacity: 0.6,
  marginBottom: theme.spacing(1),
}));

export const EmployeeDetailsItem = styled(Box)(({ theme }) => ({
  minWidth: "0",
  display: "flex",
  flexDirection: "column",
}));

export const EmployeeDetailsGrid = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(4, 1fr)",
  columnGap: theme.spacing(2.5),
  rowGap: theme.spacing(5),
  marginBottom: 0,
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns: "repeat(3, 1fr)",
  },
  [theme.breakpoints.down("md")]: {
    gridTemplateColumns: "repeat(2, 1fr)",
  },
  [theme.breakpoints.down("sm")]: {
    gridTemplateColumns: "repeat(1, 1fr)",
  },
}));

export const EnrolledIconStyles = styled("img")(({ theme }) => ({
  // width: "85px",
  // height: "18px",
}));

export const AccordionCollapsedIconStyles = styled("img", {
  shouldForwardProp: (prop) => prop !== "expanded",
})<{ expanded?: boolean }>(({ theme, expanded }) => ({
  width: "20px",
  height: "20px",
  transition: "transform 0.3s",
  transform: expanded ? "rotate(-180deg)" : "rotate(0deg)",
}));

export const AccordionHeaderContent = styled(Box)(({ theme }) => ({
  display: "flex",
  // flexDirection: "column",
  alignItems: "center",
  gap: theme.spacing(1),
  minWidth: "180px",
  marginRight: theme.spacing(10),
}));

export const PolicySummaryContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  columnGap: theme.spacing(15),
  alignItems: "center",
}));

export const PolicySummaryItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  minWidth: theme.spacing(30),
}));

export const PolicySummaryLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xs,
  color: theme.palette.text.fadeGrey,
  textTransform: "capitalize",
}));

export const PolicySummaryValue = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.md,
  // fontWeight: theme.typography.fontWeights.semiBold,
  color: theme.palette.text.LightDark,
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

export const IconButton1 = styled(Button)(({ theme }) => ({
  color: theme.palette.chips.senary,
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.sm,
  textTransform: "none",
  padding: 0,
  minWidth: "auto",
  "&:hover": {
    backgroundColor: "transparent",
  },
}));

export const IconsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(2.5),
  "@media (min-width: 769px) and (max-width: 1360px)": {
    gap: theme.spacing(1),
  },
  "@media (max-width: 768px)": {
    gap: theme.spacing(1),
    "& img": {
      width: "20px",
      height: "20px",
    },
  },
}));

export const CardContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  border: `1px solid #EDEDED`,
  padding: theme.spacing(5, 5, 6, 5),
  display: "flex",
  flexDirection: "column",
  borderRadius: theme.spacing(2),
  width: "100%",
  minWidth: 0,
  [theme.breakpoints.down("lg")]: {
    padding: theme.spacing(3),
  },
  "@media (max-width: 768px)": {
    padding: theme.spacing(2),
    overflowX: "auto",
    WebkitOverflowScrolling: "touch",
  },
}));
export const CardMainContainer = styled(Box)(({ theme }) => ({
  // marginTop: theme.spacing(7.5),
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(3),
  width: "100%",
  minWidth: 0,
}));

export const Header = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  "@media (max-width: 768px)": {
    flexWrap: "wrap",
    rowGap: theme.spacing(2),
    alignItems: "flex-start",
  },
}));

export const Title = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  fontSize: theme.typography.fontSizes.xxl,
  color: theme.palette.text.LightDark,
}));
export const TitleText = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.xl,
  color: theme.palette.text.tertiary,
  opacity: 0.6,
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.md,
  },
  "@media (max-width: 420px)": {
    width: "100%",
    fontSize: theme.typography.fontSizes.sm,
  },
}));

export const AddDependentButton = styled(Button)(({ theme }) => ({
  textTransform: "none",
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.md,
  color: theme.palette.background.paper,
  minWidth: "auto",
  padding: theme.spacing(1, 3.5),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1.5),
  backgroundColor: "#093F84",
  "&:hover": {
    backgroundColor: "#093F84",
    color: theme.palette.background.paper,
  },
  "&.Mui-disabled": {
    backgroundColor: "transparent",
    color: theme.palette.text.disabled,
  },
  whiteSpace: "nowrap",
  "& .MuiButton-startIcon": {
    marginRight: theme.spacing(0.75),
    marginBottom: 0,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.sm,
    width: "100%",
    justifyContent: "flex-start",
    paddingLeft: theme.spacing(3.5),
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
  width: "100%",
  [theme.breakpoints.down("md")]: {
    flexDirection: "column",
  },
}));

export const FieldItem = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  flex: 1,
  minWidth: "250px",
  "@media (max-width: 768px)": {
    minWidth: "unset",
    width: "100%",
    flex: "unset",
  },
}));
export const FamilyImage = styled("img")({});

export const DeleteIcon = styled("img")(({ theme }) => ({
  width: "24px",
  height: "24px",
  "@media (min-width: 1025px) and (max-width: 1199px)": {
    width: "20px",
    height: "20px",
  },
}));
export const FieldTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.lg,
  color: theme.palette.background.paper,
  
  textTransform: "capitalize",
}));

export const FieldSubtitle = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.background.paper,
  opacity: 0.6,
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
  alignItems: "flex-start",
  flexDirection:"column",
  gap: theme.spacing(0.5),
}));

export const AddPolicyButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.text.Deeporange,
  color: theme.palette.background.paper,
  borderRadius: theme.spacing(6),
  fontWeight: theme.typography.fontWeights.medium,
}));

export const CancelButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderRadius: theme.spacing(6),
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
  "@media (max-width: 768px)": {
    marginRight: 0,
    gap: theme.spacing(2),
    justifyContent: "space-between",
  },
  "@media (max-width: 420px)": {
    flexDirection: "column",
    gap: theme.spacing(1.5),
    "& > *": {
      width: "100%",
    },
  },
}));

export const FormWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(8),
  backgroundColor: theme.palette.background.paper,
  paddingTop: theme.spacing(7.5),
  "& form > .MuiBox-root > .MuiGrid-root.MuiGrid-container": {
    columnGap: `${theme.spacing(3)} !important`,
    marginLeft: 0,
    alignItems: "flex-start",
    width: "100%",
  },
  "& form > .MuiBox-root > .MuiGrid-root.MuiGrid-container > .MuiGrid-root": {
    marginTop: "0 !important",
  },
  "& .MuiFormControl-root.MuiTextField-root .MuiOutlinedInput-root": {
    marginTop: "0 !important",
  },
  "& form .MuiTypography-body2": {
    whiteSpace: "nowrap",
  },
  [theme.breakpoints.down("xl")]: {
    "& form > .MuiBox-root > .MuiGrid-root.MuiGrid-container": {
      columnGap: `${theme.spacing(3)} !important`,
      marginLeft: 0,
    },
  },
  [theme.breakpoints.down("lg")]: {
    "& form > .MuiBox-root > .MuiGrid-root.MuiGrid-container": {
      columnGap: `${theme.spacing(2)} !important`,
      marginLeft: 0,
    },
  },
  "@media (max-width: 768px)": {
    gap: theme.spacing(4),
    paddingTop: theme.spacing(4),
    "& form > .MuiBox-root > .MuiGrid-root.MuiGrid-container": {
      columnGap: `${theme.spacing(2)} !important`,
      marginLeft: `${theme.spacing(0)} !important`,
    },
  },
  "@media (max-width: 480px)": {
    gap: theme.spacing(3),
    paddingTop: theme.spacing(3),
  },
}));

export const AccordionActionStyles = styled(Box)(({ theme }) => ({
  display: "flex",
}));

export const PolicyItemsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(4),
  marginTop: theme.spacing(5),
}));

export const PolicyItemsTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
  fontSize: theme.typography.fontSizes.lg,
  color: theme.palette.text.ternary,
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
  // padding: "16px",
  // margin: "-16px",
}));

export const CardsContainer = styled(Box)(() => ({
  display: "flex",
  gap: "16px",
  transition: "transform 0.5s ease",
  "& > *": {
    flex: "0 0 315px",
    width: "315px",
    minWidth: "315px",
  },
}));

export const StyledPolicySection = styled(Box)(({ theme }) => ({
  // marginLeft: "16px",
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
export const CommonButtonContainer = styled(CommonButton)(({ theme }) => ({
  borderRadius: "8px !important",
}));
export const AddCommonButton = styled(CommonButton)(({ theme }) => ({
  background: "#093F84 !important",
}));

// Table-like structure for family members
export const TableHeaderRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 2.2fr) minmax(0, 1.6fr) minmax(0, 1.6fr) minmax(0, 2.1fr) minmax(0, 0.9fr)",
  columnGap: theme.spacing(2),
  alignItems: "center",
  padding: theme.spacing(2, 0),
  borderBottom: "1px solid #0000001A",
  marginBottom: theme.spacing(2),
  width: "100%",
  [theme.breakpoints.down("xl")]: {
    gridTemplateColumns:
      "minmax(0, 1.9fr) minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(0, 1.6fr) minmax(0, 0.8fr)",
    columnGap: theme.spacing(1.5),
  },
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns:
      "minmax(0, 1.7fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 0.7fr)",
    columnGap: theme.spacing(1),
  },
  "@media (min-width: 1025px) and (max-width: 1199px)": {
    gridTemplateColumns:
      "minmax(0, 1.5fr) minmax(0, 0.9fr) minmax(0, 0.9fr) minmax(0, 1.2fr) minmax(0, 1fr)",
    columnGap: theme.spacing(1),
  },
  // ≤768px: fixed pixel columns so table scrolls horizontally
  "@media (max-width: 768px)": {
    gridTemplateColumns: "140px 80px 70px 150px 64px",
    minWidth: "520px",
    columnGap: theme.spacing(1),
  },
}));

export const TableHeaderCell = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.text.tertiary,
  opacity: 0.7,
  minWidth: 0,
  overflow: "hidden",
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.xs,
  },
}));

export const TableDataRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 2.2fr) minmax(0, 1.6fr) minmax(0, 1.6fr) minmax(0, 2.1fr) minmax(0, 0.9fr)",
  columnGap: theme.spacing(2),
  padding: theme.spacing(3, 0),
  alignItems: "center",
  borderBottom: `1px solid ${theme.palette.divider}`,
  width: "100%",
  "&:last-child": {
    borderBottom: "none",
  },
  [theme.breakpoints.down("xl")]: {
    gridTemplateColumns:
      "minmax(0, 1.9fr) minmax(0, 1.2fr) minmax(0, 1.2fr) minmax(0, 1.6fr) minmax(0, 0.8fr)",
    columnGap: theme.spacing(1.5),
  },
  [theme.breakpoints.down("lg")]: {
    gridTemplateColumns:
      "minmax(0, 1.7fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.4fr) minmax(0, 0.7fr)",
    columnGap: theme.spacing(1),
  },
  "@media (min-width: 1025px) and (max-width: 1199px)": {
    gridTemplateColumns:
      "minmax(0, 1.5fr) minmax(0, 0.9fr) minmax(0, 0.9fr) minmax(0, 1.2fr) minmax(0, 1fr)",
    columnGap: theme.spacing(1),
  },
  // ≤768px: fixed pixel columns matching header
  "@media (max-width: 768px)": {
    gridTemplateColumns: "140px 80px 70px 150px 64px",
    minWidth: "520px",
    columnGap: theme.spacing(1),
    padding: theme.spacing(2, 0),
  },
}));

export const TableDataCell = styled(Box)(({ theme, addMarginLeft }: { theme: any; addMarginLeft?: boolean }) => ({
  fontSize: theme.typography.fontSizes.md,
  fontWeight: theme.typography.fontWeights.regular,
  color: theme.palette.text.primary,
  minWidth: 0,
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  overflow: "hidden",
  "@media (max-width: 1550px)": {
    marginLeft: addMarginLeft ? theme.spacing(2) : 0,
  },
  "@media (max-width: 768px)": {
    fontSize: theme.typography.fontSizes.sm,
    gap: theme.spacing(0.5),
    marginLeft: 0,
  },
}));

// Eligible-relations strip shown above the "Select Members to Include" header
export const EligibleRelationsStrip = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: theme.spacing(1),
  padding: theme.spacing(1.5, 2.5),
  marginBottom: theme.spacing(1.5),
  borderRadius: "10px",
  backgroundColor: "#F0F6FF",
  border: "1px solid #BFDBFE",
}));

export const EligibleRelationsLabel = styled(Typography)(({ theme }) => ({
  fontSize: 14,
  fontWeight: 700,
  color: "#093F84",
  letterSpacing: "0.06em",
  marginRight: theme.spacing(0.5),
}));

export const EligibleRelationChip = styled(Box)(({ theme }) => ({
  padding: theme.spacing(0.4, 1.25),
  borderRadius: 999,
  backgroundColor: "#fff",
  border: "1px solid #BFDBFE",
  color: "#093F84",
  fontSize: 14,
  fontWeight: 600,
}));

export const ConstraintNote = styled(Typography)(({ theme }) => ({
  fontSize: 12,
  color: "#6B7280",
  marginTop: theme.spacing(0.5),
  marginBottom: theme.spacing(0.5),
  paddingLeft: theme.spacing(0.5),
}));
