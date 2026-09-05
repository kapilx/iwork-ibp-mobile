import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, ILike, In, IsNull, Not, Or, Repository } from "typeorm";
import {
  DEFAULT_ACTIVE_STATUS,
  DEFAULT_FILTER,
  DEFAULT_VALUES,
  FILTER_STATUS,
  FILTER_TYPE,
  serviceNames,
  USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
} from "../../../../service-lib/src/lib/constants";
import {
  FilterPreference,
  LookUp,
  PolicyTypeSegregation,
  User,
} from "../../../../service-lib/src/lib/entities";
import { getSelectableColumns } from "../../../../service-lib/src/lib/utils/entity-selection.utils";
import { getEntityByName } from "../../../../service-lib/src/lib/utils/get-entity.utils";
import {
  buildCoversMeta,
  CoverInputLov,
  CoverInputType,
} from "../../../../service-lib/src/lib/utils/cover-meta.util";
import { mapSearchParams } from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { removeMetadataFields } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import {
  CreateFilterPreferenceDto,
  UpdateFilterPreferenceDto,
} from "./dto/filter-preference.dto";
/**
 * MasterRepository
 * Handles database operations for generic CRUD operations on entities.
 */
export interface FilterLookups {
  filterTypeUser: LookUp;
  filterTypeSystem: LookUp;
  filterStatusActive: LookUp;
  filterStatusInactive: LookUp;
  defaultFilterYes: LookUp;
  defaultFilterNo: LookUp;
}
@Injectable()
export class MasterRepository {
  private readonly logger: ReturnType<typeof createLogger>;
  // Mapping for LID columns to specific lookup_name
  private static readonly LOOKUP_COLUMN_MAP: Array<{
    entity: string;
    column: string;
    key_name: string;
  }> = [
    { entity: DEFAULT_VALUES.ORGANISATION_ENTITY, column: "statusLid", key_name: "MASTER_STATUS" },
    { entity: DEFAULT_VALUES.ORG_BRANCH_ENTITY, column: "statusLid", key_name: "MASTER_STATUS" },
    { entity: DEFAULT_VALUES.ORG_DEPARTMENT_ENTITY, column: "statusLid", key_name: "MASTER_STATUS" },
    { entity: DEFAULT_VALUES.ORG_DESIGNATION_ENTITY, column: "statusLid", key_name: "MASTER_STATUS" },
    { entity: DEFAULT_VALUES.ORG_VERTICAL_ENTITY, column: "statusLid", key_name: "MASTER_STATUS" },
    { entity: DEFAULT_VALUES.ORG_SBU_ENTITY, column: "statusLid", key_name: "MASTER_STATUS" },
  ];
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(FilterPreference)
    private readonly filterRepository: Repository<FilterPreference>,
    @InjectRepository(PolicyTypeSegregation)
    private readonly policyTypeSegregationRepository: Repository<PolicyTypeSegregation>,
    private readonly traceIdService: TraceIdService,
    private readonly entityService: EntityService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Helper function to check if a column type is integer
   */
  private isIntegerType(colType: any): boolean {
    return typeof colType === 'string' && /(int|integer|bigint)/i.test(colType);
  }

  private toNullableNumber(v: any): number | null {
    return v != null ? Number(v) : null;
  }

  /**
   * Dynamically processes filter criteria for any field pattern
   */
  private async processDynamicFilters(
    additionalFilters: Record<string, any>,
    where: Record<string, any>,
    repository: any
  ): Promise<void> {
    // Map of field patterns to entity mappings for lookup resolution
    const fieldEntityMap: Record<string, string> = {
      'state': DEFAULT_VALUES.STATE_ENTITY,
      'organisation': DEFAULT_VALUES.ORGANISATION_ENTITY,
      'sbu': DEFAULT_VALUES.ORG_SBU_ENTITY,
      'vertical': DEFAULT_VALUES.ORG_VERTICAL_ENTITY,
      'department': DEFAULT_VALUES.ORG_DEPARTMENT_ENTITY,
      'designation': DEFAULT_VALUES.ORG_DESIGNATION_ENTITY,
      'branch': DEFAULT_VALUES.ORG_BRANCH_ENTITY
    };

    // Get entity name for lookup column mapping
    const entityName = repository.metadata.tableName;

    for (const [fieldKey, fieldValue] of Object.entries(additionalFilters)) {
      if (!fieldValue) continue;

      // Handle xxxName dynamically 
      if (fieldKey.endsWith('Name')) {
        const baseField = fieldKey.slice(0, -4); 
        const idField = `${baseField}Id`;
        const lidField = `${baseField}Lid`;
        
        // Check if the corresponding ID field is already provided
        if (additionalFilters[idField] || additionalFilters[lidField]) continue;

        // Check if this is a lookup field using the LOOKUP_COLUMN_MAP
        const lookupMapping = MasterRepository.LOOKUP_COLUMN_MAP.find(
          mapping => mapping.entity === entityName && mapping.column === lidField
        );

        if (lookupMapping) {
          // This is a lookup field - query the lookup_data table
          try {
            const statusLookup = await this.lookUpRepository.findOne({
              where: { 
                lookUpName: lookupMapping.key_name,
                lookUpValue: ILike(`%${fieldValue}%`)
              },
              select: ["id"],
            });
            
            if (statusLookup) {
              where[lidField] = statusLookup.id;
            } else {
              where[lidField] = -1; // No results if no matching lookup value
            }
          } catch (error) {
            console.warn("Could not process lookup filter for %s:", fieldKey, error instanceof Error ? error.message : 'Unknown error');
          }
        } else {
          // Handle regular entity name lookups (vertical, sbu, department, etc.)
          const entityKey = baseField.toLowerCase();
          const relatedEntityName = fieldEntityMap[entityKey];
          
          if (relatedEntityName) {
            try {
              const lookupRepo = this.dataSource.getRepository(getEntityByName(relatedEntityName));
              const matchingRecords = await lookupRepo.find({
                where: { name: ILike(`%${fieldValue}%`) },
                select: ["id"],
              });
              
              if (matchingRecords.length > 0) {
                const matchingIds = matchingRecords.map(record => record.id);
                where[idField] = In(matchingIds);
              } else {
                where[idField] = -1; // No results if no matching records
              }
            } catch (error) {
              console.warn("Could not process filter for %s:", fieldKey, error instanceof Error ? error.message : 'Unknown error');
            }
          }
        }
      } else {
        // Regular field - check if it exists in the entity and handle appropriately
        const column = repository.metadata.columns.find((c: any) => c.propertyName === fieldKey);
        if (column) {
          const columnType = column.type;
          
          // Use ILike for text-based columns, exact match for others
          if (columnType && typeof columnType === 'string' && /(char|text|varchar)/i.test(columnType)) {
            where[fieldKey] = ILike(`%${fieldValue}%`);
          } else if (columnType && typeof columnType === 'string' && /(int|integer|bigint)/i.test(columnType)) {
            // For integer columns, convert value to number if possible
            const numericValue = Number(fieldValue);
            if (!isNaN(numericValue)) {
              where[fieldKey] = numericValue;
            }
          } else {
            // For other types, try exact match
            where[fieldKey] = fieldValue;
          }
        }
      }
    }
  }

  /**
   * Builds metadata for an entity using TypeORM metadata.
   */
  async buildEntityMetadata(
    entity: string
  ): Promise<{
    endPoint: string;
    parameterList: { name: string; label: string; dataType: string; options: any[] | null }[];
    resultsList: { name: string; label: string; dataType: string; alignment?: string }[];
    formConfig: Record<
      string,
      {
        dataType: string;
        fieldType: string;
        optionType: string | null;
        option: any;
        validation: { max?: number; min?: number };
      }
    >;
  }> {
    const entityClass = getEntityByName(entity);
    const repository = this.dataSource.getRepository(entityClass);
    if (!repository) {
      throw new InternalServerErrorException("Invalid entity name");
    }

    const excluded = [
      "createdAt",
      "updatedAt",
      "deletedAt",
      "deletedBy",
      "createdBy",
      "updatedBy",
      "password",
    ];

    // Map TypeORM column types to UI data types and field types
    const mapDataType = (type: any): string => {
      const t = String(type);
      if (/(char|text)/i.test(t)) return "string";
      if (/(int|integer|bigint)/i.test(t)) return "number";
      if (/(float|double|decimal|numeric|real)/i.test(t)) return "float";
      if (/(date|time|timestamp)/i.test(t)) return /(time)/i.test(t) ? (/(date)/i.test(t) ? "datetime" : "time") : "date";
      if (/(bool)/i.test(t)) return "boolean";
      if (/(json)/i.test(t)) return "jsonb";
      return "string";
    };

    const toLabel = (name: string) =>
      name
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/^./, (c) => c.toUpperCase());

    // Build results (grid) columns
    const selectable = getSelectableColumns(repository.metadata, excluded);
    const resultsList = Object.keys(selectable).map((name) => {
      const col = repository.metadata.columns.find((c) => c.propertyName === name);
      return {
        name,
        label: toLabel(name),
        dataType: mapDataType(col?.type),
      };
    });

