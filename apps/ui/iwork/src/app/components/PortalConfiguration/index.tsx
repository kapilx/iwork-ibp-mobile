import React from "react";
import { Box, Stack } from "@mui/material";
import { CustomModal } from "@ui/ui-lib";
import {
  ContentHeading,
  ModalHeadingContainer,
  ModalLastUpdated,
  ModalMainHeading,
  ModalSubHeading,
  CardContainer,
  IconWrapper,
  InfoText,
  StatusText,
  ContentInfo,
  Description,
  ButtonsContainer,
  ConfigureButton,
  ViewButton,
  ConfigurationIcon,
} from "./styles";
import hospitalIcon from "../../assets/svgs/Calender.svg";

interface PortalConfigurationModalProps {
  open: boolean;
  handleClose: () => void;
  onConfigure: () => void;
  onView: () => void;
}

const PortalConfiguration: React.FC<PortalConfigurationModalProps> = ({
  open,
  handleClose,
  onConfigure,
  onView,
  //   configurationData,
}) => {
  const portalConfigurationData = {
    mainHeading: "Portal Configuration",
    subHeading: "Manage and configure portal modules",
    lastUpdated: "Last updated: 15 Dec 2024",
    contentHeading: "Network Hospitals (HNW)",
  };
  const configurationData = {
    totalStates: 25,
    totalExclusions: 96,
    lastUpdated: "15 Dec 2024",
    totalRecords: 121,
    status: "Active",
  };
  const isDataVisible = false; // Set to false to hide the data section
  const headingChildren = () => (
    <ModalHeadingContainer>
      <ModalMainHeading>{portalConfigurationData.mainHeading}</ModalMainHeading>
      <ModalSubHeading>{portalConfigurationData.subHeading}</ModalSubHeading>
      <ModalLastUpdated>
        {/* Last updated: {portalConfigurationData.lastUpdated} */}
      </ModalLastUpdated>
    </ModalHeadingContainer>
  );
  return (
    <CustomModal
      open={open}
      handleClose={handleClose}
      heading={headingChildren()}
      headingStyles={{ fontSize: "18px", fontWeight: 600 }}
      modalBoxStyles={{ width: "800px", padding: "24px" }}
    >
      <CardContainer>
        <IconWrapper>
          <ConfigurationIcon src={hospitalIcon} alt="hospital" />
        </IconWrapper>

        <ContentHeading>
          {portalConfigurationData.contentHeading}
        </ContentHeading>

        {isDataVisible && (
          <ContentInfo>
            <InfoText>
              {configurationData.totalStates} States /{" "}
              {configurationData.totalExclusions} Exclusions
            </InfoText>
            <Description>
              <ModalLastUpdated>
                Last updated: {configurationData.lastUpdated}
              </ModalLastUpdated>
              <ModalLastUpdated>
                Total Records: {configurationData.totalRecords} Hospitals
              </ModalLastUpdated>
              <ModalLastUpdated>
                Status:
                <StatusText>{configurationData.status}</StatusText>
              </ModalLastUpdated>
            </Description>
          </ContentInfo>
        )}

        <ButtonsContainer>
          <ConfigureButton onClick={onConfigure}>Configure</ConfigureButton>
          {<ViewButton onClick={onView}>View</ViewButton>}
        </ButtonsContainer>
      </CardContainer>
    </CustomModal>
  );
};

export default PortalConfiguration;
