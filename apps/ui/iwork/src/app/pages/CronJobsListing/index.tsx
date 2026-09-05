import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ALERT_MESSAGES,
  Button,
  ChipRenderer,
  CustomModal,
  Drawer,
  endPoints,
  HTTP_METHODS,
  NestedDynamicForm,
  NestedGroupedDataCollectionHandle,
  setToastMessage,
  SUCCESS_MESSAGE,
  Table,
  useApiMutation,
  useLocalization,
  useTableController,
} from "@ui/ui-lib";
import { Box, Typography } from "@mui/material";
import { TABLE_CONTROLLER_ENTITY_KEY } from "../../constants";
import { CompanyListingContainer } from "../CompanyPage/CompanyListing/styles";
import { TitleContainer } from "../InsurerPage/styles";
import {
  buildCronExpressionFromParts,
  describeCronExpression,
  getColumns,
  getSchedulerFormConfig,
  getSchedulerFormDefaults,
  SCHEDULE_UNITS,
} from "./config";
import { EditContainer } from "./styles";
import { useDispatch } from "react-redux";

const ActionsCellRenderer: React.FC<{
  setIsDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  params: any;
  setEditableRowData: React.Dispatch<React.SetStateAction<any>>;
}> = ({ setIsDrawerOpen, params, setEditableRowData }) => {
  console.log("Params in action cell renderer:", params.data);
  return (
    <Button
      onClick={() => {
        setIsDrawerOpen(true);
        setEditableRowData(params.data);
      }}
      variantType="primary"
      size="small"
      disabled={!params.data.isEditable}
    >
      Edit Configuration
    </Button>
  );
};

const EditCronConfiguration: React.FC<{
  editableRowData: any;
  setIsConfirmOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setPendingPayload: React.Dispatch<React.SetStateAction<any>>;
}> = ({ editableRowData, setIsConfirmOpen, setPendingPayload }) => {
  const formRef = useRef<NestedGroupedDataCollectionHandle>(null);
  const dispatch = useDispatch();
  const [cronExpression, setCronExpression] = useState("0 0 * * *");
  const isSyncingRef = useRef(false);
  const prevUnitRef = useRef<string | null>(null);

  useEffect(() => {
    if (formRef.current && editableRowData) {
      const defaults = getSchedulerFormDefaults(editableRowData);
      setCronExpression(defaults.cronExpression);
      formRef.current.resetForms({
        scheduler: defaults,
      });
      prevUnitRef.current = defaults.scheduleUnit;
    }
  }, [editableRowData]);

  const handleValuesChange = (allValues: Record<string, any>) => {
    if (isSyncingRef.current) {
      isSyncingRef.current = false;
      return;
    }

    const values = allValues?.scheduler || {};
    const normalizeMulti = (val: any) => {
      if (Array.isArray(val)) return val;
      if (typeof val === "string") {
        if (!val || val === "*") return [];
        return val.split(",").map((item) => item.trim()).filter(Boolean);
      }
      return [];
    };

    const currentUnit = values.scheduleUnit;

    // Reset hidden fields when frequency changes
    if (currentUnit && currentUnit !== prevUnitRef.current) {
      prevUnitRef.current = currentUnit;
      const reset: Record<string, any> = { ...values };
      if (currentUnit === SCHEDULE_UNITS.MONTH) {
        reset.month = [];
      } else if (currentUnit === SCHEDULE_UNITS.WEEK) {
        reset.month = [];
        reset.dayOfMonth = [];
      } else if (currentUnit === SCHEDULE_UNITS.DAY) {
        reset.month = [];
        reset.dayOfMonth = [];
      } else if (currentUnit === SCHEDULE_UNITS.HOUR) {
        reset.month = [];
        reset.dayOfMonth = [];
        reset.hour = "*";
        reset.dayOfWeek = [];
        reset.intervalValue = reset.intervalValue || 1;
      } else if (currentUnit === SCHEDULE_UNITS.MINUTE) {
        reset.month = [];
        reset.dayOfMonth = [];
        reset.dayOfWeek = [];
        reset.hour = "*";
        reset.minute = "*/1";
        reset.intervalValue = reset.intervalValue || 1;
      }

      isSyncingRef.current = true;
      formRef.current?.setValues?.({ scheduler: reset });
      return;
    }

    let localExpression = "";
    if (currentUnit === SCHEDULE_UNITS.MINUTE) {
      const interval = Math.max(1, Number(values.intervalValue) || 1);
      localExpression = `*/${interval} * * * *`;
    }  else if (currentUnit === SCHEDULE_UNITS.HOUR) {
      const interval = Math.max(1, Number(values.intervalValue) || 1);
      const minuteValue =
        values.minute && !values.minute.startsWith("*/")
          ? values.minute
          : "0";
      localExpression = `${minuteValue} */${interval} * * *`;
  }
 else {
      localExpression = buildCronExpressionFromParts({
        minute: values.minute,
        hour: values.hour,
        dayOfMonth:
          values.scheduleUnit === SCHEDULE_UNITS.WEEK
            ? []
            : normalizeMulti(values.dayOfMonth),
        month: normalizeMulti(values.month),
        dayOfWeek:
          values.scheduleUnit === SCHEDULE_UNITS.WEEK ||
          values.scheduleUnit === SCHEDULE_UNITS.MONTH ||
          values.scheduleUnit === SCHEDULE_UNITS.YEAR
            ? normalizeMulti(values.dayOfWeek)
            : [],
      });
    }

    setCronExpression(localExpression);
  };

  const handleSave = async () => {
    const formData = await formRef.current?.submitAll();
    if (!formData?.isAllValid) {
      dispatch(setToastMessage(ALERT_MESSAGES.GENERIC_ERROR));
      return;
    }

    const values = formData.result?.scheduler || {};
    if (!cronExpression) {
      dispatch(setToastMessage("Cron expression is required"));
      return;
    }

    setPendingPayload({
      isEnabled: values.isEnabled,
      cronExpression,
    });

    setIsConfirmOpen(true);
  };

  return (
    <EditContainer>
      <Box display="flex" flexDirection="column" gap={1}>
        <Typography variant="h6">Scheduler</Typography>
        {/* <Typography variant="body2">
          {describeCronExpression(cronExpression)}
        </Typography> */}
        {/* <Typography variant="h10" >
          Cron Expression: {cronExpression}
        </Typography> */}
      </Box>
      <NestedDynamicForm
        ref={formRef}
        config={getSchedulerFormConfig()}
        onValuesChange={handleValuesChange}
      />

      <Button variantType="primary" onClick={handleSave}>
        Save
      </Button>
    </EditContainer>
  );
};

