import { useEffect, useMemo, useRef, useState } from "react";
import { TextField, Typography, Box, FormControl, InputAdornment } from "@mui/material";
import { ControlledField } from "../utils";
import { FieldComponentProps } from "../types";
import { UseFormSetValue, UseFormWatch } from "react-hook-form";
import {
  ExpandIconBox,
  NoDataText,
  SpacerBox,
  TreeAutocompleteStyles,
  TreeConnectorLine,
  TreeCountBadge,
  TreeOptionRow,
  TreePopperComponent,
  TreeSelectIconAvatar,
} from "./styles";
import { findMatchingPaths, getSessionStorageData } from "@ui/ui-lib/utils/index";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import useApi from "@ui/ui-lib/hooks/useApi";
import { NO_DATA_FOUND } from "../../../constants";

export interface RcTreeNode {
  title: string;
  key: string;
  children?: RcTreeNode[];
}

interface VisibleOption {
  key: string;
  title: string;
  depth: number;
  childrenCount: number;
  isMatch: boolean;
}

interface TreeSelectProps extends FieldComponentProps {
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  trigger?: (name?: string | string[]) => Promise<boolean>;
  onActionMap?: Record<string, (watchData: any) => void>;
  onChangeValue?: (val: { value: string; label: string }) => void;
  controlledSearchInput?: boolean;
}

