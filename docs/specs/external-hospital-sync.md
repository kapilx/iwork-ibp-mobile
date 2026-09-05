# Spec: External Hospital Sync — GoodHealth TPA Daily Cron

Status: Implemented
Owner: Scheduler Service / Hospital Network
Date: 2026-05-26

## 1. Background

The Hospital Network tab in IBP allows admins to manage empanelled hospitals. Currently, hospitals are added exclusively through file uploads — an admin uploads a CSV/Excel, the AI processing pipeline parses it, inserts rows into `mstr_hospital` and `mstr_hospital_address`, and geocodes each address via Google Maps.

GoodHealth TPA exposes a REST API that returns its full hospital list. This data is authoritative and changes over time as hospitals join or leave the TPA network. Manually maintaining this list via file uploads is error-prone and operationally expensive. The requirement is a scheduled job that fetches this data every day and syncs new hospitals automatically.

## 2. Goal

1. Run a daily cron (02:00 AM) that fetches all hospitals from the GoodHealth TPA API.
2. Insert only new hospitals — hospitals already present (identified by `HOSPITALID` from the API) must be skipped.
3. Store all API response fields into existing tables (`mstr_hospital`, `mstr_hospital_address`) and new columns added for this feature.
4. Geocode each new address (lat/lng) using the same Google Maps flow as the file upload path.
5. Track the origin of every hospital record via a `source` column: `FILE_UPLOAD` (existing records, default) or `API_SYNC` (cron-synced records).
6. Policy mapping (`mstr_policy_hospital_map`) is **not in scope** — external hospitals are synced for informational/future use only.

## 3. Scope

### 3.1 In scope

- New cron scheduler: `ExternalHospitalSyncScheduler` in `scheduler-service`
- Schema changes: `mstr_hospital.source`, `mstr_hospital.external_hospital_id`, and five new columns in `mstr_hospital_address`
- Entity changes: `MstrHospital`, `MstrHospitalAddress` (TypeORM)
- Migration SQL: `database-migrations/sql/external_hospital_sync_migration.sql`

### 3.2 Out of scope

- Policy mapping for API-synced hospitals (`mstr_policy_hospital_map`) — future scope
- UI changes to display `source` or `external_hospital_id` in the hospital network tab
- Update/re-sync logic for hospitals that already exist but whose details changed — current design is insert-only for new records
- Alerting / dashboards for sync health

## 4. External API

**Endpoint:** `POST https://webserv.goodhealthtpa.in/api/Intermediary/GetHospitalInfo`

**Request payload:**
```json
{
  "UserName": "<GOODHEALTH_TPA_USERNAME>",
  "Password": "<GOODHEALTH_TPA_PASSWORD>",
  "StartIndex": "0",
  "EndIndex": "0"
}
```
`StartIndex: "0"` and `EndIndex: "0"` returns the full hospital list in one call.

**Response:** JSON array of hospital objects.

**Key response fields:**

| API Field        | Type   | Maps to                                              |
| ---------------- | ------ | ---------------------------------------------------- |
| HOSPITALID       | string | `mstr_hospital.external_hospital_id` (dedup key)     |
| HOSPITALNAME     | string | `mstr_hospital.name`                                 |
| ADDRESSLINE1     | string | `mstr_hospital_address.address_line_1`               |
| ADDRESSLINE2     | string | `mstr_hospital_address.address_line_2` (skip "NA")   |
| CITYNAME         | string | `mstr_hospital_address.city_name`                    |
| STATENAME        | string | `mstr_hospital_address.state_name`                   |
| PINCODE          | string | `mstr_hospital_address.pin_code`                     |
| LANDMARK1        | string | combined into `mstr_hospital_address.landmark`       |
| LANDMARK2        | string | combined into `mstr_hospital_address.landmark`       |
| STDCODE          | string | `mstr_hospital_address.std_code` (new column)        |
| PHONENUMBER      | string | `mstr_hospital_address.phone_number`                 |
| FAXNUMBER        | string | `mstr_hospital_address.fax_number` (new column)      |
| EMAIL            | string | `mstr_hospital_address.email`                        |
| LEVELOFCARE      | string | `mstr_hospital_address.level_of_care` (new column)   |
| NETWORKTYPE      | string | `mstr_hospital_address.network_type` (new column)    |
| INSURANCECOMPANY | string | `mstr_hospital_address.insurance_companies` (new)    |

