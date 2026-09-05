import React from "react";
import { Drawer as MuiDrawer, DrawerProps } from "@mui/material";
import { DrawerHeader, DrawerTitle, DrawerCloseButton, DrawerSubTitle, DrawerContent } from "./styles";
import CloseIcon from "@mui/icons-material/Close";

interface CommonDrawerProps extends DrawerProps {
  children: React.ReactNode;
  title?: string | React.ReactNode; // Title for the drawer
  onClose: () => void; // Function to close the drawer
  anchor?: "left" | "top" | "right" | "bottom"; // Position of the drawer
  width?: string; // Optional width for the drawer,
  open: boolean; // State to control the open/close of the drawer
}

const Drawer: React.FC<CommonDrawerProps> = ({
  open,
  anchor = "right",
  onClose,
  children,
  title,
  width,
  ...rest
}) => {
  return (
    <MuiDrawer
      open={open}
      anchor={anchor}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: width || undefined, // 👈 apply width only if passed
        },
      }}
      ModalProps={{
        sx: {
          zIndex: 998, // Add z-index to Modal root as well
        },
      }}
      {...rest}
    >
      <DrawerHeader>
        {/* Title */}
        <DrawerTitle>{title}</DrawerTitle>

        {/* Close Icon */}
        <DrawerCloseButton onClick={onClose} aria-label="close">
          <CloseIcon />
        </DrawerCloseButton>
      </DrawerHeader>

      {/* Drawer Content */}
      <div>{children}</div>
    </MuiDrawer>
  );
};

export default Drawer;
