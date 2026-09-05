/**
 * Common Rating component using MUI's Rating.
 * Props:
 * - `value`: The rating value (controlled).
 * - `defaultValue`: Default value (uncontrolled).
 * - `readOnly`: Whether it's read-only.
 * - `size`: "small", "medium", or "large".
 * - `onChange`: Callback when the rating changes.
 * - `max`: Maximum number of stars (default 5).
 * - `precision`: The step size (e.g., 0.5 for half-star rating).
 * 
 * Example:
 * <Rating value={3} onChange={(e, v) => console.log(v)} />
 */
import React from "react";
import { Rating as MUIRating, RatingProps as MUIRatingProps } from "@mui/material";
import { StyledRating } from "./styles";

export interface RatingProps extends MUIRatingProps {
  className?: string;
  starSize?: number; // Accept custom star size in px
}

const Rating = ({ className, starSize = 24, ...props }: RatingProps) => {
  // Validation for required value or defaultValue
  if (props.value === undefined && props.defaultValue === undefined) {
    throw new Error("Either 'value' or 'defaultValue' is required for Rating component.");
  }

  return <StyledRating className={className} starSize={starSize} {...props} />;
};

export default Rating;