import { ContentContainer, MainContainer, TitleTypography } from "./styles";

export interface EndorsementProcessDataCardProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
  styling?: React.ComponentProps<any>["style"];
}

const EndorsementProcessDataCard: React.FC<EndorsementProcessDataCardProps> = ({
  children,
  title,
  styling,
}) => {
  return (
    <MainContainer
      styling={{ ...styling }}
      role="endorsement-process-data-card"
    >
      <TitleTypography>{title}</TitleTypography>
      <ContentContainer>{children}</ContentContainer>
    </MainContainer>
  );
};

export default EndorsementProcessDataCard;
