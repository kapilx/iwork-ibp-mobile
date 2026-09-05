import { useCallback, useMemo, useRef } from "react";
import {
  httpMethods,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  setToastMessage,
  useApiMutation,
  endPoints,
} from "@ui/ui-lib";
import { useDispatch } from "react-redux";
import { Box } from "@mui/material";
import { getUploadTabConfig } from "./documentsConfig";
import { DOCUMENT_UPLOAD_SUCCESSFULL, FAILED_TO_UPLOAD_DOCUMENT } from "../../../constants";
import { DocumentUploadContainer } from "./styles";

interface UploadDocumentTabProps {
  policyId: number;
  onUploadSuccess?: () => void;
}

const UploadDocumentTab = ({ policyId, onUploadSuccess }: UploadDocumentTabProps) => {
  const dispatch = useDispatch();
  const formRef = useRef<NestedGroupedDataCollectionHandle>(null);
  const { mutate, isPending } = useApiMutation({});

  const handleAutoUpload = useCallback(async () => {
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
  }, [policyId, mutate, dispatch, onUploadSuccess]);

  const uploadTabConfig = useMemo(
    () => getUploadTabConfig(handleAutoUpload, policyId),
    [handleAutoUpload, policyId]
  );

  return (
    // <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2 }}>
    <DocumentUploadContainer>
      <NestedDynamicForm config={uploadTabConfig} ref={formRef} />
    </DocumentUploadContainer>
  );
};

export default UploadDocumentTab;
