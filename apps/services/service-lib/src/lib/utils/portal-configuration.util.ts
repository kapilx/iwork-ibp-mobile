import { TraceIdService } from "../trace-id.service";
import { buildLogMessage } from "./logger.util";
import { transformHospitalSearchResults } from "./data-transform.util";
import { Brackets, IsNull, Repository } from "typeorm";
import { MstrHospital, MstrHospitalAddress, PolicyFeatureDocument } from "../entities";
import {
  HOSPITAL_BOOLEAN_SORT_FIELDS,
  HOSPITAL_SORT_FIELDS,
  HOSPITAL_TEMPLATE_HEADERS,
} from "../constants";
import { Readable } from "stream";
import * as XLSX from "xlsx";

interface HospitalSearchRepository {
  searchHospitals(
    policyId: number,
    searchParams: any,
    userId: number
  ): Promise<{
    data: any[];
    count: number;
    networkHospitalCount: number;
    excludedHospitalCount: number;
    lastSyncedAt: Date | null;
  }>;
}

interface HospitalSearchByPolicyIdsRepository {
  searchHospitalsByPolicyIds(
    policyIds: number[],
    searchParams: any,
    userId: number
  ): Promise<{
    data: any[];
    count: number;
    networkHospitalCount: number;
    excludedHospitalCount: number;
    lastSyncedAt: Date | null;
  }>;
}

interface GeospatialHospitalRepository {
  findHospitalsWithinRadius(
    policyId: number,
    userLatitude: number,
    userLongitude: number,
    radiusInMeters: number,
    page: number,
    limit: number,
    isNetworkHospital?: boolean
  ): Promise<{
    data: Array<{
      hospital: any;
      address: any;
      distanceInMeters: number;
      isNetworkHospital: boolean;
    }>;
    count: number;
  }>;
}

interface PolicyFeatureRepository {
  getActivePolicyFeatureDocument(policyId: number): Promise<{ data: unknown[]; count: number }>;
}

interface LocationRepository {
  getLocationData(
    policyId: number,
    state?: string
  ): Promise<{ states?: string[]; cities?: string[]; selectedState?: string }>;
}

interface LocationByPolicyIdsRepository {
  getLocationDataByPolicyIds(
    policyIds: number[],
    state?: string
  ): Promise<{ states?: string[]; cities?: string[]; selectedState?: string }>;
}

export async function executeHospitalSearch({
  repository,
  policyId,
  searchParams,
  userId,
  logger,
  traceIdService,
}: {
  repository: HospitalSearchRepository;
  policyId: number;
  searchParams: any;
  userId: number;
  logger: ReturnType<typeof console.log> | any;
  traceIdService: TraceIdService;
}) {
  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "executeHospitalSearch",
      payload: { policyId, searchParams, userId },
      messageData: "method invoked",
    }),
  });

  const result = await repository.searchHospitals(policyId, searchParams, userId);
  const transformedData = transformHospitalSearchResults(result.data);

  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "executeHospitalSearch",
      payload: {
        policyId,
        count: result.count,
        networkHospitalCount: result.networkHospitalCount,
        excludedHospitalCount: result.excludedHospitalCount,
      },
      messageData: "hospitals retrieved and transformed successfully",
    }),
  });

  return {
    data: transformedData,
    count: result.count,
    networkHospitalCount: result.networkHospitalCount,
    excludedHospitalCount: result.excludedHospitalCount,
    lastSyncedAt: result.lastSyncedAt,
  };
}

