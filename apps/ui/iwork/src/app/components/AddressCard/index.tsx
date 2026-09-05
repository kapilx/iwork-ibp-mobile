import { GOOGLE_MAPS_LINK } from "@ui/ui-lib";
// components/AddressCard.tsx
import React from "react";
import locationIcon from "../../assets/svgs/location-icon.svg";
import mobileIcon from "../../assets/svgs/phone-icon.svg";
import mailIcon from "../../assets/svgs/mail-icon.svg";
import phoneIcon from "../../assets/svgs/mobile-icon.svg";
import editIcon from "../../assets/svgs/edit-icon.svg";
import locationThumbnail from "../../assets/pngs/map.png";
import {
  AddressContactDetails,
  AddressContent,
  Card,
  CardContent,
  EditIconButton,
  Header,
  InfoRow,
  MailText,
  MapImage,
  MapLink,
} from "./styles";
import { Tooltip } from "@mui/material";

type AddressCardProps = {
  data: {
    location: string;
    address: string;
    mobile: string;
    landline: string;
    supportNumber: string;
    email: string;
    branchType?: string | null;
    branchName?: string | null;
  };
  onEdit?: () => void;
};

const AddressCard: React.FC<AddressCardProps> = ({ data, onEdit }) => {
  const { location, address, mobile, landline, supportNumber, email, branchType, branchName } = data;

  return (
    <Card data-testid="address-card">
      {onEdit && (
        <Tooltip title="Edit branch" arrow>
          <EditIconButton
            type="button"
            onClick={onEdit}
            data-testid="address-card-edit"
            aria-label="Edit branch"
          >
            <img src={editIcon} alt="Edit" />
          </EditIconButton>
        </Tooltip>
      )}
      <CardContent>
        <Header variant="subtitle1">
          <img src={locationIcon} alt="Location" />
          {location}
        </Header>

        <Tooltip title={address} arrow>
          <AddressContent>{address}</AddressContent>
        </Tooltip>
        <AddressContactDetails>
          {branchName && <InfoRow>{branchName}</InfoRow>}
          {branchType && <InfoRow>{branchType}</InfoRow>}
          <Tooltip title="Phone Number" arrow>
            <InfoRow>
              <img src={mobileIcon} alt="Mobile" />
              {mobile}
            </InfoRow>
          </Tooltip>

          <Tooltip title="Alt. Phone Number" arrow>
            <InfoRow>
              <img src={phoneIcon} alt="Landline" />
              {landline}
            </InfoRow>
          </Tooltip>

          <Tooltip title="Support Phone Number" arrow>
            <InfoRow>
              <img src={phoneIcon} alt="Support" />
              {supportNumber}
            </InfoRow>
          </Tooltip>

          <InfoRow>
            <img src={mailIcon} alt="Email" />
            <MailText>{email}</MailText>
          </InfoRow>
        </AddressContactDetails>
      </CardContent>
      <MapLink
        href={`${GOOGLE_MAPS_LINK}${encodeURIComponent(address)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MapImage src={locationThumbnail} alt="Map" />
      </MapLink>
    </Card>
  );
};

export default AddressCard;
