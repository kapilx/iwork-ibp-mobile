import React, { useEffect } from "react";
import {
  useApiQuery,
  endPoints,
  setToastMessage,
} from "@ui/ui-lib";
import FunnelChart from "./Funnel";
import { UNAVAILABLE_ERROR_MESSAGE } from "../../../../constants";
import { useDispatch } from "react-redux";

interface SalesFunnelProps {
  queryString: string;
  skipQuery: boolean;
  handleFunnelClick: (params: any, chartKey: string) => void;
  // When true the funnel can't honour the current filters (e.g. business month),
  // so it skips the fetch and renders its empty / not-applicable state.
  showNotApplicablePlaceholder?: boolean;
  type?: "SO" | "PLACEMENT";
}

const SalesFunnel: React.FC<SalesFunnelProps> = ({
  queryString,
  skipQuery,
  handleFunnelClick,
  showNotApplicablePlaceholder = false,
  type = "SO",
}) => {
  const dispatch = useDispatch();
  const url = `${endPoints.salesFunnel}${queryString}&fromDashboard=true${
    type === "PLACEMENT" ? "&type=PLACEMENT" : ""
  }`;
  const {
    data: salesFunnelResponse,
    isLoading,
    error,
  } = useApiQuery({
    queryKey: ["salesFunnel", url],
    url: url,
    enabled: !skipQuery,
  });

  useEffect(() => {
    if (error && error.status === 504) {
      dispatch(setToastMessage(UNAVAILABLE_ERROR_MESSAGE));
    }
  }, [error]);
  const salesFunnelData = salesFunnelResponse?.data || [];

  return (
    <FunnelChart
      handleFunnelClick={handleFunnelClick}
      chartKey={type}
      data={salesFunnelData}
      loading={isLoading}
      showNotApplicablePlaceholder={showNotApplicablePlaceholder}
    />
  );
};

export default SalesFunnel;
