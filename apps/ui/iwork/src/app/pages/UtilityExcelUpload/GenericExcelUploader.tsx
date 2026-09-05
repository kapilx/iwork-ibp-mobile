import React, { useState, useEffect, useRef } from "react";
import { useApi, endPoints, HTTP_METHODS } from "@ui/ui-lib";
import { useApiMutation } from "@ui/ui-lib/hooks/useMutation";
import { Typography, Tooltip, ListItemText, useTheme, Box } from "@mui/material";
import HistoryIcon from '@mui/icons-material/History';
import { CustomModal } from "@ui/ui-lib";
import downloadIcon from "../../assets/svgs/download-icon.svg";
import fileUploadIcon from "../../assets/svgs/file-upload-icon.svg";
import EditIcon from "../../assets/svgs/edit-icon.svg";
import DeleteIcon from "../../assets/svgs/delete.svg";

import { useDispatch } from "react-redux";
import { setToastMessage } from "@ui/ui-lib/redux/slice";
import * as XLSX from "xlsx";
import TemplateManagementDialog from "./TemplateManagementDialog";
import ColumnMapping, { BackendTargetColumnConfig } from "./ColumnMapping";
import {
    extractColumnsFromFile,
    validateFileType,
    validateFileSize,
    transformValue,
    getAuthToken,
} from "./utils";
import {
    MESSAGES,
    UI_TEXT,
    getFieldType,
    FIELD_TYPE,
    DIRECTION,
    DATA_TYPE,
    TEMPLATE_STATUS,
    API_CONFIG,
    UPLOAD_CONFIG,
} from "./constants";
import {
    UtilityExcelUploadContainer,
    UploadBox,
    StyledUploadContainer,
    DropZoneContent,
    UploadIconWrapper,
    ConfigActionIconButton,
    UploadCard,
    ValidationStatusBox,
    SuccessStatusBox,
    MetadataContainer,
    MetadataItem,
    DotSeparator,
    ProgressBarWrapper,
    ProgressBarFill,
    ContinueButton,
    StyledIconImg,
    CenteredFlexBox,
    CenteredColumnFlexBox,
    UploadActionBox,
    FileInfoBox,
    StyledCircularProgress,
    StyledMenuItem,
    StyledListItemIcon,
    StyledMenu,
    getListItemPrimaryTextProps,
    SuccessCheckCircleIcon,
    UploadLabel,
    UploadTitle,
    UploadBoxNote,
    ValidatingText,
    SavedFileName,
    SuccessTitle,
    SuccessFileName,
    DialogContentBox,
    UtilityExcelUploadHeader,
    SuccessActionsBox,
    FileTypeHintText,
    CancelButton,
    HeaderWrapper,
    ManageTemplateButton,
    SuccessDownloadIconButton,
    PreviewDirectionContainer,
    PreviewDirectionText,
} from "./styles";
import {
    ConfigTableContainer,
    ConfigSuccessBanner,
    ConfigBannerContent,
    ConfigActions,
    ConfigTableWrapper,
    ConfigTable,
    ConfigTableHead,
    ConfigTableHeaderCell,
    ConfigHeaderContent,
    ConfigHeaderTitle,
    ConfigRequiredMark,
    ConfigMappedBadge,
    ConfigTableDataCell,
    ConfigTableRow,
    BannerIconCircle,
    BannerTitle,
    BannerSubText,
    BannerCheckIcon,
    BadgeCheckIcon,
    SaveConfigButton,
    PreviewTableContainer,
    PreviewTable,
    PreviewTableHead,
    PreviewTableHeadCell,
    PreviewTableBodyCell,
    PreviewTableRow,
    PreviewEmptyCell,
    SaveButtonWrapper,
} from "./ColumnMapping/styles";
import { UTILITY_UPLOAD_ENTITY } from "../../constants";

// Interface for mapped target columns (normalized from backend API response)
interface MappedTargetColumn {
    name: string;
    label: string;
    required: boolean;
    type: string; // text, date, gender, number, email
    format?: string;
    columnName: string;
    tableName: string;
    dataType: string;
    config?: BackendTargetColumnConfig;
    displayName: string;
    isRequired: boolean;
}

// Props interface for GenericExcelUploader
interface GenericExcelUploaderProps {
    companyId: string | null;
    entity: string;
    direction?: string;
    onDataStatusChange?: (hasData: boolean) => void;
    showDownloadIcon?: boolean;
}

// Helper function to process template mappings
export const processTemplateMappings = (mappings: any[], targetColumns: any[]) => {
    const newMappings: any[] = [];
    const newConfigs: any = {};
    let skippedMappings = 0;

    mappings.forEach((item: any) => {
        // Validate that the target column still exists in the current schema
        const targetColumnExists = targetColumns.some(
            (field: any) => field.columnName === item.target_column_name
        );

        if (!targetColumnExists) {
            skippedMappings++;
            return;
        }

        // Add mapping only if target column exists
        newMappings.push({
            id: item.source_column_name,
            name: item.source_column_name,
            targetColumn: item.target_column_name,
            sourceColumn: item.source_column_name,
        });

        // Safely handle transformation config
        const tConfig = item.transformation_config;
        if (tConfig && tConfig.type) {
            try {
                if (tConfig.type === DATA_TYPE.DATE) {
                    newConfigs[item.target_column_name] = {
                        date: {
                            sourceFormat: tConfig.source?.format || '',
                            targetFormat: tConfig.target?.format || ''
                        }
                    };
                } else if (tConfig.type === DATA_TYPE.GENDER) {
                    newConfigs[item.target_column_name] = {
                        gender: {
                            sourceValues: tConfig.source?.values || [],
                            allowedValues: tConfig.target?.allowedValues || [],
                            mappings: tConfig.target?.mappings || {}
                        }
                    };
                } else if (tConfig.type === DATA_TYPE.NUMBER) {
                    newConfigs[item.target_column_name] = {
                        number: {
                            decimalSeparator: tConfig.target?.decimalSeparator,
                            thousandSeparator: tConfig.target?.thousandSeparator
                        }
                    };
                }
            } catch (error) {
                console.error(`Error processing transformation config for column "${item.target_column_name}": `, error);
            }
        }
    });

    return { newMappings, newConfigs };
};

