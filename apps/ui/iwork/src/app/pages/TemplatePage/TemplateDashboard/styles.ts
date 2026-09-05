import { Box, Card, CardContent, Typography, InputBase, Select, Button, InputLabel } from '@mui/material';
import { styled } from '@mui/material/styles';

export const DashboardContainer: any = styled(Box)(() => ({
  width: '100%',
}));

export const EmptyStateContainer: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: theme.spacing(37.5),
  textAlign: 'center',
  padding: theme.spacing(3),
}));

export const EmptyStateTitle: any = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
  fontWeight: 600,
}));

export const EmptyStateDescription: any = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(3),
}));

export const TemplateCard: any = styled(Card)(({ theme }) => ({
  height: theme.spacing(32),
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    boxShadow: theme.shadows[6],
    transform: `translateY(${theme.spacing(-0.5)})`,
  },
}));

export const TemplateCardContent: any = styled(CardContent)(({ theme }) => ({
  flexGrow: 1,
  gap: theme.spacing(1),
  display: 'flex', // Reverted to flex/column to ensure footer is at bottom
  flexDirection: 'column',
  padding: `${theme.spacing(2)} !important`, // Override default MUI padding
}));

export const TemplateCardHeader: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(2),
}));

export const TemplateCardTitle: any = styled(Typography)(() => ({
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  flex: 1,
}));

export const TemplateCardChips: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

export const TemplateCardFooter: any = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.light,
  fontSize: theme.typography.caption.fontSize,
  marginTop: 'auto',
}));

export const DialogContentBox: any = styled(Box)(({ theme }) => ({
  minWidth: theme.spacing(50),
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
}));

// New Styled Components for refactoring inline styles
export const IconWrapper: any = styled(Box)(({ theme }) => ({
  display: 'flex', 
  alignItems: 'center',
  marginRight: theme.spacing(1),
}));

export const DeleteMenuItem: any = styled(Box)(({ theme }) => ({
  display: 'flex', 
  alignItems: 'center', 
  color: theme.palette.error.main 
}));

export const SearchWrapper: any = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
  borderRadius: theme.spacing(1),
  padding: theme.spacing(0.5, 1),
  display: 'flex',
  alignItems: 'center',
  border: `${theme.spacing(0.125)} solid ${theme.palette.grey[300]}`,
  width: '100%', // full width within flexibility
  height: theme.spacing(10)
}));

export const HeaderActionsContainer: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

export const StyledSearchIcon: any = styled(Box)(({ theme }) => ({
  color: theme.palette.primary.light,
  marginRight: theme.spacing(1),
  display: 'flex',
  alignItems: 'center',
  paddingLeft: theme.spacing(0.5),
}));

export const StyledInputBase: any = styled(InputBase)(({ theme }) => ({
  flex: 1,
  fontSize: theme.typography.body2.fontSize,
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(0.5),
  }
}));

export const ErrorAlertContainer: any = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

export const FiltersContainer: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
  marginTop: theme.spacing(5),
  marginBottom: theme.spacing(3),
  alignItems: 'flex-start',
  flexWrap: 'wrap',
}));

export const FilterField: any = styled(Box)(({ theme }) => ({
  flex: 1,
}));

export const FlexibleFilterField: any = styled(FilterField)(() => ({
  flex: 2,
}));

export const WhiteSelect: any = styled(Select)(({ theme }) => ({
  backgroundColor: theme.palette.common.white,
}));

export const StyledInputLabel: any = styled(InputLabel)(({ theme }) => ({
  '&.MuiInputLabel-shrink': {
    color: theme.palette.primary.main,
    fontWeight: 500,
  },
  '&.Mui-focused': {
    color: theme.palette.primary.main,
  },
}));

export const ActionButton: any = styled(Button)(({ theme }) => ({
  height: theme.spacing(10),
}));

export const TemplatesGrid: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: theme.spacing(3),
  width: '100%',
}));

export const TemplateGridItem: any = styled(Box)(({ theme }) => ({
  flex: `0 0 calc(33.333% - ${theme.spacing(2)})`,
  width: `calc(33.333% - ${theme.spacing(2)})`,
  maxWidth: `calc(33.333% - ${theme.spacing(2)})`,
  [theme.breakpoints.down('md')]: {
    flex: `0 0 calc(50% - ${theme.spacing(1.5)})`,
    width: `calc(50% - ${theme.spacing(1.5)})`,
    maxWidth: `calc(50% - ${theme.spacing(1.5)})`,
  },
  [theme.breakpoints.down('sm')]: {
    flex: '0 0 100%',
    width: '100%',
    maxWidth: '100%',
  },
}));

export const LoadingBox: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: theme.spacing(37.5),
}));