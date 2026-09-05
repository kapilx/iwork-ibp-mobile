import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import smartIcon from "../../assets/svgs/smart.svg";
import {
  StaticIcon,
  AssistantCard,
  AssistantLink,
  AssistantTitle,
  AssistantWrapper,
  DisabledText,
  MenuItem,
  FloatingAssistantStyledDivider,
} from "./styles";
import {
  COMPANY,
  SMART_ASSISTANT,
  SMARTASSISTANT_MENUITEMS,
} from "../../constants";
import { useSelector } from "react-redux";
import { selectHasPermission } from "@ui/ui-lib/redux/permissionSlice";
import { FeatureKey, environment } from "@ui/ui-lib/index";

// Static menu items that are always shown
const staticMenuItems = [
  {
    label:
      SMARTASSISTANT_MENUITEMS.HELP_ME_TO_ADD_A_COMPANY_CONTACT_OPPORTUNITY,
    disabled: false,
  },
  {
    label:
      SMARTASSISTANT_MENUITEMS.WHERE_CAN_I_FIND_SALES_DOCUMENTS_AND_RESOURCES,
    disabled: false,
  },
  {
    label: SMARTASSISTANT_MENUITEMS.WHAT_ARE_THE_TASKS_I_NEED_TO_WORK_ON_TODAY,
    disabled: false,
  },
];

//ref to identify the onClick event for the Floating Assistant icon
const FloatingAssistant: React.FC<{
  iconRef: React.RefObject<HTMLImageElement>;
  cardRef: React.RefObject<HTMLDivElement>;
}> = ({ iconRef, cardRef }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const canGiveApprovalForBD = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_BD_OPPORTUNITY)(state)
  );
  const canGiveApprovalForISG = useSelector((state: any) =>
    selectHasPermission(FeatureKey.APPROVE_ISG_OPPORTUNITY)(state)
  );
  const viewChatBot = useSelector((state: any) =>
    selectHasPermission(FeatureKey.VIEW_CHATBOT)(state)
  );

  const validateApprovalAccess = (): boolean => {
    return canGiveApprovalForBD || canGiveApprovalForISG;
  };

  const menuItems = React.useMemo(() => {
    const items = [...staticMenuItems];

    if (environment.featureFlag.FF_IWORK_NL2SQL_CHAT_BOT && viewChatBot) {
      items.unshift({
        label: SMARTASSISTANT_MENUITEMS.ASK_ECHO,
        disabled: false,
      });
    }

    if (validateApprovalAccess()) {
      items.push({
        label: SMARTASSISTANT_MENUITEMS.DO_I_HAVE_ANYTHING_TO_APPROVE_TODAY,
        disabled: false,
      });
    }

    return items;
  }, [canGiveApprovalForBD, canGiveApprovalForISG, viewChatBot]);

  const onIconClick = () => {
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        cardRef.current &&
        !cardRef.current.contains(target) &&
        iconRef.current &&
        !iconRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, cardRef, iconRef]);

  const handleMenuClick = (item: (typeof menuItems)[0]) => {
    if (item.label === SMARTASSISTANT_MENUITEMS.ASK_ECHO) {
      navigate("/ask-echo");
    } else if (
      item.label ===
      SMARTASSISTANT_MENUITEMS.DO_I_HAVE_ANYTHING_TO_APPROVE_TODAY
    ) {
      navigate("/engagements/approval", { state: { tab: "approval" } });
    } else if (
      item.label ===
      SMARTASSISTANT_MENUITEMS.WHAT_ARE_THE_TASKS_I_NEED_TO_WORK_ON_TODAY
    ) {
      navigate("/engagements/tasks", { state: { tab: "task" } });
    } else if (
      item.label ===
      SMARTASSISTANT_MENUITEMS.WHERE_CAN_I_FIND_SALES_DOCUMENTS_AND_RESOURCES
    ) {
      navigate("/knowledge-central");
    } else if (
      item.label ===
      SMARTASSISTANT_MENUITEMS.HELP_ME_TO_ADD_A_COMPANY_CONTACT_OPPORTUNITY
    ) {
      navigate("/create", {
        state: {
          pageTitle: COMPANY,
          cta: "createCompany",
          originPath: "/companies",
        },
      });
    }
  };

  return (
    <AssistantWrapper data-testid="floating-assistant-wrapper">
      {open && (
        <AssistantCard ref={cardRef} data-testid="floating-assistant-card">
          <AssistantTitle variant="h6">{SMART_ASSISTANT}</AssistantTitle>
          <FloatingAssistantStyledDivider />
          {menuItems.map((item, index) => {
            const isLast = index === menuItems.length - 1;
            const className = isLast ? "no-border" : "";
            return (
              <MenuItem key={index} data-testid={`menu-item-${index}`}>
                {item.disabled ? (
                  <DisabledText variant="body2" className={className}>
                    {item.label}
                  </DisabledText>
                ) : (
                  <AssistantLink
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleMenuClick(item);
                    }}
                    className={className}
                  >
                    {item.label}
                  </AssistantLink>
                )}
              </MenuItem>
            );
          })}
        </AssistantCard>
      )}

      <StaticIcon
        ref={iconRef}
        src={smartIcon}
        alt="smart-icon"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onIconClick();
        }}
        className="smart-assistant-icon"
        data-testid="floating-assistant-icon"
      />
    </AssistantWrapper>
  );
};

export default FloatingAssistant;
