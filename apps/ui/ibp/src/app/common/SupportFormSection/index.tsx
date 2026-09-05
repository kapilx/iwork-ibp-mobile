import React, { useState } from "react";
import SupportSectionHeader from "../SupportSectionHeader";
import DynamicForm from "@ui/ui-lib/commonComponents/FormComponent";
import { useForm } from "react-hook-form";
import {
  SupportFormContainer,
  FormButtonsContainer,
  CancelButton,
  SubmitButton,
  FormNote,
} from "./styles";
import { CANCEL, SUBMIT } from "../../constants";

interface SupportFormSectionProps {
  image: string;
  headerText: string;
  formConfig: any;
  defaultValues: any;
  onCancel: () => void;
  onSubmit: () => void;
  setFormMethods: (methods: ReturnType<typeof useForm>) => void;
  containerComponent?: React.ComponentType<{ children: React.ReactNode }>;
  noteText?: string;
}

const SupportFormSection: React.FC<SupportFormSectionProps> = ({
  image,
  headerText,
  formConfig,
  defaultValues,
  onCancel,
  onSubmit,
  setFormMethods,
  containerComponent: Container,
  noteText,
}) => {
  const ContentWrapper = Container || React.Fragment;

  return (
    <ContentWrapper>
      <SupportSectionHeader image={image} text={headerText} />
      <SupportFormContainer>
        <DynamicForm
          formConfig={formConfig}
          defaultValues={defaultValues}
          formMethods={setFormMethods}
          variant="ibp"
        />
        <FormButtonsContainer>
          {noteText && <FormNote>{noteText}</FormNote>}
          <CancelButton variant="outlined" onClick={onCancel}>
            {CANCEL}
          </CancelButton>
          <SubmitButton variant="contained" onClick={onSubmit}>
            {SUBMIT}
          </SubmitButton>
        </FormButtonsContainer>
      </SupportFormContainer>
    </ContentWrapper>
  );
};

export default SupportFormSection;
