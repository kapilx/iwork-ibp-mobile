import {
  Container,
  Box,
  Paper,
  Typography,
  TableCell,
  IconButton,
  Stack,
  Button,
  Table,
  tableCellClasses,
  TableRow,
  Alert,
  TableHead,
  FormControlLabel,
  FormGroup,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Grid, FormControl, MenuItem } from "@mui/material";
import { CommonTextField, CommonRadio, CommonSwitch } from "@ui/ui-lib";

export const PolicyConfiguratorStyledFormControl = styled(FormControl)(
  ({ theme }) => ({
    minWidth: 200,
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
    [theme.breakpoints.up("sm")]: {
      marginBottom: 0,
    },
  })
);
export const ParametersTable = styled(Table)(({ theme }) => ({
  [`.${tableCellClasses.root}`]: {
    padding: theme.spacing(1.5, 2),
    verticalAlign: "top",
  },
}));
export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  // Target all direct child TableCell components
  "& > .MuiTableCell-root": {
    paddingTop: theme.spacing(5),
    paddingRight: theme.spacing(4),
    paddingLeft: theme.spacing(4),
  },
  // Set first TableCell to have 20px padding on all sides
  "& > .MuiTableCell-root:first-of-type": {
    padding: theme.spacing(5),
  },
}));
export const StyledDisplayNameCell = styled(TableCell)(({ theme }) => ({
  width: "25%",
  fontWeight: theme.typography.fontWeights.bold,
}));
export const GroupDetailBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5),
}));

export const GroupDetailGridContainer = styled(Grid)({
  alignItems: "center",
});
export const StyledFlexStartBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2),
}));
export const GroupDetailGridItem = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  alignItems: "flex-start",
  gap: theme.spacing(4),
  marginBottom: theme.spacing(2),
}));

export const StyledConfigurationCell = styled(TableCell)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.bold,
}));
export const PolicyConfiguratorStyledContainer = styled(Container)(
  ({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    minHeight: "calc(100vh - 64px)",
    padding: theme.spacing(6, 4.5),
  })
);

export const LoaderWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "80vh",
}));
export const ParametersInfoText = styled(Typography)(({ theme }) => ({
  marginRight: theme.spacing(2),
  marginBottom: theme.spacing(1),
  [theme.breakpoints.up("sm")]: {
    marginBottom: 0,
  },
}));
export const ParametersContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  marginBottom: theme.spacing(2),
  flexWrap: "wrap",
}));
export const LoadingText = styled(Typography)(({ theme }) => ({
  marginLeft: theme.spacing(2),
}));

export const StepperContainer = styled(Box)(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(3),
  flexShrink: 0,
  paddingLeft: theme.spacing(1.5),
}));

export const ContentWrapper = styled(Box)(({ theme }) => ({
  marginBottom: 0,
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
  paddingLeft: theme.spacing(1.5),
}));
export const AddIcon = styled("img")(({ theme }) => ({
  width: "20px",
  height: "20px",
  color: theme.palette.button.secondary,
}));
export const StepPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
}));
export const StyledTablePaper = styled(Paper)(({ theme }) => ({
  border: "unset", // Remove border
  boxShadow: "none", // Remove shadow if you want a flat look
  padding: theme.spacing(3),
  flexGrow: 1,
  display: "flex",
  flexDirection: "column",
  "& .MuiTableCell-root": {
    verticalAlign: "top",
    borderBottom: "none", // Remove border-bottom from all table cells inside this paper
  },
}));

export const Heading = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));
export const RemoveIcon = styled("img")(({ theme }) => ({
  width: "20px",
  height: "20px",
  cursor: "pointer",
}));
export const SectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: theme.spacing(3),
}));
export const AddButton = styled(Button)(({ theme }) => ({
  height: "40px",
  width: "60px",
}));
export const Text = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.lightBlue,
}));
export const ActionBar = styled(Paper)(({ theme }) => ({
  position: "sticky",
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(2),
  zIndex: 10,
  backgroundColor: theme.palette.background.paper,
  borderTop: `${theme.shape.borderSizes.thin} solid ${theme.palette.divider}`,
  flexShrink: 0,
  marginBottom: theme.spacing(1),
}));

export const StyledBtnContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(5),
  paddingLeft: theme.spacing(1.5),
}));

