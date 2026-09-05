import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { Brackets, DataSource, In } from "typeorm";
import { getDateRange } from "./get-data-range.utils";
import { brokerageAmountExpr } from "../../../../../../libs/service-lib/src/lib/constants";
import { LookUp } from "../entities/look-up.entity";
import { Policy } from "../entities/policy.entity";
import { PolicyParticipantMap } from "../entities/policy-participant-map.entity";
import { Endorsement } from "../entities/endorsement.entity";
import { PolicyAssetEndorsement } from "../entities/policy-asset-endorsement.entity";
import { DEFAULT_VALUES, TOGGLE_TYPE } from "../constants";
import { GROUP_POLICY_TYPES, INSURER_PARTICIPANT_TYPE, OWNER_TYPES, POLICY_STATUS_MIG_ACTIVE } from "../../../../../../libs/service-lib/src/lib/constants";
import {
  Broker,
  Country,
  Employee,
  GroupCompanyMap,
  Insurer,
  LocalizationCountry,
  LocalizationRegulatoryFieldsCountryMap,
  LocalizationReportFieldsCountryMap,
  Organisation,
  Reward,
  OrgBranch,
  OrgDepartment,
  OrgSbu,
  OrgVertical,
  PolicyTypeSegregation,
  User,
} from "../entities";
import { OpportunityPreviousMediatorDetails } from "../entities/opportunity-previous-mediator-details.entity";
import { resolveInsurerBranchIds as resolveInsurerBranchIdsUtil } from "./insurer-branch.util";

interface ReportSortTerm {
  expression: string;
  direction: "ASC" | "DESC";
}

interface ReportSortOptions {
  /** UI column key -> fully-formed quoted alias to ORDER BY. */
  overrides?: Record<string, string>;
  /**
   * UI column key -> candidate keys to resolve, in priority order. Use when a
   * grid column's valueGetter falls back across several row keys: the sort has
   * to follow the same chain or it orders by a value the user cannot see.
   */
  aliasCandidates?: Record<string, string[]>;
}

/**
 * The slice of a TypeORM SelectQueryBuilder that applyReportSort needs. Kept
 * structural so it works for every builder shape the report legs create.
 */
interface OrderableQueryBuilder {
  orderBy(sort: string, order: "ASC" | "DESC", nulls?: "NULLS LAST"): unknown;
  addOrderBy(sort: string, order: "ASC" | "DESC", nulls?: "NULLS LAST"): unknown;
}

const SAFE_ALIAS = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** Columns whose displayed value has no stable SQL ordering (row index). */
const UNSORTABLE_COLUMNS = new Set(["serialNumber"]);

/**
 * companySummary (Biz Done Enhanced Companies table) columns whose displayed
 * value comes from a valueGetter fallback chain rather than one row key — see
 * getCompanyColumns. The candidates mirror that chain in the same order, so the
 * sort follows whichever key the org's localization config actually populates.
 * Every other column resolves by its own name and needs no entry here.
 */
// Single source for the terrorism brokerage term across Biz Done: the displayed
// column, the summary-sheet sums, totalBrokerageAmount and the KPI all read it,
// so they cannot drift apart again.
//
// tcBrokerageAmount is what the activity forms write (unconditionally, both
// countries), so it wins. commissionTerrorism is the legacy column and is still
// being written today by Company > Policy Details as an invisible derived
// field, so the fallback must stay until that screen is fixed and the legacy
// values migrated -- dropping it hides ~27.5M of recorded income.
// Whether rewards belong in a Biz Done result at all. The listing and the
// export must agree: the export used to gate on "did the user tick the Rewards
// sheet" alone, so an Income Type = Policy export still produced reward rows
// the listing had excluded.
//
// Rewards carry no owner/company hierarchy, so any policy-only filter excludes
// them outright (the old "disallowed filter -> 0 rewards" rule).
export const normalizeIncomeType = (
  incomeType?: string
): "policy" | "endorsement" | "rewards" | undefined => {
  const raw =
    typeof incomeType === "string" ? incomeType.trim().toLowerCase() : "";
  return raw === "policy" || raw === "endorsement" || raw === "rewards"
    ? raw
    : undefined;
};

export const rewardsAllowedFor = (opts: {
  incomeType?: string;
  sbuId?: any;
  verticalId?: any;
  departmentId?: any;
  branchId?: any;
  insurerBranchId?: any;
  policyType?: string;
  groupCompanyId?: number;
  brokerId?: number;
  searchBy?: string;
}): boolean => {
  const type = normalizeIncomeType(opts.incomeType);
  if (type !== undefined && type !== "rewards") return false;
  const set = (v: any) => v !== undefined && v !== null;
  return !(
    set(opts.sbuId) ||
    set(opts.verticalId) ||
    set(opts.departmentId) ||
    set(opts.branchId) ||
    set(opts.insurerBranchId) ||
    !!opts.policyType ||
    !!opts.groupCompanyId ||
    !!opts.brokerId ||
    !!opts.searchBy
  );
};

const POLICY_TERRORISM_BROKERAGE = `COALESCE(NULLIF(policy.tcBrokerageAmount, 0), CASE WHEN policy.commissionTerrorism IS DISTINCT FROM policy.terrorismBrokeragePercentage THEN policy.commissionTerrorism END, 0)`;
const ENDORSEMENT_TERRORISM_BROKERAGE = `COALESCE(NULLIF(endorsement.tcBrokerageAmount, 0), CASE WHEN endorsement.commissionTerrorismAmount IS DISTINCT FROM endorsement.terrorismBrokeragePercentage THEN endorsement.commissionTerrorismAmount END, 0)`;

const COMPANY_SUMMARY_SORT_CANDIDATES: Record<string, string[]> = {
  // Brokerage Amount: brokerageAmount ?? commissionAmount ??
  // totalBrokerageAmount ?? basicBrokerageAmount
  commissionAmount: [
    "brokerageAmount",
    "commissionAmount",
    "totalBrokerageAmount",
    "basicBrokerageAmount",
  ],
  // Brokerage Collected tolerates a lower-cased label variant.
  brokerageCollected: ["brokerageCollected", "brokeragecollected"],
};

const POLICY_DETAILS_SORT_CANDIDATES: Record<string, string[]> = {
  // Customer Name: companyName ?? customerName
  customerName: ["companyName", "customerName"],
  // Policy Name: policyType ?? policyName
  policyName: ["policyType", "policyName"],
};

/**
 * UI column key -> quoted alias to order by, for the policyDetails listing.
 * The `*Sort` values are aliases the policyDetails select carries purely for
 */
const POLICY_DETAILS_SORT_OVERRIDES: Record<string, string> = {
  dateOfIncome: `"dateOfIncomeSort"`,
  dateOfBusiness: `"dateOfBusinessSort"`,
  policyFromDate: `"policyFromSort"`,
  policyToDate: `"policyToSort"`,
  entryInIwork: `"createdAtSort"`,
  // Rewards-mode "Created date" column (RewardTable's createdAt field,
  // reused here via rewardGetColumns) — without this override it resolves
  // to the literal "createdAt" alias, which is a TO_CHAR(...) formatted
  // text column and sorts lexicographically, not chronologically.
  createdAt: `"createdAtSort"`,
  // Rewards-mode hidden "Date of income" column (RewardTable's
  // dateOfIncomeRaw field) — same underlying value as dateOfIncome, just a
  // different display format; sort on the same real timestamp alias.
  dateOfIncomeRaw: `"dateOfIncomeSort"`,
  incomeMonth: `"incomeMonthSort"`,
  businessMonth: `"businessMonthSort"`,
  // Owner name is concatenated in the row mapper; sort on the same value.
  empName: `"empNameSort"`,
  policyOwner: `"empNameSort"`,
  // Lookup-backed columns carry the lookup id in the base select; these
  // aliases carry the resolved label so ordering is alphabetical.
  customerCategory: `"customerCategorySort"`,
  status: `"policyStatusSort"`,
  policyStatus: `"policyStatusSort"`,
  dealConfirmed: `"dealConfirmedSort"`,
  // The row mapper's `insurerBrokeragePercentage ?? brokeragePercentage`
  // fallback has no second alias to fall back TO, so the displayed value is
  // always the insurer-level one. Sort on exactly that.
  brokeragePercentage: `"insurerBrokeragePercentage"`,
  // brokerageAmount needs no override: getLocalizationFields forces its
  // field_value to basicBrokerageAmount, which is also what the row mapper
  // finally writes, so the generic field_label -> field_value path is correct.
};

/** Pulls the `AS "alias"` names out of a QueryBuilder select() column list. */
const collectSelectAliases = (columns: string[]): Set<string> => {
  const aliases = new Set<string>();
  columns.forEach((column) => {
    const match = /\bAS\s+"([^"]+)"\s*$/i.exec(column.trim());
    if (match) {
      aliases.add(match[1]);
    }
  });
  return aliases;
};

/**
 * Resolves one UI column key to a safe ORDER BY expression, or undefined when
 * it cannot be mapped to a column the query actually selects.
 */
const resolveSortExpression = (
  column: string,
  fields: Record<string, string>,
  allowedAliases: Set<string>,
  options: ReportSortOptions
): string | undefined => {
  const override = options.overrides?.[column];
  if (override) {
    // An override naming an alias the select no longer carries would make
    // Postgres throw, so verify it before use.
    const overrideAlias = /^"([^"]+)"$/.exec(override)?.[1];
    if (!overrideAlias || allowedAliases.has(overrideAlias)) {
      return override;
    }
  }

  // Candidate keys, in the order the grid's own valueGetter reads them (see
  // aliasCandidates), defaulting to the column itself. Each is tried as a
  // localization field_label first and then as a raw alias: some columns are
  // selected explicitly by the query and absent from the localization map
  // (companySummary's sbuName/verticalName), and some maps are identity.
  const candidateKeys = options.aliasCandidates?.[column] ?? [column];
  const alias = candidateKeys
    .flatMap((key) => [fields?.[key], key])
    .find(
      (candidate) =>
        typeof candidate === "string" &&
        SAFE_ALIAS.test(candidate) &&
        allowedAliases.has(candidate)
    );

  return alias ? `"${alias}"` : undefined;
};

/**
 * Translates a grid sort string ("<column>:<ASC|DESC>,...") into validated
 * ORDER BY terms. Unknown, unsortable, or duplicate columns are dropped; an
 * empty result means the caller keeps its own default ordering.
 */
const resolveReportSort = (
  sort: string | undefined,
  fields: Record<string, string>,
  allowedAliases: Set<string>,
  options: ReportSortOptions = {}
): ReportSortTerm[] => {
  if (!sort) {
    return [];
  }

  const terms: ReportSortTerm[] = [];
  const usedExpressions = new Set<string>();

  sort.split(",").forEach((pair) => {
    const [rawColumn, rawDirection] = pair.split(":");
    const column = (rawColumn ?? "").trim();
    if (!column || UNSORTABLE_COLUMNS.has(column)) {
      return;
    }
    const direction =
      (rawDirection ?? "").trim().toUpperCase() === "DESC" ? "DESC" : "ASC";

    const expression = resolveSortExpression(
      column,
      fields,
      allowedAliases,
      options
    );
    if (!expression || usedExpressions.has(expression)) {
      return;
    }
    usedExpressions.add(expression);
    terms.push({ expression, direction });
  });

  return terms;
};

/**
 * Applies resolved terms to a QueryBuilder. Returns false when there were none,
 * letting the caller fall back to its default ordering.
 */
const applyReportSort = (
  queryBuilder: OrderableQueryBuilder,
  terms: ReportSortTerm[]
): boolean => {
  if (!terms.length) {
    return false;
  }

  terms.forEach(({ expression, direction }, index) => {
    // NULLS LAST in both directions so blank cells never lead the page —
    // reward rows carry NULL for most policy columns.
    if (index === 0) {
      queryBuilder.orderBy(expression, direction, "NULLS LAST");
    } else {
      queryBuilder.addOrderBy(expression, direction, "NULLS LAST");
    }
  });

  return true;
};

const brokerAgentSelect =
  `COALESCE(brokermediator.broker_name, policyBroker.displayName, policyBroker.brokerName) AS "brokerName"`;

function buildBrokerMediatorSource(qb: any) {
  return qb
    .select("md.opportunity_id", "broker_opportunity_id")
    .addSelect("md.company_id::int", "broker_id")
    .addSelect(
      "COALESCE(brokerRef.displayName, brokerRef.brokerName)",
      "broker_name",
    )
    .from("opportunity_previous_mediator_details", "md")
    .leftJoin(Broker, "brokerRef", "brokerRef.id = md.company_id::int")
    .where("md.mediator_type = 'BROKER'")
    .distinctOn(["md.opportunity_id"])
    .orderBy("md.opportunity_id")
    .addOrderBy("md.company_id");
}

@Injectable()
export class PolicyReportService {
  private readonly dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  private enabledForPerformanceLidPromise?: Promise<number | null>;
  private groupPolicyTypeIdsPromise?: Promise<number[]>;

  private async getEnabledForPerformanceLookupId(): Promise<number | null> {
    this.enabledForPerformanceLidPromise ??= this.dataSource
      .getRepository(LookUp)
      .findOne({ where: { lookUpKey: TOGGLE_TYPE.TOGGLE_TYPE_YES } })
      .then((enabledLookup) => enabledLookup?.id || null)
      // Don't cache a failure — a transient DB error must not poison the
      // lookup for the life of the process.
      .catch((error) => {
        this.enabledForPerformanceLidPromise = undefined;
        throw error;
      });
    return this.enabledForPerformanceLidPromise;
  }

  private async getGroupPolicyTypeIds(): Promise<number[]> {
    this.groupPolicyTypeIdsPromise ??= this.dataSource
      .getRepository(LookUp)
      .find({ where: { lookUpKey: In(GROUP_POLICY_TYPES) }, select: ["id"] })
      .then((groupPolicies) => groupPolicies.map((item) => item.id))
      .catch((error) => {
        this.groupPolicyTypeIdsPromise = undefined;
        throw error;
      });
    return this.groupPolicyTypeIdsPromise;
  }

  private async getLeadInsurerLookupId(): Promise<number | null> {
    const lookUpRepository = this.dataSource.getRepository(LookUp);
    const leadLookup = await lookUpRepository.findOne({
      where: { lookUpKey: INSURER_PARTICIPANT_TYPE.INSURER_PARTICIPATION_TYPE_LEAD },
    });
    return leadLookup?.id || null;
  }

  private toBindableRange(range: { start?: Date | string; end?: Date | string }): {
    start?: string;
    end?: string;
  } {
    const dateOnly = (d: Date | string) =>
      new Date(d).toISOString().split("T")[0];
    return {
      start: range.start ? dateOnly(range.start) : undefined,
      end: range.end ? `${dateOnly(range.end)} 23:59:59.999` : undefined,
    };
  }

  private buildUnifiedEndorsementSource(groupPolicyTypeIds: number[]) {
    const groupEndorsementQb = this.dataSource
      .getRepository(Endorsement)
      .createQueryBuilder("endorsement")
      .innerJoin("endorsement.policy", "policy")
      .select([
        `policy.id AS policyId`,
        `CONCAT('END-', endorsement.id) AS endorsementId`,
        `policy.companyId AS companyId`,
         `policy.organisationId AS organisationId`,
        `endorsement.sbuId AS sbuId`,
        `endorsement.branchId AS branchId`,
        `endorsement.verticalId AS verticalId`,
        `endorsement.departmentId AS departmentId`,
        `endorsement.insurerEndorsementNumber AS insurerEndorsementNumber`,
        `endorsement.incomeMonth AS incomeMonth`,
        `endorsement.endorsementEffectiveDate AS endorsementEffectiveDate`,
        `endorsement.dateOfIncome AS dateOfIncome`,
        `endorsement.netPremium AS netPremium`,
        `endorsement.terrorismAmount AS terrorismAmount`,
        `endorsement.otherAmount AS otherAmount`,
        `endorsement.basicBrokerageAmount AS basicBrokerageAmount`,
        `endorsement.premiumCollected AS premiumCollected`,
        `endorsement.brokerageCollected AS brokerageCollected`,
        `endorsement.basicBrokeragePercentage AS basicBrokeragePercentage`,
        `endorsement.brokerageAmountAsperIwork AS brokerageAmountAsperIwork`,
        `endorsement.brokerageAmountAsperIsg AS brokerageAmountAsperIsg`,
        `endorsement.feeAmount AS feeAmount`,
        `endorsement.grossPremium AS grossPremium`,
        `endorsement.commissionTerrorismAmount AS commissionTerrorismAmount`,
        `endorsement.terrorismBrokeragePercentage AS terrorismBrokeragePercentage`,
        `endorsement.gstAmount AS gstAmount`,
        `endorsement.gstPercentage AS gstPercentage`,
        `endorsement.basicPremium AS basicPremium`,
        `endorsement.srccAmount AS srccAmount`,
        `endorsement.adminCharges AS adminCharges`,
        `endorsement.cessAmount AS cessAmount`,
        `endorsement.srccPercentage AS srccPercentage`,
        `endorsement.srccBrokerageAmount AS srccBrokerageAmount`,
        `endorsement.tcBrokerageAmount AS tcBrokerageAmount`,
        `endorsement.enabledForPerformanceLid AS enabledForPerformanceLid`,
        `endorsement.uniqueIworkedgeReference AS uniqueIworkedgeReference`,
        `endorsement.uniqueExternalReference AS uniqueExternalReference`,
        `endorsement.businessMonth AS businessMonth`,
        `endorsement.dateOfBusiness AS dateOfBusiness`,
        `endorsement.ingestedMode AS ingestedMode`,
      ]);

    const assetEndorsementQb = this.dataSource
      .getRepository(PolicyAssetEndorsement)
      .createQueryBuilder("endorsement")
      .innerJoin("endorsement.policy", "policy")
      .select([
        `policy.id AS policyId`,
        `CONCAT('AEND-', endorsement.id) AS endorsementId`,
        `policy.companyId AS companyId`,
        `endorsement.organisationId AS organisationId`,
        `endorsement.sbuId AS sbuId`,
        `endorsement.branchId AS branchId`,
        `endorsement.verticalId AS verticalId`,
        `endorsement.departmentId AS departmentId`,
        `endorsement.insurerEndorsementNumber AS insurerEndorsementNumber`,
        `endorsement.incomeMonth AS incomeMonth`,
        `endorsement.endorsementEffectiveDate AS endorsementEffectiveDate`,
        `endorsement.dateOfIncome AS dateOfIncome`,
        `endorsement.netPremium AS netPremium`,
        `endorsement.terrorismAmount AS terrorismAmount`,
        `endorsement.otherAmount AS otherAmount`,
        `endorsement.basicBrokerageAmount AS basicBrokerageAmount`,
        `endorsement.premiumCollected AS premiumCollected`,
        `endorsement.brokerageCollected AS brokerageCollected`,
        `endorsement.basicBrokeragePercentage AS basicBrokeragePercentage`,
        `endorsement.brokerageAmountAsperIwork AS brokerageAmountAsperIwork`,
        `endorsement.brokerageAmountAsperIsg AS brokerageAmountAsperIsg`,
        `endorsement.feeAmount AS feeAmount`,
        `endorsement.grossPremium AS grossPremium`,
        `endorsement.commissionTerrorismAmount AS commissionTerrorismAmount`,
        `endorsement.terrorismBrokeragePercentage AS terrorismBrokeragePercentage`,
        `endorsement.gstAmount AS gstAmount`,
        `NULL::numeric AS gstPercentage`,
        `NULL::numeric AS basicPremium`,
        `NULL::numeric AS srccAmount`,
        `NULL::numeric AS adminCharges`,
        `NULL::numeric AS cessAmount`,
        `NULL::numeric AS srccPercentage`,
        `NULL::numeric AS srccBrokerageAmount`,
        `NULL::numeric AS tcBrokerageAmount`,
        `endorsement.enabledForPerformanceLid AS enabledForPerformanceLid`,
        `NULL::text AS uniqueIworkedgeReference`,
        `NULL::text AS uniqueExternalReference`,
        `endorsement.businessMonth AS businessMonth`,
        `endorsement.dateOfBusiness AS dateOfBusiness`,
        `endorsement.ingestedMode AS ingestedMode`,
      ]);

    return {
      query: `(${groupEndorsementQb.getQuery()} UNION ALL ${assetEndorsementQb.getQuery()})`,
      parameters: {
        ...groupEndorsementQb.getParameters(),
        ...assetEndorsementQb.getParameters(),
      },
    };
  }