const TreeSelect = ({
  field,
  control,
  watch,
  setValue,
  trigger,
  onActionMap,
  onChangeValue,
  enableSmartSearch,
  controlledSearchInput = true,
}: TreeSelectProps) => {
  const [treeData, setTreeData] = useState<RcTreeNode[]>([]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  // searchTerm also holds the selected option's label so it can be shown as
  // the input's display text. That alone must not be treated as an active
  // filter query — otherwise getVisibleOptions falls back to matching-path
  // visibility and ignores expandedKeys, so the +/- expand/collapse toggle
  // has no effect once a value is selected. Only actual typing sets this.
  const [isSearchActive, setIsSearchActive] = useState(false);
  const { apiDependencies } = field;
  const { doFetch, data: response, error } = useApi();
  const pendingScrollRestore = useRef<{ el: HTMLElement; top: number } | null>(
    null
  );
  const pendingScrollToKey = useRef<string | null>(null);
  // Caches the last `selected` object returned below, keyed by its `.key`.
  // MUI's Autocomplete treats any new `value` object reference as a fresh
  // selection and (when controlledSearchInput=false leaves its inputValue
  // uncontrolled) resyncs the visible text to the option's label — so if
  // `selected` were a fresh object every render, typing/backspacing over an
  // already-selected value would get visibly reverted on every keystroke.
  const selectedRef = useRef<VisibleOption | null>(null);
  const autocompleteId = `${field.name}-tree-select`;
  const listboxId = `${autocompleteId}-listbox`;

  // MUI's Autocomplete resets the listbox scroll to the top whenever the
  // option count changes (its highlighted-index sync has no selected value
  // to anchor to). Re-assert the pre-click scroll position (or, on open,
  // center the already-selected row) across a few animation frames so it
  // wins regardless of exactly when MUI's own reset (effect-driven or
  // rAF-scheduled) happens to land.
  useEffect(() => {
    const pendingRestore = pendingScrollRestore.current;
    const pendingKey = pendingScrollToKey.current;
    if (!pendingRestore && !pendingKey) return;
    pendingScrollRestore.current = null;
    pendingScrollToKey.current = null;

    let framesLeft = 4;
    let rafId: number;
    const reassert = () => {
      if (pendingRestore) {
        pendingRestore.el.scrollTop = pendingRestore.top;
      } else if (pendingKey) {
        const listboxEl = document.getElementById(listboxId);
        const rowEl = listboxEl
          ? Array.from(
              listboxEl.querySelectorAll<HTMLElement>("[data-option-key]")
            ).find((el) => el.getAttribute("data-option-key") === pendingKey)
          : null;
        if (listboxEl && rowEl) {
          // getBoundingClientRect (rather than offsetTop) so this doesn't
          // depend on the listbox being rowEl's offsetParent.
          const listboxRect = listboxEl.getBoundingClientRect();
          const rowRect = rowEl.getBoundingClientRect();
          const rowTopWithinListbox =
            rowRect.top - listboxRect.top + listboxEl.scrollTop;
          listboxEl.scrollTop =
            rowTopWithinListbox -
            listboxEl.clientHeight / 2 +
            rowRect.height / 2;
        }
      }
      framesLeft -= 1;
      if (framesLeft > 0) {
        rafId = requestAnimationFrame(reassert);
      }
    };
    reassert();

    return () => cancelAnimationFrame(rafId);
  }, [expandedKeys]);

  const userData = getSessionStorageData("user");

  // Fetch and set tree data
  useEffect(() => {
    if (response?.data && apiDependencies?.utilityFunction) {
      const tree = apiDependencies.utilityFunction(response.data) || [];
      setTreeData(tree);
      setExpandedKeys(new Set(tree.map((node) => node.key)));
    }
  }, [response, error, apiDependencies]);

  useEffect(() => {
    const { userId } = userData;
    if (apiDependencies?.endPoint) {
      doFetch(apiDependencies.endPoint(userId));
    }

    // Set initial label from form value if exists
    const currentVal = watch(field.name);
    if (typeof currentVal === "object" && currentVal?.label) {
      setSearchTerm(currentVal.label);
    }
  }, []);

  const currValue = watch(field.name);
  const valueKey =
    typeof currValue === "object" && currValue !== null
      ? currValue.value
      : currValue;
  const isDisabled = Boolean(field.componentProps?.disabled);

  useEffect(() => {
    setIsSearchActive(false);
    if (currValue === null || currValue === undefined) {
      setSearchTerm("");
    } else if (typeof currValue === "object" && currValue?.label) {
      setSearchTerm(currValue.label);
    } else {
      // currValue is a bare key (no {value, label} shape) — resolve its
      // display name from the tree instead of showing the raw id, since
      // that raw id would otherwise flow into getVisibleOptions as an
      // active search filter and hide the very node it should be showing.
      const node = findNodeByKey(treeData, currValue as string);
      setSearchTerm(node ? node.title : "");
    }
  }, [currValue, treeData]);

  // Build visible tree paths based on search/expansion
  const getVisibleOptions = (): VisibleOption[] => {
    // Only an actively-typed query should filter/auto-expand the tree — once
    // a value is selected, searchTerm just mirrors its label for display and
    // must not be treated as a filter (see isSearchActive above).
    const activeSearchTerm = isSearchActive ? searchTerm : "";
    const visible: VisibleOption[] = [];
    const matchingPaths = activeSearchTerm
      ? findMatchingPaths(activeSearchTerm, treeData)
      : new Set<string>();
    const addNodes = (nodes: RcTreeNode[], depth: number = 0): void => {
      for (const node of nodes) {
        const match = activeSearchTerm && matchingPaths.has(node.key);
        const show = !activeSearchTerm || match;
        const isMatch = Boolean(
          activeSearchTerm &&
            node.title.toLowerCase().includes(activeSearchTerm.toLowerCase())
        );

        if (show) {
          visible.push({
            key: node.key,
            title: node.title,
            depth,
            childrenCount: node.children?.length || 0,
            isMatch,
          });

          const showChildren =
            node.children?.length &&
            ((!activeSearchTerm && expandedKeys.has(node.key)) ||
              (activeSearchTerm && match));

          if (showChildren) {
            addNodes(node.children, depth + 1);
          }
        }
      }
    };

    addNodes(treeData);
    return visible;
  };

  const visibleOptions = useMemo(
    () => getVisibleOptions(),
    [treeData, expandedKeys, searchTerm, isSearchActive]
  );

  const handleFilterOptions = (
    options: VisibleOption[],
    _state: { inputValue: string }
  ) => {
    // Do NOT sync searchTerm from state.inputValue here. MUI's Autocomplete
    // deliberately reports an empty inputValue to filterOptions right after
    // opening when the field's text still equals the selected option's label
    // (so the full option list shows instead of just the matched one) — that
    // is not the user clearing the field. Real typing is already captured
    // via onInputChange's "input" reason; syncing here as well previously
    // blanked the displayed value the instant the dropdown was opened.

    // options already reflects the search term — getVisibleOptions keeps the
    // matched employee's ancestor chain (their reporting line) alongside the
    // match. Re-filtering by title here would strip those ancestors back out.
    return options;
  };

  const handleRenderInput = (
    params: any,
    error: boolean,
    helperText: string,
    currentLabel: string
  ) => (
    <TextField
      {...params}
      variant="outlined"
      error={error}
      helperText={helperText}
      placeholder="Select employee"
      onBlur={(event: React.FocusEvent<HTMLInputElement>) => {
        params.onBlur?.(event);
        // Closing the dropdown without picking an option (clicking away,
        // Escape, Tab) should drop any in-progress typed search text and
        // show the actual current selection again — otherwise the field is
        // left displaying a filter query instead of the real value. This
        // also resets our own filtering state so reopening the dropdown
        // later starts from the full tree, not the stale typed term.
        setSearchTerm(currentLabel);
        setIsSearchActive(false);
      }}
      InputProps={{
        ...params.InputProps,
        startAdornment: (
          <InputAdornment position="start">
            <TreeSelectIconAvatar>
              <PersonOutlineIcon fontSize="small" />
            </TreeSelectIconAvatar>
          </InputAdornment>
        ),
      }}
    />
  );

  const handleRenderOption = (props, option: VisibleOption) => {
    const isParent = option.childrenCount > 0;

    const toggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();

      const listboxEl = (e.currentTarget as HTMLElement).closest(
        ".MuiAutocomplete-listbox"
      ) as HTMLElement | null;
      if (listboxEl) {
        pendingScrollRestore.current = { el: listboxEl, top: listboxEl.scrollTop };
      }

      setExpandedKeys((prev) => {
        const next = new Set(prev);
        next.has(option.key) ? next.delete(option.key) : next.add(option.key);
        return next;
      });
    };

    return (
      <TreeOptionRow
        {...props}
        key={option.key}
        data-option-key={option.key}
        isMatch={option.isMatch || option.key === valueKey}
        style={{ paddingLeft: option.depth * 16 }}
      >
        {Array.from({ length: option.depth }, (_, i) => i + 1).map((level) => (
          // One segment per ancestor level, each spanning this row's full
          // height — stacked across sibling rows this keeps every ancestor's
          // guide line continuous, even when a deeper node is expanded.
          <TreeConnectorLine key={level} style={{ left: level * 16 - 12 }} />
        ))}
        {isParent ? (
          <ExpandIconBox onClick={toggleExpand}>
            {expandedKeys.has(option.key) ? "−" : "+"}
          </ExpandIconBox>
        ) : (
          <SpacerBox />
        )}
        <Box component="span" sx={{ lineHeight: 1.5, flex: 1 }}>
          {option.title}
        </Box>
        {isParent && <TreeCountBadge>{option.childrenCount}</TreeCountBadge>}
      </TreeOptionRow>
    );
  };

  const handleChange = (
    onChange: (value: string | { value: string; label: string } | null) => void,
    newValue: VisibleOption | null
  ) => {
    const selectedKey = newValue?.key || "";
    const valueToSet = newValue
      ? enableSmartSearch
        ? { value: selectedKey, label: newValue.title }
        : selectedKey
      : null;

    onChange(valueToSet);
    setValue(field.name, valueToSet as any);
    trigger?.(field.name);

    setIsSearchActive(false);
    if (newValue) {
      onChangeValue?.({ value: selectedKey, label: newValue.title });
      setSearchTerm(newValue.title);
    } else {
      setSearchTerm("");
    }
    if (apiDependencies?.clearFieldsOnChange?.length) {
      apiDependencies.clearFieldsOnChange.forEach((fieldName) => {
        setValue(fieldName, null);
      });
    }

    if (field?.invokeFunction && typeof field.invokeFunction === "string") {
      const action = onActionMap?.[field.invokeFunction];
      if (typeof action === "function") {
        action(watch());
      }
    }
  };

  const findNodeByKey = (
    nodes: RcTreeNode[],
    key: string
  ): RcTreeNode | null => {
    for (const node of nodes) {
      if (node.key === key) return node;
      if (node.children?.length) {
        const found = findNodeByKey(node.children, key);
        if (found) return found;
      }
    }
    return null;
  };

  const findAncestorKeys = (
    nodes: RcTreeNode[],
    targetKey: string,
    ancestors: string[] = []
  ): string[] | null => {
    for (const node of nodes) {
      if (node.key === targetKey) return ancestors;
      if (node.children?.length) {
        const found = findAncestorKeys(node.children, targetKey, [
          ...ancestors,
          node.key,
        ]);
        if (found) return found;
      }
    }
    return null;
  };

  const handleOpen = (valueKey: string | undefined) => {
    if (!valueKey) return;
    const ancestorKeys = findAncestorKeys(treeData, valueKey) || [];
    pendingScrollToKey.current = valueKey;
    // Always create a fresh Set (even with no new ancestors) so the shared
    // scroll effect below re-fires on every open, not just when the tree's
    // expansion actually changes.
    setExpandedKeys((prev) => new Set([...prev, ...ancestorKeys]));
  };

  return (
    <ControlledField
      field={field}
      control={control}
      render={(sharedProps) => {
        const { onChange, error, helperText } = sharedProps;

        const selected = useMemo(() => {
          const computeNext = () => {
            if (!valueKey) return null;
            const match = visibleOptions.find((opt) => opt.key === valueKey);
            if (match) return match;
            const fallback = findNodeByKey(treeData, valueKey);

            if (fallback) {
              return {
                key: fallback.key,
                title: fallback.title,
                depth: 0,
                childrenCount: fallback.children?.length || 0,
              };
            }

            if (
              typeof currValue === "object" &&
              currValue !== null &&
              currValue.label
            ) {
              return {
                key: currValue.value,
                title: currValue.label,
                depth: 0,
                childrenCount: 0,
              };
            }

            return null;
          };

          const next = computeNext();
          // Reuse the previous object when the selected key hasn't actually
          // changed (see selectedRef above) — visibleOptions recomputes on
          // every keystroke, which would otherwise hand Autocomplete a new
          // `value` reference on every keystroke even mid-typing.
          if (next && selectedRef.current && next.key === selectedRef.current.key) {
            return selectedRef.current;
          }
          selectedRef.current = next;
          return next;
        }, [valueKey, visibleOptions, treeData, currValue]);

        return (
          <>
            <Typography
              variant="body2"
              id={`${field.name}-label`}
              color={isDisabled ? "text.disabled" : "#1E2861B3"}
            >
              {field.rules?.required ? `${field.label} *` : field.label}
            </Typography>
            <FormControl fullWidth error={Boolean(error)}>
              <TreeAutocompleteStyles
                id={autocompleteId}
                disabled={isDisabled}
                value={selected}
                options={visibleOptions}
                getOptionLabel={(option: VisibleOption) => option.title}
                PopperComponent={TreePopperComponent}
                onOpen={() => handleOpen(valueKey)}
                onClose={(_event, reason) => {
                  if (reason === "selectOption") return;
                  // Closing the dropdown without picking a result (e.g. the
                  // toggle arrow, or Escape) never blurs the input — MUI's
                  // own onMouseDown handler on non-input parts of the combobox
                  // explicitly prevents that so toggling doesn't kick the user
                  // out of the field. So neither MUI's built-in reset-on-blur
                  // nor our onBlur handler below ever fires for this path.
                  // Force the same resync here: dropping the cached `selected`
                  // reference makes the next render hand Autocomplete a fresh
                  // `value` object, which it treats as a value change and uses
                  // to resync its displayed text to the actual selection.
                  selectedRef.current = null;
                  setSearchTerm(selected?.title ?? "");
                  setIsSearchActive(false);
                }}
                onChange={(_, newValue) => handleChange(onChange, newValue)}
                filterOptions={handleFilterOptions}
                {...(controlledSearchInput ? { inputValue: searchTerm } : {})}
                onInputChange={(_, value, reason) => {
                  if (reason === "input") {
                    if (value === "" && valueKey) {
                      // Erasing the text back to empty (character-by-character
                      // backspace, or select-all + delete) reads as "clear the
                      // selection" — same as clicking the X button — so the
                      // underlying form value doesn't linger selected while the
                      // input looks empty. handleChange resets searchTerm and
                      // isSearchActive too, so no need to set them here.
                      handleChange(onChange, null);
                    } else {
                      setSearchTerm(value);
                      setIsSearchActive(true);
                    }
                  }
                }}
                renderInput={(params) =>
                  handleRenderInput(
                    params,
                    Boolean(error),
                    helperText,
                    selected?.title ?? ""
                  )
                }
                renderOption={handleRenderOption}
                isOptionEqualToValue={(opt, val) => opt.key === val.key}
                clearOnBlur={false}
                fullWidth
                noOptionsText={<NoDataText>{NO_DATA_FOUND}</NoDataText>}
              />
            </FormControl>
          </>
        );
      }}
    />
  );
};

export default TreeSelect;
