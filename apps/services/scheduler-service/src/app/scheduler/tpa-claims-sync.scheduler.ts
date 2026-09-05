import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, MoreThanOrEqual, Not, Repository } from "typeorm";
import { ClaimSyncJob, ClaimSyncJobPriority, ClaimSyncJobStatus } from "../../../../service-lib/src/lib/entities/claim-sync-job.entity";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { PolicyClaim } from "../../../../service-lib/src/lib/entities/policy-employee-claim.entity";
import { PolicyEnrollmentEmployeePolicyMap } from "../../../../service-lib/src/lib/entities/policy-enrollment-employee-policy-map.entity";
import { PolicyTpaMap } from "../../../../service-lib/src/lib/entities/policy-tpa-map.entity";
import { TpaClaimData } from "../../../../service-lib/src/lib/entities/tpa-claim-data.entity";

// Claim statuses that are terminal — no further changes expected from TPA
const FINAL_CLAIM_STATUSES = ["settled", "approved", "rejected"];

// Both groups run nightly — 24 hours is the accepted staleness window
const STALE_AFTER_MS = 24 * 60 * 60 * 1000;

const TPA_DATA_TYPE = "TPA";

@Injectable()
export class TpaClaimsSyncScheduler {
  constructor(
    @InjectRepository(Policy)
    private readonly policyRepo: Repository<Policy>,
    @InjectRepository(PolicyClaim)
    private readonly policyClaimRepo: Repository<PolicyClaim>,
    @InjectRepository(PolicyEnrollmentEmployeePolicyMap)
    private readonly enrollmentMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>,
    @InjectRepository(PolicyTpaMap)
    private readonly policyTpaMapRepo: Repository<PolicyTpaMap>,
    @InjectRepository(TpaClaimData)
    private readonly tpaClaimDataRepo: Repository<TpaClaimData>,
    @InjectRepository(ClaimSyncJob)
    private readonly claimSyncJobRepo: Repository<ClaimSyncJob>,
  ) {}

  // ─── Nightly Producer ────────────────────────────────────────────────────────
  // Runs every 5 min (testing). Production: "30 19 * * *" → 01:00 AM IST
  // @Cron("*/5 * * * *") — disabled: replaced by GenericTpaSyncScheduler
  async produceNightlyJobs(): Promise<void> {
    console.log("[TpaProducer] Starting nightly job production");

    const [group1, group2] = await Promise.all([
      this.getGroup1Policies(),
      this.getGroup2Policies(),
    ]);

    // group2 excludes group1 policies — handled inside getGroup2Policies
    const g1Inserted = await this.insertJobs(group1, ClaimSyncJobPriority.HIGH);
    const g2Inserted = await this.insertJobs(group2, ClaimSyncJobPriority.NORMAL);

    console.log(
      `[TpaProducer] Done — group1 candidates=${group1.length} inserted=${g1Inserted} | group2 candidates=${group2.length} inserted=${g2Inserted}`,
    );
  }

  // ─── Group 1 ─────────────────────────────────────────────────────────────────
  // Policies with at least one claim in a non-final status.
  // These are actively in-flight and must be refreshed so reports stay accurate.
  private async getGroup1Policies(): Promise<Policy[]> {
    const openClaimRows = await this.policyClaimRepo
      .createQueryBuilder("pc")
      .select("pc.policyId", "policyId")
      .where("LOWER(pc.claimStatus) NOT IN (:...finalStatuses)", {
        finalStatuses: FINAL_CLAIM_STATUSES,
      })
      .andWhere("pc.deletedAt IS NULL")
      .distinct(true)
      .getRawMany<{ policyId: string }>();

    if (openClaimRows.length === 0) return [];

    const policyIds = openClaimRows.map((r) => Number(r.policyId));

    const policies = await this.policyRepo.find({
      where: {
        id: In(policyIds),
        insurerPolicyNumber: Not(IsNull()),
        policyTo: MoreThanOrEqual(new Date()),
      },
      select: ["id", "insurerPolicyNumber", "policyFrom", "policyTo"],
    });

    return this.filterByStale(policies);
  }

