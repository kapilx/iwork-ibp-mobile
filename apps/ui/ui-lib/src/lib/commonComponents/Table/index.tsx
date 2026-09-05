import {
  Button,
  Drawer,
  CustomModal,
  Pagination,
  PaginationContainer,
  ServerSideGrid,
  ServerSideGridStyledFormControl,
  StyledBox,
  StyledSelect,
  selectHasPermission,
  FeatureKey,
  formatNumberByLocalization,
  updateUserDefaultConfig,
  buildColumnSettingsPayload,
  SAVE_VIEW,
  setToastMessage,
  useRowSelection,
  RowSelectionChangeArgs,
  QuickFilterToolbar,
  QuickFilterToolbarConfig,
  AppliedFiltersBar,
} from "@ui/ui-lib";
import RefreshIcon from "../../../lib/assets/svgs/refresh-icon.svg";
import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Fade, Menu, MenuItem, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import { useDispatch, useSelector } from "react-redux";
import {
  TableContainer,
  HeaderContainer,
  ActionButtonsContainer,
  SubTitle,
  // NEW: summary styles
  SelectionSummaryContainer,
  SelectionSummaryText,
  SelectionSummaryActions,
  RefreshButtonContainer,
} from "./styles";
import {
  CellClickedEvent,
  CellEditingStartedEvent,
  CellEditingStoppedEvent,
  CellValueChangedEvent,
  ColDef,
} from "ag-grid-community";
import { AgGridReactProps } from "ag-grid-react";
import DraggableColumnList from "./TableSettings";
import { theme } from "@ui/ui-lib/styles/Theme";
import { reorderColumnsByDesiredConfig } from "@ui/ui-lib/utils/reOrderColumnsOnDesiredConfig";
import BulkEdit from "../BulkEdit";
import {
  RefreshContentContainer,
  RefreshControls,
  RefreshSpinner,
  RefreshStatusText,
} from "../EndorsementDocument/styles";

type ColumnId = string;

export type EditableColumnDefinitionOverrides<TData = any> = Partial<
  Omit<
    ColDef<TData>,
    "field" | "colId" | "headerName" | "valueGetter" | "children"
  >
> & {
  editable?: ColDef<TData>["editable"];
};

export interface EditableColumnSaveResult<TData = any> {
  /**
   * Partial row data that should replace the current data for the edited row.
   * Useful when the server response contains computed fields that need to be refreshed.
   */
  updatedRowData?: Partial<TData>;
  /**
   * Updated value for the edited column. When omitted the grid keeps the user provided value.
   */
  value?: unknown;
  /**
   * Optional success message that will be surfaced to the user via toast notification.
   */
  message?: string;
}

export interface EditableColumnConfig<TData = any> {
  /**
   * Identifier for the column. This should match the `colId` or `field` configured in the grid column definition.
   */
  colId: ColumnId;
  /**
   * Optional column definition overrides to enable editing specific behaviour like custom editors.
   */
  colDefOverrides?: EditableColumnDefinitionOverrides<TData>;
  /**
   * Validation hook executed before persisting the updated value. Return a string to surface validation errors.
   */
  validate?: (
    newValue: unknown,
    event: CellValueChangedEvent<TData>
  ) => string | null | undefined;
  /**
   * Async handler responsible for persisting the edited value. Should resolve once the server update succeeds.
   */
  onSave: (
    event: CellValueChangedEvent<TData>
  ) => Promise<EditableColumnSaveResult<TData> | void>;
  /**
   * Optional callback executed when the edit session is cancelled without changing the value.
   */
  onCancel?: (event: CellEditingStoppedEvent<TData>) => void;
  /**
   * Optional callback executed when the edit session starts.
   */
  onStart?: (event: CellEditingStartedEvent<TData>) => void;
  /**
   * Fallback success message if the `onSave` handler does not provide one.
   */
  successMessage?: string;
  /**
   * Fallback error message used when the `onSave` handler rejects without a specific error string.
   */
  errorMessage?: string;
}

