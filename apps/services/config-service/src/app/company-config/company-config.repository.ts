import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigCompany } from "../../../../service-lib/src/lib/entities/config-company.entity";
import { CompanyPortalConfigScope } from "../../../../service-lib/src/lib/entities/company-portal-config-scope.entity";

@Injectable()
export class CompanyConfigRepository {
  constructor(
    @InjectRepository(ConfigCompany)
    private readonly configCompanyRepository: Repository<ConfigCompany>,
    @InjectRepository(CompanyPortalConfigScope)
    private readonly configScopeRepository: Repository<CompanyPortalConfigScope>,
  ) {}

  private readonly relations = [
    "companyConfigurationStatus",
    "companyPortalConfigurationDetail",
  ];

  /**
   * Find company configuration by subdomain
   */
  async findBySubDomain(subDomain: string): Promise<ConfigCompany | null> {
    return this.configCompanyRepository.findOne({
      where: { subDomain },
      relations: this.relations,
    });
  }

  /**
   * Find ALL company configurations sharing the same subdomain (domain group members)
   */
  async findAllBySubDomain(subDomain: string): Promise<ConfigCompany[]> {
    return this.configCompanyRepository.find({
      where: { subDomain },
      select: ['companyId'],
    });
  }

  /**
   * Find company configuration by ID
   */
  async findById(id: number): Promise<ConfigCompany | null> {
    return this.configCompanyRepository.findOne({
      where: { id },
      relations: this.relations,
    });
  }

  /**
   * Find company configuration by company ID
   */
  async findByCompanyId(companyId: number): Promise<ConfigCompany | null> {
    return this.configCompanyRepository.findOne({
      where: { companyId },
      relations: this.relations,
    });
  }

  /**
   * Save or update company configuration
   */
  async save(config: ConfigCompany): Promise<ConfigCompany> {
    return this.configCompanyRepository.save(config);
  }

  /**
   * Get all company configurations
   */
  async findAll(): Promise<ConfigCompany[]> {
    return this.configCompanyRepository.find({
      relations: this.relations,
    });
  }

  /**
   * Get all configs where subDomain is set (company already has a domain configured)
   */
  async findConfiguredWithDomain(): Promise<Pick<ConfigCompany, 'companyId'>[]> {
    return this.configCompanyRepository
      .createQueryBuilder('cpc')
      .select('cpc.company_id', 'companyId')
      .where('cpc.sub_domain IS NOT NULL')
      .andWhere("cpc.sub_domain != ''")
      .getRawMany();
  }

  async getConfigScope(configId: number): Promise<CompanyPortalConfigScope[]> {
    return this.configScopeRepository.find({
      where: { configId },
      order: { companyId: "ASC", policyId: "ASC" },
    });
  }

  async deleteConfigScope(configId: number): Promise<void> {
    await this.configScopeRepository.delete({ configId });
  }

  async insertConfigScope(rows: Partial<CompanyPortalConfigScope>[]): Promise<void> {
    if (!rows.length) return;
    await this.configScopeRepository
      .createQueryBuilder()
      .insert()
      .into(CompanyPortalConfigScope)
      .values(rows)
      .orIgnore()
      .execute();
  }

  /** Returns explicit policy_ids already assigned to OTHER domain configs for a company */
  async findAllByCompanyId(companyId: number): Promise<ConfigCompany[]> {
    return this.configCompanyRepository.find({
      where: { companyId },
      relations: this.relations,
      order: { createdAt: 'ASC' },
    });
  }

  async deleteById(id: number): Promise<void> {
    await this.configCompanyRepository.softDelete({ id });
  }

  async getTakenPolicies(companyId: number, excludeConfigId: number): Promise<number[]> {
    const rows = await this.configScopeRepository
      .createQueryBuilder("s")
      .select("s.policyId")
      .where("s.companyId = :companyId", { companyId })
      .andWhere("s.configId != :excludeConfigId", { excludeConfigId })
      .andWhere("s.policyId IS NOT NULL")
      .getRawMany();
    return rows.map((r) => r.s_policy_id as number);
  }
}