export async function executeHospitalSearchByPolicyIds({
  repository,
  policyIds,
  searchParams,
  userId,
  logger,
  traceIdService,
}: {
  repository: HospitalSearchByPolicyIdsRepository;
  policyIds: number[];
  searchParams: any;
  userId: number;
  logger: ReturnType<typeof console.log> | any;
  traceIdService: TraceIdService;
}) {
  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "executeHospitalSearchByPolicyIds",
      payload: { policyIds, searchParams, userId },
      messageData: "method invoked",
    }),
  });

  const result = await repository.searchHospitalsByPolicyIds(
    policyIds,
    searchParams,
    userId
  );
  const transformedData = transformHospitalSearchResults(result.data);

  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "executeHospitalSearchByPolicyIds",
      payload: {
        policyIds,
        count: result.count,
        networkHospitalCount: result.networkHospitalCount,
        excludedHospitalCount: result.excludedHospitalCount,
      },
      messageData: "hospitals retrieved and transformed successfully",
    }),
  });

  return {
    data: transformedData,
    count: result.count,
    networkHospitalCount: result.networkHospitalCount,
    excludedHospitalCount: result.excludedHospitalCount,
    lastSyncedAt: result.lastSyncedAt,
  };
}

export async function executeGeospatialHospitalSearch({
  repository,
  policyId,
  userLatitude,
  userLongitude,
  radiusInMeters,
  page,
  limit,
  isNetworkHospital,
  logger,
  traceIdService,
}: {
  repository: GeospatialHospitalRepository;
  policyId: number;
  userLatitude: number;
  userLongitude: number;
  radiusInMeters: number;
  page: number;
  limit: number;
  isNetworkHospital?: boolean;
  logger: ReturnType<typeof console.log> | any;
  traceIdService: TraceIdService;
}) {
  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "executeGeospatialHospitalSearch",
      payload: { policyId, userLatitude, userLongitude, radiusInMeters, page, limit },
      messageData: "method invoked",
    }),
  });

  const result = await repository.findHospitalsWithinRadius(
    policyId,
    userLatitude,
    userLongitude,
    radiusInMeters,
    page,
    limit,
    isNetworkHospital
  );

  // Transform data to match the standard hospital search result format
  const transformedData = result.data.map(item => ({
    ...item.hospital,
    addresses: [item.address],
    distanceInMeters: item.distanceInMeters,
    isNetworkHospital: item.isNetworkHospital
  }));

  // Calculate network and excluded counts
  const networkHospitalCount = result.data.filter(item => item.isNetworkHospital).length;
  const excludedHospitalCount = result.data.filter(item => !item.isNetworkHospital).length;

  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "executeGeospatialHospitalSearch",
      payload: {
        policyId,
        count: result.count,
        networkHospitalCount,
        excludedHospitalCount,
        averageDistance: result.data.length > 0 
          ? Math.round(result.data.reduce((sum, item) => sum + item.distanceInMeters, 0) / result.data.length)
          : 0
      },
      messageData: "geospatial hospitals retrieved and transformed successfully",
    }),
  });

  return {
    data: transformedData,
    count: result.count,
    networkHospitalCount,
    excludedHospitalCount,
    searchRadius: radiusInMeters,
    userLocation: {
      latitude: userLatitude,
      longitude: userLongitude
    }
  };
}

export async function getActivePolicyFeatureDocument({
  repository,
  policyId,
  logger,
  traceIdService,
}: {
  repository: PolicyFeatureRepository;
  policyId: number;
  logger: ReturnType<typeof console.log> | any;
  traceIdService: TraceIdService;
}) {
  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "getActivePolicyFeatureDocument",
      payload: { policyId },
      messageData: "Fetching active policy feature document",
    }),
  });

  const result = await repository.getActivePolicyFeatureDocument(policyId);

  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "getActivePolicyFeatureDocument",
      payload: { policyId, count: result.count },
      messageData: "Policy feature document retrieved successfully",
    }),
  });

  return result;
}

export async function getPolicyLocationData({
  repository,
  policyId,
  state,
  logger,
  traceIdService,
}: {
  repository: LocationRepository;
  policyId: number;
  state?: string;
  logger: ReturnType<typeof console.log> | any;
  traceIdService: TraceIdService;
}) {
  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "getPolicyLocationData",
      payload: { policyId, state },
      messageData: "retrieving location data",
    }),
  });

  const result = await repository.getLocationData(policyId, state);

  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "getPolicyLocationData",
      payload: {
        policyId,
        state,
        statesCount: result.states?.length || 0,
        citiesCount: result.cities?.length || 0,
      },
      messageData: "location data retrieved successfully",
    }),
  });

  return result;
}