    // Add companion '*Name' display columns for LIDs and FK join columns
    const joinColumnNames = new Set(
      repository.metadata.relations
        .flatMap((r) => r.joinColumns?.map((jc) => jc.propertyName) || [])
        .filter(Boolean)
    );
    const extraNameColumns: { name: string; label: string; dataType: string }[] = [];
    for (const rc of resultsList) {
      const isLid = /Lid$/.test(rc.name);
      const isFkId = joinColumnNames.has(rc.name);
      if (isLid || isFkId) {
        let base = rc.name;
        if (base.endsWith("Lid")) base = base.slice(0, -3);
        else if (base.endsWith("Id")) base = base.slice(0, -2);
        const displayName = `${base}Name`;
        if (!resultsList.some((c) => c.name === displayName)) {
          extraNameColumns.push({ name: displayName, label: toLabel(base), dataType: "string" });
        }
      }
    }
    // Build final results list: drop raw id columns if we added corresponding Name columns
    const filteredBase = resultsList.filter(
      (rc) => !(/Lid$/.test(rc.name) || joinColumnNames.has(rc.name))
    );
    const resultsWithNames = extraNameColumns.length ? [...filteredBase, ...extraNameColumns] : filteredBase;

    // Choose some filterable parameters (prefer string/number columns)
    const parameterList = await Promise.all(
      resultsWithNames
        .filter((c) => ["string", "number", "date"].includes(c.dataType))
        .slice(0, 5) // keep it lean for UI
        .map(async (c) => {
          let options: any[] | null = null;
          
          // Check if this field should have dropdown options
          // First check if there's an original column (not a generated *Name field)
          const originalColumn = repository.metadata.columns.find(col => col.propertyName === c.name);
          
          // For generated *Name fields, check if they correspond to an ID field
          let columnToCheck = originalColumn?.propertyName;
          if (!originalColumn && c.name.endsWith('Name')) {
            // This might be a generated *Name field, find corresponding ID field
            const baseName = c.name.replace(/Name$/, '');
            const idField = `${baseName}Id`;
            const lidField = `${baseName}Lid`;
            
            // Check if corresponding ID or Lid field exists
            const idColumn = repository.metadata.columns.find(col => col.propertyName === idField);
            const lidColumn = repository.metadata.columns.find(col => col.propertyName === lidField);
            
            if (idColumn) {
              columnToCheck = idField;
            } else if (lidColumn) {
              columnToCheck = lidField;
            }
          }
          
          if (columnToCheck) {
            // Find relation for this column
            const relation = repository.metadata.relations.find((r) =>
              r.joinColumns?.some((jc) => jc.propertyName === columnToCheck)
            );
            
            // Check if it's an ID field (foreign key or lookup)
            const isIdField = /Id$/.test(columnToCheck) || /Lid$/.test(columnToCheck);
            
            if (relation || isIdField) {
              let relatedName: string | undefined;
              
              if (relation?.inverseEntityMetadata?.tableName) {
                relatedName = relation.inverseEntityMetadata.tableName;
              } else if (columnToCheck === 'parentOrganisationId') {
                relatedName = DEFAULT_VALUES.ORGANISATION_ENTITY;
              } else if (columnToCheck?.endsWith('Id')) {
                // Try naive inference: strip trailing Id
                relatedName = columnToCheck.replace(/Id$/, "");
              } else if (columnToCheck?.endsWith('Lid')) {
                // For Lid fields, we'll use lookup_data
                relatedName = DEFAULT_VALUES.LOOKUP_DATA_ENTITY;
              }
              
              // Check if it's a lookup field
              const isLookup = (relation?.inverseEntityMetadata?.tableName === DEFAULT_VALUES.LOOKUP_DATA_ENTITY) || /Lid$/.test(columnToCheck);
              
              if (isLookup) {
                // For lookup fields, fetch from lookup_data
                const mapEntry = MasterRepository.LOOKUP_COLUMN_MAP.find((m) => 
                  m.entity === entity && m.column === columnToCheck
                );
                if (mapEntry) {
                  try {
                    const lookupOptions = await this.lookUpRepository.find({
                      where: { lookUpName: mapEntry.key_name },
                      select: ['id', 'lookUpValue'],
                      order: { lookUpValue: 'ASC' }
                    });
                    options = lookupOptions.map(item => ({ 
                      value: item.id, 
                      label: item.lookUpValue 
                    }));
                  } catch (error) {
                    // If lookup fails, keep options as null
                    console.warn("Failed to fetch lookup options for %s:", columnToCheck, error);
                  }
                }
              } else if (relatedName && relatedName !== DEFAULT_VALUES.LOOKUP_DATA_ENTITY) {
                // For regular foreign key fields, fetch from the related entity
                try {
                  const entityOptions = await this.getOptionList(relatedName);
                  options = entityOptions.map(item => ({ 
                    value: item.id, 
                    label: item.name 
                  }));
                } catch (error) {
                  // If fetching options fails, keep options as null
                  console.warn("Failed to fetch entity options for %s from %s:", columnToCheck, relatedName, error);
                }
              }
            }
          }
          
          return { 
            name: c.name, 
            label: c.label, 
            dataType: c.dataType, 
            options 
          };
        })
    );

    // Build form config, excluding primary key(s) and audit fields
    const formConfig: Record<string, {
      fieldName: string;
      dataType: string;
      fieldType: string;
      optionType: string | null;
      option: string | null;
      validation: { max?: number; min?: number };
    }> = {};
    for (const col of repository.metadata.columns) {
      const name = col.propertyName;
      if (excluded.includes(name)) continue;
      if (col.isPrimary) continue;

      const dataType = mapDataType(col.type);
      // default field type mapping
      let fieldType = dataType === "date" || dataType === "datetime" || dataType === "time" ? "datepicker" : "input";
      let optionType: string | null = null;
      let option: string | null = null;

      // If column matches a relation join column (ends with Id and relation exists), mark as dropdown
      const relation = repository.metadata.relations.find((r) =>
        r.joinColumns?.some((jc) => jc.propertyName === name)
      );
      if (relation || /Id$/.test(name)) {
        fieldType = "dropdown";
        optionType = "API";
        // Infer related entity table name for API
        let relatedName: string | undefined;
        
        
        if (relation?.inverseEntityMetadata?.tableName) {
          relatedName = relation.inverseEntityMetadata.tableName;
        } else if (name == 'parentOrganisationId') {
          relatedName = DEFAULT_VALUES.ORGANISATION_ENTITY;
        } else {
          // try naive inference: strip trailing Id
          relatedName = name.replace(/Id$/, "");
        }
        // If related to lookup_data or column is LID, include lookupName if known
        const isLookup = (relation?.inverseEntityMetadata?.tableName === DEFAULT_VALUES.LOOKUP_DATA_ENTITY) || /Lid$/.test(name);
        const mapEntry = MasterRepository.LOOKUP_COLUMN_MAP.find((m) => m.entity === entity && m.column === name);
        const qp = isLookup && mapEntry ? `?lookupName=${encodeURIComponent(mapEntry.key_name)}` : "";
        option = `/master/${relatedName}/options${qp}`;
      }

      const cfg = {
        fieldName: name,
        dataType,
        fieldType,
        optionType,
        option,
        validation: {
          max: typeof col.length === "number" ? (col.length as unknown as number) : undefined,
          min: dataType === "number" || dataType === "float" ? 0 : undefined,
        },
      };
      formConfig[toLabel(name)] = cfg;
    }

    // Integer 'status' columns render as Active/Inactive dropdown across all entities
    if (formConfig["Status"]?.dataType === "number" && formConfig["Status"]?.fieldType === "input") {
      formConfig["Status"] = {
        ...formConfig["Status"],
        fieldType: "dropdown",
        optionType: "Raw",
        option: [{ value: 1, label: "Active" }, { value: 0, label: "Inactive" }] as any,
      };
    }

    // POLICY_TYPE: override filters, grid columns and form config
    let finalParameterList = parameterList;
    let finalResultsList = resultsWithNames;

    if (entity === DEFAULT_VALUES.POLICY_TYPE) {
      // Filter: lookUpValue + status dropdown + organisation dropdown
      let orgFilterOptions: { value: string; label: string }[] = [];
      try {
        const orgs = await this.getOptionList(DEFAULT_VALUES.ORGANISATION_ENTITY);
        orgFilterOptions = orgs.map((o) => ({ value: String(o.name), label: String(o.name) }));
      } catch {
        // Non-fatal — fall back to empty list
      }

      finalParameterList = [
        { name: "lookUpValue", label: "Look Up Value", dataType: "string", options: null },
        {
          name: "status",
          label: "Status",
          dataType: "string",
          // String values so processDynamicFilters correctly converts "1"→1 and "0"→0
          options: [{ value: "1", label: "Active" }, { value: "0", label: "Inactive" }],
        },
        {
          name: "organisationName",
          label: "Organisation",
          dataType: "string",
          options: orgFilterOptions,
        },
      ];

      // Grid: remove lookUpOrder and raw organisationId; show organisationName instead
      const gridCols = resultsWithNames.filter(
        (c) => c.name !== "lookUpOrder" && c.name !== "organisationId"
      );
      if (!gridCols.some((c) => c.name === "organisationName")) {
        gridCols.push({ name: "organisationName", label: "Organisation", dataType: "string" });
      }
      finalResultsList = gridCols;

      // Hide auto-generated / internal fields
      for (const label of ["Look Up Key", "Look Up Name", "Look Up Order"]) {
        if (formConfig[label]) (formConfig[label] as any).hidden = true;
      }

      // lookUpValueKey: readonly in edit, auto-uppercase
      if (formConfig["Look Up Value Key"]) {
        Object.assign(formConfig["Look Up Value Key"] as any, { readOnlyOnEdit: true, uppercase: true });
      }

      // organisationId → single-select dropdown
      if (formConfig["Organisation Id"]) {
        formConfig["Organisation Id"] = {
          ...formConfig["Organisation Id"],
          fieldName: "organisationId",
          fieldType: "dropdown",
          optionType: "API",
          option: `/master/organisation/options`,
        } as any;
      }

      // Status: default Active for create mode pre-fill
      if (formConfig["Status"]) {
        (formConfig["Status"] as any).defaultValue = 1;
      }
    }

