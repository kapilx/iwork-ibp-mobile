import React from 'react';
import {
    Container,
    Breadcrumb,
    BreadcrumbArrow,
    BreadcrumbText,
    FlyingBirds,
    Content,
    IllustrationContainer,
    IllustrationImage,
    Divider,
    Title,
    Subtitle,
    SubtitleLink
} from './styles';
import DefaultBackgroundImage from "../../assets/pngs/no-claims-background-image.png";
import ArrowIcon from "../../assets/svgs/accordion-arrow.svg";
import FlyingBirdsIcon from "../../assets/svgs/flying-birds.svg";
import { sanitizeUrl } from "@ui/ui-lib/utils/sanitizeUrl";


interface NoDataPageProps {
    breadcrumbText?: string;
    title: string;
    subtitle: string;
    onBreadcrumbClick?: () => void;
    backgroundImage?: string;
    showFlyingBirds?: boolean;
    showDivider?: boolean;
    linkText?: string;
    linkHref?: string;
    compactView?: boolean;
    openLinkInNewTab?: boolean;
    removeMaxWidth?: boolean;
}

/**
 * NoDataPage Component
 * 
 * A responsive empty state page that displays when no data is found.
 * Features a centered illustration with customizable title and subtitle text.
 * 
 * @param props - Component properties
 * @returns JSX Element representing the no data page
 */
const NoDataPage: React.FC<NoDataPageProps> = ({
    breadcrumbText,
    title,
    subtitle,
    onBreadcrumbClick,
    backgroundImage = DefaultBackgroundImage,
    showFlyingBirds = true,
    showDivider = true,
    linkText,
    linkHref,
    compactView = false,
    openLinkInNewTab = false,
    removeMaxWidth=false
}) => {
    const renderSubtitle = () => {
        if (linkText && linkHref && subtitle.includes(linkText)) {
            const parts = subtitle.split(linkText);
            return (
                <Subtitle>
                    {parts[0]}
                    <SubtitleLink 
                        href={sanitizeUrl(linkHref)}
                        target={openLinkInNewTab ? "_blank" : "_self"}
                        rel={openLinkInNewTab ? "noopener noreferrer" : undefined}
                    >
                        {linkText}
                    </SubtitleLink>
                    {parts[1]}
                </Subtitle>
            );
        }
        return <Subtitle>{subtitle}</Subtitle>;
    };

    return (
        <Container compactView={compactView}>
            {breadcrumbText && (
                <Breadcrumb onClick={onBreadcrumbClick}>
                    <BreadcrumbArrow src={ArrowIcon} alt="Back" />
                    <BreadcrumbText>{breadcrumbText}</BreadcrumbText>
                </Breadcrumb>
            )}
            
            <Content>
                <IllustrationContainer removeMaxWidth={removeMaxWidth}>
                    {showFlyingBirds && <FlyingBirds src={FlyingBirdsIcon} alt="Flying birds" />}
                    <IllustrationImage 
                        src={backgroundImage} 
                        alt="No data illustration"
                    />
                </IllustrationContainer>
                
                {showDivider && <Divider />}
                
                <Title>{title}</Title>
                
                {renderSubtitle()}
            </Content>
        </Container>
    );
};

export default NoDataPage;
