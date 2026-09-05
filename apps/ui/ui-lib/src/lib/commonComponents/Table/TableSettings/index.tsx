import { Button, Checkbox, DraggableList } from "@ui/ui-lib";
import React, { useState } from "react";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import {
  DraggableContainer,
  DraggableItem,
  DraggableItemContent,
  DraggableItemLabel,
  DraggableItemHandle,
  ActionButtonsContainer,
  StyledDroppableContainer,
} from "./styles";
import { ColDef } from "ag-grid-community";

interface DraggableColumnListProps {
  columns: ColDef[];
  setColumnOrder: React.Dispatch<React.SetStateAction<ColDef[]>>;
  closeSettings: () => void;
}

const DraggableColumnList = ({
  columns,
  setColumnOrder,
  closeSettings,
}: DraggableColumnListProps) => {
  const [colOrder, setColOrder] = useState(columns);

  const handleCheckBoxClick = (field: string) => {
    setColOrder((prev) => {
      const updatedColumns = prev.map((item) => {
        if (item.field === field) {
          const visibleColumns = prev.filter((col) => !col.hide);

          if (visibleColumns.length === 1 && !item.hide) {
            return item;
          }

          return { ...item, hide: !item.hide };
        }
        return item;
      });
      return updatedColumns;
    });
  };

  const handleSave = async () => {
    setColumnOrder(colOrder);
    closeSettings();
  };

  const handleCheckboxChange = (field?: string) => {
    if (field) {
      handleCheckBoxClick(field);
    }
  };

  return (
    <DraggableContainer>
      <DraggableList
        items={colOrder}
        getItemId={(item, index) => item.field || `fallback-${index}`}
        onReorder={setColOrder}
        droppableId="columns"
        renderContainer={({ containerRef, containerProps, children }) => (
          <StyledDroppableContainer ref={containerRef} {...containerProps}>
            {children}
          </StyledDroppableContainer>
        )}
        renderItem={(item, provided) => (
          <DraggableItem
            data-testid={item.headerName}
            ref={provided.innerRef}
            {...provided.draggableProps}
            style={provided.draggableProps.style}
          >
            <DraggableItemContent>
              <Checkbox
                isChecked={!item.hide}
                onChange={() => handleCheckboxChange(item.field)}
              />
              <DraggableItemLabel>{item.headerName}</DraggableItemLabel>
            </DraggableItemContent>
            <DraggableItemHandle {...provided.dragHandleProps}>
              <DragIndicatorIcon />
            </DraggableItemHandle>
          </DraggableItem>
        )}
      />

      <ActionButtonsContainer>
        <Button
          onClick={closeSettings}
          label="Discard"
          sizeType="small"
          variantType="secondary"
        />
        <Button onClick={handleSave} sizeType="small" label="Save" />
      </ActionButtonsContainer>
    </DraggableContainer>
  );
};

export default DraggableColumnList;
