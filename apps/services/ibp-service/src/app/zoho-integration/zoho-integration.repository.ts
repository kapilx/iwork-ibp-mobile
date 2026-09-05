import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CompanyZohoIntegration } from "../../../../service-lib/src/lib/entities/company-zoho-integration.entity";
import { ZohoSyncResultDto } from "./dto/zoho-sync-result.dto";

@Injectable()
export class ZohoIntegrationRepository {
  constructor(
    @InjectRepository(CompanyZohoIntegration)
    private readonly repo: Repository<CompanyZohoIntegration>,
  ) {}

  findByCompanyId(companyId: number): Promise<CompanyZohoIntegration | null> {
    return this.repo.findOne({ where: { companyId, isActive: true } });
  }

  async upsertTokens(
    companyId: number,
    data: {
      accessToken: string;
      refreshToken?: string;
      tokenExpiresAt: Date;
      scopes: string[];
      zohoOrganizationId?: string;
      zohoDomain?: string;
    },
    createdBy: number,
  ): Promise<CompanyZohoIntegration> {
    let record = await this.repo.findOne({ where: { companyId } });
    if (record) {
      record.accessToken = data.accessToken;
      record.refreshToken = data.refreshToken;
      record.tokenExpiresAt = data.tokenExpiresAt;
      record.scopes = data.scopes;
      if (data.zohoOrganizationId) record.zohoOrganizationId = data.zohoOrganizationId;
      if (data.zohoDomain) record.zohoDomain = data.zohoDomain;
      record.isActive = true;
      record.updatedBy = createdBy;
    } else {
      record = this.repo.create({
        companyId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        tokenExpiresAt: data.tokenExpiresAt,
        scopes: data.scopes,
        zohoOrganizationId: data.zohoOrganizationId,
        zohoDomain: data.zohoDomain ?? "zoho.in",
        isActive: true,
        createdBy,
        updatedBy: createdBy,
      });
    }
    return this.repo.save(record);
  }

  async updateAccessToken(
    companyId: number,
    accessToken: string,
    tokenExpiresAt: Date,
  ): Promise<void> {
    await this.repo.update({ companyId }, { accessToken, tokenExpiresAt });
  }

  async updateSyncStats(companyId: number, stats: ZohoSyncResultDto): Promise<void> {
    await this.repo.update(
      { companyId },
      { lastSyncedAt: new Date(), lastSyncStats: stats as any },
    );
  }

  async deactivate(companyId: number, updatedBy: number): Promise<void> {
    await this.repo.update(
      { companyId },
      { isActive: false, accessToken: undefined, refreshToken: undefined, updatedBy },
    );
  }
}
