import React from "react";
import { Button, DialogContent } from "@mui/material";
import { useForm } from "react-hook-form";
import {
  DialogContentStyledBox,
  DialogStyledButton,
  StyledDialog,
  StyledDialogActions,
  StyledDialogTitle,
} from "./styles";
import { ADD, CANCEL, UPDATE } from "../../constants";
import DynamicForm from "../FormComponent";
import { FormFieldConfig } from "../FormComponent/types";

interface GenericFormDialogProps<T> {
  open: boolean;
  onClose: () => void;
  onSave: (data: T) => void;
  initialData?: T;
  title: string;
  fields: FormFieldConfig[];
  defaultValues: T;
}

export const GenericFormDialog = <T extends object>({
  open,
  onClose,
  onSave,
  initialData,
  title,
  fields,
  defaultValues,
}: GenericFormDialogProps<T>) => {
  const [formMethods, setFormMethods] =
    React.useState<ReturnType<typeof useForm>>();

  React.useEffect(() => {
    if (initialData && formMethods && open) {
      Object.entries(initialData).forEach(([key, value]) => {
        formMethods?.setValue(key, value);
      });
    } else if (formMethods) {
      formMethods.reset(defaultValues);
    }
  }, [initialData, formMethods, open]);

  const onSubmit = (data: any) => {
    onSave(data);
    onClose();
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledDialogTitle>{title}</StyledDialogTitle>
      <DialogContent>
        <DialogContentStyledBox>
          <DynamicForm
            formConfig={fields}
            formMethods={setFormMethods}
            defaultValues={defaultValues}
          />
        </DialogContentStyledBox>
      </DialogContent>
      <StyledDialogActions>
        <DialogStyledButton onClick={onClose}>{CANCEL}</DialogStyledButton>
        <Button
          onClick={formMethods ? formMethods.handleSubmit(onSubmit) : undefined}
          variant="contained"
        >
          {initialData ? UPDATE : ADD}
        </Button>
      </StyledDialogActions>
    </StyledDialog>
  );
};

export default GenericFormDialog;