export async function getPolicyLocationDataByPolicyIds({
  repository,
  policyIds,
  state,
  logger,
  traceIdService,
}: {
  repository: LocationByPolicyIdsRepository;
  policyIds: number[];
  state?: string;
  logger: ReturnType<typeof console.log> | any;
  traceIdService: TraceIdService;
}) {
  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "getPolicyLocationDataByPolicyIds",
      payload: { policyIds, state },
      messageData: "retrieving location data",
    }),
  });

  const result = await repository.getLocationDataByPolicyIds(policyIds, state);

  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "getPolicyLocationDataByPolicyIds",
      payload: {
        policyIds,
        state,
        statesCount: result.states?.length || 0,
        citiesCount: result.cities?.length || 0,
      },
      messageData: "location data retrieved successfully",
    }),
  });

  return result;
}

interface HospitalRepositoryArgs {
  hospitalRepository: Repository<MstrHospital>;
  policyIds: number[];
  searchParams: any;
  logger: ReturnType<typeof console.log> | any;
  traceIdService: TraceIdService;
  repositoryName: string;
}

interface HospitalExportRepositoryArgs extends Omit<HospitalRepositoryArgs, "searchParams"> {
  searchParams: any;
}

export async function searchHospitalsWithFilters({
  hospitalRepository,
  policyIds,
  searchParams,
  logger,
  traceIdService,
  repositoryName,
}: HospitalRepositoryArgs) {
  try {
    logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "success",
        location: repositoryName,
        method: "searchHospitals",
        payload: { policyIds, searchParams },
        messageData: "method invoked",
      }),
    });

    const uniquePolicyIds = Array.from(
      new Set((policyIds || []).filter((id) => Number.isFinite(id))),
    );
    const isSyncedOnlyMode = searchParams?.source === "API_SYNC";
    if (!uniquePolicyIds.length) {
      return {
        data: [],
        count: 0,
        networkHospitalCount: 0,
        excludedHospitalCount: 0,
      };
    }

    const {
      page = 1,
      limit = 10,
      search,
      sort,
      searchBy,
      state,
      city,
      pinCode,
      isNetworkHospital,
    } = searchParams;

    const isSyncedMode = isSyncedOnlyMode;

    const queryBuilder = hospitalRepository
      .createQueryBuilder("hospital")
      .leftJoinAndSelect("hospital.addresses", "addresses");

    if (isSyncedMode) {
      // Filter API_SYNC hospitals by the employee's TPA — derived from their policy → policy_tpa_map.
      // This ensures each employee only sees hospitals belonging to their own TPA(s).
      queryBuilder
        .where("hospital.source = :syncSource", { syncSource: "API_SYNC" })
        .andWhere(
          `hospital.tpa_id IN (SELECT ptm.tpa_id FROM policy_tpa_map ptm WHERE ptm.policy_id IN (:...policyIds))`,
          { policyIds: uniquePolicyIds },
        );
    } else {
      queryBuilder
        .innerJoinAndSelect("hospital.policyMappings", "policyMappings")
        .where("policyMappings.policyId IN (:...policyIds)", {
          policyIds: uniquePolicyIds,
        });

      if (isNetworkHospital !== undefined) {
        queryBuilder.andWhere("policyMappings.isNetworkHospital = :isNetworkHospital", {
          isNetworkHospital,
        });
      }
    }

    if (search || searchBy) {
      const searchTerm = search || searchBy;
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where("hospital.name ILIKE :search", {
            search: `%${searchTerm}%`,
          })
            .orWhere("hospital.code ILIKE :search", {
              search: `%${searchTerm}%`,
            })
            .orWhere("addresses.addressLine1 ILIKE :search", {
              search: `%${searchTerm}%`,
            })
            .orWhere("addresses.addressLine2 ILIKE :search", {
              search: `%${searchTerm}%`,
            })
            .orWhere("addresses.landmark ILIKE :search", {
              search: `%${searchTerm}%`,
            });
        })
      );
    }

    if (state) {
      queryBuilder.andWhere("LOWER(addresses.stateName) LIKE LOWER(:state)", {
        state: `%${state}%`,
      });
    }

    if (city) {
      queryBuilder.andWhere("LOWER(addresses.cityName) LIKE LOWER(:city)", {
        city: `%${city}%`,
      });
    }

    if (pinCode) {
      queryBuilder.andWhere("addresses.pinCode LIKE :pinCode", { pinCode: `${pinCode}%` });
    }

    // Was: `sort.split(":")` on the whole string, which only handles a
    // single "field:order" pair — a multi-column request like
    // "name:ASC,city:DESC" got treated as one pair (field="name",
    // order="ASC,city", silently defaulting to ASC), dropping every column
    // after the first. Split on "," first, then ":" per entry.
    const sortEntries = (sort || "")
      .split(",")
      .map((entry: string) => {
        const [field, order] = entry.trim().split(":");
        const sortField = HOSPITAL_SORT_FIELDS[field as keyof typeof HOSPITAL_SORT_FIELDS];
        if (!sortField) return null;
        let sortOrder = (order?.toUpperCase() as "ASC" | "DESC") || "ASC";
        if (
          HOSPITAL_BOOLEAN_SORT_FIELDS.includes(
            field as (typeof HOSPITAL_BOOLEAN_SORT_FIELDS)[number]
          )
        ) {
          sortOrder = sortOrder === "ASC" ? "DESC" : "ASC";
        }
        return { sortField, sortOrder };
      })
      .filter((entry: { sortField: string; sortOrder: string } | null): entry is { sortField: string; sortOrder: "ASC" | "DESC" } => Boolean(entry));

    if (sortEntries.length > 0) {
      sortEntries.forEach(({ sortField, sortOrder }: { sortField: string; sortOrder: "ASC" | "DESC" }, idx: number) => {
        if (idx === 0) {
          queryBuilder.orderBy(sortField, sortOrder);
        } else {
          queryBuilder.addOrderBy(sortField, sortOrder);
        }
      });
    } else {
      queryBuilder.orderBy("hospital.createdAt", "DESC");
    }

    const offset = (page - 1) * limit;
    const allHospitals = await queryBuilder.getMany();

    // Load addresses separately to bypass TypeORM's soft-delete filter on leftJoinAndSelect.
    // When mstr_hospital_address records have deleted_at set, TypeORM excludes them from
    // the JOIN, resulting in addresses: null. This fallback restores them.
    const nullAddressHospitals = allHospitals.filter(
      (h) => !h.addresses && Number.isFinite(h.addressId)
    );
    if (nullAddressHospitals.length > 0) {
      const missingAddressIds = [
        ...new Set(nullAddressHospitals.map((h) => h.addressId)),
      ];
      const loadedAddresses = await hospitalRepository.manager
        .getRepository(MstrHospitalAddress)
        .createQueryBuilder("addr")
        .where("addr.id IN (:...missingAddressIds)", { missingAddressIds })
        .withDeleted()
        .getMany();
      const addressById = new Map(loadedAddresses.map((a) => [a.id, a]));
      for (const hospital of nullAddressHospitals) {
        const found = addressById.get(hospital.addressId);
        if (found) {
          (hospital as any).addresses = found;
        }
      }
    }

    const hospitalById = new Map<number, MstrHospital>();
    for (const hospital of allHospitals) {
      if (!hospitalById.has(hospital.id)) {
        hospitalById.set(hospital.id, hospital);
      }
    }

    const uniqueHospitals = Array.from(hospitalById.values());
    const filteredCount = uniqueHospitals.length;
    const hospitals = uniqueHospitals.slice(offset, offset + limit);

    let networkHospitalCount = 0;
    let excludedHospitalCount = 0;
    let lastSyncedAt: Date | null = null;

    if (isSyncedMode) {
      // For synced hospitals: count all API_SYNC hospitals as network, none excluded
      const syncedCountRaw = await hospitalRepository
        .createQueryBuilder("hospital")
        .where("hospital.source = :source", { source: "API_SYNC" })
        .select("COUNT(DISTINCT hospital.id)", "count")
        .getRawOne<{ count: string }>();
      networkHospitalCount = Number(syncedCountRaw?.count ?? 0);

      const lastSyncedRawSync = await hospitalRepository
        .createQueryBuilder("hospital")
        .where("hospital.source = :source", { source: "API_SYNC" })
        .select("MAX(hospital.createdAt)", "lastSyncedAt")
        .getRawOne<{ lastSyncedAt: Date | null }>();
      lastSyncedAt = lastSyncedRawSync?.lastSyncedAt ?? null;
    } else {
      const networkHospitalCountRaw = await hospitalRepository
        .createQueryBuilder("hospital")
        .innerJoin("hospital.policyMappings", "policyMappings")
        .where("policyMappings.policyId IN (:...policyIds)", { policyIds: uniquePolicyIds })
        .andWhere("policyMappings.isNetworkHospital = :isNetwork", { isNetwork: true })
        .select("COUNT(DISTINCT hospital.id)", "count")
        .getRawOne<{ count: string }>();
      networkHospitalCount = Number(networkHospitalCountRaw?.count ?? 0);

      const excludedHospitalCountRaw = await hospitalRepository
        .createQueryBuilder("hospital")
        .innerJoin("hospital.policyMappings", "policyMappings")
        .where("policyMappings.policyId IN (:...policyIds)", { policyIds: uniquePolicyIds })
        .andWhere("policyMappings.isNetworkHospital = :isNetwork", { isNetwork: false })
        .select("COUNT(DISTINCT hospital.id)", "count")
        .getRawOne<{ count: string }>();
      excludedHospitalCount = Number(excludedHospitalCountRaw?.count ?? 0);

      const lastSyncedRaw = await hospitalRepository
        .createQueryBuilder("hospital")
        .innerJoin("hospital.policyMappings", "policyMappings")
        .where("policyMappings.policyId IN (:...policyIds)", { policyIds: uniquePolicyIds })
        .select("MAX(hospital.createdAt)", "lastSyncedAt")
        .getRawOne<{ lastSyncedAt: Date | null }>();
      lastSyncedAt = lastSyncedRaw?.lastSyncedAt ?? null;
    }

    logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "success",
        location: repositoryName,
        method: "searchHospitals",
        payload: {
          policyIds: uniquePolicyIds,
          filteredCount,
          networkHospitalCount,
          excludedHospitalCount,
          hospitalsFound: hospitals.length,
          lastSyncedAt,
        },
        messageData: "search completed successfully",
      }),
    });

    return {
      data: hospitals,
      count: filteredCount,
      networkHospitalCount,
      excludedHospitalCount,
      lastSyncedAt,
    };
  } catch (error) {
    logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "failure",
        location: repositoryName,
        method: "searchHospitals",
        payload: { policyIds, searchParams },
        messageData: error instanceof Error ? error.message : String(error),
      }),
    });
    throw error;
  }
}

