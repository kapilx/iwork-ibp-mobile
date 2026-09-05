import React from "react";
import { ICellRendererParams } from "ag-grid-community";
import { DateStatusDotContainer, StatusDot } from "./styles";

// Renders a date cell with a status dot: red when the date is past
// (date-only comparison), green when today or in the future. Display text
// comes from the column's valueFormatter via valueFormatted.
const DateStatusDotRenderer: React.FC<ICellRendererParams> = ({
  value,
  valueFormatted,
}) => {
  if (value === null || value === undefined) return <>--</>;

  const date = new Date(value);
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const isPast = date < today;

  return (
    <DateStatusDotContainer>
      <StatusDot $past={isPast} data-testid="date-status-dot" />
      <span>{valueFormatted ?? String(value)}</span>
    </DateStatusDotContainer>
  );
};

export default DateStatusDotRenderer;
