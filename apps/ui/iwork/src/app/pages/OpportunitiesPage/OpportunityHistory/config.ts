import dayjs from "dayjs";
import { TableColumn, formatDate } from "@ui/ui-lib";

export interface ActivityHistoryRow {
  opportunityActivityId: number;
  activityName: string;
  targetDate: string | null;
  assignedTo: string | null;
  assignedBy: string | null;
  completedAt: string | null;
  submittedBy: string | null;
  approvedBy: string | null;
  additionalParticipants: string | null;
  daysToComplete: number | null;
  activityStatus: string | null;
}

const formatHistoryDateTime = (value: string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "--";

export const opportunityHistoryColumns: TableColumn<ActivityHistoryRow>[] = [
  {
    field: "activityName",
    headerName: "Activity Name",
    flex: 2,
  },
  {
    field: "assignedTo",
    headerName: "Assigned To",
    flex: 1,
    renderCell: (value) => value ?? "--",
  },
  {
    field: "assignedBy",
    headerName: "Assigned By",
    flex: 1,
    renderCell: (value) => value ?? "--",
  },
  {
    field: "targetDate",
    headerName: "Target Date",
    flex: 1,
    renderCell: (value) => formatDate(value) ?? "--",
  },
  {
    field: "completedAt",
    headerName: "Completed At",
    flex: 1,
    renderCell: (value) => formatHistoryDateTime(value),
  },
  {
    field: "submittedBy",
    headerName: "Submitted By",
    flex: 1,
    renderCell: (value) => value ?? "--",
  },
  {
    field: "approvedBy",
    headerName: "Approved By",
    flex: 1,
    renderCell: (value) => value ?? "--",
  },
  {
    field: "daysToComplete",
    headerName: "TAT",
    flex: 1,
    renderCell: (value: number | null) =>
      value == null ? "--" : value === 0 ? "On time" : `${value > 0 ? "+" : ""}${value} days`,
  },
  // {
  //   field: "additionalParticipants",
  //   headerName: "Additional Participants",
  //   flex: 2,
  //   renderCell: (value) => value ?? "--",
  // },
];
