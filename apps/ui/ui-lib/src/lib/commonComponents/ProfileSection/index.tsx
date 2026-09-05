import React from "react";
import { CardBackground } from "../CardBackground/styles";
import CommonDetailsSection from "../CommonDetailsSection";
import ThumbnailContainer from "../ThumbnailContainer";
import { ProfileContainer } from "./style";

const ProfileSection: React.FC<any> = ({ profile, companyData }) => {
  const { website } = companyData;
  return (
    <ProfileContainer>
      <CardBackground>
        <CommonDetailsSection
          sections={profile}
          data={companyData}
          data-testid="company-profile"
        />
      </CardBackground>
      {website && (
        <ThumbnailContainer
          thumbnails={profile[0].thumbnails}
          website={website}
          companyName={companyData.companyName}
        ></ThumbnailContainer>
      )}
    </ProfileContainer>
  );
};

export default ProfileSection;