export const ActionBarInner = styled(Box)({
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
});

export const ActionBarContent = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-end",
  gap: theme.spacing(1),
}));



export const ApprovalMessageText = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

export const HeaderTableCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== "cellwidth",
})<{ cellwidth?: string }>(({ theme, cellwidth }) => ({
  fontWeight: theme.typography.fontWeights.bold,
  whiteSpace: "normal",
  wordBreak: "break-word",
  width: cellwidth,
  backgroundColor: "#F3F7FF",
}));

export const BodyLabelCell = styled(TableCell)(({ theme }) => ({
  verticalAlign: "top",
  whiteSpace: "normal",
  wordBreak: "break-word",
}));

export const StyledCommonTextField = styled(CommonTextField)(({ theme }) => ({
  "& .MuiFormHelperText-root": {
    color: theme.palette.text.grey,
  },
}));
export const RelationGroupContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  gap: theme.spacing(2),
  marginLeft: theme.spacing(4),
}));
export const StyledTextButton = styled(Button)({
  justifyContent: "flex-start",
  textTransform: "none",
  textAlign: "left",
  minHeight: 0,
  minWidth: 0,
  padding: 0,
  background: "none",
  "&:hover": {
    background: "none",
  },
});
export const StyledOutlinedButton = styled(Button)({
  alignSelf: "flex-start",
});
export const ChoiceText = styled(Typography)({
  minWidth: "100px",
  flexShrink: 0,
});
export const StyledChoiceBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(3),
  flexWrap: "wrap",
}));
export const ConstraintsTableCell = styled(TableCell)(({ theme }) => ({
  width: "60%",
  verticalAlign: "top",
  // paddingTop: theme.spacing(2),
  // paddingBottom: theme.spacing(2),
}));
export const StyledErrorAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.mode === "light" ? "#ffebee" : "#5c232b",
  color: theme.palette.error.main,
}));

export const StyledWarningAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  padding: theme.spacing(1.5, 2),
}));

export const StyledInfoAlert = styled(Alert)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const StyledRadioImg = styled("img")({
  width: 20,
  height: 20,
});
export const StyledTableCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== "cellwidth",
})<{ cellwidth?: string }>(({ theme, cellwidth }) => ({
  fontWeight: theme.typography.fontWeights.bold,
  width: cellwidth,
  verticalAlign: "top",
  whiteSpace: "normal",
  wordBreak: "break-word",
}));

export const StyledFormControlDiv = styled(FormControl)(({ theme }) => ({
  width: "100%",
  minWidth: "200px",
}));

export const StyledAddSumInsuredIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== "hasOptions",
})<{ hasOptions?: boolean }>(({ theme, hasOptions }) => ({
  padding: theme.spacing(0.25),
  marginLeft: hasOptions ? theme.spacing(0.5) : 0,
}));

export const StyledPremiumPerLifeSwitch = styled(CommonSwitch)(({ theme }) => ({
  // width: 100,
  marginLeft: theme.spacing(2),
  marginRight: theme.spacing(2),
}));
export const PlainChoiceButton = styled(Button)(({ theme }) => ({
  justifyContent: "flex-start",
  textTransform: "none",
  textAlign: "left",
  minHeight: 0,
  minWidth: 0,
  padding: 0,
  background: "none",
  boxShadow: "none",
}));
export const StyledCommonRadio = styled(CommonRadio)(({ theme }) => ({
  marginRight: theme.spacing(0.5),
  flexShrink: 0,
  padding: 0,
  color: "inherit",
}));

export const StyledTextActionButton = styled(Button)(({ theme }) => ({
  justifyContent: "flex-start",
  textTransform: "none",
  marginTop: theme.spacing(2),
  textAlign: "left",
  minHeight: 0,
  minWidth: 0,
  padding: 0,
  background: "none",
  width: "100%",
  "&:hover": {
    background: "none",
  },
}));

export const FadedLabel = styled(Typography)({
  opacity: 1,
});
export const SwitchWrapper = styled("div")(({ theme }) => ({
  // marginLeft: theme.spacing(3),
  // marginRight: theme.spacing(3),
}));

export const StyledRowStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  flexWrap: "wrap",
  paddingTop: theme.breakpoints.down("md") ? theme.spacing(1) : 0,
  width: "100%",
  columnGap: "3px",
  [theme.breakpoints.down("md")]: {
    paddingTop: theme.spacing(1),
  },
  [theme.breakpoints.up("md")]: {
    paddingTop: 0,
  },
}));

