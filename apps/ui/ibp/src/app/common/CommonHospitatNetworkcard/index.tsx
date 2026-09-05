import {
  Container,
  FooterContainer,
  HeaderTypography,
  LocationContainer,
  LocationImage,
  LocationTypography,
  MainContainer,
  MobileContainer,
  MobileTypography,
  ActionButton,
  ActionIcon,
} from "./styles";
import LocationIcon from "../../assets/svgs/location-icon.svg";
import TelePhoneIcon from "../../assets/svgs/telephone-icon.svg";
import RightArrowIcon from "../../assets/svgs/navigation-arrow.svg";

export interface HospitalNetworkCardProps {
  hospitalName: string;
  location: string;
  mobile: string;
  onMapClick?: () => void;
}

const HospitalNetworkCard: React.FC<HospitalNetworkCardProps> = ({
  hospitalName,
  location,
  mobile,
  onMapClick,
}) => {
  return (
    <Container data-testid="ibp-hospital-network-card" onClick={onMapClick}>
      <MainContainer>
        <HeaderTypography title={hospitalName}>{hospitalName}</HeaderTypography>
        <LocationContainer title={location}>
          <LocationImage src={LocationIcon} alt="Location Icon" />
          <LocationTypography onClick={onMapClick}>{location}</LocationTypography>
        </LocationContainer>
        <MobileContainer>
          <img src={TelePhoneIcon} alt="telephone Icon" />
           <MobileTypography>{(String(mobile ?? "").match(/\d/g) ?? []).length >= 5 ? mobile : "Not Available"}</MobileTypography>
        </MobileContainer>
      </MainContainer>
      <FooterContainer>
        <ActionButton type="button" onClick={onMapClick} aria-label="View on map">
          <ActionIcon src={RightArrowIcon} alt="View on Map" />
        </ActionButton>
      </FooterContainer>
    </Container>
  );
};

export default HospitalNetworkCard;
