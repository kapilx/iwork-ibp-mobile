import { useCallback, useMemo, useRef, useState } from "react";
import {
  httpMethods,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  setToastMessage,
  useApiMutation,
  endPoints,
  CustomModal,
} from "@ui/ui-lib";
import { StyledButton } from "@ui/ui-lib/commonComponents/ActionButton/styles";
import { useDispatch } from "react-redux";
import { Box } from "@mui/material";
import { getUploadTabConfig } from "./documentsConfig";
import { DOCUMENT_UPLOAD_SUCCESSFULL, FAILED_TO_UPLOAD_DOCUMENT } from "../../../constants";

interface UploadDocumentModalProps {
  open: boolean;
  onClose: () => void;
  policyId: number;
  onUploadSuccess?: () => void;
}

const UploadDocumentModal = ({ open, onClose, policyId, onUploadSuccess }: UploadDocumentModalProps) => {
  const dispatch = useDispatch();
  const formRef = useRef<NestedGroupedDataCollectionHandle>(null);
  const { mutate, isPending } = useApiMutation({});
  const [hasFile, setHasFile] = useState(false);

  const handleClose = useCallback(() => {
    formRef.current?.resetForms({});
    setHasFile(false);
    onClose();
  }, [onClose]);

  const handleFileUploaded = useCallback(() => {
    setHasFile(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    const submission = await formRef.current?.submitAll?.();
    if (!submission?.isAllValid) return;

    const documentType: string = submission.result?.selectSection?.policyDocumentType;
    const uploadedDocs: any[] = submission.result?.uploadSection?.documents ?? [];
    const fileId: number | undefined =
      uploadedDocs?.[0]?.documentId ?? uploadedDocs?.[0]?.fileUpload?.id;

    if (!documentType || !fileId) return;

    mutate(
      {
        endpoint: endPoints.policyDocsUpload(policyId),
        method: httpMethods.POST,
        data: { documentId: fileId, documentType },
      },
      {
        onSuccess: () => {
          dispatch(
            setToastMessage({
              severity: "success",
              message: DOCUMENT_UPLOAD_SUCCESSFULL,
            })
          );
          formRef.current?.resetForms({});
          setHasFile(false);
          onClose();
          onUploadSuccess?.();
        },
        onError: (error: any) => {
          const msg = Array.isArray(error?.message)
            ? error.message[0]
            : error?.message || FAILED_TO_UPLOAD_DOCUMENT;
          dispatch(setToastMessage({ severity: "error", message: msg }));
        },
      }
    );
  }, [policyId, mutate, dispatch, onClose, onUploadSuccess]);

  const uploadTabConfig = useMemo(
    () => getUploadTabConfig(handleFileUploaded, policyId),
    [handleFileUploaded, policyId]
  );

  return (
    <CustomModal
      open={open}
      handleClose={handleClose}
      heading="Upload Document"
      modalBoxStyles={{ width: "50%" }}
    >
      <Box>
        <NestedDynamicForm config={uploadTabConfig} ref={formRef} />
        <Box sx={{ display: "flex", gap: 2, mt: 2, justifyContent: "flex-end" }}>
          <StyledButton
            variantType="secondary"
            onClick={handleClose}
            disabled={isPending}
          >
            Cancel
          </StyledButton>
          <StyledButton
            variantType="primary"
            onClick={handleSubmit}
            disabled={!hasFile || isPending}
          >
            Submit
          </StyledButton>
        </Box>
      </Box>
    </CustomModal>
  );
};

export default UploadDocumentModal;
