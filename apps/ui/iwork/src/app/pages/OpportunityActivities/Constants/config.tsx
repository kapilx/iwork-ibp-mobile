import { endPoints, EDIT, formatMeetingTimeRange } from "@ui/ui-lib";
import { ColDef } from "ag-grid-community";
import dayjs from "dayjs";
import editIcon from "../../../assets/svgs/edit-icon.svg";
import { COMPLETED_STATUS, CANCELLED_STATUS } from "../../../constants";

export const getTasksColumnDefs = (
  handleEditTask: (taskData: any) => void,
  hideEdit: boolean,
  currentUserId?: number | null
): ColDef[] => [
  {
    headerName: "Task Name",
    field: "taskName",
    flex: 1.5,
    sortable: false,
    filter: false,
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "",
  },
  {
    headerName: "Description",
    field: "description",
    flex: 1.5,
    sortable: false,
    filter: false,
    valueFormatter: ({ value }: any) =>
      value && value.trim() !== "" ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "",
  },
  {
    headerName: "Assignee",
    field: "assignee",
    flex: 1.3,
    sortable: false,
    filter: false,
    valueGetter: (params: any) => {
      const assignee = params.data?.assignee;
      if (assignee?.firstName || assignee?.lastName) {
        return `${assignee.firstName} ${assignee.lastName}`;
      }
      return "--";
    },
    tooltipValueGetter: (params: any) => {
      const assignee = params.data?.assignee;
      if (assignee?.firstName || assignee?.lastName) {
        return `${assignee.firstName} ${assignee.lastName}`;
      }
      return "";
    },
  },
  {
    headerName: "Status",
    field: "taskStatus",
    flex: 1,
    sortable: false,
    filter: false,
    valueGetter: (params: any) => {
      return params.data?.taskStatus?.lookUpValue || "--";
    },
    tooltipValueGetter: (params: any) => {
      return params.data?.taskStatus?.lookUpValue || "";
    },
  },
  {
    headerName: "Priority",
    field: "priority",
    flex: 0.8,
    sortable: false,
    filter: false,
    valueGetter: (params: any) => {
      return params.data?.priority?.lookUpValue || "--";
    },
    tooltipValueGetter: (params: any) => {
      return params.data?.priority?.lookUpValue || "";
    },
  },

  {
    headerName: "Due Date",
    field: "dueDate",
    flex: 1,
    sortable: false,
    filter: false,
    valueFormatter: ({ value }: any) =>
      value ? dayjs(value).format("DD/MM/YYYY") : "--",
    tooltipValueGetter: ({ value }) =>
      value ? dayjs(value).format("DD/MM/YYYY") : "",
  },

  {
    headerName: "Edit",
    field: "edit",
    flex: 0.5,
    cellRenderer: (params: any) => {
      const assigneeUserId = params.data?.assignee?.userId;
      const completedStatus =
        (params.data?.taskStatus?.lookUpValue ?? "").toLowerCase() !== COMPLETED_STATUS.toLowerCase();
      const canEdit =
        currentUserId && assigneeUserId === currentUserId && completedStatus;

      if (!canEdit) {
        return null;
      }

      return <img style={{ cursor: "pointer" }} src={editIcon} alt={EDIT} />;
    },
    hide: hideEdit,
    sortable: false,
    filter: false,
    onCellClicked: (params: any) => {
      const assigneeUserId = params.data?.assignee?.userId;
      const completedStatus =
        (params.data?.taskStatus?.lookUpValue ?? "").toLowerCase() !== COMPLETED_STATUS.toLowerCase();
      const canEdit =
        currentUserId && assigneeUserId === currentUserId && completedStatus;

      if (canEdit) {
        handleEditTask(params.data);
      }
    },
  },
];

