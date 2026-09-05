import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

export const PreviewContainer: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  minHeight: theme.spacing(37.5), // ~300px
  padding: theme.spacing(3),
  width: '100%',
}));

export const ButtonContainer: any = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(2),
}));