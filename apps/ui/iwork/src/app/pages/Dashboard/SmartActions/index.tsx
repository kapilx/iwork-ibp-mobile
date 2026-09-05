import React from "react";
import { useNavigate } from "react-router-dom";
import {
  StyledSmartActionsBlock,
  StyledActionContainer,
  StyledActionLabel,
  StyledActionIcon,
  StyledTitle,
  StyledSubTitle,
} from "./styles";

export interface SmartActionData {
  icon: string;
  label: string;
  actionType?: string;
  onClick?: () => void; // Optional custom click handler
}

interface SmartActionsProps {
  actionsData: SmartActionData[];
  title?: string;
  subTitle?: string;
}

const SmartActions = ({
  actionsData,
  title = "Smart Actions",
  subTitle,
}: SmartActionsProps)=> {
  const navigate = useNavigate();

  const handleItemClick = (action: SmartActionData) => {
    // If custom onClick handler is provided, use it
    if (action.onClick) {
      action.onClick();
      return;
    }

    // Otherwise, use default navigation based on actionType
    if (!action.actionType) return;

    switch (action.actionType) {
      case "create-policy":
        navigate("/policies/create");
        break;
      case "create-claim":
        navigate("/claims/create");
        break;
      case "create-endorsement":
        navigate("/endorsements/create");
        break;
      default:
        break;
    }
  };

  return (
    <>
      <StyledTitle>{title}</StyledTitle>
      {subTitle && <StyledSubTitle>{subTitle}</StyledSubTitle>}
      <StyledSmartActionsBlock>
        {actionsData.map((action, idx) => (
          <StyledActionContainer
            key={`${action.actionType || action.label}-${idx}`}
            // onClick={
            //   action.actionType || action.onClick 
            //     ? () => handleItemClick(action) 
            //     : undefined
            // }
            // style={{ 
            // //   cursor: (action.actionType || action.onClick) ? "pointer" : "default" 
            // }}
          >
            <StyledActionLabel>
                <img src={action.icon} alt={action.label} />
           <StyledActionIcon>
              {action.label}
           </StyledActionIcon>

            </StyledActionLabel>
          </StyledActionContainer>
        ))}
      </StyledSmartActionsBlock>
    </>
  );
}

export default SmartActions;
