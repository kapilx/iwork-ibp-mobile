import React from "react";
import {
  ConfigHeaderContent,
  ConfigHeaderTitle,
  ConfigTable,
  ConfigTableDataCell,
  ConfigTableHead,
  ConfigTableHeaderCell,
  ConfigTableWrapper,
  EllipsisText,
  ErrorBox,
  LoadingBox,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  StyledModalHeading,
} from "./PreviewModalStyles";
import { StyledCloseIcon } from "../Modal/styles";
import closeIcon from "../../assets/svgs/close-icon.svg";
import { Tooltip } from "@mui/material";

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  data: {
    headers: string[];
    rows: Record<string, any>[];
  } | null;
  isLoading: boolean;
  error: { message: string } | null;
  title?: string;
}

const PreviewModal: React.FC<PreviewModalProps> = ({
  open,
  onClose,
  data,
  isLoading,
  error,
  title,
}) => {
  if (!open) return null;

  return (
    <ModalOverlay>
      <ModalContent>
        <ConfigTableWrapper>
          <ModalHeader>
            <StyledModalHeading>
              {title || "Document Preview"}
            </StyledModalHeading>
            <StyledCloseIcon src={closeIcon} alt="close" onClick={onClose} />
          </ModalHeader>
          {isLoading && <LoadingBox>Loading...</LoadingBox>}
          {error && !isLoading && <ErrorBox>{error.message}</ErrorBox>}
          {data && data.headers.length > 0 && (
            <ConfigTable>
              <ConfigTableHead>
                <tr>
                  {data.headers.map((header) => (
                    <ConfigTableHeaderCell key={header}>
                      <ConfigHeaderContent>
                        <ConfigHeaderTitle>
                          <Tooltip title={header} placement="top">
                            <EllipsisText>{header}</EllipsisText>
                          </Tooltip>
                        </ConfigHeaderTitle>
                      </ConfigHeaderContent>
                    </ConfigTableHeaderCell>
                  ))}
                </tr>
              </ConfigTableHead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={data.headers.length}
                      style={{ textAlign: "center" }}
                    >
                      No data to preview.
                    </td>
                  </tr>
                ) : (
                  data.rows.slice(0, 10).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {data.headers.map((header, colIndex) => (
                        <ConfigTableDataCell key={colIndex}>
                          <Tooltip title={row[header] ?? ""} placement="top">
                            <EllipsisText>{row[header] ?? ""}</EllipsisText>
                          </Tooltip>
                        </ConfigTableDataCell>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </ConfigTable>
          )}
        </ConfigTableWrapper>
      </ModalContent>
    </ModalOverlay>
  );
};
export default PreviewModal;
