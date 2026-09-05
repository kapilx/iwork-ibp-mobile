import React, { useState } from "react";
import Drawer from "../Drawer";
import FilterIcon from "../../assets/svgs/filter-icon";
import { TableSearchRow, ToolbarIconButton, FilterDrawerColumn } from "./styles";
import { QuickFilterToolbarConfig } from "./types";

export * from "./types";

// Table header search: page-defined quick-search fields (typically a
// DynamicForm of selectFieldByApi fields) plus a filter icon that opens a
// drawer with page-defined content.
const QuickFilterToolbar: React.FC<QuickFilterToolbarConfig> = ({
  quickFieldsContent,
  renderFilterContent,
  filterButtonAriaLabel = "Filters",
  filterButtonTestId = "quick-filter-button",
  drawerTitle = "Filters",
  drawerWidth = "420px",
}) => {
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <TableSearchRow>
      {quickFieldsContent}

      <ToolbarIconButton
        onClick={() => setFilterOpen(true)}
        aria-label={filterButtonAriaLabel}
        data-testid={filterButtonTestId}
      >
        <FilterIcon color="#FFFFFF" />
      </ToolbarIconButton>

      <Drawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        anchor="right"
        title={drawerTitle}
        width={drawerWidth}
      >
        <FilterDrawerColumn>
          {renderFilterContent?.(() => setFilterOpen(false))}
        </FilterDrawerColumn>
      </Drawer>
    </TableSearchRow>
  );
};

export default QuickFilterToolbar;
