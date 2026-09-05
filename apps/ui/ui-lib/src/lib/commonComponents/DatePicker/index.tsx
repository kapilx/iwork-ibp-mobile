import * as React from "react";
import {
  DatePicker as MUIDatePicker,
  DatePickerProps as MUIDatePickerProps,
} from "@mui/x-date-pickers/DatePicker";
import { PickerChangeHandlerContext } from "@mui/x-date-pickers/models";
import { DateValidationError } from "@mui/x-date-pickers/models";
import { Dayjs } from "dayjs";
import DatePickerWrapper from "../DatePickerWrapper";

export interface DatePickerProps
  extends Omit<MUIDatePickerProps<Dayjs, never>, "format" | "localeText"> {
  type?: "primary" | "secondary" | "monthYear";
}

const DatePicker: React.FC<DatePickerProps> = ({
  type = "primary",
  slotProps,
  onChange,
  views,
  openTo,
  ...restProps
}) => {
  const isMonthYear = type === "monthYear";
  const inputFormat =
    type === "secondary"
      ? "DD MMM YYYY"
      : isMonthYear
        ? "MMM YYYY"
        : "DD/MM/YYYY";
  const [open, setOpen] = React.useState(false);
  const [remountKey, setRemountKey] = React.useState("initial");

  const {
    className: popperClassName,
    style: popperStyle,
    disablePortal,
    ...popperRest
  } = slotProps?.popper ?? {};

  const mergedPopperProps = {
    disablePortal: disablePortal ?? true,
    ...popperRest,
    className: ["custom-popper-style", popperClassName]
      .filter(Boolean)
      .join(" "),
    style: {
      zIndex: 1701,
      ...(popperStyle ?? {}),
    },
  };

  const mergedSlotProps = {
    ...(slotProps ?? {}),
    popper: mergedPopperProps,
  };

  const handleRemount = () => {
    setRemountKey((prev) => (prev === "active" ? "remount" : "active"));
  };

  //  const handleChange = (value: Dayjs | null, keyboardInputValue?: string) => {
  //   if (value && value.isValid()) {
  //     onChange?.(value, keyboardInputValue);
  //     setOpen(false);
  //     handleRemount();
  //   }
  // };

  const handleChange = (value: Dayjs | null, context: PickerChangeHandlerContext<DateValidationError>) => {
    // Simply pass through the change without any remounting or forced closing
    onChange?.(value, context);
  };

  return (
    <DatePickerWrapper picker="DatePicker">
      <MUIDatePicker
        key={remountKey}
        format={inputFormat}
        views={views ?? (isMonthYear ? ["year", "month"] : undefined)}
        openTo={openTo ?? (isMonthYear ? "month" : undefined)}
        onChange={handleChange}
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => {
          setOpen(false);
          handleRemount();
        }}
        localeText={
          type === "secondary" || type === "monthYear"
            ? { fieldMonthPlaceholder: () => "MMM" }
            : undefined
        }
        slotProps={mergedSlotProps}
        {...restProps}
      />
    </DatePickerWrapper>
  );
};

export default DatePicker;
