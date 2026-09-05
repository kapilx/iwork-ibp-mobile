import React, { useEffect, useRef, useState } from "react";
import {
  EnrollmentBannerButton,
  EnrollmentBannerCardWrapper,
  EnrollmentBannerContentBanner,
  EnrollmentBannerHeader,
  EnrollmentBannerSubheader,
  EnrollmentBannerText,
  BorderAnimationSvg,
} from "./styles";
import { useNavigate } from "react-router-dom";

interface EnrollmentBannerCardProps {
  header: string;
  subheader: string;
  buttonText: string;
  background: string;
  onButtonClick?: () => void;
  border?: string;
}

const EnrollmentBannerCard: React.FC<EnrollmentBannerCardProps> = ({
  header,
  subheader,
  buttonText,
  background,
  onButtonClick,
  border,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [showBorder, setShowBorder] = useState(false);
  const navigate = useNavigate();
  /* Trigger animation once on view */
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowBorder(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.5,
        rootMargin: "-20% 0px -20% 0px",
      },
    );

    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  /* Hide border after animation completes */
  useEffect(() => {
    if (!showBorder) return;

    const timer = setTimeout(() => {
      setShowBorder(false);
    }, 4500);

    return () => clearTimeout(timer);
  }, [showBorder]);

  return (
    <EnrollmentBannerCardWrapper ref={cardRef}>
      {showBorder && (
        <BorderAnimationSvg viewBox="0 0 1000 300" preserveAspectRatio="none">
          <defs>
            <linearGradient
              id="tealGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor="rgba(0, 0, 0, 0.9)" />
              <stop offset="50%" stopColor="rgba(0, 0, 0, 1)" />
              <stop offset="100%" stopColor="rgba(0, 0, 0, 0.9)" />
            </linearGradient>
          </defs>

          <rect x="2" y="2" width="996" height="296" />
        </BorderAnimationSvg>
      )}

      <EnrollmentBannerContentBanner background={background} border={border}>
        <EnrollmentBannerText>
          <EnrollmentBannerHeader>{header}</EnrollmentBannerHeader>
          <EnrollmentBannerSubheader>{subheader}</EnrollmentBannerSubheader>
        </EnrollmentBannerText>

        <EnrollmentBannerButton
          onClick={
            onButtonClick
              ? onButtonClick
              : () => navigate("/unified-enrollment")
          }
        >
          {buttonText}
        </EnrollmentBannerButton>
      </EnrollmentBannerContentBanner>
    </EnrollmentBannerCardWrapper>
  );
};

export default EnrollmentBannerCard;
