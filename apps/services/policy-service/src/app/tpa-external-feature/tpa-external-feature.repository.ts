import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { MstrExtApplicationRef } from "../../../../service-lib/src/lib/entities/mstr-ext-application-ref.entity";
import { MstrExtAppResponseMapping } from "../../../../service-lib/src/lib/entities/mstr-ext-app-response-mapping.entity";
import { MstrTpaFeatureType } from "../../../../service-lib/src/lib/entities/mstr-tpa-feature-type.entity";
import { TpaExternalFeatureConfig } from "../../../../service-lib/src/lib/entities/tpa-external-feature-config.entity";
import { TpaPayloadFieldMapping } from "../../../../service-lib/src/lib/entities/tpa-payload-field-mapping.entity";
import { CreateFeatureTypeDto } from "./dto/create-feature-type.dto";
import { CreateFeatureConfigDto, FieldMappingDto } from "./dto/create-feature-config.dto";
import { UpsertAppRefDto } from "./dto/upsert-app-ref.dto";
import { UpsertResponseMappingDto } from "./dto/upsert-response-mapping.dto";

export interface DbTableSchema {
  tableName: string;
  category: "POLICY" | "EMPLOYEE" | "ENROLLMENT" | "OTHER";
  columns: { name: string; dataType: string }[];
}

