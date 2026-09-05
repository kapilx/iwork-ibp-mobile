import React from "react";
import { hasRowError } from "./config";
import { ErrorBlock } from "./styles";

const ErrorCellRenderer = (params: any) => {
  const hasError = hasRowError(params.data);
  return <ErrorBlock hasError={hasError}>{params.value}</ErrorBlock>;
};

export default ErrorCellRenderer;