`INSURANCECOMPANY` is a pipe-separated string (e.g. `"National Insurance|United India"`). Stored as `JSONB string[]` after splitting on `|`.

Credentials are injected via environment variables `GOODHEALTH_TPA_USERNAME` and `GOODHEALTH_TPA_PASSWORD`.

## 5. Database Schema Changes

### 5.1 `mstr_hospital`

| Column               | Type         | Nullable | Default         | Purpose                                     |
| -------------------- | ------------ | -------- | --------------- | ------------------------------------------- |
| `source`             | VARCHAR(20)  | NOT NULL | `'FILE_UPLOAD'` | Origin of the record                        |
| `external_hospital_id` | VARCHAR(50) | NULL     | —               | HOSPITALID from TPA API, dedup key          |

Unique partial index on `external_hospital_id WHERE external_hospital_id IS NOT NULL` — ensures no duplicate imports at DB level.

### 5.2 `mstr_hospital_address` (new columns only)

| Column               | Type          | Nullable | Purpose                                       |
| -------------------- | ------------- | -------- | --------------------------------------------- |
| `std_code`           | VARCHAR(10)   | NULL     | Telephone STD / area code (STDCODE)           |
| `fax_number`         | VARCHAR(30)   | NULL     | Fax number (FAXNUMBER; "0" treated as absent) |
| `level_of_care`      | VARCHAR(100)  | NULL     | e.g. Primary, Secondary, Tertiary (LEVELOFCARE) |
| `network_type`       | VARCHAR(100)  | NULL     | e.g. TPA_Wise, Insurer_Wise (NETWORKTYPE)     |
| `insurance_companies` | JSONB        | NULL     | Pipe-separated insurer list as string array   |

Migration file: [external_hospital_sync_migration.sql](../../database-migrations/sql/external_hospital_sync_migration.sql)

## 6. Implementation

### 6.1 Files changed / created

| File | Change |
| ---- | ------ |
| [external-hospital-sync.scheduler.ts](../../apps/services/scheduler-service/src/app/scheduler/external-hospital-sync.scheduler.ts) | New — cron scheduler |
| [app.module.ts](../../apps/services/scheduler-service/src/app/app.module.ts) | Registered `ExternalHospitalSyncScheduler` in providers |
| [mstr-hospital.entity.ts](../../apps/services/service-lib/src/lib/entities/mstr-hospital.entity.ts) | Added `externalHospitalId`, `source` columns |
| [mstr-hospital-address.entity.ts](../../apps/services/service-lib/src/lib/entities/mstr-hospital-address.entity.ts) | Added `stdCode`, `faxNumber`, `levelOfCare`, `networkType`, `insuranceCompanies` |
| [external_hospital_sync_migration.sql](../../database-migrations/sql/external_hospital_sync_migration.sql) | Schema DDL |

### 6.2 Cron schedule

```
@Cron("0 2 * * *")   →   daily at 02:00 AM
```

### 6.3 Sync flow

```
1. Call GoodHealth API (POST, 60 s timeout)
   └─ On failure → log error, return (no retry; next daily run will retry)

2. For each hospital record in response:
   a. Skip if HOSPITALID is blank → increment failed counter
   b. findOne({ externalHospitalId, deletedAt: IsNull() })
      └─ Exists → skip (increment skipped counter)
   c. Build MstrHospitalAddress:
      - Landmark: join LANDMARK1 + LANDMARK2, strip "null" / "NA"
      - InsuranceCompanies: split INSURANCECOMPANY on "|", filter empty
      - FAXNUMBER "0" → undefined
      - ADDRESSLINE2 "NA" → undefined
      - countryName hardcoded "India"
      - createdBy / updatedBy = 0 (SYSTEM_USER_ID)
   d. Save MstrHospitalAddress
   e. geocodeAndSave(savedAddress)  ← non-fatal, lat/lng stays NULL on failure
   f. Build and save MstrHospital:
      - source = "API_SYNC"
      - externalHospitalId = h.HOSPITALID
      - addressId = savedAddress.id
   g. Increment inserted counter

3. Log final summary: { total, inserted, skipped, failed }
```

### 6.4 Geocoding

Reuses the same Google Maps Geocoding API flow as the file upload path:

```
GET https://maps.googleapis.com/maps/api/geocode/json
    ?address=<addressLine1, cityName, stateName, India>
    &key=<GOOGLE_MAPS_API_KEY>
```