export const getMeetingsColumnDefs = (
  handleEditMeeting: (meetingData: any) => void,
  hideEdit: boolean,
  currentUserId?: number | null
): ColDef[] => [
  {
    headerName: "Meeting Subject",
    field: "meetingSubject",
    flex: 1.5,
    sortable: false,
    filter: false,
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "",
  },
  {
    headerName: "Meeting Type",
    field: "meetingType",
    flex: 1.2,
    sortable: false,
    filter: false,
    valueGetter: (params: any) => {
      return params.data?.meetingType?.lookUpValue || "--";
    },
    tooltipValueGetter: (params: any) => {
      return params.data?.meetingType?.lookUpValue || "";
    },
  },
  {
    headerName: "Agenda",
    field: "meetingAgenda",
    flex: 1.5,
    sortable: false,
    filter: false,
    valueFormatter: ({ value }: any) =>
      value && value.trim() !== "" ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "",
  },
  {
    headerName: "Status",
    field: "meetingStatus",
    flex: 1,
    sortable: false,
    filter: false,
    valueGetter: (params: any) => {
      return params.data?.meetingStatus?.lookUpValue || "--";
    },
    tooltipValueGetter: (params: any) => {
      return params.data?.meetingStatus?.lookUpValue || "";
    },
  },
  {
    headerName: "Meeting Date",
    field: "meetingDate",
    flex: 1.2,
    sortable: false,
    filter: false,
    valueFormatter: ({ value }: any) =>
      value ? dayjs(value).format("DD/MM/YYYY") : "--",
    tooltipValueGetter: ({ value }) =>
      value ? dayjs(value).format("DD/MM/YYYY") : "",
  },
  {
    headerName: "Time",
    field: "startTime",
    flex: 1,
    sortable: false,
    filter: false,
    valueGetter: (params: any) => {
      return formatMeetingTimeRange(params.data?.startTime, params.data?.endTime);
    },
    tooltipValueGetter: (params: any) => {
      return formatMeetingTimeRange(params.data?.startTime, params.data?.endTime) || "";
    },
  },
  {
    headerName: "Location",
    field: "locationType",
    flex: 1.2,
    sortable: false,
    filter: false,
    valueGetter: (params: any) => {
      return params.data?.locationType?.lookUpValue || "--";
    },
    tooltipValueGetter: (params: any) => {
      return params.data?.locationType?.lookUpValue || "";
    },
  },
  {
    headerName: "Edit",
    field: "edit",
    flex: 0.5,
    cellRenderer: (params: any) => {
      const meetingStatus = (params.data?.meetingStatus?.lookUpValue ?? "").toLowerCase();
      const isCompletedOrCancelled = 
        meetingStatus === COMPLETED_STATUS.toLowerCase() || 
        meetingStatus === CANCELLED_STATUS.toLowerCase();
      
      if (isCompletedOrCancelled) {
        return null;
      }

      return <img style={{ cursor: "pointer" }} src={editIcon} alt={EDIT} />;
    },
    hide: hideEdit,
    sortable: false,
    filter: false,
    onCellClicked: (params: any) => {
      const meetingStatus = (params.data?.meetingStatus?.lookUpValue ?? "").toLowerCase();
      const isCompletedOrCancelled = 
        meetingStatus === COMPLETED_STATUS.toLowerCase() || 
        meetingStatus === CANCELLED_STATUS.toLowerCase();

      if (!isCompletedOrCancelled) {
        handleEditMeeting(params.data);
      }
    },
  },
];


export const getNotesColumnDefs = (
  handleEditNote: (noteData: any) => void,
  hideEdit: boolean
): ColDef[] => [
  {
    headerName: "Title",
    field: "noteTitle",
    flex: 1.5,
    sortable: false,
    filter: false,
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "",
  },
  {
    headerName: "Description",
    field: "description",
    flex: 2,
    sortable: false,
    filter: false,
    valueFormatter: ({ value }: any) =>
      value && value.trim() !== "" ? value : "--",
    tooltipValueGetter: ({ value }) =>
      value !== null && value !== undefined ? value : "",
  },
  {
    headerName: "Edit",
    field: "edit",
    flex: 0.5,
    cellRenderer: (params: any) => {
      return <img style={{ cursor: "pointer" }} src={editIcon} alt={EDIT} />;
    },
    hide: hideEdit,
    sortable: false,
    filter: false,
    onCellClicked: (params: any) => {
      handleEditNote(params.data);
    },
  },
];

export const buttonsConfig = [
  {
    key: "saveActivity",
    name: "saveActivity",
    label: "Save activity",
    type: "button",
    componentProps: {
      variantType: "secondary",
      style: {
        width: "unset",
      },
    },

    onClick: "saveActivity",
  },
  {
    key: "submit",
    name: "Complete activity",
    label: "Complete activity",
    type: "button",
    componentProps: {
      variantType: "primary",
      style: {
        width: "unset",
      },
    },
    onClick: "submit",
  },
];
export const qouteButtonsConfig = [
  {
    key: "generateQuoteComparison",
    name: "generateQuoteComparison",
    label: "Generate Quote Comparison",
    type: "button",
    componentProps: {
      variantType: "primary",
      style: {
        width: "unset",
      },
    },
    onClick: "qouteGenerationReport",
  },
  {
    key: "saveActivity",
    name: "saveActivity",
    label: "Save activity",
    type: "button",
    componentProps: {
      variantType: "secondary",
      style: {
        width: "unset",
      },
    },

    onClick: "saveActivity",
  },
  {
    key: "completeActivity",
    name: "completeActivity",
    label: "Complete activity",
    type: "button",
    componentProps: {
      variantType: "primary",
      style: {
        width: "unset",
      },
    },

    onClick: "submit",
  },
];

export const approvalButtonsConfig = [
  {
    key: "saveActivity",
    name: "saveActivity",
    label: "Save activity",
    type: "button",
    componentProps: {
      variantType: "secondary",
      style: {
        width: "unset",
      },
    },

    onClick: "saveActivity",
  },
  {
    key: "submitForApproval",
    name: "submitForApproval",
    label: "Submit for approval",
    type: "button",
    componentProps: {
      variantType: "primary",
    },
    onClick: "submitForApproval",
  },
];
export const onlyApproveButtonConfig = [
  {
    key: "reject",
    name: "reject",
    label: "Reject",
    type: "button",
    componentProps: {
      variantType: "secondary",
    },
    onClick: "reject",
  },
  {
    key: "approve",
    name: "approve",
    label: "Approve",
    type: "button",
    componentProps: {
      variantType: "primary",
    },
    onClick: "approve",
  },
];

//covers ai body
type TransformedQuestion = {
  key: string;
  type: string;
  label: string;
  options?: { label: string; value: string }[];
};

export function transformQuestions(raw: any[]): TransformedQuestion[] {
  return raw.map((item) => {
    const transformed: TransformedQuestion = {
      key: item.key,
      type: item.type,
      label: item.label,
    };

    if (item.type === "select" && Array.isArray(item.options)) {
      transformed.options = item.options.map((opt) => ({
        label: opt.label,
        value: opt.value,
      }));
    }

    return transformed;
  });
}
