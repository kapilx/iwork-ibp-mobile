import React, { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import DynamicForm from "@ui/ui-lib/commonComponents/FormComponent";
import useApi from "@ui/ui-lib/hooks/useApi";
import IIRM_LOGO from "../../assets/svgs/iirm-logo.svg";
import {
  PASSWORD_RESET_FORM_CONFIG,
  initialPasswordResetData,
} from "./formConfig";
import { PasswordResetFormData } from "./types";
import {
  ButtomContainer,
  StyledContainer,
  LoginContainer,
  HeadingContainer,
  TitleContainer,
  LogoContainer,
  Logo,
  StyledAlert,
  BrandRibbon,
} from "./styles";
import CommonButton from "../../common/Button";
import { SUBMIT } from "../../constants";
import { endPoints } from "@ui/ui-lib";

const PasswordReset: React.FC = () => {
  const [formMethods, setFormMethods] = useState<ReturnType<typeof useForm>>();
  const { doFetch, data, error, loading } = useApi();
  const navigate = useNavigate();

  const onSubmit: SubmitHandler<PasswordResetFormData> = (formData) => {
    const { confirmPassword, ...restPasswordData } = formData;
    doFetch(endPoints.updatePassword, {
      method: "POST",
      data: restPasswordData,
    });
  };

  useEffect(() => {
    if (data) {
      navigate("/login");
    }
  }, [data, navigate]);

  return (
    <>
      <BrandRibbon>Empowering Insurance Excellence | India Insure</BrandRibbon>
      <StyledContainer>
        <LoginContainer>
          <LogoContainer>
            <Logo src={IIRM_LOGO} alt="IIRM Logo" />
          </LogoContainer>
          <HeadingContainer>
            <TitleContainer variant="h1">Reset Password</TitleContainer>
          </HeadingContainer>
          {error && <StyledAlert>{(error as any).message}</StyledAlert>}
          <DynamicForm
            formConfig={PASSWORD_RESET_FORM_CONFIG}
            defaultValues={initialPasswordResetData}
            formMethods={setFormMethods}
            sx={{ maxWidth: "372px" }}
          />
          <ButtomContainer>
            <CommonButton
              variant="contained"
              buttonType="secondary"
              label={SUBMIT}
              loading={loading}
              disabled={loading}
              onClick={
                formMethods ? formMethods.handleSubmit(onSubmit) : undefined
              }
            />
          </ButtomContainer>
        </LoginContainer>
      </StyledContainer>
    </>
  );
};

export default PasswordReset;
