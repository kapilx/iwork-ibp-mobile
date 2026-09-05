// useRowSelection.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  GetRowIdParams,
  GridApi,
  GridReadyEvent,
  SelectionChangedEvent,
  ColDef,
} from "ag-grid-community";
import { formatNumberByLocalization } from "@ui/ui-lib";

export type SelectionScope = "none" | "page" | "partial" | "all";

export interface RowSelectionChangeArgs<IdType = string | number> {
  selectedRowIds: IdType[];
  includedRowIds: IdType[];
  excludedRowIds: IdType[];
  isAllSelected: boolean;
  selectedCount: number;
  selectionScope: SelectionScope;
}

export interface UseRowSelectionOptions {
  enableRowSelection?: boolean;
  rowSelectionIdKey?: string;
  rowData: any[];
  totalRows: number;
  onRowSelectionChange?: (
    selection: RowSelectionChangeArgs<string | number>
  ) => void;
}

export function useRowSelection({
  enableRowSelection = false,
  rowSelectionIdKey = "id",
  rowData,
  totalRows,
  onRowSelectionChange,
}: UseRowSelectionOptions) {
  const gridApiRef = useRef<GridApi | null>(null);
  const skipSelectionChangeRef = useRef(false);
  const [includedRowIds, setIncludedRowIds] = useState<Array<string | number>>(
    []
  );
  const [excludedRowIds, setExcludedRowIds] = useState<Array<string | number>>(
    []
  );
  const [isAllSelected, setIsAllSelected] = useState(false);
  const selectAllLoading = false;

  const toRowIdentifier = useCallback((value: unknown) => {
    if (typeof value === "string" || typeof value === "number") return value;
    return undefined;
  }, []);

  const getRowIdValue = useCallback(
    (data: Record<string, unknown> | undefined) => {
      if (!data) return undefined;
      const explicit = toRowIdentifier(data[rowSelectionIdKey]);
      if (explicit !== undefined) return explicit;
      const fallback = toRowIdentifier(data.id);
      if (fallback !== undefined) return fallback;
      return undefined;
    },
    [rowSelectionIdKey, toRowIdentifier]
  );

  const handleGetRowId = useCallback(
    (params: GetRowIdParams) => {
      const id = getRowIdValue(params.data as Record<string, unknown>);
      return id !== undefined ? String(id) : undefined;
    },
    [getRowIdValue]
  );

  const currentPageIds = useMemo(
    () =>
      rowData
        .map((row) => getRowIdValue(row as unknown as Record<string, unknown>))
        .filter((id): id is string | number => id !== undefined),
    [getRowIdValue, rowData]
  );

  const includedRowIdSet = useMemo(
    () => new Set(includedRowIds.map((id) => String(id))),
    [includedRowIds]
  );

  const selectionScope = useMemo<SelectionScope>(() => {
    if (!enableRowSelection) return "none";
    if (isAllSelected) return "all";
    if (includedRowIds.length === 0) return "none";
    if (
      currentPageIds.length > 0 &&
      currentPageIds.every((id) => includedRowIdSet.has(String(id)))
    ) {
      return "page";
    }
    return "partial";
  }, [
    enableRowSelection,
    isAllSelected,
    includedRowIds.length,
    currentPageIds,
    includedRowIdSet,
  ]);

  const syncSelectionToGrid = useCallback(() => {
    if (!enableRowSelection || !gridApiRef.current) return;
    skipSelectionChangeRef.current = true;
    const api = gridApiRef.current;

    api.deselectAll();

    if (isAllSelected) {
      api.selectAll();
      if (excludedRowIds.length > 0) {
        const excluded = new Set(excludedRowIds.map((id) => String(id)));
        api.forEachNode((node) => {
          const nodeId = getRowIdValue(node.data as Record<string, unknown>);
          if (nodeId !== undefined && excluded.has(String(nodeId))) {
            node.setSelected(false);
          }
        });
      }
    } else if (includedRowIds.length > 0) {
      const included = new Set(includedRowIds.map((id) => String(id)));
      api.forEachNode((node) => {
        const nodeId = getRowIdValue(node.data as Record<string, unknown>);
        if (nodeId !== undefined && included.has(String(nodeId))) {
          node.setSelected(true);
        }
      });
    }

    skipSelectionChangeRef.current = false;
  }, [
    enableRowSelection,
    excludedRowIds,
    getRowIdValue,
    includedRowIds,
    isAllSelected,
  ]);

  const handleGridReady = useCallback(
    (e: GridReadyEvent) => {
      gridApiRef.current = e.api;
      syncSelectionToGrid();
    },
    [syncSelectionToGrid]
  );

  // keep grid selection in sync with state
  useEffect(() => {
    syncSelectionToGrid();
  }, [rowData, syncSelectionToGrid]);

  const handleSelectionChanged = useCallback(
    (event: SelectionChangedEvent) => {
      if (!enableRowSelection || skipSelectionChangeRef.current) return;

      const currentPageSet = new Set(currentPageIds.map((id) => String(id)));
      const selectedRows = event.api
        .getSelectedRows()
        .map((row) => getRowIdValue(row as Record<string, unknown>))
        .filter((id): id is string | number => id !== undefined);

      const map = new Map<string, string | number>();
      selectedRows.forEach((id) => map.set(String(id), id));
      const uniqueIds = Array.from(map.values());
      const displayedCount = event.api.getDisplayedRowCount();

      if (displayedCount === 0) return;

      if (isAllSelected) {
        setExcludedRowIds((prev) => {
          const merged = new Map<string, string | number>();
          prev.forEach((id) => {
            if (!currentPageSet.has(String(id))) {
              merged.set(String(id), id);
            }
          });
          currentPageIds.forEach((id) => {
            const key = String(id);
            if (!map.has(key)) {
              merged.set(key, id);
            }
          });
          const result = Array.from(merged.values());
          if (
            prev.length === result.length &&
            prev.every((v, i) => String(v) === String(result[i]))
          ) {
            return prev;
          }
          return result;
        });
        return;
      }

      setIncludedRowIds((prev) => {
        const merged = new Map<string, string | number>();
        prev.forEach((id) => {
          if (!currentPageSet.has(String(id))) {
            merged.set(String(id), id);
          }
        });
        uniqueIds.forEach((id) => merged.set(String(id), id));
        const result = Array.from(merged.values());

        // Auto-mark as "All Selected" if every row in all pages is selected
        if (result.length >= totalRows) {
          setIsAllSelected(true);
        }

        if (
          prev.length === result.length &&
          prev.every((v, i) => String(v) === String(result[i]))
        ) {
          return prev;
        }
        return result;
      });
      setExcludedRowIds((prev) => (prev.length > 0 ? [] : prev));
    },
    [enableRowSelection, currentPageIds, getRowIdValue, isAllSelected]
  );

  const handleSelectAllEntries = useCallback(() => {
    if (!enableRowSelection) return;
    setIsAllSelected(true);
    setExcludedRowIds([]);
    setIncludedRowIds([]);
  }, [enableRowSelection]);

  const handleSelectCurrentPageOnly = useCallback(() => {
    if (!enableRowSelection) return;
    setIsAllSelected(false);
    setExcludedRowIds([]);
    setIncludedRowIds(currentPageIds);
  }, [enableRowSelection, currentPageIds]);

  const handleClearSelection = useCallback(() => {
    if (!enableRowSelection) return;
    setIsAllSelected(false);
    setIncludedRowIds([]);
    setExcludedRowIds([]);
  }, [enableRowSelection]);

  const selectedCount = useMemo(() => {
    if (!enableRowSelection) return 0;
    if (isAllSelected) {
      const remaining = totalRows - excludedRowIds.length;
      return remaining >= 0 ? remaining : 0;
    }
    return includedRowIds.length;
  }, [
    enableRowSelection,
    excludedRowIds.length,
    includedRowIds.length,
    isAllSelected,
    totalRows,
  ]);

  useEffect(() => {
    if (!enableRowSelection || !onRowSelectionChange) return;
    onRowSelectionChange({
      selectedRowIds: includedRowIds,
      includedRowIds,
      excludedRowIds,
      isAllSelected,
      selectedCount,
      selectionScope,
    });
  }, [
    enableRowSelection,
    onRowSelectionChange,
    includedRowIds,
    excludedRowIds,
    isAllSelected,
    selectedCount,
    selectionScope,
  ]);

  const hasSelection =
    enableRowSelection && (isAllSelected || includedRowIds.length > 0);

  const selectionSummaryMessage = useMemo(() => {
    const labelTotal = totalRows === 1 ? "entry" : "entries";
    const labelSelected = selectedCount === 1 ? "entry" : "entries";
    if (!hasSelection) return "";

    if (isAllSelected) {
      if (excludedRowIds.length === 0) {
        return `All ${formatNumberByLocalization(
          totalRows
        )} ${labelTotal} in the results are selected.`;
      }

      return `${formatNumberByLocalization(
        selectedCount
      )} of ${formatNumberByLocalization(
        totalRows
      )} ${labelTotal} in the results are selected.`;
    }

    const currentPageSelectedCount = currentPageIds.filter((id) =>
      includedRowIds.includes(id)
    ).length;
    const labelPage = currentPageSelectedCount === 1 ? "entry" : "entries";

    return `${formatNumberByLocalization(
      currentPageSelectedCount
    )} ${labelPage} on this page selected (${formatNumberByLocalization(
      selectedCount
    )} of ${formatNumberByLocalization(
      totalRows
    )} total ${labelTotal} selected)`;
  }, [
    hasSelection,
    isAllSelected,
    selectionScope,
    currentPageIds,
    includedRowIds,
    selectedCount,
    totalRows,
    excludedRowIds.length,
  ]);

  const selectionColumn: ColDef | null = enableRowSelection
    ? {
        colId: "__selection__",
        field: "__selection__",
        headerName: "",
        width: 56,
        maxWidth: 64,
        minWidth: 56,
        pinned: "left",
        sortable: false,
        filter: false,
        suppressMenu: true,
        checkboxSelection: true,
        headerCheckboxSelection: true,
        headerCheckboxSelectionFilteredOnly: true,
        resizable: false,
        suppressSizeToFit: true,
        lockPosition: true,
        suppressMovable: true,
        lockPinned: true,
        suppressNavigable: true,
        tooltipValueGetter: () => "",
      }
    : null;

  return {
    // state-ish
    hasSelection,
    isAllSelected,
    selectedRowIds: includedRowIds,
    includedRowIds,
    excludedRowIds,
    selectedCount,
    selectionScope,
    selectionSummaryMessage,
    selectAllLoading,

    // ids
    handleGetRowId,

    // ag-grid wiring
    onGridReady: handleGridReady,
    onSelectionChanged: enableRowSelection ? handleSelectionChanged : undefined,

    // actions
    handleSelectAllEntries,
    handleSelectCurrentPageOnly,
    handleClearSelection,

    // column helper
    selectionColumn,
  };
}
