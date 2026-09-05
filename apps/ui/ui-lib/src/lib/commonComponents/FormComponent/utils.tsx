import { Controller, Control } from "react-hook-form";
import { FormFieldConfig } from "./types";

interface ControlledFieldProps {
  field: FormFieldConfig;
  control: Control;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: (props: any) => JSX.Element;
}

export const ControlledField = ({
  field,
  control,
  render,
}: ControlledFieldProps) => {
  const { name, label, componentProps, rules, type } = field;

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      // defaultValue={defaultValue}
      render={({
        field: { onChange, value, ...rest },
        fieldState: { error },
      }) => {
        const sharedProps = {
          ...componentProps,
          ...rest,
          onChange,
          value: value ?? "",
          error: !!error,
          helperText: error?.message,
          label: rules?.required ? label + " *" : label,
          name: name,
        };
        return render(sharedProps);
      }}
    />
  );
};
