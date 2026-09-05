# Hospital Network Map Flow (IBP)

This document explains the hospital map view end‑to‑end, **why we chose this design**, and **what can go wrong**. It’s written so you can explain tradeoffs and troubleshooting to stakeholders.

## Why This Design (High‑Level Rationale)

We split the solution into two paths:

1. **Card/List view (IBP service)**  
   - Always shows hospitals mapped to a policy (even if coordinates are missing).
   - Works without PostGIS or geocoding.

2. **Map view (Policy service + PostGIS)**  
   - Shows **nearby hospitals only**, based on user location and a radius.
   - Requires accurate coordinates and PostGIS for correct distance filtering.

This separation keeps the **core list reliable** while enabling a **true map experience** when coordinates are available.

## 1) Upload Flow (Policy Service)

Endpoint:
- `POST /portal-configuration/policy/:policyId/hospitals/upload`

What happens during upload:
1. File is parsed and validated in `PortalConfigurationService.processHospitalFileUpload`.
2. For each row:
   - We normalize `Hospital Name`, `Address`, `City`, `State` to detect duplicates.
   - We check if the hospital already exists using `findExistingHospital(...)`.
3. If the hospital **does not exist**:
   - `createHospitalAddress(...)` is called.
   - If `latitude/longitude` are not provided, it calls `geocodeAddress(...)` to resolve coordinates from Google Geocoding API.
   - The address row is saved with `latitude/longitude`.
   - `createHospital(...)` is called with the new address ID.
4. If the hospital **already exists**:
   - We now call `ensureHospitalAddressCoordinates(...)`.
   - If existing address has `latitude/longitude = null`, we geocode and update.
5. A policy ↔ hospital mapping row is created in `mstr_policy_hospital_map`.

Why it’s implemented this way:
- Coordinates are **expensive to compute** (external API, quota, latency).
- We compute them **once at upload time** and store in DB, instead of geocoding for every search.

Important notes:
- Geocoding only works if **Google Geocoding API is enabled** and billing is active.
- If geocoding fails (e.g., `REQUEST_DENIED`), `latitude/longitude` remain `null`.

Key backend files:
- `apps/services/policy-service/src/app/portal-configuration/portal-configuration.service.ts`
- `apps/services/policy-service/src/app/portal-configuration/portal-configuration.repository.ts`

## 2) Stored Data (DB)

Tables involved:
- `mstr_hospital`
  - `address_id` → FK to `mstr_hospital_address`
- `mstr_hospital_address`
  - `latitude`, `longitude` (used for map/radius search)
- `mstr_policy_hospital_map`
  - `policy_id`, `hospital_id`, `is_network_hospital`

If `latitude/longitude` are **null**, geospatial queries will return **0 results**.

## 3) Search APIs (Why two endpoints)

### A) IBP (Card/List view)
Endpoint:
- `GET /company-employee/policy/hospitals/search/:policyId`

Behavior:
- Uses standard filter/search (no geospatial radius).
- Returns hospitals mapped to policy (even if lat/long are null).

### B) Policy Service (Map view)
Endpoint:
- `GET /portal-configuration/policy/hospitals/search/:policyId`

Behavior:
- If `latitude` + `longitude` are present in query → **geospatial search**
- Uses PostGIS functions:
  - `ST_MakePoint`, `ST_SetSRID`, `ST_DWithin`, `ST_Distance`
- Filters by radius and returns only hospitals with non‑null lat/long.

Why PostGIS:
- Accurate radius search (not bounding boxes).
- Efficient indexes for spatial queries at scale.

Geospatial SQL uses columns:
- `mstr_hospital.address_id`
- `mstr_policy_hospital_map.hospital_id`
- `mstr_policy_hospital_map.policy_id`
- `mstr_policy_hospital_map.is_network_hospital`

## 4) UI – Hospital Network V1 (Map View)

Files:
- `apps/ui/ibp/src/app/pages/HospitalNetworkV1/index.tsx`
- `apps/ui/ibp/src/app/pages/HospitalNetworkV1/HospitalMapView.tsx`

Key behavior:
1. **Card view** uses IBP endpoint (non‑geospatial).
2. **Map view** uses Policy Service endpoint (geospatial).
3. User location is taken from browser geolocation (fallback to Hyderabad).
4. When map is panned/zoomed:
   - Map calculates a radius based on current bounds.
   - `onRadiusChange(radiusKm)` updates state in `index.tsx`.
   - This updates query params and **refetches hospitals** from policy‑service.
