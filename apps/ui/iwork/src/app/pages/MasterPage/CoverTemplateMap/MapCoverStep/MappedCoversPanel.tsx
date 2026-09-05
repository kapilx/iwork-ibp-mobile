import { Box, IconButton, MenuItem, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { CommonSelect, DraggableList } from "@ui/ui-lib";
import { MappedCover, SelectOption } from "../types";
import { SHOW_UNTIL_ACTIVITY_OPTIONS } from "../coverFormConfig";
import { COVER_MASTER } from "../../../../constants";
import {
  DragHandleCell,
  MappedEmptyState,
  MappedRow,
  MappedScrollArea,
  MappedTableHeaderCell,
  MappedTableHeaderRow,
} from "../styles";

interface MappedCoversPanelProps {
  covers: MappedCover[];
  mandatoryOptions: SelectOption[];
  onChange: (refCoverId: number, patch: Partial<MappedCover>) => void;
  onRemove: (refCoverId: number) => void;
  onReorder: (covers: MappedCover[]) => void;
}

/**
 * Step 2 right pane: covers mapped to the selected policy type + org.
 * Order is set by drag-and-drop via the shared DraggableList (display sequence
 * is derived from position on submit); per-row mandatory is editable, with an
 * unmap action.
 */
const MappedCoversPanel = ({
  covers,
  mandatoryOptions,
  onChange,
  onRemove,
  onReorder,
}: MappedCoversPanelProps) => {
  if (!covers.length) {
    return (
      <MappedEmptyState>
        <Typography variant="body2" color="text.secondary">
          {COVER_MASTER.MESSAGES.EMPTY_MAPPED}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {COVER_MASTER.MESSAGES.EMPTY_MAPPED_HINT}
        </Typography>
      </MappedEmptyState>
    );
  }

  return (
    <Box>
      <MappedTableHeaderRow>
        <Box />
        <MappedTableHeaderCell variant="caption">
          {COVER_MASTER.LABELS.COVER}
        </MappedTableHeaderCell>
        <MappedTableHeaderCell variant="caption">
          {COVER_MASTER.LABELS.MANDATORY}
        </MappedTableHeaderCell>
        <MappedTableHeaderCell variant="caption">
          Show until activity
        </MappedTableHeaderCell>
        <Box />
      </MappedTableHeaderRow>

      <DraggableList
        items={covers}
        getItemId={(cover) => cover.refCoverId}
        onReorder={onReorder}
        droppableId="mapped-covers"
        renderContainer={({ containerRef, containerProps, children }) => (
          <MappedScrollArea ref={containerRef} {...containerProps}>
            {children}
          </MappedScrollArea>
        )}
        renderItem={(cover, provided) => (
          <MappedRow ref={provided.innerRef} {...provided.draggableProps}>
            <DragHandleCell {...provided.dragHandleProps}>
              <DragIndicatorIcon />
            </DragHandleCell>

            <Typography variant="body2" noWrap title={cover.coverName}>
              {cover.coverName}
            </Typography>

            <CommonSelect
              value={cover.mandatory}
              onChange={(e) =>
                onChange(cover.refCoverId, { mandatory: String(e.target.value) })
              }
              width="100%"
            >
              {mandatoryOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </CommonSelect>

            <CommonSelect
              value={cover.visibleUntilActivityKey ?? ""}
              displayEmpty
              onChange={(e) =>
                onChange(cover.refCoverId, {
                  visibleUntilActivityKey: String(e.target.value) || null,
                })
              }
              width="100%"
            >
              {SHOW_UNTIL_ACTIVITY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </CommonSelect>

            <IconButton
              aria-label="unmap cover"
              color="error"
              size="small"
              onClick={() => onRemove(cover.refCoverId)}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </MappedRow>
        )}
      />
    </Box>
  );
};

export default MappedCoversPanel;
