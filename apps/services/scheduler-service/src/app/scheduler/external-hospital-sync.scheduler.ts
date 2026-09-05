import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import axios from "axios";
import { MstrHospital } from "../../../../service-lib/src/lib/entities/mstr-hospital.entity";
import { MstrHospitalAddress } from "../../../../service-lib/src/lib/entities/mstr-hospital-address.entity";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { SCHEDULER_HANDLERS } from "../../../../../../libs/service-lib/src/lib/constants";
import { DynamicCronService } from "../cron-configuration/dynamic-cron.service";

const SYSTEM_USER_ID = 0;
const GOODHEALTH_API_URL = "https://webserv.goodhealthtpa.in/api/Intermediary/GetHospitalInfo";
const SOURCE_API_SYNC = "API_SYNC";
const BATCH_SIZE = 500;
// Max concurrent geocode requests — stays within Google's 50 QPS limit.
const GEOCODE_CONCURRENCY = 5;
// Delay (ms) between geocode concurrency groups to avoid bursting.
const GEOCODE_DELAY_MS = 200;

interface GoodHealthHospital {
  SNO: string;
  HOSPITALID: string;
  HOSPITALNAME: string;
  ADDRESSLINE1: string;
  ADDRESSLINE2: string;
  CITYNAME: string;
  STATENAME: string;
  PINCODE: string;
  LANDMARK1: string;
  LANDMARK2: string;
  STDCODE: string;
  PHONENUMBER: string;
  FAXNUMBER: string;
  EMAIL: string;
  LEVELOFCARE: string;
  NETWORKTYPE: string;
  INSURANCECOMPANY: string;
}

