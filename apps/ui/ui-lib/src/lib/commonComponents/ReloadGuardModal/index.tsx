import { Typography } from "@mui/material";
import CustomModal from "../Modal";

export interface ReloadGuardModalProps {
  open: boolean;
  onCancel: () => void;
  onCreateNew: () => void;
  onSaveAndExit?: () => void;
  heading?: string;
  message?: string;
  createNewLabel?: string;
  saveAndExitLabel?: string;
  cancelLabel?: string;
}

const DEFAULT_HEADING = "Unsaved progress";
const DEFAULT_MESSAGE =
  "You’ve already started creating this item. Reloading now will start a new one, but your current one is already tracked in the system. What would you like to do?";
const DEFAULT_CREATE_NEW_LABEL = "Create New";
const DEFAULT_SAVE_AND_EXIT_LABEL = "Save & Exit";
const DEFAULT_CANCEL_LABEL = "Cancel";

const ReloadGuardModal = ({
  open,
  onCancel,
  onCreateNew,
  onSaveAndExit,
  heading = DEFAULT_HEADING,
  message = DEFAULT_MESSAGE,
  createNewLabel = DEFAULT_CREATE_NEW_LABEL,
  saveAndExitLabel = DEFAULT_SAVE_AND_EXIT_LABEL,
  cancelLabel = DEFAULT_CANCEL_LABEL,
}: ReloadGuardModalProps) => {
  const buttons = [
    {
      label: createNewLabel,
      onClick: onCreateNew,
      variant: "primary" as const,
    },
    ...(onSaveAndExit
      ? [
          {
            label: saveAndExitLabel,
            onClick: onSaveAndExit,
            variant: "secondary" as const,
          },
        ]
      : []),
    {
      label: cancelLabel,
      onClick: onCancel,
      variant: "link" as const,
    },
  ];

  return (
    <CustomModal
      open={open}
      handleClose={onCancel}
      heading={heading}
      buttons={buttons}
    >
      <Typography variant="body2">{message}</Typography>
    </CustomModal>
  );
};

export default ReloadGuardModal;
