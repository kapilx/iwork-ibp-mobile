import React, { useState } from 'react';
import { CustomModal, setToastMessage } from "@ui/ui-lib";
import fileUploadIcon from "../../assets/svgs/file-upload-icon.svg";
import { useDispatch } from "react-redux";
import {
    Button,
    Typography,
    List,
    ListItemText,
    ListItemSecondaryAction,
    Chip,
} from "@mui/material";
import HistoryIcon from '@mui/icons-material/History';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import RestoreIcon from '@mui/icons-material/Restore';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import Tooltip from '@mui/material/Tooltip';
import { formatDate } from './utils';
import {
    DialogContentBox,
    DialogTabPanel,
    VersionItem,
    UploadIconWrapper,
    StyledIconImg,
    DropZoneContent,
    VersionInfoBox,
    VersionNote,
    NoHistoryBox,
    StyledDialogTabs,
    StyledDialogTab,
    DragDropUploadBox,
    DialogUploadActionBox,
    FileTypeHintText,
    HiddenInput,
    UploadLabel,
    UploadBoxNote,
    VersionDateText,
    TemplateIconButton
} from './styles';
import { UI_TEXT, ALLOWED_TEMPLATE_EXTENSIONS, TEMPLATE_STATUS } from './constants';

interface TemplateManagementDialogProps {
    open: boolean;
    onClose: () => void;
    templates: any[]; // List of historical templates
    onSelectTemplate: (template: any) => void;
    onImportTemplate: (file: File) => void;
    onPreviewTemplate?: (template: any) => void;
    onDownloadTemplate?: (template: any) => void;
    onRestoreTemplate?: (template: any) => void;
}

