import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Company } from "./entities/company.entity";
import { CompanyContactMap } from "./entities/company-contact.entity";

const EMAIL_COMMUNICATION_TYPE = "email";

// Role set confirmed for "CRM users" recipients (Opportunity Lost / Policy
// Renewal / Instalment notifications): Lead CRM, Associate CRM, Associate
// CRM Manager, Account Manager. Does not include the deactivated
// centralOpsLead/centralOpsTeamLead/associateCrm(manager-chain) roles.
@Injectable()
export class CrmRecipientResolverService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(CompanyContactMap)
    private readonly companyContactMapRepo: Repository<CompanyContactMap>,
  ) {}

  async getCrmUserEmails(companyId: number): Promise<string[]> {
    const company = await this.companyRepo.findOne({
      where: { id: companyId },
      relations: ["owner", "associateCrmInfo", "associateCrmMgrInfo", "accountManagerInfo"],
    });
    if (!company) {
      return [];
    }

    const emails = [
      company.owner?.emailId,
      company.associateCrmInfo?.emailId,
      company.associateCrmMgrInfo?.emailId,
      company.accountManagerInfo?.emailId,
    ].filter((email): email is string => !!email);

    return Array.from(new Set(emails));
  }

  // "Company Contact" resolves to every contact mapped to this company via
  // company_contact_map (confirmed decision — there is no single designated
  // "the" company contact in the data model), each contact's own email
  // communication row(s).
  async getCompanyContactEmails(companyId: number): Promise<string[]> {
    const maps = await this.companyContactMapRepo.find({
      where: { companyId },
      relations: ["contact", "contact.communicationDetails"],
    });

    const emails = maps.flatMap((map) =>
      (map.contact?.communicationDetails ?? [])
        .filter(
          (detail) =>
            detail.communicationType?.toLowerCase() === EMAIL_COMMUNICATION_TYPE,
        )
        .map((detail) => detail.communicationDetails),
    );

    return Array.from(new Set(emails.filter((email): email is string => !!email)));
  }
}
