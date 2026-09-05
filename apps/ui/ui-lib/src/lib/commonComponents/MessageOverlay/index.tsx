import React from "react";
import { ClickAwayListener, Popover, PopoverProps } from "@mui/material";
import { MessageOverlayStyledPaper } from "./styles";

export interface MessageOverlayProps
  extends Omit<PopoverProps, "open" | "anchorEl" | "onClose"> {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  anchorOrigin?: PopoverProps["anchorOrigin"];
  transformOrigin?: PopoverProps["transformOrigin"];
  height?: string | number;
  width?: string | number;
  children: React.ReactNode;
}

const MessageOverlay: React.FC<MessageOverlayProps> = ({
  open,
  anchorEl,
  onClose,
  children,
  anchorOrigin,
  transformOrigin,
  height,
  width,
  ...rest
}) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      PaperProps={{
        component: MessageOverlayStyledPaper,
        style: {
          ...(height ? { height } : {}),
          ...(width ? { width } : {}),
        },
      }}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      {...rest}
    >
      <ClickAwayListener onClickAway={onClose}>
        <div>{children}</div>
      </ClickAwayListener>
    </Popover>
  );
};

export default MessageOverlay;