const TemplateManagementDialog: React.FC<TemplateManagementDialogProps> = ({
    open,
    onClose,
    templates,
    onSelectTemplate,
    onImportTemplate,
    onPreviewTemplate,
    onDownloadTemplate,
    onRestoreTemplate
}) => {
    const dispatch = useDispatch();
    const [activeTab, setActiveTab] = useState(0);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
    const [templateToRestore, setTemplateToRestore] = useState<any | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        setSelectedFile(null); // Reset file selection on tab switch
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            if (ALLOWED_TEMPLATE_EXTENSIONS.includes(fileExtension || '')) {
                setSelectedFile(file);
            } else {
                dispatch(setToastMessage({ type: 'error', message: UI_TEXT.TEMPLATE_MANAGEMENT.INVALID_FILE_TYPE }));
            }
        }
    };

    const handleImport = () => {
        if (selectedFile) {
            onImportTemplate(selectedFile);
            onClose();
            setSelectedFile(null); // Reset after import
        }
    };

    const handleRestoreClick = (template: any) => {
        setTemplateToRestore(template);
        setRestoreConfirmOpen(true);
    };

    const handleConfirmRestore = () => {
        if (templateToRestore) {
            if (onRestoreTemplate) {
                onRestoreTemplate(templateToRestore);
            } else {
                onSelectTemplate(templateToRestore);
            }
            setRestoreConfirmOpen(false);
            setTemplateToRestore(null);
            onClose();
        }
    };

    const handleCancelRestore = () => {
        setRestoreConfirmOpen(false);
        setTemplateToRestore(null);
    };



    return (
        <>
            <CustomModal
                open={open}
                handleClose={onClose}
                heading={UI_TEXT.TEMPLATE_MANAGEMENT.DIALOG_TITLE}
                buttons={[
                    {
                        label: UI_TEXT.TEMPLATE_MANAGEMENT.CLOSE_BTN,
                        onClick: onClose,
                        variant: "secondary",
                    },
                    ...(activeTab === 1 ? [{
                        label: UI_TEXT.TEMPLATE_MANAGEMENT.IMPORT_BTN,
                        onClick: handleImport,
                        variant: "primary" as const,
                        disabled: !selectedFile
                    }] : [])
                ]}
                modalBoxStyles={{ maxWidth: '800px', width: '100%' }}
            >
                <DialogContentBox>
                    <StyledDialogTabs value={activeTab} onChange={handleTabChange} aria-label="template management tabs">
                        <StyledDialogTab icon={<HistoryIcon />} label={UI_TEXT.TEMPLATE_MANAGEMENT.TAB_HISTORY} />
                        <StyledDialogTab icon={<CloudUploadIcon />} label={UI_TEXT.TEMPLATE_MANAGEMENT.TAB_IMPORT} />
                    </StyledDialogTabs>

                    {/* History Tab */}
                    {activeTab === 0 && (
                        <DialogTabPanel>
                            {templates && templates.length > 0 ? (
                                <List>
                                    {templates.map((template, index) => (
                                        <VersionItem key={template.id || index}>
                                            <ListItemText
                                                primary={
                                                    <VersionInfoBox>
                                                        <Typography variant="subtitle1" fontWeight="bold">
                                                            {UI_TEXT.TEMPLATE_MANAGEMENT.VERSION_PREFIX} {template.template_version_no || (templates.length - index)}
                                                        </Typography>
                                                        {template?.status === TEMPLATE_STATUS.ACTIVE && <Chip label={UI_TEXT.TEMPLATE_MANAGEMENT.CURRENT_VERSION} size="small" color="primary" variant="outlined" />}
                                                    </VersionInfoBox>
                                                }
                                                secondary={
                                                    <>
                                                        <VersionDateText variant="caption">
                                                            {UI_TEXT.TEMPLATE_MANAGEMENT.DATE_LABEL} {formatDate(template.createdAt || template.updated_at)}
                                                        </VersionDateText>
                                                        {template.change_note && (
                                                            <VersionNote variant="body2">
                                                                {UI_TEXT.TEMPLATE_MANAGEMENT.NOTE_LABEL} {template.change_note}
                                                            </VersionNote>
                                                        )}
                                                    </>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <Tooltip title={UI_TEXT.TEMPLATE_MANAGEMENT.PREVIEW}>
                                                    <TemplateIconButton
                                                        size="small"
                                                        onClick={() => onPreviewTemplate && onPreviewTemplate(template)}
                                                    >
                                                        <VisibilityIcon fontSize="small" />
                                                    </TemplateIconButton>
                                                </Tooltip>
                                                <Tooltip title={UI_TEXT.TEMPLATE_MANAGEMENT.DOWNLOAD}>
                                                    <TemplateIconButton
                                                        size="small"
                                                        onClick={() => onDownloadTemplate && onDownloadTemplate(template)}
                                                    >
                                                        <DownloadIcon fontSize="small" />
                                                    </TemplateIconButton>
                                                </Tooltip>
                                                {template?.status !== TEMPLATE_STATUS.ACTIVE && (
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<RestoreIcon />}
                                                        onClick={() => handleRestoreClick(template)}
                                                    >
                                                        {UI_TEXT.TEMPLATE_MANAGEMENT.RESTORE_BTN}
                                                    </Button>
                                                )}
                                            </ListItemSecondaryAction>
                                        </VersionItem>
                                    ))}
                                </List>
                            ) : (
                                <NoHistoryBox>
                                    <Typography color="textSecondary">{UI_TEXT.TEMPLATE_MANAGEMENT.NO_HISTORY}</Typography>
                                </NoHistoryBox>
                            )}
                        </DialogTabPanel>
                    )}

                    {/* Import Tab */}
                    {activeTab === 1 && (
                        <DialogTabPanel>
                            <DragDropUploadBox
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onDragLeave={handleDragLeave}
                                isDragging={isDragging}
                                uploadStatus={selectedFile ? 'file-selected' : 'idle'}
                            >
                                <HiddenInput
                                    accept={ALLOWED_TEMPLATE_EXTENSIONS.map(ext => `.${ext}`).join(', ')}
                                    id="import-template-file"
                                    type="file"
                                    onChange={handleFileChange}
                                />
                                <DropZoneContent>
                                    <UploadLabel htmlFor="import-template-file">
                                        <DialogUploadActionBox>
                                            <UploadIconWrapper>
                                                <StyledIconImg src={fileUploadIcon} alt="upload" size={28} />
                                            </UploadIconWrapper>
                                            <UploadBoxNote variant="body2">
                                                {selectedFile ? selectedFile.name : UI_TEXT.UPLOAD_BOX_CLICK}
                                            </UploadBoxNote>
                                            {!selectedFile && (
                                                <FileTypeHintText variant="caption" color="textSecondary">
                                                    {UI_TEXT.TEMPLATE_MANAGEMENT.SUPPORTED_FORMATS}
                                                </FileTypeHintText>
                                            )}
                                        </DialogUploadActionBox>
                                    </UploadLabel>
                                </DropZoneContent>
                            </DragDropUploadBox>
                        </DialogTabPanel>
                    )}
                </DialogContentBox>
            </CustomModal>

            {/* Restore Confirmation Dialog */}
            <CustomModal
                open={restoreConfirmOpen}
                handleClose={handleCancelRestore}
                heading={UI_TEXT.TEMPLATE_MANAGEMENT.RESTORE_CONFIRM_TITLE}
                buttons={[
                    {
                        label: UI_TEXT.TEMPLATE_MANAGEMENT.CANCEL_BTN,
                        onClick: handleCancelRestore,
                        variant: "secondary",
                    },
                    {
                        label: UI_TEXT.TEMPLATE_MANAGEMENT.CONFIRM_BTN,
                        onClick: handleConfirmRestore,
                        variant: "primary",
                    },
                ]}
            >
                <DialogContentBox>
                    <Typography variant="body1" color="textPrimary">
                        {templateToRestore && UI_TEXT.TEMPLATE_MANAGEMENT.RESTORE_CONFIRM_MSG(
                            `${UI_TEXT.TEMPLATE_MANAGEMENT.VERSION_PREFIX} ${templateToRestore.template_version_no || ''}`
                        )}
                    </Typography>
                </DialogContentBox>
            </CustomModal>
        </>
    );
};

export default TemplateManagementDialog;
