import React from "react";
import { CustomTabs } from "@ui/ui-lib";
import { CONTACT_PARTNERS } from "../../../constants";
import { EntityType } from "../../../constants/enum";
import { TitleContainer } from "../../InsurerPage/styles";
import InsurerContactListing from "../InsurerContactListing";
import { InsurerContactPageStyledContainer } from "./styles";

const GenericContactPage: React.FC = () => {
  const managePartnersTabs = [
    {
      label: "Insurer contacts",
      value: "insurer",
    },
    {
      label: "TPA contacts",
      value: "tpa",
    },
    {
      label: "Broker contacts",
      value: "broker",
    },
  ];

  const tabs = managePartnersTabs.map((tab) => ({
    tabKey: tab.value,
    label: tab.label,
    content: (
      <InsurerContactListing
        key={tab.value}
        entityType={tab.value as EntityType}
      />
    ),
  }));

  return (
    <InsurerContactPageStyledContainer>
      <TitleContainer variant="h1">{CONTACT_PARTNERS}</TitleContainer>
      <CustomTabs tabs={tabs} />
    </InsurerContactPageStyledContainer>
  );
};

export default GenericContactPage;
