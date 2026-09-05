import React, { ReactNode } from "react";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

interface LocalizationProviderProps {
  children: ReactNode;
  picker: "DateTimePicker" | "DatePicker" | "TimePicker";
}

const DatePickerWrapper: React.FC<LocalizationProviderProps> = (props) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DemoContainer components={[props.picker]}>
        {props.children}
      </DemoContainer>
    </LocalizationProvider>
  );
};

export default DatePickerWrapper;