export const StyledSumInsuredBox = styled(Box)(({ theme }) => ({
  fontSize: "0.75rem",
  paddingTop: theme.spacing(6),
}));

export const StyledSwitchStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(3),
  "& .MuiTypography-root": {
    fontSize: theme.typography.body2.fontSize,
  },
  "& .MuiSwitch-root": {
    // marginLeft: theme.spacing(3),
    // marginRight: theme.spacing(3),
  },
}));

//for policy componenent

export const StyledStackConatiner = styled(Stack)(({ theme }) => ({
  marginTop: "-50px", // -7 * 8px (MUI spacing unit)
  marginBottom: theme.spacing(4),
  justifyContent: "flex-end",
  flexDirection: "row",
  gap: theme.spacing(1),
  marginRight: theme.spacing(4),
}));

export const StyledAddParentalPolicyButton = styled(Button)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xss,
}));

export const StyledAddOptionalComponentButton = styled(Button)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.xss,
}));
export const StyledFixedTable = styled(Table)(({ theme }) => ({
  "& .MuiTableCell-root": {
    borderBottom: "none",
  },
  tableLayout: "fixed",
  [`& .${tableCellClasses.root}`]: {
    verticalAlign: "top",
    padding: `${theme.spacing(3)} ${theme.spacing(2)}`,
  },
}));

export const StyledTableHead = styled(TableHead)(({ theme }) => ({
  backgroundColor: theme.palette.background.tableHeader,
}));

export const StyledNoPolicyComponentsText = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(2),
}));

export const StyledRemoveIconButton = styled(IconButton)(({ theme }) => ({
  padding: theme.spacing(0.5),
  color: theme.palette.error.main,
}));

export const StyledComponentTypeTypography = styled(Typography)<{
  isBase?: boolean;
}>(({ theme, isBase }) => ({
  fontWeight: isBase
    ? theme.typography.fontWeights.regular
    : theme.typography.fontWeights.medium,
}));

export const StyledStackForConfigDetails = styled(Stack)(({ theme }) => ({
  width: "100%",
  gap: theme.spacing(1.5),
}));

export const StyledStackForSwitch = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  paddingBottom: theme.spacing(5), // 20px
  gap: theme.spacing(4),
}));

export const StyledCommonSwitchTypography = styled(Typography)<{
  isActive?: boolean;
}>(({ theme, isActive }) => ({
  color: isActive ? theme.palette.text.primary : theme.palette.text.disabled,
  cursor: "pointer",
}));

export const StyledSpacingStack = styled(Stack)(({ theme }) => ({
  width: "100%",
  gap: theme.spacing(2),
}));

export const StyledFormControlForCompanyContribution = styled(FormControlLabel)(
  ({ theme }) => ({
    whiteSpace: "nowrap",
    paddingTop: theme.spacing(5), // 20px
  })
);

//for policy template

export const StyledSectionBoxTemplate = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const StyledHeaderStack = styled(Stack)(({ theme }) => ({
  backgroundColor: "#F3F7FF",
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(2),
  alignItems: "center",
}));

export const StyledHeaderCell = styled(Typography)<{ cellwidth?: string }>(
  ({ theme, cellwidth }) => ({
    fontWeight: theme.typography.fontWeights.bold,
    width: cellwidth,
    textAlign: cellwidth === "80px" ? "center" : "left",
  })
);

export const StyledPolicyRowStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: theme.spacing(1),
  paddingLeft: theme.spacing(2),
}));

export const StyledPolicyComponentBox = styled(Box)(({ theme }) => ({
  width: "30%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
}));

export const StyledFlagSwitchBox = styled(Box)(({ theme }) => ({
  width: "220px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  flexShrink: 0,
}));

export const StyledFlagSwitchLabel = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "active" && prop !== "disabled",
})<{ active?: boolean; disabled?: boolean }>(({ theme, active, disabled }) => ({
  fontWeight: theme.typography.fontWeights.regular,
  cursor: disabled ? "default" : "pointer",
  color: active ? theme.palette.text.primary : theme.palette.text.disabled,
  userSelect: "none",
  // pointerEvents: disabled ? "pointer" : "default",
}));