interface TableProps {
  columns: ColDef[];
  rowData: any[];
  summaryRowData?: any;
  totalRows: number;
  currentPage: number;
  loading: boolean;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  pageSizeOptions: number[];
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
  onCellClicked: (event: CellClickedEvent) => void;
  components?: AgGridReactProps["components"];
  primaryActionLabel?: string;
  // Receives the click event so callers can anchor a popover/menu to the button.
  // Backward-compatible: existing `() => void` handlers remain valid.
  onPrimaryActionClick?: (e?: React.MouseEvent<HTMLElement>) => void;
  primaryActionDisabled?: boolean;
  primaryActionPermission?: FeatureKey;
  primaryActionMenuItems?: Array<{
    label: string;
    onClick: () => void;
    disabled?: boolean;
  }>;
  setSort: React.Dispatch<
    React.SetStateAction<{ colId: string; sort: "asc" | "desc" }[]>
  >;
  title?: string;
  titleSuffix?: string;
  // Optional content rendered inside the table header row, between the title
  // and the action buttons (e.g. inline search + filter toolbar).
  headerSearchSlot?: React.ReactNode;
  // Opt-in built-in header toolbar (quick-search fields + a filter-drawer
  // button) — an alternative to hand-building headerSearchSlot. Ignored when
  // headerSearchSlot is also provided.
  quickFilters?: QuickFilterToolbarConfig;
  getRowHeight?: (params: any) => number;
  height?: number;
  secondaryActionLabel?: string;
  onSecondaryActionClick?: () => void;
  // Render the secondary action to the right of the primary action instead of
  // its default position (left of it). Defaults to false to preserve existing
  // toolbars.
  secondaryActionRight?: boolean;
  secondaryActionPermission?: FeatureKey;
  // A third toolbar action, rendered just before the primary action button.
  // Needed on pages whose primary slot is already a CRUD action (e.g. "Create
  // SO"), so an unrelated action like "Generate Report" needs its own slot
  // rather than displacing primary/secondary.
  tertiaryActionLabel?: string;
  onTertiaryActionClick?: () => void;
  tertiaryActionDisabled?: boolean;
  tertiaryActionPermission?: FeatureKey;
  domLayout?: "normal" | "autoHeight";
  subTitle?: string;
  displaySettingsButton?: boolean;
  freezeLastRow?: boolean;
  setColumnOrder?: React.Dispatch<React.SetStateAction<any[]>>;
  columnOrder?: any[];
  entityKey?: string;
  selectedFilterValues?: any;
  enableSaveView?: boolean;
  editableColumnsConfig?: EditableColumnConfig[];

  // NEW: selection API (optional)
  enableRowSelection?: boolean;
  rowSelectionIdKey?: string;
  onRowSelectionChange?: (
    selection: RowSelectionChangeArgs<string | number>
  ) => void;
  rowSelectionLimit?: number;
  selectedFilterValuesAfterRun?: Record<string, any>;
  refetch?: () => Promise<unknown> | void;
  selectionApiRef?: MutableRefObject<{ clearSelection: () => void } | null>;
  showLoader?: boolean;
  emptyDataMessage?: string;
  showRefreshButton?: boolean;
  showSelectAllEntriesCta?: boolean;
  getRowClass?: (params: any) => string | string[] | undefined;
  // When true the pagination bar is not rendered (e.g. tables that show every row)
  hidePagination?: boolean;
}

