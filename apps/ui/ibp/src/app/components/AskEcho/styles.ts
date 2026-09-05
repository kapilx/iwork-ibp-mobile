import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';

export const AskEchoWrapper = styled(Box)<{
  isAtBottom: boolean;
  isFooterVisible?: boolean;
}>(({ isAtBottom, isFooterVisible }) => ({
  position: 'fixed',
  bottom: '20%',
  right: '36px',
  zIndex: 1014,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  WebkitTapHighlightColor: 'transparent',
  transition: 'opacity 0.3s ease-out',
  opacity: isAtBottom || isFooterVisible ? 0 : 1,
  pointerEvents: isAtBottom || isFooterVisible ? 'none' : 'auto',
  width: '80px',
  height: '80px',
  borderRadius: '50%',
  border: "1px solid #0000004D",
  boxShadow: "0px 8.29px 19.89px 0px #0000001A",
  background: "#FFFFFF"
}));
export const AskEchoText = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontWeight: theme.typography.fontWeights.regular,
  fontSize: theme.typography.fontSizes.xs,
}));
export const AskEchoImageWrapper = styled('img')({
  width: '27px',
  height: '27px',
});