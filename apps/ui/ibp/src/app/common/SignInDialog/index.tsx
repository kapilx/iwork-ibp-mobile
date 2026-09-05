import React from "react";
import { Dialog } from "@mui/material";

interface SignInDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const SignIn = React.lazy(() => import("../../components/SignIn"));

export const SignInDialog: React.FC<SignInDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: "min(1600px, calc(100vw - 48px))",
          margin: "24px",
          borderRadius: "24px",
          maxWidth: "1600px",
          overflow: "hidden",
        },
      }}
    >
      <React.Suspense fallback={null}>
        <SignIn onClose={onClose} onSuccess={onSuccess} />
      </React.Suspense>
    </Dialog>
  );
};
