import { styled, Typography, Box, TextField } from "@mui/material";

export const StyledSearchTextField = styled(TextField)(({ theme }) => ({
  backgroundColor: '#fff',
  borderRadius: '12px',
  borderColor: '#e0ddddff',
  boxShadow: '0px 4px 1px 1px rgba(126, 126, 126, 0.1)',
  '& .MuiOutlinedInput-root': {
    height: theme.spacing(12),
    borderRadius: '12px',
    '& fieldset': {
      borderColor: '#e0ddddff',
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.08)',
    },
    '&:hover fieldset': {
      borderColor: '#cec8c8ff',
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.15)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#e0ddddff',
      boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.08)',
    },
  },
  '& input::placeholder': {
    fontSize: theme.spacing(4),
    color: 'rgba(176, 176, 176, 1)',
  },
}));

export const HospitalMainSection = styled(Box)<{ isFocused?: boolean }>(({ theme, isFocused }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: `calc(100vh - 100px)`,
    justifyContent: isFocused ? 'flex-start' : 'space-between',
    marginTop: theme.spacing(25),
    overflow: 'hidden', // Ensure cars disappear when they go off screen
    position: 'relative', // Enable animations
}));

export const HospitalTopContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    justifyContent: 'space-between',
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
}));

export const HospitalTopLeftSectionContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    marginLeft: theme.spacing(2),
    gap: theme.spacing(2),
    justifyContent: 'flex-start',
    alignItems:'center'
}));

export const HospitalTopLeftSectionImage = styled('img')(({ theme }) => ({
    width: 18,
    height: 18,
    marginTop: theme.spacing(1) 
}));

export const HospitalTopLeftSectionText = styled(Typography)(({ theme }) => ({
    fontSize: theme.spacing(4),
    fontWeight: theme.typography.fontWeights.bold,
    fontfamily: theme.typography.fontFamily,
}));
export const HospitalTopWrapper = styled(Box)(({ theme }) => ({
    height: '80px',
}));

export const IconsContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    width: '350px',
    height: '80px',
    overflow: 'hidden',

}));
export const CarIcon = styled('img')(({ theme }) => ({
    width: 57,
    height: 29,
}));
export const TreeIcon = styled('img')(({ theme }) => ({
    width: 29,
    height: 58,
}));
export const HospitalIcon = styled('img')(({ theme }) => ({
    width: 180,
    height: 86,
}));
// export const HorizontalLine = styled('hr')(({ theme }) => ({
//     width: '100%',
//     border: '1px solid #ccc',
//     position: 'absolute',
//     top: '28%',


// }));
export const HospitalCenterSection = styled(Box)(({ theme, isFocused }) => ({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '300px',

}));
export const HospitalCenterSectionText = styled(Typography)(({ theme }) => ({
    fontSize: theme.spacing(5),
    fontWeight: theme.typography.fontWeights.bold,
    fontfamily: theme.typography.fontFamily,
}));
export const HospitalInputWrapper = styled(Box)(({ theme }) => ({
    width: '50%',
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
}));

export const HospitalBottomSection = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: theme.spacing(2),
    overflow: 'visible', // Allow cars to move completely off screen
    position: 'relative', // Enable positioning for animations
    width: '100%', // Ensure full width for animation space
}));

export const BottomLeftImage = styled('img')(({ theme }) => ({
    width: 524, // Updated width to match the grouped cars SVG
    height: 88,
    bottom: 0,
    position: 'relative', // Enable GSAP animations
}));

export const BottomMiddleContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginLeft: theme.spacing(2),
    gap: theme.spacing(15),
    overflow: 'visible', // Allow animations to be visible
}));

export const BottomMidleLeftImage = styled('img')(({ theme }) => ({
    width: 146,
    height: 80,
    position: 'relative', // Enable GSAP animations
}));

export const BottomMidleRightImage = styled('img')(({ theme }) => ({
    width: 87,
    height: 191,
}));

export const BottomRightImage = styled('img')(({ theme }) => ({
    width: 421,
    height: 195,
    marginRight: theme.spacing(6),
}));

export const ResultsContainer = styled(Box)(({ theme }) => ({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(7.5),
    overflowY: 'auto',
    padding: theme.spacing(6),
    height: 'calc(100vh - 64px - 80px)',
    borderTop: `1px solid ${theme.palette.border.hrColor}`,
}));