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
import { apiRequest, endPoints } from "@ui/ui-lib";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RevealMeta {
  table: string;
  field: string;
  id: number;
}

interface CommunicationDetail {
  id: number;
  communicationType: string;
  communicationDetails: string;
  communicationDetails_reveal?: RevealMeta;
  isPrimary: boolean;
}

// ─── Styled helpers (same as RevealCellRenderer) ──────────────────────────────

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
 * AG Grid cell renderer for masked PII inside the contact's communicationDetails array.
 *
 * Unlike the employee RevealCellRenderer (where masked value + reveal meta sit at
 * the top level of the row object), contact PII is nested inside:
 *   row.communicationDetails[].communicationDetails        ← masked value
 *   row.communicationDetails[].communicationDetails_reveal ← reveal metadata
 *
 * Pass `communicationType` via cellRendererParams to select the right entry:
 *   cellRenderer: ContactRevealCellRenderer,
 *   cellRendererParams: { communicationType: 'email' }   // or 'phone'
 */
const ContactRevealCellRenderer = (params: ICellRendererParams) => {
  const [revealedValue, setRevealedValue] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const communicationType: string =
    params.colDef?.cellRendererParams?.communicationType ?? "";

  // Find the matching communication detail entry for this column type
  const commDetail: CommunicationDetail | undefined = (
    params.data?.communicationDetails ?? []
  ).find((item: CommunicationDetail) => item.communicationType === communicationType);

  const maskedValue = commDetail?.communicationDetails ?? "—";
  const revealMeta = commDetail?.communicationDetails_reveal;

  const isRevealed = revealedValue !== null;
  const displayValue = isRevealed ? revealedValue : maskedValue;

  const handleToggle = async () => {
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
            <Tooltip
              title={isRevealed ? "Hide" : "Reveal"}
              placement="top"
            >
              <IconButton
                size="small"
                onClick={handleToggle}
                sx={{ padding: "2px", flexShrink: 0 }}
                aria-label={
                  isRevealed
                    ? `Hide ${communicationType}`
                    : `Reveal ${communicationType}`
                }
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

export default ContactRevealCellRenderer;