export const GenericExcelUploader: React.FC<GenericExcelUploaderProps> = ({
    companyId,
    entity,
    direction = DIRECTION.INBOUND,
    onDataStatusChange,
    showDownloadIcon = true,
}) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const { data: targetColumnsData, loading: loadingTargetColumns, doFetch: fetchTargetColumns } = useApi();
    const { data: savedTemplateData, doFetch: fetchSavedTemplate } = useApi();
    const { data: policyConfigData, doFetch: fetchPolicyConfig } = useApi();

    const [fileDirection, setFileDirection] = useState<string>(direction);
    const [uploadedFileName, setUploadedFileName] = useState<string>("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showMapping, setShowMapping] = useState(false);
    const [showConfigTable, setShowConfigTable] = useState(false);

    // Ref to track if we've already loaded the template for the current entity
    const loadedEntityRef = useRef<string | null>(null);
    const restoreTemplateRef = useRef<any>(null);

    // Reset ref when entity changes (to allow loading new template)
    useEffect(() => {
        loadedEntityRef.current = null;
    }, [entity]);
    const [sourceColumns, setSourceColumns] = useState<string[]>([]);
    const [targetColumns, setTargetColumns] = useState<MappedTargetColumn[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [currentMappings, setCurrentMappings] = useState<any[]>([]);
    const [columnConfigurations, setColumnConfigurations] = useState<any>({});
    const [fileData, setFileData] = useState<any[][]>([]);
    const [savedConfiguration, setSavedConfiguration] = useState<any>(null);
    const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
    const [uploadStatus, setUploadStatus] = useState<typeof UPLOAD_CONFIG.STATES[keyof typeof UPLOAD_CONFIG.STATES]>(UPLOAD_CONFIG.STATES.IDLE);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [rowCount, setRowCount] = useState<number>(0);
    const [columnCount, setColumnCount] = useState<number>(0);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState<any>(null);
    const [validationResults, setValidationResults] = useState<any[]>([]);
    const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);

    const handlePreviewTemplate = (template: any) => {
        setPreviewTemplate(template);
    };

    const handleDownloadTemplate = (template: any) => {
        try {
            // Prepare table headers for the export
            const headers = UI_TEXT.EXPORT_HEADERS;

            // Map each mapping configuration to a row
            const rows = (template.mappings || []).map((cm: any) => {
                const tConfig = cm.transformation_config || {};
                let sourceFormat = "";
                let targetFormat = "";

                if (tConfig.type === DATA_TYPE.DATE) {
                    sourceFormat = tConfig.source?.format || "";
                    targetFormat = tConfig.target?.format || "";
                } else if (tConfig.type === DATA_TYPE.GENDER) {
                    sourceFormat = tConfig.source?.values?.join(", ") || "";
                    targetFormat = tConfig.target?.allowedValues?.join(", ") || "";
                } else if (tConfig.type === DATA_TYPE.NUMBER && tConfig.target) {
                    const parts = [];
                    if (tConfig.target.decimalSeparator !== undefined) parts.push(`${UI_TEXT.DECIMAL_PREFIX}${tConfig.target.decimalSeparator} `);
                    if (tConfig.target.thousandSeparator !== undefined) parts.push(`${UI_TEXT.THOUSAND_PREFIX}${tConfig.target.thousandSeparator} `);
                    targetFormat = parts.join(", ");
                }

                return [
                    cm.source_column_name,
                    cm.target_column_name,
                    tConfig.type || DATA_TYPE.STRING,
                    sourceFormat,
                    targetFormat
                ];
            });

            const exportData = [headers, ...rows];

            // Create Excel file
            const ws = XLSX.utils.aoa_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, UI_TEXT.SHEET_NAME);

            // File name
            const versionStr = template.template_version_no || 'v';
            const fileName = `${entity}_version_${versionStr}_template_${new Date().getTime()}.xlsx`;
            XLSX.writeFile(wb, fileName);

            dispatch(
                setToastMessage({
                    type: "success",
                    message: MESSAGES.EXPORT_SUCCESS,
                })
            );
        } catch (e) {
            dispatch(
                setToastMessage({
                    type: "error",
                    message: "Failed to download mapping template as Excel",
                })
            );
        }
    };

    // API mutation for saving mapping configuration
    const token = getAuthToken();
    const saveMappingMutation = useApiMutation({
        headers: {
            [API_CONFIG.HEADERS.AUTHORIZATION]: token ? `${API_CONFIG.PREFIX.BEARER}${token} ` : '',
            [API_CONFIG.HEADERS.CONTENT_TYPE]: API_CONFIG.CONTENT_TYPES.JSON,
        },
        config: {
            onSuccess: (response) => {
                dispatch(
                    setToastMessage({
                        type: "success",
                        message: MESSAGES.SAVE_SUCCESS,
                    })
                );
                // Redirect back to upload screen
                handleCancel();
                // Refetch templates to ensure we have the latest ID and status
                if (companyId && entity) {
                    const headers = {
                        [API_CONFIG.HEADERS.AUTHORIZATION]: token ? `${API_CONFIG.PREFIX.BEARER}${token} ` : '',
                        [API_CONFIG.HEADERS.CONTENT_TYPE]: API_CONFIG.CONTENT_TYPES.JSON,
                    };
                    fetchSavedTemplate(
                        `${endPoints.fetchMappingTemplate(companyId, entity)}&file_direction=${fileDirection}&status=${TEMPLATE_STATUS.ALL}`,
                        { method: 'GET', headers }
                    );
                }
            },
            onError: (error) => {

                const errorMessage = Array.isArray(error?.message)
                    ? error.message[0]
                    : error?.message ?? MESSAGES.SAVE_ERROR;
                dispatch(
                    setToastMessage({
                        type: "error",
                        message: errorMessage,
                    })
                );
            },
        },
    });

    // API mutation for deleting mapping configuration
    const deleteMappingMutation = useApiMutation({
        headers: {
            [API_CONFIG.HEADERS.AUTHORIZATION]: token ? `${API_CONFIG.PREFIX.BEARER}${token} ` : '',
            [API_CONFIG.HEADERS.CONTENT_TYPE]: API_CONFIG.CONTENT_TYPES.JSON,
        },
        config: {
            onSuccess: (response) => {
                dispatch(
                    setToastMessage({
                        type: "success",
                        message: MESSAGES.CONFIG_DELETED,
                    })
                );
                // Refetch templates to ensure list is up to date
                if (companyId && entity) {
                    const headers = {
                        [API_CONFIG.HEADERS.AUTHORIZATION]: token ? `${API_CONFIG.PREFIX.BEARER}${token} ` : '',
                        [API_CONFIG.HEADERS.CONTENT_TYPE]: API_CONFIG.CONTENT_TYPES.JSON,
                    };
                    fetchSavedTemplate(
                        `${endPoints.fetchMappingTemplate(companyId, entity)}&file_direction=${fileDirection}&status=${TEMPLATE_STATUS.ALL}`,
                        { method: 'GET', headers }
                    );
                }

                // Reset state after successful deletion
                setShowConfigTable(false);
                setSavedConfiguration(null);
                setCurrentMappings([]);
                setColumnConfigurations({});
                setUploadedFileName("");
                setSourceColumns([]);
                setUploadStatus(UPLOAD_CONFIG.STATES.IDLE);
                setUploadProgress(0);
                setRowCount(0);
                setColumnCount(0);
                const fileInput = document.getElementById(UPLOAD_CONFIG.INPUT_ID) as HTMLInputElement;
                if (fileInput) {
                    fileInput.value = '';
                }
                setDeleteConfirmOpen(false);
            },
            onError: (error) => {
                const errorMessage = Array.isArray(error?.message)
                    ? error.message[0]
                    : error?.message ?? MESSAGES.CONFIG_DELETE_ERROR;
                dispatch(
                    setToastMessage({
                        type: "error",
                        message: errorMessage,
                    })
                );
                setDeleteConfirmOpen(false);
            },
        },
    });

    // API mutation for restoring mapping configuration
    const restoreMappingMutation = useApiMutation({
        headers: {
            [API_CONFIG.HEADERS.AUTHORIZATION]: token ? `${API_CONFIG.PREFIX.BEARER}${token} ` : '',
            [API_CONFIG.HEADERS.CONTENT_TYPE]: API_CONFIG.CONTENT_TYPES.JSON,
        },
        config: {
            onSuccess: (response) => {
                dispatch(
                    setToastMessage({
                        type: "success",
                        message: MESSAGES.RESTORE_SUCCESS,
                    })
                );
                // Refetch templates to ensure list is up to date
                if (companyId && entity) {
                    const headers = {
                        [API_CONFIG.HEADERS.AUTHORIZATION]: token ? `${API_CONFIG.PREFIX.BEARER}${token} ` : '',
                        [API_CONFIG.HEADERS.CONTENT_TYPE]: API_CONFIG.CONTENT_TYPES.JSON,
                    };
                    fetchSavedTemplate(
                        `${endPoints.fetchMappingTemplate(companyId, entity)}&file_direction=${fileDirection}&status=${TEMPLATE_STATUS.ALL}`,
                        { method: 'GET', headers }
                    );
                }

                // Load the restored template into state automatically
                if (restoreTemplateRef.current) {
                    handleTemplateSelection(restoreTemplateRef.current);
                    restoreTemplateRef.current = null;
                }
            },
            onError: (error) => {
                const errorMessage = Array.isArray(error?.message)
                    ? error.message[0]
                    : error?.message ?? MESSAGES.RESTORE_ERROR;
                dispatch(
                    setToastMessage({
                        type: "error",
                        message: errorMessage,
                    })
                );
            },
        },
    });

    // Fetch target columns and saved template when entity or companyId changes
    useEffect(() => {
        if (!entity || !companyId) return;

        // Reset state on entity change
        setShowConfigTable(false);
        setSavedConfiguration(null);
        setCurrentMappings([]);
        setColumnConfigurations({});
        setUploadedFileName("");
        setSourceColumns([]);
        setUploadStatus(UPLOAD_CONFIG.STATES.IDLE);
        setUploadProgress(0);
        setRowCount(0);
        setColumnCount(0);
        setFileData([]);
        setTargetColumns([]); // Clear target columns before fetching new ones

        const fileInput = document.getElementById(UPLOAD_CONFIG.INPUT_ID) as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }

        const token = getAuthToken();
        const headers = {
            [API_CONFIG.HEADERS.AUTHORIZATION]: token ? `${API_CONFIG.PREFIX.BEARER}${token} ` : '',
            [API_CONFIG.HEADERS.CONTENT_TYPE]: API_CONFIG.CONTENT_TYPES.JSON,
        };

        fetchTargetColumns(
            endPoints.entityFieldsByName(entity),
            { method: 'GET', headers }
        );

        fetchSavedTemplate(
            `${endPoints.fetchMappingTemplate(companyId, entity)}&file_direction=${fileDirection}&status=${TEMPLATE_STATUS.ALL}`,
            { method: 'GET', headers }
        );

        if (entity === UTILITY_UPLOAD_ENTITY.UPLOAD_INCEPTION && companyId) {
            fetchPolicyConfig(
                endPoints.policyConfigurationById(companyId),
                { method: 'GET', headers }
            );
        }
    }, [entity, companyId, fileDirection]);

    // Update target columns from API response and insert seed data if needed
    const seedDataMutation = useApiMutation({
        headers: {
            [API_CONFIG.HEADERS.AUTHORIZATION]: token ? `${API_CONFIG.PREFIX.BEARER}${token} ` : '',
            [API_CONFIG.HEADERS.CONTENT_TYPE]: API_CONFIG.CONTENT_TYPES.JSON,
        },
        config: {
            onSuccess: (data) => {
                console.log("Seed data inserted successfully:", data);
                // After seed data is inserted, re-fetch target columns
                const headers = {
                    [API_CONFIG.HEADERS.AUTHORIZATION]: token ? `${API_CONFIG.PREFIX.BEARER}${token} ` : '',
                    [API_CONFIG.HEADERS.CONTENT_TYPE]: API_CONFIG.CONTENT_TYPES.JSON,
                };
                fetchTargetColumns(
                    endPoints.entityFieldsByName(entity),
                    { method: 'GET', headers }
                );
            },
            onError: (error) => {
                dispatch(setToastMessage({ type: 'error', message: 'Failed to insert seed data.' }));
            },
        },
    });

    useEffect(() => {
        if (targetColumnsData?.data) {
            const mappedColumns = targetColumnsData.data.map((field: any) => ({
                name: field.columnName,
                label: field.displayName,
                displayName: field.displayName,
                required: field.isRequired,
                isRequired: field.isRequired,
                type: getFieldType(field.dataType, field.displayName),
                format: field.config?.targetFormat || field.config,
                columnName: field.columnName,
                tableName: field.tableName,
                dataType: field.dataType,
                config: field.config,
                entityId: field.entityId
            }));

            let filteredColumns = mappedColumns;
            if (entity === UTILITY_UPLOAD_ENTITY.UPLOAD_INCEPTION) {
                filteredColumns = mappedColumns.filter((col: any) => col.entityId == companyId);
                // If no columns for this companyId, insert seed data and re-fetch
                if (filteredColumns.length === 0 && companyId) {
                    seedDataMutation.mutate({
                        endpoint: endPoints.insertSeedData(companyId),
                        method: HTTP_METHODS.POST,
                        data: {}
                    });
                    return;
                }
                const enablePolicyLocations = policyConfigData?.data?.policyConfiguration?.enablePolicyLocations;
                if (!enablePolicyLocations) {
                    filteredColumns = filteredColumns.filter((col: any) => col.columnName !== 'location_code');
                }

                const userDetailItems: { id: string; label: string }[] =
                    policyConfigData?.data?.policyConfiguration?.userDetailsSection?.items ?? [];
                const dynamicUserDetailColumns = userDetailItems
                    .filter((item) => item.label?.trim())
                    .map((item) => ({
                        name: item.label,
                        label: item.label,
                        displayName: item.label,
                        required: true,
                        isRequired: true,
                        type: 'text',
                        columnName: item.label,
                        tableName: 'policy_enrollment_employee',
                        dataType: 'text',
                        config: null,
                        entityId: companyId,
                    }));
                filteredColumns = [...filteredColumns, ...dynamicUserDetailColumns];
            }
            setTargetColumns(filteredColumns);
        }
    }, [targetColumnsData, entity, companyId, policyConfigData]);

    // Auto-load active template ONLY on entity/direction change (not on clear/cancel)
    useEffect(() => {
        if (!savedTemplateData?.data || !Array.isArray(savedTemplateData.data) || savedTemplateData.data.length === 0) {
            return;
        }

        // Track entity AND direction to prevent cross-contamination
        const entityKey = `${entity}_${fileDirection}`;

        // Only load if we haven't loaded this entity+direction combo yet
        if (loadedEntityRef.current === entityKey) {
            return; // Already loaded for this entity+direction, don't reload
        }

        // Find the active template
        const activeTemplate = savedTemplateData.data.find((t: any) => t.status === TEMPLATE_STATUS.ACTIVE);

        // If active template exists and has mappings, load it
        if (activeTemplate && activeTemplate.mappings && targetColumnsData?.data) {
            const { newMappings, newConfigs } = processTemplateMappings(activeTemplate.mappings, targetColumnsData.data);
            setCurrentMappings(newMappings);
            setColumnConfigurations(newConfigs);
            setSavedConfiguration(activeTemplate);
            loadedEntityRef.current = entityKey;
        }
    }, [savedTemplateData, targetColumnsData, entity, fileDirection]);

    // Validate all mappings and track results
    useEffect(() => {
        if (!currentMappings.length || !fileData.length || !targetColumns.length) {
            setValidationResults([]);
            return;
        }

        const mappingMetadata = currentMappings.map(mapping => {
            const targetColName = mapping.targetColumn;
            const targetColDef = targetColumns.find((col) =>
                (col.name === targetColName) || (col.columnName === targetColName)
            );
            const sourceColIndex = sourceColumns.indexOf(mapping.sourceColumn);
            const transformConfig = columnConfigurations[targetColName];

            // Build transformation config once per column
            let transformationConfig: any = {};
            if (targetColDef?.type === FIELD_TYPE.GENDER || targetColDef?.dataType === DATA_TYPE.GENDER) {
                const sourceValues = Array.from(new Set(fileData.map(r => r[sourceColIndex]).filter(v => v !== undefined && v !== null && v !== "")));
                transformationConfig = {
                    type: DATA_TYPE.GENDER,
                    source: { allowedValues: transformConfig?.gender?.sourceValues || sourceValues || [] },
                    target: {
                        allowedValues: transformConfig?.gender?.allowedValues || targetColDef?.config?.allowedValues || [],
                        mappings: transformConfig?.gender?.mappings || {}
                    }
                };
            } else if (targetColDef?.type === FIELD_TYPE.DATE || targetColDef?.dataType === DATA_TYPE.DATE) {
                transformationConfig = {
                    type: DATA_TYPE.DATE,
                    source: { format: transformConfig?.date?.sourceFormat || "" },
                    target: { format: transformConfig?.date?.targetFormat || targetColDef?.format || "" }
                };
            } else if (targetColDef?.type === FIELD_TYPE.NUMBER || targetColDef?.dataType === DATA_TYPE.NUMBER) {
                transformationConfig = {
                    type: DATA_TYPE.NUMBER,
                    source: {},
                    target: {
                        decimalSeparator: transformConfig?.number?.decimalSeparator,
                        thousandSeparator: transformConfig?.number?.thousandSeparator
                    }
                };
            } else {
                transformationConfig = { type: DATA_TYPE.STRING };
            }

            return {
                mapping,
                targetColName,
                targetColDef,
                sourceColIndex,
                transformationConfig
            };
        });

        const results: any[] = [];
        for (let rowIndex = 0; rowIndex < fileData.length; rowIndex++) {
            const row = fileData[rowIndex];
            for (const meta of mappingMetadata) {
                const { mapping, targetColName, targetColDef, sourceColIndex, transformationConfig } = meta;
                const cellValue = row[sourceColIndex];

                const result = transformValue(cellValue, targetColName, targetColDef, transformationConfig);
                if (!result.isValid) {
                    results.push({
                        rowIndex,
                        columnName: targetColName,
                        sourceColumn: mapping.sourceColumn,
                        value: cellValue,
                        error: result.error,
                        result
                    });
                }
            }
        }
        setValidationResults(results);
    }, [currentMappings, fileData, targetColumns, sourceColumns, columnConfigurations, fileDirection]);

    // Notify parent about data status
    useEffect(() => {
        if (onDataStatusChange) {
            const hasData = !!uploadedFileName || currentMappings.length > 0 || !!savedConfiguration;
            onDataStatusChange(hasData);
        }
    }, [uploadedFileName, currentMappings, savedConfiguration, onDataStatusChange]);



    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            processFile(selectedFile);
        }
    };

    const processFile = async (selectedFile: File) => {
        // Validate file type - only .xlsx format supported as per PRD
        if (!validateFileType(selectedFile.name, UPLOAD_CONFIG.ALLOWED_EXTENSIONS)) {
            dispatch(
                setToastMessage({
                    type: "error",
                    message: MESSAGES.FILE_TYPE_ERROR,
                })
            );
            return;
        }

        // Validate file size (10MB limit)
        if (!validateFileSize(selectedFile.size, UPLOAD_CONFIG.MAX_SIZE_MB)) {
            dispatch(
                setToastMessage({
                    type: "error",
                    message: MESSAGES.FILE_SIZE_ERROR,
                })
            );
            return;
        }

        // Start validation state
        setUploadStatus(UPLOAD_CONFIG.STATES.VALIDATING);
        setUploadProgress(0);

        // Simulate progress
        const interval = setInterval(() => {
            setUploadProgress((prev) => {
                if (prev >= UPLOAD_CONFIG.ANIMATION.MAX_PROGRESS) {
                    clearInterval(interval);
                    return UPLOAD_CONFIG.ANIMATION.MAX_PROGRESS;
                }
                return prev + 10;
            });
        }, UPLOAD_CONFIG.ANIMATION.PROGRESS_INTERVAL);

        // Extract columns from file
        try {
            const { headers, data } = await extractColumnsFromFile(selectedFile);

            setSourceColumns(headers);
            setFileData(data);
            setUploadedFileName(selectedFile.name);
            setSelectedFile(selectedFile);
            setRowCount(data.length);
            setColumnCount(headers.length);

            // Prune valid mappings: remove mappings if the source column doesn't exist in the new file
            // This prevents "ghost mappings" from templates if the user uploads a different file structure
            // or if they interpret pre-filled template mappings as "auto-magic"
            setCurrentMappings(prevMappings => {
                const validMappings = prevMappings.filter(m => headers.includes(m.sourceColumn));
                return validMappings;
            });

            // Finish progress and set success
            setUploadProgress(100);
            setTimeout(() => {
                setUploadStatus(UPLOAD_CONFIG.STATES.SUCCESS);
            }, UPLOAD_CONFIG.ANIMATION.SUCCESS_DELAY);

            dispatch(
                setToastMessage({
                    type: "success",
                    message: MESSAGES.FILE_UPLOAD_SUCCESS,
                })
            );
        } catch (error) {
            setUploadStatus(UPLOAD_CONFIG.STATES.IDLE);
            dispatch(
                setToastMessage({
                    type: "error",
                    message: MESSAGES.FILE_READ_ERROR,
                })
            );
        } finally {
            clearInterval(interval);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) {
            processFile(droppedFile);
        }
    };

    const handleCancel = () => {
        setShowMapping(false);
        setShowConfigTable(false);
        setSavedConfiguration(null);
        setSourceColumns([]);
        setUploadedFileName("");
        setSelectedFile(null);
        setUploadStatus(UPLOAD_CONFIG.STATES.IDLE);
        setUploadProgress(0);
        setRowCount(0);
        setColumnCount(0);
        setFileData([]);
        setCurrentMappings([]);
        // Reset the file input
        const fileInput = document.getElementById(UPLOAD_CONFIG.INPUT_ID) as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
        loadedEntityRef.current = "";
    };

    const handleUploadClick = () => {
        if (targetColumns && targetColumns.length === 0) {
            dispatch(
                setToastMessage({
                    type: "error",
                    message: MESSAGES.TARGET_COLUMNS_MISSING,
                })
            );
            return;
        }
        if (!uploadedFileName) {
            dispatch(
                setToastMessage({
                    type: "error",
                    message: MESSAGES.SELECT_FILE,
                })
            );
            return;
        }

        if (!entity) {
            dispatch(
                setToastMessage({
                    type: "error",
                    message: MESSAGES.SELECT_ENTITY,
                })
            );
            return;
        }

        // If already in mapping view, save the mapping
        // If already in mapping view, move to preview
        if (showMapping) {
            // Build configuration payload in requested format (Backend-aligned)
            const newPayload = {
                company_id: companyId ? Number(companyId) : null,
                entity_name: entity,
                file_direction: fileDirection,
                change_note: MESSAGES.SAVE_SUCCESS,
                mappings: currentMappings
                    .filter((mapping: any) => sourceColumns.includes(mapping.sourceColumn)) // Double-check: ensure source column exists in current file
                    .map((mapping: any, idx: number) => {
                        // Find target column definition
                        const targetColDef = targetColumns.find((col) => col.name === mapping.targetColumn || col.columnName === mapping.targetColumn);
                        // For gender type, get unique values from uploaded file for the mapped source column
                        let sourceValues: string[] = [];
                        const sourceColIndex = sourceColumns.indexOf(mapping.sourceColumn);
                        if (sourceColIndex !== -1 && fileData.length > 0) {
                            if (targetColDef?.type === FIELD_TYPE.GENDER || targetColDef?.dataType === DATA_TYPE.GENDER) {
                                sourceValues = Array.from(new Set(fileData.map(row => row[sourceColIndex]).filter(v => v !== undefined && v !== null && v !== "")));
                            }
                        }

                        return {
                            source_column_id: sourceColumns.indexOf(mapping.sourceColumn) + 1,
                            source_column_name: mapping.sourceColumn,
                            target_table_name: targetColDef?.tableName || "",
                            target_column_name: targetColDef?.columnName || mapping.targetColumn,
                            transformation_config: (() => {
                                const config = columnConfigurations[mapping.targetColumn] || {};
                                // GENDER
                                if (targetColDef?.type === FIELD_TYPE.GENDER || targetColDef?.dataType === DATA_TYPE.GENDER) {
                                    const mappings = config.gender?.mappings || {};

                                    return {
                                        type: DATA_TYPE.GENDER,
                                        source: {
                                            allowedValues: sourceValues,
                                        },
                                        target: {
                                            allowedValues: targetColDef?.config?.allowedValues || [],
                                            mappings: mappings,
                                        },
                                    };
                                }
                                // DATE
                                if (targetColDef?.type === FIELD_TYPE.DATE || targetColDef?.dataType === DATA_TYPE.DATE) {
                                    const fileFormat = config.date?.sourceFormat || "";
                                    const systemFormat = config.date?.targetFormat || ""; // Strict: No system format fallback

                                    return {
                                        type: DATA_TYPE.DATE,
                                        source: {
                                            format: fileFormat,
                                        },
                                        target: {
                                            format: systemFormat,
                                        },
                                    };
                                }
                                // NUMBER
                                if (targetColDef?.type === FIELD_TYPE.NUMBER || targetColDef?.dataType === DATA_TYPE.NUMBER) {
                                    const targetConfig: any = {
                                        precision: targetColDef?.config?.precision || null,
                                        scale: targetColDef?.config?.scale || null,
                                    };
                                    if (config.number) {
                                        targetConfig.decimalSeparator = config.number.decimalSeparator;
                                        targetConfig.thousandSeparator = config.number.thousandSeparator;
                                    }
                                    return {
                                        type: DATA_TYPE.NUMBER,
                                        source: {},
                                        target: targetConfig,
                                    };
                                }
                                // DEFAULT / STRING
                                if (targetColDef?.type === FIELD_TYPE.TEXT || targetColDef?.dataType === DATA_TYPE.STRING) {
                                    return { type: DATA_TYPE.STRING };
                                }
                                return {};
                            })(),
                        };
                    }),
                createdAt: new Date().toISOString(),
            };



            // Save the configuration locally (Backend format) - USED FOR RENDERING THE PREVIEW TABLE
            setSavedConfiguration(newPayload);

            // Mark current entity as loaded/synced
            loadedEntityRef.current = entity;

            // Show the configuration table view (Preview)
            setShowMapping(false);
            setShowConfigTable(true);
        } else {
            // Show the mapping interface
            setShowMapping(true);
        }
    };

    const handleSaveConfiguration = () => {
        if (!savedConfiguration) return;
        setSaveConfirmOpen(true);
    };

    const confirmSaveConfiguration = () => {
        const apiPayload = {
            company_id: companyId ? parseInt(companyId, 10) : API_CONFIG.DEFAULTS.COMPANY_ID,
            entity_name: entity,
            file_direction: fileDirection,
            change_note: MESSAGES.SAVE_SUCCESS,
            mappings: savedConfiguration.mappings,
        };



        // Save mapping to backend
        saveMappingMutation.mutate({
            endpoint: endPoints.mappingTemplates,
            method: HTTP_METHODS.POST,
            data: apiPayload
        });
        setSaveConfirmOpen(false);
    };

    const handleExportErrorReport = () => {
        // Use validationResults directly since they're already computed
        if (validationResults.length === 0) {
            dispatch(setToastMessage({ type: "info", message: MESSAGES.VALIDATION_NO_ERRORS }));
            return;
        }

        const errors = validationResults.map((vr) => ({
            [UI_TEXT.EXPORT_REPORT.ROW_NUMBER]: vr.rowIndex + 2,
            [UI_TEXT.EXPORT_REPORT.COLUMN_NAME]: vr.columnName,
            [UI_TEXT.EXPORT_REPORT.INVALID_VALUE]: vr.value,
            [UI_TEXT.EXPORT_REPORT.ERROR_MESSAGE]: vr.error || MESSAGES.INVALID_DATA
        }));

        const ws = XLSX.utils.json_to_sheet(errors);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, UI_TEXT.EXPORT_REPORT.SHEET_NAME);
        XLSX.writeFile(wb, UI_TEXT.EXPORT_REPORT.FILE_NAME);
    };

    const handleExportMappingTemplate = () => {
        if (!savedConfiguration) {
            dispatch(setToastMessage(MESSAGES.NO_DATA_TO_EXPORT));
            return;
        }

        // Prepare table headers for the export
        const headers = UI_TEXT.EXPORT_HEADERS;

        // Map each mapping configuration to a row
        const rows = savedConfiguration.mappings.map((cm: any) => {
            const tConfig = cm.transformation_config || {};
            let sourceFormat = "";
            let targetFormat = "";

            if (tConfig.type === DATA_TYPE.DATE) {
                sourceFormat = tConfig.source?.format || "";
                targetFormat = tConfig.target?.format || "";
            } else if (tConfig.type === DATA_TYPE.GENDER) {
                sourceFormat = tConfig.source?.values?.join(", ") || "";
                targetFormat = tConfig.target?.allowedValues?.join(", ") || "";
            } else if (tConfig.type === DATA_TYPE.NUMBER && tConfig.target) {
                const parts = [];
                if (tConfig.target.decimalSeparator !== undefined) parts.push(`${UI_TEXT.DECIMAL_PREFIX}${tConfig.target.decimalSeparator} `);
                if (tConfig.target.thousandSeparator !== undefined) parts.push(`${UI_TEXT.THOUSAND_PREFIX}${tConfig.target.thousandSeparator} `);
                targetFormat = parts.join(", ");
            }

            return [
                cm.source_column_name,
                cm.target_column_name,
                tConfig.type || DATA_TYPE.STRING,
                sourceFormat,
                targetFormat
            ];
        });

        const exportData = [headers, ...rows];

        // Create Excel file
        const ws = XLSX.utils.aoa_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, UI_TEXT.SHEET_NAME);

        // File name
        const fileName = `${entity}${UI_TEXT.TEMPLATE_EXPORT_FILE_SUFFIX}${new Date().getTime()}.xlsx`;
        XLSX.writeFile(wb, fileName);

        dispatch(
            setToastMessage({
                type: "success",
                message: MESSAGES.EXPORT_SUCCESS,
            })
        );
    };

    const handleEditConfiguration = () => {
        // Load saved configuration back into mapping view
        if (savedConfiguration && targetColumnsData?.data) {
            setShowConfigTable(false);
            setShowMapping(true);

            // Reconstruct mappings and configurations using shared helper
            const { newMappings, newConfigs } = processTemplateMappings(savedConfiguration.mappings, targetColumnsData.data);
            setCurrentMappings(newMappings);
            setColumnConfigurations(newConfigs);
        }
    };

    const handleDeleteConfiguration = () => {
        setDeleteConfirmOpen(true);
    };

    const confirmDeleteConfiguration = () => {
        // Use the ID from the currently loaded configuration if available,
        // falling back to finding the active template from the list.
        const templateId = savedConfiguration?.id || savedTemplateData?.data?.find((t: any) => t.status === TEMPLATE_STATUS.ACTIVE)?.id;

        if (templateId) {
            deleteMappingMutation.mutate({
                endpoint: endPoints.deleteMappingTemplate(templateId),
                method: HTTP_METHODS.DELETE,
                data: {}
            });
        } else {
            // Fallback for local cleanup if no ID found
            setShowConfigTable(false);
            setSavedConfiguration(null);
            setCurrentMappings([]);
            setColumnConfigurations({});
            setUploadedFileName("");
            setSourceColumns([]);
            setUploadStatus(UPLOAD_CONFIG.STATES.IDLE);
            setUploadProgress(0);
            setRowCount(0);
            setColumnCount(0);
            const fileInput = document.getElementById(UPLOAD_CONFIG.INPUT_ID) as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
            dispatch(
                setToastMessage({
                    type: "success",
                    message: MESSAGES.CONFIG_DELETED,
                })
            );
            setDeleteConfirmOpen(false);
        }
    };



    const handleTemplateSelection = (template: any) => {
        if (!template) return;

        // Clear existing mappings, configurations and validation results first as per user request
        setCurrentMappings([]);
        setColumnConfigurations({});
        setValidationResults([]);

        // Immediately claim this entity+direction state to prevent auto-load interference
        const entityKey = `${entity}_${fileDirection}`;
        loadedEntityRef.current = entityKey;

        // Use the selected template as the new saved configuration
        setSavedConfiguration(template);
        dispatch(setToastMessage({ type: "success", message: MESSAGES.TEMPLATE_RESTORE_SUCCESS }));

        // Trigger re-parsing of mappings based on this new configuration
        if (template.mappings && targetColumnsData?.data) {
            const { newMappings, newConfigs } = processTemplateMappings(template.mappings, targetColumnsData.data);
            setCurrentMappings(newMappings);
            setColumnConfigurations(newConfigs);
        }
    };

    const handleRestoreTemplate = (template: any) => {
        if (!template?.id) return;
        restoreTemplateRef.current = template;
        restoreMappingMutation.mutate({
            endpoint: endPoints.restoreMappingTemplate(template.id),
            method: HTTP_METHODS.POST,
            data: {}
        });
    };

    const handleTemplateImport = (file: File) => {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();

        if (['xlsx', 'xls'].includes(fileExtension || '')) {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
                    const headers = (jsonData[0] as string[]) || [];

                    if (!headers || headers.length === 0) {
                        throw new Error(MESSAGES.NO_HEADERS);
                    }

                    // Check if it is a Detailed Mapping Report (from Export Template)
                    const isDetailedReport = JSON.stringify(headers) === JSON.stringify(UI_TEXT.EXPORT_HEADERS);
                    const newMappings: any[] = [];
                    let importedCount = 0;

                    if (isDetailedReport) {
                        // Detailed Import Logic
                        const rows = jsonData.slice(1);
                        rows.forEach((row: any[]) => {
                            const sourceCol = row[0];
                            const targetColName = row[1];
                            const type = row[2] || DATA_TYPE.STRING;
                            const sourceFormatStr = row[3]; // "Source Format/Data"
                            const targetFormatStr = row[4]; // "Target Format/Data"

                            if (sourceCol && targetColName) {
                                // Reconstruct transformation config
                                const transformationConfig: any = { type };

                                if (type === DATA_TYPE.DATE) {
                                    if (sourceFormatStr) transformationConfig.source = { format: sourceFormatStr };
                                    if (targetFormatStr) transformationConfig.target = { format: targetFormatStr };
                                } else if (type === DATA_TYPE.GENDER) {
                                    if (sourceFormatStr) transformationConfig.source = { values: sourceFormatStr.split(', ').map((s: string) => s.trim()) };
                                    if (targetFormatStr) {
                                        const allowedValues = targetFormatStr.split(', ').map((s: string) => s.trim());
                                        transformationConfig.target = { allowedValues };

                                        if (transformationConfig.source?.values && transformationConfig.source.values.length === allowedValues.length) {
                                            const mappings: Record<string, string> = {};
                                            transformationConfig.source.values.forEach((val: string, index: number) => {
                                                mappings[val] = allowedValues[index];
                                            });
                                            transformationConfig.target.mappings = mappings;
                                        }
                                    }
                                } else if (type === DATA_TYPE.NUMBER) {
                                    const targetConfig: any = {};
                                    if (targetFormatStr) {
                                        const parts = targetFormatStr.split(', ');
                                        parts.forEach((p: string) => {
                                            if (p.startsWith(UI_TEXT.DECIMAL_PREFIX)) targetConfig.decimalSeparator = p.replace(UI_TEXT.DECIMAL_PREFIX, '');
                                            if (p.startsWith(UI_TEXT.THOUSAND_PREFIX)) targetConfig.thousandSeparator = p.replace(UI_TEXT.THOUSAND_PREFIX, '');
                                        });
                                    }
                                    transformationConfig.target = targetConfig;
                                }

                                newMappings.push({
                                    source: sourceCol,
                                    target: targetColName,
                                    targetField: targetColName,
                                    targetColumn: targetColName,
                                    source_column_name: sourceCol,
                                    target_column_name: targetColName,
                                    transformation_config: transformationConfig
                                });
                                importedCount++;
                            }
                        });
                    } else {
                        // Fallback: Auto-Map Headers Logic
                        headers.forEach(header => {
                            if (!header) return;
                            const targetCol = targetColumns.find(col => col.name.toLowerCase() === String(header).toLowerCase());
                            if (targetCol) {
                                newMappings.push({
                                    source: header,
                                    target: targetCol.name,
                                    targetField: targetCol.name, // Ensure compatibility
                                    targetColumn: targetCol.name,
                                    source_column_name: header, // Required for processTemplateMappings
                                    target_column_name: targetCol.name // Required for processTemplateMappings
                                });
                                importedCount++;
                            }
                        });
                    }

                    if (newMappings.length === 0) {
                        const msg = isDetailedReport
                            ? MESSAGES.NO_VALID_MAPPINGS_DETAILED
                            : MESSAGES.NO_MATCHING_COLUMNS;
                        dispatch(setToastMessage({ type: "warning", message: msg }));
                        return;
                    }

                    const excelConfig = {
                        mappings: newMappings,
                        entity_name: entity,
                        file_direction: fileDirection, // Note: Detailed report doesn't store direction, so we assume current
                        is_excel_import: true
                    };

                    setSavedConfiguration(excelConfig);
                    handleTemplateSelection(excelConfig);

                    const successMsg = isDetailedReport
                        ? MESSAGES.RESTORED_SUCCESS(importedCount)
                        : MESSAGES.AUTO_MAPPED_SUCCESS(importedCount);
                    dispatch(setToastMessage({ type: "success", message: successMsg }));

                } catch (error) {
                    dispatch(setToastMessage({ type: "error", message: MESSAGES.TEMPLATE_IMPORT_ERROR }));
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (fileExtension === 'json') {
            const reader = new FileReader();
            reader.onload = (e: ProgressEvent<FileReader>) => {
                try {
                    const json = JSON.parse(e.target?.result as string);
                    // Basic validation
                    if (!json.mappings || !Array.isArray(json.mappings)) {
                        throw new Error(MESSAGES.TEMPLATE_INVALID_FORMAT);
                    }

                    // check if entity matches (optional warning)
                    if (json.entity_name && json.entity_name !== entity) {
                        dispatch(setToastMessage({ type: "warning", message: MESSAGES.TEMPLATE_ENTITY_MISMATCH(json.entity_name, entity) }));
                    }

                    setSavedConfiguration(json);
                    dispatch(setToastMessage({ type: "success", message: MESSAGES.TEMPLATE_IMPORT_SUCCESS }));

                    // Update UI state same as selection
                    handleTemplateSelection(json);

                } catch (error) {
                    dispatch(setToastMessage({ type: "error", message: MESSAGES.TEMPLATE_IMPORT_ERROR }));
                }
            };
            reader.readAsText(file);
        } else {
            dispatch(setToastMessage({ type: "error", message: UI_TEXT.TEMPLATE_MANAGEMENT.INVALID_FILE_TYPE }));
        }
    };

    return (
        <UtilityExcelUploadContainer hasMappingOrConfig={showMapping || showConfigTable}>
            {/* Template Management Dialog */}
            <TemplateManagementDialog
                open={showTemplateDialog}
                onClose={() => setShowTemplateDialog(false)}
                templates={savedTemplateData?.data || []}
                onSelectTemplate={handleTemplateSelection}
                onImportTemplate={handleTemplateImport}
                onPreviewTemplate={handlePreviewTemplate}
                onDownloadTemplate={handleDownloadTemplate}
                onRestoreTemplate={handleRestoreTemplate}
            />

            {previewTemplate && (
                <CustomModal
                    open={Boolean(previewTemplate)}
                    handleClose={() => setPreviewTemplate(null)}
                    heading={UI_TEXT.TEMPLATE_MANAGEMENT.PREVIEW_HEADING(previewTemplate.template_version_no || '')}
                    buttons={[
                        {
                            label: UI_TEXT.TEMPLATE_MANAGEMENT.CLOSE_BTN,
                            onClick: () => setPreviewTemplate(null),
                            variant: "secondary",
                        },
                    ]}
                >
                    <DialogContentBox>
                        <PreviewDirectionContainer>
                            <PreviewDirectionText variant="caption">
                                <strong>{UI_TEXT.TEMPLATE_MANAGEMENT.FILE_DIRECTION_LABEL}</strong> {previewTemplate?.fileDirection || fileDirection}
                            </PreviewDirectionText>
                        </PreviewDirectionContainer>
                        <PreviewTableContainer>
                            <PreviewTable>
                                <PreviewTableHead>
                                    <PreviewTableRow>
                                        <PreviewTableHeadCell>
                                            {(previewTemplate?.fileDirection || fileDirection) === DIRECTION.OUTBOUND
                                                ? UI_TEXT.TEMPLATE_MANAGEMENT.PREVIEW_SYSTEM_FIELDS
                                                : UI_TEXT.TEMPLATE_MANAGEMENT.PREVIEW_SOURCE_COL}
                                        </PreviewTableHeadCell>
                                        <PreviewTableHeadCell>
                                            {(previewTemplate?.fileDirection || fileDirection) === DIRECTION.OUTBOUND
                                                ? UI_TEXT.TEMPLATE_MANAGEMENT.PREVIEW_COLUMN_NAME
                                                : UI_TEXT.TEMPLATE_MANAGEMENT.PREVIEW_TARGET_COL}
                                        </PreviewTableHeadCell>
                                        <PreviewTableHeadCell>{UI_TEXT.TEMPLATE_MANAGEMENT.PREVIEW_FORMAT}</PreviewTableHeadCell>
                                    </PreviewTableRow>
                                </PreviewTableHead>
                                <tbody>
                                    {(previewTemplate?.mappings || []).map((m: any, i: number) => {
                                        let formatDisplay = "—";
                                        const config = m?.transformation_config;
                                        if (config && config.type) {
                                            if (config.type === DATA_TYPE.DATE) {
                                                formatDisplay = config.target?.format || 'System';
                                            } else if (config.type === DATA_TYPE.GENDER) {
                                                const mappings = config.target?.mappings || {};
                                                const mappingPairs = Object.entries(mappings).map(([k, v]) => `${k}: ${v}`);
                                                formatDisplay = mappingPairs.length > 0 ? mappingPairs.join(', ') : "Gender Mapping";
                                            } else if (config.type === DATA_TYPE.NUMBER) {
                                                formatDisplay = "Number";
                                            } else {
                                                formatDisplay = String(config.type);
                                            }
                                        }

                                        const isOutbound = (previewTemplate.fileDirection || fileDirection) === DIRECTION.OUTBOUND;
                                        const col1 = isOutbound ? (m?.target_column_name || '—') : (m?.source_column_name || '—');
                                        const col2 = isOutbound ? (m?.source_column_name || '—') : (m?.target_column_name || '—');

                                        return (
                                            <PreviewTableRow key={i}>
                                                <PreviewTableBodyCell>{col1}</PreviewTableBodyCell>
                                                <PreviewTableBodyCell>{col2}</PreviewTableBodyCell>
                                                <PreviewTableBodyCell>{formatDisplay}</PreviewTableBodyCell>
                                            </PreviewTableRow>
                                        );
                                    })}
                                    {(!previewTemplate?.mappings || previewTemplate.mappings.length === 0) && (
                                        <PreviewTableRow>
                                            <PreviewEmptyCell colSpan={3}>
                                                {MESSAGES.NO_VALID_MAPPINGS_DETAILED || "No mappings configured for this version."}
                                            </PreviewEmptyCell>
                                        </PreviewTableRow>
                                    )}
                                </tbody>
                            </PreviewTable>
                        </PreviewTableContainer>
                    </DialogContentBox>
                </CustomModal>
            )}

            {/* Header */}
            {!showMapping && !showConfigTable && (
                <HeaderWrapper>
                    <Box>
                        <UtilityExcelUploadHeader variant="h1">
                            {UI_TEXT.UPLOAD_TITLE}
                        </UtilityExcelUploadHeader>
                    </Box>
                    <ManageTemplateButton
                        variant="outlined"
                        startIcon={<HistoryIcon />}
                        onClick={() => setShowTemplateDialog(true)}
                    >
                        {UI_TEXT.TEMPLATE_MANAGEMENT.MANAGE_BTN}
                    </ManageTemplateButton>
                </HeaderWrapper>
            )}

            {/* Upload Section */}
            {!showMapping && !showConfigTable && (
                <StyledUploadContainer centered>
                    <UploadTitle variant="h5">
                        {UI_TEXT.UPLOAD_DESCRIPTION}
                    </UploadTitle>

                    <UploadCard>
                        <UploadBox
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDragLeave={handleDragLeave}
                            isDragging={isDragging}
                            uploadStatus={uploadStatus}
                        >
                            <input
                                type="file"
                                id="upload-button"
                                hidden
                                accept=".xlsx"
                                onChange={handleFileChange}
                                disabled={uploadStatus !== 'idle'}
                            />

                            <DropZoneContent>
                                {uploadStatus === 'idle' && (
                                    <UploadLabel htmlFor="upload-button">
                                        <UploadActionBox>
                                            <UploadIconWrapper>
                                                <StyledIconImg src={fileUploadIcon} alt="upload" size={28} />
                                            </UploadIconWrapper>
                                            <UploadBoxNote variant="body2">
                                                {UI_TEXT.UPLOAD_BOX_CLICK}
                                            </UploadBoxNote>
                                            <FileTypeHintText variant="caption">
                                                {UI_TEXT.TEMPLATE_MANAGEMENT.SUPPORTED_FORMATS}
                                            </FileTypeHintText>
                                            <FileTypeHintText variant="caption" sx={{ mt: 0.5 }}>
                                                {UI_TEXT.TEMPLATE_MANAGEMENT.MAX_SIZE_HINT}
                                            </FileTypeHintText>
                                        </UploadActionBox>
                                    </UploadLabel>
                                )}

                                {uploadStatus === 'validating' && (
                                    <ValidationStatusBox>
                                        <UploadIconWrapper>
                                            <StyledCircularProgress size={28} thickness={4} />
                                        </UploadIconWrapper>
                                        <ValidatingText variant="body2">
                                            {UI_TEXT.VALIDATING_FILE}
                                        </ValidatingText>

                                        <ProgressBarWrapper>
                                            <ProgressBarFill progress={uploadProgress} />
                                        </ProgressBarWrapper>

                                        <SavedFileName variant="caption">
                                            {uploadedFileName}
                                        </SavedFileName>
                                    </ValidationStatusBox>
                                )}

                                {uploadStatus === 'success' && (
                                    <SuccessStatusBox>
                                        <UploadIconWrapper success>
                                            <SuccessCheckCircleIcon />
                                        </UploadIconWrapper>
                                        <SuccessTitle variant="body2">
                                            {UI_TEXT.UPLOAD_SUCCESS_TITLE}
                                        </SuccessTitle>

                                        <FileInfoBox>
                                            {/* Using fileUploadIcon as a placeholder for file icon */}
                                            <StyledIconImg src={fileUploadIcon} alt="file" size={18} />
                                            <SuccessFileName variant="body2">
                                                {uploadedFileName}
                                            </SuccessFileName>
                                        </FileInfoBox>

                                        <MetadataContainer>
                                            <MetadataItem>
                                                <span>{rowCount.toLocaleString()}</span> {UI_TEXT.ROWS}
                                            </MetadataItem>
                                            <DotSeparator />
                                            <MetadataItem>
                                                <span>{columnCount}</span> {UI_TEXT.COLUMNS}
                                            </MetadataItem>
                                        </MetadataContainer>

                                        <SuccessActionsBox>
                                            {showDownloadIcon && (
                                                <Tooltip title="Download File">
                                                    <SuccessDownloadIconButton
                                                        size="small"
                                                        onClick={(e: React.MouseEvent) => {
                                                            e.stopPropagation();
                                                            if (selectedFile) {
                                                                const url = URL.createObjectURL(selectedFile);
                                                                const a = document.createElement('a');
                                                                a.href = url;
                                                                a.download = selectedFile.name;
                                                                a.click();
                                                                URL.revokeObjectURL(url);
                                                            }
                                                        }}
                                                    >
                                                        <StyledIconImg src={downloadIcon} alt="download" size={16} />
                                                    </SuccessDownloadIconButton>
                                                </Tooltip>
                                            )}
                                        </SuccessActionsBox>
                                    </SuccessStatusBox>
                                )}
                            </DropZoneContent>
                        </UploadBox>

                        <CenteredFlexBox>
                            {uploadStatus === 'success' && (
                                <CancelButton
                                    variant="outlined"
                                    onClick={handleCancel}
                                >
                                    {UI_TEXT.CANCEL_BTN || UI_TEXT.TEMPLATE_MANAGEMENT.CANCEL_BTN}
                                </CancelButton>
                            )}
                            <ContinueButton
                                variant="contained"
                                onClick={handleUploadClick}
                                disabled={uploadStatus !== 'success'}
                            >
                                {UI_TEXT.CONTINUE_TO_MAPPING}
                            </ContinueButton>
                        </CenteredFlexBox>
                    </UploadCard>
                </StyledUploadContainer>
            )}

            <CustomModal
                open={deleteConfirmOpen}
                handleClose={() => setDeleteConfirmOpen(false)}
                heading={UI_TEXT.DELETE_TITLE}
                buttons={[
                    {
                        label: UI_TEXT.CANCEL_BTN,
                        onClick: () => setDeleteConfirmOpen(false),
                        variant: "secondary",
                    },
                    {
                        label: UI_TEXT.DELETE_BTN,
                        onClick: confirmDeleteConfiguration,
                        variant: "primary",
                    },
                ]}
            >
                <DialogContentBox>
                    <Typography variant="body1" color="textPrimary">
                        {UI_TEXT.DELETE_MAPPING_CONFIRMATION_MESSAGE}
                    </Typography>
                </DialogContentBox>
            </CustomModal>
            <CustomModal
                open={saveConfirmOpen}
                handleClose={() => setSaveConfirmOpen(false)}
                heading={UI_TEXT.SAVE_TITLE}
                buttons={[
                    {
                        label: UI_TEXT.CANCEL_BTN,
                        onClick: () => setSaveConfirmOpen(false),
                        variant: "secondary",
                    },
                    {
                        label: UI_TEXT.SAVE_BTN,
                        onClick: confirmSaveConfiguration,
                        variant: "primary",
                    },
                ]}
            >
                <DialogContentBox>
                    <Typography variant="body1" color="textPrimary">
                        {UI_TEXT.SAVE_CONFIRMATION_MESSAGE}
                    </Typography>
                </DialogContentBox>
            </CustomModal>

            {
                showMapping && (
                    loadingTargetColumns ? (
                        <CenteredColumnFlexBox py={10} gap={2}>
                            <StyledCircularProgress size={40} />
                            <Typography variant="body2" color="textSecondary">
                                {UI_TEXT.LOADING_TARGET_FIELDS}
                            </Typography>
                        </CenteredColumnFlexBox>
                    ) : (sourceColumns.length > 0 && targetColumns.length > 0) ? (
                        <ColumnMapping
                            key={savedConfiguration?.id || "default-mapping"}
                            sourceColumns={sourceColumns}
                            targetColumns={targetColumns}
                            fileData={fileData}
                            initialMappings={currentMappings}
                            initialConfigurations={columnConfigurations}
                            onMappingChange={(mappings) => {
                                setCurrentMappings(mappings);
                            }}
                            onConfigurationChange={(configs) => {
                                setColumnConfigurations(configs);
                            }}
                            onClearAll={handleCancel}
                            onSave={handleUploadClick}
                            onExportErrors={handleExportErrorReport}
                            direction={fileDirection as any}
                            validationResults={validationResults}
                            hasValidationErrors={validationResults.length > 0}
                            onManageTemplates={() => setShowTemplateDialog(true)}
                        />
                    ) : null
                )
            }

            {
                showConfigTable && savedConfiguration && (
                    <ConfigTableContainer>
                        <ConfigSuccessBanner>
                            <BannerIconCircle>
                                <BannerCheckIcon />
                            </BannerIconCircle>
                            <ConfigBannerContent>
                                <BannerTitle>{UI_TEXT.CONFIG_BANNER_TITLE}</BannerTitle>
                                <BannerSubText>
                                    {UI_TEXT.FIELDS_MAPPED(savedConfiguration.mappings.length)}
                                </BannerSubText>
                            </ConfigBannerContent>
                            <ConfigActions>
                                <Tooltip title={UI_TEXT.EDIT_CONFIG}>
                                    <ConfigActionIconButton onClick={handleEditConfiguration} size="small">
                                        <StyledIconImg src={EditIcon} alt="editicon" />
                                    </ConfigActionIconButton>
                                </Tooltip>
                                <Tooltip title={UI_TEXT.DELETE_CONFIG}>
                                    <ConfigActionIconButton
                                        onClick={handleDeleteConfiguration}
                                        size="small"
                                        className="delete-btn"
                                    >
                                        <StyledIconImg src={DeleteIcon} alt="deleteicon" />
                                    </ConfigActionIconButton>
                                </Tooltip>
                                <Tooltip title={UI_TEXT.DOWNLOAD}>
                                    <ConfigActionIconButton
                                        onClick={(e: any) => setDownloadMenuAnchor(e.currentTarget)}
                                        size="small"
                                    >
                                        <StyledIconImg src={downloadIcon} alt="download" />
                                    </ConfigActionIconButton>
                                </Tooltip>
                                <StyledMenu
                                    anchorEl={downloadMenuAnchor}
                                    open={Boolean(downloadMenuAnchor)}
                                    onClose={() => setDownloadMenuAnchor(null)}
                                >

                                    <StyledMenuItem
                                        onClick={() => { handleExportMappingTemplate(); setDownloadMenuAnchor(null); }}
                                    >
                                        <StyledListItemIcon>
                                            <StyledIconImg src={downloadIcon} alt="download" size={18} />
                                        </StyledListItemIcon>
                                        <ListItemText
                                            slotProps={{
                                                primary: getListItemPrimaryTextProps(theme)
                                            }}
                                        >
                                            {UI_TEXT.EXPORT_TEMPLATE}
                                        </ListItemText>
                                    </StyledMenuItem>
                                </StyledMenu>
                            </ConfigActions>
                        </ConfigSuccessBanner>

                        <ConfigTableWrapper>
                            <ConfigTable>
                                <ConfigTableHead>
                                    <tr>
                                        {savedConfiguration.mappings.map((cm: any, index: number) => {
                                            const headerLabel = fileDirection === DIRECTION.OUTBOUND
                                                ? cm.source_column_name
                                                : cm.target_column_name.replace(/_/g, " ");
                                            const badgeLabel = fileDirection === DIRECTION.OUTBOUND
                                                ? targetColumns.find(tc => tc.name === cm.target_column_name)?.label || cm.target_column_name.replace(/_/g, " ")
                                                : cm.source_column_name;

                                            return (
                                                <ConfigTableHeaderCell
                                                    key={index}
                                                    $isLast={index === savedConfiguration.mappings.length - 1}
                                                >
                                                    <ConfigHeaderContent>
                                                        <ConfigHeaderTitle>
                                                            <span>{headerLabel}</span>
                                                            {fileDirection === DIRECTION.INBOUND && <ConfigRequiredMark>*</ConfigRequiredMark>}
                                                        </ConfigHeaderTitle>
                                                        <ConfigMappedBadge>
                                                            <BadgeCheckIcon />
                                                            <span>{badgeLabel}</span>
                                                        </ConfigMappedBadge>
                                                    </ConfigHeaderContent>
                                                </ConfigTableHeaderCell>
                                            );
                                        })}
                                    </tr>
                                </ConfigTableHead>
                                <tbody>
                                    {fileData.map((row, rowIndex) => (
                                        <ConfigTableRow key={rowIndex}>
                                            {savedConfiguration.mappings.map((cm: any, colIndex: number) => {
                                                const sourceColIndex = sourceColumns.indexOf(cm.source_column_name);
                                                const cellValue = row[sourceColIndex];

                                                // Find target column definition to know the type
                                                const targetColName = cm.target_column_name;
                                                const targetColDef = targetColumns.find((col) =>
                                                    (col.name === targetColName) || (col.columnName === targetColName)
                                                );

                                                const result = transformValue(cellValue, targetColName, targetColDef, cm.transformation_config);
                                                const displayContent = result.value;
                                                const isInvalid = !result.isValid;
                                                const errorMsg = result.error || "";

                                                return (
                                                    <ConfigTableDataCell
                                                        key={colIndex}
                                                        $isLast={colIndex === savedConfiguration.mappings.length - 1}
                                                        $isInvalid={isInvalid}
                                                    >
                                                        {isInvalid ? (
                                                            <Tooltip title={errorMsg} placement="top">
                                                                <span>{displayContent}</span>
                                                            </Tooltip>
                                                        ) : displayContent}
                                                    </ConfigTableDataCell>
                                                );
                                            })}
                                        </ConfigTableRow>
                                    ))}
                                </tbody>
                            </ConfigTable>
                        </ConfigTableWrapper>

                        {savedConfiguration?.mappings?.length > 0 && (
                            <SaveButtonWrapper>
                                <SaveConfigButton
                                    variant="contained"
                                    onClick={handleSaveConfiguration}
                                    disabled={saveMappingMutation.isPending || validationResults.length > 0}
                                >
                                    {saveMappingMutation.isPending ? UI_TEXT.SAVING : UI_TEXT.SAVE_CONFIGURATION}
                                </SaveConfigButton>
                            </SaveButtonWrapper>
                        )}
                    </ConfigTableContainer>
                )
            }


        </UtilityExcelUploadContainer >

    );
};
