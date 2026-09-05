import React, { useRef, useState } from 'react';
import { CircularProgress, Typography } from '@mui/material';
import {
  CheckCircleOutlineRounded,
  FileUploadOutlined,
} from '@mui/icons-material';
import { apiRequest, endPoints } from '@ui/ui-lib';
import { useDispatch } from 'react-redux';
import { LIFE_EVENTS_UPLOAD_DOCUMENTS_COPY } from './constants';
import { setToastMessage } from '../../redux/slice';
import {
  LifeEventsStepActions,
  LifeEventsStepPrimaryButton,
  LifeEventsStepSecondaryButton,
  UploadDocumentsCard,
  UploadDocumentsDependentSummaryCard,
  UploadDocumentsDependentSummaryLabel,
  UploadDocumentsDependentSummaryValue,
  UploadDocumentsDropzone,
  UploadDocumentsDropzoneIcon,
  UploadDocumentsDropzoneSubtitle,
  UploadDocumentsDropzoneTitle,
  UploadDocumentsFileInput,
  UploadDocumentsFileItem,
  UploadDocumentsFileList,
  UploadDocumentsNoticeCard,
  UploadDocumentsNoticeText,
  UploadDocumentsReasonCard,
  UploadDocumentsReasonLabel,
  UploadDocumentsReasonValue,
  UploadDocumentsRequiredDocIcon,
  UploadDocumentsRequiredDocItem,
  UploadDocumentsRequiredDocList,
  UploadDocumentsSectionTitle,
} from './styles';

type UploadDocumentsVariant = 'addition' | 'deletion';

interface LifeEventsUploadDocumentsProps {
  variant: UploadDocumentsVariant;
  reasonValue: string;
  requiredDocuments: string[];
  dependentSummary?: string;
  isSubmitting?: boolean;
  uploadedDocuments: Array<{ id: number | string; fileName?: string }>;
  onUploadedDocumentsChange: (
    documents: Array<{ id: number | string; fileName?: string }>,
  ) => void;
  onBack: () => void;
  onSubmit: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const isSupportedFile = (file: File) => {
  const fileName = file.name.toLowerCase();
  return (
    file.type === 'application/pdf' ||
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    fileName.endsWith('.pdf') ||
    fileName.endsWith('.jpg') ||
    fileName.endsWith('.jpeg') ||
    fileName.endsWith('.png')
  );
};

const LifeEventsUploadDocuments: React.FC<LifeEventsUploadDocumentsProps> = ({
  variant,
  reasonValue,
  requiredDocuments,
  dependentSummary,
  isSubmitting = false,
  uploadedDocuments,
  onUploadedDocumentsChange,
  onBack,
  onSubmit,
}) => {
  const dispatch = useDispatch();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');

  const reasonLabel =
    variant === 'addition'
      ? LIFE_EVENTS_UPLOAD_DOCUMENTS_COPY.additionReasonLabel
      : LIFE_EVENTS_UPLOAD_DOCUMENTS_COPY.deletionReasonLabel;

  const handleFileSelection = (nextFiles: FileList | null) => {
    if (!nextFiles) return;

    const validFiles = Array.from(nextFiles).filter(
      (file) => isSupportedFile(file) && file.size <= MAX_FILE_SIZE,
    );

    if (validFiles.length === 0) {
      return;
    }

    const token = user?.accessToken?.accessToken;
    const companyId = user?.companyId;

    const uploadFiles = async () => {
      setIsUploading(true);

      try {
        const uploadedResponses = await Promise.all(
          validFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('companyType', 'company');
            formData.append('companyId', String(companyId || ''));
            formData.append('documentTypeLid', -1);

            const response = await apiRequest(endPoints.ibpFileUpload, {
              method: 'POST',
              data: formData,
              headers: {
                'Content-Type': 'multipart/form-data',
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });

            const uploadedFile =
              (response as any)?.data?.data ||
              (response as any)?.data ||
              response;

            return {
              id: uploadedFile?.id,
              fileName: uploadedFile?.fileName || file.name,
            };
          }),
        );

        onUploadedDocumentsChange([
          ...uploadedDocuments,
          ...uploadedResponses.filter((document) => Boolean(document?.id)),
        ]);
        dispatch(setToastMessage('Document uploaded successfully.'));
      } catch (error: any) {
        dispatch(
          setToastMessage(
            error?.response?.data?.message ||
              error?.message ||
              'Document upload failed. Please try again.',
          ),
        );
      } finally {
        setIsUploading(false);
      }
    };

    uploadFiles();
  };

