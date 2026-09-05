import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TpaSsoConfig } from "../../../../service-lib/src/lib/entities/tpa-sso-config.entity";
import { TpaSsoFieldMapping } from "../../../../service-lib/src/lib/entities/tpa-sso-field-mapping.entity";
import { UpsertTpaSsoConfigDto, SsoFieldMappingDto } from "./dto/upsert-tpa-sso-config.dto";

@Injectable()
export class TpaSsoConfigRepository {
  constructor(
    @InjectRepository(TpaSsoConfig)
    private readonly ssoConfigRepo: Repository<TpaSsoConfig>,
    @InjectRepository(TpaSsoFieldMapping)
    private readonly fieldMappingRepo: Repository<TpaSsoFieldMapping>,
  ) {}

  findAll(): Promise<TpaSsoConfig[]> {
    return this.ssoConfigRepo.find({
      relations: ["tpa", "fieldMappings"],
      order: { tpaId: "ASC" },
    });
  }

  findByTpaId(tpaId: number): Promise<TpaSsoConfig | null> {
    return this.ssoConfigRepo.findOne({
      where: { tpaId },
      relations: ["tpa", "fieldMappings"],
    });
  }

  findById(id: number): Promise<TpaSsoConfig | null> {
    return this.ssoConfigRepo.findOne({
      where: { id },
      relations: ["tpa", "fieldMappings"],
    });
  }

  async create(dto: UpsertTpaSsoConfigDto): Promise<TpaSsoConfig> {
    const entity = this.ssoConfigRepo.create({
      tpaId: dto.tpaId,
      portalUrl: dto.portalUrl,
      ssoKeyEnvName: dto.ssoKeyEnvName,
      ssoIvEnvName: dto.ssoIvEnvName ?? null,
      ssoKeyEncoding: dto.ssoKeyEncoding ?? "utf8",
      ssoPadding: dto.ssoPadding ?? "PKCS7",
      ssoIvMode: dto.ssoIvMode,
      ssoTextEncoding: dto.ssoTextEncoding ?? "utf8",
      ssoTokenShape: dto.ssoTokenShape ?? "SEPARATE_FIELDS",
      ssoTokenParamName: dto.ssoTokenParamName ?? null,
      ssoOutputTransform: dto.ssoOutputTransform ?? null,
      ssoIvEnvelopeSeparator: dto.ssoIvEnvelopeSeparator ?? ":",
      isActive: dto.isActive ?? true,
      ssoDeliveryMode: dto.ssoDeliveryMode ?? "LOCAL_REDIRECT",
      remoteApiUrl: dto.ssoDeliveryMode === "REMOTE_API_REDIRECT" ? (dto.remoteApiUrl ?? null) : null,
      remoteApiMethod: dto.remoteApiMethod ?? "POST",
      remoteApiHeaders: dto.remoteApiHeaders ?? null,
      remoteRequestPayloadKey: dto.remoteRequestPayloadKey ?? "payload",
      remoteRequestExtraFields: dto.remoteRequestExtraFields ?? null,
      remoteResponseDataPath: dto.remoteResponseDataPath ?? "data",
      remoteResponseDecryptKeyEnvName:
        dto.ssoDeliveryMode === "REMOTE_API_REDIRECT" ? (dto.remoteResponseDecryptKeyEnvName ?? null) : null,
      remoteResponseRedirectUrlPath: dto.remoteResponseRedirectUrlPath ?? "redirectUrl",
    });
    const saved = await this.ssoConfigRepo.save(entity);
    if (dto.fieldMappings?.length) {
      await this.replaceFieldMappings(saved.id, dto.fieldMappings);
    }
    return this.findById(saved.id) as Promise<TpaSsoConfig>;
  }

  async update(id: number, dto: Partial<UpsertTpaSsoConfigDto>): Promise<TpaSsoConfig | null> {
    const entity = await this.ssoConfigRepo.findOne({ where: { id } });
    if (!entity) return null;
    Object.assign(entity, {
      ...(dto.tpaId !== undefined && { tpaId: dto.tpaId }),
      ...(dto.portalUrl !== undefined && { portalUrl: dto.portalUrl }),
      ...(dto.ssoKeyEnvName !== undefined && { ssoKeyEnvName: dto.ssoKeyEnvName }),
      ...(dto.ssoIvEnvName !== undefined && { ssoIvEnvName: dto.ssoIvEnvName ?? null }),
      ...(dto.ssoKeyEncoding !== undefined && { ssoKeyEncoding: dto.ssoKeyEncoding }),
      ...(dto.ssoPadding !== undefined && { ssoPadding: dto.ssoPadding }),
      ...(dto.ssoIvMode !== undefined && { ssoIvMode: dto.ssoIvMode }),
      ...(dto.ssoTextEncoding !== undefined && { ssoTextEncoding: dto.ssoTextEncoding }),
      ...(dto.ssoTokenShape !== undefined && { ssoTokenShape: dto.ssoTokenShape }),
      ...(dto.ssoTokenParamName !== undefined && { ssoTokenParamName: dto.ssoTokenParamName ?? null }),
      ...(dto.ssoOutputTransform !== undefined && { ssoOutputTransform: dto.ssoOutputTransform ?? null }),
      ...(dto.ssoIvEnvelopeSeparator !== undefined && { ssoIvEnvelopeSeparator: dto.ssoIvEnvelopeSeparator }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.ssoDeliveryMode !== undefined && { ssoDeliveryMode: dto.ssoDeliveryMode }),
      ...(dto.remoteApiUrl !== undefined && { remoteApiUrl: dto.remoteApiUrl ?? null }),
      ...(dto.remoteApiMethod !== undefined && { remoteApiMethod: dto.remoteApiMethod }),
      ...(dto.remoteApiHeaders !== undefined && { remoteApiHeaders: dto.remoteApiHeaders ?? null }),
      ...(dto.remoteRequestPayloadKey !== undefined && { remoteRequestPayloadKey: dto.remoteRequestPayloadKey }),
      ...(dto.remoteRequestExtraFields !== undefined && { remoteRequestExtraFields: dto.remoteRequestExtraFields ?? null }),
      ...(dto.remoteResponseDataPath !== undefined && { remoteResponseDataPath: dto.remoteResponseDataPath }),
      ...(dto.remoteResponseDecryptKeyEnvName !== undefined && { remoteResponseDecryptKeyEnvName: dto.remoteResponseDecryptKeyEnvName ?? null }),
      ...(dto.remoteResponseRedirectUrlPath !== undefined && { remoteResponseRedirectUrlPath: dto.remoteResponseRedirectUrlPath }),
    });
    await this.ssoConfigRepo.save(entity);
    if (dto.fieldMappings !== undefined) {
      await this.replaceFieldMappings(id, dto.fieldMappings);
    }
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.ssoConfigRepo.delete(id);
  }

  private async replaceFieldMappings(ssoConfigId: number, mappings: SsoFieldMappingDto[]): Promise<void> {
    await this.fieldMappingRepo.delete({ ssoConfigId });
    const entities = mappings.map((m, i) =>
      this.fieldMappingRepo.create({
        ssoConfigId,
        externalFieldName: m.externalFieldName,
        sourceType: m.sourceType,
        sourceField: m.sourceField ?? null,
        staticValue: m.staticValue ?? null,
        displayOrder: m.displayOrder ?? i,
      }),
    );
    await this.fieldMappingRepo.save(entities);
  }
}
