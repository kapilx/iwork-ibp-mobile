import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { TpaSsoConfigRepository } from "./tpa-sso-config.repository";
import { UpsertTpaSsoConfigDto } from "./dto/upsert-tpa-sso-config.dto";
import { UpsertSsoWithFeatureDto } from "./dto/upsert-sso-with-feature.dto";
import { PreviewSsoUrlDto } from "./dto/preview-sso-url.dto";
import axios from "axios";
import {
  buildSsoRedirectUrl,
  executeRemoteApiRedirect,
  resolveSsoFieldValues,
  SsoConfigError,
} from "../../../../service-lib/src/lib/utils/tpa-sso-crypto.util";
import { TpaSsoConfig } from "../../../../service-lib/src/lib/entities/tpa-sso-config.entity";
import { TpaSsoFieldMapping } from "../../../../service-lib/src/lib/entities/tpa-sso-field-mapping.entity";
import { TpaExternalFeatureConfig } from "../../../../service-lib/src/lib/entities/tpa-external-feature-config.entity";

@Injectable()
export class TpaSsoConfigService {
  constructor(
    private readonly repo: TpaSsoConfigRepository,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  getAll() {
    return this.repo.findAll();
  }

  async getByTpaId(tpaId: number) {
    const config = await this.repo.findByTpaId(tpaId);
    if (!config) throw new NotFoundException(`No SSO config found for TPA ${tpaId}`);
    return config;
  }

  async getById(id: number) {
    const config = await this.repo.findById(id);
    if (!config) throw new NotFoundException(`SSO config ${id} not found`);
    return config;
  }

  create(dto: UpsertTpaSsoConfigDto) {
    return this.repo.create(dto);
  }

  async update(id: number, dto: Partial<UpsertTpaSsoConfigDto>) {
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new NotFoundException(`SSO config ${id} not found`);
    return updated;
  }

  async delete(id: number) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundException(`SSO config ${id} not found`);
    await this.repo.delete(id);
  }

  // SSO-only save path: writes the IBP button row (tpa_external_feature_config) and
  // the crypto config (tpa_sso_config + tpa_sso_field_mapping) in ONE transaction.
  // Fixes a real bug where saving these as two separate requests could leave a
  // feature-config row with no matching SSO config if the second request failed
  // after the first had already committed (surfaced as a unique-constraint error
  // on retry, since the UI had no way to know the first row already existed).
  // This does not change how any other (non-SSO) feature type is saved.
  async upsertWithFeatureConfig(dto: UpsertSsoWithFeatureDto) {
    return this.dataSource.transaction(async (manager) => {
      const featureConfigRepo = manager.getRepository(TpaExternalFeatureConfig);
      const ssoConfigRepo = manager.getRepository(TpaSsoConfig);
      const fieldMappingRepo = manager.getRepository(TpaSsoFieldMapping);

      let featureConfig = dto.featureConfigId
        ? await featureConfigRepo.findOne({ where: { id: dto.featureConfigId } })
        : await featureConfigRepo.findOne({ where: { tpaId: dto.tpaId, featureTypeId: dto.featureTypeId } });

      const featureConfigFields = {
        tpaId: dto.tpaId,
        featureTypeId: dto.featureTypeId,
        appRefId: null,
        label: dto.label,
        buttonLabel: dto.buttonLabel,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      };
      featureConfig = featureConfig
        ? await featureConfigRepo.save(Object.assign(featureConfig, featureConfigFields))
        : await featureConfigRepo.save(featureConfigRepo.create(featureConfigFields));

      let ssoConfig = await ssoConfigRepo.findOne({ where: { tpaId: dto.tpaId } });
      const ssoConfigFields = {
        tpaId: dto.tpaId,
        portalUrl: dto.portalUrl,
        ssoKeyEnvName: dto.ssoKeyEnvName,
        ssoIvEnvName: dto.ssoIvMode === "FIXED" ? (dto.ssoIvEnvName ?? null) : null,
        ssoKeyEncoding: dto.ssoKeyEncoding ?? "utf8",
        ssoPadding: dto.ssoPadding ?? "PKCS7",
        ssoIvMode: dto.ssoIvMode,
        ssoTextEncoding: dto.ssoTextEncoding ?? "utf8",
        ssoTokenShape: dto.ssoTokenShape ?? "SEPARATE_FIELDS",
        ssoTokenParamName: dto.ssoTokenShape === "COMBINED_JSON" ? (dto.ssoTokenParamName ?? null) : null,
        ssoOutputTransform: dto.ssoOutputTransform ?? null,
        ssoIvEnvelopeSeparator: dto.ssoIvMode === "RANDOM_EMBEDDED" ? (dto.ssoIvEnvelopeSeparator || ":") : ":",
        ssoUrlEncode: dto.ssoUrlEncode ?? true,
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
      };
      ssoConfig = ssoConfig
        ? await ssoConfigRepo.save(Object.assign(ssoConfig, ssoConfigFields))
        : await ssoConfigRepo.save(ssoConfigRepo.create(ssoConfigFields));

      await fieldMappingRepo.delete({ ssoConfigId: ssoConfig.id });
      const mappingEntities = (dto.fieldMappings ?? []).map((m, i) =>
        fieldMappingRepo.create({
          ssoConfigId: ssoConfig.id,
          externalFieldName: m.externalFieldName,
          sourceType: m.sourceType,
          sourceField: m.sourceField ?? null,
          staticValue: m.staticValue ?? null,
          displayOrder: m.displayOrder ?? i,
        }),
      );
      const savedMappings = mappingEntities.length ? await fieldMappingRepo.save(mappingEntities) : [];

      return { featureConfig, ssoConfig: { ...ssoConfig, fieldMappings: savedMappings } };
    });
  }

