
import React, { useEffect, useRef } from "react";
import {
  ResultsContainer,
  NoResultsText,
  HospitalCardsContainer,
  CardsContainer,
  Loader,
} from "./styles";
import { CircularProgress } from "@mui/material";
import CommonHospitalNetworkCard from "../../../common/CommonHospitatNetworkcard";
import { HOSPITAL_CARDS } from "../../../constants";

interface HospitalNetworkProps {
  hospitals: any[];
  totalCount: number;
  hasMore: boolean;
  onLoadMore: () => void;
  onShowOnMap: (hospital: any) => void;
  activeTab: string;
  isLoading: boolean;
  isFetching: boolean;
}

const HospitalNetwork: React.FC<HospitalNetworkProps> = ({
  hospitals,
  totalCount,
  hasMore,
  onLoadMore,
  onShowOnMap,
  activeTab,
  isLoading,
  isFetching,
}) => {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const requestLockRef = useRef(false);
  const hasUserScrolledRef = useRef(false);

  useEffect(() => {
    if (!isFetching && !isLoading) {
      requestLockRef.current = false;
    }
  }, [isFetching, isLoading]);

  // Reset requestLockRef after hospitals.length changes (new data loaded)
  useEffect(() => {
    requestLockRef.current = false;
  }, [hospitals.length]);
    // Fallback: If content does not fill the viewport and hasMore is true, trigger onLoadMore
    useEffect(() => {
      if (
        hasMore &&
        !isLoading &&
        !isFetching &&
        hospitals.length > 0 &&
        hospitals.length < totalCount &&
        !requestLockRef.current
      ) {
        // Check if content is not scrollable (page height <= window height)
        const docHeight = document.documentElement.scrollHeight;
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        if (docHeight <= windowHeight + 10) {
          requestLockRef.current = true;
          // eslint-disable-next-line no-console
          console.log('onLoadMore fallback triggered due to short content. hospitals.length:', hospitals.length, 'hasMore:', hasMore);
          onLoadMore();
        }
      }
    }, [hasMore, isLoading, isFetching, hospitals.length, totalCount, onLoadMore]);
  // Window scroll event for infinite scroll
  useEffect(() => {
    if (!hasMore || isLoading || isFetching) return;

    const handleWindowScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const docHeight = document.documentElement.scrollHeight;
      // Trigger when user is within 200px of bottom
      if (docHeight - (scrollTop + windowHeight) < 200) {
        if (requestLockRef.current) return;
        requestLockRef.current = true;
        
        onLoadMore();
      }
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [hasMore, isLoading, isFetching, hospitals.length, onLoadMore]);

  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        hasUserScrolledRef.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

    // Remove IntersectionObserver logic (now handled by window scroll)

  return (
    <HospitalCardsContainer data-testid="ibp-hospital-cards-container">
      {isLoading && hospitals.length === 0 ? (
        <Loader>
          <CircularProgress />
        </Loader>
      ) : (
        <>
          <CardsContainer>
            {hospitals.length > 0 ? (
              <ResultsContainer>
                {hospitals.map((hospital, index) => {
                  const address = Array.isArray(hospital?.addresses)
                    ? hospital.addresses[0]
                    : hospital?.addresses;

                  const locationParts = [
                    address?.addressLine1,
                    address?.addressLine2,
                    address?.landmark,
                    address?.cityName,
                    address?.stateName,
                    address?.pinCode,
                    address?.countryName,
                  ].filter(Boolean);

                  const addressLocation =
                  locationParts.length > 0 ? locationParts.join(", ") : "";
                  const location =
                    addressLocation || "Address not available";
                  const phone =
                    address?.phoneNumber || address?.alternatePhoneNumber || "NA";
                  return (
                    <CommonHospitalNetworkCard
                      key={`${hospital.name}-${index}`}
                      hospitalName={hospital.name ?? "NA"}
                      location={location ?? "NA"}
                      mobile={phone}
                      onMapClick={() => onShowOnMap(hospital)}
                    />
                  );
                })}
              </ResultsContainer>
            ) : !isFetching && totalCount === 0 ? (
              <NoResultsText variant="body1">
                {HOSPITAL_CARDS.NO_RESULTS}
              </NoResultsText>
            ) : null}
          </CardsContainer>

          <div ref={sentinelRef} />
          {(isLoading || isFetching) && hospitals.length > 0 && (
            <Loader>
              <CircularProgress size={24} />
            </Loader>
          )}
         
        </>
      )}
    </HospitalCardsContainer>
  );
};

export default HospitalNetwork;