- Skipped if `GOOGLE_MAPS_API_KEY` env var is absent.
- Skipped if address already has lat/lng (future idempotency guard).
- All failures are silently swallowed — coordinates remain NULL and can be backfilled later.

### 6.5 Deduplication

Primary key for dedup is `mstr_hospital.external_hospital_id`. A unique partial index enforces this at DB level. The application also performs an explicit `findOne` check before inserting so the error surface is a clean `skipped++` counter log rather than a DB constraint violation.

### 6.6 System user

All `createdBy` / `updatedBy` fields on cron-inserted records are set to `0` (`SYSTEM_USER_ID`). There is no human actor for cron-generated rows.

## 7. Environment Variables

| Variable                  | Required | Purpose                                    |
| ------------------------- | -------- | ------------------------------------------ |
| `GOODHEALTH_TPA_USERNAME` | Yes      | API login username                         |
| `GOODHEALTH_TPA_PASSWORD` | Yes      | API login password                         |
| `GOOGLE_MAPS_API_KEY`     | No       | Geocoding; sync proceeds without it        |

## 8. Data Handling Rules

| Scenario | Behaviour |
| -------- | --------- |
| HOSPITALID already in DB | Skip entire record |
| HOSPITALID missing in API response | Counted as `failed`, skipped |
| ADDRESSLINE2 = "NA" | Stored as NULL |
| LANDMARK1/2 = "null" or "NA" | Filtered out; landmark stored as NULL if both absent |
| FAXNUMBER = "0" | Stored as NULL |
| INSURANCECOMPANY = "" | `insurance_companies` stored as NULL (not empty array) |
| Geocoding API unreachable | lat/lng stays NULL, sync continues |
| GoodHealth API unreachable | Log error, abort entire run |
| Single hospital insert fails | Log error with HOSPITALID, increment failed, continue remaining |

## 9. Policy Mapping

`mstr_policy_hospital_map` is **not populated** by this sync. API-synced hospitals exist in `mstr_hospital` with `source = 'API_SYNC'` for informational purposes. Policy assignment for externally sourced hospitals is out of scope and will be handled in a future feature when the business rules for mapping are defined.

## 10. Tasks

- [x] Analyse GoodHealth TPA API response and map fields to DB columns
- [x] Design schema additions (`source`, `external_hospital_id`, five new address columns)
- [x] Write migration SQL (`external_hospital_sync_migration.sql`)
- [x] Update `MstrHospital` entity (TypeORM columns)
- [x] Update `MstrHospitalAddress` entity (TypeORM columns + constructor)
- [x] Implement `ExternalHospitalSyncScheduler` with dedup, insert, geocode, logging
- [x] Register scheduler in `app.module.ts`
- [ ] Apply `external_hospital_sync_migration.sql` to DB (manual step — ops)
- [ ] Set `GOODHEALTH_TPA_USERNAME` and `GOODHEALTH_TPA_PASSWORD` in scheduler-service env (ops)
- [ ] Deploy scheduler-service build
- [ ] Verify first run: check logs for `inserted` / `skipped` counts and no errors

## 11. Open Items / Risks

- **Update-on-change**: Current design is insert-only. If a hospital's address or name changes in the TPA API, those changes will not be reflected after the initial sync. A future update pass (re-sync changed records) may be needed.
- **API reliability**: GoodHealth API has no documented SLA. If it is down at 02:00 AM, the run is silently skipped until the next day. Consider adding an alert if `failed > 0` or if `total === 0` unexpectedly.
- **Volume**: API returns all hospitals in one call. If the list grows very large, a single 60 s timeout may not be sufficient. The `EndIndex: "0"` behaviour (returns all) should be confirmed with GoodHealth if volumes increase significantly.
- **Credential rotation**: `GOODHEALTH_TPA_USERNAME` / `GOODHEALTH_TPA_PASSWORD` are static credentials. Rotation process should be documented in ops runbook.

## 12. Rollout

1. Apply `external_hospital_sync_migration.sql` to the target DB.
2. Set env vars `GOODHEALTH_TPA_USERNAME`, `GOODHEALTH_TPA_PASSWORD` on scheduler-service.
3. Deploy scheduler-service.
4. Cron fires automatically at 02:00 AM. Monitor logs for the `External hospital sync completed` message with `inserted`, `skipped`, `failed` counts.
5. No feature flag required — the cron is always active once deployed.
