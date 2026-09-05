import React from "react";
import { CardBackground } from "../CardBackground/styles";
import CommonDetailsSection from "../CommonDetailsSection";
import ThumbnailContainer from "../ThumbnailContainer";
import { ProfileContainer } from "../ProfileSection/style";

const StrategySection: React.FC<any> = ({ profile, data }) => {
  const { website } = data;

  return (
    <ProfileContainer>
      <CardBackground>
        <CommonDetailsSection
          sections={profile}
          data={data}
          data-testid="company-profile"
        />
      </CardBackground>

      <ThumbnailContainer
        thumbnails={profile?.[0].thumbnails}
        website={website}
        companyName={data.companyName}
      ></ThumbnailContainer>
    </ProfileContainer>
  );
};

export default StrategySection;
