import React from "react";
import { Box, IconButton } from "@mui/material";
import CircleIcon from "../../../app/assets/svgs/circleIcon.svg";
import {
  CircleIconBlue,
  TabContainer,
  TabTypography,
  VersionTabsContainer,
  AddVersionIcon,
  VersionTab,
  VersionInputBase,
  EditIcon,
  StyledIconButton,
  StyledTabs,
} from "./styles";
import AddNewIcon from "../../../app/assets/svgs/addNew.svg";
import VersionEditIcon from "../../../app/assets/svgs/icons8-edit.svg";
import { ADD_NEW_VERSION } from "../../constants";
export interface TabData {
  id: string;
  label: string;
  isEditing: boolean;
  values: Record<string, any> | null;
  /** Flag to indicate unsaved changes for the tab */
  isDirty?: boolean;
  defaultVersionName?: string;
  versionId?: number;
}

interface VersionTabsProps {
  tabs: TabData[];
  setTabs: React.Dispatch<React.SetStateAction<TabData[]>>;
  selectedTab: string;
  setSelectedTab: React.Dispatch<React.SetStateAction<string>>;
  enableAddTab?: boolean;
  onBeforeTabChange?: (fromTabId: string, toTabId: string) => Promise<boolean>;
  onAddTab?: () => void;
  enableEditTab: boolean;
}

const VersionTabs: React.FC<VersionTabsProps> = ({
  tabs,
  setTabs,
  selectedTab,
  setSelectedTab,
  enableAddTab = true,
  onBeforeTabChange,
  onAddTab,
  enableEditTab = true,
}) => {
  const handleAddTabClick = () => {
    if (onAddTab) {
      onAddTab(); // delegate to parent
    }
  };

  const handleTabChange = async (
    event: React.SyntheticEvent,
    newValue: string
  ) => {
    if (newValue === selectedTab) return;

    if (onBeforeTabChange) {
      const canSwitch = await onBeforeTabChange(selectedTab, newValue);
      if (!canSwitch) return;
    }

    setSelectedTab(newValue);
  };

  const handleLabelDoubleClick = (tabId: string) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, isEditing: true } : tab))
    );
  };

  const handleLabelChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    tabId: string
  ) => {
    const newLabel = e.target.value;
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === tabId
          ? { ...tab, label: newLabel, isDirty: true }
          : tab
      )
    );
  };

  const handleLabelBlur = (tabId: string) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === tabId ? { ...tab, isEditing: false } : tab))
    );
  };

  return (
    <Box>
      <VersionTabsContainer>
        <StyledTabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab) => (
            <VersionTab
              key={tab.id}
              value={tab.id}
              label={
                tab.isEditing ? (
                  <VersionInputBase
                    value={tab.label}
                    onChange={(e) =>
                      handleLabelChange(
                        e as React.ChangeEvent<HTMLInputElement>,
                        tab.id
                      )
                    }
                    onBlur={() => handleLabelBlur(tab.id)}
                    autoFocus
                  />
                ) : (
                  <TabContainer>
                    {tab.id === selectedTab && (
                      <CircleIconBlue src={CircleIcon} />
                    )}
                    <TabTypography selected={tab.id === selectedTab}>
                      {tab.label}
                    </TabTypography>
                    {enableEditTab && (
                      <EditIcon
                        src={VersionEditIcon}
                        onClick={() => handleLabelDoubleClick(tab.id)}
                      />
                    )}
                  </TabContainer>
                )
              }
            />
          ))}
        </StyledTabs>
        {enableAddTab && (
          <IconButton onClick={handleAddTabClick} title={ADD_NEW_VERSION}>
            <AddVersionIcon src={AddNewIcon} />
          </IconButton>
        )}
        <StyledIconButton />
      </VersionTabsContainer>
    </Box>
  );
};

export default VersionTabs;
