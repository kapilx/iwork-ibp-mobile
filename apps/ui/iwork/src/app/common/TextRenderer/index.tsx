import React from "react";
import { ICellRendererParams } from "ag-grid-community";
import { StyledText } from "./styles";
import { formatNumberByLocalization } from "@ui/ui-lib";

export interface StyleMapProps {
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  fontWeight?: string;
}

interface ITextRendererProps extends ICellRendererParams {
  styleMap?: StyleMapProps;
}

const TextRenderer: React.FC<ITextRendererProps> = (params) => {
  const { value, styleMap } = params;

  if (value === null || value === undefined) {
    return <span>--</span>;
  }

  return (
    <StyledText styleMap={styleMap}>
      {formatNumberByLocalization(value)}
    </StyledText>
  );
};

export default TextRenderer;
