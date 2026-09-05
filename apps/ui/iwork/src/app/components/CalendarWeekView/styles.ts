
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';


export const WeeklyCalendarMainContainer = styled(Box)({
  paddingTop: "8px",
  display: 'flex',
  overflowX: 'scroll',
  overflowY: 'scroll',
  width: '100%',
  '&::-webkit-scrollbar': {
    display: 'none',
  },
});

export const CalendarWeekViewContainer = styled(Paper)({
  height: '100vh',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  position: 'relative',
  alignItems: 'center',
  borderRight: '1px solid #CEE3FB',
  boxShadow: 'none',
  backgroundColor: '#FAFAFA', // light gray background

});

export const LastWeekButton = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  fontSize: '1.2rem',
  cursor: 'pointer',
  fontWeight: 'bold',
  height: '55px',
  display: 'flex',
  alignItems: 'center',
  width: '20px',
  justifyContent: 'center',
});

export const NextWeekButton = styled(Box)({
  position: 'absolute',
  top: 0,
  right: 0,
  fontSize: '1.2rem',
  cursor: 'pointer',
  fontWeight: 'bold',
  height: '55px',
  display: 'flex',
  alignItems: 'center',
  width: '20px',
  justifyContent: 'center',
});

export const CustomDateWithNumberWrapper = styled(Box)({
  display: 'flex',  
  flexDirection: 'column',
  gap: '0', // gap: 3 * 8px (MUI spacing unit)
})

export const DaySlotContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '3px', // gap: 3 * 8px (MUI spacing unit)
  marginTop: '16px', // mt: 2 * 8px
  width: '100%',
  maxWidth: '168px', // Adjusted to match MainContentBox width
  justifyContent: 'space-between',
});

export const MainContentBox = styled(Box)({
  width: '168px',
  padding: '8px', 
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  borderRadius: '3px',
    boxShadow: `
    0px 1px 1px rgba(0, 0, 0, 0.1),
    0px 2px 2px rgba(0, 0, 0, 0.1),
    0px 1px 1px -2px rgba(0, 0, 0, 0.07)
  `,
  backgroundColor: '#FFFFFF', // white background

});

export const CustomTypography = styled(Box)({
  fontFamily: 'Figtree',
  fontWeight: 400,
  fontSize: '12px',
  color: '#111111',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',  
  flexWrap: 'wrap',

  

});

export const CustomTypographyContainer = styled(Box)({
  width: '132px', 
  
});

interface CustomDateProps {
  isToday?: boolean;
}

export const CustomDateWithNumberPaper = styled(Paper)<CustomDateProps>(({ isToday }) => ({
  width: '100%',
  height: '55px',
  display: 'flex',  
  flexDirection: 'column',
  gap: "10px",
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingTop: '7px', 
  paddingBottom: '7px', 
  borderBottom: isToday ? '3px solid #0A73E9' : '3px solid transparent',
  borderRadius: '0px',
  boxShadow:" 0px 4px 4px 0px #0A73E91A",
  transition: 'all 0.2s ease',

}));

export const CustomTypographyForDateNumber = styled(Typography)<CustomDateProps>(
  ({ isToday }) => ({
    fontFamily: 'Figtree',
    fontWeight: 500, // Fixed: don't use `"500px"`, just use `500` as a number
    fontSize: '18px',
    textAlign: 'center',
    color: isToday ? '#0A73E9' : '#111111', // Apply blue if it's today
  })
);

export const CustomTypographyForDate = styled(Typography)<CustomDateProps>(
  ({ theme,isToday }) => ({
    fontFamily: 'Figtree',
    fontWeight: 400, // Fixed: don't use `"500px"`, just use `500` as a number
    fontSize: '12px',
    textAlign: 'center',
    color: isToday ? '#0A73E9' : '#111111', 
  })

);



export const TabsWrapper = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  width: "100%",
  gap: theme.spacing(2),
  marginLeft: theme.spacing(4),
  // backgroundColor:"red" 


}));


export const StyledCalendarContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  overflow: 'hidden',
  height: '100%',
  
}));


export const StyleDate = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes.sm,

}));

// Reference for theme contents
//  marginLeft: theme.spacing(4),
//  fontSize: theme.typography.fontSizes.sm,
//  color: theme.palette.text.primary,
// fontFamily: theme.typography.fontFamily



// task container for calender view in starts here 



export const StyledPriorityTypography = styled(Typography)(({ theme }) => ({
  fontFamily: theme.typography.fontFamily,
  fontSize: theme.typography.fontSizes.xs,
  fontWeight: theme.typography.fontWeights.medium,
  // color: theme.palette.text.,
  // color: theme.palette.kpiColors., // Use primary color from theme
}));


// Month and year typography box styling

export const YearHeadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  marginBottom: theme.spacing(2),      // replaces `mb: 2`
  paddingTop: '8px',
}));

export const YearHeadingIconContainer = styled(Box)(({ theme }) => ({
    cursor: "pointer",
}));

export const StyleYearContainer = styled(Box)(({ theme }) => ({
  marginLeft: theme.spacing(2), 
  marginRight: theme.spacing(2), 
  minWidth: '200px', // Ensures the year container has a minimum width
  textAlign: 'center', // Centers the text within the box
}));

export const WeeklyCalendarTodayPointer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '36px',
  left: '48%',
}));

export const StyledLeftIcon = styled("img")(({ theme }) => ({
  // maxWidth: '18px',
  // maxHeight: '20px',

}));

export const StyledRightIcon = styled("img")(({ theme }) => ({
  rotate: '180deg',

}));

