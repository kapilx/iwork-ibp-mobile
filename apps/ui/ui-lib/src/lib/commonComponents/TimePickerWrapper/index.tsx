import React, { ReactNode } from "react";
import { DemoContainer } from "@mui/x-date-pickers/internals/demo";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

interface LocalizationProviderProps {
  children: ReactNode;
  picker: "TimePicker";
}

const TimePickerWrapper: React.FC<LocalizationProviderProps> = (props) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DemoContainer components={[props.picker]}>
        {props.children}
      </DemoContainer>
    </LocalizationProvider>
  );
};

export default TimePickerWrapper;
