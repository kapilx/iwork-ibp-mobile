import { ColDef } from "ag-grid-community";
import { Role } from "./types";

export const columns: ColDef<Role>[] = [
  {
    headerName: "Role Name",
    field: "name",
    tooltipField: "name",
    headerTooltip: "Role Name",
    disableSort: true,
  },
  {
    headerName: "Role Key",
    field: "roleKey",
    tooltipField: "roleKey",
    headerTooltip: "Role Key",
    disableSort: true,
  },
  {
    headerName: "Description",
    field: "description",
    tooltipField: "description",
    headerTooltip: "Description",
    disableSort: true,
  },
];
