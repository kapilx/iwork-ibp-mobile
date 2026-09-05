// TypeScript type for backend target column definition
export interface BackendTargetColumnConfig {
  type: string;
  scale?: number;
  precision?: number;
  targetFormat?: string;
  allowedValues?: string[];
}

export interface BackendTargetColumn {
  id: number;
  entityName: string;
  tableName: string;
  columnName: string;
  displayName: string;
  dataType: string;
  isRequired: boolean;
  config: BackendTargetColumnConfig;
  createdAt: string;
  createdBy: number;
  updatedAt: string;
  updatedBy: number;
}
import React, { useState } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
  DroppableStateSnapshot,
} from "react-beautiful-dnd";
import { Typography, Tooltip, IconButton } from "@mui/material";
import HistoryIcon from '@mui/icons-material/History';
import { CustomModal } from "@ui/ui-lib";
import {
  MappingContainer,
  MappingSplitView,
  SourcePanel,
  TargetPanel,
  PanelHeader,
  PanelContent,
  ColumnItem,
  ColumnLabel,
  DragHandle,
  TableHeader,
  TableHeaderContent,
  MappedInfo,
  MappingTable,
  HeaderActionsContainer,
  IconButtonGroup,
  UnmappedHeaderContent,
  EmptyStateContainer,
  EmptyStateContent,
  EmptyStateIconBox,
  TableRow,
  TableCell,
  RequiredIndicator,
  HiddenPlaceholder,
  FooterContainer,
  FooterButtonGroup,
  ColumnLabelText,
  HeaderLabelText,
  TablePanelContent,
  ColumnHeaderRow,
  BoldText,
  FooterOutlinedButton,
  FooterContainedButton,
  FooterLeftSection,
  FooterDot,
  PanelHeaderSubText,
  StyledDragIndicatorIcon,
  StyledLockIcon,
  ConfigIconButton,
  StyledSettingsIcon,
  StyledClearIcon,
  StyledCheckIcon,
  MappedSourceTypography,
  UnmappedHeaderLabel,
  UnmappedHeaderStatus,
  EmptyStateTitle,
  EmptyStateSubtitle,
  FooterRequiredText,
  FooterRemainingText,
  PanelHeaderTitle,
  ConfirmDialogContent,
  EmptyStateIcon,
  FooterWarningText,
  StyledWarningAmberIcon,
  ErrorHeaderContainer,
  ErrorHeaderIcon,
  ExportErrorsButton,
  FooterCancelButton,
  PanelHeaderTop,
  ErrorLabelText,
} from "./styles";
import {
  MAPPING_MESSAGES,
  MAPPING_UI_TEXT,
  DEFAULT_LEGACY_REQUIRED_FIELDS,
  NUMBER_KEYWORDS,
  CONFIG_OPTIONS,
  EMPTY_VALUE_PLACEHOLDER,
  DRAG_ID_PREFIXES,
} from "./constants";
import {
  ConfigDialog,
  ConfigType,
  DateConfig,
  GenderConfig,
  NumberConfig,
} from "./ConfigDialog";
import { transformValue } from "../utils";
import { DIRECTION, FIELD_TYPE, getFieldType, MESSAGES } from "../constants";

interface ColumnMapping {
  sourceColumn: string;
  targetColumn: string;
}

// Used throughout the mapping UI for normalized columns
interface TargetColumnDef {
  name: string;
  label: string;
  required: boolean;
  type: string; // text, date, gender, number, email
  format?: string;
  columnName?: string;
  tableName?: string;
  dataType?: string;
  config?: BackendTargetColumnConfig;
}

interface ColumnMappingProps {
  sourceColumns: string[];
  targetColumns: TargetColumnDef[] | BackendTargetColumn[] | string[]; // Support backend, normalized, and legacy formats
  fileData?: any[][]; // Actual data rows from the uploaded file
  initialMappings?: ColumnMapping[];
  initialConfigurations?: any;
  onMappingChange?: (mappings: ColumnMapping[]) => void;
  onConfigurationChange?: (configurations: any) => void;
  onClearAll?: () => void;
  onSave?: () => void;
  onExportErrors?: () => void;
  direction?: typeof DIRECTION.INBOUND | typeof DIRECTION.OUTBOUND;
  hasValidationErrors?: boolean;
  validationResults?: any[];
  onManageTemplates?: () => void;
}

