import React from 'react';
import { Heart, Umbrella, Car, Plane, ArrowRight, CheckCircle2 } from 'lucide-react';
import { ArrowForward } from '@mui/icons-material';
import { LANDING_PERSONAL_INSURANCE } from '../../../constants';
import {
    SectionContainer,
    ContentWrapper,
    HeaderSection,
    Badge,
    Title,
    Subtitle,
    ProductsGrid,
    ProductCard,
    IconContainer,
    ProductTitle,
    ProductDescription,
    QuoteLink,
    TrustStrip,
    TrustBadges,
    TrustBadge,
    AdvisorButton,
} from './styles';

const productIcons = [Heart, Umbrella, Car, Plane];
const productGradients = [
    'linear-gradient(135deg, #e91e63 0%, #f06292 100%)',
    'linear-gradient(135deg, #3949ab 0%, #5c6bc0 100%)',
    'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
    'linear-gradient(135deg, #00695c 0%, #26a69a 100%)',
];

export const PersonalInsuranceSection: React.FC = () => {
    return (
        <SectionContainer>
            <ContentWrapper>
                <HeaderSection
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <Badge>{LANDING_PERSONAL_INSURANCE.BADGE}</Badge>
                    <Title>{LANDING_PERSONAL_INSURANCE.TITLE}</Title>
                    <Subtitle>{LANDING_PERSONAL_INSURANCE.SUBTITLE}</Subtitle>
                </HeaderSection>

                <ProductsGrid>
                    {LANDING_PERSONAL_INSURANCE.PRODUCTS.map((product, index) => {
                        const Icon = productIcons[index];
                        return (
                            <ProductCard
                                key={product.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                            >
                                <IconContainer gradient={productGradients[index]}>
                                    <Icon size={24} />
                                </IconContainer>
                                <ProductTitle>{product.title}</ProductTitle>
                                <ProductDescription>{product.description}</ProductDescription>
                                <QuoteLink>
                                    {LANDING_PERSONAL_INSURANCE.CTA_CARD}
                                    <ArrowRight size={16} />
                                </QuoteLink>
                            </ProductCard>
                        );
                    })}
                </ProductsGrid>

                <TrustStrip
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <TrustBadges>
                        {LANDING_PERSONAL_INSURANCE.TRUST_BADGES.map((badge) => (
                            <TrustBadge key={badge}>
                                <CheckCircle2 size={18} color="#4caf50" />
                                {badge}
                            </TrustBadge>
                        ))}
                    </TrustBadges>
                    <AdvisorButton endIcon={<ArrowForward />}>
                        {LANDING_PERSONAL_INSURANCE.CTA_ADVISOR}
                    </AdvisorButton>
                </TrustStrip>
            </ContentWrapper>
        </SectionContainer>
    );
};
