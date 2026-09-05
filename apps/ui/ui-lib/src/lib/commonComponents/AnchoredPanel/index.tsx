import React, { useEffect, useRef } from "react";
import { Popper, PopperPlacementType } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PanelSurface } from "./styles";

// Select menus and DatePicker calendars portal into <body>, so a click on a
// menu option lands outside this panel's subtree even though it logically
// belongs to it. Ignore those or the panel closes underneath them.
// MUI X's date calendar portals into <body> under its OWN class names, not
// the plain .MuiPopper-root this list started with — so a click on a day was
// read as an outside click, the panel closed on mousedown, and the date never
// registered. Anything that is a floating layer belongs here.
const NESTED_PORTAL_SELECTOR = [
  ".MuiPopover-root",
  ".MuiPopper-root",
  ".MuiModal-root",
  ".MuiDialog-root",
  ".MuiPickersPopper-root",
  ".MuiPickersLayout-root",
  ".MuiDateCalendar-root",
  ".MuiAutocomplete-popper",
  '[role="tooltip"]',
  '[role="dialog"]',
].join(", ");

export interface AnchoredPanelProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  children: React.ReactNode;
  placement?: PopperPlacementType;
  offset?: number;
}

const AnchoredPanel: React.FC<AnchoredPanelProps> = ({
  open,
  anchorEl,
  onClose,
  children,
  placement = "bottom-end",
  offset = 8,
}) => {
  const theme = useTheme();

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target?.closest) return;
      if (target.closest("[data-anchored-panel]")) return;
      // The anchor toggles itself; closing here too would close-then-reopen.
      if (anchorEl?.contains(target)) return;
      if (target.closest(NESTED_PORTAL_SELECTOR)) return;
      onCloseRef.current();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, anchorEl]);

  return (
    <Popper
      open={open}
      anchorEl={anchorEl}
      placement={placement}
      modifiers={[
        { name: "offset", options: { offset: [0, offset] } },
        { name: "flip", enabled: false },
        { name: "preventOverflow", options: { altAxis: true, padding: 8 } },
      ]}
      sx={{ zIndex: theme.zIndex.modal }}
    >
      <PanelSurface elevation={8} data-anchored-panel="">
        {children}
      </PanelSurface>
    </Popper>
  );
};

export default AnchoredPanel;
