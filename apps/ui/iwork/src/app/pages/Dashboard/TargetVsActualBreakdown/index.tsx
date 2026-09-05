import React from "react";
import TargetVsActualBreakdownCommon, {
  TargetVsActualBreakdownProps,
} from "./TargetVsActualBreakdownCommon";

const TargetVsActualBreakdown: React.FC<TargetVsActualBreakdownProps> = (
  props
) => {
  return <TargetVsActualBreakdownCommon {...props} />;
};

export default TargetVsActualBreakdown;
