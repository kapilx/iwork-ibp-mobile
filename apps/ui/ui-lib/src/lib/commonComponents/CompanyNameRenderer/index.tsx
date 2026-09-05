import React from "react";
import { ICellRendererParams } from "ag-grid-community";
import { Box, Tooltip } from "@mui/material";
import {
  CompanyNameRendererContainer,
  NameText,
  TypeText,
  ColorCompanyText,
  TotalContainer,
} from "./styles";

interface ICompanyNameRendererProps extends ICellRendererParams {
  nameField?: string;
  subTextField?: string;
  colorKey?: string;
}

const resolveNestedField = (data: any, fieldPath: string): string => {
  return fieldPath.split(".").reduce((acc, key) => acc?.[key], data) || "--";
};

const CompanyNameRenderer: React.FC<ICompanyNameRendererProps> = ({
  data,
  nameField = "name",
  subTextField = "subText",
  colorKey = "colorKey",
}) => {
  const name = resolveNestedField(data, nameField);
  const subText = resolveNestedField(data, subTextField);
  const colorValue = resolveNestedField(data, colorKey);
  return (
    <TotalContainer>
      <ColorCompanyText data-testid="colorDot" color={colorValue || "gray"} />

      <CompanyNameRendererContainer data-testid="companyNameAndIndustry">
        <NameText data-testid="companyName">{name}</NameText>
        {subText && <TypeText data-testid="industry">{subText}</TypeText>}
      </CompanyNameRendererContainer>
    </TotalContainer>
  );
};

export default CompanyNameRenderer;
