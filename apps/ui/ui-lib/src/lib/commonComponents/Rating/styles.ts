import { styled } from "@mui/material/styles";
import { Rating } from "@mui/material";

interface StyledRatingProps {
  starSize?: number;
}

export const StyledRating = styled(Rating, {
  shouldForwardProp: (prop) => prop !== "starSize",
})<StyledRatingProps>(({ theme, starSize = 24 }) => ({
  color: theme.palette.warning.main,
  "& .MuiRating-iconFilled": {
    color: theme.palette.warning.main,
    fontSize: starSize,
  },
  "& .MuiRating-iconEmpty": {
    fontSize: starSize,
  },
  "& .MuiRating-iconHover": {
    color: theme.palette.warning.dark,
  },
  "&.Mui-disabled": {
    opacity: 0.5,
  },
}));