  return (
    <>
      <UploadDocumentsReasonCard flowType={variant}>
        <UploadDocumentsReasonLabel flowType={variant}>
          {reasonLabel}
        </UploadDocumentsReasonLabel>
        <UploadDocumentsReasonValue flowType={variant}>
          {reasonValue}
        </UploadDocumentsReasonValue>
      </UploadDocumentsReasonCard>

      {dependentSummary ? (
        <UploadDocumentsDependentSummaryCard>
          <UploadDocumentsDependentSummaryLabel>
            {LIFE_EVENTS_UPLOAD_DOCUMENTS_COPY.dependentBeingRemovedLabel}
          </UploadDocumentsDependentSummaryLabel>
          <UploadDocumentsDependentSummaryValue>
            {dependentSummary}
          </UploadDocumentsDependentSummaryValue>
        </UploadDocumentsDependentSummaryCard>
      ) : null}

      <UploadDocumentsCard>
        <UploadDocumentsSectionTitle>
          {LIFE_EVENTS_UPLOAD_DOCUMENTS_COPY.requiredDocumentsLabel}
        </UploadDocumentsSectionTitle>
        <UploadDocumentsRequiredDocList>
          {requiredDocuments.map((documentName) => (
            <UploadDocumentsRequiredDocItem key={documentName}>
              <UploadDocumentsRequiredDocIcon>
                <CheckCircleOutlineRounded />
              </UploadDocumentsRequiredDocIcon>
              <Typography>{documentName}</Typography>
            </UploadDocumentsRequiredDocItem>
          ))}
        </UploadDocumentsRequiredDocList>
      </UploadDocumentsCard>

      <UploadDocumentsCard>
        <UploadDocumentsSectionTitle>
          {LIFE_EVENTS_UPLOAD_DOCUMENTS_COPY.uploadFilesLabel}
        </UploadDocumentsSectionTitle>
        <UploadDocumentsFileInput
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          onChange={(event) => handleFileSelection(event.target.files)}
        />
        <UploadDocumentsDropzone
          flowType={variant}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            handleFileSelection(event.dataTransfer.files);
          }}
        >
          <UploadDocumentsDropzoneIcon>
            <FileUploadOutlined />
          </UploadDocumentsDropzoneIcon>
          <UploadDocumentsDropzoneTitle>
            {LIFE_EVENTS_UPLOAD_DOCUMENTS_COPY.uploadTitle}
          </UploadDocumentsDropzoneTitle>
          <UploadDocumentsDropzoneSubtitle>
            {LIFE_EVENTS_UPLOAD_DOCUMENTS_COPY.uploadSubtitle}
          </UploadDocumentsDropzoneSubtitle>
        </UploadDocumentsDropzone>

        {uploadedDocuments.length > 0 ? (
          <UploadDocumentsFileList>
            {uploadedDocuments.map((file) => (
              <UploadDocumentsFileItem key={String(file.id)}>
                <a
                  href={endPoints.ibpFileUploadDownloadById(Number(file.id))}
                  target="_blank"
                  rel="noreferrer"
                >
                  {file.fileName || `Document ${file.id}`}
                </a>
              </UploadDocumentsFileItem>
            ))}
          </UploadDocumentsFileList>
        ) : null}
      </UploadDocumentsCard>

      <UploadDocumentsNoticeCard>
        <UploadDocumentsNoticeText>
          <strong>{LIFE_EVENTS_UPLOAD_DOCUMENTS_COPY.importantPrefix}</strong>{' '}
          {LIFE_EVENTS_UPLOAD_DOCUMENTS_COPY.importantMessage}
        </UploadDocumentsNoticeText>
      </UploadDocumentsNoticeCard>

      <LifeEventsStepActions>
        <LifeEventsStepSecondaryButton type="button" onClick={onBack}>
          {LIFE_EVENTS_UPLOAD_DOCUMENTS_COPY.backToPremiumSummary}
        </LifeEventsStepSecondaryButton>
        <LifeEventsStepPrimaryButton
          type="button"
          onClick={onSubmit}
          disabled={uploadedDocuments.length === 0 || isUploading || isSubmitting}
          startIcon={
            isUploading || isSubmitting ? (
              <CircularProgress size={18} color="inherit" />
            ) : null
          }
        >
          {isUploading
            ? 'Uploading...'
            : isSubmitting
            ? 'Submitting...'
            : "LIFE_EVENTS_UPLOAD_DOCUMENTS_COPY.submitLabel"}
        </LifeEventsStepPrimaryButton>
      </LifeEventsStepActions>
    </>
  );
};

export default LifeEventsUploadDocuments;
