import React, { useMemo } from "react";
import { PAGE_SIZE_OPTIONS, SERVICE_SCORE_DETAILS, NOT_APPLICABLE_NOTE } from "@ui/ui-lib";
import { Table } from "@ui/ui-lib";
import { TitleContainer } from "../../CompanyPage/CompanyListing/styles.js";
import { columnDefs } from "./tableConfig.js";
import {
  CardBackground,
  TableContainer,
  Note,
} from "../CompanyOverView/styles";
import infoIconDetails from "../../../assets/svgs/info-icon-details.svg";

interface ServiceScoreDetailsProps {
  details?: Record<string, Record<string, number>>;
}

const ServiceScoreDetails: React.FC<ServiceScoreDetailsProps> = ({
  details,
}) => {
  const SERVICE_SUMMARY_KEYS = [
    "scoredMarks",
    "totalMarks",
    "weightage_score",
    "maxWeightage",
  ];

  const rows = useMemo(() => {
    return Object.entries(details ?? {}).map(([serviceName, buckets]) => {
      const tatBuckets = Object.entries(buckets)
        .filter(([key]) => !SERVICE_SUMMARY_KEYS.includes(key))
        .map(([label, count], index) => ({
          id: `tat${index + 1}`,
          label,
          count,
        }));
      const totalNumberOfEvents = tatBuckets.reduce(
        (sum, bucket) => sum + (bucket.count ?? 0),
        0
      );
      return {
        serviceName,
        totalNumberOfEvents,
        // "Scored" = raw Σ(bucket count * bucket.tat_weight). "Total marks" =
        // raw request count (Σ bucket counts). "Weighted scored" = Scored/
        // Total * weightage_score. "Max. weightage" = the static
        // mstr_org_service_weightage.weightage_score constant.
        scored: buckets.scoredMarks ?? null,
        totalMarks: buckets.totalMarks ?? null,
        wtg: buckets.maxWeightage ?? null,
        wtg_score: buckets.weightage_score ?? null,
        tatBuckets,
      };
    });
  }, [details]);
  const columns = useMemo(() => columnDefs(rows), [rows]);

  return (
    <CardBackground>
      <TitleContainer variant="h1">{SERVICE_SCORE_DETAILS}</TitleContainer>

      <TableContainer>
        <Table
          columns={columns}
          rowData={rows}
          totalRows={rows.length}
          currentPage={1}
          setCurrentPage={() => {}}
          loading={false}
          pageSize={20}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          setPageSize={() => {}}
          onCellClicked={() => {}}
          setSort={() => {}}
          height={590}
          domLayout="autoHeight"
        />
      </TableContainer>
    </CardBackground>
  );
};

export default ServiceScoreDetails;