export const StyledSectionLabelForBasePolicy = styled(Typography)(
  ({ theme }) => ({
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    fontWeight: theme.typography.fontWeights.medium,
    paddingLeft: theme.spacing(2),
  })
);

export const StyledFormGroupForBasePolicy = styled(FormGroup)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  flexDirection: "column",
  flexWrap: "nowrap",
}));

export const StyledFormGroupForParentalPolicy = styled(FormGroup)(
  ({ theme }) => ({
    flexWrap: "nowrap",
  })
);

export const StyledAddonRowStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginLeft: theme.spacing(-2),
  marginBottom: theme.spacing(0.5),
}));

export const StyledNoAddonText = styled(Typography)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
}));

export const StyledErrorCaption = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  paddingLeft: theme.spacing(2),
}));

export const StyledSectionDividerBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  marginTop: theme.spacing(3),
}));

export const StyledParentalPolicyRowStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  marginBottom: theme.spacing(1),
}));

export const StyledParentPolicyComponentBox = styled(Box)(({ theme }) => ({
  width: "30%",
}));

export const StyledPolicyComponentLabel = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.bold,
}));

export const StyledErrorText = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  display: "block",
}));

export const StyledSectionLabelForParentalPolicy = styled(Typography)(
  ({ theme }) => ({
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(0.5),
    fontWeight: theme.typography.fontWeights.medium,
  })
);

export const StyledAddonFormControlLabel = styled(FormControlLabel)(
  ({ theme }) => ({
    width: "30%",
    paddingLeft: theme.spacing(4.5),
  })
);

export const StyledCompactTable = styled(Table)(({ theme }) => ({
  "& .MuiTableCell-root": {
    padding: `${theme.spacing(1.5)}, ${theme.spacing(2)}`, // Compact padding
  },
}));

export const StyledPolicyContainer = styled(Box)(({ theme }) => ({
  border: `${theme.shape.borderSizes?.thin || "1px"} solid ${
    theme.palette.divider
  }`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
}));

export const StyledAddonDivider = styled(Box)(({ theme }) => ({
  borderTop: `1px solid ${theme.palette.divider}`,
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(2),
}));

export const StyledClubSumInsuredContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: theme.spacing(1),
  marginTop: theme.spacing(3),
  paddingTop: theme.spacing(3),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

export const StyledTextFieldsContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(3),
  justifyContent: "space-between",
  flex: 1,
}));

export const StyledPolicyFieldsColumnContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
  flex: 1,
}));

export const StyledFlexTextField = styled(CommonTextField)(({ theme }) => ({
  flex: 1,
}));

export const StyledEligibleRelationsBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(2),
}));

export const StyledRelationItemBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

export const StyledRelationTypeLabel = styled(Typography)(({ theme }) => ({
  marginLeft: theme.spacing(0.5),
}));

export const StyledEligibleRelationsContainer = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  // paddingLeft: theme.spacing(6),
  marginBottom: theme.spacing(2),
}));

export const StyledEligibleRelationsTitle = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.semiBold,
  marginBottom: theme.spacing(1),
}));

export const StyledAddonEligibleRelationsTitle = styled(Typography)(
  ({ theme }) => ({
    fontWeight: theme.typography.fontWeights.semiBold,
    marginBottom: theme.spacing(0.5),
  })
);

export const StyledClubSumInsuredLabel = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
}));

export const StyledClubSumInsuredOptionLabel = styled(Typography, {
  shouldForwardProp: (prop) => prop !== "active" && prop !== "clickable",
})<{ active?: boolean; clickable?: boolean }>(
  ({ theme, active, clickable }) => ({
    cursor: clickable ? "pointer" : "default",
    color: active ? theme.palette.text.primary : theme.palette.text.secondary,
    fontSize: theme.typography.fontSizes.sm,
  })
);

export const StyledRelationshipTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.bold,
  verticalAlign: "middle",
  "&:nth-of-type(1)": {
    width: "18%",
  },
  "&:nth-of-type(2)": {
    width: "11%",
  },
  "&:nth-of-type(3)": {
    width: "71%",
  },
}));

