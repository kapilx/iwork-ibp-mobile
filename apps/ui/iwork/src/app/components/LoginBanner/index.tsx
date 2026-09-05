import React, { useState, useEffect, useRef } from "react";
import {
  ContentWrapper,
  LeftPanel,
  PresenceText,
  QuoteBox,
  RootContainer,
  Section,
  SectionSubtitle,
  LoginBannerSectionTitle,
  TrustStats,
  ServiceCardContainer,
  StatsCounterContainer,
  StatsCounterIcon,
  StatsCounterValue,
  StatsCounterLabel,
  ValueItemContainer,
  ValueItemIcon,
  ValueItemLabel,
  BannerContainer,
  BannerIcon,
  BannerTitle,
  BannerDescription,
  BannerContent,
  OfflineMessageContainer,
  MainTitle,
  CarouselArrowIcon,
  CarouselArrowButton,
  ScrollButton,
  ScrollIconWrapper,
  ScrollButtonWrapper,
  CarouselWrapper,
  ScrollIconlabel,
} from "./styles";
import { banners, services, stats, values } from "./LoginConfig";
import loginScrollIcon from "../../assets/svgs/scroll-icon-down.svg";
// ServiceCard Component
interface ServiceCardProps {
  title: string;
  icon?: string;
}
const ServiceCard: React.FC<ServiceCardProps> = ({ title, icon }) => (
  <ServiceCardContainer>
    <div>
      {icon && <span>{icon}</span>}
      <p>{title}</p>
    </div>
  </ServiceCardContainer>
);

// StatsCounter Component
interface StatsCounterProps {
  icon: string;
  value: string;
  label: string;
}
const StatsCounter: React.FC<StatsCounterProps> = ({ icon, value, label }) => (
  <StatsCounterContainer>
    <StatsCounterIcon>{icon}</StatsCounterIcon>
    <StatsCounterValue>{value}</StatsCounterValue>
    <StatsCounterLabel>{label}</StatsCounterLabel>
  </StatsCounterContainer>
);

// ValueItem Component
interface ValueItemProps {
  icon: string;
  label: string;
}
const ValueItem: React.FC<ValueItemProps> = ({ icon, label }) => (
  <ValueItemContainer>
    <ValueItemIcon>{icon}</ValueItemIcon>
    <ValueItemLabel>{label}</ValueItemLabel>
  </ValueItemContainer>
);

// Banner Component
interface BannerProps {
  title: string;
  description: string;
  icon?: string;
}
const Banner: React.FC<BannerProps> = ({ title, description, icon }) => (
  <BannerContainer>
    <BannerContent>
      {icon && <BannerIcon>{icon}</BannerIcon>}
      <div>
        <BannerTitle>{title}</BannerTitle>
        <BannerDescription>{description}</BannerDescription>
      </div>
    </BannerContent>
  </BannerContainer>
);

// Carousel for Banners
const BannerCarousel: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const bannerCount = banners.length;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bannerCount);
    }, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bannerCount]);

  const goNext = () => setCurrent((prev) => (prev + 1) % bannerCount);
  const goPrev = () =>
    setCurrent((prev) => (prev - 1 + bannerCount) % bannerCount);

  return (
    <CarouselWrapper>
      <div>
        <Banner {...banners[current]} />
        <CarouselArrowButton aria-label="Previous banner" onClick={goPrev} left>
          <CarouselArrowIcon>
            {" "}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2b2b2b"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5"></path>
              <path d="M11 6l-6 6 6 6"></path>
            </svg>
          </CarouselArrowIcon>
        </CarouselArrowButton>
        <CarouselArrowButton aria-label="Next banner" onClick={goNext} right>
          <CarouselArrowIcon>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2b2b2b"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="M13 6l6 6-6 6"></path>
            </svg>
          </CarouselArrowIcon>
        </CarouselArrowButton>
      </div>
    </CarouselWrapper>
  );
};

// OfflineMessage Component
interface OfflineMessageProps {
  isOffline: boolean;
}
const OfflineMessage: React.FC<OfflineMessageProps> = ({ isOffline }) =>
  isOffline ? (
    <OfflineMessageContainer>
      You are offline. Some features may not be available.
    </OfflineMessageContainer>
  ) : null;

// useIsMobile Hook
const useIsMobile = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
};

