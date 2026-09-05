import React, { useRef, useState } from 'react';
import {
  BottomLeftImage,
  BottomMiddleContainer,
  BottomMidleRightImage,
  BottomRightImage,
  HospitalBottomSection,
  HospitalCenterSection,
  HospitalMainSection,
  HospitalTopLeftSectionContainer,
  HospitalTopLeftSectionImage,
  HospitalTopLeftSectionText,
  ResultsContainer,
  HospitalTopContainer,
  HorizontalLine,
  IconsContainer,
  CarIcon,
  HospitalIcon,
  TreeIcon,
  HospitalInputWrapper,
  HospitalTopWrapper,
  HospitalCenterSectionText,
  StyledSearchTextField
} from './styles';
import GsapTransitionComponent from './gsapComponent';
import { InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import clockIcon from '../../../assets/svgs/clock-image.svg';
import HospitalImage from '../../../assets/svgs/hospital-large-image.svg';
import treeImage from '../../../assets/svgs/tree-image.svg';
import carImage from '../../../assets/svgs/cars.svg';
import groupCarsImage from '../../assets/svgs/group-cars.svg';
import { useGSAP } from "@gsap/react";
import CommonHospitalNetworkCard from "../../common/CommonHospitatNetworkcard/index";
import { hospitalCardData } from './sampleJson';

const HospitalNetwork: React.FC = () => {
  const [isFocused, setFocused] = useState(false);
  const [showText, setShowText] = useState(true);
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const inputWrapperRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const bottomSectionRef = useRef<HTMLDivElement>(null);
  const iconsContainerRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLImageElement>(null);
  const groupedCarsRef = useRef<HTMLImageElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const horizontalLineRef = useRef<HTMLHRElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const onFocus = () => setFocused(true);
  const onBlur = () => setFocused(false);

  const filteredHospitals = hospitalCardData.filter((hospital) =>
    hospital.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  useGSAP(
    () => {
      if (isFocused) {
        setShowText(false);
        GsapTransitionComponent(bottomSectionRef, 'to', {}, { opacity: 0, duration: 0.5, ease: 'power3.out' });
        GsapTransitionComponent(inputWrapperRef, 'to', {}, { x: -80, y: -200, duration: 0.8, ease: 'power3.out' });
        GsapTransitionComponent(horizontalLineRef, 'fromTo', { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.5 });
        GsapTransitionComponent(carRef, 'fromTo', { x: -80 }, { x: 330, duration: 10, ease: "none", repeat: -1 });
      } else {
        GsapTransitionComponent(iconsContainerRef,'to', {}, { opacity: 0, duration: 0.5, ease: 'power3.out' });
        GsapTransitionComponent(inputWrapperRef, 'fromTo',{ y: -140, x: -80 },
          {
            y: 0,
            x: 0,
            duration: 0.6,
            ease: 'power3.inOut',
            onComplete: () => {
              setShowText(true);
              setTimeout(() => {
                GsapTransitionComponent(textRef,'fromTo', {opacity : 0}, { opacity: 1, duration: 1.7, ease: 'power3.out' });
                GsapTransitionComponent(bottomSectionRef,'fromTo', {opacity : 0}, {x: 0, y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' });
              }, 100);
            },
          }
        );
         GsapTransitionComponent(horizontalLineRef,'to', {}, { opacity: 0, duration: 0.3, ease: 'power3.out' });
      }
    },
    { dependencies: [isFocused] }
  );

  useGSAP(() => {
    if (isFocused && resultsRef.current) {
      GsapTransitionComponent(resultsRef, 'fromTo', { opacity: 0 }, { opacity: 1, duration: 1.0, ease: 'power3.out', delay: 0.8 });
    }
  }, { dependencies: [isFocused] });

  useGSAP(
    () => {
      if (isFocused) {
        GsapTransitionComponent(iconsContainerRef, 'fromTo', { opacity: 0 }, { opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.3 });
      }
    },
    { dependencies: [isFocused], scope: iconsContainerRef }
  );

  // Bottom grouped cars animation when not focused (same as top car animation)
  useGSAP(
    () => {
      if (!isFocused && groupedCarsRef.current) {
        // Grouped cars - continuous loop from left to completely off the right side
        // Starting from -524 (image width) to ensure it starts completely off-screen
        GsapTransitionComponent(groupedCarsRef, 'fromTo', { x: -524 }, { x: window.innerWidth + 100, duration: 18, ease: "none", repeat: -1 });
      }
    },
    { dependencies: [isFocused] }
  );


  return (
    <HospitalMainSection isFocused={isFocused}>
        <HospitalTopWrapper>
          <HospitalTopContainer>
            <HospitalTopLeftSectionContainer>
              <HospitalTopLeftSectionImage src={clockIcon} alt="clock" />
              <HospitalTopLeftSectionText>
                Hospital Network ({searchQuery ? filteredHospitals.length : hospitalCardData.length})
              </HospitalTopLeftSectionText>
            </HospitalTopLeftSectionContainer>
            {isFocused && (
              <IconsContainer ref={iconsContainerRef} style={{ opacity: 0 }}>
                <CarIcon ref={carRef} src={carImage} alt="Car" />
                <TreeIcon src={treeImage} alt="Tree" />
                <HospitalIcon src={HospitalImage} alt="Hospital" />
              </IconsContainer>
            )}
          </HospitalTopContainer>
          {/* {isFocused && <HorizontalLine ref={horizontalLineRef} style={{ opacity: 0 }} />} */}

          <HospitalCenterSection ref={searchWrapperRef}>
            <HospitalInputWrapper ref={inputWrapperRef}>
              {!isFocused && showText && (
                <HospitalCenterSectionText ref={textRef} style={{ opacity: 0 }}>
                  Search Hospital By cities
                </HospitalCenterSectionText>
              )}
              <StyledSearchTextField
                fullWidth
                placeholder="Ask anything you are looking for"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={onFocus}
                onBlur={(e) => {
                  if (!e.target.value) onBlur();
                }}
                autoComplete="off"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <SearchIcon sx={{ color: '#757575' }} />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
              />
            </HospitalInputWrapper>
          </HospitalCenterSection>
        </HospitalTopWrapper>

        {!isFocused && (
          <HospitalBottomSection ref={bottomSectionRef} style={{ opacity: 0 }}>
            <BottomLeftImage ref={groupedCarsRef} src={groupCarsImage} alt="grouped cars" />
            <BottomMiddleContainer>
              <BottomMidleRightImage src={treeImage} alt="tree" />
            </BottomMiddleContainer>
            <BottomRightImage src={HospitalImage} alt="hospital" />
          </HospitalBottomSection>
        )}

        {isFocused && (
          <ResultsContainer ref={resultsRef} style={{ opacity: 0 }}>
            {filteredHospitals.map((hospital, index) => (
              <CommonHospitalNetworkCard
                key={index}
                hospitalName={hospital.name}
                location={hospital.location}
                mobile={hospital.phone}
              />
            ))}
          </ResultsContainer>
        )}

    </HospitalMainSection>
  );
};
export default HospitalNetwork;
