import { In, Repository } from "typeorm";
import {
    Endorsement,
    Opportunity,
    OrgSbu,
    Policy,
    PolicyAssetEndorsement,
    PolicyTypeSegregation,
    SbuRoPolicyTypeSuppression,
} from "../../../../../apps/services/service-lib/src/lib/entities";
import { LookUp } from "../../../../../apps/services/service-lib/src/lib/entities/look-up.entity";
import {
    DEFAULT_RO_CRON_BATCH_SIZE,
    GROUP_POLICY_TYPES,
    MINED_POLICY,
    ONE_YEAR_IN_DAYS,
    OPPORTUNITY_TYPE,
    brokerageAmountOf,
    brokerageAmountExpr,
} from "../constants";
import { buildLogMessage } from "../../../../../apps/services/service-lib/src/lib/utils/logger.util";

const NATURE_OF_BUSSINESS = "NATURE_OF_BUSSINESS";
const NATURE_OF_BUSSINESS_INSURENCE_ONLY = "INSURENCE_ONLY";
const MASTER_STATUS_ACTIVE = "MASTER_STATUS_ACTIVE";
const MASTER_STATUS_LOOKUP_NAME = "MASTER_STATUS";
const INCOME_TYPE = "INCOME_TYPE";
const INCOME_TYPE_POL_INSTALLMENT = "INCOME_TYPE_POL_INSTALLMENT"

export interface RoCreationDeps {
    traceId:                              string;
    logger:                               any;
    lookUpRepository:                     Repository<LookUp>;
    policyRepository:                     Repository<Policy>;
    endorsementRepository:                Repository<Endorsement>;
    policyAssetEndorsementRepository:     Repository<PolicyAssetEndorsement>;
    policyTypeSegregationRepository:      Repository<PolicyTypeSegregation>;
    orgSbuRepository:                     Repository<OrgSbu>;
    sbuRoPolicyTypeSuppressionRepository: Repository<SbuRoPolicyTypeSuppression>;
    createRenewalOpportunity:             (opportunity: Partial<Opportunity>) => Promise<void>;
}