5. Left list shows **only API hospitals** (consistent with the map markers).
6. Map markers are rendered for each hospital returned by API.

Why we do not use Google Places list:
- It would show **hospitals not in our policy network**.
- The list must remain consistent with the policy’s hospital data.

## 5) Expected Map Behavior

If `latitude/longitude` are available:
- Zoom out → radius increases → more hospitals returned → list & markers grow.
- Zoom in → radius decreases → fewer hospitals returned.

If `latitude/longitude` are **missing**:
- Map view will show **0 results** even though card list has hospitals.

Why: the geospatial query requires `a.latitude IS NOT NULL AND a.longitude IS NOT NULL`.

## 6) Common Issues & Fixes (Root Cause + Resolution)

1. **No map results**
   - Check DB:
     ```sql
     SELECT COUNT(*) FROM mstr_hospital_address
     WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
     ```
   - If 0, geocoding didn’t populate coords.
   - Resolution: fix Google Geocoding API key, then re‑upload or run backfill.

2. **Geocoding not working**
   - Ensure policy-service has:
     - `GOOGLE_MAPS_API_KEY`
   - Ensure Google Geocoding API is enabled + billing active.
   - Look for logs:
     - `geocodeStatus: REQUEST_DENIED` → API not enabled or key restrictions
     - `geocodeStatus: OVER_QUERY_LIMIT` → quota exceeded
     - `geocodeStatus: ZERO_RESULTS` → invalid address

3. **PostGIS errors**
   - PostGIS must be installed and enabled in the policy DB:
     ```sql
     CREATE EXTENSION IF NOT EXISTS postgis;
     ```
   - If you can’t create extensions, DevOps must do it.

4. **Existing hospitals never get coordinates**
   - If a hospital already exists, we now run `ensureHospitalAddressCoordinates` during upload.
   - If coordinates are still null, it means geocoding failed.

## 7) Configuration Checklist (DevOps + Developer)

### A) DevOps / Environment Setup (Server / DB)
1. **PostGIS installed + enabled on policy-service DB**
   - DB instance must have PostGIS packages installed.
   - Enable extension (superuser):
     ```sql
     CREATE EXTENSION IF NOT EXISTS postgis;
     ```

2. **Outbound network access**
   - Allow the policy-service to call:
     - `https://maps.googleapis.com` (Geocoding)

3. **Google Cloud project**
   - **Billing enabled**
   - **Geocoding API enabled**
   - (Optional) **Maps JavaScript API** enabled if needed in other environments
   - API key restrictions:
     - Server‑side key (policy‑service) must allow Geocoding API.
     - Frontend key (IBP UI) must allow Maps JavaScript API.

### B) Backend (Policy Service) – Local/Dev
In `environments/.env.dev` (or equivalent for the running env):
```
GOOGLE_MAPS_API_KEY=...      # required for geocoding on upload
GOOGLE_MAPS_API_URL=https://maps.googleapis.com/maps/api/geocode/json
```

Verify geocoding works:
- Upload a hospital with a valid address.
- Check logs for `geocodeStatus: OK`.
- Verify DB has `latitude/longitude` populated in `mstr_hospital_address`.

### C) Frontend (IBP UI) – Local/Dev
In `.env.serve.development` (or env used by the UI app):
```
VITE_GOOGLE_MAPS_API_KEY=... # required to render the map
VITE_GOOGLE_MAPS_API_URL=https://maps.googleapis.com/maps/api/geocode/json
```

Verify map loads:
- Open Hospital Network → Map View.
- Ensure Google map renders and markers appear after first data fetch.

### D) Quick “Is It Working?” Checklist
1. **Map loads** (no blank screen, no API key errors).
2. **Upload populates lat/lng** in DB.
3. **Geospatial API returns hospitals** for a location + radius.
4. **Markers appear immediately** in map view (no need to zoom to see them).

## 7) What to Tell Lead (Summary)

- Upload creates hospitals + addresses and geocodes coordinates once.
- Map view depends on **coordinates + PostGIS** to return nearby hospitals.
- Card view works without coordinates.
- If coordinates are null, map view shows zero even if card list has data.
- We chose this design to keep list view stable and make map view accurate and fast.
