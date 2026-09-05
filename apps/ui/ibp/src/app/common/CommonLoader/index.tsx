// components/CommonLoader.jsx
import { CircularProgress } from '@mui/material';
import { FullScreenBox, StyledBox } from './styles';

const CommonLoader = ({ fullScreen = false, size = 50, thickness = 3 }) => {
  if (fullScreen) {
    return (
      <FullScreenBox>
        <CircularProgress size={size} thickness={thickness} color='secondary'/>
      </FullScreenBox>
    );
  }

  return (
    <StyledBox>
      <CircularProgress size={size} thickness={thickness} color='secondary'/>
    </StyledBox>
  );
};

export default CommonLoader;
