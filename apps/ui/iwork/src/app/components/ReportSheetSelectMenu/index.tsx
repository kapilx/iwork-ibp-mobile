import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import {
  Checkbox,
  CustomModal,
  DEFAULT_REPORT_SHEETS,
  REPORT_SHEET_OPTIONS,
} from "@ui/ui-lib";

interface ReportSheetSelectMenuProps {
  open: boolean;
  onClose: () => void;
  onGenerate: (sheets: string[]) => void;
}

/**
 * Modal that lets the user tick which sheets to include in the BizDone export
 * (Policy Details pre-selected), then generate. Built from the common
 * CustomModal + Checkbox components.
 */
const ReportSheetSelectMenu = ({
  open,
  onClose,
  onGenerate,
}: ReportSheetSelectMenuProps) => {
  const [selected, setSelected] = useState<string[]>(DEFAULT_REPORT_SHEETS);

  // The modal stays mounted (only `open` toggles), so its selection would
  // otherwise persist across opens. Reset to the default each time it opens.
  useEffect(() => {
    if (open) setSelected(DEFAULT_REPORT_SHEETS);
  }, [open]);

  const allValues = REPORT_SHEET_OPTIONS.map((o) => o.value);
  const allSelected =
    allValues.length > 0 && selected.length === allValues.length;
  const someSelected = selected.length > 0 && !allSelected;

  const toggle = (value: string) =>
    setSelected((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );

  const toggleAll = () => setSelected(allSelected ? [] : allValues);

  const handleGenerate = () => {
    if (!selected.length) return;
    onGenerate(selected);
    onClose();
  };

  return (
    <CustomModal
      open={open}
      handleClose={onClose}
      heading="Select sheets to download"
      headingStyles={{ color: "#000000" }}
      modalBoxStyles={{width: '30%'}}
      buttons={[
        { label: "Cancel", onClick: onClose, variant: "secondary" },
        {
          label: "Continue",
          onClick: handleGenerate,
          variant: "primary",
          disabled: !selected.length,
        },
      ]}
    >
      <Box
        sx={{ display: "flex", flexDirection: "column", gap: 1.25, minWidth: 300 }}
      >
        {REPORT_SHEET_OPTIONS.map((opt) => (
          <Checkbox
            key={opt.value}
            label={opt.label}
            isChecked={selected.includes(opt.value)}
            onChange={() => toggle(opt.value)}
          />
        ))}
        <Checkbox
          label="Select all"
          isChecked={allSelected}
          isIndeterminate={someSelected}
          onChange={toggleAll}
        />
      </Box>
    </CustomModal>
  );
};

export default ReportSheetSelectMenu;