  async previewRedirectUrl(id: number, dto: PreviewSsoUrlDto) {
    const config = await this.repo.findById(id);
    if (!config) throw new NotFoundException(`SSO config ${id} not found`);

    const context = dto.context ?? this.sampleContextFor(config.fieldMappings);
    const sortedMappings = [...config.fieldMappings].sort((a, b) => a.displayOrder - b.displayOrder);

    try {
      const payload = resolveSsoFieldValues(sortedMappings, context);

      if (config.ssoDeliveryMode === "REMOTE_API_REDIRECT") {
        // This actually calls the TPA's real API with sample data (same as "Test API
        // Connection" does for other feature types) — the only way to preview a mode
        // where the redirect URL comes back from them, not from local config.
        const result = await executeRemoteApiRedirect(config, sortedMappings, context);
        return {
          deliveryMode: "REMOTE_API_REDIRECT",
          redirectUrl: result.redirectUrl,
          contextUsed: context,
          payload,
          encryptedPayload: result.encryptedPayload,
          requestSent: result.requestBody,
        };
      }

      const redirectUrl = buildSsoRedirectUrl(config, sortedMappings, context);
      return {
        deliveryMode: "LOCAL_REDIRECT",
        redirectUrl,
        contextUsed: context,
        payload,
        tokenShape: config.ssoTokenShape,
        tokenParamName: config.ssoTokenParamName,
      };
    } catch (error) {
      if (error instanceof SsoConfigError) {
        throw new BadRequestException(error.message);
      }
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const statusSuffix = status ? ` (HTTP ${status})` : "";
        const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        throw new BadRequestException(`TPA API call failed${statusSuffix}: ${detail}`);
      }
      throw error;
    }
  }

  // No context passed in? Fabricate placeholder values so POLICY/EMPLOYEE fields still
  // resolve to *something* — makes the preview usable with a single click during setup.
  private sampleContextFor(
    fieldMappings: { sourceType: string; sourceField: string | null }[],
  ): Record<string, Record<string, unknown>> {
    const context: Record<string, Record<string, unknown>> = {};
    for (const mapping of fieldMappings) {
      if (mapping.sourceType === "STATIC" || mapping.sourceType === "SYSTEM" || !mapping.sourceField) continue;
      context[mapping.sourceType] = context[mapping.sourceType] ?? {};
      context[mapping.sourceType][mapping.sourceField] = `SAMPLE_${mapping.sourceField}`;
    }
    return context;
  }
}
