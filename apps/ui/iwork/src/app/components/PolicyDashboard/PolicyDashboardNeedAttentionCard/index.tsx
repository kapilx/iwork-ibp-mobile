import React from "react";
import { Typography } from "@mui/material";
import {
  CardWrapper,
  LeftContent,
  TitleRow,
  AttentionRow,
  StyledConfigureContainer,
  StyledConfigureTextContainer,
  ConfigureText,
  LeftContentContainer,
  LinkActions,
} from "./styles.js";

import needAttentionIcon from "../../../assets/svgs/need-attention.svg";
import Button from "@ui/ui-lib/commonComponents/Button";
import configurePolicy from "../../../assets/svgs/configure-policy.svg";
import { POLICY_DASHBOARD } from "../../../constants/index.js";
import { formatNumberByLocalization } from "@ui/ui-lib";

// Types
interface AttentionItem {
  icon?: string;
  messageTemplate: string;
  count?: number;
  actionText?: string;
  onClick?: () => void;
}

interface Props {
  data?: AttentionItem[];
  onConfigure?: () => void;
}

const PolicyDashboardNeedAttentionCard: React.FC<Props> = ({
  data,
  onConfigure,
}) => {
  const hasData = Array.isArray(data) && data.length > 0;

  function formatTemplate(
    template: string,
    values: Record<string, string | number>
  ) {
    return template.replace(
      /\{(\w+)\}/g,
      (_, key) => values[key]?.toString() || ""
    );
  }

  return (
    <CardWrapper
      hasData={data && data?.length > 0}
      data-testid="details-section"
    >
      <TitleRow>
        <img src={needAttentionIcon} alt="Attention" width={30} />
        <Typography
          variant="subtitle1"
          fontWeight={600}
          data-testid="section-title"
        >
          {POLICY_DASHBOARD.NEED_YOUR_ATTENTION}
        </Typography>
      </TitleRow>
      <LeftContentContainer hasData={data && data?.length > 0}>
        <LeftContent data-testid="section-details">
          {hasData ? (
            data.map((item, index) => (
              <AttentionRow
                key={index}
                lastRow={index === data.length - 1}
                data-testid={`section-details-${index}`}
              >
                {/* {getIcon(item.iconType)} */}
                <img
                  src={item.icon || needAttentionIcon}
                  alt="Icon"
                  width={20}
                />
                <Typography variant="body2">
                  {formatTemplate(item.messageTemplate, {
                    count: formatNumberByLocalization(item.count) || 0,
                  })}{" "}
                  {item.actionText && (
                    <LinkActions
                      component="button"
                      onClick={item.onClick}
                      underline="hover"
                      disabled={item.count === 0}
                      count={item.count || 0}
                      data-testid={`section-details-${index}-link`}
                    >
                      {item.actionText}
                    </LinkActions>
                  )}
                </Typography>
              </AttentionRow>
            ))
          ) : (
            <StyledConfigureContainer>
              <img src={configurePolicy} alt="Attention" width={100} />
              <StyledConfigureTextContainer>
                <ConfigureText variant="body2">
                  {POLICY_DASHBOARD.CONFIGURE_POLICY_MESSAGE}
                </ConfigureText>
                <Button onClick={onConfigure}>
                  {POLICY_DASHBOARD.CONFIGURE_POLICY}
                </Button>
              </StyledConfigureTextContainer>
            </StyledConfigureContainer>
          )}
        </LeftContent>

        {/* <RightImage>
          <img src={needAttentionXl} alt="Decorative" />
        </RightImage> */}
      </LeftContentContainer>
    </CardWrapper>
  );
};

export default PolicyDashboardNeedAttentionCard;
