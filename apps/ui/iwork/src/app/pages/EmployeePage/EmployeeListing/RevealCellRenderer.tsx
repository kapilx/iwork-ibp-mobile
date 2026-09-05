import { useState } from "react";
import { ICellRendererParams } from "ag-grid-community";
import {
  CircularProgress,
  IconButton,
  Tooltip,
  styled,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material";
import { apiRequest, endPoints, formatDate } from "@ui/ui-lib";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RevealMeta {
  table: string;
  field: string;
  id: number;
}

// ─── Styled helpers ───────────────────────────────────────────────────────────

const CellWrapper = styled("div")({
  display: "flex",
  alignItems: "center",
  gap: 4,
  width: "100%",
  overflow: "hidden",
});

const ValueSpan = styled("span")({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  flex: 1,
});

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * AG Grid cell renderer for masked PII fields (emailId, mobile, etc.).
 *
 * - Renders the masked value returned by the backend alongside an eye icon.
 * - On click, calls POST /reveal with the `{field}_reveal` metadata injected
 *   by the ResponseMaskingInterceptor.
 * - Toggles back to masked on a second click.
 * - Shows a spinner while the reveal request is in flight.
 *
 * Usage in tableConfig:
 *   cellRenderer: RevealCellRenderer
 */
const RevealCellRenderer = (params: ICellRendererParams) => {
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const field = params.colDef?.field as string;
  const maskedValue: string = params.value ?? "—";

  // The interceptor injects `{field}_reveal` alongside the masked value.
  const revealMeta: RevealMeta | undefined = params.data?.[`${field}_reveal`];

  // The masked value (e.g. "****-**-**") is not a parseable date, so only the
  // real, revealed value is ever passed through date formatting.
  const isDateField = (params as any).isDate === true;
  const isRevealed = revealedValue !== null;
  const displayValue = isRevealed
    ? isDateField
      ? formatDate(revealedValue) ?? revealedValue
      : revealedValue
    : maskedValue;

  const handleToggle = async () => {
    // Toggle off — go back to masked
    if (isRevealed) {
      setRevealedValue(null);
      return;
    }

    if (!revealMeta) return;

    setLoading(true);
    try {
      const response = await apiRequest(endPoints.revealField, {
        method: "POST",
        data: {
          table: revealMeta.table,
          field: revealMeta.field,
          id: revealMeta.id,
        },
      });
      setRevealedValue(response?.value ?? maskedValue);
    } catch {
      // Silently fall back to masked value on error
    } finally {
      setLoading(false);
    }
  };

  return (
    <CellWrapper>
      <ValueSpan title={displayValue}>{displayValue}</ValueSpan>

      {revealMeta && (
        <>
          {loading ? (
            <CircularProgress size={14} sx={{ flexShrink: 0 }} />
          ) : (
            <Tooltip title={isRevealed ? "Hide" : "Reveal"} placement="top">
              <IconButton
                size="small"
                onClick={handleToggle}
                sx={{ padding: "2px", flexShrink: 0 }}
                aria-label={isRevealed ? `Hide ${field}` : `Reveal ${field}`}
              >
                {isRevealed ? (
                  <VisibilityOffIcon sx={{ fontSize: 15 }} />
                ) : (
                  <VisibilityIcon sx={{ fontSize: 15 }} />
                )}
              </IconButton>
            </Tooltip>
          )}
        </>
      )}
    </CellWrapper>
  );
};

export default RevealCellRenderer;