const CronJobsListing: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [editableRowData, setEditableRowData] = React.useState<any>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);

  const {
    rowData,
    totalRows,
    currentPage,
    loading,
    setCurrentPage,
    pageSize,
    setPageSize,
    PAGE_SIZE_OPTIONS,
    setSearchTerm,
    setColumnOrder,
    columnOrder,
    setSort,
    refetch,
  } = useTableController({
    endpoint: endPoints.getCronJobConfigurations,
    searchFieldName: "jobName",
    enabled: true,
    defaultFieldName: "updatedAt",
    entityKey: TABLE_CONTROLLER_ENTITY_KEY.cronJobs,
  });

  const dispatch = useDispatch();

  const mutation = useApiMutation({
    config: {
      onSuccess: async (response) => {
        dispatch(setToastMessage(response?.message || SUCCESS_MESSAGE));
        setIsDrawerOpen(false);
        refetch();
      },
      onError: async (error) => {
        const errorMessage = Array.isArray(error?.message)
          ? error.message[0]
          : error?.message ?? ALERT_MESSAGES.GENERIC_ERROR;
        dispatch(setToastMessage(errorMessage));
      },
    },
  });
  const { localizationData } = useLocalization();
  const columns = useMemo(
    () => getColumns(localizationData?.data),
    [localizationData]
  );

  const handleConfirmUpdate = () => {
    mutation.mutate({
      endpoint: endPoints.updateCronJobConfiguration(editableRowData.id),
      method: HTTP_METHODS.PUT,
      data: pendingPayload,
    });

    setIsConfirmOpen(false);
  };

  const newRunTime = pendingPayload
    ? describeCronExpression(pendingPayload.cronExpression)
    : "";

  const oldRunTime = editableRowData
    ? describeCronExpression(editableRowData?.schedulerExpression)
    : "";

  return (
    <>
      <CompanyListingContainer>
        <TitleContainer variant="h1">Scheduler Management</TitleContainer>
        <Table
          columns={columns}
          rowData={rowData}
          totalRows={totalRows}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          loading={loading}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          setPageSize={setPageSize}
          setSort={setSort}
          setColumnOrder={setColumnOrder}
          columnOrder={columnOrder}
          title="Configured Cron Jobs"
          entityKey={TABLE_CONTROLLER_ENTITY_KEY.cronJobs}
          refetch={refetch}
          showLoader={false}
          onCellClicked={() => {}}
          enableSaveView={false}
          components={{
            ActionsCellRenderer: (params: any) => (
              <ActionsCellRenderer
                setIsDrawerOpen={setIsDrawerOpen}
                params={params}
                setEditableRowData={setEditableRowData}
              />
            ),
            ChipRenderer: ChipRenderer,
          }}
          showRefreshButton={true}
        />
      </CompanyListingContainer>
      <Drawer
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Edit Cron Configuration"
        width="480px"
      >
        <EditCronConfiguration
          editableRowData={editableRowData}
          setIsConfirmOpen={setIsConfirmOpen}
          setPendingPayload={setPendingPayload}
        />
      </Drawer>

      <CustomModal
        open={isConfirmOpen}
        heading="Confirm Scheduler Update"
        handleClose={() => setIsConfirmOpen(false)}
      >
        <Box display="flex" flexDirection="column" gap={2}>
          <p>Are you sure, you want to update this <strong>{editableRowData?.schedulerName}</strong> scheduler configuration?</p>

          <strong>Description</strong>
          <p>{editableRowData?.description}</p>

          <strong>Schedule Change</strong>
          <p>
            Runs at <b>{oldRunTime}</b> → <b>{newRunTime}</b>
          </p>
        </Box>
        <Button onClick={handleConfirmUpdate}>Confirm</Button>
      </CustomModal>
    </>
  );
};

export default CronJobsListing;
