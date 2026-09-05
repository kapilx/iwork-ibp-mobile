import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { VersionSheet } from "../../../../service-lib/src/lib/utils/file-management.utils";
import { ExcelRepository } from "./excel.repository";
import { PolicyReportService } from "../../../../service-lib/src/lib/utils/policy-report";
import { FindOptionsWhere, In, Repository } from "typeorm";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { OpportunityActivityMap } from "../../../../service-lib/src/lib/entities/opportunity-activity-map.entity";
import { OpportunityActivityParticipants } from "../../../../service-lib/src/lib/entities/opportunity-activity-participants.entity";
import { OpportunityPlacementSlipGeneration } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-generation.entity";
import { OpportunityPlacementSlipSharingDetail } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-sharing-detail.entity";
import { OpportunityPlacementSlipInsurerMap } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-insurer-map.entity";
import type { OpportunityPlacementSlipCDDetail } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-cd-detail.entity";
import { OpportunityPlacementSlipTpaMap } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-tpa-map.entity";
// import { CautionDepositPolicyMapping } from "../../../../service-lib/src/lib/entities/caution-deposit-policy-mapping.entity";
import { OpportunityCoverMap } from "../../../../service-lib/src/lib/entities/opportunity-cover.entity";
import { OpportunityPlacementSlipCoverDetail } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-cover-detail.entity";
import { OpportunityFinalNegotiation } from "../../../../service-lib/src/lib/entities/opportunity-final-negotiation.entity";
import { OpportunityQuoteEntry } from "../../../../service-lib/src/lib/entities/opportunity-quote-entry.entity";
import { Organisation } from "../../../../service-lib/src/lib/entities/organisation.entity";
import {
  ACTIVITY_KEY,
  ROLE_KEY,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  ORGANISATION_KEYS,
  TASK_TYPE,
} from "../../../../service-lib/src/lib/constants";
import {
  convertUtcToIst,
  extractDateAndTime,
  formatDate as formatDateUtil,
  filterCoversByActivity,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { Address } from "../../../../service-lib/src/lib/entities/address.entity";
import { City } from "../../../../service-lib/src/lib/entities/city.entity";
import { Insurer } from "../../../../service-lib/src/lib/entities/insurer.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { Tpa } from "../../../../service-lib/src/lib/entities/tpa.entity";
import { User } from "../../../../service-lib/src/lib/entities/user";
import { Task } from "../../../../service-lib/src/lib/entities/task.entity";
import type { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import type { CompanyAddress } from "../../../../service-lib/src/lib/entities/company.address.entity";
import type { Opportunity } from "../../../../service-lib/src/lib/entities/opportunity.entity";
import type { OrgBranch } from "../../../../service-lib/src/lib/entities/org-branch.entity";

const REFERRED_BY_PREFIX = "INDIA INSURE - ";
const DEFAULT_REFERRED_BY = `${REFERRED_BY_PREFIX}Hyderabad`;
const DEFAULT_CONTACT_NUMBER = "040-27822991";
const PLACEMENT_SLIP_MASTER_ACTIVITY_ID = 10;
const DEFAULT_CURRENCY_PREFIX = "Rs.";
const ORGANISATION_CURRENCY_PREFIXES: Record<string, string> = {
  iirm_srilanka: "LKR.",
  iirm_kenya: "KES.",
};
type PolicyPlacedTypeIds = {
  MULTIPLE: number | null;
  SINGLE: number | null;
};

type LocationAddressSummary = {
  cityName: string | null;
  pinCode: string | null;
};

type ResolvedPlacementInsurer = {
  map: OpportunityPlacementSlipInsurerMap;
  insurer: Insurer | null;
  locationAddress: LocationAddressSummary | null;
  branchAddress: Address | null;
};

type PlacementSlipCover = {
  id: number;
  coverName: string | null;
  coverResponse: unknown;
  coversMeta?: Record<string, unknown> | null;
  displaySequence?: number | null;
  coverType?: number | null;
  sectionId?: number | null;
};

type PremiumSectionRow = Record<string, string | null>;

type PremiumSectionTable = {
  dataType: "table";
  tableType: "left-right";
  sectionData: PremiumSectionRow[];
};

type CoverSectionTable = {
  dataType: "table";
  tableType: "up-down";
  sectionData: Array<{ Description: string; Remarks: string }>;
};

type PremiumSectionBuilderParams = {
  organisationName: string | null;
  policy: Policy;
  placementSlip: OpportunityPlacementSlipGeneration | null;
};

type PremiumSectionStrategy = (
  params: PremiumSectionBuilderParams
) => PremiumSectionTable;

@Injectable()
export class ExcelService {
  constructor(
    private readonly excelRepository: ExcelRepository,
    private readonly policyReportService: PolicyReportService,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(OpportunityCoverMap)
    private readonly opportunityCoverMapRepository: Repository<OpportunityCoverMap>,
    @InjectRepository(OpportunityPlacementSlipCoverDetail)
    private readonly opportunityPlacementSlipCoverDetailRepository: Repository<OpportunityPlacementSlipCoverDetail>,
    @InjectRepository(OpportunityActivityMap)
    private readonly opportunityActivityMapRepository: Repository<OpportunityActivityMap>,
    @InjectRepository(OpportunityActivityParticipants)
    private readonly opportunityActivityParticipantsRepository: Repository<OpportunityActivityParticipants>,
    @InjectRepository(OpportunityPlacementSlipGeneration)
    private readonly opportunityPlacementSlipGenerationRepository: Repository<OpportunityPlacementSlipGeneration>,
    @InjectRepository(OpportunityFinalNegotiation)
    private readonly opportunityFinalNegotiationRepository: Repository<OpportunityFinalNegotiation>,
    @InjectRepository(OpportunityQuoteEntry)
    private readonly opportunityQuoteEntryRepository: Repository<OpportunityQuoteEntry>,
    @InjectRepository(OpportunityPlacementSlipInsurerMap)
    private readonly opportunityPlacementSlipInsurerMapRepository: Repository<OpportunityPlacementSlipInsurerMap>,
    @InjectRepository(Insurer)
    private readonly insurerRepository: Repository<Insurer>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(OpportunityPlacementSlipTpaMap)
    private readonly opportunityPlacementSlipTpaMapRepository: Repository<OpportunityPlacementSlipTpaMap>,
    @InjectRepository(Tpa)
    private readonly tpaRepository: Repository<Tpa>,
    @InjectRepository(Organisation)
    private readonly organisationRepository: Repository<Organisation>
  ) {}

  private policyPlacedTypeCache: PolicyPlacedTypeIds | null = null;
  private policyPlacedTypePromise: Promise<PolicyPlacedTypeIds> | null = null;

  async generateExcel(fileName: string, data: VersionSheet[],userId?: number) {
    let userDetails = null;
    if (userId) {
      const user = await this.userRepository.findOne({ where: { userId } });
      if (user) {
        userDetails = { firstName: user.firstName, lastName: user.lastName };
      }
    }
    return await this.excelRepository.brokingSlipExcelGeneration(
      fileName,
      data,
      userDetails
    );
  }

  async generateQuoteComparisonReportExcel(
    fileName: string,
    qcrData: any,
    userId: number
  ) {
    const userDetails = await this.userRepository.findOne({
      where: { userId },
      relations: ["organisation"],
    });

    if (!userDetails) {
      throw new BadRequestException(`User not found for userId: ${userId}`);
    }

    return await this.excelRepository.quoteComparisonReportExcelGeneration(
      fileName,
      qcrData,
      userDetails?.organisation?.organisationKey || ORGANISATION_KEYS.INDIA,
      { firstName: userDetails.firstName, lastName: userDetails.lastName }
    );
  }

  async generatePolicyReportExcel(fileName: string, policyData: any) {
    try {
      const reportData = await this.policyReportService.getPolicyReport(
        policyData.userIds,
        policyData.entityType,
        policyData.timeFilter,
        policyData.financialYear
      );

      // Get first userId for password generation
      let userDetails = null;
      if (policyData.userIds && policyData.userIds.length > 0) {
        const user = await this.userRepository.findOne({ 
          where: { userId: policyData.userIds[0] } 
        });
        if (user) {
          userDetails = { firstName: user.firstName, lastName: user.lastName };
        }
      }

      return await this.excelRepository.policyReportExcelGeneration(
        fileName,
        reportData,
        userDetails
      );
    } catch (error) {
      throw new Error(
        `Failed to generate policy report Excel: ${(error as Error).message}`
      );
    }
  }

  async getPlacementSlipData(params: {
    policyId?: number;
    opportunityId?: number;
  }) {
    const { policyId, opportunityId } = params;

    if (!policyId && !opportunityId) {
      throw new BadRequestException(
        "Either policyId or opportunityId must be provided."
      );
    }

    const policy = await this.findPolicy({ policyId, opportunityId });

    if (!policy) {
      throw new NotFoundException(
        `Policy not found for the provided ${
          policyId ? "policyId" : "opportunityId"
        }.`
      );
    }
    const organizationId = await this.getOrganizationIdFromPolicy(policy);
    const organisationName = await this.getOrgName(organizationId);

    const [
      executiveActivity,
      managerActivity,
      // policyCautionDeposit,
      policyCoverResult,
    ] = await Promise.all([
      this.findPlacementSlipActivity(
        policy.opportunityId,
        ROLE_KEY.ROLE_ISG_EXECUTIVE
      ),
      this.findPlacementSlipActivity(
        policy.opportunityId,
        ROLE_KEY.ROLE_ISG_MANAGER
      ),
      // this.findPolicyCautionDeposit(policy.id),
      this.findPolicyCovers(policy),
    ]);

    const policyCoverMaps = policyCoverResult.covers;
    const unmatchedPolicyCoverIds = policyCoverResult.unmatchedCoverIds;

    let placementActivity = managerActivity ?? executiveActivity ?? null;

    if (!placementActivity && policy.opportunityId) {
      placementActivity = await this.findPlacementSlipActivity(
        policy.opportunityId
      );
    }

    const placementActivityId = placementActivity?.id ?? null;

    const managerUser = (managerActivity?.owner ??
      placementActivity?.owner ??
      null) as User | null;
    const managerName = this.formatFullName(managerUser);
    const contactName =
      this.formatFullName((executiveActivity?.owner ?? null) as User | null) ??
      managerName;

    const executiveParticipant = null;

    const executiveUser = null;
    const executiveName = this.formatFullName(executiveUser);

    const placementSlip = placementActivityId
      ? await this.findPlacementSlipGeneration(placementActivityId)
      : null;

    const approverDetails = placementActivityId
      ? await this.getActivityApproverDetails(placementActivityId)
      : null;

    const resolvedPlacementInsurers = await this.resolvePlacementSlipInsurers(
      placementSlip
    );
    const policyPlacedTypeIds = await this.getPolicyPlacedTypeIds();
    const primaryPlacementInsurer = this.selectPrimaryPlacementInsurer(
      resolvedPlacementInsurers,
      placementSlip,
      policyPlacedTypeIds
    );

    const primaryCdDetail = this.getPrimaryCdDetail(placementSlip);

    const company = (policy.company ?? null) as Company | null;
    const opportunity = (policy.opportunity ?? null) as Opportunity | null;
    const policyDisplayName = this.getPolicyDisplayName(policy);
    const policyTypeId = policy.policyType?.id ?? null;
    const policyDisplayNameWithoutSanitization =
      this.getPolicyDisplayNameWithoutSanitization(policy);
    const policyHeadingName = policyDisplayName;
    const companyName = company?.companyName ?? null;
    const companyAddress = this.getPrimaryCompanyAddress(company);
    const insurerSummary = this.buildPlacementInsurerSummary(
      primaryPlacementInsurer
    );
    const resolvedOpportunityId =
      opportunity?.opportunityId ??
      policy.opportunityId ??
      opportunityId ??
      null;

    const [dataValidationActivity, finalNegotiation, latestQuoteEntry] =
      resolvedOpportunityId
        ? await Promise.all([
            this.findDataValidationActivity(resolvedOpportunityId),
            this.findLatestFinalNegotiation(resolvedOpportunityId),
            this.findLatestQuoteEntry(resolvedOpportunityId),
          ])
        : [null, null, null];

    const ownerBranch = ((dataValidationActivity?.owner ?? null) as User | null)
      ?.branch as OrgBranch | null | undefined;
    const branchName = ownerBranch?.name ?? null;

    const referredBy = branchName
      ? `${REFERRED_BY_PREFIX}${branchName}`
      : DEFAULT_REFERRED_BY;

    const currentDate = this.formatDate(new Date());
    const placementPolicyFromDate = this.formatDate(
      placementSlip?.policyFromDate ?? null
    );
    const placementPolicyToDate = this.formatDate(
      placementSlip?.policyToDate ?? null
    );
    const policyInception = placementPolicyFromDate
      ? `Date : ${placementPolicyFromDate}`
      : null;
    const policyExpiry = placementPolicyToDate
      ? `Date : ${placementPolicyToDate}`
      : null;
    const documentDated = this.formatDate(
      latestQuoteEntry?.quoteReceivedOn ?? null
    );
    const discussionDated = this.formatDate(
      finalNegotiation?.meeting?.meetingDate ?? null
    );
    const referenceNumber = resolvedOpportunityId
      ? resolvedOpportunityId.toString()
      : null;
    const premiumSection = this.buildPremiumSection({
      organisationName,
      policy,
      placementSlip,
    });

    const paymentDetails = {
      dataType: "table",
      tableType: "left-right",
      sectionData: [
        {
          "Cheque No ": primaryCdDetail?.chequeNumber ?? null,
          "Bank Name ": primaryCdDetail?.bankName ?? null,
          "Cheque Dated ": primaryCdDetail?.chequeDate
            ? this.formatDate(primaryCdDetail.chequeDate)
            : null,
          "Cheque Amount ": this.formatCurrency(
            primaryCdDetail?.chequeAmount,
            organisationName
          ),
          "CD Details ": primaryCdDetail?.chequeAmount
            ? this.formatCurrency(
                primaryCdDetail?.openBalance,
                organisationName
              )
            : "NA",
        },
      ],
    };

    const coInsuranceSection = {
      dataType: "table",
      tableType: "up-down",
      sectionData: this.buildCoInsuranceSection(
        resolvedPlacementInsurers,
        placementSlip?.sharingDetails ?? null,
        placementSlip,
        policy.netPremium,
        policyPlacedTypeIds,
        organisationName
      ),
    };

    const companyOtherDetailsData = await this.buildCompanyOtherDetailsData(
      policyTypeId,
      placementSlip?.id ?? null
    );

    const companyOtherDetails = {
      heading: null,
      subHeading: "OTHER DETAILS",
      dataType: "table",
      underline: "Yes",
      bold: "Yes",
      tableType: "left-right",
      sectionData: [companyOtherDetailsData],
    };

    const companyPremiumAndBrokerage = {
      heading: null,
      subHeading: "PREMIUM AND BROKERAGE",
      dataType: "table",
      underline: "Yes",
      bold: "Yes",
      tableType: "up-down",
      sectionData: this.buildPremiumAndBrokerageSection(
        resolvedPlacementInsurers,
        placementSlip?.sharingDetails ?? null,
        placementSlip,
        policyPlacedTypeIds,
        organisationName
      ),
    };

    const companyWarranties = {
      heading: null,
      subHeading: "WARRANTIES",
      dataType: "table",
      underline: "Yes",
      bold: "Yes",
      tableType: "up-down",
      sectionData: [
        {
          "Sl No": "",
          Issue: "",
          Remarks: "",
        },
        {
          "Sl No": "",
          Issue: "",
          Remarks: "",
        },
      ],
    };

    const preparedByName = executiveName ?? managerName ?? null;
    const approvedByName = approverDetails?.name ?? null;

    const companyIndiaInsure = {
      heading: null,
      subHeading: "INDIA INSURE",
      dataType: "table",
      underline: "No",
      bold: "Yes",
      tableType: "up-down",
      sectionData: [
        {
          "": "Prepared By",
          Name: preparedByName,
          Signature: "",
        },
        {
          "": "Approved By",
          Name: approvedByName,
          Signature: "",
        },
      ],
    };

    const insurerNames = resolvedPlacementInsurers
      .map((item) => item.insurer?.insurerName ?? null)
      .filter((name): name is string => !!name && name.trim().length > 0);

    const companyInsuranceCompany = {
      heading: null,
      subHeading: "INSURANCE COMPANY",
      dataType: "table",
      underline: "No",
      bold: "Yes",
      tableType: "up-down",
      sectionData:
        insurerNames.length > 0
          ? insurerNames.map((name) => ({
              Name: name,
              Signature: "",
              Date: "",
              Remarks: "",
            }))
          : [
              {
                Name: "",
                Signature: "",
                Date: "",
                Remarks: "",
              },
            ],
    };

    const riskCoverLookups = [
      {
        description: "Sum Assured whether flat or graded with amount",
        searchTerms: ["Sum Assured whether flat or graded with amount"],
      },
      {
        description: "Mortality Information during the last 3 years separately",
        searchTerms: [
          "Mortality Information during the last 3 years separately",
          "Mortality information during last 3 years separately",
        ],
      },
      {
        description: "Provide accidental & Natural Deaths Separately",
        searchTerms: [
          "Provide accidental & Natural Deaths Separately",
          "Provide accidental and natural deaths separately",
        ],
      },
      {
        description: "Nature of job of the member",
        searchTerms: ["Nature of job of the member", "Nature of job"],
      },
      {
        description: "Employee Data should have",
        searchTerms: ["Employee Data should have", "Employee data"],
      },
    ];

    const normalizeRiskDescription = (description: string) =>
      this.normalizeIlike(description);

    const staticRiskRemarks = new Set(
      [
        "Sum Assured whether flat or graded with amount",
        "Mortality Information during the last 3 years separately",
        "Provide accidental & Natural Deaths Separately",
        "Nature of job of the member",
        "Employee Data should have",
      ]
        .map((item) => normalizeRiskDescription(item))
        .filter((item) => item.length > 0)
    );

    const riskSection = {
      dataType: "table",
      tableType: "up-down",
      sectionData: [
        {
          Description: "NA",
          Remarks: "NA",
        },
      ],
      // riskCoverLookups.map((item) => ({
      //   Description: item.description,
      //   Remarks: staticRiskRemarks.has(
      //     normalizeRiskDescription(item.description)
      //   )
      //     ? "NA"
      //     : this.resolveCoverValue(policyCoverMaps, item.searchTerms) ?? "NA",
      // })),
    };

    let footerSection;

    if (organisationName === "iirm_india") {
      footerSection = {
        heading:
          "INDIA INSURE RISK MANAGEMENT AND INSURANCE BROKING SERVICES PVT LTD",
        subHeading:
          "Ashoka My Home Chambers, 5th Floor, #1-8-301-306, Sindhi Colony, Sardar Patel Road, Begumpet,Secunderabad, Hyderabad - 500003 PH: 040-27822990 FAX: 040-27822991",
      };
    } else if (organisationName === "iirm_srilanka") {
      footerSection = {
        heading: "IIRM Lanka Insurance Brokers Private Limited",
        subHeading:
          "3rd Floor, No. 131, W.A.D. Ramanayake Mawatha, Colombo 02. General Line: +94117589600",
        subHeading2: "Fax: +94112540396",
      };
    }
    // change footer for kenya
    if (organisationName === "iirm_kenya") {
      footerSection = {
        heading: "IIRM KENYA - The risk managers",
        subHeading:
          "Sky Park Building, First Floor, Of Pio Gama Pinto Rd., Of Waiyaki Way, Westlands Dist. Nairobi, PO Box 2829- 00606",
      };
    }

    const companyNatureOfBusiness = this.sanitizeRichText(
      company?.details?.businessProcesses ?? null
    );
    const companyScopeCoverDesired = await this.buildCompanyScopeCoverDesired(
      policyCoverMaps,
      policyDisplayName,
      unmatchedPolicyCoverIds
    );

    return {
      PolicySection: {
        heading: null,
        subHeading: null,
        dataType: "table",
        underline: "No",
        bold: "No",
        tableType: "left-right",
        sectionData: [
          {
            "OUR REF NO": referenceNumber,
            DATED: currentDate,
            "REFERED BY": referredBy,
            CONTACT: contactName ?? null,
          },
        ],
      },
      InsurerDetails: {
        heading: null,
        subHeading: null,
        dataType: "text",
        underline: "Yes",
        bold: "No",
        tableType: null,
        sectionData: [
          {
            "Insurer Name": primaryPlacementInsurer?.insurer?.insurerName
              ? `M/s. ${primaryPlacementInsurer?.insurer?.insurerName}`
              : null,
            Address: this.buildAddressLine(
              primaryPlacementInsurer?.branchAddress ?? null
            ),
            "City with Pincode": this.buildCityWithPincode(
              primaryPlacementInsurer?.locationAddress ?? null
            ),
          },
        ],
      },
      PolicyDetails: {
        heading: null,
        subHeading: null,
        dataType: "table",
        underline: "No",
        bold: "No",
        tableType: "up-down",
        sectionData: [
          {
            "Policy Name": policyDisplayNameWithoutSanitization,
            "Risk Inception Date": placementPolicyFromDate,
            "Sum Insured": this.formatCurrency(
              policy.sumInsured,
              organisationName
            ),
            Premium: this.formatCurrency(
              policy.premiumAtInception,
              organisationName
            ),
          },
        ],
      },
      IsgDetails: {
        heading: null,
        subHeading: null,
        dataType: "text",
        underline: "No",
        bold: "No",
        tableType: null,
        sectionData: [
          {
            IsgManagerName: managerName,
            IsgManagerEmail: managerUser?.emailId ?? null,
            IsgManagerContactNo: DEFAULT_CONTACT_NUMBER,
            IsgManagerPhoneNo: managerUser?.mobile ?? null,
            IsgExecutiveName: executiveName,
            IsgExecutiveEmail: executiveUser?.emailId ?? null,
            IsgExecutiveContactNo: DEFAULT_CONTACT_NUMBER,
            IsgExecutivePhoneNo: executiveUser?.mobile ?? null,
            PolicyType: policyHeadingName,
            PolicyName: policyDisplayName,
            DocumentDated: documentDated,
            DiscussionDated: discussionDated,
            PolicyTypeId: policyTypeId,
          },
        ],
      },
      CompanyPolicyDetails: {
        heading: this.buildCompanyPolicyHeading(companyName, policyHeadingName),
        subHeading: "POLICY DETAILS",
        dataType: "table",
        underline: "Yes",
        bold: "Yes",
        tableType: "left-right",
        sectionData: [
          {
            "Company Name": companyName,
            "Nature of Business": companyNatureOfBusiness,
            "Policy Inception": policyInception,
            "Policy Expiry": policyExpiry,
            "Ins Co ": insurerSummary,
            "Sum Insured": this.formatCurrency(
              policy.sumInsured,
              organisationName
            ),
            Premium: premiumSection,
            "Payment Details": paymentDetails,
            "Co Insurance": coInsuranceSection,
          },
        ],
      },
      CompanyRiskDetails: {
        heading: null,
        subHeading: "RISK DETAILS",
        dataType: "table",
        underline: "Yes",
        bold: "Yes",
        tableType: "left-right",
        sectionData: [
          {
            ["RISK DETAILS"]: riskSection,
          },
        ],
      },
      CompanyScopeCoverDesired: companyScopeCoverDesired,
      CompanyOtherDetails: companyOtherDetails,
      CompanyPremiumAndBrokerage: companyPremiumAndBrokerage,
      CompanyWarranties: companyWarranties,
      CompanyIndiaIsure: companyIndiaInsure,
      CompanyInsuranceCompany: companyInsuranceCompany,
      FooterSection: footerSection,
    };
  }

  private async findPolicyCovers(policy: Policy): Promise<{
    covers: PlacementSlipCover[];
    unmatchedCoverIds: Set<number>;
  }> {
    const unmatchedCoverIds = new Set<number>();
    const opportunityId =
      policy.opportunityId ?? policy.opportunity?.id ?? null;

    if (!opportunityId) {
      return { covers: [], unmatchedCoverIds };
    }

    const [allOpportunityCovers, placementSlipCoverDetails] = await Promise.all([
      this.opportunityCoverMapRepository.find({
        where: { opportunityId },
        order: { displaySequence: "ASC" },
      }),
      this.opportunityPlacementSlipCoverDetailRepository.find({
        where: { opportunityId },
        order: { id: "ASC" },
      }),
    ]);

    // Placement slip / policy export = post-PSG mirror: drop covers cut off
    // before Placement Slip.
    const opportunityCovers = filterCoversByActivity(
      allOpportunityCovers,
      ACTIVITY_KEY.PLACEMENT_SLIP_GENERATION_ACTIVITY
    );

    if (opportunityCovers.length === 0) {
      return { covers: [], unmatchedCoverIds };
    }

    const templateSectionMap = await this.buildTemplateSectionMap(
      opportunityCovers,
      policy.policyTypeLid
    );

    const detailLookup = new Map<number, OpportunityPlacementSlipCoverDetail>();

    placementSlipCoverDetails.forEach((detail) => {
      const existing = detailLookup.get(detail.coverTemplateId);

      if (!existing) {
        detailLookup.set(detail.coverTemplateId, detail);
        return;
      }

      const existingUpdatedAt = existing.updatedAt
        ? new Date(existing.updatedAt).getTime()
        : 0;
      const candidateUpdatedAt = detail.updatedAt
        ? new Date(detail.updatedAt).getTime()
        : 0;

      if (candidateUpdatedAt > existingUpdatedAt) {
        detailLookup.set(detail.coverTemplateId, detail);
      }
    });

    const resolvedCovers: PlacementSlipCover[] = opportunityCovers.map(
      (cover) => {
        const detail = detailLookup.get(cover.id) ?? null;
        const resolvedName =
          typeof detail?.coverName === "string" &&
          detail.coverName.trim().length > 0
            ? detail.coverName.trim()
            : typeof cover.coverName === "string" &&
              cover.coverName.trim().length > 0
            ? cover.coverName.trim()
            : null;
        const response = this.normalizeOpportunityCoverResponse(
          detail?.coverResponse ?? null
        );

        if (!detail || response === null) {
          unmatchedCoverIds.add(cover.id);
        }

        return {
          id: cover.id,
          coverName: resolvedName,
          coverResponse: response,
          coversMeta: detail?.coversMeta ?? cover.coversMeta ?? null,
          displaySequence:
            typeof cover.displaySequence === "number"
              ? cover.displaySequence
              : null,
          coverType:
            typeof cover.coverTypeLid === "number" ? cover.coverTypeLid : null,
          sectionId:
            typeof cover.sectionId === "number"
              ? cover.sectionId
              : this.resolveTemplateSectionId(cover, templateSectionMap),
        };
      }
    );

    resolvedCovers.sort((a, b) => {
      const sequenceA =
        typeof a.displaySequence === "number"
          ? a.displaySequence
          : Number.MAX_SAFE_INTEGER;
      const sequenceB =
        typeof b.displaySequence === "number"
          ? b.displaySequence
          : Number.MAX_SAFE_INTEGER;

      if (sequenceA !== sequenceB) {
        return sequenceA - sequenceB;
      }

      return a.id - b.id;
    });

    return { covers: resolvedCovers, unmatchedCoverIds };
  }

  private async buildTemplateSectionMap(
    opportunityCovers: OpportunityCoverMap[],
    policyTypeLid: number
  ): Promise<{
    byCoverAndSequence: Map<string, number>;
    byCoverId: Map<number, number>;
  }> {
    const byCoverAndSequence = new Map<string, number>();
    const byCoverId = new Map<number, number>();

    const coverIds = Array.from(
      new Set(
        opportunityCovers
          .map((cover) => cover.coverId)
          .filter((coverId): coverId is number => Number.isInteger(coverId))
      )
    );

    if (!coverIds.length || !Number.isInteger(policyTypeLid)) {
      return { byCoverAndSequence, byCoverId };
    }

    try {
      const templates: Array<{
        ref_cover_id: number;
        display_sequence: number | null;
        section_id: number | null;
      }> = await this.opportunityCoverMapRepository.manager.query(
        `
          SELECT
            mct.ref_cover_id,
            mct.display_sequence,
            mct.section_id
          FROM mstr_cover_template mct
          WHERE mct.policy_type_id = $1
            AND mct.ref_cover_id = ANY($2::int[])
        `,
        [policyTypeLid, coverIds]
      );

      templates.forEach((template) => {
        if (!Number.isInteger(template.ref_cover_id)) {
          return;
        }

        if (!Number.isInteger(template.section_id)) {
          return;
        }

        const sequence = Number.isInteger(template.display_sequence)
          ? template.display_sequence
          : null;

        if (sequence !== null) {
          byCoverAndSequence.set(
            `${template.ref_cover_id}:${sequence}`,
            template.section_id
          );
        }

        if (!byCoverId.has(template.ref_cover_id)) {
          byCoverId.set(template.ref_cover_id, template.section_id);
        }
      });
    } catch (error) {
      console.warn(
        "Failed to build cover section fallback from mstr_cover_template.",
        error
      );
    }

    return { byCoverAndSequence, byCoverId };
  }

  private resolveTemplateSectionId(
    cover: OpportunityCoverMap,
    sectionMap: {
      byCoverAndSequence: Map<string, number>;
      byCoverId: Map<number, number>;
    }
  ): number | null {
    const coverId = Number.isInteger(cover.coverId) ? cover.coverId : null;
    if (coverId === null) {
      return null;
    }

    const sequence = Number.isInteger(cover.displaySequence)
      ? cover.displaySequence
      : null;
    if (sequence !== null) {
      const mapped = sectionMap.byCoverAndSequence.get(
        `${coverId}:${sequence}`
      );
      if (Number.isInteger(mapped)) {
        return mapped;
      }
    }

    const mappedByCover = sectionMap.byCoverId.get(coverId);
    return Number.isInteger(mappedByCover) ? mappedByCover : null;
  }

  private normalizeOpportunityCoverResponse(
    value: string | null | undefined
  ): unknown {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== "string") {
      return value;
    }

    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed;
    }
  }

  async getOrganizationIdFromPolicy(policy: Policy): Promise<number | null> {
    if (!policy) {
      return null;
    }

    const userDetails = await this.userRepository.findOne({
      where: { userId: policy.ownerId },
    });

    const organization = userDetails?.organisationId ?? null;

    return organization;
  }

  async getOrgName(organizationId: number | null): Promise<string | null> {
    if (!organizationId) {
      return null;
    }

    const organization = await this.organisationRepository.findOne({
      where: { id: organizationId },
    });

    return organization?.organisationKey ?? null;
  }

  async getPolicyById(policyId: number) {
    try {
      if (policyId) {
        return await this.policyRepository.findOne({
          where: { id: policyId },
          relations: [
            "policyType",
            "company",
            "company.details",
            "company.companyAddresses",
            "company.companyAddresses.address",
            "opportunity",
          ],
        });
      }
      return null;
    } catch (error) {
      throw new Error(
        `Failed to retrieve policy with ID ${policyId}: ${
          (error as Error).message
        }`
      );
    }
  }

  private async findPolicy({
    policyId,
    opportunityId,
  }: {
    policyId?: number;
    opportunityId?: number;
  }): Promise<Policy | null> {
    if (policyId) {
      return await this.policyRepository.findOne({
        where: { id: policyId },
        relations: [
          "policyType",
          "company",
          "company.details",
          "company.companyAddresses",
          "company.companyAddresses.address",
          "opportunity",
        ],
      });
    }

    if (opportunityId) {
      return await this.policyRepository.findOne({
        where: { opportunityId },
        order: { id: "DESC" },
        relations: [
          "policyType",
          "company",
          "company.details",
          "company.companyAddresses",
          "company.companyAddresses.address",
          "opportunity",
        ],
      });
    }

    return null;
  }

  private async findPlacementSlipActivity(
    opportunityId?: number | null,
    roleKey?: string
  ) {
    if (!opportunityId) {
      return null;
    }

    const where: FindOptionsWhere<OpportunityActivityMap> = {
      opportunityId,
      activityKey: ACTIVITY_KEY.PLACEMENT_SLIP_GENERATION_ACTIVITY,
    };

    if (roleKey) {
      where.roleKey = roleKey;
    }

    return await this.opportunityActivityMapRepository.findOne({
      where,
      relations: ["owner"],
      order: { id: "ASC" },
    });
  }

  private async findDataValidationActivity(opportunityId: number) {
    return await this.opportunityActivityMapRepository.findOne({
      where: {
        opportunityId,
        activityKey: ACTIVITY_KEY.DATA_VALIDATION_ACTIVITY,
      },
      relations: ["owner", "owner.branch"],
      order: { id: "DESC" },
    });
  }

  private async findPlacementSlipExecutiveParticipant(
    opportunityId: number,
    opportunityActivityId: number
  ) {
    return await this.opportunityActivityParticipantsRepository.findOne({
      where: {
        opportunityId,
        activityId: PLACEMENT_SLIP_MASTER_ACTIVITY_ID,
        opportunityActivityId,
      },
      relations: ["participant"],
      order: { id: "ASC" },
    });
  }

  private async findPlacementSlipGeneration(opportunityActivityId: number) {
    return await this.opportunityPlacementSlipGenerationRepository.findOne({
      where: { opportunityActivityId },
      relations: ["cdDetails", "sharingDetails", "insurerMaps"],
      order: { id: "DESC" },
    });
  }

  private async buildCompanyOtherDetailsData(
    policyTypeId: number | null,
    placementSlipId: number | null
  ) {
    const defaultDetails = {
      DEDUCTIBLES: "NA",
      "BASIS OF SUM INSURED": "NA",
      "PANEL OF SURVEYORS": "NA",
      "S L A": "NA",
      "OTHER COMMITMENTS BY INS CO": "NA",
    };

    const isGmcPolicy = await this.isGmcPolicy(policyTypeId);

    if (!isGmcPolicy) {
      return { ...defaultDetails };
    }

    const tpaName = placementSlipId
      ? await this.getPlacementSlipTpaName(placementSlipId)
      : null;

    return {
      DEDUCTIBLES: "NA",
      "BASIS OF SUM INSURED": "NA",
      "SERVICE PROVIDER(TPA)": tpaName ?? "NA",
      "S L A": "NA",
      "OTHER COMMITMENTS BY INS CO": "NA",
    };
  }

  private async isGmcPolicy(policyTypeId: number | null) {
    if (policyTypeId == null) {
      return false;
    }

    const lookup = await this.lookUpRepository
      .createQueryBuilder("lookup")
      .where("lookup.id = :policyTypeId", { policyTypeId })
      .andWhere("lookup.lookup_key ILIKE :lookupKey", { lookupKey: `%GMC%` })
      .getOne();

    return Boolean(lookup);
  }

  private async getPlacementSlipTpaName(placementSlipId: number) {
    const tpaMaps = await this.opportunityPlacementSlipTpaMapRepository.find({
      where: { placementSlipId },
      order: { id: "ASC" },
    });

    if (tpaMaps.length === 0) {
      return null;
    }

    const tpaIds = Array.from(
      new Set(
        tpaMaps.map((map) => map.tpaId).filter((id): id is number => id != null)
      )
    );
    const tpaLocationIds = Array.from(
      new Set(
        tpaMaps
          .map((map) => map.tpaLocationId)
          .filter((locationId): locationId is number => locationId != null)
      )
    );

    const [tpas, cities] = await Promise.all([
      tpaIds.length
        ? this.tpaRepository.find({
            where: { id: In(tpaIds) },
          })
        : Promise.resolve([]),
      tpaLocationIds.length
        ? this.cityRepository.find({
            where: { id: In(tpaLocationIds) },
          })
        : Promise.resolve([]),
    ]);

    const tpaById = new Map(
      tpas
        .filter((tpa): tpa is Tpa & { id: number } => tpa.id != null)
        .map((tpa) => [tpa.id, tpa])
    );
    const cityById = new Map(
      cities
        .filter((city): city is City & { id: number } => city.id != null)
        .map((city) => [city.id, city])
    );

    const tpaNames = tpaMaps
      .map((map) => {
        const tpaName = tpaById.get(map.tpaId)?.tpaName ?? null;
        const cityName = cityById.get(map.tpaLocationId)?.name ?? null;

        if (tpaName && cityName) {
          return `${tpaName} - ${cityName}`;
        }

        return tpaName ?? cityName;
      })
      .filter((name): name is string => Boolean(name));

    if (tpaNames.length === 0) {
      return null;
    }

    return tpaNames.join(", ");
  }

  private async getActivityApproverDetails(opportunityActivityId: number) {
    try {
      const taskTypeApproval = (
        await this.lookUpRepository.findOne({
          where: { lookUpKey: TASK_TYPE.APPROVAL },
        })
      )?.id;
      const tasks = await this.taskRepository.find({
        where: {
          activityId: opportunityActivityId,
          taskTypeLid: taskTypeApproval ?? undefined,
        },
        order: { createdAt: "DESC" },
        relations: ["assignee"],
      });
      const task = tasks[0] ?? null;
      if (!task) {
        return null;
      }

      const approverId = task.taskClose
        ? task.updatedBy
        : task.assignee?.userId;

      if (!approverId) {
        return null;
      }

      const approver = await this.userRepository.findOne({
        where: { userId: approverId },
      });

      if (!approver) {
        return null;
      }

      let statusDetails: {
        approvedOn: string | null;
        approvedTime: string | null;
      } = {
        approvedOn: null,
        approvedTime: null,
      };

      if (task.taskClose && task.updatedAt) {
        const { date, time } = extractDateAndTime(
          convertUtcToIst(task.updatedAt)
        );
        statusDetails = {
          approvedOn: date,
          approvedTime: time,
        };
      }

      return {
        id: approver.userId,
        name: this.formatFullName(approver) ?? approver.firstName,
        status: statusDetails,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch approval task details: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  private async findLatestFinalNegotiation(opportunityId: number) {
    return await this.opportunityFinalNegotiationRepository.findOne({
      where: { opportunityId },
      relations: ["meeting"],
      order: { updatedAt: "DESC", id: "DESC" },
    });
  }

  private async findLatestQuoteEntry(opportunityId: number) {
    return await this.opportunityQuoteEntryRepository.findOne({
      where: { opportunityId },
      order: { quoteReceivedOn: "DESC", id: "DESC" },
    });
  }

  // private async findPolicyCautionDeposit(policyId: number) {
  //   return await this.cautionDepositPolicyMappingRepository.findOne({
  //     where: { policyId },
  //     relations: ["cautionDeposit"],
  //     order: { id: "ASC" },
  //   });
  // }

  private getPrimaryCompanyAddress(company: Company | null): Address | null {
    const companyAddresses = (company?.companyAddresses ??
      []) as CompanyAddress[];

    if (!companyAddresses || companyAddresses.length === 0) {
      return null;
    }

    const sortedAddresses = [...companyAddresses]
      .filter((companyAddress) => !!companyAddress?.address)
      .sort((a, b) => {
        const primaryDiff =
          Number(b?.isPrimary ?? false) - Number(a?.isPrimary ?? false);

        if (primaryDiff !== 0) {
          return primaryDiff;
        }

        const aId = a?.id ?? Number.MAX_SAFE_INTEGER;
        const bId = b?.id ?? Number.MAX_SAFE_INTEGER;

        return aId - bId;
      });

    const primaryCompanyAddress = sortedAddresses[0];

    return (primaryCompanyAddress?.address as Address | undefined) ?? null;
  }

  private getPrimaryCdDetail(
    placementSlip: OpportunityPlacementSlipGeneration | null
  ): OpportunityPlacementSlipCDDetail | null {
    const cdDetails = placementSlip?.cdDetails;

    if (!cdDetails || cdDetails.length === 0) {
      return null;
    }

    const sortedDetails = [...cdDetails].sort((a, b) => a.id - b.id);

    return sortedDetails[0] ?? null;
  }

  private getPolicyDisplayName(policy: Policy): string | null {
    const rawName =
      policy.policyName ??
      policy.policyType?.lookUpValue ??
      (typeof policy.policyTypeLid === "number"
        ? policy.policyTypeLid.toString()
        : null);

    return this.sanitizePolicyName(rawName);
  }

  private getPolicyDisplayNameWithoutSanitization(
    policy: Policy
  ): string | null {
    const rawName =
      policy.policyName ??
      policy.policyType?.lookUpValue ??
      (typeof policy.policyTypeLid === "number"
        ? policy.policyTypeLid.toString()
        : null);

    return rawName;
  }

  private sanitizePolicyName(name: string | null): string | null {
    if (!name) {
      return null;
    }

    const cleaned = name
      .replace(/\bpolicy\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    if (cleaned.length === 0) {
      return null;
    }

    return cleaned;
  }

  private buildCompanyPolicyHeading(
    companyName: string | null,
    policyName: string | null
  ): string | null {
    if (!companyName && !policyName) {
      return null;
    }

    if (companyName && policyName) {
      return `PLACEMENT SLIP FOR ${companyName} (${policyName}) POLICY.`;
    }

    if (companyName) {
      return `PLACEMENT SLIP FOR ${companyName} POLICY.`;
    }

    return `PLACEMENT SLIP FOR (${policyName}) POLICY.`;
  }

  private buildPlacementInsurerSummary(
    insurer: ResolvedPlacementInsurer | null
  ): string | null {
    if (!insurer) {
      return null;
    }

    const parts = [
      insurer.insurer?.insurerName ?? null,
      this.buildAddressLine(insurer.branchAddress),
      this.buildCityWithPincode(insurer.locationAddress) ??
        this.buildCityLine(insurer.branchAddress),
    ].filter((part) => !!part && part.trim().length > 0);

    if (parts.length === 0) {
      return null;
    }

    return parts.join("\n");
  }

  private buildCoInsuranceSection(
    insurers: ResolvedPlacementInsurer[],
    sharingDetails: OpportunityPlacementSlipSharingDetail[] | null,
    placementSlip: OpportunityPlacementSlipGeneration | null,
    netPremiumAmount: number | null | undefined,
    policyPlacedTypeIds: PolicyPlacedTypeIds | null,
    organisationName?: string | null
  ) {
    if (!insurers || insurers.length === 0) {
      return [];
    }

    const isSinglePlacement = this.isSingleInsurerPlacement(
      placementSlip,
      insurers.length,
      policyPlacedTypeIds
    );

    return insurers.map((resolvedInsurer) => {
      const isLead =
        isSinglePlacement ||
        this.isLeadPlacementInsurer(resolvedInsurer, placementSlip);
      const share = this.resolvePlacementSharePercentage(
        resolvedInsurer,
        sharingDetails,
        isSinglePlacement
      );
      const premiumShare = this.resolvePlacementShareAmount(
        resolvedInsurer,
        sharingDetails,
        netPremiumAmount,
        isSinglePlacement
      );

      return {
        INSURER: this.buildPlacementInsurerDisplay(resolvedInsurer, isLead),
        "PREMIUM SHARE": this.formatPercentage(share),
        PREMIUM: this.formatCurrency(premiumShare, organisationName),
      };
    });
  }

  private buildPremiumAndBrokerageSection(
    insurers: ResolvedPlacementInsurer[],
    sharingDetails: OpportunityPlacementSlipSharingDetail[] | null,
    placementSlip: OpportunityPlacementSlipGeneration | null,
    policyPlacedTypeIds: PolicyPlacedTypeIds | null,
    organisationName?: string | null
  ) {
    if (!insurers || insurers.length === 0) {
      return [];
    }

    const isSinglePlacement = this.isSingleInsurerPlacement(
      placementSlip,
      insurers.length,
      policyPlacedTypeIds
    );

    return insurers.map((resolvedInsurer) => {
      const isLead =
        isSinglePlacement ||
        this.isLeadPlacementInsurer(resolvedInsurer, placementSlip);

      const shareRecord = this.findPlacementShareDetail(
        resolvedInsurer,
        sharingDetails
      );

      const netPremium = isSinglePlacement
        ? (placementSlip?.netPremium ?? null)
        : (shareRecord?.shareAmount ?? null);

      const brokeragePercentage = isSinglePlacement
        ? (Number(placementSlip?.basicBrokeragePercentage ?? 0) +
            Number(placementSlip?.terrorismBrokeragePercentage ?? 0))
        : (Number(shareRecord?.brokeragePercentage ?? 0) +
            Number(shareRecord?.terrorismBrokeragePercentage ?? 0));

      const brokerageAmount = isSinglePlacement
        ? (placementSlip?.totalBrokerageAmount ?? null)
        : (shareRecord?.totalBrokerageAmount ?? null);

      return {
        "Insurer Name": this.buildPlacementInsurerDisplay(
          resolvedInsurer,
          isLead
        ),
        "Net Premium": this.formatCurrency(netPremium, organisationName),
        Brokerage: this.formatPercentage(brokeragePercentage),
        "Brokerage Amount": this.formatCurrency(
          brokerageAmount,
          organisationName
        ),
      };
    });
  }

  private async resolvePlacementSlipInsurers(
    placementSlip: OpportunityPlacementSlipGeneration | null
  ): Promise<ResolvedPlacementInsurer[]> {
    if (!placementSlip) {
      return [];
    }

    const existingMaps =
      placementSlip.insurerMaps && placementSlip.insurerMaps.length > 0
        ? placementSlip.insurerMaps
        : await this.opportunityPlacementSlipInsurerMapRepository.find({
            where: { placementSlipId: placementSlip.id },
            order: { id: "ASC" },
          });

    if (!existingMaps || existingMaps.length === 0) {
      return [];
    }

    const sortedMaps = [...existingMaps].sort((a, b) => a.id - b.id);

    const insurerIds = Array.from(
      new Set(
        sortedMaps
          .map((map) => map.insurerId)
          .filter((id): id is number => typeof id === "number")
      )
    );
    const branchAddressIds = Array.from(
      new Set(
        sortedMaps
          .map((map) => map.insurerBranchId)
          .filter((id): id is number => typeof id === "number")
      )
    );
    const cityIds = Array.from(
      new Set(
        sortedMaps
          .map((map) => map.insurerLocationId)
          .filter((id): id is number => typeof id === "number")
      )
    );

    const [insurers, branchAddresses, cities] = await Promise.all([
      insurerIds.length
        ? this.insurerRepository.find({ where: { id: In(insurerIds) } })
        : Promise.resolve([] as Insurer[]),
      branchAddressIds.length
        ? this.addressRepository.find({
            where: { id: In(branchAddressIds) },
            relations: ["cityId"],
          })
        : Promise.resolve([] as Address[]),
      cityIds.length
        ? this.cityRepository.find({ where: { id: In(cityIds) } })
        : Promise.resolve([] as City[]),
    ]);

    const insurerLookup = new Map(insurers.map((item) => [item.id, item]));
    const branchAddressLookup = new Map(
      branchAddresses
        .filter((address) => typeof address.id === "number")
        .map((address) => [address.id as number, address] as const)
    );
    const cityLookup = new Map(
      cities
        .filter((city) => typeof city.id === "number")
        .map((city) => [city.id as number, city] as const)
    );

    return sortedMaps.map((map) => ({
      map,
      insurer: insurerLookup.get(map.insurerId) ?? null,
      locationAddress: this.buildLocationAddressSummary(
        cityLookup.get(map.insurerLocationId) ?? null,
        branchAddressLookup.get(map.insurerBranchId) ?? null
      ),
      branchAddress: branchAddressLookup.get(map.insurerBranchId) ?? null,
    }));
  }

  private buildLocationAddressSummary(
    city: City | null,
    branchAddress: Address | null
  ): LocationAddressSummary | null {
    const cityName = city?.name ?? null;
    const pinCode = branchAddress?.pinCode ?? null;

    if (!cityName && !pinCode) {
      return null;
    }

    return {
      cityName,
      pinCode,
    };
  }

  private selectPrimaryPlacementInsurer(
    insurers: ResolvedPlacementInsurer[],
    placementSlip: OpportunityPlacementSlipGeneration | null,
    policyPlacedTypeIds: PolicyPlacedTypeIds | null
  ): ResolvedPlacementInsurer | null {
    if (!insurers || insurers.length === 0) {
      return null;
    }

    if (
      this.isSingleInsurerPlacement(
        placementSlip,
        insurers.length,
        policyPlacedTypeIds
      )
    ) {
      return insurers[0];
    }

    const leadId = placementSlip?.leadInsurerId ?? null;

    if (leadId) {
      const leadInsurer = insurers.find(
        (insurer) => insurer.map.insurerId === leadId
      );

      if (leadInsurer) {
        return leadInsurer;
      }
    }

    const flaggedLead = insurers.find(
      (insurer) => Number(insurer.map.isLeadInsurer ?? 0) === 1
    );

    return flaggedLead ?? insurers[0];
  }

  private isSingleInsurerPlacement(
    placementSlip: OpportunityPlacementSlipGeneration | null,
    totalInsurers: number,
    policyPlacedTypeIds: PolicyPlacedTypeIds | null
  ): boolean {
    if (totalInsurers <= 1) {
      return true;
    }

    const placementType = placementSlip?.policyPlacedTypeLid ?? null;

    if (placementType && placementType === policyPlacedTypeIds?.SINGLE) {
      return true;
    }

    if (placementType && placementType === policyPlacedTypeIds?.MULTIPLE) {
      return false;
    }

    return totalInsurers === 1;
  }

  private async getPolicyPlacedTypeIds(): Promise<PolicyPlacedTypeIds> {
    if (this.policyPlacedTypeCache) {
      return this.policyPlacedTypeCache;
    }

    if (!this.policyPlacedTypePromise) {
      this.policyPlacedTypePromise = this.lookUpRepository
        .find({
          where: {
            lookUpName: "POLICY_PLACED_TYPE",
            lookUpKey: In(["MULTIPLE_INSURER", "SINGLE_INSURER"]),
          },
        })
        .then((lookups) => {
          const resolved: PolicyPlacedTypeIds = {
            MULTIPLE: null,
            SINGLE: null,
          };

          for (const lookup of lookups) {
            if (lookup.lookUpKey === "MULTIPLE_INSURER") {
              resolved.MULTIPLE = Number(lookup.id);
            } else if (lookup.lookUpKey === "SINGLE_INSURER") {
              resolved.SINGLE = Number(lookup.id);
            }
          }

          this.policyPlacedTypeCache = resolved;
          this.policyPlacedTypePromise = null;

          return resolved;
        })
        .catch((error) => {
          this.policyPlacedTypePromise = null;

          throw error;
        });
    }

    return this.policyPlacedTypePromise;
  }

  private isLeadPlacementInsurer(
    insurer: ResolvedPlacementInsurer,
    placementSlip: OpportunityPlacementSlipGeneration | null
  ): boolean {
    if (!insurer) {
      return false;
    }

    if (
      placementSlip?.leadInsurerId &&
      insurer.map.insurerId === placementSlip.leadInsurerId
    ) {
      return true;
    }

    return Number(insurer.map.isLeadInsurer ?? 0) === 1;
  }

  private resolvePlacementSharePercentage(
    insurer: ResolvedPlacementInsurer,
    sharingDetails: OpportunityPlacementSlipSharingDetail[] | null,
    isSinglePlacement: boolean
  ): number | null {
    if (isSinglePlacement) {
      return 100;
    }

    const shareRecord = this.findPlacementShareDetail(insurer, sharingDetails);

    if (
      shareRecord &&
      shareRecord.sharePercentage !== undefined &&
      shareRecord.sharePercentage !== null
    ) {
      return Number(shareRecord.sharePercentage);
    }

    return null;
  }

  private resolvePlacementShareAmount(
    insurer: ResolvedPlacementInsurer,
    sharingDetails: OpportunityPlacementSlipSharingDetail[] | null,
    netPremiumAmount: number | null | undefined,
    isSinglePlacement: boolean
  ): number | null {
    if (isSinglePlacement) {
      return netPremiumAmount ?? null;
    }

    const shareRecord = this.findPlacementShareDetail(insurer, sharingDetails);

    if (
      shareRecord &&
      shareRecord.shareAmount !== undefined &&
      shareRecord.shareAmount !== null
    ) {
      const numericShareAmount = Number(shareRecord.shareAmount);

      return Number.isNaN(numericShareAmount) ? null : numericShareAmount;
    }

    if (
      shareRecord &&
      shareRecord.sharePercentage !== undefined &&
      shareRecord.sharePercentage !== null &&
      netPremiumAmount !== undefined &&
      netPremiumAmount !== null
    ) {
      const numericSharePercentage = Number(shareRecord.sharePercentage);
      const numericNetPremium = Number(netPremiumAmount);

      if (
        !Number.isNaN(numericSharePercentage) &&
        !Number.isNaN(numericNetPremium)
      ) {
        const result = (numericSharePercentage / 100) * numericNetPremium;
        return parseFloat(result.toFixed(2));
      }
    }

    return null;
  }

  private findPlacementShareDetail(
    insurer: ResolvedPlacementInsurer,
    sharingDetails: OpportunityPlacementSlipSharingDetail[] | null
  ): OpportunityPlacementSlipSharingDetail | null {
    if (!sharingDetails || sharingDetails.length === 0) {
      return null;
    }

    return (
      sharingDetails.find(
        (detail) => detail.insurerId === insurer.map.insurerId
      ) ?? null
    );
  }

  private buildPlacementInsurerDisplay(
    insurer: ResolvedPlacementInsurer,
    isLead: boolean
  ): string | null {
    const name = insurer.insurer?.insurerName ?? null;
    const city = this.getAddressCityName(insurer.branchAddress);
    const parts = [name, city].filter(
      (part) => !!part && part.trim().length > 0
    );

    if (parts.length === 0) {
      return null;
    }

    const suffix = isLead ? "Lead" : "Co";

    return `${parts.join(", ")} (${suffix})`;
  }

  private async buildCompanyScopeCoverDesired(
    coverMaps: PlacementSlipCover[] | null,
    _policyName: string | null,
    _unmatchedCoverIds?: Set<number>
  ) {
    // Terms & Conditions is shown under "ANY OTHER COVERS", so keep it out of
    // Basic Details / section tables to avoid duplication.
    const allCovers = (coverMaps ?? []).filter(
      (cover) =>
        this.normalizeIlike(cover.coverName ?? "") !== "terms and conditions"
    );
    const sectionedCovers = allCovers.filter((cover) =>
      Number.isInteger(cover.sectionId)
    );
    const unsectionedCovers = allCovers.filter(
      (cover) => !Number.isInteger(cover.sectionId)
    );
    const hasSectionedCovers = sectionedCovers.length > 0;
    const scopeRows: Record<string, unknown> = {};

    if (!hasSectionedCovers) {
      scopeRows["Basic Details"] = this.buildPolicyCoversTable(allCovers);
    } else {
      const sectionNameById = await this.resolveSectionNames(sectionedCovers);
      const runs: Array<{
        type: "basic" | "section";
        sectionId: number | null;
        covers: PlacementSlipCover[];
      }> = [];

      allCovers.forEach((cover) => {
        const sectionId =
          typeof cover.sectionId === "number" ? cover.sectionId : null;
        const type = sectionId === null ? "basic" : "section";
        const previousRun = runs[runs.length - 1];

        if (
          !previousRun ||
          previousRun.type !== type ||
          previousRun.sectionId !== sectionId
        ) {
          runs.push({
            type,
            sectionId,
            covers: [cover],
          });
          return;
        }

        previousRun.covers.push(cover);
      });

      const sectionRenderCount = new Map<number, number>();
      let basicRenderCount = 0;

      runs.forEach((run) => {
        if (run.type === "basic") {
          if (!run.covers.length) {
            return;
          }

          basicRenderCount += 1;
          const key =
            basicRenderCount === 1
              ? "Basic Details"
              : `Basic Details (Contd. ${basicRenderCount - 1})`;
          scopeRows[key] = this.buildPolicyCoversTable(run.covers);
          return;
        }

        if (!run.sectionId || !run.covers.length) {
          return;
        }

        const currentCount = sectionRenderCount.get(run.sectionId) ?? 0;
        const nextCount = currentCount + 1;
        sectionRenderCount.set(run.sectionId, nextCount);

        const baseName =
          sectionNameById.get(run.sectionId) ?? `SECTION ${run.sectionId}`;
        const key =
          nextCount === 1 ? baseName : `${baseName} (Contd. ${nextCount - 1})`;

        scopeRows[key] = this.buildPolicyCoversTable(run.covers);
      });

      if (Object.keys(scopeRows).length === 0) {
        scopeRows["Basic Details"] = this.buildPolicyCoversTable(
          unsectionedCovers.length > 0 ? unsectionedCovers : allCovers
        );
      }
    }

    const wordingsValue =
      this.resolveCoverValue(coverMaps, ["WORDINGS"]) ?? "NA";
    const anyOtherCoversTable = this.buildNamedCoverTable(
      coverMaps,
      [
        {
          label: "Terms and Conditions",
          searchTerms: ["Terms and Conditions"],
        },
      ],
      "N/A"
    );

    return {
      heading: null,
      subHeading: "SCOPE OF COVER DESIRED",
      dataType: "table",
      underline: "Yes",
      bold: "Yes",
      tableType: "left-right",
      sectionData: [
        {
          ...scopeRows,
          WORDINGS: wordingsValue,
          "ANY OTHER COVERS": anyOtherCoversTable,
        },
      ],
    };
  }

  private async resolveSectionNames(
    sectionedCovers: PlacementSlipCover[]
  ): Promise<Map<number, string>> {
    if (!sectionedCovers.length) {
      return new Map<number, string>();
    }

    const sectionIds = Array.from(
      new Set(
        sectionedCovers
          .map((cover) => cover.sectionId)
          .filter(
            (sectionId): sectionId is number => typeof sectionId === "number"
          )
      )
    );

    if (!sectionIds.length) {
      return new Map<number, string>();
    }

    const sectionNameById = new Map<number, string>();

    try {
      const sections: Array<{ id: number; name: string }> =
        await this.opportunityCoverMapRepository.manager.query(
          `
            SELECT id, name
            FROM mstr_cover_section
            WHERE id = ANY($1::int[])
          `,
          [sectionIds]
        );

      sections.forEach((section) => {
        if (Number.isInteger(section.id)) {
          sectionNameById.set(section.id, section.name);
        }
      });
    } catch (error) {
      console.warn(
        "Failed to fetch cover sections while building placement slip payload.",
        error
      );
    }
    return sectionNameById;
  }

  private buildPolicyCoversTable(
    coverMaps: PlacementSlipCover[] | null
  ): CoverSectionTable {
    const sectionData = (coverMaps ?? [])
      .filter(
        (cover) =>
          typeof cover.coverName === "string" &&
          cover.coverName.trim().length > 0
      )
      .map((cover) => {
        const name = (cover.coverName ?? "").trim();

        return {
          Description: name,
          Remarks: this.getCoverDisplayValue(cover) ?? "N/A",
        };
      });

    return {
      dataType: "table",
      tableType: "up-down",
      sectionData:
        sectionData.length > 0
          ? sectionData
          : [
              {
                Description: "",
                Remarks: "N/A",
              },
            ],
    };
  }

  private buildNamedCoverTable(
    coverMaps: PlacementSlipCover[] | null,
    lookups: Array<{ label: string; searchTerms: string[] }>,
    emptyValue: string
  ) {
    const sectionData = lookups.map((lookup) => ({
      Description: lookup.label,
      Remarks:
        this.resolveCoverValue(coverMaps, lookup.searchTerms) ?? emptyValue,
    }));

    return {
      dataType: "table",
      tableType: "up-down",
      sectionData,
    };
  }

  private resolveCoverValue(
    coverMaps: PlacementSlipCover[] | null,
    searchTerms: string[]
  ): string | null {
    if (!coverMaps || coverMaps.length === 0) {
      return null;
    }

    const normalizedTerms = searchTerms
      .map((term) => this.normalizeIlike(term))
      .filter((term) => term.length > 0);

    if (normalizedTerms.length === 0) {
      return null;
    }

    for (const cover of coverMaps) {
      if (!cover.coverName) {
        continue;
      }

      const normalizedCoverName = this.normalizeIlike(cover.coverName);

      if (!normalizedCoverName) {
        continue;
      }

      const hasMatch = normalizedTerms.some((term) =>
        this.isIlikeMatch(normalizedCoverName, term)
      );

      if (!hasMatch) {
        continue;
      }

      const coverValue = this.getCoverDisplayValue(cover);

      if (coverValue) {
        return coverValue;
      }
    }

    return null;
  }

  private normalizeIlike(value: string): string {
    return value
      .normalize("NFKC")
      .replace(/&/g, " and ")
      .replace(/[^a-zA-Z0-9]+/g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  }

  private isIlikeMatch(source: string, target: string): boolean {
    if (!source || !target) {
      return false;
    }

    return source.includes(target) || target.includes(source);
  }

  private getCoverDisplayValue(cover: PlacementSlipCover): string | null {
    const formattedResponse = this.formatCoverResponseValue(
      cover.coverResponse
    );

    if (formattedResponse) {
      return formattedResponse;
    }

    if (cover.coversMeta) {
      const meta = cover.coversMeta as Record<string, unknown>;
      const metaCandidate =
        "value" in meta
          ? meta.value
          : "response" in meta
          ? meta.response
          : meta;
      const formattedMeta = this.formatCoverResponseValue(metaCandidate);

      if (formattedMeta) {
        return formattedMeta;
      }
    }

    return null;
  }

  private formatCoverResponseValue(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();

      return trimmed.length > 0 ? trimmed : null;
    }

    if (typeof value === "number" || typeof value === "bigint") {
      return value.toString();
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    if (Array.isArray(value)) {
      const parts = value
        .map((item) => this.formatCoverResponseValue(item))
        .filter((part): part is string => !!part);

      if (parts.length === 0) {
        return null;
      }

      return parts.join(", ");
    }

    if (typeof value === "object") {
      const record = value as Record<string, unknown>;

      if ("value" in record) {
        return this.formatCoverResponseValue(record.value);
      }

      if ("label" in record) {
        return this.formatCoverResponseValue(record.label);
      }

      if ("name" in record) {
        return this.formatCoverResponseValue(record.name);
      }

      const entries = Object.entries(record)
        .map(([key, entryValue]) => {
          const formatted = this.formatCoverResponseValue(entryValue);

          if (!formatted) {
            return null;
          }

          const shouldIncludeKey =
            typeof entryValue !== "object" || entryValue === null;

          return shouldIncludeKey ? `${key}: ${formatted}` : formatted;
        })
        .filter((part): part is string => !!part);

      if (entries.length === 0) {
        return null;
      }

      return entries.join(", ");
    }

    return String(value);
  }

  private sanitizeRichText(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== "string") {
      const stringValue = String(value).trim();

      return stringValue.length > 0 ? stringValue : null;
    }

    const replacedBreaks = value
      .replace(/<\s*br\s*\/?>/gi, " ")
      .replace(/<\/?\s*p[^>]*>/gi, " ");
    const withoutTags = replacedBreaks.replace(/<[^>]*>/g, " ");
    const decoded = withoutTags
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"');
    const normalized = decoded.replace(/\s+/g, " ").trim();

    return normalized.length > 0 ? normalized : null;
  }

  private formatPercentage(value?: number | null): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return null;
    }

    const formatted = Number.isInteger(numericValue)
      ? numericValue.toString()
      : numericValue
          .toFixed(2)
          .replace(/\.0+$/, "")
          .replace(/(\.\d*[1-9])0+$/, "$1");

    return `${formatted} %`;
  }

  private buildAddressLine(address: Address | null): string | null {
    if (!address) {
      return null;
    }

    const addressParts = [
      address.address1,
      address.address2,
      address.area,
    ].filter((part) => !!part);

    if (addressParts.length === 0) {
      return null;
    }

    return addressParts.join(", ");
  }

  private buildCityLine(address: Address | null): string | null {
    if (!address) {
      return null;
    }

    const cityName = (address.cityId as { name?: string } | undefined)?.name;
    const pinCode = address.pinCode ?? null;

    if (!cityName && !pinCode) {
      return null;
    }

    if (cityName && pinCode) {
      return `${cityName} - ${pinCode}`;
    }

    return cityName ?? pinCode;
  }

  private buildCityWithPincode(
    location: LocationAddressSummary | null
  ): string | null {
    if (!location) {
      return null;
    }

    const cityName = location.cityName;
    const pinCode = location.pinCode;

    if (!cityName && !pinCode) {
      return null;
    }

    if (cityName && pinCode) {
      return `${cityName}-${pinCode}`;
    }

    return cityName ?? pinCode;
  }

  private buildCompanyRiskAddressLine(address: Address | null): string | null {
    if (!address) {
      return null;
    }

    const parts = [address.address1, address.address2]
      .map((part) => (typeof part === "string" ? part.trim() : ""))
      .filter((part) => part.length > 0);

    if (parts.length === 0) {
      return null;
    }

    return parts.join(", ");
  }

  private getAddressCityName(address: Address | null): string | null {
    if (!address) {
      return null;
    }

    const city = address.cityId as { name?: string } | undefined;

    return city?.name ?? null;
  }

  private buildPremiumSection(
    params: PremiumSectionBuilderParams
  ): PremiumSectionTable {
    const strategies: Record<string, PremiumSectionStrategy> = {
      iirm_srilanka: (strategyParams) =>
        this.buildSriLankaPremiumSection(strategyParams),
      DEFAULT: (strategyParams) =>
        this.buildDefaultPremiumSection(strategyParams),
    };

    const strategy =
      (params.organisationName && strategies[params.organisationName]) ??
      strategies.DEFAULT;

    return strategy(params);
  }

  private buildDefaultPremiumSection({
    organisationName,
    policy,
    placementSlip,
  }: PremiumSectionBuilderParams): PremiumSectionTable {
    return {
      dataType: "table",
      tableType: "left-right",
      sectionData: [
        {
          "Basic Premium": this.formatCurrency(
            policy.basicPremium,
            organisationName
          ),
          Terrorism: this.formatCurrency(
            policy.terrorismAmount,
            organisationName
          ),
          "SRCC Amount": this.formatCurrency(
            placementSlip?.srccAmount,
            organisationName
          ),
          "Admin Charges": this.formatCurrency(
            placementSlip?.adminCharges,
            organisationName
          ),
          Cess: this.formatCurrency(
            placementSlip?.cessAmount,
            organisationName
          ),
          "Policy Fee": this.formatCurrency(
            placementSlip?.fee,
            organisationName
          ),
          "Service Tax": this.formatCurrency(
            policy.gstAmount,
            organisationName
          ),
          "Net Premium": this.formatCurrency(
            policy.netPremium,
            organisationName
          ),
          "Gross Premium": this.formatCurrency(
            policy.grossPremium,
            organisationName
          ),
          "Basic Brokerage Percentage": this.formatPercentage(
            placementSlip?.basicBrokeragePercentage
          ),
          "Terrorism Brokerage Percentage": this.formatPercentage(
            placementSlip?.terrorismBrokeragePercentage
          ),
          "Basic Brokerage Amount": this.formatCurrency(
            placementSlip?.basicBrokerageAmount,
            organisationName
          ),
          "Terrorism Brokerage Amount": this.formatCurrency(
            placementSlip?.tcBrokerageAmount,
            organisationName
          ),
          "Total Brokerage Amount": this.formatCurrency(
            placementSlip?.totalBrokerageAmount,
            organisationName
          ),
        },
      ],
    };
  }

  private buildSriLankaPremiumSection({
    organisationName,
    policy,
    placementSlip,
  }: PremiumSectionBuilderParams): PremiumSectionTable {
    const getNumericValue = (value?: number | string | null): number => {
      if (value === null || value === undefined) {
        return 0;
      }

      const numericValue = Number(value);

      return Number.isNaN(numericValue) ? 0 : numericValue;
    };

    const basicPremium = getNumericValue(policy.basicPremium ?? 0);
    const srccPremium = getNumericValue(placementSlip?.srccAmount ?? 0);
    const tcPremium = getNumericValue(placementSlip?.terrorism ?? 0);
    const netPremium = basicPremium + srccPremium + tcPremium;

    const adminCharges = getNumericValue(placementSlip?.adminCharges ?? 0);
    const stampDuty = getNumericValue(placementSlip?.other ?? 0);
    const cess = getNumericValue(placementSlip?.cessAmount ?? 0);
    const vat = getNumericValue(placementSlip?.gstAmount ?? 0);
    const policyFee = getNumericValue(placementSlip?.fee ?? 0);
    const grossPremium =
      netPremium + adminCharges + stampDuty + cess + vat + policyFee;

    const basicBrokerageAmount = getNumericValue(
      placementSlip?.basicBrokerageAmount ?? 0
    );
    const srccBrokerageAmount = getNumericValue(
      placementSlip?.srccBrokerageAmount ?? 0
    );
    const tcBrokerageAmount = getNumericValue(
      placementSlip?.tcBrokerageAmount ?? 0
    );
    const totalBrokerage =
      basicBrokerageAmount + srccBrokerageAmount + tcBrokerageAmount;

    return {
      dataType: "table",
      tableType: "left-right",
      sectionData: [
        {
          "Basic Premium": this.formatCurrency(
            policy.basicPremium,
            organisationName
          ),
          "SRCC premium amount": this.formatCurrency(
            placementSlip?.srccAmount,
            organisationName
          ),
          "TC premium amount": this.formatCurrency(
            placementSlip?.terrorism,
            organisationName
          ),
          "Net premium": this.formatCurrency(netPremium, organisationName),
          "Admin Charges": this.formatCurrency(
            placementSlip?.adminCharges,
            organisationName
          ),
          "Stamp duty": this.formatCurrency(
            placementSlip?.other,
            organisationName
          ),
          Cess: this.formatCurrency(
            placementSlip?.cessAmount,
            organisationName
          ),
          "VAT %": this.formatPercentage(placementSlip?.gstPercentage),

          VAT: this.formatCurrency(placementSlip?.gstAmount, organisationName),
          "Policy Fee": this.formatCurrency(
            placementSlip?.fee,
            organisationName
          ),
          "Gross premium": this.formatCurrency(grossPremium, organisationName),
          "Basic brokerage percentage": this.formatPercentage(
            placementSlip?.basicBrokeragePercentage
          ),

          "SRCC brokerage percentage": this.formatPercentage(
            placementSlip?.srccPercentage
          ),
          "TC brokerage percentage": this.formatPercentage(
            placementSlip?.terrorismBrokeragePercentage
          ),
          "Basic brokerage amount": this.formatCurrency(
            placementSlip?.basicBrokerageAmount,
            organisationName
          ),
          "SRCC brokerage amount": this.formatCurrency(
            placementSlip?.srccBrokerageAmount,
            organisationName
          ),

          "TC brokerage amount": this.formatCurrency(
            placementSlip?.tcBrokerageAmount,
            organisationName
          ),
          "Total Brokerage": this.formatCurrency(
            totalBrokerage,
            organisationName
          ),
        },
      ],
    };
  }

  private formatCurrency(
    value?: number | string | null,
    organisationName?: string | null
  ): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return null;
    }

    const hasDecimal = !Number.isInteger(numericValue);

    const currencyPrefix =
      (organisationName && ORGANISATION_CURRENCY_PREFIXES[organisationName]) ??
      DEFAULT_CURRENCY_PREFIX;

    return `${currencyPrefix} ${numericValue.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: hasDecimal ? 2 : 0,
    })}`;
  }

  private formatDate(date?: Date | null): string | null {
    if (!date) {
      return null;
    }

    let dateObj: Date;

    if (typeof date === "string") {
      // Parse string to Date
      dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        throw new Error(`Invalid date string: ${date}`);
      }
    } else {
      dateObj = date;
    }

    const result = formatDateUtil(dateObj.toISOString(), "DD/MMM/YYYY");
    return result;
  }

  private formatFullName(user: User | null): string | null {
    if (!user) {
      return null;
    }

    const parts = [user.firstName, user.lastName]
      .filter((part) => !!part && part.trim().length > 0)
      .map((part) => part.trim());

    if (parts.length === 0) {
      return null;
    }

    return parts.join(" ");
  }
}
