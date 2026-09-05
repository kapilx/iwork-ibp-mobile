import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import {
  IconStyling,
  CustomTabsMainContainer,
  CustomTabsNoDataBox,
  CustomTabsNoDataText,
  StyledTab,
  StyledTabLabel,
  StyledTabs,
  TabsLabel,
} from "./styles";
import backgroundImage from "../../assets/webp/no-data-found-background-image.webp";
import { NO_DATA_TO_SHOW } from "@ui/ui-lib/constants";

// Each tab requires a unique key to avoid brittle index-based navigation.
export interface Tab {
  tabKey: string;
  label: string;
  content?: React.ReactNode;
  disabled?: boolean;
}

// Props for the CustomTabs component. Only key-based navigation is supported.
export interface TabsProps {
  tabs: Tab[];
  noBackgroundColor?: boolean;
  initialTabKey?: string;
  activeTabKey?: string;
  onTabChange?: (key: string) => void;
  styles?: {
    tabColor?: string;
    activeTabColor?: string;
    underlineColor?: string;
    tabSpacing?: string;
  };
  tabsProps?: React.ComponentProps<typeof Tabs>;
  tabProps?: React.ComponentProps<typeof StyledTab>;
}

const CustomTabs: React.FC<TabsProps> = ({
  tabs,
  initialTabKey,
  activeTabKey,
  onTabChange,
  styles = {},
  tabsProps = {},
  tabProps = {},
  ...props
}) => {
  const getIndexFromKey = (key: string | undefined): number =>
    key ? tabs.findIndex((t) => t.tabKey === key) : -1;

  const defaultKey = initialTabKey ?? tabs[0]?.tabKey;
  const [activeKey, setActiveKey] = useState<string>(
    activeTabKey ?? defaultKey
  );

  // Keep internal state in sync when the controlled key changes
  useEffect(() => {
    if (activeTabKey && activeTabKey !== activeKey) {
      setActiveKey(activeTabKey);
    }
  }, [activeTabKey, activeKey]);

  const handleTabChange = (
    _event: React.SyntheticEvent,
    newIndex: number
  ): void => {
    const key = tabs[newIndex]?.tabKey;
    if (!key) return;
    setActiveKey(key);
    onTabChange?.(key);
  };

  const activeIndex = getIndexFromKey(activeKey);

  return (
    <CustomTabsMainContainer {...props}>
      {/* Tabs Container */}
      <StyledTabs
        value={activeIndex}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons
        styles={styles}
        {...tabsProps}
      >
        {tabs.map((tab) => (
          <StyledTab
            key={tab.tabKey}
            label={
              <StyledTabLabel isActive={tab.tabKey === activeKey}>
                {tab.tabKey === activeKey && <IconStyling visible />}
                <TabsLabel isActive={tab.tabKey === activeKey}>
                  {tab.label}
                </TabsLabel>
              </StyledTabLabel>
            }
            isActive={tab.tabKey === activeKey}
            disabled={tab.disabled}
            {...{ ...tabProps, styles }}
          />
        ))}
      </StyledTabs>

      <Box>
        {tabs[activeIndex]?.content ?? (
          <CustomTabsNoDataBox>
            <img src={backgroundImage} alt="" />
            <CustomTabsNoDataText>{NO_DATA_TO_SHOW}</CustomTabsNoDataText>
          </CustomTabsNoDataBox>
        )}
      </Box>
    </CustomTabsMainContainer>
  );
};

export default CustomTabs;