export const StyledRelationshipTableRow = styled(TableRow)(({ theme }) => ({
  "& > .MuiTableCell-root": {
    paddingTop: theme.spacing(3.75), // 11px ≈ 3.75 * 4px
    paddingBottom: theme.spacing(3.75),
  },
  "&:hover > .MuiTableCell-root": {
    backgroundColor: theme.palette.background.deepOrange,
  },
}));

export const StyledCheckboxLabelBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
}));

export const StyledRelationshipTableHeader = styled(TableCell)(({ theme }) => ({
  verticalAlign: "top",
  fontWeight: theme.typography.fontWeights.bold,
}));

export const StyledPermittedRelationsBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "row",
  gap: theme.spacing(7),
  flexWrap: "wrap",
  scrollbarWidth: "none", // Firefox
  msOverflowStyle: "none", // IE/Edge
  "&::-webkit-scrollbar": {
    display: "none", // Chrome/Safari/Opera
  },
}));

export const StyledPermittedRelationOptionBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
}));

export const StyledPermittedRelationOptionInnerBox = styled(Box)(
  ({ theme }) => ({
    display: "flex",
    alignItems: "center",
    marginBottom: theme.spacing(1.75),
  })
);

export const FadedLabelForRelationshipComponent = styled(Typography)({
  opacity: 0.7,
  minWidth: "100px",
  flexShrink: 0,
});

export const StyledFlexBox = styled(Box)({
  display: "flex",
});

export const StyledFamilyMaxTableRow = styled(TableRow)(({ theme }) => ({
  "& > .MuiTableCell-root": {
    paddingTop: theme.spacing(1.375), // 11px ≈ 1.375 * 8px
    paddingBottom: theme.spacing(1.375),
    opacity: 0.4,
  },
}));

export const StyledMediumTypography = styled(Typography)(({ theme }) => ({
  fontWeight: theme.typography.fontWeights.medium,
}));

export const PolicyConfiguratorNoDataBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  textAlign: "center",
  color: theme.palette.text.primary,
  width: "100%",
  height: "calc(100vh - 418px)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  "& img": {
    maxWidth: "565px",
  },
}));

export const PolicyConfiguratorNoDataText = styled(Box)(({ theme }) => ({
  fontSize: theme.typography.fontSizes.sm,
  fontWeight: theme.typography.fontWeights.medium,
  color: theme.palette.neutral.dark,
  alignContent: "center",
}));

export const RelationGroupDetailItemContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
}));

export const StyledAddIcon = styled(AddIcon)(({ theme }) => ({
  color: "#0A73E9",
  fontWeight: "300",
}));

export const StyledFlexEndBox = styled(Box)({
  display: "flex",
  alignItems: "flex-end",
});

export const StyledMarginTopBox = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(4),
}));

export const StyledRowStackWithMargin = styled(Stack)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

export const StyledMarginBottomBox = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const StyledDetailGridContainer = styled(Grid)(({ theme }) => ({
  display: "flex",
  gap: "18px",
  marginTop: theme.spacing(6),
  marginLeft: theme.spacing(4),
}));

export const StyledDetailGridItem = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(2), // 8px
}));

export const StyledRelationNameTypography = styled(Typography)({
  minWidth: "max-content",
});

export const StyledFamilyMaxGrid = styled(Grid)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  justifyContent: "space-between",
}));

export const StyledFlexCenterBox = styled(Box)({
  display: "flex",
  alignItems: "center",
});

export const StyledFamilyMaxTypography = styled(Typography)(({ theme }) => ({
  minWidth: "max-content",
  fontWeight: theme.typography.fontWeights.medium,
}));

export const ErrorTextContainer = styled(Box)(({ theme }) => ({
  height: "1.25em",
}));

export const ErrorTextSpan = styled("span")<{ show: boolean }>(
  ({ theme, show }) => ({
    opacity: show ? 1 : 0,
    transition: theme.transitions.create("opacity", {
      duration: theme.transitions.duration.short,
      easing: theme.transitions.easing.easeInOut,
    }),
    color: theme.palette.error.main,
    fontSize: theme.typography.caption.fontSize,
  })
);

export const StyledRelationErrorText = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  marginTop: theme.spacing(1),
}));

export const StyledSequenceBox = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  flexShrink: 0,
  width: "70px",
  marginTop: 0,
}));

export const StyledSequenceTextField = styled(CommonTextField)({
  width: "100%",
});



export const StyledSubmitForApprovalMessage = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2,0),
}));