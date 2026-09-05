import React, { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import CommonLoader from "../../common/CommonLoader";
import {
  MapContainer,
  MapActionButton,
  MapResultItem,
  MapResultMeta,
  MapResultName,
  MapResultTag,
  MapResultActions,
  MapResultsBody,
  MapResultsHeader,
  MapResultsHeaderActions,
  MapResultsHeaderTitle,
  MapResultsPanel,
  MapViewContainer,
  MapResultSubtitle,
  MapResultFooterRow,
} from "./styles";

interface Hospital {
  id?: number;
  name: string;
  latitude?: number | string;
  longitude?: number | string;
  location?: { lat?: number | string; lng?: number | string };
  lat?: number | string;
  lng?: number | string;
  distanceInMeters?: number;
  addresses: {
    addressLine1?: string;
    cityName?: string;
    stateName?: string;
    countryName?: string;
    pinCode?: string;
    phoneNumber?: string;
    alternatePhoneNumber?: string;
    latitude?: number;
    longitude?: number;
  } | Array<{
    addressLine1?: string;
    cityName?: string;
    stateName?: string;
    countryName?: string;
    pinCode?: string;
    phoneNumber?: string;
    alternatePhoneNumber?: string;
    latitude?: number;
    longitude?: number;
  }>;
}

interface HospitalMapViewProps {
  hospitals: Hospital[];
  isLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  actualUserLocation?: { lat: number; lng: number } | null;
  focusHospital?: Hospital | null;
  onRadiusChange?: (radiusKm: number) => void;
}

const GOOGLE_MAPS_API_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const HospitalMapView: React.FC<HospitalMapViewProps> = ({
  hospitals,
  isLoading,
  userLocation,
  actualUserLocation,
  focusHospital,
  onRadiusChange,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const markerMapRef = useRef<Map<string | number, google.maps.Marker>>(
    new Map(),
  );
  const lastRadiusRef = useRef<number | null>(null);
  const lastFocusedKeyRef = useRef<string | number | null>(null);
  const userInteractedRef = useRef(false);
  const initializingRef = useRef(true);
  const initialFitDoneRef = useRef(false);
  const prevUserLocationRef = useRef<{ lat: number; lng: number } | null>(
    null,
  );
  const forceFitRef = useRef(false);

  // Load Google Maps script
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError("Google Maps API key is missing");
      return;
    }

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        return Promise.resolve(window.google);
      }

      return new Promise<typeof google>((resolve, reject) => {
        const existingScript = document.querySelector(
          'script[src*="maps.googleapis.com"]',
        );
        if (existingScript) {
          existingScript.addEventListener("load", () => resolve(window.google));
          return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
        script.async = true;
        script.defer = true;
        script.onload = () => resolve(window.google);
        script.onerror = () => reject(new Error("Failed to load Google Maps"));
        document.head.appendChild(script);
      });
    };

    loadGoogleMaps()
      .then(() => {
        setMapInitialized(true);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  const getHospitalKey = (hospital: Hospital, index: number) =>
    hospital.id ?? `${hospital.name}-${index}`;

  const getHospitalAddress = (hospital: Hospital) => {
    if (Array.isArray(hospital.addresses)) {
      return hospital.addresses[0] || {};
    }
    return hospital.addresses || {};
  };

  const isSameHospital = (candidate: Hospital, target: Hospital) => {
    if (candidate?.id && target?.id) {
      return candidate.id === target.id;
    }
    const candidateAddress = getHospitalAddress(candidate);
    const targetAddress = getHospitalAddress(target);
    const candidateName = (candidate.name || "").toLowerCase();
    const targetName = (target.name || "").toLowerCase();
    return (
      candidateName === targetName &&
      (candidateAddress.addressLine1 || "") ===
        (targetAddress.addressLine1 || "") &&
      (candidateAddress.pinCode || "") === (targetAddress.pinCode || "")
    );
  };

  const formatDistance = (distanceInMeters?: number) => {
    if (!distanceInMeters) return null;
    const km = distanceInMeters / 1000;
    return `${km.toFixed(1)} km`;
  };

  const buildDirectionsUrl = (destination: string) => {
    const originLocation = actualUserLocation || userLocation;
    const origin =
      originLocation &&
      Number.isFinite(originLocation.lat) &&
      Number.isFinite(originLocation.lng)
        ? `&origin=${originLocation.lat},${originLocation.lng}`
        : "";
    return `https://www.google.com/maps/dir/?api=1${origin}&destination=${encodeURIComponent(
      destination,
    )}`;
  };

  const calculateRadiusKm = (bounds: google.maps.LatLngBounds) => {
    const center = bounds.getCenter();
    const ne = bounds.getNorthEast();

    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(ne.lat() - center.lat());
    const dLng = toRad(ne.lng() - center.lng());
    const lat1 = toRad(center.lat());
    const lat2 = toRad(ne.lat());

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) *
        Math.sin(dLng / 2) *
        Math.cos(lat1) *
        Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const focusHospitalOnMap = (hospital: Hospital, index: number) => {
    const key = getHospitalKey(hospital, index);
    const marker = markerMapRef.current.get(key);
    if (marker && mapInstanceRef.current) {
      const position = marker.getPosition();
      if (position) {
        mapInstanceRef.current.panTo(position);
        window.google?.maps?.event?.trigger(marker, "click");
      }
      return;
    }

    if (!mapInstanceRef.current || !window.google) return;

    const address = getHospitalAddress(hospital);
    const addressLat = address?.latitude;
    const addressLng = address?.longitude;
    if (addressLat != null && addressLng != null) {
      const position = {
        lat: Number(addressLat),
        lng: Number(addressLng),
      };

      const newMarker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: hospital.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#e53935",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 8,
        },
        label: {
          text: "H",
          color: "#ffffff",
          fontSize: "10px",
          fontWeight: "700",
        },
      });

      markerMapRef.current.set(key, newMarker);
      markersRef.current.push(newMarker);
      mapInstanceRef.current.panTo(position);
      return;
    }
    const addressParts = [
      address?.addressLine1,
      address?.cityName,
      address?.stateName,
      address?.pinCode,
      address?.countryName,
    ].filter(Boolean);

    if (addressParts.length === 0) return;

    const geocoder = new window.google.maps.Geocoder();
    const fullAddress = addressParts.join(", ");

    geocoder.geocode({ address: fullAddress }, (results, status) => {
      if (status !== "OK" || !results || !results[0]) return;
      const location = results[0].geometry.location;
      const position = { lat: location.lat(), lng: location.lng() };

      const newMarker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: hospital.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#e53935",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 8,
        },
        label: {
          text: "H",
          color: "#ffffff",
          fontSize: "10px",
          fontWeight: "700",
        },
      });

    markerMapRef.current.set(key, newMarker);
    markersRef.current.push(newMarker);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(position);
        window.google?.maps?.event?.trigger(newMarker, "click");
      }
    });
  };


  // Initialize map
  useEffect(() => {
    if (!mapInitialized || !userLocation || !mapRef.current) return;

    const google = window.google;
    if (!google || !google.maps) return;

    // Create map with styles to hide POI labels
    const map = new google.maps.Map(mapRef.current, {
      center: userLocation,
      zoom: 12,
      zoomControl: true,
      scrollwheel: true,
      gestureHandling: "greedy",
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      restriction: {
        latLngBounds: {
          north: 85,
          south: -85,
          west: -180,
          east: 180,
        },
        strictBounds: true,
      },
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
        {
          featureType: "poi.business",
          stylers: [{ visibility: "off" }],
        },
        {
          featureType: "transit",
          elementType: "labels.icon",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    mapInstanceRef.current = map;
    prevUserLocationRef.current = userLocation;
    forceFitRef.current = true;
    setMapReady(false);

    const markUserInteracted = () => {
      if (!initializingRef.current) {
        userInteractedRef.current = true;
      }
    };
    map.addListener("dragstart", markUserInteracted);
    map.addListener("zoom_changed", markUserInteracted);
    map.addListener("idle", () => {
      if (initializingRef.current) {
        initializingRef.current = false;
      }
    });

    const tilesListener = map.addListener("tilesloaded", () => {
      setMapReady(true);
      google.maps.event.removeListener(tilesListener);
    });
    const idleListener = map.addListener("idle", () => {
      setMapReady(true);
      google.maps.event.removeListener(idleListener);
    });
    const readyFallback = window.setTimeout(() => {
      if (!mapReady) {
        setMapReady(true);
      }
    }, 1200);

    // Add actual current location marker (blue dot)
    if (actualUserLocation) {
      new google.maps.Marker({
        position: actualUserLocation,
        map: map,
        title: "Your Location",
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: "#4285F4",
          fillOpacity: 1,
          strokeColor: "#FFFFFF",
          strokeWeight: 3,
          scale: 10,
        },
        zIndex: 1000,
      });
    }

    let radiusListener: google.maps.MapsEventListener | null = null;
    if (onRadiusChange) {
      radiusListener = map.addListener("idle", () => {
        if (!userInteractedRef.current) return;
        const bounds = map.getBounds();
        if (!bounds) return;
        const radiusKmRaw = calculateRadiusKm(bounds);
        const radiusKm = Math.max(1, Math.round(radiusKmRaw * 10) / 10);
        if (
          lastRadiusRef.current === null ||
          Math.abs(lastRadiusRef.current - radiusKm) >= 0.1
        ) {
          lastRadiusRef.current = radiusKm;
          onRadiusChange(radiusKm);
        }
      });
    }

    // Google Maps sizes its canvas from the container's dimensions at creation
    // time and never re-checks them, so a container that was zero-sized (or
    // wrongly sized) at mount stays blank even after it resizes. Watch it and
    // force a resize so the tiles/canvas re-fit whenever the layout changes.
    let resizeObserver: ResizeObserver | null = null;
    if (mapRef.current && typeof ResizeObserver !== "undefined") {
      let lastSize = { width: 0, height: 0 };
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        if (width === lastSize.width && height === lastSize.height) return;
        lastSize = { width, height };
        if (width === 0 || height === 0) return;
        google.maps.event.trigger(map, "resize");
        map.setCenter(userLocation);
      });
      resizeObserver.observe(mapRef.current);
    }

    return () => {
      if (radiusListener) google.maps.event.removeListener(radiusListener);
      google.maps.event.removeListener(tilesListener);
      google.maps.event.removeListener(idleListener);
      window.clearTimeout(readyFallback);
      resizeObserver?.disconnect();
    };
  }, [mapInitialized, userLocation, actualUserLocation]);

  useEffect(() => {
    if (!userLocation || !mapInstanceRef.current) return;
    const prev = prevUserLocationRef.current;
    const changed =
      !prev || prev.lat !== userLocation.lat || prev.lng !== userLocation.lng;
    if (!changed) return;

    prevUserLocationRef.current = userLocation;
    userInteractedRef.current = false;
    initialFitDoneRef.current = false;
    initializingRef.current = true;
    forceFitRef.current = true;

    mapInstanceRef.current.setCenter(userLocation);
    if (!mapInstanceRef.current.getZoom()) {
      mapInstanceRef.current.setZoom(12);
    }
  }, [userLocation]);

  // Update hospital markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || isLoading) return;
  

    const google = window.google;
    const geocoder = new google.maps.Geocoder();
    const map = mapInstanceRef.current;



    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    markerMapRef.current.clear();
    if (!userInteractedRef.current) {
      initialFitDoneRef.current = false;
    }

    // Add hospital markers
    const bounds = new google.maps.LatLngBounds();

    if (userLocation) {
      bounds.extend(userLocation);
    }

    let markersAdded = 0;

    // Geocode and add markers for each hospital
    hospitals.forEach((hospital, index) => {
      const address = getHospitalAddress(hospital);
      // Try to find coordinates in different possible locations
      let lat = null;
      let lng = null;

      // Check multiple possible locations for coordinates
      if (address?.latitude && address?.longitude) {
        lat = address.latitude;
        lng = address.longitude;
      } else if (hospital.latitude && hospital.longitude) {
        lat = hospital.latitude;
        lng = hospital.longitude;
      } else if (hospital.location?.lat && hospital.location?.lng) {
        lat = hospital.location.lat;
        lng = hospital.location.lng;
      } else if (hospital.lat && hospital.lng) {
        lat = hospital.lat;
        lng = hospital.lng;
      }

      // Convert to numbers if they're strings
      if (lat && lng) {
        lat = typeof lat === "string" ? parseFloat(lat) : lat;
        lng = typeof lng === "string" ? parseFloat(lng) : lng;
      }

      // If no coordinates, try geocoding the address
      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        // Build address string for geocoding
        const addressParts = [
          address?.addressLine1,
          address?.cityName,
          address?.stateName,
          address?.pinCode,
          address?.countryName,
        ].filter(Boolean);

        if (addressParts.length > 0) {
          const fullAddress = addressParts.join(", ");


          geocoder.geocode({ address: fullAddress }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              const location = results[0].geometry.location;
              const position = {
                lat: location.lat(),
                lng: location.lng(),
              };


              const marker = new google.maps.Marker({
                position: position,
                map: mapInstanceRef.current,
                title: hospital.name,
                label: {
                  text: "H",
                  color: "#ffffff",
                  fontSize: "12px",
                  fontWeight: "700",
                },
              });
              markerMapRef.current.set(getHospitalKey(hospital, index), marker);

              markersAdded++;

              // Build address string for info window
              const addressForDisplay =
                [
                  address?.addressLine1,
                  address?.addressLine2,
                  address?.cityName,
                  address?.stateName,
                  address?.pinCode,
                  address?.countryName,
                ]
                  .filter(Boolean)
                  .join(", ");

              const distance = formatDistance(hospital.distanceInMeters);
              const distanceLine = distance
                ? `<p style="margin: 0; color: #666; font-size: 12px;">📍 ${distance} away</p>`
                : "";
              const addressLine = addressForDisplay
                ? `<p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">${addressForDisplay}</p>`
                : "";

              // Add info window
              const infoWindow = new google.maps.InfoWindow({
                content: `
                                    <div style="padding: 10px; max-width: 250px;">
                                        <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 600;">
                                            ${hospital.name || "N/A"}
                                        </h4>
                                        ${distanceLine}
                                        ${addressLine}
                                        <div style="margin-top: 8px;">
                                          <a href="${buildDirectionsUrl(
                                            addressForDisplay || hospital.name || "",
                                          )}" target="_blank" rel="noreferrer" style="display:inline-block; font-size:12px; color:#1a73e8; text-decoration:none;">Directions</a>
                                        </div>
                                    </div>
                                `,
              });

              marker.addListener("click", () => {
                infoWindow.open(mapInstanceRef.current, marker);
              });

              markersRef.current.push(marker);
              bounds.extend(position);

              // Fit bounds after adding marker
              if (mapInstanceRef.current) {
                mapInstanceRef.current.fitBounds(bounds);
              }
            } else {
              console.error(`Geocoding failed for ${hospital.name}: ${status}`);
            }
          });
        }
      } else {
        // Has coordinates, add marker directly
        const position = {
          lat: lat,
          lng: lng,
        };


        const marker = new google.maps.Marker({
          position: position,
          map: mapInstanceRef.current,
          title: hospital.name,
          label: {
            text: "H",
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "700",
          },
        });
        markerMapRef.current.set(getHospitalKey(hospital, index), marker);

        markersAdded++;

        // Build address string
        const addressParts = [
          address?.addressLine1,
          address?.cityName,
          address?.stateName,
          address?.pinCode,
        ].filter(Boolean);

        const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : "";

        const distance = formatDistance(hospital.distanceInMeters);
        const distanceLine = distance
          ? `<p style="margin: 0; color: #666; font-size: 12px;">📍 ${distance} away</p>`
          : "";
        const addressLine = fullAddress
          ? `<p style="margin: 4px 0 0 0; color: #666; font-size: 12px;">${fullAddress}</p>`
          : "";

        // Add info window
        const infoWindow = new google.maps.InfoWindow({
          content: `
                        <div style="padding: 10px; max-width: 250px;">
                            <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px; font-weight: 600;">
                                ${hospital.name || "N/A"}
                            </h4>
                            ${distanceLine}
                            ${addressLine}
                            <div style="margin-top: 8px;">
                              <a href="${buildDirectionsUrl(
                                fullAddress || hospital.name || "",
                              )}" target="_blank" rel="noreferrer" style="display:inline-block; font-size:12px; color:#1a73e8; text-decoration:none;">Directions</a>
                            </div>
                        </div>
                    `,
        });

        marker.addListener("click", () => {
          infoWindow.open(mapInstanceRef.current, marker);
        });

        markersRef.current.push(marker);
        bounds.extend(position);
      }
    });

    if (markersAdded > 0 && map) {
      if (!focusHospital && (!initialFitDoneRef.current || forceFitRef.current)) {
        map.fitBounds(bounds);
        initialFitDoneRef.current = true;
        forceFitRef.current = false;
      }
    }

    if (focusHospital) {
      const matchIndex = hospitals.findIndex((hospital) =>
        isSameHospital(hospital, focusHospital),
      );
      const matchHospital =
        matchIndex === -1 ? focusHospital : hospitals[matchIndex];
      const key = getHospitalKey(
        matchHospital,
        matchIndex === -1 ? -1 : matchIndex,
      );
      if (lastFocusedKeyRef.current !== key) {
        lastFocusedKeyRef.current = key;
        focusHospitalOnMap(matchHospital, matchIndex === -1 ? -1 : matchIndex);
      } else if (matchIndex !== -1) {
        focusHospitalOnMap(matchHospital, matchIndex);
      }
    }
  }, [hospitals, isLoading, userLocation, mapReady, focusHospital]);

  

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "500px",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <p style={{ color: "#d32f2f" }}>Error loading map: {error}</p>
        <p style={{ fontSize: "14px", color: "#666" }}>
          Please check your Google Maps API configuration
        </p>
      </Box>
    );
  }

  return (
    <MapViewContainer>
      <MapResultsPanel>
        <MapResultsHeader>
          <MapResultsHeaderTitle>
            Results 
          </MapResultsHeaderTitle>
          {/* <MapResultsHeaderActions>
            <span>Sort by</span>
            <span>Share</span>
          </MapResultsHeaderActions> */}
        </MapResultsHeader>
        <MapResultsBody>
          {hospitals.map((hospital, index) => {
            const address = getHospitalAddress(hospital);
            const location = [
              address?.addressLine1,
              address?.addressLine2,
              address?.cityName,
              address?.stateName,
              address?.pinCode,
              address?.countryName,
            ]
              .filter(Boolean)
              .join(", ");
            const coordsLocation =
              address?.latitude && address?.longitude
                ? `Lat ${address.latitude}, Lng ${address.longitude}`
                : "";
            const phone =
              address?.phoneNumber || address?.alternatePhoneNumber || "N/A";
            const distance = formatDistance(hospital.distanceInMeters);
            return (
              <MapResultItem
                key={getHospitalKey(hospital, index)}
                onClick={() => focusHospitalOnMap(hospital, index)}
              >
                {/* {index < 2 && <MapResultTag>Sponsored</MapResultTag>} */}
                {/* <MapResultSubtitle>Hospital</MapResultSubtitle> */}
                <MapResultName>{hospital.name || "NA"}</MapResultName>
                <MapResultMeta>
                  {location || coordsLocation || "Address not available"}
                </MapResultMeta>
                <MapResultFooterRow>
                  {distance ? (
                    <MapResultMeta>{distance} away</MapResultMeta>
                  ) : null}
                  {phone && phone !== "N/A" ? (
                    <MapResultMeta>{phone}</MapResultMeta>
                  ) : null}
                </MapResultFooterRow>
                <MapResultActions>
                  <MapActionButton
                    href="#"
                    rel="noreferrer"
                    onClick={(event) => {
                      event.stopPropagation();
                      event.preventDefault();
                      // Resolve destination at click time from the actual marker position.
                      // Markers are placed via direct lat/lng or geocoding — this ensures
                      // Directions goes to the exact same point as the map pin.
                      const key = getHospitalKey(hospital, index);
                      const marker = markerMapRef.current.get(key);
                      const pos = marker?.getPosition?.();
                      let destination: string;
                      if (pos) {
                        destination = `${pos.lat()},${pos.lng()}`;
                      } else if (address?.latitude && address?.longitude) {
                        destination = `${address.latitude},${address.longitude}`;
                      } else {
                        destination = location || hospital.name || "";
                      }
                      window.open(buildDirectionsUrl(destination), "_blank", "noreferrer");
                    }}
                  >
                    Directions
                  </MapActionButton>
                </MapResultActions>
              </MapResultItem>
            );
          })}
        </MapResultsBody>
      </MapResultsPanel>
      <MapContainer sx={{ position: "relative" }}>
        {isLoading && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              zIndex: 1000,
            }}
          >
            <CommonLoader />
          </Box>
        )}
        <div
          ref={mapRef}
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </MapContainer>
    </MapViewContainer>
  );
};

export default HospitalMapView;
