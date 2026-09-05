import { useState, useEffect, useRef } from "react";
import RightNavIcon from "../../assets/svgs/right-open-toggle.svg";
import RightCloseIcon from "../../assets/svgs/right-close-toggle.svg";
import {
  RightDrawerContent,
  RightNavIconImg,
  RightStyledDrawer,
  RightToggleWrapper,
  RightNavContainer,
} from "./styles";
import { useLocation } from "react-router-dom";
import React from "react";

const RightNav = ({
  children,
  isOpen = false,
  onOpen,
  onClose,
  externalRefs = [],
}: {
  children?: React.ReactNode;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  externalRefs?: React.RefObject<HTMLElement>[];
}) => {
  const location = useLocation();
  const drawerRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);
  const modalBoxRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const isHoverEnabled = true;

  useEffect(() => {
    setTimeout(() => {
      setIsHovered(false);
    }, 1000);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const isInsideExternal = externalRefs?.some((ref) =>
        ref.current?.contains(target)
      );

      // Check if the click is inside a MUI dialog/popover
      const isInsideMuiPopover = target.closest(".MuiPopover-root") !== null;
      const isInsideMuiDialog = target.closest(".MuiDialog-root") !== null;
      const isInsideMuiPicker = target.closest(".MuiPaper-root") !== null;

      if (
        drawerRef.current?.contains(target) ||
        toggleRef.current?.contains(target) ||
        modalBoxRef.current?.contains(target) ||
        isInsideExternal ||
        isInsideMuiPopover ||
        isInsideMuiDialog ||
        isInsideMuiPicker
      ) {
        return;
      }
      if (isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      // Use capture phase to handle the event before it reaches other handlers
      document.addEventListener("mousedown", handleClickOutside, true);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside, true);
      };
    }
  }, [isOpen, onClose, externalRefs]);

  const handleToggle = () => {
    if (isOpen) {
      onClose?.();
    } else {
      onOpen?.();
    }
  };
  const handleContainerClick = (e: React.MouseEvent) => {
    // Prevent triggering open if a button/input was clicked
    const target = e.target as HTMLElement;
    const tag = target.tagName.toLowerCase();
    const interactiveTags = ["button", "svg", "path", "input", "textarea", "a"];

    if (interactiveTags.includes(tag)) return;

    if (!isOpen && isHovered && isHoverEnabled) {
      handleToggle();
    }
  };

  return (
    <RightNavContainer
      isHovered={isHoverEnabled ? isHovered : false}
      // onMouseEnter={() => {
      //   if (isHoverEnabled) setIsHovered(true);
      // }}
      // onMouseLeave={() => {
      //   if (isHoverEnabled) setIsHovered(false);
      // }}
      onClick={handleContainerClick}
    >
      <RightStyledDrawer
        variant="permanent"
        anchor="right"
        open={isOpen}
        hovered={isHoverEnabled ? isHovered : false}
        ref={drawerRef}
      >
        <RightDrawerContent
          isOpen={isOpen}
          isHovered={isHoverEnabled ? isHovered : false}
        >
          {(isOpen || (isHoverEnabled && isHovered)) && (
            <>
              {React.isValidElement(children) &&
                React.cloneElement(children, { modalBoxRef })}
            </>
          )}
        </RightDrawerContent>
      </RightStyledDrawer>

      {isHoverEnabled && (
        <RightToggleWrapper
          isExpanded={isOpen}
          isHovered={isHovered}
          ref={toggleRef}
          onClick={handleToggle}
        >
          <RightNavIconImg
            src={isOpen ? RightCloseIcon : RightNavIcon}
            alt="toggle"
            isOpen={isOpen}
          />
        </RightToggleWrapper>
      )}
    </RightNavContainer>
  );
};

export default RightNav;