@Injectable()
export class ExternalHospitalSyncScheduler implements OnModuleInit {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(MstrHospital)
    private readonly hospitalRepo: Repository<MstrHospital>,
    @InjectRepository(MstrHospitalAddress)
    private readonly hospitalAddressRepo: Repository<MstrHospitalAddress>,
    private readonly traceIdService: TraceIdService,
    private readonly dynamicCronService: DynamicCronService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.SCHEDULER_SERVICE);
  }

  async onModuleInit() {
    const handlers = new Map<string, () => Promise<void>>();
    const key = "BACKFILL_MISSING_GEOCODE";
    const methodName = SCHEDULER_HANDLERS[key];
    const method = this[methodName as keyof ExternalHospitalSyncScheduler];

    if (typeof method === "function") {
      handlers.set(key, (method as () => Promise<void>).bind(this));
    } else {
      this.logger.warn(`Method not found on scheduler: ${methodName}`);
    }

    this.dynamicCronService.registerHandlers(handlers);
    await this.dynamicCronService.loadCronJobs();
  }

  // ── Daily sync: 7:00 PM ────────────────────────────────────────────────────
  // EXTERNAL_HOSPITAL_SYNC_CRON=<cron expr>    (default: 30 13 * * * = 7:00 PM IST)
  // @Cron("30 13 * * *") — disabled: replaced by GenericTpaSyncScheduler
  async syncExternalHospitals(): Promise<void> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ExternalHospitalSyncScheduler",
        method: "syncExternalHospitals",
        messageData: "External hospital sync started",
      }),
    });

    // ── STEP 1: Fetch from GoodHealth API ────────────────────────────────────
    const goodHealthUsername = process.env.GOODHEALTH_TPA_USERNAME ?? "IIRMHO";
    const goodHealthPassword = process.env.GOODHEALTH_TPA_PASSWORD ?? "IIRMHO";
    if (!goodHealthUsername || !goodHealthPassword) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ExternalHospitalSyncScheduler",
          method: "syncExternalHospitals",
          messageData:
            "Missing GOODHEALTH_TPA_USERNAME / GOODHEALTH_TPA_PASSWORD env vars — aborting sync",
        }),
      });
      return;
    }

    let hospitals: GoodHealthHospital[] = [];
    try {
      const response = await axios.post<GoodHealthHospital[]>(
        GOODHEALTH_API_URL,
        {
          UserName: goodHealthUsername,
          Password: goodHealthPassword,
          StartIndex: "0",
          EndIndex: "0",
        },
        { timeout: 60000 },
      );
      hospitals = Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ExternalHospitalSyncScheduler",
          method: "syncExternalHospitals",
          messageData: `API fetch failed — aborting sync: ${error instanceof Error ? error.message : String(error)}`,
        }),
      });
      return;
    }

    const totalFromApi = hospitals.length;
    const invalidRecords = hospitals.filter((h) => !h.HOSPITALID).length;
    const validRecords = totalFromApi - invalidRecords;

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ExternalHospitalSyncScheduler",
        method: "syncExternalHospitals",
        payload: { totalFromApi, validRecords, invalidRecords },
        messageData: `Fetched ${totalFromApi} hospitals from GoodHealth API (${validRecords} valid, ${invalidRecords} missing HOSPITALID)`,
      }),
    });

    if (validRecords === 0) {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "ExternalHospitalSyncScheduler",
          method: "syncExternalHospitals",
          messageData: "No valid records from API — sync complete",
        }),
      });
      return;
    }

    // ── STEP 2: Bulk dedup — one query for all existing IDs ──────────────────
    const existingRows = await this.hospitalRepo
      .createQueryBuilder("h")
      .select("h.external_hospital_id", "externalHospitalId")
      .where("h.external_hospital_id IS NOT NULL")
      .andWhere("h.deleted_at IS NULL")
      .getRawMany<{ externalHospitalId: string }>();

    const existingIdSet = new Set(existingRows.map((r) => r.externalHospitalId));
    const alreadyExists = hospitals.filter((h) => h.HOSPITALID && existingIdSet.has(h.HOSPITALID)).length;
    const toInsert = hospitals.filter((h) => h.HOSPITALID && !existingIdSet.has(h.HOSPITALID));

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ExternalHospitalSyncScheduler",
        method: "syncExternalHospitals",
        payload: { totalFromApi, alreadyExists, toInsert: toInsert.length, invalidRecords },
        messageData: `Dedup complete — ${alreadyExists} already in DB, ${toInsert.length} new to insert, ${invalidRecords} invalid`,
      }),
    });

    if (toInsert.length === 0) {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "ExternalHospitalSyncScheduler",
          method: "syncExternalHospitals",
          payload: { totalFromApi, alreadyExists, inserted: 0, failed: 0 },
          messageData: "All records already exist — nothing to insert. Sync complete",
        }),
      });
      return;
    }

    // ── STEP 3: Bulk insert in batches ────────────────────────────────────────
    const totalBatches = Math.ceil(toInsert.length / BATCH_SIZE);
    let inserted = 0;
    let failed = 0;
    const insertedAddresses: MstrHospitalAddress[] = [];

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ExternalHospitalSyncScheduler",
        method: "syncExternalHospitals",
        payload: { toInsert: toInsert.length, batchSize: BATCH_SIZE, totalBatches },
        messageData: `Starting bulk insert — ${toInsert.length} records in ${totalBatches} batch(es) of ${BATCH_SIZE}`,
      }),
    });

    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "ExternalHospitalSyncScheduler",
          method: "syncExternalHospitals",
          payload: { batchNumber, totalBatches, batchSize: batch.length, insertedSoFar: inserted },
          messageData: `Processing batch ${batchNumber}/${totalBatches} (${batch.length} records)`,
        }),
      });

      try {
        const addressEntities = batch.map((h) => {
          const landmarks = [h.LANDMARK1, h.LANDMARK2]
            .map((l) => l?.trim())
            .filter((l) => l && l.toLowerCase() !== "null" && l.toLowerCase() !== "na");

          const insuranceCompanies = h.INSURANCECOMPANY?.trim()
            ? h.INSURANCECOMPANY.split("|").map((s) => s.trim()).filter(Boolean)
            : undefined;

          return this.hospitalAddressRepo.create({
            addressLine1: h.ADDRESSLINE1 || "",
            addressLine2: h.ADDRESSLINE2 && h.ADDRESSLINE2.trim().toLowerCase() !== "na" ? h.ADDRESSLINE2 : undefined,
            cityName: h.CITYNAME || "",
            stateName: h.STATENAME || "",
            countryName: "India",
            pinCode: h.PINCODE || undefined,
            landmark: landmarks.length > 0 ? landmarks.join(", ") : undefined,
            phoneNumber: h.PHONENUMBER || undefined,
            email: h.EMAIL || undefined,
            stdCode: h.STDCODE || undefined,
            faxNumber: h.FAXNUMBER && h.FAXNUMBER !== "0" ? h.FAXNUMBER : undefined,
            levelOfCare: h.LEVELOFCARE || undefined,
            networkType: h.NETWORKTYPE || undefined,
            insuranceCompanies,
            createdBy: SYSTEM_USER_ID,
            updatedBy: SYSTEM_USER_ID,
          });
        });

        const savedAddresses = await this.hospitalAddressRepo.save(addressEntities);

        const goodHealthTpaId = process.env.GOODHEALTH_TPA_ID ? Number(process.env.GOODHEALTH_TPA_ID) : null;
        const hospitalEntities = batch.map((h, idx) =>
          this.hospitalRepo.create({
            name: h.HOSPITALNAME,
            addressId: savedAddresses[idx].id,
            externalHospitalId: h.HOSPITALID,
            source: SOURCE_API_SYNC,
            tpaId: goodHealthTpaId,
            createdBy: SYSTEM_USER_ID,
            updatedBy: SYSTEM_USER_ID,
          }),
        );

        await this.hospitalRepo.save(hospitalEntities);

        inserted += batch.length;
        insertedAddresses.push(...savedAddresses);

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "ExternalHospitalSyncScheduler",
            method: "syncExternalHospitals",
            payload: { batchNumber, totalBatches, batchInserted: batch.length, insertedSoFar: inserted, remaining: toInsert.length - inserted },
            messageData: `Batch ${batchNumber}/${totalBatches} inserted — ${inserted}/${toInsert.length} done, ${toInsert.length - inserted} remaining`,
          }),
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        failed += batch.length;
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "ExternalHospitalSyncScheduler",
            method: "syncExternalHospitals",
            payload: { batchNumber, totalBatches, batchSize: batch.length, failedSoFar: failed },
            messageData: `Batch ${batchNumber}/${totalBatches} failed — ${msg}`,
          }),
        });
      }
    }

    // ── STEP 4: Final insert summary ──────────────────────────────────────────
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: failed === 0 ? "success" : "failure",
        location: "ExternalHospitalSyncScheduler",
        method: "syncExternalHospitals",
        payload: { totalFromApi, alreadyExists, toInsert: toInsert.length, inserted, failed, invalidRecords },
        messageData: `Sync complete — Total from API: ${totalFromApi} | Already exists: ${alreadyExists} | New to insert: ${toInsert.length} | Inserted: ${inserted} | Failed: ${failed} | Invalid (no HOSPITALID): ${invalidRecords}`,
      }),
    });

    // ── STEP 5: Geocode newly inserted addresses with rate limiting ───────────
    // NOTE: mstr_policy_hospital_map is NOT populated here.
    // Policy mapping for API-synced hospitals is out of scope for this sync.
    if (insertedAddresses.length > 0) {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "ExternalHospitalSyncScheduler",
          method: "syncExternalHospitals",
          payload: { toGeocode: insertedAddresses.length, concurrency: GEOCODE_CONCURRENCY },
          messageData: `Starting geocoding for ${insertedAddresses.length} new addresses (${GEOCODE_CONCURRENCY} concurrent)`,
        }),
      });

      const geocoded = await this.geocodeBatch(insertedAddresses, "syncExternalHospitals");

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "ExternalHospitalSyncScheduler",
          method: "syncExternalHospitals",
          payload: { geocoded: geocoded.success, skipped: geocoded.skipped, failed: geocoded.failed },
          messageData: `Geocoding complete — ${geocoded.success} geocoded, ${geocoded.skipped} skipped (no API key / already set), ${geocoded.failed} failed`,
        }),
      });
    }
  }

  // Backfill: fills lat/lng for any API_SYNC addresses still null. Schedule is now
  // DB-driven via application_scheduler_configuration (key BACKFILL_MISSING_GEOCODE,
  // registered in onModuleInit above) — controllable from the iwork Cron Jobs admin
  // page instead of a static @Cron decorator here.
  async backfillMissingGeocode(): Promise<void> {
    debugger;
    console.log("backfillMissingGeocode cron triggered");
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    // Find all API-synced addresses with null lat/lng.
    const nullAddresses = await this.hospitalAddressRepo
      .createQueryBuilder("a")
      .innerJoin("mstr_hospital", "h", "h.address_id = a.id")
      .where("h.source = :source", { source: SOURCE_API_SYNC })
      .andWhere("h.deleted_at IS NULL")
      .andWhere("a.deleted_at IS NULL")
      .andWhere("a.latitude IS NULL")
      .getMany();

    if (nullAddresses.length === 0) {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "ExternalHospitalSyncScheduler",
          method: "backfillMissingGeocode",
          messageData: "Geocode backfill — no null addresses found, all up to date",
        }),
      });
      return;
    }

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ExternalHospitalSyncScheduler",
        method: "backfillMissingGeocode",
        payload: { nullCount: nullAddresses.length, concurrency: GEOCODE_CONCURRENCY },
        messageData: `Geocode backfill started — ${nullAddresses.length} addresses with null lat/lng`,
      }),
    });

    const result = await this.geocodeBatch(nullAddresses, "backfillMissingGeocode");

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ExternalHospitalSyncScheduler",
        method: "backfillMissingGeocode",
        payload: { total: nullAddresses.length, geocoded: result.success, failed: result.failed },
        messageData: `Geocode backfill complete — ${result.success}/${nullAddresses.length} geocoded, ${result.failed} failed`,
      }),
    });
  }

  // Rate-limited geocoding: processes addresses GEOCODE_CONCURRENCY at a time
  // with a GEOCODE_DELAY_MS pause between groups. Returns counts.
  private async geocodeBatch(
    addresses: MstrHospitalAddress[],
    callerMethod: string,
  ): Promise<{ success: number; skipped: number; failed: number }> {
    debugger;
    console.log("geocodeBatch triggered");
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    let success = 0;
    let skipped = 0;
    let failed = 0;

    if (!apiKey) {
      skipped = addresses.length;
      return { success, skipped, failed };
    }

    for (let i = 0; i < addresses.length; i += GEOCODE_CONCURRENCY) {
      const group = addresses.slice(i, i + GEOCODE_CONCURRENCY);

      await Promise.all(
        group.map(async (addr) => {
          if (addr.latitude != null && addr.longitude != null) {
            skipped++;
            return;
          }
          const ok = await this.geocodeAndSave(addr);
          if (ok) success++;
          else failed++;
        }),
      );

      // Progress log every 500 addresses.
      const processed = Math.min(i + GEOCODE_CONCURRENCY, addresses.length);
      if (processed % 500 === 0 || processed === addresses.length) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "ExternalHospitalSyncScheduler",
            method: callerMethod,
            payload: { processed, total: addresses.length, success, failed },
            messageData: `Geocoding progress — ${processed}/${addresses.length} processed`,
          }),
        });
      }

      if (i + GEOCODE_CONCURRENCY < addresses.length) {
        await new Promise((resolve) => setTimeout(resolve, GEOCODE_DELAY_MS));
      }
    }

    return { success, skipped, failed };
  }

  // Geocodes a single address. Returns true on success, false on failure.
  private async geocodeAndSave(address: MstrHospitalAddress): Promise<boolean> {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return false;

    try {
      const fullAddress = [address.addressLine1, address.cityName, address.stateName, "India"]
        .filter(Boolean)
        .join(", ");
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`;
      const res = await fetch(url);
      const data: any = await res.json();

      if (data?.status === "OK" && data.results?.[0]?.geometry?.location) {
        const { lat, lng } = data.results[0].geometry.location;
        await this.hospitalAddressRepo.update(address.id, {
          latitude: lat,
          longitude: lng,
          updatedBy: SYSTEM_USER_ID,
        });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