  // ─── Group 2 ─────────────────────────────────────────────────────────────────
  // Active policies with enrolled employees that have no open claims.
  // New claims could be filed any day while the policy is live.
  private async getGroup2Policies(): Promise<Policy[]> {
    // Get Group 1 policy IDs to exclude them
    const openClaimRows = await this.policyClaimRepo
      .createQueryBuilder("pc")
      .select("pc.policyId", "policyId")
      .where("LOWER(pc.claimStatus) NOT IN (:...finalStatuses)", {
        finalStatuses: FINAL_CLAIM_STATUSES,
      })
      .andWhere("pc.deletedAt IS NULL")
      .distinct(true)
      .getRawMany<{ policyId: string }>();

    const group1PolicyIds = openClaimRows.map((r) => Number(r.policyId));

    const enrolledRows = await this.enrollmentMapRepo
      .createQueryBuilder("eepm")
      .select("eepm.policyId", "policyId")
      .where("eepm.deletedAt IS NULL")
      .distinct(true)
      .getRawMany<{ policyId: string }>();

    if (enrolledRows.length === 0) return [];

    const enrolledPolicyIds = enrolledRows
      .map((r) => Number(r.policyId))
      .filter((id) => !group1PolicyIds.includes(id));

    if (enrolledPolicyIds.length === 0) return [];

    const policies = await this.policyRepo.find({
      where: {
        id: In(enrolledPolicyIds),
        insurerPolicyNumber: Not(IsNull()),
        policyTo: MoreThanOrEqual(new Date()),
      },
      select: ["id", "insurerPolicyNumber", "policyFrom", "policyTo"],
    });

    return this.filterByStale(policies);
  }

  // ─── Staleness Filter ────────────────────────────────────────────────────────
  // Returns only the policies not fetched within the last 24 hours.
  // Resolves in a single batch query — no N+1.
  private async filterByStale(policies: Policy[]): Promise<Policy[]> {
    if (policies.length === 0) return [];

    const policyNumbers = policies
      .map((p) => p.insurerPolicyNumber)
      .filter(Boolean) as string[];

    const latestFetches = await this.tpaClaimDataRepo
      .createQueryBuilder("tcd")
      .select("tcd.policyNumber", "policyNumber")
      .addSelect("MAX(tcd.fetchedAt)", "maxFetchedAt")
      .where("tcd.policyNumber IN (:...policyNumbers)", { policyNumbers })
      .andWhere("tcd.dataType = :dataType", { dataType: TPA_DATA_TYPE })
      .groupBy("tcd.policyNumber")
      .getRawMany<{ policyNumber: string; maxFetchedAt: string | null }>();

    const fetchMap = new Map(
      latestFetches.map((r) => [r.policyNumber, r.maxFetchedAt]),
    );

    const threshold = new Date(Date.now() - STALE_AFTER_MS);

    return policies.filter((p) => {
      const lastFetch = fetchMap.get(p.insurerPolicyNumber!);
      if (!lastFetch) return true;
      return new Date(lastFetch) < threshold;
    });
  }

  // ─── Job Insertion ───────────────────────────────────────────────────────────
  // Inserts PENDING jobs. Skips policies already queued (PENDING or PROCESSING).
  // Sets tpaId from policy_tpa_map so Worker + Parser can load per-TPA config.
  private async insertJobs(
    policies: Policy[],
    priority: ClaimSyncJobPriority,
  ): Promise<number> {
    if (policies.length === 0) return 0;

    const existingJobs = await this.claimSyncJobRepo.find({
      where: {
        policyId: In(policies.map((p) => p.id)),
        status: In([ClaimSyncJobStatus.PENDING, ClaimSyncJobStatus.PROCESSING]),
      },
      select: ["policyId"],
    });

    const alreadyQueued = new Set(existingJobs.map((j) => j.policyId));
    const freshPolicies = policies.filter((p) => !alreadyQueued.has(p.id));
    if (freshPolicies.length === 0) return 0;

    // Batch-load TPA IDs for all fresh policies
    const tpaMaps = await this.policyTpaMapRepo.find({
      where: { policyId: In(freshPolicies.map((p) => p.id)) },
      select: ["policyId", "tpaId"],
    });
    const tpaByPolicy = new Map(tpaMaps.map((m) => [m.policyId, m.tpaId]));

    const newJobs = freshPolicies.map((p) => {
      const job = new ClaimSyncJob();
      job.policyId = p.id;
      job.policyNumber = p.insurerPolicyNumber!;
      job.policyStartDate = p.policyFrom;
      job.policyEndDate = p.policyTo;
      job.tpaId = tpaByPolicy.get(p.id) ?? null;
      job.priority = priority;
      job.status = ClaimSyncJobStatus.PENDING;
      job.retryCount = 0;
      return job;
    });

    await this.claimSyncJobRepo.save(newJobs);
    return newJobs.length;
  }
}