const Table = ({
  columns,
  rowData,
  totalRows,
  currentPage,
  loading,
  setCurrentPage,
  pageSize,
  pageSizeOptions,
  setPageSize,
  onCellClicked,
  components,
  onPrimaryActionClick,
  primaryActionLabel,
  primaryActionDisabled,
  primaryActionPermission,
  primaryActionMenuItems,
  setSort,
  title,
  titleSuffix,
  headerSearchSlot,
  quickFilters,
  getRowHeight,
  height,
  secondaryActionLabel,
  onSecondaryActionClick,
  secondaryActionRight,
  secondaryActionPermission,
  tertiaryActionLabel,
  onTertiaryActionClick,
  tertiaryActionDisabled,
  tertiaryActionPermission,
  domLayout,
  subTitle,
  displaySettingsButton = true,
  freezeLastRow,
  summaryRowData,
  setColumnOrder,
  columnOrder,
  entityKey,
  selectedFilterValues,
  enableSaveView = true,
  editableColumnsConfig,

  // NEW: selection props
  enableRowSelection = false,
  rowSelectionIdKey = "id",
  onRowSelectionChange,
  rowSelectionLimit,
  selectedFilterValuesAfterRun,
  refetch,
  selectionApiRef,
  showLoader,
  emptyDataMessage,
  showRefreshButton = false,
  showSelectAllEntriesCta = true,
  getRowClass,
  hidePagination = false,
}: TableProps) => {
  const DEFAULT_UPDATE_ERROR_MESSAGE =
    "Unable to update value. Please try again.";
  const dispatch = useDispatch();

  // NEW: bulk edit toggle
  const [bulkEditOpen, setBulkEditOpen] = useState(false);

  const userDefaultTableSettings = useSelector(
    (state: any) =>
      state.user.userDefaultConfig?.tableDefaultSettings?.[entityKey]
  );
  const systemTableSettings = useSelector(
    (state: any) =>
      state.user.systemDefaultConfig?.tableDefaultSettings?.[entityKey]
  );
  const filterLoading = useSelector((state: any) => state.user.buttonLoading);

  const tableDesiredConfig = useMemo(() => {
    return userDefaultTableSettings ?? systemTableSettings ?? ([] as any[]);
  }, [userDefaultTableSettings, systemTableSettings, entityKey]);

  const reOrderColumns = React.useMemo(() => {
    return reorderColumnsByDesiredConfig(columns, tableDesiredConfig);
  }, [columns, tableDesiredConfig, entityKey]);

  useEffect(() => {
    if (setColumnOrder) setColumnOrder(reOrderColumns);
  }, [reOrderColumns, setColumnOrder, entityKey]);

  const [isTableSettingsOpen, setIsTableSettingsOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitModalMessage, setLimitModalMessage] = useState("");
  const [primaryMenuAnchor, setPrimaryMenuAnchor] =
    useState<HTMLElement | null>(null);

  const hasPrimaryActionPermission = useSelector((state: any) =>
    primaryActionPermission
      ? selectHasPermission(primaryActionPermission)(state)
      : true
  );
  const hasSecondaryActionPermission = useSelector((state: any) =>
    secondaryActionPermission
      ? selectHasPermission(secondaryActionPermission)(state)
      : true
  );
  const hasTertiaryActionPermission = useSelector((state: any) =>
    tertiaryActionPermission
      ? selectHasPermission(tertiaryActionPermission)(state)
      : true
  );

  // === existing editable-columns logic unchanged ===
  const editableColumnsMap = useMemo(() => {
    if (!editableColumnsConfig?.length) {
      return {} as Record<ColumnId, EditableColumnConfig>;
    }

    return editableColumnsConfig.reduce((acc, config) => {
      if (config?.colId) acc[config.colId] = config;
      return acc;
    }, {} as Record<ColumnId, EditableColumnConfig>);
  }, [editableColumnsConfig]);

  const hasEditableColumns = useMemo(
    () => Object.keys(editableColumnsMap).length > 0,
    [editableColumnsMap]
  );

  const sanitizeOverrides = useCallback(
    <T,>(overrides?: EditableColumnDefinitionOverrides<T>) => {
      if (!overrides) return undefined;
      const {
        field: _field,
        colId: _colId,
        headerName: _headerName,
        ...rest
      } = overrides as EditableColumnDefinitionOverrides<T> & {
        field?: string;
        colId?: string;
        headerName?: string;
      };
      return rest;
    },
    []
  );

  const resolveColumnId = useCallback((column: ColDef) => {
    if (column.colId) return column.colId;
    if (typeof column.field === "string") return column.field;
    return undefined;
  }, []);

  const resolveRowIdValue = useCallback(
    (data: Record<string, unknown> | undefined) => {
      if (!data) return undefined;
      const explicit = data[rowSelectionIdKey];
      if (typeof explicit === "string" || typeof explicit === "number") {
        return explicit;
      }
      const fallback = data.id;
      if (typeof fallback === "string" || typeof fallback === "number") {
        return fallback;
      }
      return undefined;
    },
    [rowSelectionIdKey]
  );

  // NEW: useRowSelection hook
  const selection = useRowSelection({
    enableRowSelection,
    rowSelectionIdKey,
    rowData,
    totalRows,
    onRowSelectionChange,
  });

  useEffect(() => {
    if (!selectionApiRef) return;

    selectionApiRef.current = {
      clearSelection: selection.handleClearSelection,
    };

    return () => {
      selectionApiRef.current = null;
    };
  }, [selectionApiRef, selection.handleClearSelection]);

  // inject selection checkbox column (only if enabled)
  const preparedColumns = useMemo(() => {
    const base =
      columnOrder && columnOrder.length > 0
        ? columnOrder.map(({ disableSort, sortable, ...rest }) => ({
            ...rest,
            sortable: disableSort ? false : sortable ?? true,
          }))
        : // Tables passing `columns` (no `columnOrder`) must still honor the
          // `disableSort` flag — otherwise it leaks to ag-grid as an unknown
          // key and the column stays sortable (unSortIcon shows on hover).
          // Strip it and force sortable:false only when set; leave every other
          // column's own `sortable` untouched so non-disabled columns are
          // unaffected.
          columns.map((col: any) => {
            const { disableSort, ...rest } = col;
            return disableSort ? { ...rest, sortable: false } : rest;
          });

    const withOverrides = base.map((column) => {
      const columnId = resolveColumnId(column);
      const editableConfig =
        columnId !== undefined ? editableColumnsMap[columnId] : undefined;
      if (!editableConfig) return { ...column };
      const overrides = sanitizeOverrides(editableConfig.colDefOverrides);
      const hasEditableOverride =
        overrides &&
        Object.prototype.hasOwnProperty.call(overrides, "editable");
      return {
        ...column,
        ...overrides,
        editable: hasEditableOverride ? overrides?.editable : true,
      } as ColDef;
    });

    return selection.selectionColumn
      ? [selection.selectionColumn, ...withOverrides]
      : withOverrides;
  }, [
    columnOrder,
    columns,
    editableColumnsMap,
    resolveColumnId,
    sanitizeOverrides,
    selection.selectionColumn, // NEW
  ]);

  // Prevent selecting new rows once the bulk selection limit is reached
   const isRowSelectable = useCallback(
    (node: { data?: Record<string, unknown> }) => {
      if (!enableRowSelection || !rowSelectionLimit) return true;
      const rowId = resolveRowIdValue(node?.data);
      if (rowId === undefined) return true;
      if (selection.selectedCount < rowSelectionLimit) return true;
      return selection.selectedRowIds.some(
        (id) => String(id) === String(rowId)
      );
    },
    [
      enableRowSelection,
      resolveRowIdValue,
      rowSelectionLimit,
      selection.selectedCount,
      selection.selectedRowIds,
    ]
  );

  // Guard to avoid re-entrant selection events when we programmatically deselect rows
  const limitSelectionRef = useRef(false);

  // Enforce selection limit on header checkbox: only add up to remaining slots
  const handleSelectionChanged = useCallback(
    (event: CellClickedEvent & { api: any }) => {
      if (
        enableRowSelection &&
        rowSelectionLimit &&
        event?.api &&
        !limitSelectionRef.current
      ) {
        const selectedRows = event.api.getSelectedRows?.() || [];
        const previousSelectedSet = new Set(
          selection.selectedRowIds.map((id) => String(id))
        );
        const newlySelected = selectedRows.filter(
          (row: Record<string, unknown>) => {
          const rowId = resolveRowIdValue(row);
          return rowId !== undefined && !previousSelectedSet.has(String(rowId));
          }
        );
        const remainingSlots = rowSelectionLimit - selection.selectedCount;

        if (newlySelected.length > remainingSlots) {
          const allowedNew = Math.max(remainingSlots, 0);
          const allowedNewIds = new Set<string>();

          newlySelected.forEach((row: Record<string, unknown>) => {
            if (allowedNewIds.size >= allowedNew) return;
            const rowId = resolveRowIdValue(row);
            if (rowId !== undefined) {
              allowedNewIds.add(String(rowId));
            }
          });

          limitSelectionRef.current = true;
          event.api.forEachNode((node: any) => {
            if (!node?.isSelected?.()) return;
            const nodeId = resolveRowIdValue(node.data);
            if (
              nodeId !== undefined &&
              !previousSelectedSet.has(String(nodeId)) &&
              !allowedNewIds.has(String(nodeId))
            ) {
              node.setSelected(false);
            }
          });
          setLimitModalMessage(
            `You can select up to ${rowSelectionLimit} items.`
          );
          setLimitModalOpen(true);
          return;
        }
      }

      if (limitSelectionRef.current) {
        limitSelectionRef.current = false;
      }
      selection.onSelectionChanged?.(event);
    },
    [
      enableRowSelection,
      resolveRowIdValue,
      rowSelectionLimit,
      selection.onSelectionChanged,
      selection.selectedRowIds,
    ]
  );

  // === existing editing handlers unchanged ===
  const editingCellRef = useRef<{
    columnId: ColumnId;
    rowId: string | null;
    initialValue: unknown;
  } | null>(null);

  const handleCellEditingStarted = useCallback(
    (event: CellEditingStartedEvent) => {
      const columnId = event.column?.getColId();
      const configKey =
        columnId ??
        (typeof event.colDef?.field === "string"
          ? event.colDef.field
          : undefined);
      if (!configKey) return;
      const editableConfig = editableColumnsMap[configKey];
      if (!editableConfig) return;
      editingCellRef.current = {
        columnId: configKey,
        rowId: event.node?.id ?? null,
        initialValue: event.value,
      };
      editableConfig.onStart?.(event);
    },
    [editableColumnsMap]
  );

  const updateCellValue = useCallback(
    (event: CellValueChangedEvent, value: unknown) => {
      const columnId = event.column?.getColId();
      const targetColumnId =
        columnId ??
        (typeof event.colDef?.field === "string"
          ? event.colDef.field
          : undefined);
      if (!targetColumnId) return;
      event.node?.setDataValue?.(targetColumnId, value);
      if (event.data && typeof targetColumnId === "string") {
        (event.data as Record<string, unknown>)[targetColumnId] = value;
      }
      event.api?.refreshCells?.({
        rowNodes: [event.node],
        columns: [targetColumnId],
      });
    },
    []
  );

  const handleCellValueChanged = useCallback(
    async (event: CellValueChangedEvent) => {
      const columnId = event.column?.getColId();
      const configKey =
        columnId ??
        (typeof event.colDef?.field === "string"
          ? event.colDef.field
          : undefined);
      if (!configKey) return;
      const editableConfig = editableColumnsMap[configKey];
      if (!editableConfig) return;
      editingCellRef.current = null;
      if (event.newValue === event.oldValue) return;

      const validationMessage = editableConfig.validate?.(
        event.newValue,
        event
      );
      if (validationMessage) {
        updateCellValue(event, event.oldValue);
        dispatch(setToastMessage(validationMessage));
        return;
      }

      try {
        const result = await editableConfig.onSave(event);
        if (result?.updatedRowData) {
          const updatedData = { ...event.data, ...result.updatedRowData };
          event.node?.setData?.(updatedData as any);
        }
        if (result && Object.prototype.hasOwnProperty.call(result, "value")) {
          updateCellValue(event, result.value);
        }
        const successMessage = result?.message ?? editableConfig.successMessage;
        if (successMessage) dispatch(setToastMessage(successMessage));
      } catch (error: unknown) {
        updateCellValue(event, event.oldValue);
        const derivedErrorMessage =
          (error as { message?: string })?.message ??
          editableConfig.errorMessage ??
          DEFAULT_UPDATE_ERROR_MESSAGE;
        if (derivedErrorMessage) dispatch(setToastMessage(derivedErrorMessage));
      }
    },
    [dispatch, editableColumnsMap, updateCellValue]
  );

  const handleCellEditingStopped = useCallback(
    (event: CellEditingStoppedEvent) => {
      const columnId = event.column?.getColId();
      const configKey =
        columnId ??
        (typeof event.colDef?.field === "string"
          ? event.colDef.field
          : undefined);
      if (!configKey) return;
      const editableConfig = editableColumnsMap[configKey];
      if (!editableConfig) return;
      if (editingCellRef.current) {
        editableConfig.onCancel?.(event);
        editingCellRef.current = null;
      }
    },
    [editableColumnsMap]
  );

  const handleCloseTableSettings = () => setIsTableSettingsOpen(false);

  const handlePageSizeChange = (pageSize: number) => {
    setPageSize(pageSize);
    setCurrentPage(1);
  };

  const handleSaveView = () => {
    const updateColPayload = buildColumnSettingsPayload(columnOrder);
    dispatch(
      updateUserDefaultConfig({
        entityKey,
        selectedFilterValues,
        columns: updateColPayload,
      })
    );
  };
  const [isRefreshing, setIsRefreshing] = useState(false);
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);

      // reset to first page (optional but recommended)
      setCurrentPage(1);

      // clear selection if enabled
      selection.handleClearSelection?.();

      // refetch table data
      await refetch?.();
    } finally {
      setIsRefreshing(false);
    }
  };

  const showSettingsButtons = displaySettingsButton && !selection.hasSelection;

  const secondaryActionButton =
    secondaryActionLabel && onSecondaryActionClick && hasSecondaryActionPermission ? (
      <Button
        onClick={onSecondaryActionClick}
        label={secondaryActionLabel}
        variantType="secondary"
        size="small"
        sizeType="small"
      />
    ) : null;

  return (
    <TableContainer>
      {title && (
        <HeaderContainer>
          <Typography variant="h1">
            {title} ({formatNumberByLocalization(totalRows)})
            {titleSuffix}
            <SubTitle>{subTitle}</SubTitle>
          </Typography>
          {headerSearchSlot ??
            (quickFilters && <QuickFilterToolbar {...quickFilters} />)}
          <ActionButtonsContainer>
            {showRefreshButton && (
              <RefreshButtonContainer>
                <Button
                  variantType="link"
                  label="Refresh"
                  onClick={handleRefresh}
                  size="small"
                />
                {isRefreshing && (
                  <RefreshSpinner src={RefreshIcon} alt="Refreshing" />
                )}
              </RefreshButtonContainer>
            )}
            {!secondaryActionRight && secondaryActionButton}

            {displaySettingsButton && (
              <>
                {showSettingsButtons ? (
                  <>
                    {enableSaveView && (
                      <Button
                        loading={filterLoading}
                        onClick={handleSaveView}
                        variantType="primary"
                        label={SAVE_VIEW}
                        size="small"
                        sizeType="small"
                      />
                    )}
                    <Button
                      onClick={() => setIsTableSettingsOpen(true)}
                      variantType="secondary"
                      label="Table settings"
                      size="small"
                      sizeType="small"
                    />
                  </>
                ) : (
                  // NEW: Bulk edit when selection exists
                  <Button
                    onClick={() => setBulkEditOpen(true)}
                    variantType="secondary"
                    label="Bulk Edit"
                    size="small"
                    sizeType="small"
                  />
                )}
              </>
            )}

            {tertiaryActionLabel && onTertiaryActionClick && hasTertiaryActionPermission && (
              <Button
                onClick={onTertiaryActionClick}
                label={tertiaryActionLabel}
                variantType="primary"
                disabled={tertiaryActionDisabled}
                size="small"
                sizeType="small"
              />
            )}

            {primaryActionLabel &&
              hasPrimaryActionPermission &&
              !selection.hasSelection &&
              (primaryActionMenuItems && primaryActionMenuItems.length > 0 ? (
                <>
                  <Button
                    onClick={(e) => setPrimaryMenuAnchor(e.currentTarget)}
                    label={primaryActionLabel}
                    variantType="primary"
                    disabled={primaryActionDisabled}
                    startIcon={<AddIcon />}
                    endIcon={<KeyboardArrowDownIcon />}
                    aria-haspopup="menu"
                    aria-expanded={Boolean(primaryMenuAnchor)}
                    sx={{
                      minWidth: 100,
                      "& .MuiButton-startIcon": { marginRight: "4px" },
                      "& .MuiButton-endIcon": { marginLeft: "auto" },
                    }}
                  />
                  <Menu
                    anchorEl={primaryMenuAnchor}
                    open={Boolean(primaryMenuAnchor)}
                    onClose={() => setPrimaryMenuAnchor(null)}
                    anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                    transformOrigin={{ vertical: "top", horizontal: "right" }}
                    slotProps={{
                      paper: {
                        sx: {
                          width: primaryMenuAnchor?.offsetWidth,
                          minWidth: primaryMenuAnchor?.offsetWidth,
                        },
                      },
                    }}
                  >
                    {primaryActionMenuItems.map((item) => (
                      <MenuItem
                        key={item.label}
                        disabled={item.disabled}
                        onClick={() => {
                          setPrimaryMenuAnchor(null);
                          item.onClick();
                        }}
                        sx={{ fontSize: 15 }}
                      >
                        {item.label}
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              ) : (
                onPrimaryActionClick && (
                  <Button
                    onClick={onPrimaryActionClick}
                    label={primaryActionLabel}
                    variantType="primary"
                    disabled={primaryActionDisabled}
                    size="small"
                    sizeType="small"
                  />
                )
              ))}

            {secondaryActionRight && secondaryActionButton}
          </ActionButtonsContainer>
        </HeaderContainer>
      )}

      {quickFilters?.appliedFilters && (
        <AppliedFiltersBar {...quickFilters.appliedFilters} />
      )}

      {/* NEW: selection summary */}
      {selection.hasSelection && selection.selectionSummaryMessage && (
        <SelectionSummaryContainer>
          <SelectionSummaryText variant="body2">
            {selection.selectionSummaryMessage}
          </SelectionSummaryText>
          <SelectionSummaryActions>
            {selection.isAllSelected && showSelectAllEntriesCta && (
              <Button
                variantType="link"
                onClick={selection.handleSelectCurrentPageOnly}
              >
                {/* kept identical wording */}
                Select only current page.
              </Button>
            )}
            {!selection.isAllSelected &&
              totalRows > 0 &&
              showSelectAllEntriesCta && (
              <Button
                variantType="link"
                onClick={selection.handleSelectAllEntries}
                disabled={selection.selectAllLoading}
              >
                Select all {formatNumberByLocalization(totalRows)} entries in
                the results.
              </Button>
            )}
            <Button variantType="link" onClick={selection.handleClearSelection}>
              Clear selection
            </Button>
          </SelectionSummaryActions>
        </SelectionSummaryContainer>
      )}

      <ServerSideGrid
        key="contact-grid"
        rows={rowData}
        pinnedBottomRowData={
          freezeLastRow && summaryRowData ? summaryRowData : undefined
        }
        totalRecords={totalRows}
        currentPage={currentPage}
        loading={loading}
        onPageChange={setCurrentPage}
        columns={preparedColumns as ColDef[]}
        pageSize={pageSize}
        pageSizeOptions={pageSizeOptions}
        onPageSizeChange={handlePageSizeChange}
        onCellClicked={onCellClicked}
        components={components ?? {}}
        setSort={setSort}
        getRowHeight={getRowHeight}
        height={height}
        domLayout={domLayout}
        onCellEditingStarted={
          hasEditableColumns ? handleCellEditingStarted : undefined
        }
        onCellEditingStopped={
          hasEditableColumns ? handleCellEditingStopped : undefined
        }
        onCellValueChanged={
          hasEditableColumns ? handleCellValueChanged : undefined
        }
        stopEditingWhenCellsLoseFocus={hasEditableColumns ? true : undefined}
        // NEW: selection wiring (no behavior change to non-selection tables)
        rowSelection={enableRowSelection ? "multiple" : undefined}
        suppressRowClickSelection={enableRowSelection ? true : undefined}
        rowMultiSelectWithClick={enableRowSelection ? true : undefined}
        onSelectionChanged={handleSelectionChanged}
        getRowId={enableRowSelection ? selection.handleGetRowId : undefined}
        onGridReady={selection.onGridReady}
        getRowClass={getRowClass}
        isRowSelectable={
          enableRowSelection && rowSelectionLimit ? isRowSelectable : undefined
        }
        showLoader={showLoader}
        emptyDataMessage={emptyDataMessage}
      />
      <CustomModal
        open={limitModalOpen}
        handleClose={() => setLimitModalOpen(false)}
        heading="Selection Limit Reached"
        buttons={[
          {
            label: "OK",
            variant: "primary",
            onClick: () => setLimitModalOpen(false),
          },
        ]}
        modalBoxStyles={{ width: "30%" }}
      >
        <div>{limitModalMessage}</div>
      </CustomModal>

      {!hidePagination && (
      <PaginationContainer>
        <ServerSideGridStyledFormControl
          variant="outlined"
          size="small"
          data-testid="pagination-entries-info"
        >
          <StyledBox>Showing </StyledBox>
          <StyledSelect
            value={pageSize}
            inputProps={{ "aria-label": "Page size" }}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            role="listbox"
            data-testid="page-size"
            MenuProps={{
              anchorOrigin: { vertical: "top", horizontal: "left" },
              transformOrigin: { vertical: "bottom", horizontal: "left" },
              PaperProps: { sx: { zIndex: theme.zIndex.header } },
              TransitionComponent: Fade,
            }}
          >
            {pageSizeOptions.map((size: number) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </StyledSelect>
          <StyledBox>of {totalRows} entries</StyledBox>
        </ServerSideGridStyledFormControl>

        <Pagination
          totalRecords={totalRows}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          data-testid={"pagination-pages-info"}
        />
      </PaginationContainer>
      )}

      {isTableSettingsOpen && setColumnOrder && (
        <Drawer
          open={isTableSettingsOpen}
          anchor="right"
          onClose={handleCloseTableSettings}
          title="Table settings"
        >
          <DraggableColumnList
            columns={columnOrder ?? []}
            setColumnOrder={setColumnOrder}
            closeSettings={handleCloseTableSettings}
          />
        </Drawer>
      )}
      {/* NEW: Bulk Edit drawer identical to your new version */}
      {bulkEditOpen && (
        <Drawer
          open={bulkEditOpen}
          anchor="right"
          onClose={() => setBulkEditOpen(false)}
          title="Bulk Edit"
          width="500px"
        >
          <BulkEdit
            onClose={() => setBulkEditOpen(false)}
            onSuccess={selection.handleClearSelection}
            defaultValues={selectedFilterValuesAfterRun}
            selectionState={{
              selectedAll: selection.isAllSelected,
              includedIds: selection.includedRowIds,
              excludedIds: selection.excludedRowIds,
              selectedCount: selection.selectedCount,
            }}
            entityKey={entityKey}
            refetch={refetch}
            totalRows={totalRows}
            pageSize={pageSize}
          />
        </Drawer>
      )}
    </TableContainer>
  );
};

export default React.memo(Table);