    return {
      endPoint: entity,
      parameterList: finalParameterList,
      resultsList: finalResultsList,
      formConfig,
    };
  }

  /**
   * Replaces any LID (lookup id) fields with their corresponding lookup value (name).
   */
  private async hydrateLookupLabels<T>(
    repository: Repository<any>,
    rows: T[]
  ): Promise<T[]> {
    if (!rows || rows.length === 0) return rows;

    // Identify columns that look like lookup ids (ends with 'Lid' case-insensitive)
    const lidColumns = repository.metadata.columns
      .map((c) => c.propertyName)
      // Only match properties explicitly ending with 'Lid' (case sensitive) like 'statusLid'
      .filter((n) => /Lid$/.test(n));

    if (lidColumns.length === 0) return rows;

    // Collect all LID ids to fetch in bulk
    const idsToFetch = new Set<number | string>();
    for (const row of rows as any[]) {
      for (const col of lidColumns) {
        const val = row[col];
        if (val !== undefined && val !== null) idsToFetch.add(val);
      }
    }
    if (idsToFetch.size === 0) return rows;

    // Fetch lookup values once
    const lookups = await this.lookUpRepository.find({
      where: { id: In(Array.from(idsToFetch) as any[]) },
      select: ["id", "lookUpValue"],
    });
    const map = new Map<number | string, string>();
    for (const l of lookups) map.set(l.id, l.lookUpValue);

    // Add companion '<base>Name' fields but preserve original ids
    for (const row of rows as any[]) {
      for (const col of lidColumns) {
        const idVal = row[col];
        if (idVal !== undefined && idVal !== null) {
          const label = map.get(idVal);
          if (label !== undefined) {
            const base = col.replace(/Lid$/, "");
            const target = `${base}Name`;
            if (row[target] === undefined) row[target] = label;
          }
        }
      }
    }
    return rows;
  }

  /**
   * Adds '*Name' companion fields for FK join columns (e.g., countryId -> countryName), preserving original ids.
   */
  private async hydrateRelationNames<T>(
    repository: Repository<any>,
    rows: T[]
  ): Promise<T[]> {
    if (!rows || rows.length === 0) return rows;

    // Map join column name -> related repository and display column
    const joinColToRepo: Record<string, { repo: Repository<any>; idProp: string; nameProp: string }> = {};

    for (const rel of repository.metadata.relations) {
      const relMetadata = rel.inverseEntityMetadata;
      const repo = this.dataSource.getRepository(relMetadata.target as any);
      const idProp = relMetadata.primaryColumns?.[0]?.propertyName || "id";
      const nameCandidates = ["name", "displayName", "lookUpValue", "firstName", "label", "title", "companyName"];
      let nameProp = relMetadata.columns.find((c) => nameCandidates.includes(c.propertyName))?.propertyName;
      if (!nameProp) {
        const stringCol = relMetadata.columns.find((c) => {
          const t = String(c.type);
          return /(char|text)/i.test(t);
        });
        nameProp = stringCol?.propertyName || idProp;
      }

      for (const jc of rel.joinColumns || []) {
        const joinCol = jc.propertyName; // e.g., countryId
        if (!joinCol) continue;
        joinColToRepo[joinCol] = { repo, idProp, nameProp };
      }
    }

    const colNames = Object.keys(joinColToRepo);
    if (colNames.length === 0) return rows;

    // Collect ids per join column
    const idsPerCol: Record<string, Set<any>> = {};
    for (const col of colNames) idsPerCol[col] = new Set<any>();
    for (const row of rows as any[]) {
      for (const col of colNames) {
        const val = row[col];
        if (val !== undefined && val !== null) idsPerCol[col].add(val);
      }
    }

    // Fetch maps id->name for each join column
    const maps: Record<string, Map<any, string>> = {};
    for (const col of colNames) {
      const ids = Array.from(idsPerCol[col]);
      if (ids.length === 0) continue;
      const { repo, idProp, nameProp } = joinColToRepo[col];
      const rowsRel = await repo.find({
        where: { [idProp]: In(ids as any[]) } as any,
        select: [idProp, nameProp] as any,
      });
      const m = new Map<any, string>();
      for (const r of rowsRel as any[]) m.set(r[idProp], r[nameProp] ?? r[idProp]);
      maps[col] = m;
    }

    // Assign companion Name values
    for (const row of rows as any[]) {
      for (const col of colNames) {
        const idVal = row[col];
        if (idVal === undefined || idVal === null) continue;
        const label = maps[col]?.get(idVal);
        if (label !== undefined) {
          let base = col;
          if (base.endsWith("Id")) base = base.slice(0, -2);
          const target = `${base}Name`;
          if (row[target] === undefined) row[target] = String(label);
        }
      }
    }

    return rows;
  }

  /**
   * Removes id columns (Lid or FK join ids) from response rows when corresponding '*Name' exists.
   */
  private pruneIdColumnsForResponse<T>(
    repository: Repository<any>,
    rows: T[]
  ): T[] {
    const joinColumnNames = new Set(
      repository.metadata.relations
        .flatMap((r) => r.joinColumns?.map((jc) => jc.propertyName) || [])
        .filter(Boolean)
    );
    for (const row of rows as any[]) {
      for (const col of Object.keys(row)) {
        const isLid = /Lid$/.test(col);
        const isFk = joinColumnNames.has(col);
        if (isLid || isFk) {
          let base = col;
          if (base.endsWith("Lid")) base = base.slice(0, -3);
          else if (base.endsWith("Id")) base = base.slice(0, -2);
          const nameKey = `${base}Name`;
          if (row[nameKey] !== undefined) {
            delete row[col];
          }
        }
      }
    }
    return rows;
  }

  /**
   * Returns minimal option list (id, name) for an entity without pagination.
   */
  async getOptionList(
    entity: string,
    lookupName?: string
  ): Promise<Array<{ id: number | string; name: string }>> {
    const entityClass = getEntityByName(entity);
    const repository = this.dataSource.getRepository(entityClass);
    if (!repository) {
      throw new InternalServerErrorException("Invalid entity name");
    }

    const alias = "e";
    const idProp = repository.metadata.primaryColumns?.[0]?.propertyName || "id";
    // Prefer a sensible display column
    const nameCandidates = ["name", "displayName", "lookUpValue", "firstName", "label", "title"]; 
    let nameProp = repository.metadata.columns.find((c) => nameCandidates.includes(c.propertyName))?.propertyName;
    if (!nameProp) {
      const stringCol = repository.metadata.columns.find((c) => {
        const t = String(c.type);
        return /(char|text)/i.test(t);
      });
      nameProp = stringCol?.propertyName || idProp;
    }

    const qb = repository.createQueryBuilder(alias);
    // Soft delete aware if applicable
    if (repository.metadata.columns.some((c) => c.propertyName === "deletedAt")) {
      qb.where(`${alias}.deletedAt IS NULL`);
    }
    // Status filters for common masters
    if (
      [
        DEFAULT_VALUES.ORGANISATION_ENTITY,
        DEFAULT_VALUES.ORG_BRANCH_ENTITY,
        DEFAULT_VALUES.ORG_DEPARTMENT_ENTITY,
        DEFAULT_VALUES.ORG_DESIGNATION_ENTITY,
        DEFAULT_VALUES.ORG_VERTICAL_ENTITY,
        DEFAULT_VALUES.ORG_SBU_ENTITY,
      ].includes(entity)
    ) {
      // if entity has statusLid column, only active
      if (repository.metadata.columns.some((c) => c.propertyName === DEFAULT_VALUES.STATUS_LOOKUP)) {
        // no lookup join here; return all irrespective to keep generic
      }
    }
    // User specific: prefer active users only
    if (entity === DEFAULT_VALUES.USER_ENTITY) {
      if (repository.metadata.columns.some((c) => c.propertyName === "userStatusKey")) {
        qb.andWhere(`${alias}.userStatusKey = :status`, { status: DEFAULT_VALUES.ACTIVE_USER_STATUS });
      }
    }

    // If lookup_data with lookupName, filter by lookUpName
    if (entity === DEFAULT_VALUES.LOOKUP_DATA_ENTITY && lookupName) {
      qb.andWhere(`${alias}.lookUpName = :lookupName`, { lookupName });
    }
    // Lookup-backed entities: scope to all policy-type variants
    if (entity === DEFAULT_VALUES.POLICY_TYPE) {
      qb.andWhere(`${alias}.lookUpName IN (:...policyTypes)`, {
        policyTypes: [
          DEFAULT_VALUES.POLICY_TYPE,
          DEFAULT_VALUES.IRDAI_POLICY_TYPE,
          DEFAULT_VALUES.IIRM_POLICY_TYPE,
        ],
      });
    }

    qb.select([
      `${alias}.${idProp} as id`,
      `${alias}.${nameProp} as name`,
    ])
      .orderBy(`${alias}.${nameProp}`, "ASC");

    const rows = await qb.getRawMany<{ id: number | string; name: string }>();
    return rows.map((r) => ({ id: r.id, name: String(r.name ?? r.id) }));
  }

  /**
   * Retrieves all records for the specified entity.
   */
  async getAllRecords<T>(
    userId: number,
    entity: string,
    search?: string,
    searchId?: number | number[],
    searchBy?: string,
    sortBy?: string,
    roleKey?: string,
    sortOrder: "ASC" | "DESC" = "ASC",
    page: number = DEFAULT_VALUES.PAGE,
    limit: number = DEFAULT_VALUES.LIMIT,
    entityIds?: number[],
    additionalFilters?: Record<string, any>
  ): Promise<{ data: T[]; count?: number }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterRepository",
          method: "getAllRecords",
          payload: { entity },
          messageData: "method invoked",
        }),
      });
      const entityClass = getEntityByName(entity);
      const repository = this.dataSource.getRepository(entityClass);
      if (!repository) {
        throw new InternalServerErrorException("Invalid entity name");
      }
      const columnsToSelect = getSelectableColumns(repository.metadata);
      // Helper to map search on '*Name' to corresponding id column (e.g., statusName -> statusLid, departmentName -> departmentId)
      const normalizeSearch = (
        rawBy?: string,
        rawSearch?: string,
        rawSearchId?: number
      ): { by?: string; search?: string; searchId?: number | number[] } => {
        let by = rawBy;
        let search = rawSearch;
        let searchId = rawSearchId;
        if (by && /Name$/.test(by)) {
          const base = by.slice(0, -4); // remove 'Name'
          const lid = `${base}Lid`;
          const id = `${base}Id`;
          const hasLid = repository.metadata.columns.some((c) => c.propertyName === lid);
          const hasId = repository.metadata.columns.some((c) => c.propertyName === id);
          if (hasLid) by = lid;
          else if (hasId) by = id;
        }
        // If we ended up targeting an id column and search is numeric-like, convert to searchId
        if (search && by && /(Id|Lid)$/.test(by) && /^\d+$/.test(search)) {
          searchId = Number(search);
          search = undefined;
        }
        return { by, search, searchId };
      };
      const where: Record<string, any> = {};
      const normalized = normalizeSearch(searchBy, search, searchId as any);
      if (normalized.search && normalized.by) {
        // Check if the column is a text type before using ILike
        const column = repository.metadata.columns.find((c) => c.propertyName === normalized.by);
        const columnType = column?.type;
        
        // Use ILike only for text-based columns
        if (columnType && typeof columnType === 'string' && /(char|text|varchar)/i.test(columnType)) {
          where[normalized.by] = ILike(`%${normalized.search}%`);
        } else {
          // For non-text columns, try exact match if the search value can be converted
          if (columnType && typeof columnType === 'string' && /(int|integer|bigint)/i.test(columnType)) {
            // For integer columns, convert search to number if possible
            const numericValue = Number(normalized.search);
            if (!isNaN(numericValue)) {
              where[normalized.by] = numericValue;
            }
          } else {
            // For other types, try exact string match
            where[normalized.by] = normalized.search;
          }
        }
      } else if (normalized.searchId !== undefined && normalized.by) {
        where[normalized.by] = Array.isArray(normalized.searchId)
          ? In(normalized.searchId)
          : normalized.searchId;
      }

      // Handle general name parameter for all entities
      if (additionalFilters?.name) {
        where.name = ILike(`%${additionalFilters.name}%`);
      }

      // Dynamic handling of additional search criteria (AND logic)
      // This replaces hardcoded field-specific logic with dynamic field mapping
      if (additionalFilters) {
        await this.processDynamicFilters(additionalFilters, where, repository);
      }
      // normalize sort field (map '*Name' -> underlying Id/Lid)
      const normalizeSortField = (raw?: string): string | undefined => {
        if (!raw) return raw;
        if (/Name$/.test(raw)) {
          const base = raw.slice(0, -4);
          const lid = `${base}Lid`;
          const idCol = `${base}Id`;
          const hasLid = repository.metadata.columns.some((c) => c.propertyName === lid);
          const hasId = repository.metadata.columns.some((c) => c.propertyName === idCol);
          if (hasLid) return lid;
          if (hasId) return idCol;
        }
        return raw;
      };

      const order: Record<string, "ASC" | "DESC"> = {};
      const sortField = normalizeSortField(sortBy);
      if (sortField && sortOrder) {
        order[sortField] = sortOrder;
      }
      const offset = (page - 1) * limit;
      const user = await this.dataSource.getRepository(User).findOne({
        where: { userId: userId },
        select: ["organisationId"],
      });
      if (!user || user.organisationId == null || user.organisationId == undefined) {
        throw new NotFoundException("User or organisation not found");
      }
      // Get entity status filter if applicable
      if (
        [
          DEFAULT_VALUES.ORGANISATION_ENTITY,
          DEFAULT_VALUES.ORG_BRANCH_ENTITY,
          DEFAULT_VALUES.ORG_DEPARTMENT_ENTITY,
          DEFAULT_VALUES.ORG_DESIGNATION_ENTITY,
          DEFAULT_VALUES.ORG_VERTICAL_ENTITY,
          DEFAULT_VALUES.ORG_SBU_ENTITY,
        ].includes(entity)
      ) {
        // apply default ACTIVE status only if user hasn't explicitly filtered by status
        if (!(DEFAULT_VALUES.STATUS_LOOKUP in where)) {
          Object.assign(where, {
            [DEFAULT_VALUES.STATUS_LOOKUP]:
              (
                await this.lookUpRepository.findOne({
                  where: { lookUpKey: DEFAULT_ACTIVE_STATUS.MASTER },
                })
              )?.id ?? null,
          });
        }
      }
      switch (entity) {
        case DEFAULT_VALUES.IIRM_POLICY_TYPES: {
          // Dedicated searchable endpoint for IIRM policy types
          Object.assign(where, { lookUpName: DEFAULT_VALUES.IIRM_POLICY_TYPE });
          break;
        }
        case DEFAULT_VALUES.IRDAI_POLICY_TYPES: {
          Object.assign(where, { lookUpName: DEFAULT_VALUES.IRDAI_POLICY_TYPE });
          break;
        }
        case DEFAULT_VALUES.POLICY_TYPE: {
          // Listing only shows POLICY_TYPE records — IRDAI/IIRM are separate views
          Object.assign(where, { lookUpName: DEFAULT_VALUES.POLICY_TYPE });
          break;
        }
        case DEFAULT_VALUES.USER_ENTITY: {
          Object.assign(where, {
            [DEFAULT_VALUES.USER_STATUS_KEY]: DEFAULT_VALUES.ACTIVE_USER_STATUS,
            organisationId: user.organisationId,
            // Only select users where userTypeKey is NULL or USER_TYPE_IIRM_EMPLOYEE and not USER_TYPE_COMPANY_EMPLOYEE
            [DEFAULT_VALUES.USER_TYPE_KEY]: Or(
              IsNull(),
              In([
                DEFAULT_VALUES.USER_TYPE_IIRM_EMPLOYEE,
                USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
              ])
            ),
          });
          Object.assign(order, {
            firstName: sortOrder,
          });
          break;
        }
        case DEFAULT_VALUES.CITY_ENTITY:
          {
            // Step 1: Get organisation by organisationId to find countryId
            const organisationRepo = this.dataSource.getRepository(
              getEntityByName(DEFAULT_VALUES.ORGANISATION_ENTITY)
            );
            const organisation = await organisationRepo.findOne({
              where: { id: user.organisationId },
              select: ["countryId"],
            });
            if (!organisation || !organisation.countryId) {
              throw new NotFoundException("Organisation or country not found");
            }

            // Step 2: Get all states for the countryId
            const stateRepo = this.dataSource.getRepository(
              getEntityByName(DEFAULT_VALUES.STATE_ENTITY)
            );
            const states = await stateRepo.find({
              where: { countryId: organisation.countryId },
              select: ["id"],
            });
            const stateIds = states?.map((state) => Number(state.id));
            if (!stateIds.length) {
              throw new NotFoundException("No states found for the country");
            }

            // Step 3: Filter cities by stateIds (only if no specific state filter was provided)
            if (!where.stateId) {
              Object.assign(where, { stateId: In(stateIds) });
            }
          }
          break;
      }
      let result: any;
      let totalCount: number | undefined = undefined;
      if (entity === DEFAULT_VALUES.USER_ENTITY) {
        const qb = repository
          .createQueryBuilder("user")
          .leftJoinAndSelect("user.branch", "orgBranch")
          .leftJoin("user.userRoles", "userRole")
          .leftJoin("userRole.role", "role")
          .where(
            "user.userStatusKey = :userStatusKey AND user.organisationId = :organisationId",
            {
              userStatusKey: DEFAULT_VALUES.ACTIVE_USER_STATUS,
              organisationId: user.organisationId,
            }
          )
          .andWhere(
            "(user.userTypeKey IS NULL OR user.userTypeKey IN (:...userTypes))",
            {
              userTypes: [
                DEFAULT_VALUES.USER_TYPE_IIRM_EMPLOYEE,
                USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
              ],
            }
          );

        if (search && searchBy) {
          if (searchBy === "firstName") {
            qb.andWhere(
              `(
                user.firstName ILIKE :search OR
                user.lastName ILIKE :search OR
                CONCAT_WS(' ', user.firstName, user.lastName) ILIKE :search OR
                orgBranch.name ILIKE :search
              )`,
              { search: `%${search}%` }
            );
          } else {
            qb.andWhere(`user.${searchBy} ILIKE :search`, {
              search: `%${search}%`,
            });
          }
        } else if (searchId && searchBy) {
          qb.andWhere(`user.${searchBy} = :searchId`, {
            searchId,
          });
        }

        if (roleKey && roleKey.length > 0) {
          const roleData = mapSearchParams(`roleKey:${roleKey}`)[0].searchValue;
          if (Array.isArray(roleData)) {
            qb.andWhere("role.roleKey IN (:...roleKeys)", {
              roleKeys: roleData,
            });
          } else {
            qb.andWhere("role.roleKey = :roleKey", {
              roleData,
            });
          }
        }

        // Sorting
        if (sortField) {
          qb.orderBy(`user.${sortField}`, sortOrder);
        } else {
          qb.orderBy(`user.firstName`, sortOrder); // Default sorting by firstName
        }
        const selectedColumns = Object.keys(columnsToSelect);
        const branchColumns = [
          "orgBranch.id",
          "orgBranch.organisationId",
          "orgBranch.name",
          "orgBranch.description",
          "orgBranch.statusLid",
        ];
        const [users, userCount] = await qb
          .select([
            ...selectedColumns.map((col) => `user.${col}`),
            ...branchColumns,
          ])
          .offset(offset)
          .limit(limit)
          .getManyAndCount();
        let hydrated: any[] = await this.hydrateLookupLabels(repository, users);
        hydrated = await this.hydrateRelationNames(repository, hydrated);
        hydrated = this.pruneIdColumnsForResponse(repository, hydrated);
        result = hydrated as T[];
        totalCount = userCount;
      } else {
        const queryOptions: any = {
          select: columnsToSelect,
          ...(Object.keys(where).length > 0 && { where }),
          ...(Object.keys(order).length > 0 && { order }),
          skip: offset,
          take: limit,
        };

        // Add relations for USER_ENTITY
        if (entity === DEFAULT_VALUES.USER_ENTITY) {
          queryOptions.relations = ["branch"];
        }

        const [rows, count] = await repository.findAndCount(queryOptions);
        let hydrated: any[] = await this.hydrateLookupLabels(repository, rows);
        hydrated = await this.hydrateRelationNames(repository, hydrated);
        hydrated = this.pruneIdColumnsForResponse(repository, hydrated);

        // For POLICY_TYPE, resolve organisationId → organisationName using the organisation table.
        // Keep organisationId in the row (needed for edit prefill); grid ignores it as it's not in resultsList.
        if (entity === DEFAULT_VALUES.POLICY_TYPE) {
          const orgIds = [...new Set(hydrated.map((r: any) => r.organisationId).filter((v: any) => v != null))];
          if (orgIds.length > 0) {
            const orgRepo = this.dataSource.getRepository(getEntityByName(DEFAULT_VALUES.ORGANISATION_ENTITY));
            const orgs = await orgRepo.find({ where: { id: In(orgIds as any[]) }, select: ["id", "name"] as any });
            const orgMap = new Map(orgs.map((o: any) => [o.id, o.name]));
            for (const row of hydrated as any[]) {
              row.organisationName = orgMap.get(row.organisationId) ?? null;
            }
          }
        }

        result = hydrated as T[];
        totalCount = count;
        if (result.length > 0) {
          removeMetadataFields(result);
        }
      }
      // Handle entityIds filtering and appending if provided
      if (entityIds && entityIds.length > 0) {
        // Find which entityIds are missing from current results
        const existingIds =
          entity === DEFAULT_VALUES.USER_ENTITY
            ? new Set((result as any[]).map((item) => item.userId))
            : new Set((result as any[]).map((item) => item.id));
        const missingIds = entityIds.filter((id) => !existingIds.has(id));
        if (missingIds.length > 0) {
          let missingEntities: T[] = [];
          if (entity === DEFAULT_VALUES.USER_ENTITY) {
            const selectedColumns = Object.keys(columnsToSelect);
            const branchColumns = [
              "orgBranch.id",
              "orgBranch.organisationId",
              "orgBranch.name",
              "orgBranch.description",
              "orgBranch.statusLid",
            ];
            const qbMissing = repository
              .createQueryBuilder("user")
              .leftJoinAndSelect("user.branch", "orgBranch")
              .leftJoin("user.userRoles", "userRole")
              .leftJoin("userRole.role", "role")
              .where(
                "user.userStatusKey = :userStatusKey AND user.organisationId = :organisationId",
                {
                  userStatusKey: DEFAULT_VALUES.ACTIVE_USER_STATUS,
                  organisationId: user.organisationId,
                }
              )
              .andWhere(
                "(user.userTypeKey IS NULL OR user.userTypeKey IN (:...userTypes))",
                {
                  userTypes: [
                    DEFAULT_VALUES.USER_TYPE_IIRM_EMPLOYEE,
                    USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
                  ],
                }
              )
              .andWhere("user.userId IN (:...missingIds)", { missingIds });

            missingEntities = (await qbMissing
              .select([
                ...selectedColumns.map((col) => `user.${col}`),
                ...branchColumns,
              ])
              .getMany()) as T[];
          } else {
            const whereCondition = { id: In(missingIds) };
            missingEntities = (await repository.find({
              select: columnsToSelect,
              where: whereCondition,
              ...(Object.keys(order).length > 0 && { order }),
            })) as T[];
            if (missingEntities.length > 0) {
              removeMetadataFields(missingEntities as any);
            }
          }

          // Append missing entities to the result
          result = [...result, ...missingEntities];
        }
      }

      return { data: result, count: totalCount };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterRepository",
          method: "getAllRecords",
          payload: { entity },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to retrieve records"
      );
    }
  }

  async getAllRecordsForOrgFilter<T>(
    userId: number,
    entity: string,
    search?: string,
    searchId?: number | number[],
    searchBy?: string,
    sortBy?: string,
    roleKey?: string,
    sortOrder: "ASC" | "DESC" = "ASC",
    page: number = DEFAULT_VALUES.PAGE,
    limit: number = DEFAULT_VALUES.LIMIT,
    entityIds?: number[]
  ): Promise<{ data: T[] }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterRepository",
          method: "getAllRecordsForOrgFilter",
          payload: { entity },
          messageData: "method invoked",
        }),
      });
      const entityClass = getEntityByName(entity);
      const repository = this.dataSource.getRepository(entityClass);
      if (!repository) {
        throw new InternalServerErrorException("Invalid entity name");
      }
      const columnsToSelect = getSelectableColumns(repository.metadata);
      const normalizeSearch = (
        rawBy?: string,
        rawSearch?: string,
        rawSearchId?: number
      ): { by?: string; search?: string; searchId?: number | number[] } => {
        let by = rawBy;
        let search = rawSearch;
        let searchId = rawSearchId;
        if (by && /Name$/.test(by)) {
          const base = by.slice(0, -4);
          const lid = `${base}Lid`;
          const id = `${base}Id`;
          const hasLid = repository.metadata.columns.some((c) => c.propertyName === lid);
          const hasId = repository.metadata.columns.some((c) => c.propertyName === id);
          if (hasLid) by = lid;
          else if (hasId) by = id;
        }
        if (search && by && /(Id|Lid)$/.test(by) && /^\d+$/.test(search)) {
          searchId = Number(search);
          search = undefined;
        }
        return { by, search, searchId };
      };
      const where: Record<string, any> = {};
      const normalized = normalizeSearch(searchBy, search, searchId as any);
      if (normalized.search && normalized.by) {
        // Check if the column is a text type before using ILike
        const column = repository.metadata.columns.find((c) => c.propertyName === normalized.by);
        const columnType = column?.type;
        
        // Use ILike only for text-based columns
        if (columnType && typeof columnType === 'string' && /(char|text|varchar)/i.test(columnType)) {
          where[normalized.by] = ILike(`%${normalized.search}%`);
        } else {
          // For non-text columns, try exact match if the search value can be converted
          if (columnType && typeof columnType === 'string' && /(int|integer|bigint)/i.test(columnType)) {
            // For integer columns, convert search to number if possible
            const numericValue = Number(normalized.search);
            if (!isNaN(numericValue)) {
              where[normalized.by] = numericValue;
            }
          } else {
            // For other types, try exact string match
            where[normalized.by] = normalized.search;
          }
        }
      } else if (normalized.searchId !== undefined && normalized.by) {
        where[normalized.by] = Array.isArray(normalized.searchId)
          ? In(normalized.searchId)
          : normalized.searchId;
      }
      const normalizeSortField = (raw?: string): string | undefined => {
        if (!raw) return raw;
        if (/Name$/.test(raw)) {
          const base = raw.slice(0, -4);
          const lid = `${base}Lid`;
          const idCol = `${base}Id`;
          const hasLid = repository.metadata.columns.some((c) => c.propertyName === lid);
          const hasId = repository.metadata.columns.some((c) => c.propertyName === idCol);
          if (hasLid) return lid;
          if (hasId) return idCol;
        }
        return raw;
      };

      const order: Record<string, "ASC" | "DESC"> = {};
      const sortField = normalizeSortField(sortBy);
      if (sortField && sortOrder) {
        order[sortField] = sortOrder;
      }
      const offset = (page - 1) * limit;
      const user = await this.dataSource.getRepository(User).findOne({
        where: { userId: userId },
        select: ["organisationId"],
      });
      if (!user || user.organisationId == null || user.organisationId == undefined) {
        throw new NotFoundException("User or organisation not found");
      }
      // Get entity status filter if applicable
      if (
        [
          DEFAULT_VALUES.ORGANISATION_ENTITY,
          DEFAULT_VALUES.ORG_BRANCH_ENTITY,
          DEFAULT_VALUES.ORG_DEPARTMENT_ENTITY,
          DEFAULT_VALUES.ORG_DESIGNATION_ENTITY,
          DEFAULT_VALUES.ORG_VERTICAL_ENTITY,
        ].includes(entity)
      ) {
        if (!(DEFAULT_VALUES.STATUS_LOOKUP in where)) {
          Object.assign(where, {
            [DEFAULT_VALUES.STATUS_LOOKUP]:
              (
                await this.lookUpRepository.findOne({
                  where: { lookUpKey: DEFAULT_ACTIVE_STATUS.MASTER },
                })
              )?.id ?? null,
          });
        }
      }
      switch (entity) {
        case DEFAULT_VALUES.USER_ENTITY: {
          Object.assign(where, {
            [DEFAULT_VALUES.USER_STATUS_KEY]: DEFAULT_VALUES.ACTIVE_USER_STATUS,
            organisationId: user.organisationId,
            // Only select users where userTypeKey is NULL or USER_TYPE_IIRM_EMPLOYEE and not USER_TYPE_COMPANY_EMPLOYEE
            [DEFAULT_VALUES.USER_TYPE_KEY]: Or(
              IsNull(),
              In([DEFAULT_VALUES.USER_TYPE_IIRM_EMPLOYEE])
            ),
          });
          Object.assign(order, {
            firstName: sortOrder,
          });
          break;
        }
        case DEFAULT_VALUES.CITY_ENTITY:
          {
            // Step 1: Get organisation by organisationId to find countryId
            const organisationRepo = this.dataSource.getRepository(
              getEntityByName(DEFAULT_VALUES.ORGANISATION_ENTITY)
            );
            const organisation = await organisationRepo.findOne({
              where: { id: user.organisationId },
              select: ["countryId"],
            });
            if (!organisation || !organisation.countryId) {
              throw new NotFoundException("Organisation or country not found");
            }

            // Step 2: Get all states for the countryId
            const stateRepo = this.dataSource.getRepository(
              getEntityByName(DEFAULT_VALUES.STATE_ENTITY)
            );
            const states = await stateRepo.find({
              where: { countryId: organisation.countryId },
              select: ["id"],
            });
            const stateIds = states?.map((state) => Number(state.id));
            if (!stateIds.length) {
              throw new NotFoundException("No states found for the country");
            }

            // Step 3: Filter cities by stateIds (only if no specific state filter was provided)
            if (!where.stateId) {
              Object.assign(where, { stateId: In(stateIds) });
            }
          }
          break;
      }
      let result: any;
      if (
        entity === DEFAULT_VALUES.USER_ENTITY &&
        roleKey &&
        roleKey.length > 0
      ) {
        const qb = repository
          .createQueryBuilder("user")
          .leftJoinAndSelect("user.branch", "orgBranch")
          .leftJoin("user.userRoles", "userRole")
          .leftJoin("userRole.role", "role")
          .where(
            "user.userStatusKey = :userStatusKey AND user.organisationId = :organisationId",
            {
              userStatusKey: DEFAULT_VALUES.ACTIVE_USER_STATUS,
              organisationId: user.organisationId,
            }
          );

        // Search condition (if search/searchId/searchBy present)
        const n2 = normalizeSearch(searchBy, search, searchId as any);
        if (n2.search && n2.by) {
          qb.andWhere(`user.${n2.by} ILIKE :search`, { search: `%${n2.search}%` });
        } else if (n2.searchId !== undefined && n2.by) {
          qb.andWhere(`user.${n2.by} = :searchId`, { searchId: n2.searchId });
        }
        const roleData = mapSearchParams(`roleKey:${roleKey}`)[0].searchValue;
        if (Array.isArray(roleData)) {
          qb.andWhere("role.roleKey IN (:...roleKeys)", {
            roleKeys: roleData,
          });
        } else {
          qb.andWhere("role.roleKey = :roleKey", {
            roleData,
          });
        }

        // Sorting
        if (sortField) {
          qb.orderBy(`user.${sortField}`, sortOrder);
        } else {
          qb.orderBy(`user.firstName`, sortOrder); // Default sorting by firstName
        }
        const selectedColumns = Object.keys(columnsToSelect);
        const branchColumns = [
          "orgBranch.id",
          "orgBranch.organisationId",
          "orgBranch.name",
          "orgBranch.description",
          "orgBranch.statusLid",
        ];
        const users = await qb
          .select([
            ...selectedColumns.map((col) => `user.${col}`),
            ...branchColumns,
          ])
          .offset(offset)
          .limit(limit)
          .getMany();
        let hydratedUsers: any[] = await this.hydrateLookupLabels(repository, users);
        hydratedUsers = await this.hydrateRelationNames(repository, hydratedUsers);
        hydratedUsers = this.pruneIdColumnsForResponse(repository, hydratedUsers);
        result = hydratedUsers as T[];
      } else {
        const queryOptions: any = {
          select: columnsToSelect,
          ...(Object.keys(where).length > 0 && { where }),
          ...(Object.keys(order).length > 0 && { order }),
        };

        // Add relations for USER_ENTITY
        if (entity === DEFAULT_VALUES.USER_ENTITY) {
          queryOptions.relations = ["branch"];
        }

        result = (await repository.find(queryOptions)) as T[];

        result = (await this.hydrateLookupLabels(repository, result.slice(offset, offset + limit))) as T[];
        result = (await this.hydrateRelationNames(repository, result)) as T[];
        result = this.pruneIdColumnsForResponse(repository, result);
        if (result.length > 0) {
          removeMetadataFields(result);
        }
      }
      // Get the user's organisationId to filter results to that org
      const orgIds = await this.entityService.getEntityMapByIds(
        "User",
        "organisationId" as any,
        { userId: userId }
      );
      // Handle entityIds filtering and appending if provided
      if (entityIds && entityIds.length > 0) {
        // Find which entityIds are missing from current results
        const existingIds =
          entity === DEFAULT_VALUES.USER_ENTITY
            ? new Set((result as any[]).map((item) => item.userId))
            : new Set((result as any[]).map((item) => item.id));
        const missingIds = entityIds.filter((id) => !existingIds.has(id));
        if (missingIds.length > 0) {
          let missingEntities: T[] = [];
          if (entity === DEFAULT_VALUES.USER_ENTITY) {
            const selectedColumns = Object.keys(columnsToSelect);
            const branchColumns = ["orgBranch.id", "orgBranch.name"];
            const qbMissing = repository
              .createQueryBuilder("user")
              .leftJoinAndSelect("user.branch", "orgBranch")
              .leftJoin("user.userRoles", "userRole")
              .leftJoin("userRole.role", "role")
              .where(
                "user.userStatusKey = :userStatusKey AND user.organisationId = :organisationId",
                {
                  userStatusKey: DEFAULT_VALUES.ACTIVE_USER_STATUS,
                  organisationId: user.organisationId,
                }
              )
              .andWhere(
                "(user.userTypeKey IS NULL OR user.userTypeKey IN (:...userTypes))",
                {
                  userTypes: [
                    DEFAULT_VALUES.USER_TYPE_IIRM_EMPLOYEE,
                    USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
                  ],
                }
              )
              .andWhere("user.userId IN (:...missingIds)", { missingIds });

            missingEntities = (await qbMissing
              .select([
                ...selectedColumns.map((col) => `user.${col}`),
                ...branchColumns,
              ])
              .getMany()) as T[];
          } else {
            const whereCondition = { id: In(missingIds) };
            missingEntities = (await repository.find({
              select: columnsToSelect,
              where: whereCondition,
              ...(Object.keys(order).length > 0 && { order }),
            })) as T[];
            if (missingEntities.length > 0) {
              removeMetadataFields(missingEntities as any);
            }
          }

          // Append missing entities to the result
          result = [...result, ...missingEntities];
        }
      }

      if (orgIds.length === 0) return { data: result };
      else {
        const organisationData = result.filter((item: any) =>
          orgIds.includes(item.id)
        );
        return { data: organisationData };
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterRepository",
          method: "getAllRecords",
          payload: { entity },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to retrieve records"
      );
    }
  }
  /**
   * Retrieves a single record by ID for the specified entity.
   */
  async getRecordById<T>(
    entity: string,
    id: string
  ): Promise<{ data: T }> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterRepository",
          method: "getRecordById",
          payload: { entity, id },
          messageData: "method invoked",
        }),
      });
      const entityClass = getEntityByName(entity);
      const repository = this.dataSource.getRepository(entityClass);
      if (!repository) {
        throw new InternalServerErrorException("Invalid entity name");
      }

      // Fetch full record (no select map) to avoid property mismatch errors
      const recordRaw = await repository.findOne({
        where: entity === DEFAULT_VALUES.USER_ENTITY ? ({ userId: id } as any) : ({ id } as any),
      });

      if (!recordRaw) {
        throw new InternalServerErrorException(
          `Record not found with id ${id}`
        );
      }
      // Project only known columns and strip metadata
      const excluded = new Set([
        "createdAt",
        "updatedAt",
        "deletedAt",
        "createdBy",
        "updatedBy",
        "deletedBy",
        "password",
      ]);
      const pick: any = {};
      for (const col of repository.metadata.columns) {
        const key = col.propertyName;
        if (excluded.has(key)) continue;
        if ((recordRaw as any)[key] !== undefined) pick[key] = (recordRaw as any)[key];
      }
      // Hydrate name companions for LIDs and FK IDs
      let rows = await this.hydrateLookupLabels(repository, [pick]);
      rows = await this.hydrateRelationNames(repository, rows);

      // For POLICY_TYPE records, attach segregation data so the edit form can pre-fill IRDAI/IIRM links
      if (entity === DEFAULT_VALUES.POLICY_TYPE && pick.id != null) {
        try {
          const seg = await this.policyTypeSegregationRepository.findOne({
            where: { policyTypeLid: Number(pick.id) },
          });
          if (seg) {
            (rows[0] as any).iirmPolicyTypeLid = seg.iirmPolicyTypeLid;
            (rows[0] as any).irdaiPolicyTypeLid = seg.irdaiPolicyTypeLid;
            (rows[0] as any).assocActivePolicyTypeLid = seg.assocActivePolicyTypeLid;
          }
        } catch {
          // Non-fatal — segregation record may not exist yet
        }
      }

      return { data: rows[0] as any } as { data: T };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterRepository",
          method: "getRecordById",
          payload: { entity, id },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to retrieve record"
      );
    }
  }

  /**
   * Creates a new record for the specified entity.
   */
  /**
   * Applies cover-specific defaults before persisting an `mstr_cover` row:
   * - enforces a unique (case-sensitive) cover name
   * - auto-generates `covers_meta` from the name + input type when not provided
   * See docs/cover_template_map/cover-template-map-spec.md (§4, §6.2).
   */
  private async applyCoverCreateDefaults(
    repository: Repository<any>,
    data: any
  ): Promise<void> {
    const name: string = (data?.name ?? "").trim();
    if (!name) {
      throw new BadRequestException("Cover name is required");
    }
    data.name = name;

    // Unique name guard (case-sensitive exact match).
    const existing = await repository.findOne({ where: { name } as any });
    if (existing) {
      throw new BadRequestException(`A cover named "${name}" already exists`);
    }

    const allowedInputTypes: CoverInputType[] = ["text", "textarea", "dropdown"];
    const inputType: CoverInputType = allowedInputTypes.includes(data?.inputType)
      ? data.inputType
      : "text";
    data.inputType = inputType;

    // input_lov is only meaningful for dropdown (choice) covers; null otherwise.
    let inputLov: CoverInputLov | null = null;
    if (inputType === "dropdown") {
      inputLov = data.inputLov ?? null;
      if (!inputLov || Object.keys(inputLov).length === 0) {
        throw new BadRequestException(
          "Dropdown covers require at least one option"
        );
      }
    }
    data.inputLov = inputLov;

    // Generation runs once, here. Template copy reuses this verbatim.
    if (data.coversMeta === undefined || data.coversMeta === null) {
      data.coversMeta = buildCoversMeta(name, inputType, inputLov ?? undefined);
    }
  }

  async createRecord<T>(entityClass: string, data: any): Promise<T> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterRepository",
          method: "createRecord",
          payload: { entityClass },
          messageData: "method invoked",
        }),
      });
      const repository = this.dataSource.getRepository(entityClass);
      if (!repository) {
        throw new InternalServerErrorException("Invalid entity name");
      }

      // POLICY_TYPE: create one record, map IRDAI + IIRM to segregation table
      if ((entityClass as any) === LookUp) {
        const { irdaiPolicyTypeLid, iirmPolicyTypeLid, selectedOrgs: _unused, ...recordData } = data;

        // Validate lookUpName — only POLICY_TYPE is allowed
        const lookUpName = recordData.lookUpName || DEFAULT_VALUES.POLICY_TYPE;
        if (lookUpName !== DEFAULT_VALUES.POLICY_TYPE) {
          throw new BadRequestException(
            `Only POLICY_TYPE records can be created. Received: ${lookUpName}`
          );
        }

        // Duplicate check on lookUpValueKey
        const dupKey = await repository.findOne({
          where: { lookUpName: DEFAULT_VALUES.POLICY_TYPE, lookUpValueKey: recordData.lookUpValueKey } as any,
        });
        if (dupKey) {
          throw new BadRequestException(
            `A Policy Type with value key "${recordData.lookUpValueKey}" already exists.`
          );
        }

        // Duplicate check on lookUpValue
        const dupValue = await repository.findOne({
          where: { lookUpName: DEFAULT_VALUES.POLICY_TYPE, lookUpValue: recordData.lookUpValue } as any,
        });
        if (dupValue) {
          throw new BadRequestException(
            `A Policy Type with value "${recordData.lookUpValue}" already exists.`
          );
        }

        // Auto-generate lookUpKey and lookUpOrder
        const lookUpKey = `${DEFAULT_VALUES.POLICY_TYPE}_${recordData.lookUpValueKey}`;
        const existing: any[] = await repository.find({
          where: { lookUpName: DEFAULT_VALUES.POLICY_TYPE } as any,
          select: ["lookUpOrder"] as any,
        });
        const lookUpOrder = Math.max(...existing.map((r: any) => Number(r.lookUpOrder ?? 0)), 0) + 1;

        // Create one POLICY_TYPE record
        const newRecord: any = {
          ...recordData,
          lookUpName: DEFAULT_VALUES.POLICY_TYPE,
          lookUpKey,
          lookUpOrder,
          createdBy: DEFAULT_VALUES.CREATED_BY,
          updatedBy: DEFAULT_VALUES.UPDATED_BY,
        };
        const saved = await repository.save(newRecord);
        const policyTypeLid: number = saved.id;

        // Map to policy_type_segregation
        const segregation = this.policyTypeSegregationRepository.create({
          policyTypeLid,
          irdaiPolicyTypeLid: this.toNullableNumber(irdaiPolicyTypeLid),
          iirmPolicyTypeLid: this.toNullableNumber(iirmPolicyTypeLid),
          assocActivePolicyTypeLid: policyTypeLid,
        });
        await this.policyTypeSegregationRepository.save(segregation);

        return { policyTypeLid } as unknown as T;
      }

      // Generic create path
      const cols = new Set(repository.metadata.columns.map((c) => c.propertyName));
      const newData: any = { ...data };
      // Cover-specific defaults: enforce unique name and auto-build covers_meta.
      if (repository.metadata.tableName === "mstr_cover") {
        await this.applyCoverCreateDefaults(repository, newData);
      }
      // Dynamically set createdBy/updatedBy based on column type
      if (cols.has("createdBy")) {
        const colType = repository.metadata.columns.find((c) => c.propertyName === "createdBy")?.type;
        newData.createdBy = this.isIntegerType(colType) ? 1 : DEFAULT_VALUES.CREATED_BY;
      }
      if (cols.has("updatedBy")) {
        const colType = repository.metadata.columns.find((c) => c.propertyName === "updatedBy")?.type;
        newData.updatedBy = this.isIntegerType(colType) ? 1 : DEFAULT_VALUES.UPDATED_BY;
      }
      const recorData = await repository.save(newData);
      const { createdBy, updatedBy, createdAt, updatedAt, ...filteredData } = recorData;
      return filteredData as T;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterRepository",
          method: "createRecord",
          payload: { entityClass },
          messageData: error,
        }),
      });
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to create record"
      );
    }
  }

  /**
   * Updates an existing record by ID for the specified entity.
   */

  async updateRecordById<T>(
    entityClass: string,
    id: string,
    data: any
  ): Promise<T> {
    try {
      const repository = this.dataSource.getRepository(entityClass);
      if (!repository) {
        throw new InternalServerErrorException("Invalid entity name");
      }

      // POLICY_TYPE: update record + segregation fields
      if ((entityClass as any) === LookUp && data.isPolicyTypeUpdate) {
        const { isPolicyTypeUpdate: _, selectedOrgs: _s, iirmPolicyTypeLid, irdaiPolicyTypeLid, assocActivePolicyTypeLid, ...recordData } = data;

        const pk = repository.metadata.primaryColumns?.[0]?.propertyName || "id";

        // Update segregation: IRDAI/IIRM links + associate policy type
        const segUpdate: Partial<PolicyTypeSegregation> = {
          ...(iirmPolicyTypeLid !== undefined && { iirmPolicyTypeLid: this.toNullableNumber(iirmPolicyTypeLid) }),
          ...(irdaiPolicyTypeLid !== undefined && { irdaiPolicyTypeLid: this.toNullableNumber(irdaiPolicyTypeLid) }),
          ...(assocActivePolicyTypeLid !== undefined && { assocActivePolicyTypeLid: this.toNullableNumber(assocActivePolicyTypeLid) }),
        };
        if (Object.keys(segUpdate).length > 0) {
          try {
            await this.policyTypeSegregationRepository.update({ policyTypeLid: Number(id) }, segUpdate);
          } catch {
            // Non-fatal — segregation record may not exist yet
          }
        }

        // When status changes to Inactive (0), stamp the inactive date
        if (Number(recordData.status) === 0) {
          try {
            await this.dataSource.query(
              `UPDATE policy_type_segregation SET policy_type_inactive_date = NOW() WHERE policy_type_lid = $1`,
              [Number(id)]
            );
          } catch {
            // Non-fatal
          }
        }

        // Update the lookup_data record (organisationId and all other editable fields)
        const cols = new Set(repository.metadata.columns.map((c: any) => c.propertyName));
        const updatedData: any = { ...recordData };
        if (cols.has("updatedBy")) updatedData.updatedBy = DEFAULT_VALUES.UPDATED_BY;
        await repository.update({ [pk]: id } as any, updatedData);

        return await repository.findOne({ where: { [pk]: id } as any }) as T;
      }

      // Generic update path
      const columnsToSelect = getSelectableColumns(repository.metadata);
      const pk = repository.metadata.primaryColumns?.[0]?.propertyName || "id";
      const existingRecord = await repository.findOne({ where: { [pk]: id } as any });
      if (!existingRecord) {
        throw new InternalServerErrorException(`Record not found with id ${id}`);
      }
      const cols = new Set(repository.metadata.columns.map((c) => c.propertyName));
      const updatedData: any = { ...data };
      // Dynamically set updatedBy based on column type
      if (cols.has("updatedBy")) {
        const colType = repository.metadata.columns.find((c) => c.propertyName === "updatedBy")?.type;
        updatedData.updatedBy = this.isIntegerType(colType) ? 1 : DEFAULT_VALUES.UPDATED_BY;
      }
      await repository.update({ [pk]: id } as any, updatedData);

      const updatedRecord = await repository.findOne({
        select: columnsToSelect,
        where: { [pk]: id } as any,
      });
      return updatedRecord as T;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to update record"
      );
    }
  }

  /**
   * Deletes a record by ID for the specified entity.
   */
  async deleteRecordById(entityClass: string, id: string): Promise<void> {
    try {
      const repository = this.dataSource.getRepository(entityClass);
      if (!repository) {
        throw new InternalServerErrorException("Invalid entity name");
      }
      const pk = repository.metadata.primaryColumns?.[0]?.propertyName || "id";
      const record = await repository.findOne({ where: { [pk]: id } as any });
      if (!record) {
        throw new InternalServerErrorException(
          `Record not found with id ${id}`
        );
      }
      await repository.delete({ [pk]: id } as any);
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to delete record"
      );
    }
  }

  async getFilterLookups(): Promise<FilterLookups> {
    try {
      const filterLookups = await this.lookUpRepository.find({
        where: {
          lookUpKey: In([
            FILTER_TYPE.USER,
            FILTER_TYPE.SYSTEM,
            FILTER_STATUS.ACTIVE,
            FILTER_STATUS.INACTIVE,
            DEFAULT_FILTER.YES,
            DEFAULT_FILTER.NO,
          ]),
        },
      });

      const filterTypeUser = filterLookups.find(
        (lookup) => lookup.lookUpKey === FILTER_TYPE.USER
      );
      if (!filterTypeUser) {
        throw new NotFoundException(
          errorMessages.lookupKeyNotFound(FILTER_TYPE.USER)
        );
      }

      const filterTypeSystem = filterLookups.find(
        (lookup) => lookup.lookUpKey === FILTER_TYPE.SYSTEM
      );
      if (!filterTypeSystem) {
        throw new NotFoundException(
          errorMessages.lookupKeyNotFound(FILTER_TYPE.SYSTEM)
        );
      }

      const filterStatusActive = filterLookups.find(
        (lookup) => lookup.lookUpKey === FILTER_STATUS.ACTIVE
      );
      if (!filterStatusActive) {
        throw new NotFoundException(
          errorMessages.lookupKeyNotFound(FILTER_STATUS.ACTIVE)
        );
      }

      const filterStatusInactive = filterLookups.find(
        (lookup) => lookup.lookUpKey === FILTER_STATUS.INACTIVE
      );
      if (!filterStatusInactive) {
        throw new NotFoundException(
          errorMessages.lookupKeyNotFound(FILTER_STATUS.INACTIVE)
        );
      }

      const defaultFilterYes = filterLookups.find(
        (lookup) => lookup.lookUpKey === DEFAULT_FILTER.YES
      );
      if (!defaultFilterYes) {
        throw new NotFoundException(
          errorMessages.lookupKeyNotFound(DEFAULT_FILTER.YES)
        );
      }

      const defaultFilterNo = filterLookups.find(
        (lookup) => lookup.lookUpKey === DEFAULT_FILTER.NO
      );
      if (!defaultFilterNo) {
        throw new NotFoundException(
          errorMessages.lookupKeyNotFound(DEFAULT_FILTER.NO)
        );
      }

      return {
        filterTypeUser,
        filterTypeSystem,
        filterStatusActive,
        filterStatusInactive,
        defaultFilterYes,
        defaultFilterNo,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to retrieve filter lookups"
      );
    }
  }

  async getUniqueFiltersByEntity(filters: any[]): Promise<any[]> {
    const seenEntities = new Set();
    const uniqueFilters = [];

    for (const filter of filters) {
      if (!seenEntities.has(filter.entity)) {
        uniqueFilters.push(filter);
        seenEntities.add(filter.entity);
      }
    }

    return uniqueFilters;
  }

  async buildDefaultFilterObject(
    filters: any[]
  ): Promise<Record<string, any>> {
    const defaultFilter: any = {
      smartSearchValues: {},
      tableDefaultSettings: {},
    };

    filters.forEach((filter) => {
      if (filter.filterJson && typeof filter.filterJson === "object") {
        defaultFilter.smartSearchValues[filter.entity] = filter.filterJson;
      }
      if (filter.tableSettingJson && Array.isArray(filter.tableSettingJson)) {
        defaultFilter.tableDefaultSettings[filter.entity] =
          filter.tableSettingJson;
      }
    });

    return defaultFilter;
  }

  async getFiltersByEntity(userId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterRepository",
          method: "getFiltersByEntity",
          messageData: "method invoked",
        }),
      });
      const filterLookups = await this.getFilterLookups();

      // System filters
      const systemFiltersData = await this.filterRepository.find({
        where: {
          userId: Or(IsNull(), In([userId])),
          filterTypeLid: filterLookups.filterTypeSystem.id,
          statusLid: filterLookups.filterStatusActive.id,
          defaultFilterLid: filterLookups.defaultFilterYes.id,
        },
        order: { createdAt: "DESC" },
      });

      const systemFilters = await this.getUniqueFiltersByEntity(
        systemFiltersData
      );
      const systemDefaultFilter = await this.buildDefaultFilterObject(
        systemFilters
      );

      // User filters
      const userFiltersData = await this.filterRepository.find({
        where: {
          userId,
          filterTypeLid: filterLookups.filterTypeUser.id,
          statusLid: filterLookups.filterStatusActive.id,
          defaultFilterLid: filterLookups.defaultFilterYes.id,
        },
        order: { createdAt: "DESC" },
      });
      const userFilters = await this.getUniqueFiltersByEntity(userFiltersData);
      const userDefaultFilter = await this.buildDefaultFilterObject(
        userFilters
      );

      return { systemDefaultFilter, userDefaultFilter };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterRepository",
          method: "getFiltersByEntity",
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to retrieve filters"
      );
    }
  }

  async saveUserFilter(userId: number, filterData: CreateFilterPreferenceDto) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterRepository",
          method: "saveUserFilter",
          payload: { userId, filterData },
          messageData: "method invoked",
        }),
      });
      return await this.dataSource.transaction(async (entityManager) => {
        const filterLookups = await this.getFilterLookups();

        const filter = {
          entity: filterData.entity.toUpperCase(),
          userId,
          filterName:
            filterData.filterName ??
            `${userId}_${filterData.entity.toUpperCase()}`,
          filterTypeLid:
            filterData.filterTypeLid ?? filterLookups.filterTypeUser.id,
          statusLid:
            filterData.statusLid ?? filterLookups.filterStatusActive.id,
          defaultFilterLid:
            filterData.defaultFilterLid ?? filterLookups.defaultFilterYes.id,
          filterJson: filterData.filterJson,
          tableSettingJson: filterData.tableSettingJson,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        // If the saved filter is marked as default, update other filters to not be default
        if (filter.defaultFilterLid === filterLookups.defaultFilterYes.id) {
          await entityManager.update(
            FilterPreference,
            {
              userId,
              entity: filterData.entity.toUpperCase(),
              filterTypeLid: filterLookups.filterTypeUser.id,
              defaultFilterLid: filterLookups.defaultFilterYes.id,
            },
            {
              defaultFilterLid: filterLookups.defaultFilterNo.id,
              updatedBy: userId,
              updatedAt: new Date(),
            }
          );
        }
        const userFilter = entityManager.create(FilterPreference, {
          ...filter,
        });
        return await entityManager.save(FilterPreference, userFilter);
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterRepository",
          method: "saveUserFilter",
          payload: { userId, filterData },
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to save user filter"
      );
    }
  }

  async updateUserFilter(
    userId: number,
    entity: string,
    filterData: UpdateFilterPreferenceDto
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "MasterRepository",
          method: "updateUserFilter",
          payload: { entity },
          messageData: "method invoked",
        }),
      });
      return await this.dataSource.transaction(async (entityManager) => {
        const filterLookups = await this.getFilterLookups();

        const filters = await this.filterRepository.find({
          where: {
            userId,
            entity: entity.toUpperCase(),
            filterTypeLid: filterLookups.filterTypeUser.id,
          },
          order: { createdAt: "DESC" },
        });
        if (!filters) {
          throw new BadRequestException(
            `No filters configured for the entity "${entity}" for user with ID ${userId}.`
          );
        }

        const filter = filters[0];
        await entityManager.update(
          FilterPreference,
          { id: filter.id },
          {
            ...filterData,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );

        // Update other filters to not be default
        await entityManager.update(
          FilterPreference,
          {
            id: Not(filter.id),
            userId,
            entity: entity.toUpperCase(),
            filterTypeLid: filterLookups.filterTypeUser.id,
          },
          {
            defaultFilterLid: filterLookups.defaultFilterNo.id,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "MasterRepository",
          method: "updateUserFilter",
          payload: { entity },
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update user filter"
      );
    }
  }
}
