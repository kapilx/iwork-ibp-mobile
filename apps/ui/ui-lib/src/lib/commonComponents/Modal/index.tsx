import React from "react";
import { Modal, Box } from "@mui/material";
import closeIcon from "../../assets/svgs/close-icon.svg";
import Button from "../Button";
import {
  ModalStyledCard,
  StyledChildren,
  StyledModalHeading,
  StyledCloseIcon,
  StyledModalBox,
  StyledButtons,
  StyledModal,
} from "./styles";

export interface ButtonInfo {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "link" | "icon" | "addButton";
  disabled?: boolean;
  loading?: boolean;
  loadingPosition?: "start" | "center" | "end";
}
interface CustomModalProps {
  open: boolean;
  handleClose: () => void;
  children: React.ReactNode;
  heading?: string | React.ReactNode;
  buttons?: ButtonInfo[];
  modalBoxRef?: React.RefObject<HTMLDivElement>;
  headingStyles?: React.CSSProperties;
  modalBoxStyles?: React.CSSProperties;
  noPadding?: boolean;
}

const CustomModal: React.FC<CustomModalProps> = ({
  open,
  handleClose,
  children,
  heading = "",
  buttons = [],
  modalBoxRef,
  headingStyles,
  modalBoxStyles,
  noPadding = false,
}) => {
  return (
    <StyledModal
      data-testid="modal-section-container"
      open={open}
      onClose={handleClose}
    >
      {/* Attach the ref to the modal's main box for outside click detection */}
      <StyledModalBox
        data-testid="modal-section-content"
        ref={modalBoxRef}
        customStyles={modalBoxStyles}
      >
        <ModalStyledCard>
          <StyledModalHeading customStyles={headingStyles}>
            {heading}
          </StyledModalHeading>
          <StyledCloseIcon src={closeIcon} alt="close" onClick={handleClose} />
        </ModalStyledCard>
        <StyledChildren noPadding={noPadding}>{children}</StyledChildren>
        <StyledButtons>
          {buttons?.map((button, index) => (
            <Button
              variantType={button.variant}
              label={button.label}
              onClick={button.onClick}
              sizeType="small"
              key={`modal-button-${index}`}
              data-testid={`modal-button-${index}`}
              disabled={button.disabled}
              loading={button.loading}
              loadingPosition={button.loadingPosition ?? "center"}
            />
          ))}
        </StyledButtons>
      </StyledModalBox>
    </StyledModal>
  );
};

export default CustomModal;
