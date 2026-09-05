import React from "react";
import { EnrolledBadgeChip } from "./styles";
import { ENROLLED } from "../../constants";

interface EnrolledBadgeProps {
  label?: string;
}

const EnrolledBadge: React.FC<EnrolledBadgeProps> = ({
  label = ENROLLED,
}) => {
  return <EnrolledBadgeChip label={label}/>;
};

export default EnrolledBadge;