export async function exportHospitalsWithFilters({
  hospitalRepository,
  policyId,
  searchParams,
  logger,
  traceIdService,
  repositoryName,
}: HospitalExportRepositoryArgs) {
  try {
    logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "success",
        location: repositoryName,
        method: "exportHospitalsToExcel",
        payload: { policyId, searchParams },
        messageData: "method invoked",
      }),
    });

    const { search, sort, searchBy, state, city, pinCode, isNetworkHospital } = searchParams;

    const queryBuilder = hospitalRepository
      .createQueryBuilder("hospital")
      .leftJoinAndSelect("hospital.addresses", "addresses")
      .leftJoinAndSelect("hospital.policyMappings", "policyMappings")
      .where("policyMappings.policyId = :policyId", { policyId });

    if (isNetworkHospital !== undefined) {
      queryBuilder.andWhere("policyMappings.isNetworkHospital = :isNetworkHospital", {
        isNetworkHospital: isNetworkHospital,
      });
    }

    if (search || searchBy) {
      const searchTerm = search || searchBy;
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where("hospital.name ILIKE :search", {
            search: `%${searchTerm}%`,
          })
            .orWhere("hospital.code ILIKE :search", {
              search: `%${searchTerm}%`,
            })
            .orWhere("addresses.addressLine1 ILIKE :search", {
              search: `%${searchTerm}%`,
            })
            .orWhere("addresses.addressLine2 ILIKE :search", {
              search: `%${searchTerm}%`,
            })
            .orWhere("addresses.landmark ILIKE :search", {
              search: `%${searchTerm}%`,
            });
        })
      );
    }

    if (state) {
      queryBuilder.andWhere("LOWER(addresses.stateName) LIKE LOWER(:state)", {
        state: `%${state}%`,
      });
    }

    if (city) {
      queryBuilder.andWhere("LOWER(addresses.cityName) LIKE LOWER(:city)", {
        city: `%${city}%`,
      });
    }

    if (pinCode) {
      queryBuilder.andWhere("addresses.pinCode LIKE :pinCode", { pinCode: `${pinCode}%` });
    }

    // Same multi-column fix as searchHospitalsWithFilters above — split on
    // "," first, then ":" per entry, instead of treating the whole string
    // as one "field:order" pair.
    const sortEntries = (sort || "")
      .split(",")
      .map((entry: string) => {
        const [field, order] = entry.trim().split(":");
        const sortField = HOSPITAL_SORT_FIELDS[field as keyof typeof HOSPITAL_SORT_FIELDS];
        if (!sortField) return null;
        let sortOrder = (order?.toUpperCase() as "ASC" | "DESC") || "ASC";
        if (
          HOSPITAL_BOOLEAN_SORT_FIELDS.includes(
            field as (typeof HOSPITAL_BOOLEAN_SORT_FIELDS)[number]
          )
        ) {
          sortOrder = sortOrder === "ASC" ? "DESC" : "ASC";
        }
        return { sortField, sortOrder };
      })
      .filter((entry: { sortField: string; sortOrder: string } | null): entry is { sortField: string; sortOrder: "ASC" | "DESC" } => Boolean(entry));

    if (sortEntries.length > 0) {
      sortEntries.forEach(({ sortField, sortOrder }: { sortField: string; sortOrder: "ASC" | "DESC" }, idx: number) => {
        if (idx === 0) {
          queryBuilder.orderBy(sortField, sortOrder);
        } else {
          queryBuilder.addOrderBy(sortField, sortOrder);
        }
      });
    } else {
      queryBuilder.orderBy("hospital.name", "ASC");
    }

    const hospitals = await queryBuilder.getMany();

    const networkHospitalCount = await hospitalRepository
      .createQueryBuilder("hospital")
      .leftJoin("hospital.policyMappings", "policyMappings")
      .where("policyMappings.policyId = :policyId", { policyId })
      .andWhere("policyMappings.isNetworkHospital = :isNetwork", {
        isNetwork: true,
      })
      .getCount();

    const excludedHospitalCount = await hospitalRepository
      .createQueryBuilder("hospital")
      .leftJoin("hospital.policyMappings", "policyMappings")
      .where("policyMappings.policyId = :policyId", { policyId })
      .andWhere("policyMappings.isNetworkHospital = :isNetwork", {
        isNetwork: false,
      })
      .getCount();

    logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "success",
        location: repositoryName,
        method: "exportHospitalsToExcel",
        payload: {
          policyId,
          networkHospitalCount,
          excludedHospitalCount,
          hospitalsExported: hospitals.length,
        },
        messageData: "hospitals export data retrieved successfully",
      }),
    });

    return {
      data: hospitals,
      networkHospitalCount,
      excludedHospitalCount,
    };
  } catch (error) {
    logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "failure",
        location: repositoryName,
        method: "exportHospitalsToExcel",
        payload: { policyId, searchParams },
        messageData: error instanceof Error ? error.message : String(error),
      }),
    });
    throw error;
  }
}

