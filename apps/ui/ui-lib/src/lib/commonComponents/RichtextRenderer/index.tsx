import React, { useMemo } from "react";
import { RichTextRendererStyledContainer } from "./styles";
import { sanitizeHtml } from "../../utils/sanitizeHtml";

interface Props {
  htmlContent: string;
}

const RichTextRenderer: React.FC<Props> = ({ htmlContent }) => {
  if (!htmlContent) return null;

  return (
    <RichTextRendererStyledContainer
      dangerouslySetInnerHTML={useMemo(
        () => ({ __html: sanitizeHtml(htmlContent) }),
        [htmlContent]
      )}
    />
  );
};

export default RichTextRenderer;
