import React, { useEffect } from "react";
import {
  useApiQuery,
  endPoints,
  buildQueryString,
  updateTimeFilter,
  setToastMessage,
} from "@ui/ui-lib";
import FunnelChart from "../SalesFunnel/Funnel";
import { UNAVAILABLE_ERROR_MESSAGE } from "../../../../constants";
import { useDispatch } from "react-redux";

interface RenewalFunnelProps {
  queryString: string;
  skipQuery: boolean;
  handleFunnelClick: (params: any, chartKey: string) => void;
  // When true the funnel can't honour the current filters (e.g. business month),
  // so it skips the fetch and renders its empty / not-applicable state.
  showNotApplicablePlaceholder?: boolean;
}

const RenewalFunnel: React.FC<RenewalFunnelProps> = ({
  queryString,
  skipQuery,
  handleFunnelClick,
  showNotApplicablePlaceholder = false,
}) => {
  const url = `${endPoints.renewalFunnel}&${queryString.slice(1)}&fromDashboard=true`;
  const dispatch = useDispatch();
  const {
    data: renewalFunnelResponse,
    isLoading,
    error,
  } = useApiQuery({
    queryKey: ["renewalFunnel", url],
    url: url,
    enabled: !skipQuery,
    shouldShowLoader: false,
  });
  useEffect(() => {
    if (error && error.status === 504) {
      dispatch(setToastMessage(UNAVAILABLE_ERROR_MESSAGE));
    }
  }, [error]);
  const renewalFunnelData = renewalFunnelResponse?.data || [];

  return (
    <FunnelChart
      handleFunnelClick={handleFunnelClick}
      chartKey="RO"
      data={renewalFunnelData}
      loading={isLoading}
      showNotApplicablePlaceholder={showNotApplicablePlaceholder}
    />
  );
};

export default RenewalFunnel;
