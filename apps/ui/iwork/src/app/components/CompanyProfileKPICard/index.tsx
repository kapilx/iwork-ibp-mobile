// KPICard.tsx
import React from "react";
import { Box, Typography, Link } from "@mui/material";
import { styled } from "@mui/system";
import { sanitizeUrl } from "@ui/ui-lib";
import kpiCardIcon from "../../assets/svgs/kpi-card-icon.svg";
import {
  Container,
  ContainerBackgroundImage,
  CustomDivider,
  Footer,
  FooterLinks,
  FooterLinkStyled,
  Grid,
  Heading,
  HeadingContainer,
  InfoText,
  KPIItem,
  Label,
  Value,
} from "./styles";

// Types
type KPI = {
  label: string;
  value: string;
  hoverValue?: string;
};

type FooterLink = {
  text: string;
  url: string;
};

type KPICardProps = {
  data: {
    kpis: KPI[];
    footerLinks: FooterLink[];
    infoText: string;
    heading: string;
    backgroundImageLink: string;
  };
};

// Component
const KPICard: React.FC<KPICardProps> = ({ data }) => {
  return (
    <Container>
      <HeadingContainer>
        <img src={kpiCardIcon} alt="KPI Icon" style={{ marginBottom: 16 }} />
        <Heading variant="h6">{data?.heading}</Heading>
      </HeadingContainer>
      <Grid>
        {data.kpis.map((item, index) => (
          <KPIItem key={index}>
            <Value title={item.hoverValue}>{item.value}</Value>
            <Label>{item.label}</Label>
          </KPIItem>
        ))}
      </Grid>

      {/* <CustomDivider /> */}

      <Footer>
        <InfoText>{data.infoText}</InfoText>
        <FooterLinks>
          {data.footerLinks.map((link, index) => (
            <FooterLinkStyled key={index} href={sanitizeUrl(link.url)}>
              {link.text}
            </FooterLinkStyled>
          ))}
        </FooterLinks>
      </Footer>
      <ContainerBackgroundImage
        src={data?.backgroundImageLink}
        alt="KPI Background"
      />
    </Container>
  );
};

export default KPICard;