export async function getPolicyLocationDataFromRepository({
  hospitalRepository,
  policyIds,
  policyId,
  state,
  logger,
  traceIdService,
  repositoryName,
}: Omit<HospitalRepositoryArgs, "searchParams"> & {
  policyId?: number;
  state?: string;
}) {
  try {
    const normalizedPolicyIds = Array.from(
      new Set(
        (
          policyIds?.length
            ? policyIds
            : policyId !== undefined && policyId !== null
              ? [policyId]
              : []
        ).filter((id) => Number.isFinite(id)),
      ),
    );

    if (!normalizedPolicyIds.length) {
      return state
        ? { cities: [], selectedState: state }
        : { states: [] };
    }

    logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "success",
        location: repositoryName,
        method: "getLocationData",
        payload: { policyIds: normalizedPolicyIds, state },
        messageData: "method invoked",
      }),
    });

    if (state) {
      const cities = await hospitalRepository
        .createQueryBuilder("hospital")
        .leftJoin("hospital.addresses", "addresses")
        .leftJoin("hospital.policyMappings", "policyMappings")
        .select("DISTINCT addresses.cityName", "cityName")
        .where("policyMappings.policyId IN (:...policyIds)", {
          policyIds: normalizedPolicyIds,
        })
        .andWhere("LOWER(addresses.stateName) = LOWER(:state)", { state })
        .andWhere("addresses.cityName IS NOT NULL")
        .orderBy("addresses.cityName", "ASC")
        .getRawMany();

      const cityList = cities
        .map((row) => row.cityName)
        .filter((cityName: string) => cityName && cityName.trim().length > 0);

      return {
        cities: cityList,
        selectedState: state,
      };
    }

    const states = await hospitalRepository
      .createQueryBuilder("hospital")
      .leftJoin("hospital.addresses", "addresses")
      .leftJoin("hospital.policyMappings", "policyMappings")
      .select("DISTINCT addresses.stateName", "stateName")
      .where("policyMappings.policyId IN (:...policyIds)", {
        policyIds: normalizedPolicyIds,
      })
      .andWhere("addresses.stateName IS NOT NULL")
      .orderBy("addresses.stateName", "ASC")
      .getRawMany();

    const stateList = states
      .map((row) => row.stateName)
      .filter((stateName: string) => stateName && stateName.trim().length > 0);

    return { states: stateList };
  } catch (error) {
    logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "failure",
        location: repositoryName,
        method: "getLocationData",
        payload: { policyIds: policyIds ?? (policyId ? [policyId] : []), state },
        messageData: error instanceof Error ? error.message : String(error),
      }),
    });
    throw error;
  }
}