// Main LoginBanner Component
const LoginBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const isMobile = useIsMobile();
  // Ref for scrolling
  const rootRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOnlineStatus);
    setIsOffline(!navigator.onLine);
    return () => {
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOnlineStatus);
    };
  }, []);
  // Show scroll button only when not at bottom
  useEffect(() => {
    const handleScroll = () => {
      if (!rootRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = rootRef.current;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setIsAtBottom(atBottom);
    };

    const ref = rootRef.current;
    if (ref) {
      ref.addEventListener("scroll", handleScroll, { passive: true });
      handleScroll();
    }
    return () => {
      if (ref) ref.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <RootContainer ref={rootRef} data-login-root>
      <LeftPanel isMobile={isMobile}>
        <ContentWrapper>
          <Section>
            <MainTitle isMobile={isMobile}>
              TRUSTED INSURANCE BROKING PARTNER
            </MainTitle>
            <SectionSubtitle>
              India Insure is India's foremost insurance broker, licensed by
              IRDAI.
            </SectionSubtitle>
          </Section>

          <Section>
            <BannerCarousel />
          </Section>

          <Section>
            <LoginBannerSectionTitle>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F6A700"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  data-lov-id="src/pages/Login.tsx:270:14"
                  data-lov-name="Shield"
                  data-component-path="src/pages/Login.tsx"
                  data-component-line="270"
                  data-component-file="Login.tsx"
                  data-component-name="Shield"
                  data-component-content="%7B%22className%22%3A%22h-5%20w-5%20text-deep-mustard%22%7D"
                >
                  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                </svg>{" "}
              </span>
              Our Expertise
            </LoginBannerSectionTitle>
            <SectionSubtitle>
              We stand as a strategic partner in guiding businesses through the
              intricacies of insurance with precision and expertise.
            </SectionSubtitle>
            <QuoteBox>
              <span>
                "Trusted by 2000+ corporates for clarity and care in insurance
                solutions."
              </span>
            </QuoteBox>
          </Section>

          <Section>
            <LoginBannerSectionTitle>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F6A700"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  data-lov-id="src/pages/Login.tsx:287:14"
                  data-lov-name="CheckCircle"
                  data-component-path="src/pages/Login.tsx"
                  data-component-line="287"
                  data-component-file="Login.tsx"
                  data-component-name="CheckCircle"
                  data-component-content="%7B%22className%22%3A%22h-5%20w-5%20text-deep-mustard%22%7D"
                >
                  <path d="M21.801 10A10 10 0 1 1 17 3.335"></path>
                  <path d="m9 11 3 3L22 4"></path>
                </svg>
              </span>
              Our Values
            </LoginBannerSectionTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
              }}
            >
              {values.map((value, index) => (
                <ValueItem key={index} {...value} />
              ))}
            </div>
          </Section>

          <Section>
            <LoginBannerSectionTitle>
              <span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#F6A700"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#F6A700]" // or use "text-deep-mustard" if it's defined in Tailwind config
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              Our Services
            </LoginBannerSectionTitle>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.75rem",
              }}
            >
              {services.map((service, index) => (
                <ServiceCard key={index} {...service} />
              ))}
            </div>
          </Section>

          <Section>
            <LoginBannerSectionTitle>Trust Stats</LoginBannerSectionTitle>
            <TrustStats>
              {stats.map((stat, index) => (
                <StatsCounter key={index} {...stat} />
              ))}
            </TrustStats>
            <PresenceText>
              <span>Presence:</span> Bengaluru, Chennai, Hyderabad, Mumbai,
              Pune, Delhi
            </PresenceText>
          </Section>
        </ContentWrapper>
      </LeftPanel>
      <OfflineMessage isOffline={isOffline} />
      <ScrollButton
        aria-label={isAtBottom ? "Scroll to top" : "Scroll to bottom"}
        onClick={() => {
          if (rootRef.current) {
            rootRef.current.scrollTo({
              top: isAtBottom ? 0 : rootRef.current.scrollHeight,
              behavior: "smooth",
            });
          }
        }}
      >
        <ScrollButtonWrapper aria-label="Scroll icon wrapper" bottomRight>
          <ScrollIconWrapper
            src={loginScrollIcon}
            alt="Scroll icon"
            rotate={isAtBottom}
          />
          <ScrollIconlabel>Scroll</ScrollIconlabel>
        </ScrollButtonWrapper>
      </ScrollButton>
    </RootContainer>
  );
};

export default LoginBanner;
