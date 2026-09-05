import React from "react";
import { useParams } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";
import { DynamicTable, endPoints, useApiQuery } from "@ui/ui-lib";
import {
  FAILED_TO_LOAD_OPPORTUNITY_HISTORY,
  getRenewalAwareActivityLabel,
} from "../../../constants";
import {
  ActivityHistoryRow,
  opportunityHistoryColumns,
} from "./config";

interface OpportunityHistoryProps {
  isRenewal?: boolean;
}

const OpportunityHistory: React.FC<OpportunityHistoryProps> = ({
  isRenewal = false,
}) => {
  const { id: opportunityId } = useParams<{ id: string }>();

  const { data, isLoading, isError } = useApiQuery({
    queryKey: ["opportunityActivityHistory", opportunityId],
    url: endPoints.opportunityActivityHistory(Number(opportunityId)),
    enabled: !!opportunityId,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box p={3}>
        <Typography color="error">
          {FAILED_TO_LOAD_OPPORTUNITY_HISTORY}
        </Typography>
      </Box>
    );
  }

  const rows: ActivityHistoryRow[] = (data?.data ?? []).map(
    (row: ActivityHistoryRow) => ({
      ...row,
      activityName: getRenewalAwareActivityLabel(
        row.activityName,
        isRenewal
      ) as string,
    })
  );

  return (
    <Box p={2}>
      <DynamicTable rows={rows} columns={opportunityHistoryColumns} />
    </Box>
  );
};

export default OpportunityHistory;