@Injectable()
export class TpaExternalFeatureRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(MstrTpaFeatureType)
    private readonly featureTypeRepo: Repository<MstrTpaFeatureType>,
    @InjectRepository(TpaExternalFeatureConfig)
    private readonly featureConfigRepo: Repository<TpaExternalFeatureConfig>,
    @InjectRepository(TpaPayloadFieldMapping)
    private readonly fieldMappingRepo: Repository<TpaPayloadFieldMapping>,
    @InjectRepository(MstrExtApplicationRef)
    private readonly appRefRepo: Repository<MstrExtApplicationRef>,
    @InjectRepository(MstrExtAppResponseMapping)
    private readonly responseMappingRepo: Repository<MstrExtAppResponseMapping>,
  ) {}

  // ── DB Schema Introspection ───────────────────────────────────

  async getDbSchema(): Promise<DbTableSchema[]> {
    const rows: { table_name: string; column_name: string; data_type: string }[] =
      await this.dataSource.query(`
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name ~ '^(policy|endorsement|employee|company_employee|hr_employee|enrollment|member_enrollment|policy_member|policy_enrollment|group_policy|tpa_claim|tpa_external|mstr_)'
          AND column_name NOT IN (
            'created_at','updated_at','created_by','updated_by',
            'is_deleted','deleted_at','deleted_by'
          )
        ORDER BY table_name, ordinal_position
      `);

    const map = new Map<string, DbTableSchema>();
    for (const row of rows) {
      if (!map.has(row.table_name)) {
        let category: DbTableSchema["category"] = "OTHER";
        if (/^(policy|endorsement|group_policy|policy_member|policy_enrollment|tpa_claim|tpa_external)/.test(row.table_name)) category = "POLICY";
        else if (/^(employee|company_employee|hr_employee)/.test(row.table_name)) category = "EMPLOYEE";
        else if (/^(enrollment|member_enrollment)/.test(row.table_name)) category = "ENROLLMENT";
        // mstr_* tables stay as "OTHER" — shown in their own group
        map.set(row.table_name, { tableName: row.table_name, category, columns: [] });
      }
      map.get(row.table_name)!.columns.push({ name: row.column_name, dataType: row.data_type });
    }
    return [...map.values()].sort((a, b) => a.tableName.localeCompare(b.tableName));
  }

  // ── App Refs ─────────────────────────────────────────────────

  findAllAppRefs(onlyActive = false): Promise<MstrExtApplicationRef[]> {
    return this.appRefRepo.find({
      where: onlyActive ? { isActive: true } : {},
      order: { label: "ASC" },
    });
  }

  findAppRefById(id: number): Promise<MstrExtApplicationRef | null> {
    return this.appRefRepo.findOne({ where: { id } });
  }

  async createAppRef(dto: UpsertAppRefDto): Promise<MstrExtApplicationRef> {
    const entity = this.appRefRepo.create({
      label: dto.label,
      description: dto.description ?? "",
      verificationTokenApiUrl: dto.verificationTokenApiUrl ?? null,
      verificationTokenApiMethod: dto.verificationTokenApiMethod ?? null,
      verificationTokenApiPayload: dto.verificationTokenApiPayload ?? {},
      verificationTokenApiHeaders: dto.verificationTokenApiHeaders ?? null,
      magicUrlApiUrl: dto.magicUrlApiUrl ?? null,
      magicUrlApiMethod: dto.magicUrlApiMethod ?? null,
      magicUrlApiPayload: dto.magicUrlApiPayload ?? {},
      magicUrlApiHeaders: dto.magicUrlApiHeaders ?? null,
      authType: dto.authType,
      iss: dto.iss ?? "",
      expiresIn: dto.expiresIn ?? "10m",
      step1ResponseTokenKey: dto.step1ResponseTokenKey ?? "verificationToken",
      step2ResponseDataKey: dto.step2ResponseDataKey ?? "magicLink",
      containerCategory: dto.containerCategory ?? "ibp",
      isActive: dto.isActive ?? true,
      fieldHints: dto.fieldHints ?? null,
      payloadFormat: dto.payloadFormat ?? "JSON",
      flowType: dto.flowType ?? "REDIRECT",
      syncTargetTable: dto.syncTargetTable ?? null,
      syncDedupColumn: dto.syncDedupColumn ?? null,
      syncScope: dto.syncScope ?? null,
      syncSchedule: dto.syncSchedule ?? null,
      syncTtlHours: dto.syncTtlHours ?? 24,
      syncTables: dto.syncTables ?? null,
      basicAuthUser: dto.basicAuthUser ?? null,
      basicAuthPassword: dto.basicAuthPassword ?? null,
      tokenHeaderPrefix: dto.tokenHeaderPrefix ?? "Bearer",
      authAppRefId: dto.authAppRefId ?? null,
      individualEcardAppRefId: dto.individualEcardAppRefId ?? null,
      ecardArrayResponseKey: dto.ecardArrayResponseKey ?? null,
      ecardRelationMatchField: dto.ecardRelationMatchField ?? null,
      ecardResponseMode: dto.ecardResponseMode ?? null,
    });
    return this.appRefRepo.save(entity);
  }

  async updateAppRef(id: number, dto: Partial<UpsertAppRefDto>): Promise<MstrExtApplicationRef | null> {
    const entity = await this.appRefRepo.findOne({ where: { id } });
    if (!entity) return null;
    Object.assign(entity, {
      ...(dto.label !== undefined && { label: dto.label }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.verificationTokenApiUrl !== undefined && { verificationTokenApiUrl: dto.verificationTokenApiUrl ?? null }),
      ...(dto.verificationTokenApiMethod !== undefined && { verificationTokenApiMethod: dto.verificationTokenApiMethod ?? null }),
      ...(dto.verificationTokenApiPayload !== undefined && { verificationTokenApiPayload: dto.verificationTokenApiPayload }),
      ...(dto.verificationTokenApiHeaders !== undefined && { verificationTokenApiHeaders: dto.verificationTokenApiHeaders ?? null }),
      ...(dto.magicUrlApiUrl !== undefined && { magicUrlApiUrl: dto.magicUrlApiUrl ?? null }),
      ...(dto.magicUrlApiMethod !== undefined && { magicUrlApiMethod: dto.magicUrlApiMethod ?? null }),
      ...(dto.magicUrlApiPayload !== undefined && { magicUrlApiPayload: dto.magicUrlApiPayload }),
      ...(dto.magicUrlApiHeaders !== undefined && { magicUrlApiHeaders: dto.magicUrlApiHeaders ?? null }),
      ...(dto.authType !== undefined && { authType: dto.authType }),
      ...(dto.iss !== undefined && { iss: dto.iss ?? null }),
      ...(dto.expiresIn !== undefined && { expiresIn: dto.expiresIn }),
      ...(dto.step1ResponseTokenKey !== undefined && { step1ResponseTokenKey: dto.step1ResponseTokenKey }),
      ...(dto.step2ResponseDataKey !== undefined && { step2ResponseDataKey: dto.step2ResponseDataKey }),
      ...(dto.containerCategory !== undefined && { containerCategory: dto.containerCategory }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.fieldHints !== undefined && { fieldHints: dto.fieldHints }),
      ...(dto.payloadFormat !== undefined && { payloadFormat: dto.payloadFormat }),
      ...(dto.flowType !== undefined && { flowType: dto.flowType }),
      ...(dto.syncTargetTable !== undefined && { syncTargetTable: dto.syncTargetTable ?? null }),
      ...(dto.syncDedupColumn !== undefined && { syncDedupColumn: dto.syncDedupColumn ?? null }),
      ...(dto.syncScope !== undefined && { syncScope: dto.syncScope ?? null }),
      ...(dto.syncSchedule !== undefined && { syncSchedule: dto.syncSchedule ?? null }),
      ...(dto.syncTtlHours !== undefined && { syncTtlHours: dto.syncTtlHours ?? null }),
      ...(dto.syncTables !== undefined && { syncTables: dto.syncTables ?? null }),
      ...(dto.basicAuthUser !== undefined && { basicAuthUser: dto.basicAuthUser ?? null }),
      ...(dto.basicAuthPassword !== undefined && { basicAuthPassword: dto.basicAuthPassword ?? null }),
      ...(dto.tokenHeaderPrefix !== undefined && { tokenHeaderPrefix: dto.tokenHeaderPrefix ?? "Bearer" }),
      ...(dto.authAppRefId !== undefined && { authAppRefId: dto.authAppRefId ?? null }),
      ...(dto.individualEcardAppRefId !== undefined && { individualEcardAppRefId: dto.individualEcardAppRefId ?? null }),
      ...(dto.ecardArrayResponseKey !== undefined && { ecardArrayResponseKey: dto.ecardArrayResponseKey ?? null }),
      ...(dto.ecardRelationMatchField !== undefined && { ecardRelationMatchField: dto.ecardRelationMatchField ?? null }),
      ...(dto.ecardResponseMode !== undefined && { ecardResponseMode: dto.ecardResponseMode ?? null }),
    });
    return this.appRefRepo.save(entity);
  }

  // ── Feature Types ────────────────────────────────────────────

  findAllFeatureTypes(onlyActive = false): Promise<MstrTpaFeatureType[]> {
    return this.featureTypeRepo.find({
      where: onlyActive ? { isActive: true } : {},
      order: { displayOrder: "ASC", id: "ASC" },
    });
  }

  findFeatureTypeById(id: number): Promise<MstrTpaFeatureType | null> {
    return this.featureTypeRepo.findOne({ where: { id } });
  }

  async createFeatureType(dto: CreateFeatureTypeDto): Promise<MstrTpaFeatureType> {
    const entity = this.featureTypeRepo.create({
      key: dto.key.toUpperCase().replace(/\s+/g, "_"),
      label: dto.label,
      description: dto.description ?? null,
      icon: dto.icon ?? null,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
    });
    return this.featureTypeRepo.save(entity);
  }

  async updateFeatureType(id: number, dto: Partial<CreateFeatureTypeDto>): Promise<MstrTpaFeatureType | null> {
    const entity = await this.featureTypeRepo.findOne({ where: { id } });
    if (!entity) return null;
    Object.assign(entity, {
      ...(dto.label !== undefined && { label: dto.label }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    });
    return this.featureTypeRepo.save(entity);
  }

  // ── Feature Configs ──────────────────────────────────────────

  findAllConfigs(): Promise<TpaExternalFeatureConfig[]> {
    return this.featureConfigRepo.find({
      relations: ["featureType", "appRef", "tpa", "fieldMappings"],
      order: { tpaId: "ASC", displayOrder: "ASC" },
    });
  }

  findConfigsByTpa(tpaId: number): Promise<TpaExternalFeatureConfig[]> {
    return this.featureConfigRepo.find({
      where: { tpaId },
      relations: ["featureType", "appRef", "fieldMappings"],
      order: { displayOrder: "ASC" },
    });
  }

  findActiveConfigsByTpa(tpaId: number): Promise<TpaExternalFeatureConfig[]> {
    return this.featureConfigRepo.find({
      where: { tpaId, isActive: true },
      relations: ["featureType", "appRef", "fieldMappings"],
      order: { displayOrder: "ASC" },
    });
  }

  findConfigById(id: number): Promise<TpaExternalFeatureConfig | null> {
    return this.featureConfigRepo.findOne({
      where: { id },
      relations: ["featureType", "appRef", "fieldMappings"],
    });
  }

  async createFeatureConfig(dto: CreateFeatureConfigDto): Promise<TpaExternalFeatureConfig> {
    const config = this.featureConfigRepo.create({
      tpaId: dto.tpaId,
      featureTypeId: dto.featureTypeId,
      appRefId: dto.appRefId,
      label: dto.label,
      buttonLabel: dto.buttonLabel,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
      apiType: dto.apiType ?? null,
      claimFormType: dto.claimFormType ?? null,
      submitExecutionMode: dto.submitExecutionMode ?? null,
    });
    const saved = await this.featureConfigRepo.save(config);
    if (dto.fieldMappings?.length) {
      await this.replaceFieldMappings(saved.id, dto.fieldMappings);
    }
    return this.findConfigById(saved.id) as Promise<TpaExternalFeatureConfig>;
  }

  async updateFeatureConfig(id: number, dto: Partial<CreateFeatureConfigDto>): Promise<TpaExternalFeatureConfig | null> {
    const entity = await this.featureConfigRepo.findOne({ where: { id } });
    if (!entity) return null;
    Object.assign(entity, {
      ...(dto.tpaId !== undefined && { tpaId: dto.tpaId }),
      ...(dto.featureTypeId !== undefined && { featureTypeId: dto.featureTypeId }),
      ...(dto.appRefId !== undefined && { appRefId: dto.appRefId }),
      ...(dto.label !== undefined && { label: dto.label }),
      ...(dto.buttonLabel !== undefined && { buttonLabel: dto.buttonLabel }),
      ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.apiType !== undefined && { apiType: dto.apiType }),
      ...(dto.claimFormType !== undefined && { claimFormType: dto.claimFormType }),
      ...(dto.submitExecutionMode !== undefined && { submitExecutionMode: dto.submitExecutionMode }),
    });
    await this.featureConfigRepo.save(entity);
    if (dto.fieldMappings !== undefined) {
      await this.replaceFieldMappings(id, dto.fieldMappings);
    }
    return this.findConfigById(id);
  }

  async deleteFeatureConfig(id: number): Promise<void> {
    await this.featureConfigRepo.delete(id);
  }

  // ── Field Mappings ───────────────────────────────────────────

  private async replaceFieldMappings(featureConfigId: number, mappings: FieldMappingDto[]): Promise<void> {
    await this.fieldMappingRepo.delete({ featureConfigId });
    const entities = mappings.map((m) =>
      this.fieldMappingRepo.create({
        featureConfigId,
        externalFieldName: m.externalFieldName,
        sourceType: m.sourceType,
        sourceField: m.sourceField ?? null,
        staticValue: m.staticValue ?? null,
        isRequired: m.isRequired ?? true,
        fieldType: m.fieldType ?? null,
        dateFormat: m.dateFormat ?? null,
      }),
    );
    await this.fieldMappingRepo.save(entities);
  }

  // ── Response Mappings ─────────────────────────────────────────

  findResponseMappingsByAppRef(appRefId: number): Promise<MstrExtAppResponseMapping[]> {
    return this.responseMappingRepo.find({
      where: { appRefId },
      order: { step: "ASC", displayOrder: "ASC" },
    });
  }

  async upsertResponseMappings(appRefId: number, dtos: UpsertResponseMappingDto[]): Promise<MstrExtAppResponseMapping[]> {
    await this.responseMappingRepo.delete({ appRefId });
    if (!dtos.length) return [];
    const entities = dtos.map((d, i) =>
      this.responseMappingRepo.create({
        appRefId,
        step: d.step,
        responseKey: d.responseKey,
        targetType: d.targetType,
        outputKey: d.outputKey,
        targetTable: d.targetTable ?? null,
        isAuthToken: d.isAuthToken ?? false,
        isPrimaryFk: d.isPrimaryFk ?? false,
        transform: d.transform ?? null,
        displayOrder: d.displayOrder ?? i,
      }),
    );
    return this.responseMappingRepo.save(entities);
  }

  async deleteResponseMapping(id: number): Promise<void> {
    await this.responseMappingRepo.delete(id);
  }
}
