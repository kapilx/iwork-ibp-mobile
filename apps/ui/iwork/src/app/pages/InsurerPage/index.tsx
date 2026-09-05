import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CustomTabs } from "@ui/ui-lib";
import { EntityType } from "../../constants/enum";
import InsurerListing from "./InsurerTable";
import { InsurerPageStyledContainer, TitleContainer } from "./styles";
import InsurerContactListing from "../InsurerContactPage/InsurerContactListing";

interface InsurerPageProps {
  title?: string; // fallback title
}

type TabConfig = {
  tabs: Array<{ tabKey: string; label: string; content: React.ReactNode }>;
  title: string;
};

const pageConfigs: Record<string, TabConfig> = {
  insurer: {
    title: "Manage insurer",
    tabs: [
      {
        tabKey: "listing",
        label: "Insurer",
        content: (
          <InsurerListing key="insurer" entityType={"insurer" as EntityType} />
        ),
      },
      {
        tabKey: "contacts",
        label: "Insurer contacts",
        content: (
          <InsurerContactListing
            key="contact"
            entityType={"insurer" as EntityType}
          />
        ),
      },
    ],
  },
  broker: {
    title: "Manage broker",
    tabs: [
      {
        tabKey: "listing",
        label: "Brokers",
        content: (
          <InsurerListing key="broker" entityType={"broker" as EntityType} />
        ),
      },
      {
        tabKey: "contacts",
        label: "Broker contacts",
        content: (
          <InsurerContactListing
            key="brokercontact"
            entityType={"broker" as EntityType}
          />
        ),
      },
    ],
  },
  tpa: {
    title: "Manage TPA",
    tabs: [
      {
        tabKey: "listing",
        label: "TPA",
        content: <InsurerListing key="tpa" entityType={"tpa" as EntityType} />,
      },
      {
        tabKey: "contacts",
        label: "TPA contacts",
        content: (
          <InsurerContactListing
            key="contact"
            entityType={"tpa" as EntityType}
          />
        ),
      },
    ],
  },
};

const InsurerPage: React.FC<InsurerPageProps> = ({ title = "Partners" }) => {
  const { pathname, search } = useLocation();
  const navigate = useNavigate();

  // Determine matching config or fallback
  const { tabs, title: pageTitle } = useMemo(() => {
    for (const key of Object.keys(pageConfigs)) {
      if (pathname.toLowerCase().includes(key)) {
        return pageConfigs[key];
      }
    }
    return { tabs: [], title };
  }, [pathname, title]);

  // Set initial tab based on query param
  const initialTabKey = search.includes("contacts=true")
    ? "contacts"
    : "listing";

  // When tab changes, update the query param
  const handleTabChange = (tabKey: string) => {
    const newSearch = tabKey === "contacts" ? "?contacts=true" : "";
    navigate({ pathname, search: newSearch });
  };

  return (
    <InsurerPageStyledContainer>
      <TitleContainer variant="h1">{pageTitle}</TitleContainer>
      <CustomTabs
        key={pathname + search}
        tabs={tabs}
        initialTabKey={initialTabKey}
        onTabChange={handleTabChange}
      />
    </InsurerPageStyledContainer>
  );
};

export default InsurerPage;
