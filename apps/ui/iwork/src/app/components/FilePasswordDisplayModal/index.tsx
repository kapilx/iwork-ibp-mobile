import { useCallback, useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import CustomModal from "@ui/ui-lib/commonComponents/Modal";
import { apiRequest } from "@ui/ui-lib/utils/apiRequest";
import { endPoints } from "@ui/ui-lib/constants/endPoints";
import { HTTP_METHODS, setToastMessage } from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import {
  buildUserPasswordPreview,
  FilePasswordConfigResponse,
  getUserDetails,
  USER_FIELD_OPTIONS,
} from "../../Utils/filePasswordConfig";

const ModalContent = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2.5),
  minWidth: "420px",
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const LabelText = styled(Typography)(({ theme }) => ({
  fontSize: "12px",
  fontWeight: 600,
  marginBottom: theme.spacing(0.5),
}));

const ValueText = styled(Typography)(({ theme }) => ({
  fontSize: "14px",
  fontWeight: 500,
  color: theme.palette.text.primary,
}));

const PasswordValue = styled(Typography)(({ theme }) => ({
  fontSize: "16px",
  fontWeight: 600,
  color: theme.palette.text.primary,
  fontFamily: "monospace",
}));

interface FilePasswordDisplayModalProps {
  open: boolean;
  onClose: () => void;
}

const FilePasswordDisplayModal = ({ open, onClose }: FilePasswordDisplayModalProps) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<FilePasswordConfigResponse | null>(null);

  const fetchConfiguration = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiRequest(endPoints.filePasswordConfig, {
        method: HTTP_METHODS.GET,
      });

      const data = response?.data as FilePasswordConfigResponse | undefined;
      setConfig(
        data || {
          passwordType: "custom",
          customPassword: "Secure@1234",
          userFields: ["firstName"],
        }
      );
    } catch (error) {
      console.error("Failed to fetch configuration:", error);
      dispatch(setToastMessage("Failed to load file password"));
      setConfig({
        passwordType: "custom",
        customPassword: "Secure@1234",
        userFields: ["firstName"],
      });
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    if (open) {
      fetchConfiguration();
    }
  }, [fetchConfiguration, open]);

  const getPasswordValue = () => {
    if (!config) return "";
    if (config.passwordType === "custom") {
      return config.customPassword || "";
    }

    return buildUserPasswordPreview(config.userFields || []);
  };

  const getPasswordTypeLabel = () => {
    if (!config) return "";
    return config.passwordType === "custom"
      ? "Custom Password"
      : "Generated From User Details";
  };

  const getSourceLabel = () => {
    if (!config || config.passwordType !== "user_details") return "";
    const selected = USER_FIELD_OPTIONS.filter((option) =>
      (config.userFields || []).includes(option.value)
    );
    if (!selected.length) return "Not configured";
    return selected.map((option) => option.label).join(", ");
  };

  const userDetails = getUserDetails();
  const userName = userDetails?.firstName || "";

  return (
    <CustomModal
      open={open}
      handleClose={onClose}
      heading="File Password"
      buttons={[
        {
          label: "Close",
          onClick: onClose,
          variant: "secondary",
        },
      ]}
    >
      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : (
        <ModalContent>
          <Box>
            <LabelText>Password Type</LabelText>
            <ValueText>{getPasswordTypeLabel()}</ValueText>
          </Box>
          {config?.passwordType === "user_details" && (
            <Box>
              <LabelText>Password Source</LabelText>
              <ValueText>{getSourceLabel()}</ValueText>
            </Box>
          )}
          {userName && config?.passwordType === "user_details" && (
            <Box>
              <LabelText>For User</LabelText>
              <ValueText>{userName}</ValueText>
            </Box>
          )}
          <Box>
            <LabelText>Current File Password</LabelText>
            <PasswordValue>{getPasswordValue()}</PasswordValue>
          </Box>
        </ModalContent>
      )}
    </CustomModal>
  );
};

export default FilePasswordDisplayModal;