const ColumnMappingComponent: React.FC<ColumnMappingProps> = ({
  sourceColumns,
  targetColumns,
  fileData = [],
  initialMappings = [],
  initialConfigurations = {},
  onMappingChange,
  onConfigurationChange,
  onClearAll,
  onSave,
  onExportErrors,
  direction = DIRECTION.INBOUND,
  hasValidationErrors = false,
  validationResults = [],
  onManageTemplates,
}) => {

  // Convert target columns to TargetColumnDef format if they're strings (backward compatibility)
  const targetColumnDefs = React.useMemo<TargetColumnDef[]>(() => {
    if (targetColumns.length === 0) return [];
    // If backend format (array of BackendTargetColumn)
    if (typeof targetColumns[0] === 'object' && 'columnName' in targetColumns[0]) {
      return (targetColumns as BackendTargetColumn[]).map((col) => ({
        name: col.columnName,
        label: col.displayName,
        required: col.isRequired,
        type: getFieldType(col.dataType, col.displayName),
        format: col.config?.targetFormat || col.config?.type || undefined,
        columnName: col.columnName,
        tableName: col.tableName,
        dataType: col.dataType,
        config: col.config,
      }));
    }
    // Legacy format: convert strings to objects
    return (targetColumns as string[]).map((col) => ({
      name: col,
      label: col,
      required: DEFAULT_LEGACY_REQUIRED_FIELDS.includes(col),
      type: col.toLowerCase().includes(FIELD_TYPE.DATE) ? FIELD_TYPE.DATE
        : col.toLowerCase().includes(FIELD_TYPE.GENDER) ? FIELD_TYPE.GENDER
          : col.toLowerCase().includes(FIELD_TYPE.NUMBER) || NUMBER_KEYWORDS.some(k => col.toLowerCase().includes(k)) ? FIELD_TYPE.NUMBER
            : FIELD_TYPE.TEXT,
    }));
  }, [targetColumns]);

  // Track mappings: 
  // INBOUND: { targetColumnName: sourceColumnName }
  // OUTBOUND: { sourceColumnName: targetColumnName }
  const [mappings, setMappings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (initialMappings) {
      initialMappings.forEach(m => {
        if (direction === DIRECTION.INBOUND) {
          initial[m.targetColumn] = m.sourceColumn;
        } else {
          initial[m.sourceColumn] = m.targetColumn;
        }
      });
    }
    return initial;
  });


  // Robust normalization for column names matching
  const normalizeColName = (name: string) => String(name).toLowerCase().replace(/[^a-z0-9]/g, '');

  // Track columns with validation errors for header highlighting
  const columnsWithErrors = React.useMemo(() => {
    // Collect all column names that have errors, normalized
    const errorTargetCols = new Set(validationResults.map(res => normalizeColName(res.columnName)));

    if (direction === DIRECTION.INBOUND) {
      // Headers are target columns
      return errorTargetCols;
    } else {
      // Headers are source columns (Excel headers). 
      // We need to see which sourceColumn matches a targetColumn that has an error.
      const sourceColsWithErrors = new Set<string>();
      Object.entries(mappings).forEach(([sourceCol, targetCol]) => {
        if (errorTargetCols.has(normalizeColName(targetCol))) {
          sourceColsWithErrors.add(normalizeColName(sourceCol));
        }
      });
      return sourceColsWithErrors;
    }
  }, [validationResults, direction, mappings]);

  // Track configuration dialogs
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configDialogType, setConfigDialogType] = useState<ConfigType>(FIELD_TYPE.DATE);

  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [currentConfigColumn, setCurrentConfigColumn] = useState<string | null>(null);

  // Store configurations for each column
  const [columnConfigs, setColumnConfigs] = useState<{
    [column: string]: {
      date?: DateConfig;
      gender?: GenderConfig;
      number?: NumberConfig;
    };
  }>(initialConfigurations || {});

  // Sync internal state with props if they change
  React.useEffect(() => {
    if (initialConfigurations && Object.keys(initialConfigurations).length > 0) {
      setColumnConfigs(initialConfigurations);
    }
  }, [initialConfigurations]);

  React.useEffect(() => {
    if (initialMappings) {
      const newMappings: Record<string, string> = {};
      initialMappings.forEach(m => {
        if (direction === DIRECTION.INBOUND) {
          newMappings[m.targetColumn] = m.sourceColumn;
        } else {
          newMappings[m.sourceColumn] = m.targetColumn;
        }
      });
      setMappings(newMappings);
    }
  }, [initialMappings, direction]);

  // Notify parent when configurations change
  React.useEffect(() => {
    if (onConfigurationChange) {
      onConfigurationChange(columnConfigs);
    }
  }, [columnConfigs, onConfigurationChange]);

  const handleDateConfig = (targetColumn: string) => {
    setCurrentConfigColumn(targetColumn);
    setConfigDialogType(FIELD_TYPE.DATE);
    setConfigDialogOpen(true);
  };

  const handleGenderConfig = (targetColumn: string) => {
    setCurrentConfigColumn(targetColumn);
    setConfigDialogType(FIELD_TYPE.GENDER);
    setConfigDialogOpen(true);
  };

  const handleNumberConfig = (targetColumn: string) => {
    setCurrentConfigColumn(targetColumn);
    setConfigDialogType(FIELD_TYPE.NUMBER);
    setConfigDialogOpen(true);
  };

  const handleConfigApply = (config: DateConfig | NumberConfig | GenderConfig) => {
    if (currentConfigColumn) {
      setColumnConfigs({
        ...columnConfigs,
        [currentConfigColumn]: {
          ...columnConfigs[currentConfigColumn],
          [configDialogType]: config,
        },
      });
    }
  };



  const handleDragEnd = (result: DropResult) => {
    const { destination } = result;

    if (!destination) return;

    // Only handle drops on table headers (droppableId starts with "header-")
    if (!destination.droppableId.startsWith(DRAG_ID_PREFIXES.HEADER)) return;

    // Use actual index or unique ID if we have it, but here we extract the name
    // We appended -${index} to ensure uniqueness during drag & drop
    const headerParts = destination.droppableId.replace(DRAG_ID_PREFIXES.HEADER, "").split("-");
    const headerId = headerParts.slice(0, -1).join("-"); // handles names containing dashes

    const dragParts = result.draggableId.replace(DRAG_ID_PREFIXES.DRAG, "").split("-");
    const draggedId = dragParts.slice(0, -1).join("-");

    let newMappings = { ...mappings };

    if (direction === DIRECTION.INBOUND) {
      const targetColumn = headerId;
      const sourceColumn = draggedId;
      const targetCol = targetColumnDefs.find(col => col.name === targetColumn);

      newMappings = { ...mappings, [targetColumn]: sourceColumn };
      setMappings(newMappings);

      // If date type, open dialog with backend format
      if (targetCol && targetCol.type === FIELD_TYPE.DATE) {
        setCurrentConfigColumn(targetColumn);
        setConfigDialogType(FIELD_TYPE.DATE);
        setConfigDialogOpen(true);
        setTimeout(() => {
          setColumnConfigs(cfgs => ({
            ...cfgs,
            [targetColumn]: {
              ...cfgs[targetColumn],
              date: {
                sourceFormat: CONFIG_OPTIONS.DEFAULT_DATE_FORMATS.SOURCE,
                targetFormat: targetCol.format || CONFIG_OPTIONS.DEFAULT_DATE_FORMATS.TARGET,
              },
            },
          }));
        }, 0);
      }
      // If gender type, open dialog with allowed values
      if (targetCol && targetCol.type === FIELD_TYPE.GENDER) {
        setCurrentConfigColumn(targetColumn);
        setConfigDialogType(FIELD_TYPE.GENDER);
        setConfigDialogOpen(true);
        setTimeout(() => {
          setColumnConfigs(cfgs => ({
            ...cfgs,
            [targetColumn]: {
              ...cfgs[targetColumn],
              gender: {
                sourceValues: [],
                allowedValues: targetCol.config?.allowedValues || [],
                mappings: {},
              },
            },
          }));
        }, 0);
      }
    } else {
      // OUTBOUND: headerId = sourceColumn, draggedId = targetColumn (name)
      const sourceColumn = headerId;
      const targetColumn = draggedId;
      const targetCol = targetColumnDefs.find(col => col.name === targetColumn);

      newMappings = { ...mappings, [sourceColumn]: targetColumn };
      setMappings(newMappings);

      // Open config dialog for Date/Gender fields in Outbound
      if (targetCol && targetCol.type === FIELD_TYPE.DATE) {
        setCurrentConfigColumn(targetColumn);
        setConfigDialogType(FIELD_TYPE.DATE);
        setConfigDialogOpen(true);
        setTimeout(() => {
          setColumnConfigs(cfgs => ({
            ...cfgs,
            [targetColumn]: {
              ...cfgs[targetColumn],
              date: {
                sourceFormat: CONFIG_OPTIONS.DEFAULT_DATE_FORMATS.SOURCE,
                targetFormat: targetCol.format || CONFIG_OPTIONS.DEFAULT_DATE_FORMATS.TARGET,
              },
            },
          }));
        }, 0);
      }
      if (targetCol && targetCol.type === FIELD_TYPE.GENDER) {
        setCurrentConfigColumn(targetColumn);
        setConfigDialogType(FIELD_TYPE.GENDER);
        setConfigDialogOpen(true);
        setTimeout(() => {
          setColumnConfigs(cfgs => ({
            ...cfgs,
            [targetColumn]: {
              ...cfgs[targetColumn],
              gender: {
                sourceValues: [],
                allowedValues: targetCol.config?.allowedValues || [],
                mappings: {},
              },
            },
          }));
        }, 0);
      }
    }

    // Notify parent
    notifyMappingChange(newMappings);
  };

  const handleClearMapping = (colName: string) => {
    const newMappings = { ...mappings };
    delete newMappings[colName];
    setMappings(newMappings);
    notifyMappingChange(newMappings);
  };

  const handleClearAllMappings = () => {
    if (Object.keys(mappings).length === 0) return;
    setClearConfirmOpen(true);
  };

  const confirmClearAll = () => {
    setMappings({});
    setColumnConfigs({});
    notifyMappingChange({});
    setClearConfirmOpen(false);
  };

  const notifyMappingChange = (newMappings: Record<string, string>) => {
    const mappingArray = direction === DIRECTION.INBOUND
      ? Object.entries(newMappings).map(([targetColumn, sourceColumn]) => ({
        sourceColumn,
        targetColumn,
      }))
      : Object.entries(newMappings).map(([sourceColumn, targetColumn]) => ({
        sourceColumn,
        targetColumn,
      }));
    onMappingChange?.(mappingArray);
  };

  const getRemainingFieldsText = () => {
    const unmappedLabels = getUnmappedRequiredFields();
    if (unmappedLabels.length === 0) return "";

    const maxShow = 1;
    const displayed = unmappedLabels.slice(0, maxShow).join(", ");
    const remainingCount = unmappedLabels.length - maxShow;

    return MAPPING_MESSAGES.REMAINING_FIELDS(displayed, remainingCount);
  };

  const getMappedCount = () => Object.keys(mappings).length;

  const getRequiredMappedCount = () => {
    if (direction === DIRECTION.INBOUND) {
      return targetColumnDefs.filter((col) => col.required && mappings[col.name]).length;
    } else {
      // In outbound, we map system fields (target) TO file columns (source)
      // So we check which required target labels are present in the mappings values
      const mappedTargetNames = Object.values(mappings);
      return targetColumnDefs.filter((col) => col.required && mappedTargetNames.includes(col.name)).length;
    }
  };

  const getTotalRequiredCount = () => {
    return targetColumnDefs.filter((col) => col.required).length;
  };

  const getUnmappedRequiredFields = () => {
    if (direction === DIRECTION.INBOUND) {
      const unmapped = targetColumnDefs.filter((col) => col.required && !mappings[col.name]);
      return unmapped.map(col => col.label);
    } else {
      const mappedTargetNames = Object.values(mappings);
      const unmapped = targetColumnDefs.filter((col) => col.required && !mappedTargetNames.includes(col.name));
      return unmapped.map(col => col.label);
    }
  };


  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <MappingContainer>
        <MappingSplitView>
          {/* Left Panel - Draggable Items */}
          <SourcePanel>
            <PanelHeader>
              <PanelHeaderTop>
                <PanelHeaderTitle variant="subtitle1">
                  {direction === DIRECTION.INBOUND ? MAPPING_UI_TEXT.SOURCE_PANEL_TITLE_INBOUND : MAPPING_UI_TEXT.SOURCE_PANEL_TITLE_OUTBOUND}
                </PanelHeaderTitle>
                {onManageTemplates && (
                  <Tooltip title={MAPPING_UI_TEXT.MANAGE_TEMPLATES}>
                    <IconButton size="small" onClick={onManageTemplates}>
                      <HistoryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </PanelHeaderTop>
              <PanelHeaderSubText variant="caption">
                {MAPPING_MESSAGES.DRAG_TO_MAP(direction === DIRECTION.INBOUND ? sourceColumns.length : targetColumnDefs.length)}
              </PanelHeaderSubText>
            </PanelHeader>
            <PanelContent>
              {(direction === DIRECTION.INBOUND ? sourceColumns : targetColumnDefs).map((col: any, index: number) => {
                const colName = typeof col === 'string' ? col : col.name;
                const colLabel = typeof col === 'string' ? col : col.label;
                const isMapped = Object.values(mappings).includes(colName);

                return (
                  <Droppable key={colName} droppableId={`${DRAG_ID_PREFIXES.DRAG}${index}`} isDropDisabled={isMapped}>
                    {(provided: DroppableProvided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps}>
                        <Draggable draggableId={`${DRAG_ID_PREFIXES.DRAG}${colName}-${index}`} index={index} isDragDisabled={isMapped}>
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <ColumnItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              $isDragging={snapshot.isDragging}
                              $isMapped={isMapped}
                            >
                              {!isMapped && (
                                <DragHandle>
                                  <StyledDragIndicatorIcon />
                                </DragHandle>
                              )}
                              <ColumnLabel>
                                <ColumnHeaderRow>
                                  <ColumnLabelText isMapped={isMapped}>
                                    {colLabel}
                                  </ColumnLabelText>
                                  {isMapped && <StyledLockIcon />}
                                </ColumnHeaderRow>
                              </ColumnLabel>
                            </ColumnItem>
                          )}
                        </Draggable>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </PanelContent>
          </SourcePanel>

          {/* Right Panel - Droppable Headers */}
          <TargetPanel>
            <TablePanelContent>
              <MappingTable>
                <thead>
                  <tr>
                    {(direction === DIRECTION.INBOUND ? targetColumnDefs : sourceColumns).map((col: any, index: number) => {
                      const colName = typeof col === 'string' ? col : col.name;
                      const colLabel = typeof col === 'string' ? col : col.label;
                      const mappedItem = mappings[colName];
                      const isMapped = !!mappedItem;
                      const targetCol = direction === DIRECTION.INBOUND
                        ? col
                        : targetColumnDefs.find(tc => tc.name === mappedItem);

                      return (

                        <Droppable key={`${colName}-${index}`} droppableId={`${DRAG_ID_PREFIXES.HEADER}${colName}-${index}`}>
                          {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => {
                            return (
                              <TableHeader
                                ref={provided.innerRef}
                                {...provided.droppableProps}
                                $isMapped={isMapped}
                                $isRequired={targetCol?.required || false}
                                $isDragOver={snapshot.isDraggingOver}
                                $hasError={columnsWithErrors.has(normalizeColName(colName))}
                                as="th"
                              >
                                <TableHeaderContent>
                                  {isMapped ? (
                                    <>
                                      <HeaderActionsContainer>
                                        <HeaderLabelText
                                          title={colLabel}
                                        >
                                          {colLabel}
                                          {direction === DIRECTION.INBOUND && targetCol?.required && <RequiredIndicator>*</RequiredIndicator>}
                                        </HeaderLabelText>
                                        <IconButtonGroup>
                                          {(() => {
                                            const showConfig = direction === DIRECTION.INBOUND
                                              ? [FIELD_TYPE.DATE, FIELD_TYPE.GENDER].includes(targetCol?.type || "")
                                              : targetCol && [FIELD_TYPE.DATE, FIELD_TYPE.GENDER].includes(targetCol.type || "");

                                            return showConfig ? (
                                              <ConfigIconButton
                                                size="small"
                                                onClick={(e: any) => {
                                                  e.stopPropagation();
                                                  const columnToConfig = direction === DIRECTION.INBOUND ? targetCol.name : mappedItem;
                                                  if (targetCol?.type === FIELD_TYPE.DATE) handleDateConfig(columnToConfig);
                                                  else if (targetCol?.type === FIELD_TYPE.GENDER) handleGenderConfig(columnToConfig);
                                                }}
                                              >
                                                <StyledSettingsIcon />
                                              </ConfigIconButton>
                                            ) : null;
                                          })()}
                                          <ConfigIconButton
                                            size="small"
                                            onClick={() => handleClearMapping(direction === DIRECTION.INBOUND ? (targetCol?.name || colName) : colName)}
                                          >
                                            <StyledClearIcon />
                                          </ConfigIconButton>
                                        </IconButtonGroup>
                                      </HeaderActionsContainer>
                                      {columnsWithErrors.has(normalizeColName(colName)) && (
                                        <ErrorHeaderContainer>
                                          <ErrorHeaderIcon />
                                          <ErrorLabelText variant="caption">
                                            {MESSAGES.INVALID_DATA}
                                          </ErrorLabelText>
                                        </ErrorHeaderContainer>
                                      )}
                                      <MappedInfo>
                                        <StyledCheckIcon />
                                        <MappedSourceTypography
                                          title={direction === DIRECTION.INBOUND ? mappedItem : targetCol?.label}
                                        >
                                          {direction === DIRECTION.INBOUND ? mappedItem : targetCol?.label}
                                        </MappedSourceTypography>
                                      </MappedInfo>

                                    </>
                                  ) : (
                                    <UnmappedHeaderContent>
                                      <UnmappedHeaderLabel>
                                        {colLabel}
                                        {direction === DIRECTION.INBOUND && targetCol?.required && <RequiredIndicator>*</RequiredIndicator>}
                                      </UnmappedHeaderLabel>
                                      <UnmappedHeaderStatus $isDraggingOver={snapshot.isDraggingOver}>
                                        {snapshot.isDraggingOver ? MAPPING_MESSAGES.DROP_HERE : MAPPING_MESSAGES.NOT_MAPPED}
                                      </UnmappedHeaderStatus>
                                    </UnmappedHeaderContent>
                                  )}
                                </TableHeaderContent>

                                <HiddenPlaceholder>{provided.placeholder}</HiddenPlaceholder>
                              </TableHeader>
                            );
                          }}
                        </Droppable>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {getMappedCount() === 0 ? (
                    <tr>
                      <EmptyStateContainer colSpan={(direction === DIRECTION.INBOUND ? targetColumnDefs : sourceColumns).length}>
                        <EmptyStateContent>
                          <EmptyStateIconBox>
                            <EmptyStateIcon width="40" height="40" viewBox="0 0 24 24" fill="none" strokeWidth="2">
                              <rect x="3" y="3" width="7" height="7" />
                              <rect x="14" y="3" width="7" height="7" />
                              <rect x="14" y="14" width="7" height="7" />
                              <rect x="3" y="14" width="7" height="7" />
                            </EmptyStateIcon>
                          </EmptyStateIconBox>
                          <EmptyStateTitle>
                            {MAPPING_UI_TEXT.EMPTY_STATE_TITLE}
                          </EmptyStateTitle>
                          <EmptyStateSubtitle>
                            {MAPPING_UI_TEXT.EMPTY_STATE_SUBTITLE}
                          </EmptyStateSubtitle>
                        </EmptyStateContent>
                      </EmptyStateContainer>
                    </tr>
                  ) : (
                    fileData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {(direction === DIRECTION.INBOUND ? targetColumnDefs : sourceColumns).map((col: any, index: number) => {
                          const colName = typeof col === 'string' ? col : col.name;
                          const mappedItem = mappings[colName];
                          const config = columnConfigs[direction === DIRECTION.INBOUND ? colName : mappedItem];
                          const targetCol = direction === DIRECTION.INBOUND
                            ? col
                            : targetColumnDefs.find(tc => tc.name === mappedItem);

                          let displayContent: React.ReactNode = EMPTY_VALUE_PLACEHOLDER;
                          let isInvalid = false;
                          let errorMsg = "";

                          if (mappedItem && direction === DIRECTION.INBOUND) {
                            const colIndex = sourceColumns.indexOf(mappedItem);
                            if (colIndex !== -1) {
                              const cellValue = row[colIndex];
                              if (targetCol) {
                                const result = transformValue(cellValue, colName, targetCol, config);
                                displayContent = result.value;
                                isInvalid = !result.isValid;
                                errorMsg = result.error || "";
                              } else {
                                displayContent = cellValue ?? EMPTY_VALUE_PLACEHOLDER;
                              }
                            }
                          } else if (direction === DIRECTION.OUTBOUND) {
                            // OUTBOUND logic
                            const colIndex = sourceColumns.indexOf(colName);
                            if (colIndex !== -1) {
                              const cellValue = row[colIndex];
                              if (mappedItem && targetCol) {
                                const result = transformValue(cellValue, mappedItem, targetCol, config);
                                displayContent = result.value;
                                isInvalid = !result.isValid;
                                errorMsg = result.error || "";
                              } else {
                                displayContent = cellValue ?? EMPTY_VALUE_PLACEHOLDER;
                              }
                            }
                          }

                          if (!mappedItem) displayContent = EMPTY_VALUE_PLACEHOLDER;

                          return (
                            <TableCell
                              key={`${colName}-${index}`}
                              $hasError={Boolean(direction === DIRECTION.INBOUND && col.required && !mappedItem)}
                              $isInvalid={isInvalid}
                            >
                              {isInvalid ? (
                                <Tooltip title={errorMsg} placement="top">
                                  <span>{displayContent}</span>
                                </Tooltip>
                              ) : displayContent}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </tbody>
              </MappingTable>
            </TablePanelContent>
          </TargetPanel>
        </MappingSplitView>

        {/* Bottom Info Bar - Always visible */}
        <FooterContainer>
          <FooterLeftSection>
            <FooterRequiredText>
              <BoldText>{getRequiredMappedCount()}</BoldText>
              {" "}of{" "}
              <BoldText>{getTotalRequiredCount()}</BoldText>
              {" "}required fields mapped
            </FooterRequiredText>
            {getUnmappedRequiredFields().length > 0 && getMappedCount() > 0 && (
              <>
                <FooterDot />
                <FooterRemainingText>
                  {getRemainingFieldsText()}
                </FooterRemainingText>
              </>
            )}
            {/* Unmapped Source Warning */}
            {(() => {
              const unmappedCount = direction === DIRECTION.INBOUND
                ? sourceColumns.length - Object.values(mappings).length
                : targetColumnDefs.length - Object.keys(mappings).length;

              if (unmappedCount > 0) {
                return (
                  <>
                    <FooterDot />
                    <Tooltip title={MAPPING_UI_TEXT.UNMAPPED_WARNING ? MAPPING_UI_TEXT.UNMAPPED_WARNING(unmappedCount) : `${unmappedCount} source columns will be ignored.`}>
                      <FooterWarningText>
                        <StyledWarningAmberIcon />
                        {unmappedCount} columns ignored
                      </FooterWarningText>
                    </Tooltip>
                  </>
                );
              }
              return null;
            })()}
          </FooterLeftSection>

          <FooterButtonGroup>
            {getMappedCount() > 0 && (
              <FooterOutlinedButton
                variant="outlined"
                onClick={handleClearAllMappings}
              >
                {MAPPING_UI_TEXT.CLEAR_ALL}
              </FooterOutlinedButton>
            )}
            <FooterCancelButton
              variant="outlined"
              onClick={onClearAll}
            >
              {MAPPING_UI_TEXT.CANCEL}
            </FooterCancelButton>
            <FooterContainedButton
              variant="contained"
              onClick={onSave}
              disabled={hasValidationErrors || getRequiredMappedCount() < getTotalRequiredCount() || getMappedCount() === 0}
            >
              {MAPPING_UI_TEXT.SAVE_CONFIG}
            </FooterContainedButton>
            {hasValidationErrors && onExportErrors && (
              <ExportErrorsButton
                variant="outlined"
                onClick={onExportErrors}
              >
                {MAPPING_UI_TEXT.EXPORT_ERRORS}
              </ExportErrorsButton>
            )}
          </FooterButtonGroup>
        </FooterContainer>
      </MappingContainer >

      {/* Configuration Dialogs */}
      <ConfigDialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        onApply={handleConfigApply}
        type={configDialogType}
        direction={direction}
        fieldName={
          currentConfigColumn
            ? targetColumnDefs.find((col) => col.name === currentConfigColumn)?.label || currentConfigColumn
            : (configDialogType === FIELD_TYPE.DATE ? MAPPING_UI_TEXT.DATE_FIELD : configDialogType === FIELD_TYPE.GENDER ? MAPPING_UI_TEXT.GENDER_FIELD : MAPPING_UI_TEXT.NUMBER_FIELD)
        }
        sourceColumn={
          currentConfigColumn
            ? (direction === DIRECTION.INBOUND ? mappings[currentConfigColumn] || "" : Object.keys(mappings).find(src => mappings[src] === currentConfigColumn) || "")
            : ""
        }
        initialConfig={currentConfigColumn ? columnConfigs[currentConfigColumn]?.[configDialogType] : undefined}
        sampleData={
          (() => {
            if (!currentConfigColumn) return [];
            const mappedSrc = direction === DIRECTION.INBOUND
              ? mappings[currentConfigColumn]
              : Object.keys(mappings).find(src => mappings[src] === currentConfigColumn);

            if (mappedSrc) {
              const colIndex = sourceColumns.indexOf(mappedSrc);
              // Validate column exists and limit sample size to prevent memory issues
              if (colIndex === -1) {
                return [];
              }
              // Limit to first 1000 rows for performance
              const sampleRows = fileData.slice(0, 1000);
              return sampleRows.map(row => row[colIndex]?.toString() || "").filter(Boolean);
            }
            return [];
          })()
        }
      />

      <CustomModal
        open={clearConfirmOpen}
        handleClose={() => setClearConfirmOpen(false)}
        heading={MAPPING_UI_TEXT.CLEAR_MAPPING_HEADING}
        buttons={[
          {
            label: MAPPING_UI_TEXT.NO_CANCEL,
            onClick: () => setClearConfirmOpen(false),
            variant: "secondary",
          },
          {
            label: MAPPING_UI_TEXT.YES_CLEAR,
            onClick: confirmClearAll,
            variant: "primary",
          },
        ]}
      >
        <ConfirmDialogContent>
          <Typography variant="body1" color="textPrimary">
            {MAPPING_MESSAGES.CLEAR_ALL_CONFIRM}
          </Typography>
        </ConfirmDialogContent>
      </CustomModal>
    </DragDropContext >
  );
};

export default ColumnMappingComponent;