export async function getActivePolicyFeatureDocumentFromRepository({
  policyFeatureDocumentRepository,
  policyId,
  logger,
  traceIdService,
  repositoryName,
}: {
  policyFeatureDocumentRepository: Repository<PolicyFeatureDocument>;
  policyId: number;
  logger: ReturnType<typeof console.log> | any;
  traceIdService: TraceIdService;
  repositoryName: string;
}) {
  try {
    logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "success",
        location: repositoryName,
        method: "getActivePolicyFeatureDocument",
        payload: { policyId },
        messageData: "Fetching active policy feature document",
      }),
    });

    const [documents, count] = await policyFeatureDocumentRepository.findAndCount({
      where: {
        policyId,
        status: "ACTIVE",
        deletedAt: IsNull(),
      },
      relations: ["fileUpload", "createdByUser"],
      order: {
        createdAt: "DESC",
      },
    });

    const data = documents.map((doc) => ({
      id: doc.id,
      policyId: doc.policyId,
      documentId: doc.documentId,
      fileName:
        extractFileNameFromKey(doc.fileUpload?.fileKey) ||
        doc.fileUpload?.uploadType ||
        "Policy Feature Document",
      fileStatus: doc.status || "ACTIVE",
      uploadedAt: formatDate(doc.createdAt),
      uploadedBy: doc.createdBy,
      uploadedByName: doc.createdByUser
        ? `${doc.createdByUser.firstName || ""} ${doc.createdByUser.lastName || ""}`.trim()
        : "Unknown User",
    }));

    logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "success",
        location: repositoryName,
        method: "getActivePolicyFeatureDocument",
        payload: { policyId, count },
        messageData: `Successfully fetched ${data.length} active policy feature document records`,
      }),
    });

    return { data, count };
  } catch (error) {
    logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: traceIdService.traceId,
        status: "failure",
        location: repositoryName,
        method: "getActivePolicyFeatureDocument",
        payload: { policyId },
        messageData: error instanceof Error ? error.message : String(error),
      }),
    });
    throw error;
  }
}

