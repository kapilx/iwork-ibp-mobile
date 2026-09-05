/**
 * Data transformation utilities for removing audit fields and transforming responses
 */

// Define audit fields interface
interface AuditFields {
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
  deletedAt?: Date;
  deletedBy?: number;
}

type EntityWithoutAudit<T> = Omit<T, keyof AuditFields>;

/**
 * Remove audit fields from entity response
 * @param entity - Entity object or array of entities
 * @returns Clean entity without audit fields
 */
export function removeAuditFields<T extends Record<string, unknown>>(entity: T): EntityWithoutAudit<T>;
export function removeAuditFields<T extends Record<string, unknown>>(entities: T[]): Array<EntityWithoutAudit<T>>;
export function removeAuditFields<T extends Record<string, unknown>>(entityOrEntities: T | T[]): EntityWithoutAudit<T> | Array<EntityWithoutAudit<T>> {
  if (Array.isArray(entityOrEntities)) {
    return entityOrEntities.map(entity => removeAuditFieldsFromSingle(entity));
  }
  return removeAuditFieldsFromSingle(entityOrEntities);
}

/**
 * Remove audit fields from a single entity
 */
function removeAuditFieldsFromSingle<T extends Record<string, unknown>>(entity: T): EntityWithoutAudit<T> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { createdAt, updatedAt, createdBy, updatedBy, deletedAt, deletedBy, ...rest } = entity as T & AuditFields;
  return rest as EntityWithoutAudit<T>;
}

// Address transformation interfaces
interface AddressLookup {
  id: number;
  name: string;
}

interface AddressWithLookups {
  id?: number;
  addressLine1?: string;
  addressLine2?: string;
  pinCode?: string;
  landmark?: string;
  phoneNumber?: string;
  alternatePhoneNumber?: string;
  email?: string;
  // String-based location properties (new)
  cityName?: string;
  stateName?: string;
  countryName?: string;
  // ID-based properties (legacy, for backward compatibility)
  stateId?: AddressLookup | number;
  cityId?: AddressLookup | number;
  countryId?: AddressLookup | number;
}

interface TransformedAddress extends Record<string, unknown> {
  stateName: string | null;
  cityName: string | null;
  countryName: string | null;
  stateId: number | null;
  cityId: number | null;
  countryId: number | null;
}

/**
 * Transform address with lookup names for state, city, and country
 * Updated to use string-based storage instead of ID lookups
 * @param addresses - Array of address objects with string-based location data
 * @returns Transformed addresses with string-based location names
 */
export function transformAddressLookups(addresses: AddressWithLookups[] | null | undefined): TransformedAddress[] {
  if (!addresses || !Array.isArray(addresses)) {
    return [];
  }
  
  return addresses.map(address => {
    const addressRecord = address as Record<string, unknown>;
    
    return {
      ...removeAuditFieldsFromSingle(addressRecord),
      // Use string-based properties directly if available, fallback to ID-based lookup for backward compatibility
      stateName: (addressRecord.stateName as string) || (address.stateId as AddressLookup)?.name || null,
      cityName: (addressRecord.cityName as string) || (address.cityId as AddressLookup)?.name || null,
      countryName: (addressRecord.countryName as string) || (address.countryId as AddressLookup)?.name || 'India',
      // Keep original IDs for reference if they exist (for backward compatibility)
      stateId: (address.stateId as AddressLookup)?.id || (address.stateId as number) || null,
      cityId: (address.cityId as AddressLookup)?.id || (address.cityId as number) || null,
      countryId: (address.countryId as AddressLookup)?.id || (address.countryId as number) || null,
    };
  });
}

// Hospital transformation interfaces  
interface HospitalEntity extends Record<string, unknown> {
  addresses?: AddressWithLookups | null;
  policyMappings?: Record<string, unknown>[] | null;
  createdAt?: Date | null;
}

interface TransformedHospital extends Record<string, unknown> {
  addresses: TransformedAddress | null;
  isNetworkHospital: boolean;
  classification: string;
  policyMappings: Record<string, unknown>[];
  createdAt: Date | null;
}

/**
 * Transform a single address with lookup names for state, city, and country
 * Updated to use string-based storage instead of ID lookups
 * @param address - Single address object with string-based location data
 * @returns Transformed address with string-based location names
 */
export function transformSingleAddressLookups(address: AddressWithLookups | null | undefined): TransformedAddress | null {
  if (!address) {
    return null;
  }
  
  const addressRecord = address as Record<string, unknown>;
  
  return {
    ...removeAuditFieldsFromSingle(addressRecord),
    // Use string-based properties directly if available, fallback to ID-based lookup for backward compatibility
    stateName: (addressRecord.stateName as string) || (address.stateId as AddressLookup)?.name || null,
    cityName: (addressRecord.cityName as string) || (address.cityId as AddressLookup)?.name || null,
    countryName: (addressRecord.countryName as string) || (address.countryId as AddressLookup)?.name || 'India',
    // Keep original IDs for reference if they exist (for backward compatibility)
    stateId: (address.stateId as AddressLookup)?.id || (address.stateId as number) || null,
    cityId: (address.cityId as AddressLookup)?.id || (address.cityId as number) || null,
    countryId: (address.countryId as AddressLookup)?.id || (address.countryId as number) || null,
  };
}

/**
 * Transform hospital search results with clean response structure
 * @param hospitals - Array of hospital entities
 * @returns Transformed hospitals with clean addresses and audit fields removed
 */
export function transformHospitalSearchResults(hospitals: HospitalEntity[] | null | undefined): TransformedHospital[] {
  if (!hospitals || !Array.isArray(hospitals)) {
    return [];
  }
  
  return hospitals.map(hospital => {
    const cleanHospital = removeAuditFieldsFromSingle(hospital);

    // Extract hospital network information from policy mappings
    const policyMapping = hospital.policyMappings && Array.isArray(hospital.policyMappings)
      ? hospital.policyMappings[0]
      : null;

    const isNetworkHospital = policyMapping ?
      Boolean((policyMapping as Record<string, unknown>).isNetworkHospital) : false;
    const classification = policyMapping ?
      (isNetworkHospital ? 'Network' : 'Excluded') : 'Unknown';

    return {
      ...cleanHospital,
      createdAt: hospital.createdAt ?? null,
      addresses: transformSingleAddressLookups(hospital.addresses),
      isNetworkHospital,
      classification,
      policyMappings: hospital.policyMappings && Array.isArray(hospital.policyMappings)
        ? hospital.policyMappings.map(pm => removeAuditFieldsFromSingle(pm))
        : [],
    };
  });
}

export function removeUndefinedFields<T extends Record<string, any>>(
  obj: T
): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}