export async function handlePoliciesCloseToExpiry(deps: RoCreationDeps): Promise<void> {
    const {
        traceId,
        logger,
        lookUpRepository,
        policyRepository,
        endorsementRepository,
        policyAssetEndorsementRepository,
        policyTypeSegregationRepository,
        orgSbuRepository,
        sbuRoPolicyTypeSuppressionRepository,
        createRenewalOpportunity,
    } = deps;

    try {
        const optyTypeRO = await lookUpRepository.findOne({
            where: { lookUpKey: OPPORTUNITY_TYPE.RO },
        });

        if (!optyTypeRO) {
            logger.error({
                level: "error",
                message: buildLogMessage({
                    traceId,
                    status: "failure",
                    location: "RoCreationUtils",
                    method: "handlePoliciesCloseToExpiry",
                    messageData: `Lookup value for ${OPPORTUNITY_TYPE.RO} not found`,
                }),
            });
            return;
        }

        const isPolicyMined = await lookUpRepository.findOne({
            where: { lookUpKey: MINED_POLICY },
        });

        if (!isPolicyMined) {
            logger.error({
                level: "error",
                message: buildLogMessage({
                    traceId,
                    status: "failure",
                    location: "RoCreationUtils",
                    method: "handlePoliciesCloseToExpiry",
                    messageData: `Lookup value for ${MINED_POLICY} not found`,
                }),
            });
            return;
        }

        const natureOfBusinessInsuranceOnly = await lookUpRepository.findOne({
            where: {
                lookUpName: NATURE_OF_BUSSINESS,
                lookUpKey: NATURE_OF_BUSSINESS_INSURENCE_ONLY,
            },
        });

        const installmentIncomeType = await lookUpRepository.findOne({
            where: {
                lookUpName: INCOME_TYPE,
                lookUpKey: INCOME_TYPE_POL_INSTALLMENT,
            },
        });

        const sbuActiveStatus = await lookUpRepository.findOne({
            where: { lookUpKey: MASTER_STATUS_ACTIVE, lookUpName: MASTER_STATUS_LOOKUP_NAME },
        });

        if (!natureOfBusinessInsuranceOnly) {
            logger.error({
                level: "error",
                message: buildLogMessage({
                    traceId,
                    status: "failure",
                    location: "RoCreationUtils",
                    method: "handlePoliciesCloseToExpiry",
                    messageData: `Lookup value for ${NATURE_OF_BUSSINESS_INSURENCE_ONLY} not found`,
                }),
            });
            return;
        }

        if (!installmentIncomeType) {
            logger.error({
                level: "error",
                message: buildLogMessage({
                    traceId,
                    status: "failure",
                    location: "RoCreationUtils",
                    method: "handlePoliciesCloseToExpiry",
                    messageData: `Lookup value for ${INCOME_TYPE_POL_INSTALLMENT} not found`,
                }),
            });
            return;
        }

        if (!sbuActiveStatus) {
            logger.error({
                level: "error",
                message: buildLogMessage({
                    traceId,
                    status: "failure",
                    location: "RoCreationUtils",
                    method: "handlePoliciesCloseToExpiry",
                    messageData: `Lookup value for ${MASTER_STATUS_ACTIVE} not found`,
                }),
            });
            return;
        }

        const now = new Date();
        const thresholdDate = new Date(now.getTime() + ONE_YEAR_IN_DAYS * 24 * 60 * 60 * 1000);

        const enabledSbus = await orgSbuRepository.find({
            where: { isRoGenerationEnabled: true, statusLid: sbuActiveStatus.id },
            select: ["id", "name"],
        });

        if (enabledSbus.length === 0) {
            logger.log({
                level: "info",
                message: buildLogMessage({
                    traceId,
                    status: "success",
                    location: "RoCreationUtils",
                    method: "handlePoliciesCloseToExpiry",
                    messageData: "No SBUs enabled for RO generation. Skipping.",
                }),
            });
            return;
        }

        logger.log({
            level: "info",
            message: buildLogMessage({
                traceId,
                status: "success",
                location: "RoCreationUtils",
                method: "handlePoliciesCloseToExpiry",
                messageData: `Found ${enabledSbus.length} SBU(s) enabled for RO generation`,
            }),
        });

        for (const sbu of enabledSbus) {
            // Atomically claim this SBU to prevent duplicate processing across pods.
            // The WHERE condition also re-claims records stuck in PROCESSING for over 2 hours (pod crash recovery).
            const claimResult = await orgSbuRepository.query(
                `UPDATE org_sbu
                 SET ro_process_status = 'PROCESSING', ro_process_started_at = NOW()
                 WHERE id = $1
                   AND (ro_process_status IS NULL OR ro_process_started_at < NOW() - INTERVAL '2 hours')`,
                [sbu.id]
            );

            if (claimResult[1] !== 1) {
                logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId,
                        status: "success",
                        location: "RoCreationUtils",
                        method: "handlePoliciesCloseToExpiry",
                        messageData: `Skipping SBU id=${sbu.id} — already claimed by another instance`,
                    }),
                });
                continue;
            }

            try {
            const suppressions = await sbuRoPolicyTypeSuppressionRepository.find({
                where: { sbuId: sbu.id },
                select: ["policyTypeLid"],
            });
            const suppressedIds = suppressions.map((s) => s.policyTypeLid);

            logger.log({
                level: "info",
                message: buildLogMessage({
                    traceId,
                    status: "success",
                    location: "RoCreationUtils",
                    method: "handlePoliciesCloseToExpiry",
                    messageData: `Processing SBU id=${sbu.id} name=${sbu.name}, suppressed policyTypes=${JSON.stringify(suppressedIds)}`,
                }),
            });

            const whereClause = `
                policy.policy_to BETWEEN :now AND :thresholdDate
                AND NOT EXISTS (
                    SELECT 1 FROM opportunity
                    WHERE opportunity_type_lid = :optyTypeRO
                      AND ref_policy_id = policy.id
                )
                AND (
                    policy.nature_of_bussiness_lid = :insuranceOnlyId
                    OR policy.nature_of_bussiness_lid IS NULL
                )
                AND (
                    policy.income_type_lid <> :installmentIncomeTypeId
                    OR policy.income_type_lid IS NULL
                )
                AND policy.sbu_id = :sbuId
                ${suppressedIds.length > 0 ? "AND policy.policy_type_lid NOT IN (:...suppressedIds)" : ""}
            `;

            const params = {
                now,
                thresholdDate,
                optyTypeRO: optyTypeRO.id,
                insuranceOnlyId: natureOfBusinessInsuranceOnly.id,
                sbuId: sbu.id,
                installmentIncomeTypeId: installmentIncomeType.id,
                ...(suppressedIds.length > 0 ? { suppressedIds } : {}),
            };

            const totalPoliciesCount = await policyRepository
                .createQueryBuilder("policy")
                .where(whereClause, params)
                .getCount();

            if (totalPoliciesCount === 0) {
                logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId,
                        status: "success",
                        location: "RoCreationUtils",
                        method: "handlePoliciesCloseToExpiry",
                        messageData: `No qualifying policies found for SBU id=${sbu.id}. Skipping.`,
                    }),
                });
                continue;
            }

            const batchSize = DEFAULT_RO_CRON_BATCH_SIZE;
            let successCount = 0;

            for (let offset = 0; offset < totalPoliciesCount; offset += batchSize) {
                const policies = await policyRepository
                    .createQueryBuilder("policy")
                    .where(whereClause, params)
                    .orderBy("policy.policy_to", "ASC")
                    .offset(offset)
                    .limit(batchSize)
                    .getMany();

                logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId,
                        status: "success",
                        location: "RoCreationUtils",
                        method: "handlePoliciesCloseToExpiry",
                        messageData: `Fetched ${policies.length} policies in batch at offset ${offset} for SBU id=${sbu.id}`,
                    }),
                });

                const policyTypeIds = [...new Set(policies.map((p) => p.policyTypeLid))];
                const policyTypeMappings = await policyTypeSegregationRepository.find({
                    select: ["policyTypeLid", "assocActivePolicyTypeLid"],
                    where: { policyTypeLid: In(policyTypeIds) },
                });
                const mappingMap = new Map(
                    policyTypeMappings.map((m) => [m.policyTypeLid, m.assocActivePolicyTypeLid])
                );

                const policyTypeLookups = await lookUpRepository.find({
                    where: { id: In(policyTypeIds) },
                    select: ["id", "lookUpKey"],
                });
                const groupedPolicyTypeLidSet = new Set(
                    policyTypeLookups
                        .filter((l) => GROUP_POLICY_TYPES.includes(l.lookUpKey))
                        .map((l) => l.id)
                );

                const groupedPolicyIds   = policies.filter((p) =>  groupedPolicyTypeLidSet.has(p.policyTypeLid)).map((p) => p.id);
                const nonGroupedPolicyIds = policies.filter((p) => !groupedPolicyTypeLidSet.has(p.policyTypeLid)).map((p) => p.id);

                const rawEndorsementRows: { policyId: number; totalGrossPremium: string; totalBrokerage: string }[] = [];
                if (groupedPolicyIds.length > 0) {
                    const rows = await endorsementRepository
                        .createQueryBuilder("e")
                        .select("e.policyId", "policyId")
                        .addSelect("SUM(e.grossPremium)", "totalGrossPremium")
                        .addSelect(
                            `SUM(${brokerageAmountExpr("e", { terrorismAmountColumn: "commissionTerrorismAmount" })})`,
                            "totalBrokerage"
                        )
                        .where("e.policyId IN (:...policyIds)", { policyIds: groupedPolicyIds })
                        .groupBy("e.policyId")
                        .getRawMany<{ policyId: number; totalGrossPremium: string; totalBrokerage: string }>();
                    rawEndorsementRows.push(...rows);
                }
                if (nonGroupedPolicyIds.length > 0) {
                    const rows = await policyAssetEndorsementRepository
                        .createQueryBuilder("e")
                        .select("e.policyId", "policyId")
                        .addSelect("SUM(e.grossPremium)", "totalGrossPremium")
                        // policy_asset_endorsement carries no SRCC/TC brokerage columns.
                        .addSelect(
                            `SUM(${brokerageAmountExpr("e", {
                                terrorismAmountColumn: "commissionTerrorismAmount",
                                hasSrcc: false,
                                hasTc: false,
                            })})`,
                            "totalBrokerage"
                        )
                        .where("e.policyId IN (:...policyIds)", { policyIds: nonGroupedPolicyIds })
                        .groupBy("e.policyId")
                        .getRawMany<{ policyId: number; totalGrossPremium: string; totalBrokerage: string }>();
                    rawEndorsementRows.push(...rows);
                }
                const endorsementPremiumMap = new Map(
                    rawEndorsementRows.map((r) => [r.policyId, parseFloat(r.totalGrossPremium) || 0])
                );
                const endorsementBrokerageMap = new Map(
                    rawEndorsementRows.map((r) => [r.policyId, parseFloat(r.totalBrokerage) || 0])
                );

                for (const policy of policies) {
                    try {
                        const endorsementPremium = endorsementPremiumMap.get(policy.id) ?? 0;
                        const endorsementBrokerage = endorsementBrokerageMap.get(policy.id) ?? 0;
                        await createRenewalOpportunity({
                            opportunityTypeLid:           optyTypeRO.id,
                            companyId:                    policy.companyId,
                            policyTypeLid:                mappingMap.get(policy.policyTypeLid) ?? policy.policyTypeLid,
                            refPolicyId:                  policy.id,
                            // Policy + endorsements, mirroring premiumPaid above.
                            // basic + SRCC + terrorism + fee. estimatedFee below is
                            // informational only -- fee is already inside this value.
                            estimatedBrokerage:           brokerageAmountOf(policy) + endorsementBrokerage,
                            estimatedBrokeragePercentage: policy.basicBrokeragePercentage,
                            premiumPaid:                  (policy.grossPremium ?? 0) + endorsementPremium,
                            expiryDate:                   policy.policyTo,
                            sumInsured:                   policy.sumInsured,
                            estimatedFee:                 policy.feeAmount ?? 0,
                            ownerId:                      policy.ownerId ?? policy.createdBy,
                            isPolicyMinedLid:             isPolicyMined.id,
                            organisationId:               policy.organisationId,
                            sbuId:                        policy.sbuId,
                            verticalId:                   policy.verticalId,
                            departmentId:                 policy.departmentId,
                            branchId:                     policy.branchId,
                        });
                        successCount++;
                    } catch (error) {
                        logger.error({
                            level: "error",
                            message: buildLogMessage({
                                traceId,
                                status: "failure",
                                location: "RoCreationUtils",
                                method: "handlePoliciesCloseToExpiry",
                                messageData: `Failed to create RO for policyId=${policy.id}, sbuId=${sbu.id}: ${error.message}`,
                            }),
                        });
                    }
                }
            }

            logger.log({
                level: "info",
                message: buildLogMessage({
                    traceId,
                    status: "success",
                    location: "RoCreationUtils",
                    method: "handlePoliciesCloseToExpiry",
                    messageData: `Completed SBU id=${sbu.id}: ${successCount}/${totalPoliciesCount} ROs created`,
                }),
            });
            } finally {
                await orgSbuRepository.query(
                    `UPDATE org_sbu SET ro_process_status = NULL, ro_process_started_at = NULL WHERE id = $1`,
                    [sbu.id]
                );
            }
        }
    } catch (error) {
        logger.error({
            level: "error",
            message: buildLogMessage({
                traceId,
                status: "failure",
                location: "RoCreationUtils",
                method: "handlePoliciesCloseToExpiry",
                messageData: error.message ?? error,
            }),
        });
    }
}