function extractFileNameFromKey(fileKey: string | null | undefined): string | null {
  if (!fileKey) return null;

  try {
    const parts = fileKey.split("/");
    return parts[parts.length - 1] || null;
  } catch {
    return null;
  }
}

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  };
  const formatted = new Intl.DateTimeFormat("en-GB", options).format(date);
  return formatted.replace(/\b(am|pm)\b/g, (match) => match.toUpperCase());
}

async function createExcelBuffer(data: Record<string, unknown>[], sheetName: string): Promise<Buffer> {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  });
}

export async function generateHospitalExport({
  repository,
  policyId,
  searchParams,
  userId,
  logger,
  traceIdService,
}: {
  repository: {
    exportHospitalsToExcel(
      policyId: number,
      searchParams: any,
      userId: number
    ): Promise<{
      data: any[];
      networkHospitalCount: number;
      excludedHospitalCount: number;
    }>;
  };
  policyId: number;
  searchParams: any;
  userId: number;
  logger: ReturnType<typeof console.log> | any;
  traceIdService: TraceIdService;
}) {
  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "exportHospitalsToExcel",
      payload: { policyId, searchParams, userId },
      messageData: "method invoked",
    }),
  });

  const result = await repository.exportHospitalsToExcel(policyId, searchParams, userId);

  const excelData = result.data.map((hospital, index) => ({
    "Sr. No.": index + 1,
    [HOSPITAL_TEMPLATE_HEADERS[0]]: hospital.name || "",
    [HOSPITAL_TEMPLATE_HEADERS[1]]: hospital.code || "",
    [HOSPITAL_TEMPLATE_HEADERS[2]]: hospital.addresses?.addressLine1 || "",
    [HOSPITAL_TEMPLATE_HEADERS[3]]: hospital.addresses?.cityName || "",
    [HOSPITAL_TEMPLATE_HEADERS[4]]: hospital.addresses?.stateName || "",
    [HOSPITAL_TEMPLATE_HEADERS[5]]: hospital.addresses?.pinCode || "",
    [HOSPITAL_TEMPLATE_HEADERS[7]]: hospital.addresses?.phoneNumber || "",
    [HOSPITAL_TEMPLATE_HEADERS[6]]: hospital.addresses?.email || "",
    [HOSPITAL_TEMPLATE_HEADERS[8]]: hospital.policyMappings?.[0]?.isNetworkHospital
      ? "Network"
      : "Excluded",
    Country: hospital.addresses?.countryName || "India",
  }));

  const excelBuffer = await createExcelBuffer(excelData, "Hospitals_Export");

  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `Hospitals_Export_Policy_${policyId}_${timestamp}.xlsx`;

  logger.log({
    level: "info",
    message: buildLogMessage({
      traceId: traceIdService.traceId,
      status: "success",
      location: "PortalConfigurationUtil",
      method: "exportHospitalsToExcel",
      payload: {
        policyId,
        recordsExported: excelData.length,
        fileName,
      },
      messageData: "Excel export generated successfully",
    }),
  });

  const stream = Readable.from(excelBuffer);

  return {
    stream,
    fileName,
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    contentLength: excelBuffer.length,
  };
}
