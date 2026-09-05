import { Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { TpaSsoConfig } from "../../../../service-lib/src/lib/entities/tpa-sso-config.entity";
import {
  buildSsoRedirectUrl,
  executeRemoteApiRedirect,
  SsoConfigError,
  SsoContext,
} from "../../../../service-lib/src/lib/utils/tpa-sso-crypto.util";
import {
  GenericFieldResolverError,
  resolveTableColumnValue,
} from "../../../../service-lib/src/lib/utils/generic-field-resolver.util";

const RESERVED_SOURCE_TYPES = new Set(["STATIC", "POLICY", "EMPLOYEE", "SYSTEM"]);

export interface SsoRedirectContext {
  employeeId: number;
  policyId: number | null;
  // Pre-resolved fast-path values, e.g. { POLICY: { externalTpaPolicyId }, EMPLOYEE: { companyEmployeeId } }
  context: SsoContext;
}

// The one shared executor for every TPA on the "encrypt identifiers, build a
// redirect URL" SSO pattern. Onboarding a new TPA on a known combination of
// axes (see tpa_sso_config columns) is a data change only — nothing here
// should need to change per TPA. Field mappings whose source isn't STATIC/
// POLICY/EMPLOYEE/SYSTEM are treated as a real DB table name and resolved
// generically (single join hop from employee/policy — see generic-field-resolver.util.ts).
@Injectable()
export class TpaSsoExecutorService {
  constructor(
    @InjectRepository(TpaSsoConfig)
    private readonly ssoConfigRepo: Repository<TpaSsoConfig>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async buildRedirectUrl(tpaId: number, { employeeId, policyId, context }: SsoRedirectContext): Promise<string> {
    const config = await this.ssoConfigRepo.findOne({
      where: { tpaId, isActive: true },
      relations: ["fieldMappings"],
    });

    if (!config) {
      throw new NotFoundException(`No active SSO configuration found for TPA ${tpaId}`);
    }

    const fieldMappings = [...config.fieldMappings].sort((a, b) => a.displayOrder - b.displayOrder);
    const fullContext: SsoContext = { ...context };

    try {
      for (const mapping of fieldMappings) {
        if (RESERVED_SOURCE_TYPES.has(mapping.sourceType) || !mapping.sourceField) continue;
        const tableName = mapping.sourceType;
        const value = await resolveTableColumnValue(this.dataSource, tableName, mapping.sourceField, employeeId, policyId);
        fullContext[tableName] = { ...fullContext[tableName], [mapping.sourceField]: value };
      }
    } catch (error) {
      if (error instanceof GenericFieldResolverError) {
        throw new InternalServerErrorException(error.message);
      }
      throw error;
    }

    try {
      if (config.ssoDeliveryMode === "REMOTE_API_REDIRECT") {
        const result = await executeRemoteApiRedirect(config, fieldMappings, fullContext);
        return result.redirectUrl;
      }
      return buildSsoRedirectUrl(config, fieldMappings, fullContext);
    } catch (error) {
      if (error instanceof SsoConfigError) {
        throw new InternalServerErrorException(error.message);
      }
      throw error;
    }
  }
}