  async getPolicyReport(
    userIds: number[],
    entityType?: string,
    timeFilter?: string,
    financialYear?: number
  ) {
    try {
      const range = getDateRange(timeFilter, financialYear);
      // Validate entityType
      const entitityTypes = [
        "companySummary",
        "policySummary",
        "insurerSummary",
        "policyDetails",
        "coInsurerDetails",
      ];
      if (entityType && !entitityTypes.includes(entityType)) {
        throw new BadRequestException("Invalid entityType");
      }

      const lookUpArray = [
        "DEAL_CONFIRMED",
        "PRIORITY",
        "POLICY_STATUS_MIG",
        "INSURER_PARTICIPATION_TYPE",
      ];
      const lookUpRepository = await this.dataSource.getRepository(LookUp);
      const policyRepository = await this.dataSource.getRepository(Policy);
      const lookUpMapDataFromTable = await lookUpRepository.find({
        where: { lookUpName: In(lookUpArray) },
      });
      const groupPolicyTypeIds = await this.getGroupPolicyTypeIds();
      const endorsementSource = this.buildUnifiedEndorsementSource(
        groupPolicyTypeIds,
      );
      const lookUpMapData: Record<number, string> = {};
      lookUpMapDataFromTable.forEach((item) => {
        lookUpMapData[item.id] = item.lookUpValue;
      });
      const leadInsurerLid = lookUpMapDataFromTable.find(
        (type) => type.lookUpKey === "INSURER_PARTICIPATION_TYPE_LEAD"
      )?.id;
      const coInsurerLid = lookUpMapDataFromTable.find(
        (type) => type.lookUpKey === "INSURER_PARTICIPATION_TYPE_CO"
      )?.id;
      // Helper to build and execute the query
      const runReportQuery = async (type: any) => {
        const qb = policyRepository.createQueryBuilder("policy");
        if (userIds && userIds.length > 0) {
          qb.where("policy.createdBy IN (:...userIds)", { userIds });
        }
        if (range.start && range.end) {
          qb.andWhere("policy.dateOfIncome BETWEEN :start AND :end", {
            start: range.start,
            end: range.end,
          });
        }

        let data = [],
          policyQb,
          policyQuery,
          endorsementQb,
          unionQuery,
          finalQb;
        switch (type) {
          case "companySummary":
            qb.innerJoin("policy.company", "company")
              .select([
                "company.companyName AS customerName",
                "SUM(policy.grossPremium) AS grossPremium",
                "SUM(policy.commissionTerrorism) AS terrorismCommissionAmount",
                "SUM(policy.basicBrokerageAmount) AS commissionAmount",
                "SUM(policy.netPremium) AS netPremium",
              ])
              .groupBy("policy.companyId")
              .addGroupBy("company.companyName");
            data = await qb.getRawMany();
            data = data.map((item, index) => ({
              serialNumber: index + 1,
              customerName: item?.customername ?? null,
              netPremium: item?.netpremium ?? null,
              grossPremium: item?.grosspremium ?? null,
              commissionAmount: item?.commissionamount ?? null,
              terrorismCommissionAmount:
                item?.terrorismcommissionamount ?? null,
            }));
            break;

          case "policySummary":
            qb.select([
              "policy.policyName AS policyCategory",
              "SUM(policy.grossPremium) AS grossPremium",
              "SUM(policy.basicBrokerageAmount) AS commissionAmount",
              "SUM(policy.commissionTerrorism) AS terrorismCommissionAmount",
              "SUM(policy.netPremium) AS netPremium",
            ]).groupBy("policy.policyName");
            data = await qb.getRawMany();
            data = data.map((item, index) => ({
              serialNumber: index + 1,
              policyCategory: item?.policycategory ?? null,
              netPremium: item?.netpremium ?? null,
              grossPremium: item?.grosspremium ?? null,
              commissionAmount: item?.commissionamount ?? null,
              terrorismCommissionAmount:
                item?.terrorismcommissionamount ?? null,
            }));
            break;

          case "insurerSummary":
            qb.innerJoin("policy.insurerMappings", "insurerMappings")
              .innerJoin("insurerMappings.insurer", "insurer")
              .andWhere(
                "insurerMappings.insurerParticipationTypeLid = :leadInsurerLid",
                { leadInsurerLid }
              )
              .select([
                "insurer.insurerName AS insurerName",
                "SUM(policy.grossPremium) AS grossPremium",
                "SUM(policy.basicBrokerageAmount) AS commissionAmount",
                "SUM(policy.commissionTerrorism) AS terrorismCommissionAmount",
                "SUM(policy.netPremium) AS netPremium",
              ])
              .groupBy("insurer.insurerName");
            data = await qb.getRawMany();
            data = data.map((item, index) => ({
              serialNumber: index + 1,
              insurer: item.insurername,
              netPremium: item.netpremium,
              grossPremium: item.grosspremium,
              commissionAmount: item.commissionamount,
              terrorismCommissionAmount: item.terrorismcommissionamount,
            }));
            break;

          case "policyDetails":
            // Create base query builder for policy records
            policyQb = policyRepository.createQueryBuilder("policy");
            if (userIds && userIds.length > 0) {
              policyQb.where("policy.createdBy IN (:...userIds)", { userIds });
            }

            if (range.start && range.end) {
              policyQb.andWhere("policy.dateOfIncome BETWEEN :start AND :end", {
                start: range.start,
                end: range.end,
              });
            }
            // Build policy query
            policyQuery = policyQb
              // Lead-mapping-only LEFT join: one row per record, matching the
              // KPI (same fix as streamPolicyReport's policyDetails arms).
              .leftJoin(
                "policy.insurerMappings",
                "insurerMappings",
                "insurerMappings.insurerParticipationTypeLid = :leadInsurerLid",
                { leadInsurerLid }
              )
              .leftJoin("insurerMappings.insurer", "insurer")
              .leftJoin("insurerMappings.insurerBranch", "address")
              .leftJoin("address.cityId", "city")
              .innerJoin("policy.company", "company")
              .innerJoin("policy.createdUser", "employee")
              .leftJoin("employee.branch", "branch")
              .leftJoin("employee.vertical", "vertical")
              .leftJoin("employee.department", "department")
              .select([
                "policy.id AS policyId",
                "policy.createdAt AS createdAt",
                "policy.insurerPolicyNumber AS insurancePolicyNumber",
                "policy.policyName AS policyName",
                "policy.policyName AS policyCategory",
                "policy.policyFrom AS policyFrom",
                "policy.policyTo AS policyTo",
                "policy.sharePercentage AS sharePercentage",
                "policy.insurerEndorsementNumber AS insEndNo",
                "policy.dateOfIncome AS dateOfIncome",
                "policy.netPremium AS netPremium",
                "policy.terrorismAmount AS terrorism",
                "policy.otherAmount AS other",
                "policy.brokerageAmountAsperIwork AS commissionAmountAsPerIwork",
                "policy.brokerageAmountAsperIsg AS commissionAmountAsEnteredByIsg",
                "policy.feeAmount AS fees",
                "policy.grossPremium AS grosspremium",
                "policy.commissionTerrorism AS terrorismCommissionAmount",
                "policy.terrorismBrokeragePercentage AS terrorismcommissionpercentage",
                "policy.gstPercentage AS gstPercentage",
                "policy.policyStatusLid as policyStatus",
                "policy.dealConfirmedLid as dealConfirmedLid",
                "company.id AS companyId",
                "company.priorityLid as customerCategory",
                "company.companyName AS companyName",
                "employee.firstName as empFirstName",
                "employee.lastName as empLastName",
                "branch.name as empBranchName",
                "department.name as empDepartmentName",
                "vertical.name as empVerticalName",
                "insurer.displayName AS insurerName",
                "city.name AS insurerBranch",
                "'policy' AS recordType",
                "'iirm' AS policyGroup",
                "'general' AS companyVertical",
              ]);

            // Create endorsement query builder
            endorsementQb = policyRepository.manager
              .createQueryBuilder()
              .from(endorsementSource.query, "endorsement")
              .setParameters(endorsementSource.parameters)
              .innerJoin(Policy, "policy", "policy.id = endorsement.policyId")
              // Lead-mapping-only LEFT join — same rationale as above.
              .leftJoin(
                "policy.insurerMappings",
                "insurerMappings",
                "insurerMappings.insurerParticipationTypeLid = :leadInsurerLid",
                { leadInsurerLid }
              )
              .leftJoin("insurerMappings.insurer", "insurer")
              .leftJoin("insurerMappings.insurerBranch", "address")
              .leftJoin("address.cityId", "city")
              .innerJoin("policy.company", "company")
              .innerJoin("policy.createdUser", "employee")
              .leftJoin("employee.branch", "branch")
              .leftJoin("employee.vertical", "vertical")
              .leftJoin("employee.department", "department")
              .select([
                "policy.id AS policyId",
                "policy.createdAt AS createdAt",
                "policy.insurerPolicyNumber AS insurancePolicyNumber",
                "policy.policyName AS policyName",
                "policy.policyName AS policyCategory",
                "policy.policyFrom AS policyFrom",
                "policy.policyTo AS policyTo",
                "policy.sharePercentage AS sharePercentage",
                "endorsement.insurerEndorsementNumber AS insEndNo",
                "endorsement.dateOfIncome AS dateOfIncome",
                "endorsement.netPremium AS netPremium",
                "endorsement.terrorismAmount AS terrorism",
                "endorsement.otherAmount AS other",
                "endorsement.brokerageAmountAsperIwork AS commissionAmountAsPerIwork",
                "endorsement.brokerageAmountAsperIsg AS commissionAmountAsEnteredByIsg",
                "endorsement.feeAmount AS fees",
                "endorsement.grossPremium AS grosspremium",
                "endorsement.commissionTerrorismAmount AS terrorismCommissionAmount",
                "endorsement.terrorismBrokeragePercentage AS terrorismcommissionpercentage",
                "endorsement.gstAmount AS gstAmount",
                "policy.policyStatusLid As policyStatus",
                "policy.dealConfirmedLid as dealConfirmedLid",
                "company.id AS companyId",
                "company.priorityLid as customerCategory",
                "company.companyName AS companyName",
                "employee.firstName as empFirstName",
                "employee.lastName as empLastName",
                "branch.name as empBranchName",
                "department.name as empDepartmentName",
                "vertical.name as empVerticalName",
                "insurer.displayName AS insurerName",
                "city.name AS insurerBranch",
                "'endorsement' AS recordType",
                "'iirm' AS policyGroup",
                "'general' AS companyVertical",
              ]);

            if (userIds && userIds.length > 0) {
              endorsementQb.where("policy.dateOfIncome IN (:...userIds)", {
                userIds,
              });
            }

            if (range.start && range.end) {
              endorsementQb.andWhere(
                "policy.dateOfIncome BETWEEN :start AND :end",
                {
                  start: range.start,
                  end: range.end,
                }
              );
            }

            // Combine both queries with UNION ALL
            unionQuery = `(${policyQuery.getQuery()} UNION ALL ${endorsementQb.getQuery()})`;

            // Create final query to select from combined results
            finalQb = policyRepository.manager
              .createQueryBuilder()
              .select("*")
              .from(unionQuery, "combined_results")
              .setParameters({
                ...policyQuery.getParameters(),
                ...endorsementQb.getParameters(),
              });
            data = await finalQb.getRawMany();
            // Map the combined results
            data = data.map((item, index) => ({
              serialNumber: index + 1,
              iirmPolNo: item?.policyid ?? null,
              iirmRefNo: item?.policyid ?? null,
              insPolNo: item?.insurancepolicynumber ?? null,
              insEndNo: item?.insendno ?? null,
              incomeType: item?.recordtype ?? null,
              entryInIwork: item?.createdat
                ? new Date(item.createdat).toLocaleDateString("en-GB")
                : null,
              incomeMonth: item.dateofincome
                ? new Date(item.dateofincome).toLocaleString("en-GB", {
                    month: "long",
                  })
                : null,
              dateOfIncome: item?.dateofincome
                ? new Date(item?.dateofincome).toLocaleDateString("en-GB")
                : null,
              policyFromDate: item?.policyfrom
                ? new Date(item?.policyfrom).toLocaleDateString("en-GB")
                : null,
              policyToDate: item?.policyto
                ? new Date(item?.policyto).toLocaleDateString("en-GB")
                : null,
              custId: item?.companyid ?? null,
              customerName: item?.companyname ?? null,
              customerCategory: item?.customercategory
                ? lookUpMapData[item.customercategory]
                : null,
              policyName: item?.policyname ?? null,
              policyCategory: item?.policycategory ?? null,
              insurer: item?.insurername ?? null,
              insBranch: item.insurerbranch ?? null,
              empName:
                item?.empfirstname || item?.emplastname
                  ? `${item?.empfirstname ?? ""} ${
                      item?.emplastname ?? ""
                    }`.trim()
                  : null,
              iirmBranch: item?.empbranchname ?? null,
              vertical: item?.empverticalname ?? null,
              department: item?.empdepartmentname ?? null,
              status: item?.policystatus
                ? lookUpMapData[item.policystatus]
                : null,
              sharePercentage: item?.sharepercentage ?? null,
              netPremium: item?.netpremium ?? null,
              terrorism: item?.terrorism ?? null,
              other: item?.other ?? null,
              gstAmount: item?.gstamount ?? null,
              grossPremium: item?.grosspremium ?? null,
              commissionPercentage: null,
              commissionAmountAsEnteredByIsg:
                item?.commissionamountasperisg ?? null,
              commissionAmountAsPerIwork:
                item?.commissionamountasperiwork ?? null,
              fees: item?.fees ?? null,
              dealConfirmed: item?.dealconfirmedlid
                ? lookUpMapData[item?.dealconfirmedlid]
                : null,
              policyGroup: item?.policygroup ?? null,
              terrorismCommissionAmount:
                item?.terrorismcommissionamount ?? null,
              terrorismCommissionPercentage:
                item?.terrorismcommissionpercentage ?? null,
              policyStatus: item?.policystatus
                ? lookUpMapData[item.policystatus]
                : null,
              companyVertical: item?.companyvertical ?? null,
            }));
            break;

          case "coInsurerDetails":
            qb.innerJoin("policy.insurerMappings", "insurerMappings")
              .innerJoin("insurerMappings.insurer", "insurer")
              .leftJoin("insurer.insurerAddresses", "insurerAddresses")
              .leftJoin("insurerAddresses.address", "address")
              .leftJoin("address.cityId", "city")
              .innerJoin("policy.company", "company")
              .innerJoin("policy.createdUser", "employee")
              .leftJoin("employee.branch", "branch")
              .leftJoin("employee.vertical", "vertical")
              .leftJoin("employee.department", "department")
              .andWhere(
                "insurerMappings.insurerParticipationTypeLid = :coInsurerLid",
                { coInsurerLid }
              )
              .select([
                "policy.id AS policyId",
                "policy.createdAt AS createdAt",
                "policy.policyName AS policyName",
                "policy.policyFrom AS policyFrom",
                "policy.policyTo AS policyTo",
                "policy.grossPremium AS grosspremium",
                "policy.insurerEndorsementNumber AS insEndNo",
                "policy.commissionTerrorism AS terrorismCommissionAmount",
                "policy.gstPercentage AS gstPercentage",
                "policy.dateOfIncome AS dateOfIncome",
                "policy.otherAmount AS other",
                "policy.netPremium AS netPremium",
                "policy.terrorismAmount AS terrorism",
                "policy.feeAmount AS fees",
                "policy.brokerageAmountAsperIwork AS commissionAmountAsPerIwork",
                "policy.brokerageAmountAsperIsg AS commissionAmountAsEnteredByIsg",
                "policy.terrorismBrokeragePercentage AS terrorismcommissionpercentage",
                "policy.policyStatusLid As policyStatus",
                "company.id AS companyId",
                "company.companyName AS companyName",
                "company.priorityLid as customerCategory",
                "insurer.displayName AS insurerName",
                "policy.dealConfirmedLid as dealConfirmedLid",
                "employee.firstName as empFirstName",
                "employee.lastName as empLastName",
                "branch.name as empBranchName",
                "department.name as empDepartmentName",
                "vertical.name as empVerticalName",
                "city.name AS insurerBranch",
                "'policy' AS recordType",
                "'iirm' AS policyGroup",
                "'general' AS companyVertical",
              ]);
            data = await qb.getRawMany();
            data = data.map((item, index) => ({
              serialNumber: index + 1,
              iirmPolNo: item?.policyid ?? null,
              iirmRefNo: item?.policyid ?? null,
              insPolNo: item?.insurancepolicynumber ?? null,
              insEndNo: item?.insendno ?? null,
              incomeType: item?.recordtype ?? null,
              entryInIwork: item?.createdat
                ? new Date(item.createdat).toLocaleDateString("en-GB")
                : null,
              incomeMonth: item?.dateofincome
                ? new Date(item.dateofincome).toLocaleString("en-GB", {
                    month: "long",
                  })
                : null,
              dateOfIncome: item?.dateofincome
                ? new Date(item.dateofincome).toLocaleDateString("en-GB")
                : null,
              policyFromDate: item?.policyfrom
                ? new Date(item.policyfrom).toLocaleDateString("en-GB")
                : null,
              policyToDate: item?.policyto
                ? new Date(item.policyto).toLocaleDateString("en-GB")
                : null,
              custId: item?.companyid ?? null,
              customerName: item?.companyname ?? null,
              customerCategory: item?.customercategory
                ? lookUpMapData[item.customercategory]
                : null,
              policyName: item?.policyname ?? null,
              insurer: item?.insurername ?? null,
              insurerBranch: item?.insurerbranch ?? null,
              empName:
                item?.empfirstname || item?.emplastname
                  ? `${item?.empfirstname ?? ""} ${
                      item?.emplastname ?? ""
                    }`.trim()
                  : null,
              iirmBranch: item?.empbranchname ?? null,
              vertical: item?.empverticalname ?? null,
              department: item?.empdepartmentname ?? null,
              status: item?.policystatus
                ? lookUpMapData[item.policystatus]
                : null,
              sharePercentage: item?.sharepercentage ?? null,
              netPremium: item?.netpremium ?? null,
              terrorism: item?.terrorism ?? null,
              other: item?.other ?? null,
              gstPercentage: item?.gstpercentage ?? null,
              grossPremium: item?.grosspremium ?? null,
              commissionPercentage: null,
              commissionAmountAsEnteredByIsg:
                item?.commissionamountasperisg ?? null,
              commissionAmountAsPerIwork:
                item?.commissionamountasperiwork ?? null,
              fees: item?.fees ?? null,
              dealConfirmed: item?.dealconfirmedlid
                ? lookUpMapData[item?.dealconfirmedlid]
                : null,
              policyGroup: item?.policygroup ?? null,
              terrorismCommissionAmount:
                item?.terrorismcommissionamount ?? null,
              terrorismCommissionPercentage:
                item?.terrorismcommissionpercentage ?? null,
              policyStatus: item?.policystatus
                ? lookUpMapData[item.policystatus]
                : null,
              companyVertical: item?.companyvertical ?? null,
            }));
            break;

          default:
            return [];
        }

        const calculateData = await this.calculateTotals(data, type);
        return calculateData;
      };

      // If no entityType, return both company and policy grouped results
      if (!entityType) {
        const [
          companySummary,
          policySummary,
          insurerSummary,
          policyDetails,
          coInsurerDetails,
        ] = await Promise.all([
          runReportQuery("companySummary"),
          runReportQuery("policySummary"),
          runReportQuery("insurerSummary"),
          runReportQuery("policyDetails"),
          runReportQuery("coInsurerDetails"),
        ]);
        return {
          companySummary,
          policySummary,
          insurerSummary,
          policyDetails,
          coInsurerDetails,
        };
      }
      // Return only the requested entityType
      const entityReportData = await runReportQuery(entityType);
      return {
        [`${entityType}`]: entityReportData,
      };
    } catch (error) {
      // console.error("Error in getPolicyReport:", error);
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch policy report."
      );
    }
  }

  /**
   * Resolves the set of insurer-branch (address) ids to filter policies by.
   * - "branch": just the selected branch.
   * - "branchWithSub": the selected branch plus its entire descendant subtree
   *   (children, grandchildren, ... via address.parent_branch_id), so nested
   *   sub-branches like HQ -> CO -> BO are all included.
   */
  async resolveInsurerBranchIds(
    insurerBranchId?: number,
    branchViewBy?: string
  ): Promise<number[] | undefined> {
    return resolveInsurerBranchIdsUtil(
      this.dataSource,
      insurerBranchId,
      branchViewBy
    );
  }

  async *streamPolicyReport(
    userIds: number[],
    entityType?: string,
    timeFilter?: string,
    financialYear?: number,
    searchBy?: string,
    batchSize = 5000,
    offset = 0,
    fetchAll = true,
    isLeadership = false, // New flag to control whether to fetch all records or just a limited batch
    organisationId: any[],
    sbuId: any,
    verticalId: any,
    departmentId: any,
    branchId: any,
    insurerId?: number,
    fromDate?: Date,
    toDate?: Date,
    businessPerformanceType?: string,
    allowAllInsurer: boolean = false,
    incomeType?: string,
    businessMonth?: string,
    insurerBranchId?: number,
    branchViewBy?: string,
    filterByBusinessDate?: boolean,
    policyType?: string,
    groupCompanyId?: number,
    brokerId?: number,
    // When true, insurer rewards are unioned into the policyDetails listing
    // (Biz Done main table). Kept off for exports, which have their own rewards
    // sheet, to avoid double-counting.
    includeRewards: boolean = false,
    // Org scope for the reward branch (rewards have no owner hierarchy):
    // leadership -> selected orgs or null (= all); others -> [own org].
    rewardOrganisationIds?: number[] | null,
    selectedSheets?: string[],
    sort?: string
  ): AsyncGenerator<
    {
      type: string;
      rows: any[];
      totalCount: number;
      sampleHeaders: any;
      countryId?: number;
      numberFormat?: string | null;
    },
    void,
    unknown
  > {
    // Vertical is a multiselect filter: every vertical condition below uses
    // IN, so normalise a single id into a one-item list.
    if (verticalId !== undefined && verticalId !== null) {
      verticalId = Array.isArray(verticalId) ? verticalId : [verticalId];
    }
    if (branchId !== undefined && branchId !== null) {
      branchId = Array.isArray(branchId) ? branchId : [branchId];
    }
    const rawIncomeType =
      typeof incomeType === "string" ? incomeType.trim().toLowerCase() : "";
    const normalizedIncomeType =
      rawIncomeType === "policy" ||
      rawIncomeType === "endorsement" ||
      rawIncomeType === "rewards"
        ? rawIncomeType
        : undefined;
    const includePolicyRecords =
      normalizedIncomeType === undefined || normalizedIncomeType === "policy";
    const includeEndorsementRecords =
      normalizedIncomeType === undefined ||
      normalizedIncomeType === "endorsement";
    const includeRewardRecords =
      includeRewards &&
      rewardsAllowedFor({
        incomeType,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        insurerBranchId,
        policyType,
        groupCompanyId,
        brokerId,
        searchBy,
      });
    const { entitityTypes, countryId } = await this.getOrgEntityTypes(
      organisationId
    );
    const enabledForPerformanceLid = await this.getEnabledForPerformanceLookupId();
    const groupPolicyTypeIds = await this.getGroupPolicyTypeIds();
    const endorsementSource = this.buildUnifiedEndorsementSource(
      groupPolicyTypeIds,
    );
    let range: { start?: Date | string; end?: Date | string } = getDateRange(
      timeFilter,
      financialYear
    );
    if (fromDate && toDate) {
      range.start = fromDate;
      range.end = toDate;
    }
    range = this.toBindableRange(range);
    if (entityType && !entitityTypes.includes(entityType)) {
      throw new BadRequestException("Invalid entityType");
    }

    const lookUpArray = [
      "DEAL_CONFIRMED",
      "PRIORITY",
      "POLICY_STATUS_MIG",
      "INSURER_PARTICIPATION_TYPE",
    ];
    const lookUpRepository = await this.dataSource.getRepository(LookUp);
    const policyRepository = await this.dataSource.getRepository(Policy);
    const branchIds = await this.resolveInsurerBranchIds(
      insurerBranchId,
      branchViewBy
    );
    const lookUpMapDataFromTable = await lookUpRepository.find({
      where: { lookUpName: In(lookUpArray) },
    });
    const lookUpMapData: Record<number, string> = {};
    lookUpMapDataFromTable.forEach((item) => {
      lookUpMapData[item.id] = item.lookUpValue;
    });
    const leadInsurerLid = lookUpMapDataFromTable.find(
      (type) => type.lookUpKey === "INSURER_PARTICIPATION_TYPE_LEAD"
    )?.id;
    const coInsurerLid = lookUpMapDataFromTable.find(
      (type) => type.lookUpKey === "INSURER_PARTICIPATION_TYPE_CO"
    )?.id;

    const runQueryBatch = async function* (
      type: string,
      offset: number,
      fields: any
    ) {
      const getQueryCount = async (queryBuilder: any, alias: string) => {
        const [sql, parameters] = queryBuilder.getQueryAndParameters();
        const countResult = await policyRepository.manager.query(
          `SELECT COUNT(*)::int AS count FROM (${sql}) ${alias}`,
          parameters
        );

        return Number(countResult?.[0]?.count ?? 0);
      };

      let indexOffset = offset;
      let hasMoreData = true;
      let cachedTotalCount: number | undefined;
      const brokerageAmountLabel =
        type === "policyDetails"
          ? Object.keys(fields).find((key) => {
              const normalizedKey = key.replace(/\s+/g, "").toLowerCase();
              return normalizedKey === "brokerageamount";
            })
          : undefined;
      while (hasMoreData) {
        const qb = policyRepository.createQueryBuilder("policy");
        let query = qb as any;

        let policyQb: any,
          policyCompanyQb: any,
          policyQuery: any,
          policyPolicyQb: any,
          policyInsurerQb: any,
          policyCoInsurerQb: any,
          endorsementQb: any,
          endorsementCompanyQb: any,
          endorsementPolicyQb: any,
          endorsementInsurerQb: any,
          endorsementCoInsurerQb: any,
          unionQuery: any,
          unionCompanyQuery: any,
          unionPolicyQuery: any,
          unionInsurerQuery: any,
          unionCoInsurerQuery: any,
          policyCount: any,
          endorsementCount: any,
          totalCount: any,
          finalQb: any,
          finalCompanyQb: any,
          finalPolicyQb: any,
          finalInsurerQb: any,
          finalCoInsurerQb: any;
        // Declared out here rather than in the case blocks: this switch's cases
        // are not braced, so a lexical declaration inside one would leak (and
        // trip no-case-declarations) — same reason as the block above.
        let companySummarySelect: string[];
        let companySortTerms: ReportSortTerm[];
        switch (type) {
          case "companySummary":
            // Drawer filters at record grain, so the companies aggregate is the
            // group-by of exactly the policy/endorsement set the policyDetails
            // leg would list. Insurer conditions use EXISTS on the lead mapping
            // (not a join) so the SUMs can't fan out on multi-mapping policies.
            const applyCompanySummaryRecordFilters = (qb: any) => {
              if (brokerId) {
                qb.andWhere("policy.broker_id = :csBrokerId", {
                  csBrokerId: brokerId,
                });
              }
              if (policyType) {
                qb.andWhere(
                  "EXISTS (SELECT 1 FROM lookup_data cs_ptl WHERE cs_ptl.id = policy.policy_type_lid AND cs_ptl.value = :csPolicyType)",
                  { csPolicyType: policyType }
                );
              }
              if (groupCompanyId) {
                qb.andWhere(
                  "EXISTS (SELECT 1 FROM group_company_map cs_gcm WHERE cs_gcm.company_id = policy.company_id AND cs_gcm.group_company_id = :csGroupCompanyId)",
                  { csGroupCompanyId: groupCompanyId }
                );
              }
              if (insurerId || (branchIds && branchIds.length > 0)) {
                const mappingConditions = [
                  "cs_pim.policy_id = policy.id",
                  "cs_pim.deleted_at IS NULL",
                ];
                const mappingParams: Record<string, any> = {};
                if (leadInsurerLid) {
                  mappingConditions.push(
                    "cs_pim.insurer_participation_type_lid = :csLeadInsurerLid"
                  );
                  mappingParams.csLeadInsurerLid = leadInsurerLid;
                }
                if (insurerId) {
                  mappingConditions.push("cs_pim.insurer_id = :csInsurerId");
                  mappingParams.csInsurerId = insurerId;
                }
                if (branchIds && branchIds.length > 0) {
                  mappingConditions.push(
                    "cs_pim.insurer_branch_id IN (:...csBranchIds)"
                  );
                  mappingParams.csBranchIds = branchIds;
                }
                qb.andWhere(
                  `EXISTS (SELECT 1 FROM policy_insurer_map cs_pim WHERE ${mappingConditions.join(" AND ")})`,
                  mappingParams
                );
              }
            };
            policyCompanyQb = policyRepository
              .createQueryBuilder("policy")
              .innerJoin("policy.company", "company")
              .leftJoin(Organisation, "organisation", "organisation.id = policy.organisationId")
              .leftJoin(OrgSbu, "sbu", "sbu.id = policy.sbuId")
              .leftJoin(OrgVertical, "vertical", "vertical.id = policy.verticalId")
              .select([
                `company.companyName AS "customerName"`,
                `SUM(COALESCE(policy.grossPremium, 0)) AS "grossPremium"`,
                `SUM(${POLICY_TERRORISM_BROKERAGE}) AS "terrorismCommissionAmount"`,
                `SUM(COALESCE(policy.basicBrokerageAmount, 0)) AS "basicBrokerageAmount"`,
                `SUM(COALESCE(policy.premiumCollected, 0)) AS "premiumCollected"`,
                `SUM(COALESCE(policy.brokerageCollected, 0)) AS "brokerageCollected"`,
                `SUM(COALESCE(policy.netPremium, 0)) AS "netPremium"`,
                `SUM(COALESCE(policy.basicPremium, 0) + COALESCE(policy.srccAmount, 0) + COALESCE(policy.terrorismAmount, 0)) AS "lankaNetPremium"`,
                `SUM(COALESCE(policy.basicPremium, 0) + COALESCE(policy.srccAmount, 0) + COALESCE(policy.terrorismAmount, 0) + COALESCE(policy.adminCharges, 0) + COALESCE(policy.otherAmount, 0) + COALESCE(policy.cessAmount, 0) + COALESCE(policy.feeAmount, 0) + COALESCE(policy.gstAmount, 0)) AS "lankaGrossPremium"`,
                `SUM(COALESCE(policy.basicBrokerageAmount, 0) + COALESCE(policy.srccBrokerageAmount, 0) + ${POLICY_TERRORISM_BROKERAGE} + COALESCE(policy.feeAmount, 0)) AS "totalBrokerageAmount"`,
                `policy.companyId AS "companyId"`,
                `organisation.name AS "iirmOrganisation"`,
                `sbu.name AS "sbuName"`,
                `vertical.name AS "verticalName"`,
              ])
              .groupBy("policy.companyId")
              .addGroupBy("company.companyName")
              .addGroupBy("organisation.name")
              .addGroupBy("sbu.name")
              .addGroupBy("vertical.name");

            if (userIds && userIds.length > 0 && isLeadership === false) {
              policyCompanyQb.where("policy.ownerId IN (:...userIds)", {
                userIds,
              });
            }
            if (enabledForPerformanceLid) {
              policyCompanyQb.andWhere(
                "policy.enabledForPerformanceLid = :enabledForPerformanceLid",
                { enabledForPerformanceLid }
              );
            }
            if (range.start && range.end) {
              policyCompanyQb.andWhere(
                `${filterByBusinessDate ? "policy.dateOfBusiness" : "policy.dateOfIncome"} BETWEEN :start AND :end`,
                {
                  start: range.start,
                  end: range.end,
                }
              );
            }
            applyCompanySummaryRecordFilters(policyCompanyQb);
            // Same company search the policyDetails leg supports: a numeric
            // searchBy is a companyId (Biz Done Enhanced's toolbar Company
            // select), anything else a name ILIKE.
            if (searchBy) {
              if (!isNaN(Number(searchBy))) {
                policyCompanyQb.andWhere("policy.companyId = :companyId", {
                  companyId: Number(searchBy),
                });
              } else {
                policyCompanyQb.andWhere(
                  "company.companyName ILIKE :searchBy",
                  { searchBy: `%${searchBy}%` }
                );
              }
            }

            if (
              businessPerformanceType !== undefined &&
              businessPerformanceType !== null &&
              businessPerformanceType !== DEFAULT_VALUES.ACTUAL
            ) {
              if (businessPerformanceType === DEFAULT_VALUES.OPPORTUNITY_TYPE) {
                policyCompanyQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
                  }
                );
              }
              if (
                businessPerformanceType ===
                DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE
              ) {
                policyCompanyQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
                  }
                );
              }
            }

            // if (isLeadership === true) {
              if (organisationId && organisationId.length > 0) {
                policyCompanyQb.andWhere(
                  "policy.organisationId IN (:...organisationId)",
                  { organisationId }
                );
              }
              if (sbuId !== undefined && sbuId !== null) {
                policyCompanyQb.andWhere("policy.sbuId = :sbuId", { sbuId });
              }
              if (verticalId !== undefined && verticalId !== null) {
                policyCompanyQb.andWhere("policy.verticalId IN (:...verticalId)", {
                  verticalId,
                });
              }
              if (departmentId !== undefined && departmentId !== null) {
                policyCompanyQb.andWhere(
                  "policy.departmentId = :departmentId",
                  {
                    departmentId,
                  }
                );
              }
              if (branchId !== undefined && branchId !== null) {
                policyCompanyQb.andWhere(
                  "policy.branchId IN (:...branchId)",
                  {
                    branchId,
                  }
                );
              }
            // }

            // Endorsement part
            endorsementCompanyQb = policyRepository.manager
              .createQueryBuilder()
              .from(endorsementSource.query, "endorsement")
              .innerJoin(Policy, "policy", "policy.id = endorsement.policyId")
              .innerJoin("policy.company", "company")
              .leftJoin(Organisation, "organisation", "organisation.id = endorsement.organisationId")
              .leftJoin(OrgSbu, "sbu", "sbu.id = endorsement.sbuId")
              .leftJoin(OrgVertical, "vertical", "vertical.id = endorsement.verticalId")
              .select([
                `company.companyName AS "customerName"`,
                `SUM(COALESCE(endorsement.grossPremium, 0)) AS "grossPremium"`,
                `SUM(${ENDORSEMENT_TERRORISM_BROKERAGE}) AS "terrorismCommissionAmount"`,
                `SUM(COALESCE(endorsement.basicBrokerageAmount, 0)) AS "basicBrokerageAmount"`,
                `SUM(COALESCE(endorsement.premiumCollected, 0)) AS "premiumCollected"`,
                `SUM(COALESCE(endorsement.brokerageCollected, 0)) AS "brokerageCollected"`,
                `SUM(COALESCE(endorsement.netPremium, 0)) AS "netPremium"`,
                `SUM(COALESCE(endorsement.basicPremium, 0) + COALESCE(endorsement.srccAmount, 0) + COALESCE(endorsement.terrorismAmount, 0)) AS "lankaNetPremium"`,
                `SUM(COALESCE(endorsement.basicPremium, 0) + COALESCE(endorsement.srccAmount, 0) + COALESCE(endorsement.terrorismAmount, 0) + COALESCE(endorsement.adminCharges, 0) + COALESCE(endorsement.otherAmount, 0) + COALESCE(endorsement.cessAmount, 0) + COALESCE(endorsement.feeAmount, 0) + COALESCE(endorsement.gstAmount, 0)) AS "lankaGrossPremium"`,
                `SUM(COALESCE(endorsement.basicBrokerageAmount, 0) + COALESCE(endorsement.srccBrokerageAmount, 0) + ${ENDORSEMENT_TERRORISM_BROKERAGE} + COALESCE(endorsement.feeAmount, 0)) AS "totalBrokerageAmount"`,
                `policy.companyId AS "companyId"`,
                `organisation.name AS "iirmOrganisation"`,
                `sbu.name AS "sbuName"`,
                `vertical.name AS "verticalName"`,
              ])
              .groupBy("policy.companyId")
              .addGroupBy("company.companyName")
              .addGroupBy("organisation.name")
              .addGroupBy("sbu.name")
              .addGroupBy("vertical.name");

            if (userIds && userIds.length > 0 && isLeadership === false) {
              endorsementCompanyQb.where("policy.ownerId IN (:...userIds)", {
                userIds,
              });
            }
            if (enabledForPerformanceLid) {
              endorsementCompanyQb.andWhere(
                "policy.enabledForPerformanceLid = :enabledForPerformanceLid",
                { enabledForPerformanceLid }
              );
              endorsementCompanyQb.andWhere(
                "endorsement.enabledForPerformanceLid = :endorsementEnabledForPerformanceLid",
                { endorsementEnabledForPerformanceLid: enabledForPerformanceLid }
              );
            }
            if (range.start && range.end) {
              endorsementCompanyQb.andWhere(
                `${filterByBusinessDate ? "endorsement.dateOfBusiness" : "endorsement.dateOfIncome"} BETWEEN :start AND :end`,
                {
                  start: range.start,
                  end: range.end,
                }
              );
            }
            applyCompanySummaryRecordFilters(endorsementCompanyQb);
            // Mirror of the policy leg's company search above.
            if (searchBy) {
              if (!isNaN(Number(searchBy))) {
                endorsementCompanyQb.andWhere(
                  "policy.companyId = :endorsementSearchCompanyId",
                  { endorsementSearchCompanyId: Number(searchBy) }
                );
              } else {
                endorsementCompanyQb.andWhere(
                  "company.companyName ILIKE :endorsementSearchBy",
                  { endorsementSearchBy: `%${searchBy}%` }
                );
              }
            }
            if (
              businessPerformanceType !== undefined &&
              businessPerformanceType !== null &&
              businessPerformanceType !== DEFAULT_VALUES.ACTUAL
            ) {
              if (businessPerformanceType === DEFAULT_VALUES.OPPORTUNITY_TYPE) {
                endorsementCompanyQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
                  }
                );
              }
              if (
                businessPerformanceType ===
                DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE
              ) {
                endorsementCompanyQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
                  }
                );
              }
            }

            // if (isLeadership === true) {
              if (organisationId && organisationId.length > 0) {
                endorsementCompanyQb.andWhere(
                  "endorsement.organisationId IN (:...organisationId)",
                  { organisationId }
                );
              }
              if (sbuId !== undefined && sbuId !== null) {
                endorsementCompanyQb.andWhere("endorsement.sbuId = :sbuId", {
                  sbuId,
                });
              }
              if (verticalId !== undefined && verticalId !== null) {
                endorsementCompanyQb.andWhere("endorsement.verticalId IN (:...verticalId)", {
                  verticalId,
                });
              }
              if (departmentId !== undefined && departmentId !== null) {
                endorsementCompanyQb.andWhere(
                  "endorsement.departmentId = :departmentId",
                  {
                    departmentId,
                  }
                );
              }
              if (branchId !== undefined && branchId !== null) {
                endorsementCompanyQb.andWhere(
                  "endorsement.branchId IN (:...branchId)",
                  {
                    branchId,
                  }
                );
              }
            // }
            // Combine with UNION ALL and sum in outer query. Income type keeps
            // its listing semantics: policy-only or endorsement-only drops the
            // other leg entirely (same pattern as the policyDetails/coInsurer
            // legs).
            let combinedCompanyParameters: Record<string, any>;
            if (includePolicyRecords && includeEndorsementRecords) {
              unionCompanyQuery = `(${policyCompanyQb.getQuery()} UNION ALL ${endorsementCompanyQb.getQuery()})`;
              combinedCompanyParameters = {
                ...policyCompanyQb.getParameters(),
                ...endorsementCompanyQb.getParameters(),
                ...endorsementSource.parameters,
              };
            } else if (includePolicyRecords) {
              unionCompanyQuery = `(${policyCompanyQb.getQuery()})`;
              combinedCompanyParameters = {
                ...policyCompanyQb.getParameters(),
              };
            } else {
              unionCompanyQuery = `(${endorsementCompanyQb.getQuery()})`;
              combinedCompanyParameters = {
                ...endorsementCompanyQb.getParameters(),
                ...endorsementSource.parameters,
              };
            }
            // Company grain is company×org×sbu×vertical: a company operating
            // across multiple SBUs/verticals intentionally produces one row per
            // combination. The Enhanced Companies table surfaces SBU + Vertical
            // columns (see getCompanyColumns) so those rows read as distinct
            // rather than as duplicates. Same grain feeds the normal Biz Done
            // page's "Company Summary" export sheet.
            companySummarySelect = [
              `"customerName" AS "customerName"`,
              `SUM(COALESCE("grossPremium", 0))::float8 AS "grossPremium"`,
              `SUM(COALESCE("terrorismCommissionAmount", 0))::float8 AS "terrorismCommissionAmount"`,
              `SUM(COALESCE("basicBrokerageAmount", 0))::float8 AS "basicBrokerageAmount"`,
              `SUM(COALESCE("premiumCollected", 0))::float8 AS "premiumCollected"`,
              `SUM(COALESCE("brokerageCollected", 0))::float8 AS "brokerageCollected"`,
              `SUM(COALESCE("netPremium", 0))::float8 AS "netPremium"`,
              `SUM(COALESCE("lankaNetPremium", 0))::float8 AS "lankaNetPremium"`,
              `SUM(COALESCE("lankaGrossPremium", 0))::float8 AS "lankaGrossPremium"`,
              `SUM(COALESCE("totalBrokerageAmount", 0))::float8 AS "totalBrokerageAmount"`,
              `"companyId" AS "companyId"`,
              `"iirmOrganisation" AS "iirmOrganisation"`,
              `"sbuName" AS "sbuName"`,
              `"verticalName" AS "verticalName"`,
            ];
            finalCompanyQb = policyRepository.manager
              .createQueryBuilder()
              .select(companySummarySelect)
              .from(unionCompanyQuery, "combined")
              .groupBy(`"companyId"`)
              .addGroupBy(`"customerName"`)
              .addGroupBy(`"iirmOrganisation"`)
              .addGroupBy(`"sbuName"`)
              .addGroupBy(`"verticalName"`)
              .setParameters(combinedCompanyParameters);
            // Grid sort wins; otherwise keep the historical alphabetical order.
            // companyId trails so pagination is deterministic when the sorted
            // column has ties (many companies share an org/SBU) — but only when
            // it is not itself the sorted column, since addOrderBy on the same
            // expression would overwrite the requested direction.
            companySortTerms = resolveReportSort(
              sort,
              fields,
              collectSelectAliases(companySummarySelect),
              { aliasCandidates: COMPANY_SUMMARY_SORT_CANDIDATES }
            );
            if (!applyReportSort(finalCompanyQb, companySortTerms)) {
              finalCompanyQb.orderBy(`"customerName"`, "ASC");
            }
            if (
              !companySortTerms.some((t) => t.expression === `"companyId"`)
            ) {
              finalCompanyQb.addOrderBy(`"companyId"`, "ASC");
            }
            finalCompanyQb.offset(offset).limit(batchSize);
            // Grouped-company count for the paginated listing (Biz Done
            // Enhanced companies table). Exports (fetchAll) never read it.
            if (!fetchAll) {
              totalCount = await getQueryCount(
                finalCompanyQb.clone().offset(undefined).limit(undefined),
                "company_count_source"
              );
            }
            query = finalCompanyQb;
            break;

          case "policySummary":
            policyPolicyQb = policyRepository
              .createQueryBuilder("policy")
              .leftJoin(Organisation, "organisation", "organisation.id = policy.organisationId")
              .leftJoin(OrgSbu, "sbu", "sbu.id = policy.sbuId")
              .leftJoin(OrgVertical, "vertical", "vertical.id = policy.verticalId")
              .select([
                `policy.policyName AS "policyCategory"`,
                `SUM(COALESCE(policy.grossPremium, 0)) AS "grossPremium"`,
                `SUM(COALESCE(policy.premiumCollected, 0)) AS "premiumCollected"`,
                `SUM(COALESCE(policy.basicBrokerageAmount, 0)) AS "basicBrokerageAmount"`,
                `SUM(COALESCE(policy.brokerageCollected, 0)) AS "brokerageCollected"`,
                `SUM(${POLICY_TERRORISM_BROKERAGE}) AS "terrorismCommissionAmount"`,
                `SUM(COALESCE(policy.netPremium, 0)) AS "netPremium"`,
                `SUM(COALESCE(policy.basicPremium, 0) + COALESCE(policy.srccAmount, 0) + COALESCE(policy.terrorismAmount, 0)) AS "lankaNetPremium"`,
                `SUM(COALESCE(policy.basicPremium, 0) + COALESCE(policy.srccAmount, 0) + COALESCE(policy.terrorismAmount, 0) + COALESCE(policy.adminCharges, 0) + COALESCE(policy.otherAmount, 0) + COALESCE(policy.cessAmount, 0) + COALESCE(policy.feeAmount, 0) + COALESCE(policy.gstAmount, 0)) AS "lankaGrossPremium"`,
                `SUM(COALESCE(policy.basicBrokerageAmount, 0) + COALESCE(policy.srccBrokerageAmount, 0) + ${POLICY_TERRORISM_BROKERAGE} + COALESCE(policy.feeAmount, 0)) AS "totalBrokerageAmount"`,
                `organisation.name AS "iirmOrganisation"`,
                `sbu.name AS "sbuName"`,
                `vertical.name AS "verticalName"`,
              ])
              .groupBy(`policy.policyName`)
              .addGroupBy(`organisation.name`)
              .addGroupBy(`sbu.name`)
              .addGroupBy(`vertical.name`);

            if (userIds && userIds.length > 0 && isLeadership === false) {
              policyPolicyQb.where("policy.ownerId IN (:...userIds)", {
                userIds,
              });
            }
            if (enabledForPerformanceLid) {
              policyPolicyQb.andWhere(
                "policy.enabledForPerformanceLid = :enabledForPerformanceLid",
                { enabledForPerformanceLid }
              );
            }
            if (range.start && range.end) {
              policyPolicyQb.andWhere(
                "policy.dateOfIncome BETWEEN :start AND :end",
                {
                  start: range.start,
                  end: range.end,
                }
              );
            }
            if (
              businessPerformanceType !== undefined &&
              businessPerformanceType !== null &&
              businessPerformanceType !== DEFAULT_VALUES.ACTUAL
            ) {
              if (businessPerformanceType === DEFAULT_VALUES.OPPORTUNITY_TYPE) {
                policyPolicyQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
                  }
                );
              }
              if (
                businessPerformanceType ===
                DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE
              ) {
                policyPolicyQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
                  }
                );
              }
            }
            // if (isLeadership === true) {
              if (organisationId && organisationId.length > 0) {
                policyPolicyQb.andWhere(
                  "policy.organisationId IN (:...organisationId)",
                  { organisationId }
                );
              }
              if (sbuId !== undefined && sbuId !== null) {
                policyPolicyQb.andWhere("policy.sbuId = :sbuId", { sbuId });
              }
              if (verticalId !== undefined && verticalId !== null) {
                policyPolicyQb.andWhere("policy.verticalId IN (:...verticalId)", {
                  verticalId,
                });
              }
              if (departmentId !== undefined && departmentId !== null) {
                policyPolicyQb.andWhere(
                  "policy.departmentId = :departmentId",
                  {
                    departmentId,
                  }
                );
              }
              if (branchId !== undefined && branchId !== null) {
                policyPolicyQb.andWhere(
                  "policy.branchId IN (:...branchId)",
                  {
                    branchId,
                  }
                );
              }
            // }

            // Endorsement part
            endorsementPolicyQb = policyRepository.manager
              .createQueryBuilder()
              .from(endorsementSource.query, "endorsement")
              .innerJoin(Policy, "policy", "policy.id = endorsement.policyId")
              .leftJoin(Organisation, "organisation", "organisation.id = endorsement.organisationId")
              .leftJoin(OrgSbu, "sbu", "sbu.id = endorsement.sbuId")
              .leftJoin(OrgVertical, "vertical", "vertical.id = endorsement.verticalId")
              .select([
                `policy.policyName AS "policyCategory"`,
                `SUM(COALESCE(endorsement.grossPremium, 0)) AS "grossPremium"`,
                `SUM(COALESCE(endorsement.premiumCollected, 0)) AS "premiumCollected"`,
                `SUM(COALESCE(endorsement.basicBrokerageAmount, 0)) AS "basicBrokerageAmount"`,
                `SUM(COALESCE(endorsement.brokerageCollected, 0)) AS "brokerageCollected"`,
                `SUM(${ENDORSEMENT_TERRORISM_BROKERAGE}) AS "terrorismCommissionAmount"`,
                `SUM(COALESCE(endorsement.netPremium, 0)) AS "netPremium"`,
                `SUM(COALESCE(endorsement.basicPremium, 0) + COALESCE(endorsement.srccAmount, 0) + COALESCE(endorsement.terrorismAmount, 0)) AS "lankaNetPremium"`,
                `SUM(COALESCE(endorsement.basicPremium, 0) + COALESCE(endorsement.srccAmount, 0) + COALESCE(endorsement.terrorismAmount, 0) + COALESCE(endorsement.adminCharges, 0) + COALESCE(endorsement.otherAmount, 0) + COALESCE(endorsement.cessAmount, 0) + COALESCE(endorsement.feeAmount, 0) + COALESCE(endorsement.gstAmount, 0)) AS "lankaGrossPremium"`,
                `SUM(COALESCE(endorsement.basicBrokerageAmount, 0) + COALESCE(endorsement.srccBrokerageAmount, 0) + ${ENDORSEMENT_TERRORISM_BROKERAGE} + COALESCE(endorsement.feeAmount, 0)) AS "totalBrokerageAmount"`,
                `organisation.name AS "iirmOrganisation"`,
                `sbu.name AS "sbuName"`,
                `vertical.name AS "verticalName"`,
              ])
              .groupBy(`policy.policyName`)
              .addGroupBy(`organisation.name`)
              .addGroupBy(`sbu.name`)
              .addGroupBy(`vertical.name`);

            if (userIds && userIds.length > 0 && isLeadership === false) {
              endorsementPolicyQb.where("policy.ownerId IN (:...userIds)", {
                userIds,
              });
            }
            if (enabledForPerformanceLid) {
              endorsementPolicyQb.andWhere(
                "policy.enabledForPerformanceLid = :enabledForPerformanceLid",
                { enabledForPerformanceLid }
              );
              endorsementPolicyQb.andWhere(
                "endorsement.enabledForPerformanceLid = :endorsementEnabledForPerformanceLid",
                { endorsementEnabledForPerformanceLid: enabledForPerformanceLid }
              );
            }
            if (range.start && range.end) {
              endorsementPolicyQb.andWhere(
                "endorsement.dateOfIncome BETWEEN :start AND :end",
                {
                  start: range.start,
                  end: range.end,
                }
              );
            }
            if (
              businessPerformanceType !== undefined &&
              businessPerformanceType !== null &&
              businessPerformanceType !== DEFAULT_VALUES.ACTUAL
            ) {
              if (businessPerformanceType === DEFAULT_VALUES.OPPORTUNITY_TYPE) {
                endorsementPolicyQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
                  }
                );
              }
              if (
                businessPerformanceType ===
                DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE
              ) {
                endorsementPolicyQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
                  }
                );
              }
            }
            // if (isLeadership === true) {
              if (organisationId && organisationId.length > 0) {
                endorsementPolicyQb.andWhere(
                  "endorsement.organisationId IN (:...organisationId)",
                  { organisationId }
                );
              }
              if (sbuId !== undefined && sbuId !== null) {
                endorsementPolicyQb.andWhere("endorsement.sbuId = :sbuId", {
                  sbuId,
                });
              }
              if (verticalId !== undefined && verticalId !== null) {
                endorsementPolicyQb.andWhere("endorsement.verticalId IN (:...verticalId)", {
                  verticalId,
                });
              }
              if (departmentId !== undefined && departmentId !== null) {
                endorsementPolicyQb.andWhere(
                  "endorsement.departmentId = :departmentId",
                  {
                    departmentId,
                  }
                );
              }
              if (branchId !== undefined && branchId !== null) {
                endorsementPolicyQb.andWhere(
                  "endorsement.branchId IN (:...branchId)",
                  {
                    branchId,
                  }
                );
              }
            // }

            // Combine with UNION ALL and sum in outer query
            unionPolicyQuery = `(${policyPolicyQb.getQuery()} UNION ALL ${endorsementPolicyQb.getQuery()})`;
            finalPolicyQb = policyRepository.manager
              .createQueryBuilder()
              .select([
                `"policyCategory" AS "policyCategory"`,
                `SUM(COALESCE("grossPremium", 0))::float8 AS "grossPremium"`,
                `SUM(COALESCE("terrorismCommissionAmount", 0))::float8 AS "terrorismCommissionAmount"`,
                `SUM(COALESCE("premiumCollected", 0))::float8 AS "premiumCollected"`,
                `SUM(COALESCE("basicBrokerageAmount", 0))::float8 AS "basicBrokerageAmount"`,
                `SUM(COALESCE("brokerageCollected", 0))::float8 AS "brokerageCollected"`,
                `SUM(COALESCE("netPremium", 0))::float8 AS "netPremium"`,
                `SUM(COALESCE("lankaNetPremium", 0))::float8 AS "lankaNetPremium"`,
                `SUM(COALESCE("lankaGrossPremium", 0))::float8 AS "lankaGrossPremium"`,
                `SUM(COALESCE("totalBrokerageAmount", 0))::float8 AS "totalBrokerageAmount"`,
                `"iirmOrganisation" AS "iirmOrganisation"`,
                `"sbuName" AS "sbuName"`,
                `"verticalName" AS "verticalName"`,
              ])
              .from(unionPolicyQuery, "combined")
              .groupBy(`"policyCategory"`)
              .addGroupBy(`"iirmOrganisation"`)
              .addGroupBy(`"sbuName"`)
              .addGroupBy(`"verticalName"`)
              .setParameters({
                ...policyPolicyQb.getParameters(),
                ...endorsementPolicyQb.getParameters(),
                ...endorsementSource.parameters,
              })
              .orderBy(`"policyCategory"`, "ASC")
              .offset(offset)
              .limit(batchSize);

            query = finalPolicyQb;
            break;

          case "insurerSummary":
            policyInsurerQb = policyRepository
              .createQueryBuilder("policy")
              .innerJoin("policy.insurerMappings", "insurerMappings")
              .innerJoin("insurerMappings.insurer", "insurer")
              .leftJoin(Organisation, "organisation", "organisation.id = policy.organisationId")
              .leftJoin(OrgSbu, "sbu", "sbu.id = policy.sbuId")
              .leftJoin(OrgVertical, "vertical", "vertical.id = policy.verticalId")
              .where(
                "insurerMappings.insurerParticipationTypeLid = :leadInsurerLid",
                { leadInsurerLid }
              )
              .select([
                `insurer.insurerName AS "insurerName"`,
                `SUM(COALESCE(policy.grossPremium, 0)) AS "grossPremium"`,
                `SUM(COALESCE(policy.premiumCollected, 0)) AS "premiumCollected"`,
                `SUM(COALESCE(policy.basicBrokerageAmount, 0)) AS "basicBrokerageAmount"`,
                `SUM(COALESCE(policy.brokerageCollected, 0)) AS "brokerageCollected"`,
                `SUM(${POLICY_TERRORISM_BROKERAGE}) AS "terrorismCommissionAmount"`,
                `SUM(COALESCE(policy.netPremium, 0)) AS "netPremium"`,
                `SUM(COALESCE(policy.basicPremium, 0) + COALESCE(policy.srccAmount, 0) + COALESCE(policy.terrorismAmount, 0)) AS "lankaNetPremium"`,
                `SUM(COALESCE(policy.basicPremium, 0) + COALESCE(policy.srccAmount, 0) + COALESCE(policy.terrorismAmount, 0) + COALESCE(policy.adminCharges, 0) + COALESCE(policy.otherAmount, 0) + COALESCE(policy.cessAmount, 0) + COALESCE(policy.feeAmount, 0) + COALESCE(policy.gstAmount, 0)) AS "lankaGrossPremium"`,
                `SUM(COALESCE(policy.basicBrokerageAmount, 0) + COALESCE(policy.srccBrokerageAmount, 0) + ${POLICY_TERRORISM_BROKERAGE} + COALESCE(policy.feeAmount, 0)) AS "totalBrokerageAmount"`,
                `organisation.name AS "iirmOrganisation"`,
                `sbu.name AS "sbuName"`,
                `vertical.name AS "verticalName"`,
              ])
              .groupBy(`insurer.insurerName`)
              .addGroupBy(`organisation.name`)
              .addGroupBy(`sbu.name`)
              .addGroupBy(`vertical.name`);

            if (userIds && userIds.length > 0 && isLeadership === false) {
              policyInsurerQb.andWhere("policy.ownerId IN (:...userIds)", {
                userIds,
              });
            }
            if (enabledForPerformanceLid) {
              policyInsurerQb.andWhere(
                "policy.enabledForPerformanceLid = :enabledForPerformanceLid",
                { enabledForPerformanceLid }
              );
            }
            if (
              businessPerformanceType !== undefined &&
              businessPerformanceType !== null &&
              businessPerformanceType !== DEFAULT_VALUES.ACTUAL
            ) {
              if (businessPerformanceType === DEFAULT_VALUES.OPPORTUNITY_TYPE) {
                policyInsurerQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
                  }
                );
              }
              if (
                businessPerformanceType ===
                DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE
              ) {
                policyInsurerQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
                  }
                );
              }
            }
            if (insurerId) {
              policyInsurerQb.andWhere("insurer.id = :insurerId", {
                insurerId,
              });
            }
            if (range.start && range.end) {
              policyInsurerQb.andWhere(
                "policy.dateOfIncome BETWEEN :start AND :end",
                {
                  start: range.start,
                  end: range.end,
                }
              );
            }

            // if (isLeadership === true) {
              if (organisationId && organisationId.length > 0) {
                policyInsurerQb.andWhere(
                  "policy.organisationId IN (:...organisationId)",
                  { organisationId }
                );
              }
              if (sbuId !== undefined && sbuId !== null) {
                policyInsurerQb.andWhere("policy.sbuId = :sbuId", { sbuId });
              }
              if (verticalId !== undefined && verticalId !== null) {
                policyInsurerQb.andWhere("policy.verticalId IN (:...verticalId)", {
                  verticalId,
                });
              }
              if (departmentId !== undefined && departmentId !== null) {
                policyInsurerQb.andWhere(
                  "policy.departmentId = :departmentId",
                  {
                    departmentId,
                  }
                );
              }
              if (branchId !== undefined && branchId !== null) {
                policyInsurerQb.andWhere(
                  "policy.branchId IN (:...branchId)",
                  {
                    branchId,
                  }
                );
              }
            // }
            // Endorsement part
            endorsementInsurerQb = policyRepository.manager
              .createQueryBuilder()
              .from(endorsementSource.query, "endorsement")
              .innerJoin(Policy, "policy", "policy.id = endorsement.policyId")
              .innerJoin("policy.insurerMappings", "insurerMappings")
              .innerJoin("insurerMappings.insurer", "insurer")
              .leftJoin(Organisation, "organisation", "organisation.id = endorsement.organisationId")
              .leftJoin(OrgSbu, "sbu", "sbu.id = endorsement.sbuId")
              .leftJoin(OrgVertical, "vertical", "vertical.id = endorsement.verticalId")
              .where(
                "insurerMappings.insurerParticipationTypeLid = :leadInsurerLid",
                { leadInsurerLid }
              )
              .select([
                `insurer.insurerName AS "insurerName"`,
                `SUM(COALESCE(endorsement.grossPremium, 0)) AS "grossPremium"`,
                `SUM(COALESCE(endorsement.premiumCollected, 0)) AS "premiumCollected"`,
                `SUM(COALESCE(endorsement.basicBrokerageAmount, 0)) AS "basicBrokerageAmount"`,
                `SUM(COALESCE(endorsement.brokerageCollected, 0)) AS "brokerageCollected"`,
                `SUM(${ENDORSEMENT_TERRORISM_BROKERAGE}) AS "terrorismCommissionAmount"`,
                `SUM(COALESCE(endorsement.netPremium, 0)) AS "netPremium"`,
                `SUM(COALESCE(endorsement.basicPremium, 0) + COALESCE(endorsement.srccAmount, 0) + COALESCE(endorsement.terrorismAmount, 0)) AS "lankaNetPremium"`,
                `SUM(COALESCE(endorsement.basicPremium, 0) + COALESCE(endorsement.srccAmount, 0) + COALESCE(endorsement.terrorismAmount, 0) + COALESCE(endorsement.adminCharges, 0) + COALESCE(endorsement.otherAmount, 0) + COALESCE(endorsement.cessAmount, 0) + COALESCE(endorsement.feeAmount, 0) + COALESCE(endorsement.gstAmount, 0)) AS "lankaGrossPremium"`,
                `SUM(COALESCE(endorsement.basicBrokerageAmount, 0) + COALESCE(endorsement.srccBrokerageAmount, 0) + ${ENDORSEMENT_TERRORISM_BROKERAGE} + COALESCE(endorsement.feeAmount, 0)) AS "totalBrokerageAmount"`,
                `organisation.name AS "iirmOrganisation"`,
                `sbu.name AS "sbuName"`,
                `vertical.name AS "verticalName"`,
              ])
              .groupBy(`insurer.insurerName`)
              .addGroupBy(`organisation.name`)
              .addGroupBy(`sbu.name`)
              .addGroupBy(`vertical.name`);

            if (userIds && userIds.length > 0 && isLeadership === false) {
              endorsementInsurerQb.andWhere("policy.ownerId IN (:...userIds)", {
                userIds,
              });
            }
            if (enabledForPerformanceLid) {
              endorsementInsurerQb.andWhere(
                "policy.enabledForPerformanceLid = :enabledForPerformanceLid",
                { enabledForPerformanceLid }
              );
              endorsementInsurerQb.andWhere(
                "endorsement.enabledForPerformanceLid = :endorsementEnabledForPerformanceLid",
                { endorsementEnabledForPerformanceLid: enabledForPerformanceLid }
              );
            }
            if (
              businessPerformanceType !== undefined &&
              businessPerformanceType !== null &&
              businessPerformanceType !== DEFAULT_VALUES.ACTUAL
            ) {
              if (businessPerformanceType === DEFAULT_VALUES.OPPORTUNITY_TYPE) {
                endorsementInsurerQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
                  }
                );
              }
              if (
                businessPerformanceType ===
                DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE
              ) {
                endorsementInsurerQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
                  }
                );
              }
            }
            if (insurerId) {
              endorsementInsurerQb.andWhere("insurer.id = :insurerId", {
                insurerId,
              });
            }

            if (range.start && range.end) {
              endorsementInsurerQb.andWhere(
                "endorsement.dateOfIncome BETWEEN :start AND :end",
                {
                  start: range.start,
                  end: range.end,
                }
              );
            }
            // if (isLeadership === true) {
              if (organisationId && organisationId.length > 0) {
                endorsementInsurerQb.andWhere(
                  "endorsement.organisationId IN (:...organisationId)",
                  { organisationId }
                );
              }
              if (sbuId !== undefined && sbuId !== null) {
                endorsementInsurerQb.andWhere("endorsement.sbuId = :sbuId", {
                  sbuId,
                });
              }
              if (verticalId !== undefined && verticalId !== null) {
                endorsementInsurerQb.andWhere("endorsement.verticalId IN (:...verticalId)", {
                  verticalId,
                });
              }
              if (departmentId !== undefined && departmentId !== null) {
                endorsementInsurerQb.andWhere(
                  "endorsement.departmentId = :departmentId",
                  {
                    departmentId,
                  }
                );
              }
              if (branchId !== undefined && branchId !== null) {
                endorsementInsurerQb.andWhere(
                  "endorsement.branchId IN (:...branchId)",
                  {
                    branchId,
                  }
                );
              }
            // }
            // Combine with UNION ALL and sum in outer query
            unionInsurerQuery = `(${policyInsurerQb.getQuery()} UNION ALL ${endorsementInsurerQb.getQuery()})`;
            finalInsurerQb = policyRepository.manager
              .createQueryBuilder()
              .select([
                `"insurerName" AS "insurerName"`,
                `SUM(COALESCE("grossPremium", 0))::float8 AS "grossPremium"`,
                `SUM(COALESCE("terrorismCommissionAmount", 0))::float8 AS "terrorismCommissionAmount"`,
                `SUM(COALESCE("premiumCollected", 0))::float8 AS "premiumCollected"`,
                `SUM(COALESCE("basicBrokerageAmount", 0))::float8 AS "basicBrokerageAmount"`,
                `SUM(COALESCE("brokerageCollected", 0))::float8 AS "brokerageCollected"`,
                `SUM(COALESCE("netPremium", 0))::float8 AS "netPremium"`,
                `SUM(COALESCE("lankaNetPremium", 0))::float8 AS "lankaNetPremium"`,
                `SUM(COALESCE("lankaGrossPremium", 0))::float8 AS "lankaGrossPremium"`,
                `SUM(COALESCE("totalBrokerageAmount", 0))::float8 AS "totalBrokerageAmount"`,
                `"iirmOrganisation" AS "iirmOrganisation"`,
                `"sbuName" AS "sbuName"`,
                `"verticalName" AS "verticalName"`,
              ])
              .from(unionInsurerQuery, "combined")
              .groupBy(`"insurerName"`)
              .addGroupBy(`"iirmOrganisation"`)
              .addGroupBy(`"sbuName"`)
              .addGroupBy(`"verticalName"`)
              .setParameters({
                ...policyInsurerQb.getParameters(),
                ...endorsementInsurerQb.getParameters(),
                ...endorsementSource.parameters,
              })
              .orderBy(`"insurerName"`, "ASC")
              .offset(offset)
              .limit(batchSize);

            query = finalInsurerQb;
            break;

          case "policyDetails":
          // Captured from the policy branch's .select() below so the reward
          // UNION branch is generated with an identical, position-aligned column
          // list (Postgres UNION matches columns by position, not name).
          let policyDetailsColumns: string[] = [];
          policyQb = policyRepository.createQueryBuilder("policy");
            if (userIds && userIds.length > 0 && isLeadership === false) {
              policyQb.where("policy.ownerId IN (:...userIds)", { userIds });
            }
            if (enabledForPerformanceLid) {
              policyQb.andWhere(
                "policy.enabledForPerformanceLid = :enabledForPerformanceLid",
                { enabledForPerformanceLid }
              );
            }
            if (range.start && range.end) {
              const policyDateField = filterByBusinessDate ? "policy.dateOfBusiness" : "policy.dateOfIncome";
              policyQb.andWhere(`${policyDateField} BETWEEN :start AND :end`, {
                start: range.start,
                end: range.end,
              });
            }
            if (searchBy) {
              if (!isNaN(Number(searchBy))) {
                policyQb.andWhere("policy.companyId = :companyId", { companyId: Number(searchBy) });
              } else {
                policyQb.andWhere("company.companyName ILIKE :searchBy", { searchBy: `%${searchBy}%` });
              }
            }

            if (policyType) {
              policyQb.andWhere("policyTypeLookup.lookUpValue = :policyType", { policyType });
            }

            if (groupCompanyId) {
              policyQb.andWhere("gcm.groupCompanyId = :groupCompanyId", { groupCompanyId });
            }

            if (brokerId) {
              policyQb.andWhere("policy.broker_id = :brokerId", { brokerId });
            }

            if (
              businessPerformanceType !== undefined &&
              businessPerformanceType !== null &&
              businessPerformanceType !== DEFAULT_VALUES.ACTUAL
            ) {
              if (businessPerformanceType === DEFAULT_VALUES.OPPORTUNITY_TYPE) {
                policyQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
                  }
                );
              }
              if (
                businessPerformanceType ===
                DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE
              ) {
                policyQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
                  }
                );
              }
            }

            // if (isLeadership === true) {
              if (organisationId && organisationId.length > 0) {
                policyQb.andWhere("policy.organisationId IN (:...organisationId)", {
                  organisationId,
                });
              }
              if (sbuId !== undefined && sbuId !== null) {
                policyQb.andWhere("policy.sbuId = :sbuId", {
                  sbuId,
                });
              }
              if (verticalId !== undefined && verticalId !== null) {
                policyQb.andWhere("policy.verticalId IN (:...verticalId)", {
                  verticalId,
                });
              }
              if (departmentId !== undefined && departmentId !== null) {
                policyQb.andWhere("policy.departmentId = :departmentId", {
                  departmentId,
                });
              }
              if (branchId !== undefined && branchId !== null) {
                policyQb.andWhere("policy.branchId IN (:...branchId)", {
                  branchId,
                });
              }
            // }
            if (!allowAllInsurer) {
              policyQb.andWhere(
                "insurerMappings.insurerParticipationTypeLid = :leadInsurerLid",
                {
                  leadInsurerLid,
                }
              );
            }

            if (insurerId) {
              policyQb.andWhere("insurer.id = :insurerId", {
                insurerId,
              });
            }

            if (branchIds && branchIds.length > 0) {
              policyQb.andWhere("address.id IN (:...branchIds)", {
                branchIds,
              });
            }

            policyQuery = policyQb
              .leftJoin(
                "policy.insurerMappings",
                "insurerMappings",
                "insurerMappings.insurerParticipationTypeLid = :leadInsurerLid",
                { leadInsurerLid }
              )
              .leftJoin("insurerMappings.insurer", "insurer")
              .leftJoin("insurerMappings.insurerBranch", "address")
              .leftJoin("address.cityId", "city")
              .innerJoin("policy.company", "company")
              .innerJoin("policy.owner", "employee")
              .leftJoin(Organisation, "organisation", "organisation.id = policy.organisationId")
              .leftJoin(OrgSbu, "sbu", "sbu.id = policy.sbuId")
              .leftJoin(OrgBranch, "branch", "branch.id = policy.branchId")
              .leftJoin(OrgVertical, "vertical", "vertical.id = policy.verticalId")
              .leftJoin(OrgDepartment, "department", "department.id = policy.departmentId")
              .leftJoin(PolicyTypeSegregation, "policyTypeSegregation", "policy.policyTypeLid = policyTypeSegregation.policyTypeLid")
              .leftJoin(LookUp, "iirmPolicyType", "policyTypeSegregation.iirmPolicyTypeLid = iirmPolicyType.id")
              .leftJoin(LookUp, "policyTypeLookup", "policy.policyTypeLid = policyTypeLookup.id")
              .leftJoin(GroupCompanyMap, "gcm", "gcm.companyId = company.id")
              .leftJoin("gcm.groupCompany", "parentCompany")
              .leftJoin(User, "leadCrmUser", "leadCrmUser.userId = company.leadCrm")
              .leftJoin(User, "associateCrmUser", "associateCrmUser.userId = company.associateCrmId")
              .leftJoin(User, "accountManagerUser", "accountManagerUser.userId = company.accountManager")
              .leftJoin(User, "crmTeamLeadUser", "crmTeamLeadUser.userId = leadCrmUser.reportingUserId")
              .leftJoin(User, "crmManagerUser", "crmManagerUser.userId = crmTeamLeadUser.reportingUserId")
              .leftJoin(User, "centralOpsTeamLeadUser", "centralOpsTeamLeadUser.userId = company.centralOpsTeamLeadId")
              .leftJoin(User, "centralOpsLeadUser", "centralOpsLeadUser.userId = company.centralOpsLeadId")
              .leftJoin(Employee, "policyOwnerEmployee", "policyOwnerEmployee.userId = policy.ownerId")
              .leftJoin(Employee, "reportingManagerEmployee", "reportingManagerEmployee.employeeId = policyOwnerEmployee.reportingManagerEmployeeId")
              .leftJoin(
                (qb: any) => buildBrokerMediatorSource(qb),
                "brokermediator",
                "brokermediator.broker_opportunity_id = policy.opportunityId"
              )
              .leftJoin(Broker, "policyBroker", "policyBroker.id = policy.brokerId")
              // Label joins for the *Sort aliases below: these three columns are
              // rendered from lookUpMapData in the row mapper, so the base
              // select only carries the lookup id. Ordering on the id would look
              // random to a user; ordering on the label matches what they see.
              .leftJoin(LookUp, "customerCategoryLookup", "customerCategoryLookup.id = company.priorityLid")
              .leftJoin(LookUp, "policyStatusLookup", "policyStatusLookup.id = policy.policyStatusLid")
              .leftJoin(LookUp, "dealConfirmedLookup", "dealConfirmedLookup.id = policy.dealConfirmedLid")
              .select(policyDetailsColumns = [
                `policy.id AS "policyId"`,
                `policy.id::text AS "iirmRefNo"`,
                `TO_CHAR(policy.createdAt, 'DD/MM/YYYY') AS "createdAt"`,
                `policy.insurerPolicyNumber AS "insurancePolicyNumber"`,
                `policy.policyName AS "policyName"`,
                `TO_CHAR(policy.incomeMonth, 'Mon-YYYY') AS "incomeMonth"`,
                `TO_CHAR(policy.businessMonth, 'Mon-YYYY') AS "businessMonth"`,
                `TO_CHAR(policy.dateOfBusiness, 'DD/MM/YYYY') AS "dateOfBusiness"`,
                `iirmPolicyType.lookUpValue AS "policyCategory"`,
                `TO_CHAR(policy.policyFrom, 'DD/MM/YYYY') AS "policyFrom"`,
                `TO_CHAR(policy.policyTo, 'DD/MM/YYYY') AS "policyTo"`,
                `insurerMappings.sharePercentage AS "sharePercentage"`,
                `policy.insurerEndorsementNumber AS "insEndNo"`,
                `TO_CHAR(policy.dateOfIncome, 'DD/MM/YYYY') AS "dateOfIncome"`,
                `policy.netPremium AS "netPremium"`,
                `policy.terrorismAmount AS "terrorism"`,
                `policy.otherAmount AS "other"`,
                `(COALESCE(policy.netPremium, 0) + COALESCE(policy.terrorismAmount, 0) + COALESCE(policy.otherAmount, 0)) AS "totalNetPremium"`,
                `policy.basicBrokerageAmount AS "basicBrokerageAmount"`,
                `policy.premiumCollected AS "premiumCollected"`,
                `policy.brokerageCollected AS "brokerageCollected"`,
                `policy.basicBrokeragePercentage AS "basicBrokeragePercentage"`,
                `policy.brokerageAmountAsperIwork AS "brokerageAmountAsPerIwork"`,
                `policy.brokerageAmountAsperIsg AS "brokerageAmountAsEnteredByIsg"`,
                `policy.feeAmount AS "fees"`,
                `policy.grossPremium AS "grossPremium"`,
                `${POLICY_TERRORISM_BROKERAGE} AS "terrorismCommissionAmount"`,
                `policy.terrorismBrokeragePercentage AS "terrorismCommissionPercentage"`,
                `policy.gstPercentage AS "gstPercentage"`,
                `policy.gstPercentage AS "gstPercentageValue"`,
                `policy.gst AS "gstValue"`,
                `policy.gstAmount AS "serviceTax"`,
                `policy.policyStatusLid as "policyStatus"`,
                `policy.dealConfirmedLid as "dealConfirmedLid"`,
                `company.id AS "companyId"`,
                `company.priorityLid as "customerCategory"`,
                `company.companyName AS "companyName"`,
                `employee.firstName as "empFirstName"`,
                `employee.lastName as "empLastName"`,
                `branch.name as "empBranchName"`,
                `department.name as "empDepartmentName"`,
                `vertical.name as "empVerticalName"`,
                `organisation.name As "empOrganisationName"`,
                `sbu.name As "empSbuName"`,
                `CASE WHEN policy.ingestedMode = 'SQL_LOAD' THEN 'U' ELSE 'A' END AS "ingestedMode"`,
                `insurer.displayName AS "insurerName"`,
                `city.name AS "insurerBranch"`,
                `'policy' AS "recordType"`,
                `'iirm' AS "policyGroup"`,
                `'general' AS "companyVertical"`,
                `insurerMappings.shareAmount AS "shareAmount"`,
                `insurerMappings.brokerageAmount AS "insurerBrokerageAmount"`,
                `insurerMappings.brokeragePercentage AS "insurerBrokeragePercentage"`,
                `policy.basicPremium AS "basicPremium"`,
                `policy.srccAmount AS "srccAmount"`,
                `policy.terrorismAmount AS "terrorismAmount"`,
                `( COALESCE("policy"."basic_premium", 0) + COALESCE("policy"."srcc_amount", 0) + COALESCE("policy"."terrorism_amount", 0)) AS "lankaNetPremium"`,
                `policy.adminCharges AS "adminCharges"`,
                `policy.otherAmount AS "stampDuty"`,
                `policy.cessAmount AS "cessAmount"`,
                `policy.feeAmount AS "policyFee"`,
                `ROUND((((COALESCE(policy.basicPremium, 0) + COALESCE(policy.srccAmount, 0) + COALESCE(policy.terrorismAmount, 0) + COALESCE(policy.adminCharges, 0) + COALESCE(policy.otherAmount, 0) + COALESCE(policy.cessAmount, 0) + COALESCE(policy.feeAmount, 0)) * COALESCE(policy.gstPercentage,0)) / 100)::numeric, 2) AS "vatPercentage"`,
                `policy.gstAmount AS "vatAmount"`,
                `(COALESCE(policy.basicPremium, 0) + COALESCE(policy.srccAmount, 0) + COALESCE(policy.terrorismAmount, 0) + COALESCE(policy.adminCharges, 0) + COALESCE(policy.otherAmount, 0) + COALESCE(policy.cessAmount, 0) + COALESCE(policy.feeAmount, 0) + COALESCE(policy.gstAmount, 0)) AS "lankaGrossPremium"`,
                `policy.basicBrokeragePercentage AS "basicBrokeragePercentage"`,
                `policy.srccPercentage AS "srccbrokeragepercentage"`,
                `policy.commissionTerrorism AS "tcbrokerageAmount"`,
                // `policy.basicBrokerageAmount AS "basicBrokerageAmount"`,
                `policy.srccBrokerageAmount AS "srccBrokerageAmount"`,
                `policy.tcBrokerageAmount AS "tcBrokerageAmount"`,
                `(COALESCE(policy.basicBrokerageAmount, 0) + COALESCE(policy.srccBrokerageAmount, 0) + ${POLICY_TERRORISM_BROKERAGE} + COALESCE(policy.feeAmount, 0)) AS "totalBrokerageAmount"`,
                `policy.uniqueIworkedgeReference AS "uniqueIworkedgeReference"`,
                `policy.uniqueExternalReference AS "uniqueExternalReference"`,
                `parentCompany.companyName AS "parentCompanyName"`,
                `CONCAT(leadCrmUser.firstName, ' ', leadCrmUser.lastName) AS "leadCrm"`,
                `CONCAT(associateCrmUser.firstName, ' ', associateCrmUser.lastName) AS "associateCrm"`,
                `CONCAT(accountManagerUser.firstName, ' ', accountManagerUser.lastName) AS "accountManager"`,
                `CONCAT(crmTeamLeadUser.firstName, ' ', crmTeamLeadUser.lastName) AS "crmTeamLead"`,
                `CONCAT(crmManagerUser.firstName, ' ', crmManagerUser.lastName) AS "crmManager"`,
                `CONCAT(centralOpsTeamLeadUser.firstName, ' ', centralOpsTeamLeadUser.lastName) AS "centralOpsTeamLead"`,
                `CONCAT(centralOpsLeadUser.firstName, ' ', centralOpsLeadUser.lastName) AS "centralOpsLead"`,
                `CONCAT(reportingManagerEmployee.firstName, ' ', reportingManagerEmployee.lastName) AS "policyOwnerReportingManager"`,
                `policy.iworkUniqueId AS "iworkUniqueId"`,
                `policy.opportunityId AS "opportunityId"`,
                // Opportunity type, displayed as New/Renewal rather than the stored
                // SO/RO. Mapped here in SQL (not in the row mapper) so the grid,
                // the Excel export and ORDER BY all agree on one label.
                // No ::text cast on the property: TypeORM's property-name
                // replacement terminates a match only on ' =),', so
                // `policy.opportunityType::text` would be read as one property
                // name, left unreplaced, and reach Postgres as the non-existent
                // `policy.opportunitytype`.
                `CASE policy.opportunityType WHEN 'SO' THEN 'New' WHEN 'RO' THEN 'Renewal' ELSE policy.opportunityType END AS "opportunityType"`,
                brokerAgentSelect,
                // Shared with the reward union branch (Biz Done listing). NULL
                // for policy rows; populated only for insurer rewards.
                `organisation.name AS "iirmOrganisation"`,
                `NULL::text AS "rewardCategory"`,
                `NULL::text AS "remarks"`,
                // --- sort-only aliases (never mapped into a response row) ---
                // The displayed date/month columns above are TO_CHAR text, so
                // ordering on them is lexical: 'DD/MM/YYYY' sorts by day and
                // 'Mon-YYYY' sorts Apr before Jan. These carry the raw values so
                // ORDER BY is chronological. Keep this block LAST and identical
                // in the endorsement branch — Postgres UNION matches columns by
                // position, and the reward branch is generated from this list.
                `policy.dateOfIncome AS "dateOfIncomeSort"`,
                `policy.dateOfBusiness AS "dateOfBusinessSort"`,
                `policy.policyFrom AS "policyFromSort"`,
                `policy.policyTo AS "policyToSort"`,
                `policy.createdAt AS "createdAtSort"`,
                `policy.incomeMonth AS "incomeMonthSort"`,
                `policy.businessMonth AS "businessMonthSort"`,
                // Owner name is concatenated in the row mapper, so there is no
                // single alias to sort on.
                `CONCAT(employee.firstName, ' ', employee.lastName) AS "empNameSort"`,
                `customerCategoryLookup.lookUpValue AS "customerCategorySort"`,
                `policyStatusLookup.lookUpValue AS "policyStatusSort"`,
                `dealConfirmedLookup.lookUpValue AS "dealConfirmedSort"`,
              ]);

            endorsementQb = policyRepository.manager
              .createQueryBuilder()
              .from(endorsementSource.query, "endorsement")
              .setParameters(endorsementSource.parameters)
              .innerJoin(Policy, "policy", "policy.id = endorsement.policyId")
              // Lead-mapping-only LEFT join — same rationale as the policy
              // branch above: one row per endorsement record, matching the KPI.
              .leftJoin(
                "policy.insurerMappings",
                "insurerMappings",
                "insurerMappings.insurerParticipationTypeLid = :leadInsurerLid",
                { leadInsurerLid }
              )
              .leftJoin("insurerMappings.insurer", "insurer")
              .leftJoin("insurerMappings.insurerBranch", "address")
              .leftJoin("address.cityId", "city")
              .innerJoin("policy.company", "company")
              .innerJoin("policy.owner", "employee")
              .leftJoin(Organisation, "organisation", "organisation.id = endorsement.organisationId")
              .leftJoin(OrgSbu, "sbu", "sbu.id = endorsement.sbuId")
              .leftJoin(OrgBranch, "branch", "branch.id = endorsement.branchId")
              .leftJoin(OrgVertical, "vertical", "vertical.id = endorsement.verticalId")
              .leftJoin(OrgDepartment, "department", "department.id = endorsement.departmentId")
              .leftJoin(PolicyTypeSegregation, "policyTypeSegregation", "policy.policyTypeLid = policyTypeSegregation.policyTypeLid")
              .leftJoin(LookUp, "iirmPolicyType", "policyTypeSegregation.iirmPolicyTypeLid = iirmPolicyType.id")
              .leftJoin(LookUp, "policyTypeLookup", "policy.policyTypeLid = policyTypeLookup.id")
              .leftJoin(GroupCompanyMap, "gcm", "gcm.companyId = company.id")
              .leftJoin("gcm.groupCompany", "parentCompany")
              .leftJoin(User, "leadCrmUser", "leadCrmUser.userId = company.leadCrm")
              .leftJoin(User, "associateCrmUser", "associateCrmUser.userId = company.associateCrmId")
              .leftJoin(User, "accountManagerUser", "accountManagerUser.userId = company.accountManager")
              .leftJoin(User, "crmTeamLeadUser", "crmTeamLeadUser.userId = leadCrmUser.reportingUserId")
              .leftJoin(User, "crmManagerUser", "crmManagerUser.userId = crmTeamLeadUser.reportingUserId")
              .leftJoin(User, "centralOpsTeamLeadUser", "centralOpsTeamLeadUser.userId = company.centralOpsTeamLeadId")
              .leftJoin(User, "centralOpsLeadUser", "centralOpsLeadUser.userId = company.centralOpsLeadId")
              .leftJoin(Employee, "policyOwnerEmployee", "policyOwnerEmployee.userId = policy.ownerId")
              .leftJoin(Employee, "reportingManagerEmployee", "reportingManagerEmployee.employeeId = policyOwnerEmployee.reportingManagerEmployeeId")
              .leftJoin(
                (qb: any) => buildBrokerMediatorSource(qb),
                "brokermediator",
                "brokermediator.broker_opportunity_id = policy.opportunityId"
              )
              .leftJoin(Broker, "policyBroker", "policyBroker.id = policy.brokerId")
              // Same label joins as the policy branch — see the note there.
              .leftJoin(LookUp, "customerCategoryLookup", "customerCategoryLookup.id = company.priorityLid")
              .leftJoin(LookUp, "policyStatusLookup", "policyStatusLookup.id = policy.policyStatusLid")
              .leftJoin(LookUp, "dealConfirmedLookup", "dealConfirmedLookup.id = policy.dealConfirmedLid")
              .select([
                `policy.id AS "policyId"`,
                `endorsement.endorsementId AS "iirmRefNo"`,
                `TO_CHAR(policy.createdAt, 'DD/MM/YYYY') AS "createdAt"`,
                `policy.insurerPolicyNumber AS "insurancePolicyNumber"`,
                `policy.policyName AS "policyName"`,
                `TO_CHAR(endorsement.incomeMonth, 'Mon-YYYY') AS "incomeMonth"`,
                `TO_CHAR(endorsement.businessMonth, 'Mon-YYYY') AS "businessMonth"`,
                `TO_CHAR(endorsement.dateOfBusiness, 'DD/MM/YYYY') AS "dateOfBusiness"`,
                `iirmPolicyType.lookUpValue AS "policyCategory"`,
                `TO_CHAR(policy.policyFrom, 'DD/MM/YYYY') AS "policyFrom"`,
                `TO_CHAR(policy.policyTo, 'DD/MM/YYYY') AS "policyTo"`,
                `insurerMappings.sharePercentage AS "sharePercentage"`,
                `endorsement.insurerEndorsementNumber AS "insEndNo"`,
                `TO_CHAR(endorsement.dateOfIncome, 'DD/MM/YYYY') AS "dateOfIncome"`,
                `endorsement.netPremium AS "netPremium"`,
                `endorsement.terrorismAmount AS "terrorism"`,
                `endorsement.otherAmount AS "other"`,
                `(COALESCE(endorsement.netPremium, 0) + COALESCE(endorsement.terrorismAmount, 0) + COALESCE(endorsement.otherAmount, 0)) AS "totalNetPremium"`,
                `endorsement.basicBrokerageAmount AS "basicBrokerageAmount"`,
                `endorsement.premiumCollected AS "premiumCollected"`,
                `endorsement.brokerageCollected AS "brokerageCollected"`,
                `endorsement.basicBrokeragePercentage AS "basicBrokeragePercentage"`,
                `endorsement.brokerageAmountAsperIwork AS "brokerageAmountAsPerIwork"`,
                `endorsement.brokerageAmountAsperIsg AS "brokerageAmountAsEnteredByIsg"`,
                `endorsement.feeAmount AS "fees"`,
                `endorsement.grossPremium AS "grossPremium"`,
                `${ENDORSEMENT_TERRORISM_BROKERAGE} AS "terrorismCommissionAmount"`,
                `endorsement.terrorismBrokeragePercentage AS "terrorismCommissionPercentage"`,
                `endorsement.gstAmount AS "gstPercentage"`,
                `endorsement.gstPercentage AS "gstPercentageValue"`,
                `NULL::numeric AS "gstValue"`,
                `endorsement.gstAmount AS "serviceTax"`,
                `policy.policyStatusLid AS "policyStatus"`,
                `policy.dealConfirmedLid AS "dealConfirmedLid"`,
                `company.id AS "companyId"`,
                `company.priorityLid AS "customerCategory"`,
                `company.companyName AS "companyName"`,
                `employee.firstName AS "empFirstName"`,
                `employee.lastName AS "empLastName"`,
                `branch.name AS "empBranchName"`,
                `department.name AS "empDepartmentName"`,
                `vertical.name AS "empVerticalName"`,
                `organisation.name AS "empOrganisationName"`,
                `sbu.name AS "empSbuName"`,
                `CASE WHEN endorsement.ingestedMode = 'SQL_LOAD' THEN 'U' ELSE 'A' END AS "ingestedMode"`,
                `insurer.displayName AS "insurerName"`,
                `city.name AS "insurerBranch"`,
                `'endorsement' AS "recordType"`,
                `'iirm' AS "policyGroup"`,
                `'general' AS "companyVertical"`,
                `insurerMappings.shareAmount AS "shareAmount"`,
                `insurerMappings.brokerageAmount AS "insurerBrokerageAmount"`,
                `insurerMappings.brokeragePercentage AS "insurerBrokeragePercentage"`,
                `endorsement.basicPremium AS "basicPremium"`,
                `endorsement.srccAmount AS "srccAmount"`,
                `endorsement.terrorismAmount AS "terrorismAmount"`,
                `(COALESCE(endorsement.basicPremium, 0) + COALESCE(endorsement.srccAmount, 0) + COALESCE(endorsement.terrorismAmount, 0)) AS "lankaNetPremium"`,
                `endorsement.adminCharges AS "adminCharges"`,
                `endorsement.otherAmount AS "stampDuty"`,
                `endorsement.cessAmount AS "cessAmount"`,
                `endorsement.feeAmount AS "policyFee"`,
                `ROUND((((COALESCE(endorsement.basicPremium, 0) + COALESCE(endorsement.srccAmount, 0) + COALESCE(endorsement.terrorismAmount, 0) + COALESCE(endorsement.adminCharges, 0) + COALESCE(endorsement.otherAmount, 0) + COALESCE(endorsement.cessAmount, 0) + COALESCE(endorsement.feeAmount, 0)) * COALESCE(endorsement.gstAmount,0)) / 100)::numeric, 2) AS "vatPercentage"`,
                `endorsement.gstAmount AS "vatAmount"`,
                `(COALESCE(endorsement.basicPremium, 0) + COALESCE(endorsement.srccAmount, 0) + COALESCE(endorsement.terrorismAmount, 0) + COALESCE(endorsement.adminCharges, 0) + COALESCE(endorsement.otherAmount, 0) + COALESCE(endorsement.cessAmount, 0) + COALESCE(endorsement.feeAmount, 0) + COALESCE(endorsement.gstAmount, 0)) AS "lankaGrossPremium"`,
                `endorsement.basicBrokeragePercentage AS "basicBrokeragePercentage"`,
                `endorsement.srccPercentage AS "srccbrokeragepercentage"`,
                `endorsement.terrorismBrokeragePercentage AS "tcbrokerageAmount"`,
                // `endorsement.basicBrokerageAmount AS "basicBrokerageAmount"`,
                `endorsement.srccBrokerageAmount AS "srccBrokerageAmount"`,
                `endorsement.tcBrokerageAmount AS "tcBrokerageAmount"`,
                `(COALESCE(endorsement.basicBrokerageAmount, 0) + COALESCE(endorsement.srccBrokerageAmount, 0) + ${ENDORSEMENT_TERRORISM_BROKERAGE} + COALESCE(endorsement.feeAmount, 0)) AS "totalBrokerageAmount"`,
                `endorsement.uniqueIworkedgeReference AS "uniqueIworkedgeReference"`,
                `endorsement.uniqueExternalReference AS "uniqueExternalReference"`,
                `parentCompany.companyName AS "parentCompanyName"`,
                `CONCAT(leadCrmUser.firstName, ' ', leadCrmUser.lastName) AS "leadCrm"`,
                `CONCAT(associateCrmUser.firstName, ' ', associateCrmUser.lastName) AS "associateCrm"`,
                `CONCAT(accountManagerUser.firstName, ' ', accountManagerUser.lastName) AS "accountManager"`,
                `CONCAT(crmTeamLeadUser.firstName, ' ', crmTeamLeadUser.lastName) AS "crmTeamLead"`,
                `CONCAT(crmManagerUser.firstName, ' ', crmManagerUser.lastName) AS "crmManager"`,
                `CONCAT(centralOpsTeamLeadUser.firstName, ' ', centralOpsTeamLeadUser.lastName) AS "centralOpsTeamLead"`,
                `CONCAT(centralOpsLeadUser.firstName, ' ', centralOpsLeadUser.lastName) AS "centralOpsLead"`,
                `CONCAT(reportingManagerEmployee.firstName, ' ', reportingManagerEmployee.lastName) AS "policyOwnerReportingManager"`,
                `policy.iworkUniqueId AS "iworkUniqueId"`,
                `policy.opportunityId AS "opportunityId"`,
                // Policy-only column: endorsements inherit no opportunity type.
                `NULL::text AS "opportunityType"`,
                brokerAgentSelect,
                // Kept column-aligned with the policy branch + reward union.
                `organisation.name AS "iirmOrganisation"`,
                `NULL::text AS "rewardCategory"`,
                `NULL::text AS "remarks"`,
                // --- sort-only aliases: must match the policy branch block
                // position-for-position (UNION matches by position, not name).
                // The endorsement leg's own dates win where it has them; policy
                // from/to and createdAt have no endorsement counterpart.
                `endorsement.dateOfIncome AS "dateOfIncomeSort"`,
                `endorsement.dateOfBusiness AS "dateOfBusinessSort"`,
                `policy.policyFrom AS "policyFromSort"`,
                `policy.policyTo AS "policyToSort"`,
                `policy.createdAt AS "createdAtSort"`,
                `endorsement.incomeMonth AS "incomeMonthSort"`,
                `endorsement.businessMonth AS "businessMonthSort"`,
                `CONCAT(employee.firstName, ' ', employee.lastName) AS "empNameSort"`,
                `customerCategoryLookup.lookUpValue AS "customerCategorySort"`,
                `policyStatusLookup.lookUpValue AS "policyStatusSort"`,
                `dealConfirmedLookup.lookUpValue AS "dealConfirmedSort"`,
              ]);

            if (userIds && userIds.length > 0 && isLeadership === false) {
              endorsementQb.where("policy.ownerId IN (:...userIds)", {
                userIds,
              });
            }
            if (enabledForPerformanceLid) {
              endorsementQb.andWhere(
                "policy.enabledForPerformanceLid = :enabledForPerformanceLid",
                { enabledForPerformanceLid }
              );
              endorsementQb.andWhere(
                "endorsement.enabledForPerformanceLid = :endorsementEnabledForPerformanceLid",
                { endorsementEnabledForPerformanceLid: enabledForPerformanceLid }
              );
            }
            if (range.start && range.end) {
              const endorsementDateField = filterByBusinessDate ? "endorsement.dateOfBusiness" : "endorsement.dateOfIncome";
              endorsementQb.andWhere(
                `${endorsementDateField} BETWEEN :start AND :end`,
                {
                  start: range.start,
                  end: range.end,
                }
              );
            }
            if (
              businessPerformanceType !== undefined &&
              businessPerformanceType !== null &&
              businessPerformanceType !== DEFAULT_VALUES.ACTUAL
            ) {
              if (businessPerformanceType === DEFAULT_VALUES.OPPORTUNITY_TYPE) {
                endorsementQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
                  }
                );
              }
              if (
                businessPerformanceType ===
                DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE
              ) {
                endorsementQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
                  }
                );
              }
            }
            if (insurerId) {
              endorsementQb.andWhere("insurer.id = :insurerId", {
                insurerId,
              });
            }

            if (branchIds && branchIds.length > 0) {
              endorsementQb.andWhere("address.id IN (:...branchIds)", {
                branchIds,
              });
            }

            if (searchBy) {
              if (!isNaN(Number(searchBy))) {
                endorsementQb.andWhere("policy.companyId = :companyId", { companyId: Number(searchBy) });
              } else {
                endorsementQb.andWhere("company.companyName ILIKE :searchBy", { searchBy: `%${searchBy}%` });
              }
            }

            if (policyType) {
              endorsementQb.andWhere("policyTypeLookup.lookUpValue = :policyType", { policyType });
            }

            if (groupCompanyId) {
              endorsementQb.andWhere("gcm.groupCompanyId = :groupCompanyId", { groupCompanyId });
            }

            if (brokerId) {
              endorsementQb.andWhere("policy.broker_id = :brokerId", { brokerId });
            }

            // if (isLeadership === true) {
              if (organisationId && organisationId.length > 0) {
                endorsementQb.andWhere(
                  "endorsement.organisationId IN (:...organisationIds)",
                  { organisationIds: organisationId }
                );
              }
              if (sbuId !== undefined && sbuId !== null) {
                endorsementQb.andWhere("endorsement.sbuId = :sbuId", {
                  sbuId,
                });
              }
              if (verticalId !== undefined && verticalId !== null) {
                endorsementQb.andWhere("endorsement.verticalId IN (:...verticalId)", {
                  verticalId,
                });
              }
              if (departmentId !== undefined && departmentId !== null) {
                endorsementQb.andWhere("endorsement.departmentId = :departmentId", {
                  departmentId,
                });
              }
              if (branchId !== undefined && branchId !== null) {
                endorsementQb.andWhere("endorsement.branchId IN (:...branchId)", {
                  branchId,
                });
              }
            // }

            if (!allowAllInsurer) {
              endorsementQb.andWhere(
                "insurerMappings.insurerParticipationTypeLid = :leadInsurerLid",
                {
                  leadInsurerLid,
                }
              );
            }
            // Reward UNION branch (Biz Done listing only). Column list is
            // generated from policyDetailsColumns so it stays position-aligned
            // with the policy/endorsement branches. Reward-irrelevant columns
            // resolve to NULL.
            let rewardQb: any = null;
            if (includeRewardRecords) {
              const rewardExprByAlias: Record<string, string> = {
                policyId: "NULL::int",
                incomeMonth: "TO_CHAR(r.date_of_income, 'Mon-YYYY')",
                dateOfIncome: "TO_CHAR(r.date_of_income, 'DD/MM/YYYY')",
                businessMonth:
                  "(SELECT STRING_AGG(TO_CHAR(rbm.business_month, 'Mon-YYYY'), ', ' ORDER BY rbm.business_month) FROM reward_business_month rbm WHERE rbm.reward_id = r.id)",
                insurerName: "ins.display_name",
                // Both feed the "Brokerage Amount" column: obj.brokerageAmount is
                // set from insurerBrokerageAmount, then overwritten by
                // basicBrokerageAmount via brokerageAmountLabel. Map both so the
                // reward amount shows regardless of that path.
                insurerBrokerageAmount: "r.reward_amount",
                basicBrokerageAmount: "r.reward_amount",
                recordType: "'rewards'",
                iirmOrganisation: "org.name",
                rewardCategory: "cat.value",
                remarks: "r.remarks",
                createdAt: "TO_CHAR(r.created_at, 'DD/MM/YYYY')",
                // Sort-only aliases. Every alias not listed here resolves to
                // NULL, which applyReportSort pushes to the end of the page via
                // NULLS LAST — rewards carry no policy dates or lookups.
                dateOfIncomeSort: "r.date_of_income",
                incomeMonthSort: "r.date_of_income",
                createdAtSort: "r.created_at",
              };
              const rewardColumns = policyDetailsColumns.map((col) => {
                const alias = (col.match(/AS\s+"([^"]+)"\s*$/i) || [])[1] || "";
                return `${rewardExprByAlias[alias] ?? "NULL"} AS "${alias}"`;
              });
              rewardQb = policyRepository.manager
                .createQueryBuilder(Reward, "r")
                .select(rewardColumns)
                .leftJoin(Insurer, "ins", "ins.id = r.insurer_id")
                .leftJoin(Organisation, "org", "org.id = r.organisation_id")
                .leftJoin(LookUp, "cat", "cat.id = r.reward_category_lid")
                .where("r.deleted_at IS NULL");
              // Rewards have no owner hierarchy; scope by the explicit reward org
              // list (leadership: selected orgs or null = all; others: own org).
              if (
                Array.isArray(rewardOrganisationIds) &&
                rewardOrganisationIds.length
              ) {
                rewardQb.andWhere("r.organisation_id IN (:...rewardOrgIds)", {
                  rewardOrgIds: rewardOrganisationIds,
                });
              }
              if (insurerId) {
                rewardQb.andWhere("r.insurer_id = :rewardInsurerId", {
                  rewardInsurerId: insurerId,
                });
              }
              if (range.start && range.end) {
                if (filterByBusinessDate) {
                  rewardQb.andWhere(
                    "EXISTS (SELECT 1 FROM reward_business_month rbmf WHERE rbmf.reward_id = r.id AND rbmf.business_month BETWEEN :rewardStart AND :rewardEnd)",
                    { rewardStart: range.start, rewardEnd: range.end },
                  );
                } else {
                  rewardQb.andWhere(
                    "r.date_of_income BETWEEN :rewardStart AND :rewardEnd",
                    { rewardStart: range.start, rewardEnd: range.end },
                  );
                }
              }
            }

            // Only the paginated listing (fetchAll=false) reads totalCount —
            // see policy.service.ts's Biz Done listing. Exports stream every
            // row and the Excel writer ignores it, so skip the counts entirely
            // there: each one re-executes the whole union, which costs about as
            // much as fetching a batch. Mirrors companySummary's !fetchAll gate.
            if (!fetchAll && cachedTotalCount === undefined) {
              policyCount = includePolicyRecords
                ? await getQueryCount(policyQuery, "policy_count_source")
                : 0;
              endorsementCount = includeEndorsementRecords
                ? await getQueryCount(endorsementQb, "endorsement_count_source")
                : 0;
              const rewardCount = rewardQb
                ? await getQueryCount(rewardQb, "reward_count_source")
                : 0;
              cachedTotalCount =
                policyCount + endorsementCount + rewardCount;
            }
            totalCount = cachedTotalCount;

            const detailsBranches: string[] = [];
            let combinedDetailsParameters: Record<string, any> = {};
            if (includePolicyRecords) {
              detailsBranches.push(policyQuery.getQuery());
              Object.assign(
                combinedDetailsParameters,
                policyQuery.getParameters(),
              );
            }
            if (includeEndorsementRecords) {
              detailsBranches.push(endorsementQb.getQuery());
              Object.assign(
                combinedDetailsParameters,
                endorsementQb.getParameters(),
                endorsementSource.parameters,
              );
            }
            if (rewardQb) {
              detailsBranches.push(rewardQb.getQuery());
              Object.assign(combinedDetailsParameters, rewardQb.getParameters());
            }
            if (detailsBranches.length) {
              unionQuery = `(${detailsBranches.join(" UNION ALL ")})`;
            } else {
              // Nothing selected (e.g. export with incomeType=rewards): valid
              // query, correct columns, zero rows.
              unionQuery = `(SELECT * FROM (${policyQuery.getQuery()}) empty_source WHERE FALSE)`;
              Object.assign(
                combinedDetailsParameters,
                policyQuery.getParameters(),
              );
            }
            finalQb = policyRepository.manager
              .createQueryBuilder()
              .select("*")
              .from(unionQuery, "combined_results")
              .setParameters(combinedDetailsParameters);
            // Grid sort wins; otherwise the historical chronological default.
            // policyId always trails as a tiebreaker so pagination is stable.
            if (
              !applyReportSort(
                finalQb,
                resolveReportSort(
                  sort,
                  fields,
                  collectSelectAliases(policyDetailsColumns),
                  {
                    overrides: POLICY_DETAILS_SORT_OVERRIDES,
                    aliasCandidates: POLICY_DETAILS_SORT_CANDIDATES,
                  }
                )
              )
            ) {
              finalQb.orderBy(`"combined_results"."dateOfIncome"`, "ASC");
            }
            finalQb.addOrderBy(`"combined_results"."policyId"`, "ASC");
            finalQb.offset(offset).limit(batchSize);
            query = finalQb;
            break;

          case "coInsurerDetails":
            policyCoInsurerQb = policyRepository
              .createQueryBuilder("policy")
              .innerJoin("policy.insurerMappings", "insurerMappings")
              .innerJoin("insurerMappings.insurer", "insurer")
              .leftJoin(
                "insurer.insurerAddresses",
                "insurerAddresses",
                "insurerAddresses.addressId = insurerMappings.insurerBranchId"
              )
              .leftJoin("insurerAddresses.address", "address")
              .leftJoin("address.cityId", "city")
              .innerJoin("policy.company", "company")
              .leftJoin(GroupCompanyMap, "gcm", "gcm.companyId = company.id")
              .innerJoin("policy.owner", "employee")
              .leftJoin(Organisation, "organisation", "organisation.id = policy.organisationId")
              .leftJoin(OrgSbu, "sbu", "sbu.id = policy.sbuId")
              .leftJoin(OrgBranch, "branch", "branch.id = policy.branchId")
              .leftJoin(OrgVertical, "vertical", "vertical.id = policy.verticalId")
              .leftJoin(OrgDepartment, "department", "department.id = policy.departmentId")
              .leftJoin(
                (qb: any) => buildBrokerMediatorSource(qb),
                "brokermediator",
                "brokermediator.broker_opportunity_id = policy.opportunityId"
              )
              .leftJoin(Broker, "policyBroker", "policyBroker.id = policy.brokerId")
              .where(
                "insurerMappings.insurerParticipationTypeLid = :coInsurerLid",
                { coInsurerLid }
              )
              .select([
                `policy.id AS "policyId"`,
                `policy.id::text AS "iirmRefNo"`,
                `TO_CHAR(policy.createdAt, 'DD/MM/YYYY') AS "createdAt"`,
                `policy.policyName AS "policyName"`,
                `TO_CHAR(policy.incomeMonth, 'Mon-YYYY') AS "incomeMonth"`,
                `policy.policyName AS "policyCategory"`,
                `TO_CHAR(policy.policyFrom, 'DD/MM/YYYY') AS "policyFrom"`,
                `TO_CHAR(policy.policyTo, 'DD/MM/YYYY') AS "policyTo"`,
                `policy.grossPremium AS "grossPremium"`,
                `policy.insurerEndorsementNumber AS "insEndNo"`,
                `${POLICY_TERRORISM_BROKERAGE} AS "terrorismCommissionAmount"`,
                `policy.gstPercentage AS "gstPercentage"`,
                `TO_CHAR(policy.dateOfIncome, 'DD/MM/YYYY') AS "dateOfIncome"`,
                `policy.otherAmount AS "other"`,
                `policy.netPremium AS "netPremium"`,
                `policy.terrorismAmount AS "terrorism"`,
                `policy.feeAmount AS "fees"`,
                `policy.basicBrokerageAmount AS "basicBrokerageAmount"`,
                `policy.premiumCollected AS "premiumCollected"`,
                `policy.brokerageCollected AS "brokerageCollected"`,
                `policy.basicBrokeragePercentage AS "basicBrokeragePercentage"`,
                `policy.brokerageAmountAsperIwork AS "brokerageAmountAsPerIwork"`,
                `policy.brokerageAmountAsperIsg AS "brokerageAmountAsEnteredByIsg"`,
                `policy.terrorismBrokeragePercentage AS "terrorismCommissionPercentage"`,
                `policy.policyStatusLid AS "policyStatus"`,
                `company.id AS "companyId"`,
                `company.companyName AS "companyName"`,
                `company.priorityLid AS "customerCategory"`,
                `insurer.displayName AS "insurerName"`,
                `policy.dealConfirmedLid AS "dealConfirmedLid"`,
                `employee.firstName AS "empFirstName"`,
                `employee.lastName AS "empLastName"`,
                `branch.name AS "empBranchName"`,
                `department.name AS "empDepartmentName"`,
                `organisation.name AS "empOrganisationName"`,
                `sbu.name AS "empSbuName"`,
                `CASE WHEN policy.ingestedMode = 'SQL_LOAD' THEN 'U' ELSE 'A' END AS "ingestedMode"`,
                `vertical.name AS "empVerticalName"`,
                `city.name AS "insurerBranch"`,
                `'policy' AS "recordType"`,
                `'iirm' AS "policyGroup"`,
                `'general' AS "companyVertical"`,
                `insurerMappings.sharePercentage AS "sharePercentage"`,
                `insurerMappings.shareAmount AS "shareAmount"`,
                `insurerMappings.brokerageAmount AS "insurerBrokerageAmount"`,
                `insurerMappings.brokeragePercentage AS "insurerBrokeragePercentage"`,
                `policy.basicPremium AS "basicPremium"`,
                `policy.srccAmount AS "srccAmount"`,
                `policy.terrorismAmount AS "terrorismAmount"`,
                `( COALESCE("policy"."basic_premium", 0) + COALESCE("policy"."srcc_amount", 0) + COALESCE("policy"."terrorism_amount", 0)) AS "lankaNetPremium"`,
                `policy.adminCharges AS "adminCharges"`,
                `policy.otherAmount AS "stampDuty"`,
                `policy.cessAmount AS "cessAmount"`,
                `policy.feeAmount AS "policyFee"`,
                `ROUND((((COALESCE(policy.basicPremium, 0) + COALESCE(policy.srccAmount, 0) + COALESCE(policy.terrorismAmount, 0) + COALESCE(policy.adminCharges, 0) + COALESCE(policy.otherAmount, 0) + COALESCE(policy.cessAmount, 0) + COALESCE(policy.feeAmount, 0)) * COALESCE(policy.gstPercentage,0)) / 100)::numeric, 2) AS "vatPercentage"`,
                `policy.gstAmount AS "vatAmount"`,
                `(COALESCE(policy.basicPremium, 0) + COALESCE(policy.srccAmount, 0) + COALESCE(policy.terrorismAmount, 0) + COALESCE(policy.adminCharges, 0) + COALESCE(policy.otherAmount, 0) + COALESCE(policy.cessAmount, 0) + COALESCE(policy.feeAmount, 0) + COALESCE(policy.gstAmount, 0)) AS "lankaGrossPremium"`,
                `policy.basicBrokeragePercentage AS "basicBrokeragePercentage"`,
                `policy.srccPercentage AS "srccbrokeragepercentage"`,
                `policy.commissionTerrorism AS "tcbrokerageAmount"`,
                // `policy.basicBrokerageAmount AS "basicBrokerageAmount"`,
                `policy.srccBrokerageAmount AS "srccBrokerageAmount"`,
                `policy.tcBrokerageAmount AS "tcBrokerageAmount"`,
                `(COALESCE(policy.basicBrokerageAmount, 0) + COALESCE(policy.srccBrokerageAmount, 0) + ${POLICY_TERRORISM_BROKERAGE} + COALESCE(policy.feeAmount, 0)) AS "totalBrokerageAmount"`,
                brokerAgentSelect,
              ]);

            if (userIds && userIds.length > 0 && isLeadership === false) {
              policyCoInsurerQb.andWhere("policy.ownerId IN (:...userIds)", {
                userIds,
              });
            }
            if (range.start && range.end) {
              policyCoInsurerQb.andWhere(
                "policy.dateOfIncome BETWEEN :start AND :end",
                {
                  start: range.start,
                  end: range.end,
                }
              );
            }
            if (
              businessPerformanceType !== undefined &&
              businessPerformanceType !== null &&
              businessPerformanceType !== DEFAULT_VALUES.ACTUAL
            ) {
              if (businessPerformanceType === DEFAULT_VALUES.OPPORTUNITY_TYPE) {
                policyCoInsurerQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
                  }
                );
              }
              if (
                businessPerformanceType ===
                DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE
              ) {
                policyCoInsurerQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
                  }
                );
              }
            }
            if (insurerId) {
              policyCoInsurerQb.andWhere("insurer.id = :insurerId", {
                insurerId,
              });
            }
            if (groupCompanyId) {
              policyCoInsurerQb.andWhere("gcm.groupCompanyId = :groupCompanyId", { groupCompanyId });
            }
            if (brokerId) {
              policyCoInsurerQb.andWhere("policy.broker_id = :brokerId", { brokerId });
            }
            if (searchBy) {
              policyCoInsurerQb.andWhere(
                "company.companyName ILIKE :searchBy",
                {
                  searchBy: `%${searchBy}%`,
                }
              );
            }

            // if (isLeadership === true) {
              if (organisationId && organisationId.length > 0) {
                policyCoInsurerQb.andWhere(
                  "policy.organisationId IN (:...organisationId)",
                  { organisationId }
                );
              }
              if (sbuId !== undefined && sbuId !== null) {
                policyCoInsurerQb.andWhere("policy.sbuId = :sbuId", {
                  sbuId,
                });
              }
              if (verticalId !== undefined && verticalId !== null) {
                policyCoInsurerQb.andWhere("policy.verticalId IN (:...verticalId)", {
                  verticalId,
                });
              }
              if (departmentId !== undefined && departmentId !== null) {
                policyCoInsurerQb.andWhere("policy.departmentId = :departmentId", {
                  departmentId,
                });
              }
              if (branchId !== undefined && branchId !== null) {
                policyCoInsurerQb.andWhere("policy.branchId IN (:...branchId)", {
                  branchId,
                });
              }
            // }

            endorsementCoInsurerQb = policyRepository.manager
              .createQueryBuilder()
              .from(endorsementSource.query, "endorsement")
              .innerJoin(Policy, "policy", "policy.id = endorsement.policyId")
              .innerJoin("policy.insurerMappings", "insurerMappings")
              .innerJoin("insurerMappings.insurer", "insurer")
              .leftJoin("insurer.insurerAddresses", "insurerAddresses")
              .leftJoin("insurerAddresses.address", "address")
              .leftJoin("address.cityId", "city")
              .innerJoin("policy.company", "company")
              .leftJoin(GroupCompanyMap, "gcm", "gcm.companyId = company.id")
              .innerJoin("policy.owner", "employee")
              .leftJoin(Organisation, "organisation", "organisation.id = endorsement.organisationId")
              .leftJoin(OrgSbu, "sbu", "sbu.id = endorsement.sbuId")
              .leftJoin(OrgBranch, "branch", "branch.id = endorsement.branchId")
              .leftJoin(OrgVertical, "vertical", "vertical.id = endorsement.verticalId")
              .leftJoin(OrgDepartment, "department", "department.id = endorsement.departmentId")
              .leftJoin(
                (qb: any) => buildBrokerMediatorSource(qb),
                "brokermediator",
                "brokermediator.broker_opportunity_id = policy.opportunityId"
              )
              .leftJoin(Broker, "policyBroker", "policyBroker.id = policy.brokerId")
              .where(
                "insurerMappings.insurerParticipationTypeLid = :coInsurerLid",
                { coInsurerLid }
              )
              .select([
                `policy.id AS "policyId"`,
                `endorsement.endorsementId AS "iirmRefNo"`,
                `TO_CHAR(policy.createdAt, 'DD/MM/YYYY') AS "createdAt"`,
                `policy.policyName AS "policyName"`,
                `TO_CHAR(endorsement.incomeMonth, 'Mon-YYYY') AS "incomeMonth"`,
                `policy.policyName AS "policyCategory"`,
                `TO_CHAR(policy.policyFrom, 'DD/MM/YYYY') AS "policyFrom"`,
                `TO_CHAR(policy.policyTo, 'DD/MM/YYYY') AS "policyTo"`,
                `endorsement.grossPremium AS "grossPremium"`,
                `endorsement.insurerEndorsementNumber AS "insEndNo"`,
                `${ENDORSEMENT_TERRORISM_BROKERAGE} AS "terrorismCommissionAmount"`,
                `endorsement.gstAmount AS "gstAmount"`,
                `TO_CHAR(endorsement.dateOfIncome, 'DD/MM/YYYY') AS "dateOfIncome"`,
                `endorsement.otherAmount AS "other"`,
                `endorsement.netPremium AS "netPremium"`,
                `endorsement.terrorismAmount AS "terrorism"`,
                `endorsement.feeAmount AS "fees"`,
                `endorsement.basicBrokerageAmount AS "basicBrokerageAmount"`,
                `endorsement.premiumCollected AS "premiumCollected"`,
                `endorsement.brokerageCollected AS "brokerageCollected"`,
                `endorsement.basicBrokeragePercentage AS "basicBrokeragePercentage"`,
                `endorsement.brokerageAmountAsperIwork AS "brokerageAmountAsPerIwork"`,
                `endorsement.brokerageAmountAsperIsg AS "brokerageAmountAsEnteredByIsg"`,
                `endorsement.terrorismBrokeragePercentage AS "terrorismCommissionPercentage"`,
                `policy.policyStatusLid As "policyStatus"`,
                `company.id AS "companyId"`,
                `company.companyName AS "companyName"`,
                `company.priorityLid as "customerCategory"`,
                `insurer.displayName AS "insurerName"`,
                `policy.dealConfirmedLid as "dealConfirmedLid"`,
                `employee.firstName as "empFirstName"`,
                `employee.lastName as "empLastName"`,
                `branch.name as "empBranchName"`,
                `department.name as "empDepartmentName"`,
                `organisation.name As "empOrganisationName"`,
                `sbu.name As "empSbuName"`,
                `CASE WHEN endorsement.ingestedMode = 'SQL_LOAD' THEN 'U' ELSE 'A' END AS "ingestedMode"`,
                `vertical.name as "empVerticalName"`,
                `city.name AS "insurerBranch"`,
                `'endorsement' AS "recordType"`,
                `'iirm' AS "policyGroup"`,
                `'general' AS "companyVertical"`,
                `insurerMappings.sharePercentage AS "sharePercentage"`,
                `insurerMappings.shareAmount AS "shareAmount"`,
                `insurerMappings.brokerageAmount AS "insurerBrokerageAmount"`,
                `insurerMappings.brokeragePercentage AS "insurerBrokeragePercentage"`,
                `endorsement.basicPremium AS "basicPremium"`,
                `endorsement.srccAmount AS "srccAmount"`,
                `endorsement.terrorismAmount AS "terrorismAmount"`,
                `(COALESCE(endorsement.basicPremium, 0) + COALESCE(endorsement.srccAmount, 0) + COALESCE(endorsement.terrorismAmount, 0)) AS "lankaNetPremium"`,
                `endorsement.adminCharges AS "adminCharges"`,
                `endorsement.otherAmount AS "stampDuty"`,
                `endorsement.cessAmount AS "cessAmount"`,
                `endorsement.feeAmount AS "policyFee"`,
                `ROUND((((COALESCE(endorsement.basicPremium, 0) + COALESCE(endorsement.srccAmount, 0) + COALESCE(endorsement.terrorismAmount, 0) + COALESCE(endorsement.adminCharges, 0) + COALESCE(endorsement.otherAmount, 0) + COALESCE(endorsement.cessAmount, 0) + COALESCE(endorsement.feeAmount, 0)) * COALESCE(endorsement.gstAmount,0)) / 100)::numeric, 2) AS "vatPercentage"`,
                `endorsement.gstAmount AS "vatAmount"`,
                `(COALESCE(endorsement.basicPremium, 0) + COALESCE(endorsement.srccAmount, 0) + COALESCE(endorsement.terrorismAmount, 0) + COALESCE(endorsement.adminCharges, 0) + COALESCE(endorsement.otherAmount, 0) + COALESCE(endorsement.cessAmount, 0) + COALESCE(endorsement.feeAmount, 0) + COALESCE(endorsement.gstAmount, 0)) AS "lankaGrossPremium"`,
                `endorsement.basicBrokeragePercentage AS "basicBrokeragePercentage"`,
                `endorsement.srccPercentage AS "srccbrokeragepercentage"`,
                `endorsement.terrorismBrokeragePercentage AS "tcbrokerageAmount"`,
                // `endorsement.basicBrokerageAmount AS "basicBrokerageAmount"`,
                `endorsement.srccBrokerageAmount AS "srccBrokerageAmount"`,
                `endorsement.tcBrokerageAmount AS "tcBrokerageAmount"`,
                `(COALESCE(endorsement.basicBrokerageAmount, 0) + COALESCE(endorsement.srccBrokerageAmount, 0) + ${ENDORSEMENT_TERRORISM_BROKERAGE} + COALESCE(endorsement.feeAmount, 0)) AS "totalBrokerageAmount"`,
                brokerAgentSelect,
              ]);

            if (userIds && userIds.length > 0 && isLeadership === false) {
              endorsementCoInsurerQb.andWhere(
                "policy.ownerId IN (:...userIds)",
                { userIds }
              );
            }
            if (
              businessPerformanceType !== undefined &&
              businessPerformanceType !== null &&
              businessPerformanceType !== DEFAULT_VALUES.ACTUAL
            ) {
              if (businessPerformanceType === DEFAULT_VALUES.OPPORTUNITY_TYPE) {
                endorsementCoInsurerQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
                  }
                );
              }
              if (
                businessPerformanceType ===
                DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE
              ) {
                endorsementCoInsurerQb.andWhere(
                  "policy.opportunity_type = :opportunityType",
                  {
                    opportunityType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
                  }
                );
              }
            }
            if (insurerId) {
              endorsementCoInsurerQb.andWhere("insurer.id = :insurerId", {
                insurerId,
              });
            }
            if (groupCompanyId) {
              endorsementCoInsurerQb.andWhere("gcm.groupCompanyId = :groupCompanyId", { groupCompanyId });
            }
            if (brokerId) {
              endorsementCoInsurerQb.andWhere("policy.broker_id = :brokerId", { brokerId });
            }
            if (range.start && range.end) {
              endorsementCoInsurerQb.andWhere(
                "endorsement.dateOfIncome BETWEEN :start AND :end",
                {
                  start: range.start,
                  end: range.end,
                }
              );
            }
            if (searchBy) {
              endorsementCoInsurerQb.andWhere(
                "company.companyName ILIKE :searchBy",
                {
                  searchBy: `%${searchBy}%`,
                }
              );
            }
            if (isLeadership === true) {
              if (organisationId && organisationId.length > 0) {
                endorsementCoInsurerQb.andWhere(
                  "endorsement.organisationId IN (:...organisationId)",
                  { organisationId }
                );
              }
              if (sbuId !== undefined && sbuId !== null) {
                endorsementCoInsurerQb.andWhere("endorsement.sbuId = :sbuId", {
                  sbuId,
                });
              }
              if (verticalId !== undefined && verticalId !== null) {
                endorsementCoInsurerQb.andWhere("endorsement.verticalId IN (:...verticalId)", {
                  verticalId,
                });
              }
              if (departmentId !== undefined && departmentId !== null) {
                endorsementCoInsurerQb.andWhere(
                  "endorsement.departmentId = :departmentId",
                  {
                    departmentId,
                  }
                );
              }
              if (branchId !== undefined && branchId !== null) {
                endorsementCoInsurerQb.andWhere("endorsement.branchId IN (:...branchId)", {
                  branchId,
                });
              }
            }

            let combinedCoInsurerParameters: Record<string, any>;
            if (includePolicyRecords && includeEndorsementRecords) {
              unionCoInsurerQuery = `(${policyCoInsurerQb.getQuery()} UNION ALL ${endorsementCoInsurerQb.getQuery()})`;
              combinedCoInsurerParameters = {
                ...policyCoInsurerQb.getParameters(),
                ...endorsementCoInsurerQb.getParameters(),
                ...endorsementSource.parameters,
              };
            } else if (includePolicyRecords) {
              unionCoInsurerQuery = `(${policyCoInsurerQb.getQuery()})`;
              combinedCoInsurerParameters = {
                ...policyCoInsurerQb.getParameters(),
              };
            } else {
              unionCoInsurerQuery = `(${endorsementCoInsurerQb.getQuery()})`;
              combinedCoInsurerParameters = {
                ...endorsementCoInsurerQb.getParameters(),
                ...endorsementSource.parameters,
              };
            }
            finalCoInsurerQb = policyRepository.manager
              .createQueryBuilder()
              .select("*")
              .from(unionCoInsurerQuery, "combined_results")
              .setParameters(combinedCoInsurerParameters)
              .orderBy(`"combined_results"."dateOfIncome"`, "ASC")
              .addOrderBy(`"combined_results"."policyId"`, "ASC")
              .offset(offset)
              .limit(batchSize);

            query = finalCoInsurerQb;
            break;

          default:
            return;
        }
        const raw = await query.getRawMany();

        if (!raw.length) {
          hasMoreData = false;
          break;
        }

        let data = [] as any[];

        switch (type) {
          case "companySummary":
            data = raw.map((item, idx) => {
              const obj = {};

              Object.entries(fields).forEach(([key, fieldKey]) => {
                // Special handling for serialNumber
                if (key === "serialNumber") {
                  obj[key] = indexOffset + idx + 1;
                  return;
                }

                // Check if this field exists in item
                if (fieldKey in item) {
                  obj[key] = item[fieldKey] ?? null;
                } else {
                  obj[key] = null;
                }
              });
              // Row identity for drilldowns (Biz Done Enhanced's View details
              // → company-scoped policy list). Localization field configs
              // don't carry ids, so surface it explicitly.
              (obj as any).companyId = (item as any).companyId ?? null;
              // The Enhanced Companies table shows SBU + Vertical columns so
              // the company×org×sbu×vertical rows read as distinct. Surface
              // them explicitly too — the localization field config may not
              // carry them, but the query always selects them.
              (obj as any).sbuName = (item as any).sbuName ?? null;
              (obj as any).verticalName = (item as any).verticalName ?? null;
              return obj;
            });
            break;
          case "policySummary":
            data = raw.map((item, idx) => {
              const obj = {};

              Object.entries(fields).forEach(([key, fieldKey]) => {
                // Special handling for serialNumber
                if (key === "serialNumber") {
                  obj[key] = indexOffset + idx + 1;
                  return;
                }

                // Check if this field exists in item
                if (fieldKey in item) {
                  obj[key] = item[fieldKey] ?? null;
                } else {
                  obj[key] = null;
                }
              });
              return obj;
            });
            break;
          case "insurerSummary":
            data = raw.map((item, idx) => {
              const obj = {};

              Object.entries(fields).forEach(([key, fieldKey]) => {
                // Special handling for serialNumber
                if (key === "serialNumber") {
                  obj[key] = indexOffset + idx + 1;
                  return;
                }

                // Check if this field exists in item
                if (fieldKey in item) {
                  obj[key] = item[fieldKey] ?? null;
                } else {
                  obj[key] = null;
                }
              });
              return obj;
            });
            break;
          case "policyDetails":
          case "coInsurerDetails":
            data = raw.map((item, idx) => {
              const obj = {};

              // 1️⃣ Dynamic fields logic (only include fields that exist in item)
              Object.entries(fields).forEach(([key, fieldKey]) => {
                if (fieldKey in item) {
                  obj[key] = item[fieldKey] ?? null;
                } else {
                  obj[key] = null;
                }
              });

              // 2️⃣ Add extra fixed fields

              obj.serialNumber = indexOffset + idx + 1;

              obj.customerCategory = item?.customerCategory
                ? lookUpMapData[item.customerCategory]
                : null;

              const policyOwnerName =
                item?.empFirstName || item?.empLastName
                  ? `${item?.empFirstName ?? ""} ${
                      item?.empLastName ?? ""
                    }`.trim()
                  : null;
              obj.empName = policyOwnerName;
              // "Policy Owner" is the renamed label for the policy owner's name
              // (policyDetails sheet). Keep empName too so other sheets/labels
              // that still map to "empName" continue to work.
              obj.policyOwner = policyOwnerName;

              obj.status = item?.policyStatus
                ? lookUpMapData[item.policyStatus]
                : null;

              obj.brokeragePercentage =
                item?.insurerBrokeragePercentage ??
                item?.brokeragePercentage ??
                null;

              obj.brokerageAmount =
                item?.insurerBrokerageAmount ??
                item?.basicBrokerageAmount ??
                null;

              obj.dealConfirmed = item?.dealConfirmedLid
                ? lookUpMapData[item.dealConfirmedLid]
                : null;

              obj.policyStatus = item?.policyStatus
                ? lookUpMapData[item.policyStatus]
                : null;

              if (brokerageAmountLabel) {
                obj[brokerageAmountLabel] = item?.basicBrokerageAmount ?? null;
              }

              obj.opportunityId = item?.opportunityId ?? null;
              
              obj.brokerName = item?.brokerName ?? null;

              obj.opportunityType = item?.opportunityType ?? null;

              obj.dateOfBusiness = item?.dateOfBusiness ?? null;

              // Reward union columns (Biz Done listing). Only surfaced when the
              // reward branch is active so exports/other callers are unaffected.
              if (includeRewards) {
                const rewardObj = obj as any;
                rewardObj.iirmOrganisation = item?.iirmOrganisation ?? null;
                rewardObj.rewardCategory = item?.rewardCategory ?? null;
                rewardObj.remarks = item?.remarks ?? null;
                rewardObj.incomeType = item?.recordType ?? null;
              }

              return obj;
            });
            break;
        }

        yield {
          rows: data,
          total: totalCount,
        };

        // If not fetching all records, break after first batch
        if (!fetchAll) {
          hasMoreData = false;
          break;
        }

        offset += batchSize;
        indexOffset += raw.length;
        if (raw.length < batchSize) {
          hasMoreData = false;
        }
      }
    };

    // Sheet selection: an explicit multi-select (export) wins; else fall back to
    // the single entityType, else all of the org's available types.
    let typesToProcess: string[];
    if (selectedSheets && selectedSheets.length) {
      const requested = entitityTypes.filter((t) => selectedSheets.includes(t));
      typesToProcess = requested.length ? requested : ["policyDetails"];
    } else {
      typesToProcess = entityType ? [entityType] : entitityTypes;
    }
    // One lookup for the whole export: the sheet's comma grouping has to match
    // what the UI shows, and the UI derives it from this same column.
    const numberFormat = countryId
      ? (
          await this.dataSource
            .getRepository(LocalizationCountry)
            .findOne({ where: { id: countryId } })
        )?.numberFormat ?? null
      : null;

    let sampleHeaders: any = {};
    for (const type of typesToProcess) {
      let yielded = false;
      const localizationFields = await this.getLocalizationFields(
        type,
        countryId
      );
      if (!Object.keys(sampleHeaders).includes(type)) {
        // Broker Agent fallback: the row mapper always emits brokerName, so
        // append it when the localization config has no row for it yet (see
        // database-migrations/sql/srilanka-bizdone-policydetails-field-parity.sql). No-op once
        // that migration has run.
        sampleHeaders[type] = Object.keys(localizationFields);
        if (
          (type === "policyDetails" || type === "coInsurerDetails") &&
          !sampleHeaders[type].includes("brokerName")
        ) {
          sampleHeaders[type].push("brokerName");
        }
      }
      for await (const { rows, total } of runQueryBatch(
        type,
        offset,
        localizationFields
      )) {
        yielded = true;
        yield { type, rows, totalCount: total, sampleHeaders: sampleHeaders, countryId, numberFormat };
      }
      if (!yielded) {
        yield { type, rows: [], totalCount: 0, sampleHeaders: sampleHeaders, countryId, numberFormat };
      }
    }
  }

  async calculateTotals(data: any[], type: string): Promise<any[]> {
    if (!data || data.length === 0) return data;

    const totals: any = { serialNumber: "Totals" };

    switch (type) {
      case "companySummary":
        totals.customerName = "Totals(in Lacs):";
        totals.netPremium = `Net Premium:${data
          .reduce((sum, row) => sum + (parseFloat(row.netPremium) || 0), 0)
          .toFixed(2)}`;
        totals.grossPremium = `Gross Premium:${data
          .reduce((sum, row) => sum + (parseFloat(row.grossPremium) || 0), 0)
          .toFixed(2)}`;
        totals.commissionAmount = `Commission Amt:${data
          .reduce(
            (sum, row) => sum + (parseFloat(row.commissionAmount) || 0),
            0
          )
          .toFixed(2)}`;
        totals.terrorismCommissionAmount = `Terrorism Brokerage Amt:${data
          .reduce(
            (sum, row) =>
              sum + (parseFloat(row.terrorismCommissionAmount) || 0),
            0
          )
          .toFixed(2)}`;
        break;

      case "policySummary":
        totals.policyCategory = "Totals(in Lacs):";
        totals.netPremium = `Net Premium:${data
          .reduce((sum, row) => sum + (parseFloat(row.netPremium) || 0), 0)
          .toFixed(2)}`;
        totals.grossPremium = `Gross Premium:${data
          .reduce((sum, row) => sum + (parseFloat(row.grossPremium) || 0), 0)
          .toFixed(2)}`;
        totals.commissionAmount = `Commission Amt:${data
          .reduce(
            (sum, row) => sum + (parseFloat(row.commissionAmount) || 0),
            0
          )
          .toFixed(2)}`;
        totals.terrorismCommissionAmount = `Terrorism Brokerage Amt:${data
          .reduce(
            (sum, row) =>
              sum + (parseFloat(row.terrorismCommissionAmount) || 0),
            0
          )
          .toFixed(2)}`;
        break;

      case "insurerSummary":
        totals.insurer = "Totals(in Lacs):";

        totals.netPremium = `Net Premium:${data
          .reduce((sum, row) => sum + (parseFloat(row.netPremium) || 0), 0)
          .toFixed(2)}`;
        totals.grossPremium = `Gross Premium:${data
          .reduce((sum, row) => sum + (parseFloat(row.grossPremium) || 0), 0)
          .toFixed(2)}`;
        totals.commissionAmount = `Commission Amt:${data
          .reduce(
            (sum, row) => sum + (parseFloat(row.commissionAmount) || 0),
            0
          )
          .toFixed(2)}`;
        totals.terrorismCommissionAmount = `Terrorism Brokerage Amt:${data
          .reduce(
            (sum, row) =>
              sum + (parseFloat(row.terrorismCommissionAmount) || 0),
            0
          )
          .toFixed(2)}`;
        break;

      case "policyDetails":
        totals.iirmPolNo = "Totals(in Lacs):";
        totals.netPremium = `Net Premium:${data
          .reduce((sum, row) => sum + (parseFloat(row.netPremium) || 0), 0)
          .toFixed(2)}`;
        totals.terrorism = `Terrorism:${data
          .reduce((sum, row) => sum + (parseFloat(row.terrorism) || 0), 0)
          .toFixed(2)}`;
        totals.other = `Other:${data
          .reduce((sum, row) => sum + (parseFloat(row.other) || 0), 0)
          .toFixed(2)}`;
        totals.gstPercentage = `GST Percentage:${data
          .reduce((sum, row) => sum + (parseFloat(row.gstPercentage) || 0), 0)
          .toFixed(2)}`;
        totals.grossPremium = `Gross Premium:${data
          .reduce((sum, row) => sum + (parseFloat(row.grossPremium) || 0), 0)
          .toFixed(2)}`;
        totals.commissionAmountAsEnteredByIsg = `Commission Amt As Entered By ISG:${data
          .reduce(
            (sum, row) =>
              sum + (parseFloat(row.commissionAmountAsEnteredByIsg) || 0),
            0
          )
          .toFixed(2)}`;
        totals.commissionAmountAsPerIwork = `Commission Amt As Per Iwork:${data
          .reduce(
            (sum, row) =>
              sum + (parseFloat(row.commissionAmountAsPerIwork) || 0),
            0
          )
          .toFixed(2)}`;
        totals.fees = `Fees:${data
          .reduce((sum, row) => sum + (parseFloat(row.fees) || 0), 0)
          .toFixed(2)}`;
        totals.terrorismCommissionAmount = `Terrorism Brokerage Amt:${data
          .reduce(
            (sum, row) =>
              sum + (parseFloat(row.terrorismCommissionAmount) || 0),
            0
          )
          .toFixed(2)}`;
        break;

      case "coInsurerDetails":
        totals.iirmPolNO = "Totals(in Lacs):";
        totals.netPremium = `Net Premium:${data
          .reduce((sum, row) => sum + (parseFloat(row.netPremium) || 0), 0)
          .toFixed(2)}`;
        totals.terrorism = `Terrorism:${data
          .reduce((sum, row) => sum + (parseFloat(row.terrorism) || 0), 0)
          .toFixed(2)}`;
        totals.other = `Other:${data
          .reduce((sum, row) => sum + (parseFloat(row.other) || 0), 0)
          .toFixed(2)}`;
        totals.gstPercentage = `GST Percentage:${data
          .reduce((sum, row) => sum + (parseFloat(row.gstPercentage) || 0), 0)
          .toFixed(2)}`;
        totals.grossPremium = `Gross Premium:${data
          .reduce((sum, row) => sum + (parseFloat(row.grossPremium) || 0), 0)
          .toFixed(2)}`;
        totals.commissionAmountAsEnteredByIsg = `Commission Amt As Entered By ISG:${data
          .reduce(
            (sum, row) =>
              sum + (parseFloat(row.commissionAmountAsEnteredByIsg) || 0),
            0
          )
          .toFixed(2)}`;
        totals.fees = `Fees:${data
          .reduce((sum, row) => sum + (parseFloat(row.fees) || 0), 0)
          .toFixed(2)}`;
        totals.terrorismCommissionAmount = `Terrorism Brokerage Amt:${data
          .reduce(
            (sum, row) =>
              sum + (parseFloat(row.terrorismCommissionAmount) || 0),
            0
          )
          .toFixed(2)}`;
        break;
    }

    return [...data, totals];
  }

  async policyDetailsKpi(
    userIds?: number[],
    timeFilter?: string,
    financialYear?: number,
    searchBy?: string,
    isLeadership?: boolean = false,
    organisationId: any[],
    sbuId: any,
    verticalId: any,
    departmentId: any,
    branchId: any,
    insurerId?: number,
    fromDate?: Date,
    toDate?: Date,
    businessPerformanceType?: string,
    businessMonth?: string,
    insurerBranchId?: number,
    branchViewBy?: string,
    incomeType?: string,
    filterByBusinessDate?: boolean,
    policyType?: string,
    groupCompanyId?: number,
    brokerId?: number,
    includeRewards: boolean = false,
    rewardOrganisationIds?: number[] | null
  ): Promise<any> {
    try {
      // Vertical and branch are multiselect filters — see streamPolicyReport.
      if (verticalId !== undefined && verticalId !== null) {
        verticalId = Array.isArray(verticalId) ? verticalId : [verticalId];
      }
      if (branchId !== undefined && branchId !== null) {
        branchId = Array.isArray(branchId) ? branchId : [branchId];
      }
      const rawIncomeType =
        typeof incomeType === "string" ? incomeType.trim().toLowerCase() : "";
      const normalizedIncomeType =
        rawIncomeType === "policy" ||
        rawIncomeType === "endorsement" ||
        rawIncomeType === "rewards"
          ? rawIncomeType
          : undefined;
      const includePolicyRecords =
        normalizedIncomeType === undefined || normalizedIncomeType === "policy";
      const includeEndorsementRecords =
        normalizedIncomeType === undefined ||
        normalizedIncomeType === "endorsement";
      const includeRewardRecords =
        includeRewards &&
        rewardsAllowedFor({
          incomeType,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          insurerBranchId,
          policyType,
          groupCompanyId,
          brokerId,
          searchBy,
        });

      let range: { start?: Date | string; end?: Date | string } = getDateRange(
        timeFilter,
        financialYear
      );
      if (fromDate && toDate) {
        range.start = fromDate;
        range.end = toDate;
      }
      range = this.toBindableRange(range);
      const policyRepository = await this.dataSource.getRepository(Policy);
      const branchIds = await this.resolveInsurerBranchIds(
        insurerBranchId,
        branchViewBy
      );
      const groupPolicyTypeIds = await this.getGroupPolicyTypeIds();
      const endorsementSource = this.buildUnifiedEndorsementSource(
        groupPolicyTypeIds,
      );
      let policySumQb: any, endorsementSumQb: any;
      policySumQb = policyRepository
        .createQueryBuilder("policy")
        .select([
          "COALESCE(policy.grossPremium, 0) AS grossPremium",
          `${POLICY_TERRORISM_BROKERAGE} AS terrorismCommissionAmount`,
          `(COALESCE(policy.basicBrokerageAmount, 0) + COALESCE(policy.srccBrokerageAmount, 0) + ${POLICY_TERRORISM_BROKERAGE} + COALESCE(policy.feeAmount, 0)) AS commissionAmount`,
          "COALESCE(policy.brokerageCollected, 0) AS brokerageCollected",
          "(COALESCE(policy.basicBrokerageAmount, 0) - COALESCE(policy.brokerageCollected, 0)) AS brokerageToBeCollected",
          "COALESCE(policy.netPremium, 0) AS netPremium",
          "COALESCE(policy.terrorismAmount, 0) AS terrorism",
          "COALESCE(policy.otherAmount, 0) AS other",
          "COALESCE(policy.gstAmount, 0) AS gstAmount",
          "COALESCE(policy.brokerageAmountAsperIsg, 0) AS commissionAmountAsEnteredByIsg",
          "COALESCE(policy.brokerageAmountAsperIwork, 0) AS commissionAmountAsPerIwork",
          "COALESCE(policy.feeAmount, 0) AS fees",
          "COALESCE(policy.commissionTerrorism, 0) AS commissionTerrorism",
        ])
        .leftJoin("policy.company", "company")
        .where(`${filterByBusinessDate ? "policy.dateOfBusiness" : "policy.dateOfIncome"} BETWEEN :start AND :end`, {
          start: range.start,
          end: range.end,
        });
      if (userIds && userIds.length > 0 && isLeadership === false) {
        policySumQb.andWhere("policy.ownerId IN (:...userIds)", { userIds });
      }
      const enabledForPerformanceLid = await this.getEnabledForPerformanceLookupId();
      if (enabledForPerformanceLid) {
        policySumQb.andWhere(
          "policy.enabledForPerformanceLid = :enabledForPerformanceLid",
          { enabledForPerformanceLid }
        );
      }
      if (searchBy) {
        if (!isNaN(Number(searchBy))) {
          policySumQb.andWhere("policy.companyId = :companyId", { companyId: Number(searchBy) });
        } else {
          policySumQb.andWhere("company.companyName ILIKE :searchBy", { searchBy: `%${searchBy}%` });
        }
      }
      if (policyType) {
        policySumQb
          .leftJoin(LookUp, "policyTypeLookup", "policy.policyTypeLid = policyTypeLookup.id")
          .andWhere("policyTypeLookup.lookUpValue = :policyType", { policyType });
      }
      if (insurerId) {
        policySumQb
          .leftJoin("policy.insurerMappings", "insurerMappings")
          .leftJoin("insurerMappings.insurer", "insurer");
        policySumQb.andWhere("insurer.id = :insurerId", { insurerId });
      }
      if (groupCompanyId) {
        policySumQb
          .leftJoin(GroupCompanyMap, "gcm", "gcm.companyId = company.id")
          .andWhere("gcm.groupCompanyId = :groupCompanyId", { groupCompanyId });
      }
      if (brokerId) {
        policySumQb.andWhere("policy.broker_id = :brokerId", { brokerId });
      }
      if (branchIds && branchIds.length > 0) {
        policySumQb.leftJoin("insurerMappings.insurerBranch", "address");
        policySumQb.andWhere("address.id IN (:...branchIds)", { branchIds });
      }
      if (
        businessPerformanceType !== undefined &&
        businessPerformanceType !== null &&
        businessPerformanceType !== DEFAULT_VALUES.ACTUAL
      ) {
        if (businessPerformanceType === DEFAULT_VALUES.OPPORTUNITY_TYPE) {
          policySumQb.andWhere("policy.opportunity_type = :opportunityType", {
            opportunityType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
          });
        }
        if (
          businessPerformanceType === DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE
        ) {
          policySumQb.andWhere("policy.opportunity_type = :opportunityType", {
            opportunityType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
          });
        }
      }
      // if (isLeadership === true) {
        if (organisationId && organisationId.length > 0) {
          policySumQb.andWhere("policy.organisationId IN (:...organisationId)", {
            organisationId,
          });
        }
        if (sbuId !== undefined && sbuId !== null) {
          policySumQb.andWhere("policy.sbuId = :sbuId", {
            sbuId,
          });
        }
        if (verticalId !== undefined && verticalId !== null) {
          policySumQb.andWhere("policy.verticalId IN (:...verticalId)", {
            verticalId,
          });
        }
        if (departmentId !== undefined && departmentId !== null) {
          policySumQb.andWhere("policy.departmentId = :departmentId", {
            departmentId,
          });
        }
        if (branchId !== undefined && branchId !== null) {
          policySumQb.andWhere("policy.branchId IN (:...branchId)", {
            branchId,
          });
        }
      // }

      endorsementSumQb = policyRepository.manager
        .createQueryBuilder("endorsement")
        .from(endorsementSource.query, "endorsement")
        .setParameters(endorsementSource.parameters)
        .select([
          "COALESCE(endorsement.grossPremium, 0) AS grossPremium",
          `${ENDORSEMENT_TERRORISM_BROKERAGE} AS terrorismCommissionAmount`,
          `(COALESCE(endorsement.basicBrokerageAmount, 0) + COALESCE(endorsement.srccBrokerageAmount, 0) + ${ENDORSEMENT_TERRORISM_BROKERAGE} + COALESCE(endorsement.feeAmount, 0)) AS commissionAmount`,
          "COALESCE(endorsement.brokerageCollected, 0) AS brokerageCollected",
          "(COALESCE(endorsement.basicBrokerageAmount, 0) - COALESCE(endorsement.brokerageCollected, 0)) AS brokerageToBeCollected",
          "COALESCE(endorsement.netPremium, 0) AS netPremium",
          "COALESCE(endorsement.terrorismAmount, 0) AS terrorism",
          "COALESCE(endorsement.otherAmount, 0) AS other",
          "COALESCE(endorsement.gstAmount, 0) AS gstAmount",
          "COALESCE(endorsement.brokerageAmountAsperIsg, 0) AS commissionAmountAsEnteredByIsg",
          "COALESCE(endorsement.brokerageAmountAsperIwork, 0) AS commissionAmountAsPerIwork",
          "COALESCE(endorsement.feeAmount, 0) AS fees",
          "COALESCE(endorsement.commissionTerrorismAmount, 0) AS commissionTerrorism",
        ])
        // .innerJoin(Policy, "policy", "policy.id = endorsement.policyId")
        // .leftJoin("policy.owner", "employee")
        // .leftJoin("employee.branch", "branch")
        // .leftJoin("employee.organisation", "organisation")
        // .leftJoin("employee.sbu", "sbu")
        // .leftJoin("employee.vertical", "vertical")
        // .leftJoin("employee.department", "department")
        // .leftJoin("policy.company", "company")
        .innerJoin(Policy, "policy", "policy.id = endorsement.policyId")
        .leftJoin("policy.company", "company")
        .where(`${filterByBusinessDate ? "endorsement.dateOfBusiness" : "endorsement.dateOfIncome"} BETWEEN :start AND :end`, {
          start: range.start,
          end: range.end,
        });

      if (userIds && userIds.length > 0 && isLeadership === false) {
        endorsementSumQb.andWhere("policy.ownerId IN (:...userIds)", {
          userIds,
        });
      }
      if (enabledForPerformanceLid) {
        endorsementSumQb.andWhere(
          "policy.enabledForPerformanceLid = :enabledForPerformanceLid",
          { enabledForPerformanceLid }
        );
        endorsementSumQb.andWhere(
          "endorsement.enabledForPerformanceLid = :endorsementEnabledForPerformanceLid",
          { endorsementEnabledForPerformanceLid: enabledForPerformanceLid }
        );
      }

      if (searchBy) {
        if (!isNaN(Number(searchBy))) {
          endorsementSumQb.andWhere("policy.companyId = :companyId", { companyId: Number(searchBy) });
        } else {
          endorsementSumQb.andWhere("company.companyName ILIKE :searchBy", { searchBy: `%${searchBy}%` });
        }
      }
      if (policyType) {
        endorsementSumQb
          .leftJoin(LookUp, "policyTypeLookup", "policy.policyTypeLid = policyTypeLookup.id")
          .andWhere("policyTypeLookup.lookUpValue = :policyType", { policyType });
      }
      if (
        businessPerformanceType !== undefined &&
        businessPerformanceType !== null &&
        businessPerformanceType !== DEFAULT_VALUES.ACTUAL
      ) {
        if (businessPerformanceType === DEFAULT_VALUES.OPPORTUNITY_TYPE) {
          endorsementSumQb.andWhere(
            "policy.opportunity_type = :opportunityType",
            {
              opportunityType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
            }
          );
        }
        if (
          businessPerformanceType === DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE
        ) {
          endorsementSumQb.andWhere(
            "policy.opportunity_type = :opportunityType",
            {
              opportunityType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
            }
          );
        }
      }
      if (insurerId) {
        endorsementSumQb
          .leftJoin("policy.insurerMappings", "insurerMappings")
          .leftJoin("insurerMappings.insurer", "insurer");
        endorsementSumQb.andWhere("insurer.id = :insurerId", {
          insurerId,
        });
      }
      if (groupCompanyId) {
        endorsementSumQb
          .leftJoin(GroupCompanyMap, "gcm", "gcm.companyId = company.id")
          .andWhere("gcm.groupCompanyId = :groupCompanyId", { groupCompanyId });
      }
      if (brokerId) {
        endorsementSumQb.andWhere("policy.broker_id = :brokerId", { brokerId });
      }
      if (branchIds && branchIds.length > 0) {
        endorsementSumQb.leftJoin("insurerMappings.insurerBranch", "address");
        endorsementSumQb.andWhere("address.id IN (:...branchIds)", {
          branchIds,
        });
      }
      // if (isLeadership === true) {
        if (organisationId && organisationId.length > 0) {
          endorsementSumQb.andWhere("endorsement.organisationId IN (:...organisationId)", {
            organisationId,
          });
        }
        if (sbuId !== undefined && sbuId !== null) {
          endorsementSumQb.andWhere("endorsement.sbuId = :sbuId", {
            sbuId,
          });
        }
        if (verticalId !== undefined && verticalId !== null) {
          endorsementSumQb.andWhere("endorsement.verticalId IN (:...verticalId)", {
            verticalId,
          });
        }
        if (departmentId !== undefined && departmentId !== null) {
          endorsementSumQb.andWhere("endorsement.departmentId = :departmentId", {
            departmentId,
          });
        }
        if (branchId !== undefined && branchId !== null) {
          endorsementSumQb.andWhere("endorsement.branchId IN (:...branchId)", {
            branchId,
          });
        }
      // }
      const sumBranches: string[] = [];
      let unionParameters: Record<string, any> = {};
      if (includePolicyRecords) {
        sumBranches.push(policySumQb.getQuery());
        Object.assign(unionParameters, policySumQb.getParameters());
      }
      if (includeEndorsementRecords) {
        sumBranches.push(endorsementSumQb.getQuery());
        Object.assign(
          unionParameters,
          endorsementSumQb.getParameters(),
          endorsementSource.parameters,
        );
      }

      let result: Record<string, any> = {};
      if (sumBranches.length) {
        const unionSql = `(${sumBranches.join(" UNION ALL ")})`;
        const finalKpiQb = policyRepository.manager
          .createQueryBuilder()
          .select([
            "SUM(combined.grossPremium)::float8 AS grossPremium",
            "SUM(combined.terrorismCommissionAmount)::float8 AS terrorismCommissionAmount",
            "SUM(combined.commissionAmount)::float8 AS commissionAmount",
            "SUM(combined.brokerageCollected)::float8 AS brokerageCollected",
            "SUM(combined.brokerageToBeCollected)::float8 AS brokerageToBeCollected",
            "SUM(combined.netPremium)::float8 AS netPremium",
            "SUM(combined.terrorism)::float8 AS terrorism",
            "SUM(combined.other)::float8 AS other",
            "SUM(combined.gstAmount)::float8 AS gstAmount",
            "SUM(combined.commissionAmountAsEnteredByIsg)::float8 AS commissionAmountAsEnteredByIsg",
            "SUM(combined.commissionAmountAsPerIwork)::float8 AS commissionAmountAsPerIwork",
            "SUM(combined.fees)::float8 AS fees",
            "SUM(combined.commissionTerrorism)::float8 AS commissionTerrorism",
          ])
          .from(unionSql, "combined")
          .setParameters(unionParameters);
        const [row] = await finalKpiQb.getRawMany();
        result = row || {};
      }
      // Convert all values to numbers (float)
      Object.keys(result).forEach((key) => {
        result[key] = result[key] !== null ? Number(result[key]) : 0;
      });

      // Rewards total flows into the "Brokerage Amount" KPI card
      // (commissionamount), mirroring brokerageAmount = rewardAmount in the list.
      if (includeRewardRecords) {
        const rewardSumQb = policyRepository.manager
          .createQueryBuilder()
          .select("COALESCE(SUM(r.reward_amount), 0)::float8", "total")
          .from("reward", "r")
          .where("r.deleted_at IS NULL");
        if (
          Array.isArray(rewardOrganisationIds) &&
          rewardOrganisationIds.length
        ) {
          rewardSumQb.andWhere("r.organisation_id IN (:...rewardOrgIds)", {
            rewardOrgIds: rewardOrganisationIds,
          });
        }
        if (insurerId) {
          rewardSumQb.andWhere("r.insurer_id = :rewardInsurerId", {
            rewardInsurerId: insurerId,
          });
        }
        if (range.start && range.end) {
          if (filterByBusinessDate) {
            rewardSumQb.andWhere(
              "EXISTS (SELECT 1 FROM reward_business_month rbmf WHERE rbmf.reward_id = r.id AND rbmf.business_month BETWEEN :rewardStart AND :rewardEnd)",
              { rewardStart: range.start, rewardEnd: range.end },
            );
          } else {
            rewardSumQb.andWhere(
              "r.date_of_income BETWEEN :rewardStart AND :rewardEnd",
              { rewardStart: range.start, rewardEnd: range.end },
            );
          }
        }
        const rewardSumRow = await rewardSumQb.getRawOne();
        const rewardTotal = Number(rewardSumRow?.total) || 0;
        result.commissionamount = (Number(result.commissionamount) || 0) +
          rewardTotal;
      }

      return result || {};
    } catch (error) {
      console.error("Error in policyDetailsKpi:", error);
      throw new Error("Failed to fetch policy KPI summary");
    }
  }

  // Org-hierarchy drilldown aggregate for Biz Done Report Enhanced: one row
  // per child node at the requested level, with policy count / premium /
  // brokerage. Reuses the same eligibility rules policyDetailsKpi applies
  // (policy+endorsement union, ownerId scoping — not createdBy, which the
  // policy/endorsement tables don't even carry an owner-equivalent of —
  // enabledForPerformanceLid gate) so the accordion's numbers never diverge
  // from the KPI cards/table for the same scope. Deliberately narrower than
  // policyDetailsKpi: no insurer/policyType/broker/company/businessMonth
  // filters, since those aren't part of the org-widget's own query contract
  // (OrgFinancialFilter only ever sends level/ancestor-ids/date-range).
  // Level "owner" (Enhanced pages' Owner accordion) groups BOTH legs by
  // policy.ownerId — the same single attribution column the listing's
  // userId/owner filter scopes by — so a per-owner row here equals the
  // listing filtered to that owner. Callers pass the downline member ids as
  // `userIds` with isLeadership=false to pin the population; the
  // Manager + Team rollup happens caller-side (one owner per policy makes a
  // plain per-subtree sum exact).
  async getScopeSummaryByLevel(
    level: "organisation" | "unit" | "vertical" | "branch" | "owner",
    userIds: number[],
    isLeadership: boolean,
    organisationId: number | undefined,
    sbuId: number | undefined,
    verticalId: number | undefined,
    departmentId: number | undefined,
    branchId: number | number[] | undefined,
    fromDate: Date | undefined,
    toDate: Date | undefined,
    rewardOrganisationIds?: number[] | null,
    filterByBusinessDate?: boolean,
  ): Promise<{ id: number; policyCount: number; premium: number; brokerage: number; soBrokerage: number; roBrokerage: number; feeAmount: number; rewardAmount: number; total: number }[]> {
    try {
      const colMap: Record<string, string> = {
        organisation: "organisationId",
        unit: "sbuId",
        vertical: "verticalId",
        branch: "branchId",
        owner: "ownerId",
      };
      const groupCol = colMap[level];
      // Owner attribution always lives on the POLICY row (endorsements have
      // no owner of their own — they inherit the parent policy's), so the
      // endorsement leg groups by the joined policy's ownerId too.
      const groupRef = (alias: string) =>
        level === "owner" ? "policy.ownerId" : `${alias}.${groupCol}`;

      const policyRepository = this.dataSource.getRepository(Policy);
      const enabledForPerformanceLid = await this.getEnabledForPerformanceLookupId();
      const leadInsurerLid = await this.getLeadInsurerLookupId();
      const groupPolicyTypeIds = await this.getGroupPolicyTypeIds();
      const endorsementSource = this.buildUnifiedEndorsementSource(groupPolicyTypeIds);

      // Same bind-ready string range the listing/KPIs use (see
      // toBindableRange) so all three surfaces agree on the window for both
      // the `date` policy column and the timestamptz endorsement column.
      const { start, end } = this.toBindableRange({
        start: fromDate,
        end: toDate,
      });

      const applyAncestors = (qb: any, alias: string) => {
        if (organisationId != null) qb.andWhere(`${alias}.organisationId = :ancestorOrganisationId`, { ancestorOrganisationId: organisationId });
        if (sbuId != null) qb.andWhere(`${alias}.sbuId = :ancestorSbuId`, { ancestorSbuId: sbuId });
        if (verticalId != null) qb.andWhere(`${alias}.verticalId = :ancestorVerticalId`, { ancestorVerticalId: verticalId });
        if (departmentId != null) qb.andWhere(`${alias}.departmentId = :ancestorDepartmentId`, { ancestorDepartmentId: departmentId });
        if (branchId != null)
          qb.andWhere(`${alias}.branchId IN (:...ancestorBranchId)`, {
            ancestorBranchId: Array.isArray(branchId) ? branchId : [branchId],
          });
      };

      // At organisation level (the root, no org filter selected yet) the
      // listing/KPIs it must reconcile with apply NO org predicate at all, so
      // rows with a NULL organisationId ARE in their count/sums. Keep those
      // rows here too, bucketed under the synthetic id below, so the grand
      // total (Σ nodes, incl. this bucket) matches the unfiltered listing.
      // The UI merges nodes against the org master list by id, so the bucket
      // is never rendered as a card. Deeper levels keep the IS NOT NULL guard:
      // their table comparison is always org-filtered, which already excludes
      // NULL-dimension rows on the listing side too.
      const UNASSIGNED_NODE_ID = -1;
      const keepNullGroup = level === "organisation";
      const groupColPredicate = keepNullGroup
        ? "1 = 1"
        : `%GROUP_REF% IS NOT NULL`;
      const predicateFor = (alias: string) =>
        groupColPredicate.replace("%GROUP_REF%", groupRef(alias));

      
      // SO/RO buckets EXCLUDE fee: the org card renders Fee as its own metric
      // next to them, so keeping fee inside the brokerage split showed the same
      // rupees twice. Basic + SRCC + TC/terrorism only. `brokerage` below keeps
      // fee (includeFee defaults true) because `total` is derived from it.
      const brokerageByType = (alias: string, typeParam: string) =>
        `COALESCE(SUM(CASE WHEN policy.opportunityType = :${typeParam} THEN ${brokerageAmountExpr(
          alias,
          alias === "endorsement"
            ? { terrorismAmountColumn: "commissionTerrorismAmount", includeFee: false }
            : { includeFee: false },
        )} ELSE 0 END), 0)`;
      const opportunityTypeParams = {
        ssSoType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
        ssRoType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
      };

      const policySumQb = policyRepository
        .createQueryBuilder("policy")
        .select(groupRef("policy"), "nodeId")
        .addSelect("COUNT(*)", "recordCount")
        .addSelect("COALESCE(SUM(policy.grossPremium), 0)", "premium")
        .addSelect(`COALESCE(SUM(${brokerageAmountExpr("policy")}), 0)`, "brokerage")
        .addSelect(brokerageByType("policy", "ssSoType"), "soBrokerage")
        .addSelect(brokerageByType("policy", "ssRoType"), "roBrokerage")
        .addSelect("COALESCE(SUM(policy.feeAmount), 0)", "feeAmount")
        .where(predicateFor("policy"))
        .setParameters(opportunityTypeParams);
      if (start && end) {
        policySumQb.andWhere(`${filterByBusinessDate ? "policy.dateOfBusiness" : "policy.dateOfIncome"} BETWEEN :start AND :end`, { start, end });
      }
      if (userIds && userIds.length > 0 && !isLeadership) {
        policySumQb.andWhere("policy.ownerId IN (:...userIds)", { userIds });
      }
      if (enabledForPerformanceLid) {
        policySumQb.andWhere("policy.enabledForPerformanceLid = :enabledForPerformanceLid", { enabledForPerformanceLid });
      }
      applyAncestors(policySumQb, "policy");
      policySumQb.groupBy(groupRef("policy"));

      const endorsementSumQb = policyRepository.manager
        .createQueryBuilder()
        .select(groupRef("endorsement"), "nodeId")
        .addSelect("COUNT(*)", "recordCount")
        .addSelect("COALESCE(SUM(endorsement.grossPremium), 0)", "premium")
        .addSelect(`COALESCE(SUM(${brokerageAmountExpr("endorsement", { terrorismAmountColumn: "commissionTerrorismAmount" })}), 0)`, "brokerage")
        // Endorsement brokerage inherits the PARENT policy's opportunity_type
        // — endorsements carry no opportunity classification of their own.
        // Same expression the dashboard's endorsement leg uses.
        .addSelect(brokerageByType("endorsement", "ssSoType"), "soBrokerage")
        .addSelect(brokerageByType("endorsement", "ssRoType"), "roBrokerage")
        .addSelect("COALESCE(SUM(endorsement.feeAmount), 0)", "feeAmount")
        .from(endorsementSource.query, "endorsement")
        .setParameters({ ...endorsementSource.parameters, ...opportunityTypeParams })
        .innerJoin(Policy, "policy", "policy.id = endorsement.policyId")
        .where(predicateFor("endorsement"));
      if (start && end) {
        endorsementSumQb.andWhere(`${filterByBusinessDate ? "endorsement.dateOfBusiness" : "endorsement.dateOfIncome"} BETWEEN :start AND :end`, { start, end });
      }
      if (userIds && userIds.length > 0 && !isLeadership) {
        endorsementSumQb.andWhere("policy.ownerId IN (:...userIds)", { userIds });
      }
      if (enabledForPerformanceLid) {
        endorsementSumQb.andWhere("policy.enabledForPerformanceLid = :enabledForPerformanceLid", { enabledForPerformanceLid });
        endorsementSumQb.andWhere("endorsement.enabledForPerformanceLid = :endorsementEnabledForPerformanceLid", { endorsementEnabledForPerformanceLid: enabledForPerformanceLid });
      }
      applyAncestors(endorsementSumQb, "endorsement");
      endorsementSumQb.groupBy(groupRef("endorsement"));

      const unionSql = `(${policySumQb.getQuery()} UNION ALL ${endorsementSumQb.getQuery()})`;
      const combinedParams = {
        ...policySumQb.getParameters(),
        ...endorsementSumQb.getParameters(),
      };
      const finalQb = policyRepository.manager
        .createQueryBuilder()
        .select('combined."nodeId"', "id")
        .addSelect('SUM(combined."premium")::float8', "premium")
        .addSelect('SUM(combined."brokerage")::float8', "brokerage")
        .addSelect('SUM(combined."soBrokerage")::float8', "soBrokerage")
        .addSelect('SUM(combined."roBrokerage")::float8', "roBrokerage")
        .addSelect('SUM(combined."feeAmount")::float8', "feeAmount")
        .from(unionSql, "combined")
        .setParameters(combinedParams)
        .groupBy('combined."nodeId"');
      const rows = await finalQb.getRawMany();

      const nodes = new Map<number, { id: number; policyCount: number; premium: number; brokerage: number; soBrokerage: number; roBrokerage: number; feeAmount: number; rewardAmount: number; total: number }>();
      const rowNodeId = (row: any): number | null => {
        if (row.id != null) return Number(row.id);
        return keepNullGroup ? UNASSIGNED_NODE_ID : null;
      };
      rows.forEach((row) => {
        const id = rowNodeId(row);
        if (id == null) return;
        nodes.set(id, {
          id,
          policyCount: 0,
          premium: Number(row.premium) || 0,
          brokerage: Number(row.brokerage) || 0,
          soBrokerage: Number(row.soBrokerage) || 0,
          roBrokerage: Number(row.roBrokerage) || 0,
          feeAmount: Number(row.feeAmount) || 0,
          rewardAmount: 0,
          total: 0,
        });
      });

      // "Policies" is deliberately counted via a SEPARATE query (not
      // COUNT(*) alongside the sums above), mirroring the listing's own
      // policyDetails join shape so "Policies" == "List of records" exactly.
      // The listing LEFT-joins insurerMappings restricted to the LEAD
      // participation type and inner-joins company/owner, so each policy
      // contributes exactly ONE row: mapping-less policies are kept (left
      // join) and co-insured policies are NOT multiplied (only the lead
      // mapping matches). Amounts are summed unjoined above to avoid
      // double-counting premium — hence two passes.
      // NOTE: previously this inner-joined ALL insurerMappings (no lead
      // restriction), which dropped mapping-less policies and multiplied
      // co-insured ones, causing this count to diverge from the listing.
      const withListingJoins = (qb: any) => {
        if (leadInsurerLid) {
          qb.leftJoin(
            "policy.insurerMappings",
            "insurerMappings",
            "insurerMappings.insurerParticipationTypeLid = :leadInsurerLid",
            { leadInsurerLid }
          );
        }
        return qb
          .innerJoin("policy.company", "company")
          .innerJoin("policy.owner", "employee");
      };

      const policyCountQb = withListingJoins(
        policyRepository.createQueryBuilder("policy")
      )
        .select(groupRef("policy"), "nodeId")
        .addSelect("COUNT(*)", "recordCount")
        .where(predicateFor("policy"));
      if (start && end) {
        policyCountQb.andWhere(`${filterByBusinessDate ? "policy.dateOfBusiness" : "policy.dateOfIncome"} BETWEEN :start AND :end`, { start, end });
      }
      if (userIds && userIds.length > 0 && !isLeadership) {
        policyCountQb.andWhere("policy.ownerId IN (:...userIds)", { userIds });
      }
      if (enabledForPerformanceLid) {
        policyCountQb.andWhere("policy.enabledForPerformanceLid = :enabledForPerformanceLid", { enabledForPerformanceLid });
      }
      applyAncestors(policyCountQb, "policy");
      policyCountQb.groupBy(groupRef("policy"));

      const endorsementCountQb = withListingJoins(
        policyRepository.manager
          .createQueryBuilder()
          .from(endorsementSource.query, "endorsement")
          .setParameters(endorsementSource.parameters)
          .innerJoin(Policy, "policy", "policy.id = endorsement.policyId")
      )
        .select(groupRef("endorsement"), "nodeId")
        .addSelect("COUNT(*)", "recordCount")
        .where(predicateFor("endorsement"));
      if (start && end) {
        endorsementCountQb.andWhere(`${filterByBusinessDate ? "endorsement.dateOfBusiness" : "endorsement.dateOfIncome"} BETWEEN :start AND :end`, { start, end });
      }
      if (userIds && userIds.length > 0 && !isLeadership) {
        endorsementCountQb.andWhere("policy.ownerId IN (:...userIds)", { userIds });
      }
      if (enabledForPerformanceLid) {
        endorsementCountQb.andWhere("policy.enabledForPerformanceLid = :enabledForPerformanceLid", { enabledForPerformanceLid });
        endorsementCountQb.andWhere("endorsement.enabledForPerformanceLid = :endorsementEnabledForPerformanceLid", { endorsementEnabledForPerformanceLid: enabledForPerformanceLid });
      }
      applyAncestors(endorsementCountQb, "endorsement");
      endorsementCountQb.groupBy(groupRef("endorsement"));

      const countUnionSql = `(${policyCountQb.getQuery()} UNION ALL ${endorsementCountQb.getQuery()})`;
      const countParams = {
        ...policyCountQb.getParameters(),
        ...endorsementCountQb.getParameters(),
      };
      const countFinalQb = policyRepository.manager
        .createQueryBuilder()
        .select('combined."nodeId"', "id")
        .addSelect('SUM(combined."recordCount")::int', "policyCount")
        .from(countUnionSql, "combined")
        .setParameters(countParams)
        .groupBy('combined."nodeId"');
      const countRows = await countFinalQb.getRawMany();
      countRows.forEach((row) => {
        const id = rowNodeId(row);
        if (id == null) return;
        const existing = nodes.get(id) ?? { id, policyCount: 0, premium: 0, brokerage: 0, soBrokerage: 0, roBrokerage: 0, feeAmount: 0, rewardAmount: 0, total: 0 };
        existing.policyCount = Math.max(parseInt(row.policyCount ?? "0", 10), 0);
        nodes.set(id, existing);
      });

      // Rewards, organisation level only — mirroring the listing exactly: its
      // reward union is dropped whenever any policy-only filter (sbu/vertical/
      // department/branch etc., see rewardsAllowedFor) is set, which is every
      // sub-org drilldown level.
      // Each reward row adds 1 to the listing's totalCount and its amount
      // flows into the Brokerage KPI (policyDetailsKpi's commissionamount),
      // so count and brokerage get the same treatment here. Rewards carry no
      // gross premium, so premium is untouched.
      if (level === "organisation") {
        const rewardQb = policyRepository.manager
          .createQueryBuilder()
          .select("r.organisation_id", "id")
          .addSelect("COUNT(*)::int", "rewardCount")
          .addSelect("COALESCE(SUM(r.reward_amount), 0)::float8", "rewardTotal")
          .from("reward", "r")
          .where("r.deleted_at IS NULL");
        if (
          Array.isArray(rewardOrganisationIds) &&
          rewardOrganisationIds.length
        ) {
          rewardQb.andWhere("r.organisation_id IN (:...rewardOrgIds)", {
            rewardOrgIds: rewardOrganisationIds,
          });
        }
        if (start && end) {
          // Rewards carry their business months in a child table rather than
          // a column, so business mode matches the same EXISTS the report's
          // own rewards leg uses instead of swapping a column name.
          if (filterByBusinessDate) {
            rewardQb.andWhere(
              "EXISTS (SELECT 1 FROM reward_business_month rbms WHERE rbms.reward_id = r.id AND rbms.business_month BETWEEN :rewardStart AND :rewardEnd)",
              { rewardStart: start, rewardEnd: end },
            );
          } else {
            rewardQb.andWhere("r.date_of_income BETWEEN :rewardStart AND :rewardEnd", {
              rewardStart: start,
              rewardEnd: end,
            });
          }
        }
        rewardQb.groupBy("r.organisation_id");
        const rewardRows = await rewardQb.getRawMany();
        rewardRows.forEach((row: any) => {
          const id = rowNodeId(row);
          if (id == null) return;
          const existing = nodes.get(id) ?? { id, policyCount: 0, premium: 0, brokerage: 0, soBrokerage: 0, roBrokerage: 0, feeAmount: 0, rewardAmount: 0, total: 0 };
          existing.policyCount += Math.max(parseInt(row.rewardCount ?? "0", 10), 0);
          // Rewards keep flowing into the combined `brokerage` (unchanged
          // semantics) but are surfaced separately: they have no opportunity,
          // so they belong to neither the SO nor the RO bucket.
          existing.brokerage += Number(row.rewardTotal) || 0;
          existing.rewardAmount += Number(row.rewardTotal) || 0;
          nodes.set(id, existing);
        });
      }

      // "Total" the UI shows per node: the sum of the four metrics rendered
      // beside it, so the card adds up on screen — SO + RO brokerage (both now
      // fee-free, see brokerageByType) + fee + reward. NOT `brokerage + fee`:
      // `brokerage` already carries fee inside brokerageAmountExpr, so that
      // form counted fee twice.
      // Known trade-off: a row whose opportunity_type is neither 'SO' nor 'RO'
      // lands in no bucket and is therefore absent from this total (it still
      // counts in `brokerage`). Compare the two if a node ever looks short.
      // Computed last so it picks up the reward merge above.
      nodes.forEach((node) => {
        node.total =
          node.soBrokerage + node.roBrokerage + node.feeAmount + node.rewardAmount;
      });

      return Array.from(nodes.values());
    } catch (error) {
      console.error("Error in getScopeSummaryByLevel:", error);
      throw new Error("Failed to fetch policy scope summary");
    }
  }


  // Live replacement for the dashboard Business Performance widget's
  // "achieved" half, which used to be read from the `performance_output` table
  // filled by the hourly generatePerformanceOutput ETL. Reading a batch table
  // meant the widget disagreed with the Biz Done report for up to an hour after
  // any policy edit; this computes the same numbers on demand from the same
  // source tables Biz Done reads, so the two can no longer drift.
  //
  // Bucket mapping (derived from the ETL + the widget's entityType grouping):
  //   soAchieved = brokerage where policy.opportunity_type = 'SO'
  //                (the ETL's SO/MINED/SO_ENDORSEMENT/MINED_ENDORSEMENT all
  //                collapse to this — the mined split never mattered here)
  //   roAchieved = brokerage where policy.opportunity_type = 'RO'  + rewards
  // Any other opportunity_type is dropped, matching the ETL's missing `else`.
  //
  // Three legs unioned rather than joined: a policy is attributed by its own
  // owner/org columns, an endorsement inherits owner from its parent policy but
  // carries its OWN org dimensions, and a reward has neither. Aggregating each
  // leg independently also keeps co-insured policies (one row per insurer
  // participant) from double-counting money.
  //
  // Rewards are visible per Biz Done's rule — scoped by reward.organisation_id,
  // never by the owner hierarchy — but attributed per the ETL's rule, via the
  // creating employee's org dimensions, since the reward row carries no
  // sbu/vertical/department/branch of its own. See the reward leg below.
  async getBusinessPerformanceAchieved(opts: {
    groupBy: "quarter" | "sbu" | "month";
    userIds: number[];
    isLeadership: boolean;
    organisationIds?: number[];
    sbuIds?: number[];
    verticalIds?: number[];
    departmentIds?: number[];
    branchIds?: number[];
    from?: Date | string;
    to?: Date | string;
    includeRewards?: boolean;
    rewardOrganisationIds?: number[] | null;
    incomeType?: string;
  }): Promise<
    { bucket: number | null; soAchieved: number; roAchieved: number }[]
  > {
    try {
      const {
        groupBy,
        userIds,
        isLeadership,
        organisationIds,
        sbuIds,
        verticalIds,
        departmentIds,
        branchIds,
        includeRewards = false,
        rewardOrganisationIds = null,
        incomeType,
      } = opts;

      // Income type selects which legs contribute, using the same vocabulary
      // and the same rules as the Biz Done listing (see getPolicyReportList):
      // an explicit "policy"/"endorsement" keeps that leg alone and drops
      // rewards, "rewards" keeps rewards alone, anything else means all three.
      const rawIncomeType =
        typeof incomeType === "string" ? incomeType.trim().toLowerCase() : "";
      const normalizedIncomeType =
        rawIncomeType === "policy" ||
        rawIncomeType === "endorsement" ||
        rawIncomeType === "rewards"
          ? rawIncomeType
          : undefined;
      const includePolicyLeg =
        normalizedIncomeType === undefined || normalizedIncomeType === "policy";
      const includeEndorsementLeg =
        normalizedIncomeType === undefined ||
        normalizedIncomeType === "endorsement";
      const includeRewardLeg =
        includeRewards &&
        (normalizedIncomeType === undefined ||
          normalizedIncomeType === "rewards");

      // Same bind-ready range the listing/KPIs use, so the `date`-typed
      // policy.date_of_income and the timestamptz endorsement column both
      // resolve inclusively. Note: NOT wrapped in DATE(...) like the old ETL
      // did — that discards any index on the column.
      const { start, end } = this.toBindableRange({
        start: opts.from,
        end: opts.to,
      });

      const policyRepository = this.dataSource.getRepository(Policy);
      const enabledForPerformanceLid =
        await this.getEnabledForPerformanceLookupId();
      const groupPolicyTypeIds = await this.getGroupPolicyTypeIds();
      const endorsementSource =
        this.buildUnifiedEndorsementSource(groupPolicyTypeIds);

      // Fiscal quarter from a calendar month: Apr-Jun -> 1 ... Jan-Mar -> 4.
      // Same expression the performance_output query used, moved off
      // performance_month (which was only ever the month bucket of
      // date_of_income) onto date_of_income itself.
      const quarterExpr = (col: string) =>
        `FLOOR(((EXTRACT(MONTH FROM ${col}) + 8) % 12) / 3) + 1`;
      const bucketExpr = (alias: string) =>
        groupBy === "quarter"
          ? quarterExpr(`${alias}.dateOfIncome`)
          : groupBy === "month"
          ? `EXTRACT(MONTH FROM ${alias}.dateOfIncome)`
          : `${alias}.sbuId`;

      const brokerageSum = (alias: string, typeParam: string) =>
        `COALESCE(SUM(CASE WHEN policy.opportunityType = :${typeParam} THEN ${brokerageAmountExpr(alias, alias === "endorsement" ? { terrorismAmountColumn: "commissionTerrorismAmount" } : {})} ELSE 0 END), 0)`;

      // Owner attribution always lives on the POLICY row, so both legs scope by
      // policy.ownerId; only the dimension columns differ per leg.
      const applyScope = (qb: any, alias: string) => {
        if (start && end) {
          qb.andWhere(`${alias}.dateOfIncome BETWEEN :bpStart AND :bpEnd`, {
            bpStart: start,
            bpEnd: end,
          });
        }
        if (!isLeadership && userIds && userIds.length > 0) {
          qb.andWhere("policy.ownerId IN (:...bpUserIds)", {
            bpUserIds: userIds,
          });
        }
        if (organisationIds && organisationIds.length > 0) {
          qb.andWhere(`${alias}.organisationId IN (:...bpOrgIds)`, {
            bpOrgIds: organisationIds,
          });
        }
        if (sbuIds && sbuIds.length > 0) {
          qb.andWhere(`${alias}.sbuId IN (:...bpSbuIds)`, {
            bpSbuIds: sbuIds,
          });
        }
        if (verticalIds && verticalIds.length > 0) {
          qb.andWhere(`${alias}.verticalId IN (:...bpVerticalIds)`, {
            bpVerticalIds: verticalIds,
          });
        }
        if (departmentIds && departmentIds.length > 0) {
          qb.andWhere(`${alias}.departmentId IN (:...bpDepartmentIds)`, {
            bpDepartmentIds: departmentIds,
          });
        }
        if (branchIds && branchIds.length > 0) {
          qb.andWhere(`${alias}.branchId IN (:...bpBranchIds)`, {
            bpBranchIds: branchIds,
          });
        }
      };

      const typeParams = {
        bpSoType: DEFAULT_VALUES.OPPORTUNITY_TYPE,
        bpRoType: DEFAULT_VALUES.RENEWAL_OPPORTUNITY_TYPE,
      };

      const policyQb = policyRepository
        .createQueryBuilder("policy")
        .select(bucketExpr("policy"), "bucket")
        .addSelect(brokerageSum("policy", "bpSoType"), "soAchieved")
        .addSelect(brokerageSum("policy", "bpRoType"), "roAchieved")
        .where("1 = 1")
        .setParameters(typeParams);
      applyScope(policyQb, "policy");
      if (enabledForPerformanceLid) {
        policyQb.andWhere(
          "policy.enabledForPerformanceLid = :bpEnabledForPerformanceLid",
          { bpEnabledForPerformanceLid: enabledForPerformanceLid },
        );
      }
      policyQb.groupBy(bucketExpr("policy"));

      const endorsementQb = policyRepository.manager
        .createQueryBuilder()
        .select(bucketExpr("endorsement"), "bucket")
        .addSelect(brokerageSum("endorsement", "bpSoType"), "soAchieved")
        .addSelect(brokerageSum("endorsement", "bpRoType"), "roAchieved")
        .from(endorsementSource.query, "endorsement")
        .setParameters({ ...endorsementSource.parameters, ...typeParams })
        .innerJoin(Policy, "policy", "policy.id = endorsement.policyId")
        .where("1 = 1");
      applyScope(endorsementQb, "endorsement");
      if (enabledForPerformanceLid) {
        endorsementQb.andWhere(
          "policy.enabledForPerformanceLid = :bpEnabledForPerformanceLid",
          { bpEnabledForPerformanceLid: enabledForPerformanceLid },
        );
        endorsementQb.andWhere(
          "endorsement.enabledForPerformanceLid = :bpEndorsementEnabledForPerformanceLid",
          { bpEndorsementEnabledForPerformanceLid: enabledForPerformanceLid },
        );
      }
      endorsementQb.groupBy(bucketExpr("endorsement"));

      const legs: string[] = [];
      const params: Record<string, any> = {};
      if (includePolicyLeg) {
        legs.push(policyQb.getQuery());
        Object.assign(params, policyQb.getParameters());
      }
      if (includeEndorsementLeg) {
        legs.push(endorsementQb.getQuery());
        Object.assign(params, endorsementQb.getParameters());
      }

      // Rewards contribute to roAchieved only (the widget's long-standing
      // convention, shown with an asterisk note in the UI).
      //
      // A reward row carries organisation_id but no sbu/vertical/department/
      // branch, so those dimensions can only come from the creating employee's
      // record — which is exactly what the performance_output ETL did, and the
      // only attribution available. Visibility, however, stays scoped by
      // reward.organisation_id so the dashboard sees the same reward population
      // the Biz Done report does. Split deliberately: organisation answers "may
      // this viewer see it", the employee record answers "whose number is it".
      if (includeRewardLeg) {
        const rewardBucket =
          groupBy === "quarter"
            ? quarterExpr("r.date_of_income")
            : groupBy === "month"
            ? "EXTRACT(MONTH FROM r.date_of_income)"
            : "u.sbuId";
        const rewardQb = policyRepository.manager
          .createQueryBuilder()
          .select(rewardBucket, "bucket")
          .addSelect("0::numeric", "soAchieved")
          .addSelect("COALESCE(SUM(r.reward_amount), 0)", "roAchieved")
          .from("reward", "r")
          // `userId` is the User entity's property for the `id` column, so
          // joining on it lets TypeORM emit the correct column name.
          .leftJoin(User, "u", "u.userId = r.created_by")
          .where("r.deleted_at IS NULL");
        if (start && end) {
          rewardQb.andWhere(
            "r.date_of_income BETWEEN :bpRewardStart AND :bpRewardEnd",
            { bpRewardStart: start, bpRewardEnd: end },
          );
        }
        if (
          Array.isArray(rewardOrganisationIds) &&
          rewardOrganisationIds.length
        ) {
          rewardQb.andWhere("r.organisation_id IN (:...bpRewardOrgIds)", {
            bpRewardOrgIds: rewardOrganisationIds,
          });
        }
        // Sub-org filters resolve through the creating employee. Distinct
        // parameter names from the policy/endorsement legs because these bind
        // to a different table.
        if (sbuIds && sbuIds.length > 0) {
          rewardQb.andWhere("u.sbuId IN (:...bpRewardSbuIds)", {
            bpRewardSbuIds: sbuIds,
          });
        }
        if (verticalIds && verticalIds.length > 0) {
          rewardQb.andWhere("u.verticalId IN (:...bpRewardVerticalIds)", {
            bpRewardVerticalIds: verticalIds,
          });
        }
        if (departmentIds && departmentIds.length > 0) {
          rewardQb.andWhere("u.departmentId IN (:...bpRewardDepartmentIds)", {
            bpRewardDepartmentIds: departmentIds,
          });
        }
        if (branchIds && branchIds.length > 0) {
          rewardQb.andWhere("u.branchId IN (:...bpRewardBranchIds)", {
            bpRewardBranchIds: branchIds,
          });
        }
        rewardQb.groupBy(rewardBucket);
        legs.push(rewardQb.getQuery());
        Object.assign(params, rewardQb.getParameters());
      }

      // Every leg excluded (e.g. incomeType=rewards on a caller that does not
      // include rewards): nothing can contribute, so skip the query entirely
      // rather than emit an empty UNION.
      if (legs.length === 0) return [];

      const unionSql = `(${legs.join(" UNION ALL ")})`;
      const rows = await policyRepository.manager
        .createQueryBuilder()
        .select('combined."bucket"', "bucket")
        .addSelect('SUM(combined."soAchieved")::float8', "soAchieved")
        .addSelect('SUM(combined."roAchieved")::float8', "roAchieved")
        .from(unionSql, "combined")
        .setParameters(params)
        .groupBy('combined."bucket"')
        .getRawMany();

      return rows.map((row) => ({
        bucket: row.bucket != null ? Number(row.bucket) : null,
        soAchieved: Number(row.soAchieved) || 0,
        roAchieved: Number(row.roAchieved) || 0,
      }));
    } catch (error) {
      console.error("Error in getBusinessPerformanceAchieved:", error);
      throw new Error("Failed to fetch live business performance achieved data");
    }
  }

  async getPortfolioScopeSummaryByLevel(
    level: "organisation" | "unit" | "vertical" | "branch" | "owner",
    userIds: number[],
    isLeadership: boolean,
    organisationId: number | undefined,
    sbuId: number | undefined,
    verticalId: number | undefined,
    departmentId: number | undefined,
    branchId: number | number[] | undefined,
    fromDate: Date | undefined,
    toDate: Date | undefined,
    pastCompanies = false,
  ): Promise<{ id: number; policyCount: number; premium: number; brokerage: number; total: number }[]> {
    try {
      // Org hierarchy is scoped by the policy's OWN org columns — this matches
      // the portfolio listing, which normalizes ATTRIBUTE_FIELD_MAP's
      // owner.* keys back to the policy's denormalized columns (ownerToDirectMap
      // in getAllPolicies: owner.sbuId -> sbuId, etc.). Using the owner's org
      // membership instead made the cards diverge from the KPIs (e.g. an SBU
      // showing 149 owned-by-that-SBU policies while the KPI, keyed on the
      // policy's own sbuId, showed 0).
      const colMap: Record<string, string> = {
        organisation: "organisationId",
        unit: "sbuId",
        vertical: "verticalId",
        branch: "branchId",
        owner: "ownerId",
      };
      const groupRef = `policy.${colMap[level]}`;

      const policyRepository = this.dataSource.getRepository(Policy);
      const lookUpRepository = this.dataSource.getRepository(LookUp);
      const activeStatus = await lookUpRepository.findOne({
        where: { lookUpKey: POLICY_STATUS_MIG_ACTIVE },
      });
      const activeStatusLid = activeStatus?.id ?? -1;
      // Same enabled-for-performance gate the portfolio listing applies
      // (getAllPolicies -> customWhereCondition, TOGGLE_TYPE_YES). Without it the
      // cards include performance-disabled policies the KPIs exclude, so the
      // card totals came out slightly HIGHER than the KPIs (e.g. 89 vs 87).
      const enabledForPerformanceLid = await this.getEnabledForPerformanceLookupId();
      const expiryBoundary = new Date();
      expiryBoundary.setHours(0, 0, 0, 0);

      // Same root-level NULL-bucket handling as getScopeSummaryByLevel: at
      // organisation level (no org filter yet) the listing applies no org
      // predicate, so NULL-org rows are in its totals — keep them under a
      // synthetic id the UI never renders. Deeper levels keep IS NOT NULL.
      const UNASSIGNED_NODE_ID = -1;
      const keepNullGroup = level === "organisation";

      const { start, end } = this.toBindableRange({ start: fromDate, end: toDate });

      const qb = policyRepository
        .createQueryBuilder("policy")
        .select(groupRef, "nodeId")
        .addSelect("COUNT(DISTINCT policy.id)", "policyCount")
        .addSelect("COALESCE(SUM(policy.premiumAtInception), 0)", "premium")
        .addSelect(`COALESCE(SUM(${brokerageAmountExpr("policy")}), 0)`, "brokerage")
        .where("policy.policyStatusLid = :activeStatusLid", { activeStatusLid })
        .andWhere(
          pastCompanies
            ? "policy.policyTo < :expiryBoundary"
            : "policy.policyTo >= :expiryBoundary",
          { expiryBoundary },
        );
      if (!keepNullGroup) {
        qb.andWhere(`${groupRef} IS NOT NULL`);
      }
      if (start && end) {
        qb.andWhere("policy.policyFrom BETWEEN :portfolioStart AND :portfolioEnd", {
          portfolioStart: start,
          portfolioEnd: end,
        });
      }
      // Ancestor (org/SBU/vertical/branch) filters read the policy's OWN org
      // columns, matching the portfolio listing (see ownerToDirectMap). An owner
      // card is that owner's (team's) policies within the drilled scope, so it
      // stays bounded by the branch/SBU total.
      if (organisationId != null) qb.andWhere("policy.organisationId = :ancOrg", { ancOrg: organisationId });
      if (sbuId != null) qb.andWhere("policy.sbuId = :ancSbu", { ancSbu: sbuId });
      if (verticalId != null) qb.andWhere("policy.verticalId = :ancVert", { ancVert: verticalId });
      if (departmentId != null) qb.andWhere("policy.departmentId = :ancDept", { ancDept: departmentId });
      if (branchId != null)
        qb.andWhere("policy.branchId IN (:...ancBranch)", {
          ancBranch: Array.isArray(branchId) ? branchId : [branchId],
        });
      if (userIds && userIds.length > 0 && !isLeadership) {
        qb.andWhere("policy.ownerId IN (:...userIds)", { userIds });
      }
      if (enabledForPerformanceLid) {
        qb.andWhere("policy.enabledForPerformanceLid = :enabledForPerformanceLid", {
          enabledForPerformanceLid,
        });
      }
      qb.groupBy(groupRef);

      const rows = await qb.getRawMany();

      return rows
        .map((row: any) => {
          const rawId = row.nodeId;
          const id =
            rawId != null
              ? Number(rawId)
              : keepNullGroup
              ? UNASSIGNED_NODE_ID
              : null;
          if (id == null) return null;
          const premium = Number(row.premium) || 0;
          const brokerage = Number(row.brokerage) || 0;
          return {
            id,
            policyCount: Math.max(parseInt(row.policyCount ?? "0", 10), 0),
            premium,
            brokerage,
            total: brokerage,
          };
        })
        .filter((n): n is { id: number; policyCount: number; premium: number; brokerage: number; total: number } => n != null);
    } catch (error) {
      console.error("Error in getPortfolioScopeSummaryByLevel:", error);
      throw new Error("Failed to fetch portfolio scope summary");
    }
  }


  async getPortfolioOwnerScopeSummary(
    downline: Array<{ userId: number; reportingUserId?: number | null }>,
    viewBy: string | undefined,
    organisationId: number | undefined,
    sbuId: number | undefined,
    verticalId: number | undefined,
    departmentId: number | undefined,
    branchId: number | number[] | undefined,
    fromDate: Date | undefined,
    toDate: Date | undefined,
    pastCompanies = false,
  ): Promise<
    { id: number; policyCount: number; premium: number; brokerage: number; total: number }[]
  > {
    try {
      const isTeam = viewBy !== OWNER_TYPES.MANAGER;
      const ownerIds = Array.from(
        new Set(
          (downline ?? [])
            .map((row) => Number(row.userId))
            .filter((id) => Number.isFinite(id)),
        ),
      );
      if (ownerIds.length === 0) return [];
      const ownerIdSet = new Set(ownerIds);
      // u is in S(o) only when o === u, or o is u's DIRECT manager.
      const managerOf = new Map<number, number>();
      (downline ?? []).forEach((row) => {
        const user = Number(row.userId);
        const manager = Number(row.reportingUserId);
        if (Number.isFinite(user) && Number.isFinite(manager)) {
          managerOf.set(user, manager);
        }
      });

      const policyRepository = this.dataSource.getRepository(Policy);
      const lookUpRepository = this.dataSource.getRepository(LookUp);
      const activeStatus = await lookUpRepository.findOne({
        where: { lookUpKey: POLICY_STATUS_MIG_ACTIVE },
      });
      const activeStatusLid = activeStatus?.id ?? -1;
      const enabledForPerformanceLid = await this.getEnabledForPerformanceLookupId();
      const expiryBoundary = new Date();
      expiryBoundary.setHours(0, 0, 0, 0);
      const { start, end } = this.toBindableRange({ start: fromDate, end: toDate });

      // Base filters are identical to getPortfolioScopeSummaryByLevel (active
      // book + ancestor org columns + enabled-for-performance + policyFrom
      // window), so only the owner predicate differs between the two.
      const qb = policyRepository
        .createQueryBuilder("policy")
        .select([
          "policy.id",
          "policy.ownerId",
          "policy.createdBy",
          "policy.premiumAtInception",
          "policy.basicBrokerageAmount",
        ])
        .where("policy.policyStatusLid = :activeStatusLid", { activeStatusLid })
        .andWhere(
          pastCompanies
            ? "policy.policyTo < :expiryBoundary"
            : "policy.policyTo >= :expiryBoundary",
          { expiryBoundary },
        );
      if (start && end) {
        qb.andWhere("policy.policyFrom BETWEEN :portfolioStart AND :portfolioEnd", {
          portfolioStart: start,
          portfolioEnd: end,
        });
      }
      if (organisationId != null) qb.andWhere("policy.organisationId = :ancOrg", { ancOrg: organisationId });
      if (sbuId != null) qb.andWhere("policy.sbuId = :ancSbu", { ancSbu: sbuId });
      if (verticalId != null) qb.andWhere("policy.verticalId = :ancVert", { ancVert: verticalId });
      if (departmentId != null) qb.andWhere("policy.departmentId = :ancDept", { ancDept: departmentId });
      if (branchId != null)
        qb.andWhere("policy.branchId IN (:...ancBranch)", {
          ancBranch: Array.isArray(branchId) ? branchId : [branchId],
        });
      if (enabledForPerformanceLid) {
        qb.andWhere("policy.enabledForPerformanceLid = :enabledForPerformanceLid", {
          enabledForPerformanceLid,
        });
      }
      // The listing's three-legged owner predicate, widened once to the whole
      // downline; the per-card narrowing to S(o) happens in the fan-out below.
      qb.andWhere(
        new Brackets((inner) => {
          inner
            .where("policy.ownerId IN (:...scopeUserIds)", { scopeUserIds: ownerIds })
            .orWhere("policy.createdBy IN (:...scopeUserIds)", { scopeUserIds: ownerIds })
            .orWhere(
              `policy.id IN (SELECT DISTINCT ppm.policy_id FROM policy_participant_map ppm
                             WHERE ppm.participant_id IN (:...scopeUserIds))`,
              { scopeUserIds: ownerIds },
            );
        }),
      );

      const policies = await qb.getMany();
      if (policies.length === 0) return [];

      // Participant edges for exactly these policies, restricted to the
      // downline — the third leg of the predicate, per policy.
      const participantsByPolicy = new Map<number, number[]>();
      const policyIds = policies.map((policy) => Number(policy.id));
      const CHUNK = 5000;
      for (let i = 0; i < policyIds.length; i += CHUNK) {
        const slice = policyIds.slice(i, i + CHUNK);
        const rows = await this.dataSource
          .getRepository(PolicyParticipantMap)
          .createQueryBuilder("ppm")
          .select(["ppm.policyId", "ppm.participantId"])
          .where("ppm.policyId IN (:...slice)", { slice })
          .andWhere("ppm.participantId IN (:...ownerIds)", { ownerIds })
          .getMany();
        rows.forEach((row) => {
          const key = Number(row.policyId);
          const list = participantsByPolicy.get(key) ?? [];
          list.push(Number(row.participantId));
          participantsByPolicy.set(key, list);
        });
      }

      const acc = new Map<
        number,
        { seen: Set<number>; premium: number; brokerage: number }
      >();
      const attribute = (cardOwnerId: number, policy: Policy) => {
        if (!ownerIdSet.has(cardOwnerId)) return;
        let bucket = acc.get(cardOwnerId);
        if (!bucket) {
          bucket = { seen: new Set<number>(), premium: 0, brokerage: 0 };
          acc.set(cardOwnerId, bucket);
        }
        const policyId = Number(policy.id);
        if (bucket.seen.has(policyId)) return; // one policy counts once per card
        bucket.seen.add(policyId);
        bucket.premium += Number(policy.premiumAtInception) || 0;
        bucket.brokerage += Number(policy.basicBrokerageAmount) || 0;
      };

      policies.forEach((policy) => {
        const matchedUsers = new Set<number>();
        const owner = Number(policy.ownerId);
        const creator = Number(policy.createdBy);
        if (ownerIdSet.has(owner)) matchedUsers.add(owner);
        if (ownerIdSet.has(creator)) matchedUsers.add(creator);
        (participantsByPolicy.get(Number(policy.id)) ?? []).forEach((participant) => {
          if (ownerIdSet.has(participant)) matchedUsers.add(participant);
        });
        matchedUsers.forEach((user) => {
          attribute(user, policy); // u is always in S(u)
          if (!isTeam) return;
          const visited = new Set<number>([user]);
          let cursor = managerOf.get(user);
          while (cursor != null && !visited.has(cursor)) {
            visited.add(cursor);
            attribute(cursor, policy);
            cursor = managerOf.get(cursor);
          }
        });
      });

      return Array.from(acc.entries()).map(([id, bucket]) => ({
        id,
        policyCount: bucket.seen.size,
        premium: bucket.premium,
        brokerage: bucket.brokerage,
        total: bucket.brokerage,
      }));
    } catch (error) {
      console.error("Error in getPortfolioOwnerScopeSummary:", error);
      throw new Error("Failed to fetch portfolio owner scope summary");
    }
  }

  async getOrgEntityTypes(
    organisationId?: number | number[] | null
  ): Promise<{ entitityTypes: string[]; countryId?: number }> {
    try {
      const DEFAULT_ENTITY_TYPES = [
        "companySummary",
        "policySummary",
        "insurerSummary",
        "policyDetails",
        "coInsurerDetails",
      ];

      const localisationCountryRepo =
        this.dataSource.getRepository(LocalizationCountry);
      const entityTypesRepo = this.dataSource.getRepository(
        LocalizationReportFieldsCountryMap
      );

      let localisationCountryIds: number[] = [];
      const orgIdProvided =
        organisationId !== undefined && organisationId !== null;

      if (!orgIdProvided) {
        // No organisationId → use default country "India"
        const indiaCountry = await localisationCountryRepo.findOne({
          where: { name: "India" },
        });

        if (!indiaCountry) {
          throw new BadRequestException(
            "Default country not found in localization countries"
          );
        }

        localisationCountryIds = [indiaCountry.id];
      } else {
        // Normal flow when organisationId is provided
        const organisationRepo = this.dataSource.getRepository(Organisation);
        const countryRepo = this.dataSource.getRepository(Country);

        const orgIds = Array.isArray(organisationId)
          ? organisationId
          : [organisationId];

        const organisations = await organisationRepo.find({
          where: { id: In(orgIds) },
          select: ["countryId"],
        });

        const countryIds = organisations
          .map((org) => org.countryId)
          .filter((id): id is number => !!id);

        if (countryIds.length) {
          const countries = await countryRepo.find({
            where: { id: In(countryIds) },
            select: ["name"],
          });

          const countryNames = countries
            .map((country) => country.name)
            .filter(Boolean);

          if (countryNames.length) {
            const localisationCountries = await localisationCountryRepo.find({
              where: { name: In(countryNames) },
              select: ["id"],
            });

            localisationCountryIds = localisationCountries
              .map((country) => country.id)
              .filter((id): id is number => !!id);
          }
        }
      }

      let entityTypes: string[] = [];

      if (localisationCountryIds.length) {
        const entityTypesResult = await entityTypesRepo.find({
          where: { countryId: In(localisationCountryIds) },
          select: ["activitySection"],
        });

        entityTypes = Array.from(
          new Set(
            entityTypesResult
              .map((item) => item.activitySection)
              .filter((section): section is string => !!section)
          )
        );
      }

      // Preserve original behavior: default only when organisationId is provided
      if (!entityTypes.length && orgIdProvided) {
        entityTypes = [...DEFAULT_ENTITY_TYPES];
      }

      return {
        entitityTypes: entityTypes,
        countryId: localisationCountryIds[0],
      };
    } catch (error) {
      throw new Error("Failed to fetch organisation entity types");
    }
  }
  async getLocalizationFields(
    entityType: string,
    countryId: number
  ): Promise<any> {
    try {
      let fields: any[] = [];
      fields = await this.getEntityLocalizationFields(entityType, countryId);
      const fieldsKeys: any = {};
      if (Object.keys(fields).length === 0) {
        countryId = DEFAULT_VALUES.DEFAULT_LOALIZATION_COUNTRY; // Default india fields
        fields = await this.getEntityLocalizationFields(entityType, countryId);
      }
      fields.forEach((field) => {
        fieldsKeys[field.fieldLabel] = field.fieldValue;
      });
      if (entityType === "policyDetails") {
        const brokerageAmountLabel = Object.keys(fieldsKeys).find((key) => {
          const normalizedKey = key.replace(/\s+/g, "").toLowerCase();
          return normalizedKey === "brokerageamount";
        });

        if (brokerageAmountLabel) {
          fieldsKeys[brokerageAmountLabel] = "basicBrokerageAmount";
        }
      }
      return fieldsKeys;
    } catch (error) {
      throw new Error("Failed to fetch localization fields");
    }
  }
  async getEntityLocalizationFields(
    entityType: string,
    countryId: number
  ): Promise<any[]> {
    const localisationReportFieldsRepo = await this.dataSource.getRepository(
      LocalizationReportFieldsCountryMap
    );
    const fields = await localisationReportFieldsRepo.find({
      where: {
        activitySection: entityType,
        countryId: countryId,
        status: "active",
      },
      select: ["fieldLabel", "fieldValue"],
      order: { displayOrder: "ASC" },
    });
    return fields;
  }
}