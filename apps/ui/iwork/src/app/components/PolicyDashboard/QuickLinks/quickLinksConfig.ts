import AddEmployeeIcon from "../../../assets/svgs/add-employee.svg";
import AddEndorsementIcon from "../../../assets/svgs/add-endorsement.svg";
import AddBalanceIcon from "../../../assets/svgs/add-balance.svg";
import AddClaimIcon from "../../../assets/svgs/add-claim.svg";

export const quickActions = (
  inceptionLabel?: string,
  isGroupPolicyType?: boolean
) => [
  {
    id: 1,
    label: inceptionLabel,
    icon: AddEmployeeIcon,
    actionKey: "employee",
  },
  {
    id: 2,
    label: isGroupPolicyType
      ? "Create endorsement"
      : "Create asset endorsement",
    icon: AddEndorsementIcon,
    actionKey: "endorsement",
  },
  {
    id: 3,
    label: "Add CD balance",
    icon: AddBalanceIcon,
    actionKey: "cd_balance",
  },
  {
    id: 4,
    label: isGroupPolicyType ? "Upload claim data" : "Create claim",
    icon: AddClaimIcon,
    actionKey: "claim",
  },
];
