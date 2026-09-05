import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setToastMessage } from "../../redux/slice";
import { RootState } from "../../redux/store";
import {
  Container,
  ModalContainer,
  BlueHeader,
  CloseButton,
  ModalContent,
  ContentWrapper,
  Title,
  ValidationText,
  ButtonContainer,
  CancelButton,
  UpdateButton,
  ValidationRequirementItem,
} from "./styles";
import { CHANGE_PASSWORD } from "../../constants";
import { buildPasswordResetFormConfig, initialPasswordResetData } from "./formConfig";
import { DynamicForm, endPoints, useApi } from "@ui/ui-lib";
import { SubmitHandler, useForm } from "react-hook-form";
import { PasswordRule } from "../../types";

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  reNewPassword: string;
}

interface EnrollmentChangePasswordProps {
  onClose: () => void;
}

const EnrollmentChangePassword: React.FC<EnrollmentChangePasswordProps> = ({ onClose }) => {
  const methods = useForm<ChangePasswordFormData>({
    defaultValues: initialPasswordResetData,
    mode: "onChange",
  });

  const { doFetch, data, error } = useApi();
  const dispatch = useDispatch();

  const rawPasswordRules = useSelector(
    (state: RootState) => state.portalConfig.data?.passwordRules
  );
  const passwordRules = useMemo<PasswordRule[]>(
    () => rawPasswordRules ?? [],
    [rawPasswordRules]
  );

  const formConfig = useMemo(
    () => buildPasswordResetFormConfig(passwordRules),
    [passwordRules]
  );

  const newPasswordValue: string = methods.watch("newPassword") ?? "";

  const ruleResults = useMemo(() => {
    const hasTyped = newPasswordValue.length > 0;
    return passwordRules.map((rule) => {
      if (!hasTyped) return { rule, passing: true };
      if (rule.minChars !== undefined) {
        return { rule, passing: newPasswordValue.length >= rule.minChars };
      }
      if (rule.regex) {
        return { rule, passing: new RegExp(rule.regex).test(newPasswordValue) };
      }
      return { rule, passing: true };
    });
  }, [passwordRules, newPasswordValue]);

  const onSubmit: SubmitHandler<ChangePasswordFormData> = (formData) => {
    if (formData.newPassword !== formData.reNewPassword) {
      dispatch(setToastMessage("New password and re-entered password do not match."));
      return;
    }
    doFetch(endPoints.updateUserPassword, {
      method: "PUT",
      data: formData,
    });
  };

  useEffect(() => {
    const responseData = data as any;
    if (responseData?.message) {
      dispatch(setToastMessage(responseData.message || "Password updated successfully."));
      onClose();
    }
    const responseError = error as any;
    if (responseError) {
      const errorMessage = Array.isArray(responseError?.message)
        ? responseError.message[0]
        : responseError?.message || "Failed to update password.";
      dispatch(setToastMessage(errorMessage));
    }
  }, [data, error, dispatch, onClose]);

  return (
    <Container>
      <ModalContainer>
        <BlueHeader>
          <CloseButton onClick={onClose}>×</CloseButton>
          <Title>{CHANGE_PASSWORD.TITLE}</Title>
        </BlueHeader>
        <ModalContent>
          <ContentWrapper>
            <DynamicForm
              formConfig={formConfig}
              defaultValues={initialPasswordResetData}
              existingMethods={methods as any}
            />

            <ValidationText>
              {CHANGE_PASSWORD.VALIDATION_TEXT}
              {ruleResults.length > 0
                ? ruleResults.map(({ rule, passing }, index) => (
                    <ValidationRequirementItem
                      key={rule.id ?? index}
                      $failing={newPasswordValue.length > 0 && !passing}
                    >
                      {index === 0 ? " " : " • "}
                      {rule.name}
                    </ValidationRequirementItem>
                  ))
                : <span> {CHANGE_PASSWORD.VALIDATION_REQUIREMENTS}</span>}
            </ValidationText>

            <ButtonContainer>
              <CancelButton onClick={onClose}>{CHANGE_PASSWORD.CANCEL_BUTTON}</CancelButton>
              <UpdateButton onClick={methods.handleSubmit(onSubmit as any)}>
                {CHANGE_PASSWORD.UPDATE_BUTTON}
              </UpdateButton>
            </ButtonContainer>
          </ContentWrapper>
        </ModalContent>
      </ModalContainer>
    </Container>
  );
};

export default EnrollmentChangePassword;
