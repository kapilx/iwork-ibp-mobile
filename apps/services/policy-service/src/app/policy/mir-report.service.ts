import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import axios from "axios";
import { MirReport, MirReportSection, MstrMirSection } from "../../../../service-lib/src/lib/entities";
import { FieldEncryptionService } from "../../../../service-lib/src/lib/field-encryption/services/field-encryption.service";
import { NotificationUtils } from "../../../../service-lib/src/lib/utils/notification.utils";
import { ENV } from "../../../../service-lib/src/lib/environment";
import {
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_EMAIL,
  NOTIFICATION_IN_APP,
  serviceNames,
} from "../../../../service-lib/src/lib/constants";
import { GROUP_POLICY_TYPES } from "../../../../../../libs/service-lib/src/lib/constants";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { ServiceTatService } from "../service-tat/service-tat.service";

const MIR_SECTION_ROWS: Record<string, Record<string, (string | boolean)[][]>> = {
  s5: {
    s5t1: [
      ["Financial Risk", "ALOP", false, false, false, ""],
      ["People Risk", "GMC", false, false, false, ""],
    ],
  },
  s12: {
    s12t1: [
      ["Documentation", "", "", ""],
      ["Claims", "", "", ""],
      ["Meetings", "", "", ""],
      ["Others", "", "", ""],
      ["Renewals", "", "", ""],
    ],
  },
};

export const MIR_SECTION_MASTER = [
  { id: 1, sectionKey: "s1", sectionName: "Critical Issues Needing Your Immediate Attention", displayOrder: 1 },
  { id: 2, sectionKey: "s2", sectionName: "Claim Documentation", displayOrder: 2 },
  { id: 3, sectionKey: "s3", sectionName: "Renewals Due in 3 Months", displayOrder: 3 },
  { id: 4, sectionKey: "s4", sectionName: "Claims", displayOrder: 4 },
  { id: 5, sectionKey: "s5", sectionName: "Risk Matrix", displayOrder: 5 },
  { id: 6, sectionKey: "s6", sectionName: "Portfolio Detail", displayOrder: 6 },
  { id: 7, sectionKey: "s7", sectionName: "Policy Insurer Details", displayOrder: 7 },
  { id: 8, sectionKey: "s8", sectionName: "Head Count for Health Policies", displayOrder: 8 },
  { id: 9, sectionKey: "s9", sectionName: "Cash Deposit Account", displayOrder: 9 },
  { id: 10, sectionKey: "s10", sectionName: "Our Service Tracker", displayOrder: 10 },
  { id: 11, sectionKey: "s11", sectionName: "Other Activities", displayOrder: 11 },
  { id: 12, sectionKey: "s12", sectionName: "Current Month Plan", displayOrder: 12 },
  { id: 13, sectionKey: "s13", sectionName: "Overall Comments", displayOrder: 13 },
];

export interface SubmitSectionDto {
  sectionKey: string;
  sectionSummary?: string;
  cellData?: Record<string, string | boolean>;
}

export interface SubmitMirDto {
  overallComments?: string;
  sections: SubmitSectionDto[];
}

@Injectable()
export class MirReportService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(MirReport)
    private readonly mirReportRepo: Repository<MirReport>,
    @InjectRepository(MirReportSection)
    private readonly sectionRepo: Repository<MirReportSection>,
    @InjectRepository(MstrMirSection)
    private readonly masterSectionRepo: Repository<MstrMirSection>,
    private readonly fieldEncryptionService: FieldEncryptionService,
    private readonly notificationUtils: NotificationUtils,
    private readonly traceIdService: TraceIdService,
    private readonly scopeService: ScopeService,
    private readonly serviceTatService: ServiceTatService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.POLICY_SERVICE);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  // Best-effort notification dispatch (BR-MIR-019) — never throws, so a
  // notification-service outage can't block a MIR submit/approve/reject/etc.
  private async sendMirNotification(
    eventType: string,
    userIds: (number | null | undefined)[],
    valueMap: Record<string, string>,
  ): Promise<void> {
    const logCtx = { eventType, userIds };
    try {
      const ids = [...new Set(userIds.filter((id): id is number => Number.isFinite(id) && (id as number) > 0))];
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          status: "success",
          location: "MirReportService",
          method: "sendMirNotification",
          payload: logCtx,
          messageData: `resolved ${ids.length} recipient id(s): ${JSON.stringify(ids)}`,
        }),
      });
      if (!ids.length) {
        this.logger.log({
          level: "warn",
          message: buildLogMessage({
            status: "failure",
            location: "MirReportService",
            method: "sendMirNotification",
            payload: logCtx,
            messageData: "no valid recipient ids — skipping notification",
          }),
        });
        return;
      }

      const mgr = this.mirReportRepo.manager;
      const users = await mgr.query<{ id: number; email: string }[]>(
        `SELECT id, COALESCE(email_id_enc, email_id) AS email FROM users WHERE id = ANY($1::int[])`,
        [ids],
      );
      const emails = users.map((u) => u.email).filter(Boolean);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          status: "success",
          location: "MirReportService",
          method: "sendMirNotification",
          payload: logCtx,
          messageData: `resolved ${emails.length}/${ids.length} email(s) from users table for ids ${JSON.stringify(ids)}`,
        }),
      });
      if (!emails.length) {
        this.logger.log({
          level: "warn",
          message: buildLogMessage({
            status: "failure",
            location: "MirReportService",
            method: "sendMirNotification",
            payload: logCtx,
            messageData: `no emails found for ids ${JSON.stringify(ids)} — skipping notification`,
          }),
        });
        return;
      }

      const eventDetails = await this.notificationUtils.getNotificationDetailsByEvent(eventType);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          status: "success",
          location: "MirReportService",
          method: "sendMirNotification",
          payload: logCtx,
          messageData: `event parameter mapping for '${eventType}': ${JSON.stringify(eventDetails)}`,
        }),
      });
      if (!eventDetails.length) {
        this.logger.log({
          level: "warn",
          message: buildLogMessage({
            status: "failure",
            location: "MirReportService",
            method: "sendMirNotification",
            payload: logCtx,
            messageData: `no notification_event_type/parameter mapping found for '${eventType}' — the notification-service will likely reject this event`,
          }),
        });
      }

      const parameters: Record<string, string> = {};
      for (const detail of eventDetails) {
        parameters[detail.parameterKey] = valueMap[detail.parameterKey] ?? "";
      }

      const basePayload = { eventType, userId: ids, emailId: emails, parameters };
      const headers = { "x-bypass-timeout": "true" };
      const url = `${ENV.URL_NOTIFICATION_SERVICE}/notifications`;
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          status: "success",
          location: "MirReportService",
          method: "sendMirNotification",
          payload: logCtx,
          messageData: `POSTing to ${url} — payload: ${JSON.stringify(basePayload)}`,
        }),
      });

      const [inAppResult, emailResult] = await Promise.allSettled([
        axios.post(url, { ...basePayload, channel: NOTIFICATION_IN_APP }, { headers }),
        axios.post(url, { ...basePayload, channel: NOTIFICATION_EMAIL }, { headers }),
      ]);

      for (const [channel, result] of [
        [NOTIFICATION_IN_APP, inAppResult],
        [NOTIFICATION_EMAIL, emailResult],
      ] as const) {
        if (result.status === "fulfilled") {
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              status: "success",
              location: "MirReportService",
              method: "sendMirNotification",
              payload: logCtx,
              messageData: `channel '${channel}' → notification-service responded ${result.value.status}: ${JSON.stringify(result.value.data)}`,
            }),
          });
        } else {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              status: "failure",
              location: "MirReportService",
              method: "sendMirNotification",
              payload: logCtx,
              messageData: `channel '${channel}' → request to ${url} failed: ${result.reason?.response?.status ?? ""} ${JSON.stringify(result.reason?.response?.data ?? result.reason?.message ?? result.reason)}`,
            }),
          });
        }
      }
    } catch (error) {
      // Swallow — notification failures must never break the MIR workflow.
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          status: "failure",
          location: "MirReportService",
          method: "sendMirNotification",
          payload: logCtx,
          messageData: error,
        }),
      });
    }
  }

  // Returns ISO date strings (YYYY-MM-DD) — avoids pg Date serialization ambiguity
  private parsePeriod(period: string): {
    startStr: string; endStr: string; threeMonthsEndStr: string; prevMonthEndStr: string;
  } {
    const [mm, yyyy] = period.split("-").map(Number);
    const pad = (n: number) => String(n).padStart(2, "0");
    const startStr = `${yyyy}-${pad(mm)}-01`;
    const lastDay = new Date(yyyy, mm, 0).getDate();
    const endStr = `${yyyy}-${pad(mm)}-${pad(lastDay)}`;
    const t = new Date(yyyy, mm + 2, 0);
    const threeMonthsEndStr = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
    // Last day of the month immediately before the selected period.
    const prevMonthEnd = new Date(yyyy, mm - 1, 0);
    const prevMonthEndStr = `${prevMonthEnd.getFullYear()}-${pad(prevMonthEnd.getMonth() + 1)}-${pad(prevMonthEnd.getDate())}`;
    return { startStr, endStr, threeMonthsEndStr, prevMonthEndStr };
  }

  private fmtAmt(n: string | number): string {
    const val = Number(n);
    if (isNaN(val)) return "—";
    return `Rs ${val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Plain Indian-locale integer, no currency prefix/decimals — used for the
  // "count / value" cell pairs in §4 Claims (e.g. "10 / 4,75,309").
  private fmtNum(n: string | number): string {
    const val = Number(n);
    if (isNaN(val)) return "0";
    return val.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  }

  private fmtDate(d: string | Date): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }

  // PRD convention: "Policy Type - Insurer Policy Number", or "POL-{id}"
  // when the policy has no insurer number (there is no policy-specific name).
  private policyLabel(policyType: string | null, insurerPolicyNumber: string | null, policyId: number): string {
    const suffix = insurerPolicyNumber?.trim() || `POL-${policyId}`;
    return `${policyType || "—"} - ${suffix}`;
  }

  // ── Dynamic section rows from live DB ────────────────────────────────────

  private async getDynamicSectionRows(
    companyId: number,
    period: string,
    organisationId: number | null,
  ): Promise<Record<string, Record<string, (string | boolean)[][]>>> {
    const { startStr, endStr, threeMonthsEndStr, prevMonthEndStr } = this.parsePeriod(period);
    const mgr = this.mirReportRepo.manager;

    const safeNum = (col: string) =>
      `COALESCE(NULLIF(${col}::text, '')::numeric, 0)`;

    // Look for gross_premium in a endorsement/policy_asset_endorsement in group/non-group policies respectively, else fall back to policy.premium_at_inception.
    const inceptionPremiumExpr = (alias: string, groupTypesParamIndex: number) =>
      `COALESCE(
         CASE
           WHEN ${alias}.policy_type_lid IN (
                 SELECT id FROM lookup_data WHERE lookup_key = ANY($${groupTypesParamIndex}::text[])
               )
           THEN (SELECT SUM(e.gross_premium) FROM endorsement e
                 WHERE e.policy_id = ${alias}.id
                   AND e.is_inception = true
                   AND e.to_be_mapped_post_upload_lid = 9401
                   AND e.enabled_for_performance_lid = 9401)
           ELSE (SELECT SUM(pae.gross_premium) FROM policy_asset_endorsement pae
                 WHERE pae.policy_id = ${alias}.id
                   AND pae.is_inception = true)
         END,
         ${alias}.premium_at_inception
       )`;

    // ── s1: Critical Issues — policies active during reporting period ──────

    const s1Data = await mgr.query<{ policy_type: string | null; cnt: string; total_premium: string }[]>(
      `WITH policy_premium AS (
         SELECT p.id AS policy_id,
                COALESCE(NULLIF(ld1.value, ''), ld1.lookup_key) AS policy_type,
                ${inceptionPremiumExpr("p", 5)} AS inception_premium
         FROM policy p
         INNER JOIN lookup_data ld1 ON ld1.id = p.policy_type_lid AND ld1.status = 1 AND ld1.organisation_id = $4
         WHERE p.company_id = $1
           AND p.policy_from <= $2
           AND p.policy_to   >= $3
       )
       SELECT policy_type,
              COUNT(*)::text AS cnt,
              ${safeNum("SUM(inception_premium)")}::text AS total_premium
       FROM policy_premium
       GROUP BY policy_type
       ORDER BY policy_type`,
      [companyId, endStr, startStr, organisationId, GROUP_POLICY_TYPES],
    );
    const s1t1: (string | boolean)[][] = s1Data.map((r) => [
      r.policy_type || "—",
      r.cnt,
      this.fmtAmt(r.total_premium),
      "",
      "",
    ]);

    // ── s2: Claim Documentation — pending claims + pending endorsements ────
    const [claimRow] = await mgr.query<{ cnt: string }[]>(
      `SELECT COUNT(*)::text AS cnt
       FROM policy_claim pc
       WHERE pc.claim_status = 'PENDING'
         AND pc.policy_id IN (
               SELECT policy.id FROM policy
               INNER JOIN lookup_data ld ON ld.id = policy.policy_type_lid AND ld.status = 1 AND ld.organisation_id = $4
               WHERE policy.company_id = $1 AND policy.policy_from <= $2 AND policy.policy_to >= $3
             )`,
      [companyId, endStr, startStr, organisationId],
    );
    const [endorseRow] = await mgr.query<{ cnt: string }[]>(
      `SELECT COUNT(*)::text AS cnt
       FROM endorsement e
       WHERE e.insurer_endorsement_date IS NULL
         AND e.policy_id IN (
               SELECT policy.id FROM policy
               INNER JOIN lookup_data ld ON ld.id = policy.policy_type_lid AND ld.status = 1 AND ld.organisation_id = $4
               WHERE policy.company_id = $1 AND policy.policy_from <= $2 AND policy.policy_to >= $3
             )`,
      [companyId, endStr, startStr, organisationId],
    );

    const [assetEndorseRow] = await mgr.query<{ cnt: string }[]>(
      `SELECT COUNT(*)::text AS cnt
       FROM policy_asset_endorsement pae
       WHERE (
               CASE
                 WHEN pae.endorsement_type = 'EXTENSION'
                 THEN pae.endorsement_status = 'ENDORSEMENT_REQUEST_RECEIVED'
                 ELSE pae.insurer_endorsement_date IS NULL
               END
             )
         AND pae.policy_id IN (
               SELECT policy.id FROM policy
               INNER JOIN lookup_data ld ON ld.id = policy.policy_type_lid AND ld.status = 1 AND ld.organisation_id = $4
               WHERE policy.company_id = $1 AND policy.policy_from <= $2 AND policy.policy_to >= $3
             )`,
      [companyId, endStr, startStr, organisationId],
    );
    const pendingClaims = Number(claimRow?.cnt ?? 0);
    const pendingEndorsements = Number(endorseRow?.cnt ?? 0) + Number(assetEndorseRow?.cnt ?? 0);
    const s2t1: (string | boolean)[][] = [
      ["Claims Documentation", `${pendingClaims} Claims pending`, "", ""],
      [
        "Policy Documentation",
        pendingEndorsements === 0
          ? "No Endorsements Pending"
          : `${pendingEndorsements} Endorsements Pending`,
        "",
        "",
      ],
      // No live data source for these two — CRM fills Details/Remarks/Action directly.
      ["Uncovered Risks", "", "", ""],
      ["Other Issues", "", "", ""],
    ];

    // ── s3: Renewals Due in 3 Months ──────────────────────────────────────
    const s3Data = await mgr.query<{
      policy_id: number;
      policy_type: string | null;
      insurer_policy_number: string | null;
      renewal_date: string;
      premium: string;
      activity_name: string | null;
    }[]>(
      `SELECT p.id                    AS policy_id,
              COALESCE(NULLIF(ld.value, ''), ld.lookup_key) AS policy_type,
              p.insurer_policy_number,
              p.policy_to::text       AS renewal_date,
              ${safeNum(inceptionPremiumExpr("p", 5))}::text AS premium,
              COALESCE(
                (SELECT oam.activity_name FROM opportunity_activity_map oam
                 WHERE oam.opportunity_id = p.opportunity_id AND oam.completed_at IS NULL
                 ORDER BY oam.activity_order ASC LIMIT 1),
                (SELECT oam.activity_name FROM opportunity_activity_map oam
                 WHERE oam.opportunity_id = p.opportunity_id
                 ORDER BY oam.activity_order DESC LIMIT 1)
              ) AS activity_name
       FROM policy p
       INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.status = 1 AND ld.organisation_id = $4
       WHERE p.company_id = $1
         AND p.policy_to >= $2
         AND p.policy_to <= $3
       ORDER BY p.policy_to ASC`,
      [companyId, startStr, threeMonthsEndStr, organisationId, GROUP_POLICY_TYPES],
    );
    const s3t1: (string | boolean)[][] = s3Data.map((r) => [
      this.policyLabel(r.policy_type, r.insurer_policy_number, r.policy_id),
      r.renewal_date ? this.fmtDate(r.renewal_date) : "—",
      this.fmtAmt(r.premium),
      r.activity_name || "—",
    ]);

    // ── s4: Claims ───────────────────────────────────────────────────────────

    // ── s4t1: policy-level claim movement (Start + Received − Paid = End) ──
    const s4t1Data = await mgr.query<{
      policy_id: number;
      policy_type: string | null;
      insurer_policy_number: string | null;
      start_cnt: string; start_val: string;
      received_cnt: string; received_val: string;
      paid_cnt: string; paid_val: string;
    }[]>(
      `SELECT p.id AS policy_id,
              COALESCE(NULLIF(ld.value, ''), ld.lookup_key) AS policy_type,
              p.insurer_policy_number,
              -- Start of Month: raised before this month (policy_from..prev month end),
              -- still pending as of report generation (snapshot semantics, BR-MIR-004).
              (SELECT COUNT(*) FROM policy_claim pc
               WHERE pc.policy_id = p.id AND pc.deleted_at IS NULL
                 AND pc.claim_dt BETWEEN p.policy_from AND $4
                 AND COALESCE(pc.claim_status, '') != 'SETTLED')::text AS start_cnt,
              (SELECT ${safeNum("SUM(pc.claim_amount)")} FROM policy_claim pc
               WHERE pc.policy_id = p.id AND pc.deleted_at IS NULL
                 AND pc.claim_dt BETWEEN p.policy_from AND $4
                 AND COALESCE(pc.claim_status, '') != 'SETTLED')::text AS start_val,
              -- Received: raised during this month, still pending.
              (SELECT COUNT(*) FROM policy_claim pc
               WHERE pc.policy_id = p.id AND pc.deleted_at IS NULL
                 AND pc.claim_dt BETWEEN $3 AND $2
                 AND COALESCE(pc.claim_status, '') != 'SETTLED')::text AS received_cnt,
              (SELECT ${safeNum("SUM(pc.claim_amount)")} FROM policy_claim pc
               WHERE pc.policy_id = p.id AND pc.deleted_at IS NULL
                 AND pc.claim_dt BETWEEN $3 AND $2
                 AND COALESCE(pc.claim_status, '') != 'SETTLED')::text AS received_val,
              -- Paid: settled during this month (regardless of raise date) — updated_at
              -- is the settlement-timestamp proxy used elsewhere in this report (§4.3/§10).
              (SELECT COUNT(*) FROM policy_claim pc
               WHERE pc.policy_id = p.id AND pc.deleted_at IS NULL
                 AND pc.claim_status = 'SETTLED'
                 AND pc.updated_at::date BETWEEN $3 AND $2)::text AS paid_cnt,
              (SELECT ${safeNum("SUM(pc.claim_amount)")} FROM policy_claim pc
               WHERE pc.policy_id = p.id AND pc.deleted_at IS NULL
                 AND pc.claim_status = 'SETTLED'
                 AND pc.updated_at::date BETWEEN $3 AND $2)::text AS paid_val
       FROM policy p
       INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.status = 1 AND ld.organisation_id = $5
       WHERE p.company_id = $1
         AND p.policy_from <= $2
         AND p.policy_to   >= $3
       ORDER BY p.policy_name`,
      [companyId, endStr, startStr, prevMonthEndStr, organisationId],
    );
    const s4t1: (string | boolean)[][] = s4t1Data.map((r) => {
      const startCnt = Number(r.start_cnt), startVal = Number(r.start_val);
      const receivedCnt = Number(r.received_cnt), receivedVal = Number(r.received_val);
      const paidCnt = Number(r.paid_cnt), paidVal = Number(r.paid_val);
      return [
        this.policyLabel(r.policy_type, r.insurer_policy_number, r.policy_id),
        `${startCnt} / ${this.fmtNum(startVal)}`,
        `${receivedCnt} / ${this.fmtNum(receivedVal)}`,
        `${paidCnt} / ${this.fmtNum(paidVal)}`,
        `${startCnt + receivedCnt - paidCnt} / ${this.fmtNum(startVal + receivedVal - paidVal)}`,
        "",
      ];
    });

    // ── s4t2: Claim Analysis — snapshot as of prevMonthEnd ──────────────────

    const s4t2Data = await mgr.query<{
      policy_id: number;
      policy_type: string | null;
      insurer_policy_number: string | null;
      premium: string;
      premium_ytd: string;
      claims_to_date: string;
    }[]>(
      `SELECT p.id AS policy_id,
              COALESCE(NULLIF(ld.value, ''), ld.lookup_key) AS policy_type,
              p.insurer_policy_number,
              ${safeNum(inceptionPremiumExpr("p", 5))}::text AS premium,
              (SELECT ${safeNum("SUM(e.gross_premium)")} FROM endorsement e
               WHERE e.policy_id = p.id
                 AND e.insurer_endorsement_date >= p.policy_from
                 AND e.insurer_endorsement_date <= $6)::text AS premium_ytd,
              (SELECT ${safeNum("SUM(pc.claim_amount)")} FROM policy_claim pc
               WHERE pc.policy_id = p.id AND pc.deleted_at IS NULL
                 AND pc.claim_dt BETWEEN p.policy_from AND $2)::text AS claims_to_date
       FROM policy p
       INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.status = 1 AND ld.organisation_id = $4
       WHERE p.company_id  = $1
         AND p.policy_from <= $2
         AND p.policy_to   >= $3
       ORDER BY p.policy_name`,
      [companyId, prevMonthEndStr, startStr, organisationId, GROUP_POLICY_TYPES, endStr],
    );
    const s4t2: (string | boolean)[][] = s4t2Data.map((r) => {
      const premiumYtd = Number(r.premium_ytd);
      const claimsToDate = Number(r.claims_to_date);
      // Loss Ratio = Claims as on Date ÷ Premium YTD × 100.
      const lossRatio = premiumYtd > 0 ? ((claimsToDate / premiumYtd) * 100).toFixed(2) : "—";
      return [
        this.policyLabel(r.policy_type, r.insurer_policy_number, r.policy_id),
        this.fmtAmt(r.premium),
        this.fmtAmt(r.premium_ytd),
        this.fmtAmt(r.claims_to_date),
        lossRatio,
        "",
      ];
    });

    // ── s4t3: Claim Aging Analysis — reimbursement only, ascending TAT ──────
    // day_elapsed measured against the period end (snapshot), not now().
    const s4t3Data = await mgr.query<{
      policy_id: number;
      policy_type: string | null;
      insurer_policy_number: string | null;
      out_cnt: string; out_val: string;
      b15_cnt: string; b15_val: string;
      b30_cnt: string; b30_val: string;
      b45_cnt: string; b45_val: string;
      over45_cnt: string; over45_val: string;
    }[]>(
      `WITH outstanding AS (
         SELECT pc.policy_id, pc.claim_amount,
                ($2::date - pc.claim_dt) AS days_elapsed
         FROM policy_claim pc
         WHERE pc.deleted_at IS NULL
           AND pc.clm_type = 'REIMBURSEMENT'
           AND COALESCE(pc.claim_status, '') != 'SETTLED'
       )
       SELECT p.id AS policy_id,
              COALESCE(NULLIF(ld.value, ''), ld.lookup_key) AS policy_type,
              p.insurer_policy_number,
              COUNT(o.claim_amount)::text                                             AS out_cnt,
              ${safeNum("SUM(o.claim_amount)")}::text                                 AS out_val,
              COUNT(*) FILTER (WHERE o.days_elapsed <= 15)::text                      AS b15_cnt,
              ${safeNum("SUM(o.claim_amount) FILTER (WHERE o.days_elapsed <= 15)")}::text AS b15_val,
              COUNT(*) FILTER (WHERE o.days_elapsed > 15 AND o.days_elapsed <= 30)::text  AS b30_cnt,
              ${safeNum("SUM(o.claim_amount) FILTER (WHERE o.days_elapsed > 15 AND o.days_elapsed <= 30)")}::text AS b30_val,
              COUNT(*) FILTER (WHERE o.days_elapsed > 30 AND o.days_elapsed <= 45)::text  AS b45_cnt,
              ${safeNum("SUM(o.claim_amount) FILTER (WHERE o.days_elapsed > 30 AND o.days_elapsed <= 45)")}::text AS b45_val,
              COUNT(*) FILTER (WHERE o.days_elapsed > 45)::text                       AS over45_cnt,
              ${safeNum("SUM(o.claim_amount) FILTER (WHERE o.days_elapsed > 45)")}::text  AS over45_val
       FROM policy p
       LEFT JOIN outstanding o ON o.policy_id = p.id
       INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.status = 1 AND ld.organisation_id = $4
       WHERE p.company_id  = $1
         AND p.policy_from <= $2
         AND p.policy_to   >= $3
       GROUP BY p.id, ld.value, ld.lookup_key, p.insurer_policy_number
       ORDER BY policy_type, p.insurer_policy_number`,
      [companyId, prevMonthEndStr, startStr, organisationId],
    );
    // Column order matches the PRD's descending header sequence:
    // Outstanding, >45, >30, >15, <15.
    const s4t3: (string | boolean)[][] = s4t3Data.map((r) => [
      this.policyLabel(r.policy_type, r.insurer_policy_number, r.policy_id),
      `${r.out_cnt} / ${this.fmtNum(r.out_val)}`,
      `${r.over45_cnt} / ${this.fmtNum(r.over45_val)}`,
      `${r.b45_cnt} / ${this.fmtNum(r.b45_val)}`,
      `${r.b30_cnt} / ${this.fmtNum(r.b30_val)}`,
      `${r.b15_cnt} / ${this.fmtNum(r.b15_val)}`,
    ]);

    // ── s4t4: claim references aged 30–45 days only ────────────────────────

    const s4t4Data = await mgr.query<{
      policy_type: string | null;
      insurer_policy_number: string | null;
      policy_id: number;
      claim_number: string;
      claim_amount: string;
      claim_dt: string;
    }[]>(
      `SELECT COALESCE(NULLIF(ld.value, ''), ld.lookup_key) AS policy_type,
              p.insurer_policy_number, p.id AS policy_id,
              pc.claim_number, pc.claim_amount::text AS claim_amount, pc.claim_dt::text AS claim_dt
       FROM policy_claim pc
       JOIN policy p ON p.id = pc.policy_id
       INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.status = 1 AND ld.organisation_id = $4
       WHERE pc.deleted_at IS NULL
         AND pc.clm_type = 'REIMBURSEMENT'
         AND COALESCE(pc.claim_status, '') != 'SETTLED'
         AND p.company_id  = $1
         AND p.policy_from <= $2
         AND p.policy_to   >= $3
         AND ($2::date - pc.claim_dt) > 30
         AND ($2::date - pc.claim_dt) <= 45
       ORDER BY pc.claim_dt ASC`,
      [companyId, prevMonthEndStr, startStr, organisationId],
    );
    const s4t4: (string | boolean)[][] = s4t4Data.map((r) => {
      const policyName = this.policyLabel(r.policy_type, r.insurer_policy_number, r.policy_id);
      return [
        r.claim_number?.trim() || "—",
        policyName,
        this.fmtAmt(r.claim_amount),
        r.claim_dt ? this.fmtDate(r.claim_dt) : "—",
        "",
      ];
    });

    // ── s6: Portfolio Detail — policies active during reporting period ─────

    const s6Data = await mgr.query<{
      policy_id: number;
      policy_type: string | null;
      insurer_policy_number: string | null;
      renewal_date: string;
      premium: string;
      sum_insured: string;
      premium_ytd: string;
      claims_ytd: string;
      insurer_name: string | null;
      branch_name: string | null;
    }[]>(
      `SELECT p.id                                       AS policy_id,
              COALESCE(NULLIF(ld.value, ''), ld.lookup_key) AS policy_type,
              p.insurer_policy_number,
              p.policy_to::text                           AS renewal_date,
              ${safeNum(inceptionPremiumExpr("p", 5))}::text AS premium,
              ${safeNum("p.sum_insured")}::text AS sum_insured,
              (SELECT ${safeNum("SUM(e.gross_premium)")} FROM endorsement e
               WHERE e.policy_id = p.id
                 AND e.insurer_endorsement_date >= p.policy_from
                 AND e.insurer_endorsement_date <= $2)::text AS premium_ytd,
              (SELECT ${safeNum("SUM(pc.claim_amount)")} FROM policy_claim pc
               WHERE pc.policy_id = p.id AND pc.deleted_at IS NULL
                 AND pc.claim_dt BETWEEN p.policy_from AND $2)::text AS claims_ytd,
              (SELECT i.name FROM policy_insurer_map pim
               JOIN insurer i ON i.id = pim.insurer_id
               WHERE pim.policy_id = p.id AND pim.deleted_at IS NULL
                 AND pim.insurer_participation_type_lid =
                     (SELECT id FROM lookup_data WHERE lookup_key = 'INSURER_PARTICIPATION_TYPE_LEAD')
               LIMIT 1) AS insurer_name,
              (SELECT COALESCE(a.branch_name, a.addr_1) FROM policy_insurer_map pim
               JOIN address a ON a.id = pim.insurer_branch_id
               WHERE pim.policy_id = p.id AND pim.deleted_at IS NULL
                 AND pim.insurer_participation_type_lid =
                     (SELECT id FROM lookup_data WHERE lookup_key = 'INSURER_PARTICIPATION_TYPE_LEAD')
               LIMIT 1) AS branch_name
       FROM policy p
       INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.status = 1 AND ld.organisation_id = $4
       WHERE p.company_id = $1
         AND p.policy_from <= $2
         AND p.policy_to   >= $3
       ORDER BY p.policy_name`,
      [companyId, endStr, startStr, organisationId, GROUP_POLICY_TYPES],
    );
    const s6t1: (string | boolean)[][] = s6Data.map((r) => {
      const insurerCell = r.insurer_name
        ? r.branch_name ? `${r.insurer_name}, ${r.branch_name}` : r.insurer_name
        : "—";
      return [
        this.policyLabel(r.policy_type, r.insurer_policy_number, r.policy_id),
        r.renewal_date ? this.fmtDate(r.renewal_date) : "—",
        this.fmtAmt(r.premium),
        this.fmtAmt(r.sum_insured),
        this.fmtAmt(r.premium_ytd),
        this.fmtAmt(r.claims_ytd),
        insurerCell,
      ];
    });

    // ── s7: Policy Insurer Details ─────────────────────────────────────────
    const s7Data = await mgr.query<{
      policy_id: number;
      policy_type: string | null;
      insurer_policy_number: string | null;
      insurer_name: string;
      branch_name: string;
      contact_person: string;
      contact_phone_raw: string | null;
    }[]>(
      `SELECT p.id                                                        AS policy_id,
              COALESCE(NULLIF(ld.value, ''), ld.lookup_key)                AS policy_type,
              p.insurer_policy_number,
              COALESCE(i.name, '')                                        AS insurer_name,
              COALESCE(MAX(a.branch_name), MAX(a.addr_1), '')             AS branch_name,
              COALESCE(MAX(TRIM(c.first_name || ' ' || c.last_name)), '') AS contact_person,
              MAX(
                (SELECT COALESCE(ccd.communication_details_enc, ccd.communication_details)
                 FROM contact_communication_details ccd
                 WHERE ccd.contact_id = c.id
                   AND ccd.communication_type = 'phone'
                   AND ccd.deleted_at IS NULL
                 ORDER BY ccd.is_primary DESC, ccd.id ASC
                 LIMIT 1)
              ) AS contact_phone_raw
       FROM policy p
       LEFT JOIN policy_insurer_map pim
              ON pim.policy_id = p.id
             AND pim.deleted_at IS NULL
             AND pim.insurer_participation_type_lid = (
                   SELECT id FROM lookup_data WHERE lookup_key = 'INSURER_PARTICIPATION_TYPE_LEAD'
                 )
       LEFT JOIN insurer  i ON i.id = pim.insurer_id
       LEFT JOIN address  a ON a.id = pim.insurer_branch_id
       LEFT JOIN contact  c ON c.id = pim.insurer_contact_id
       INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.status = 1 AND ld.organisation_id = $4
       WHERE p.company_id = $1
         AND p.policy_from <= $2
         AND p.policy_to   >= $3
       GROUP BY p.id, ld.value, ld.lookup_key, p.insurer_policy_number, i.id, i.name
       ORDER BY policy_type, p.insurer_policy_number`,
      [companyId, endStr, startStr, organisationId],
    );
    const s7t1: (string | boolean)[][] = s7Data.map((r) => {
      const contactName = r.contact_person?.trim() || "";
      // The enc column isn't backfilled in every environment — fall back to
      // the legacy plaintext communication_details column when unencrypted.
      const contactPhone = r.contact_phone_raw
        ? this.fieldEncryptionService.isEncrypted(r.contact_phone_raw)
          ? this.fieldEncryptionService.decrypt(r.contact_phone_raw)
          : r.contact_phone_raw
        : "";
      const contactCell = contactName
        ? contactPhone
          ? `${contactName} (${contactPhone})`
          : contactName
        : "—";
      return [
        this.policyLabel(r.policy_type, r.insurer_policy_number, r.policy_id),
        r.insurer_name || "—",
        r.branch_name  || "—",
        contactCell,
      ];
    });

    // ── s8: Head Count for Health Policies ────────────────────────────────

    const enrollmentCountExpr = `
              (SELECT COUNT(*)
               FROM policy_enrollment_employee_policy_map pem
               WHERE pem.policy_id = p.id AND pem.deleted_at IS NULL)
            + (SELECT COUNT(*)
               FROM policy_enrollment_dependent pd
               WHERE pd.policy_id = p.id AND pd.deleted_at IS NULL)`;

    const s8t1Data = await mgr.query<{
      policy_id: number;
      policy_type: string | null;
      insurer_policy_number: string | null;
      current_count: string;
      additions: string;
      deletions: string;
      premium_ytd: string;
    }[]>(
      `SELECT p.id AS policy_id,
              COALESCE(NULLIF(ptl.value, ''), ptl.lookup_key) AS policy_type,
              p.insurer_policy_number,
              (${enrollmentCountExpr})::text AS current_count,
              (SELECT ${safeNum("SUM(employee_endorsement_addition_count)")}
               FROM endorsement
               WHERE policy_id = p.id
                 AND insurer_endorsement_date >= $3 AND insurer_endorsement_date <= $2)::text AS additions,
              (SELECT ${safeNum("SUM(employee_endorsement_deletion_count)")}
               FROM endorsement
               WHERE policy_id = p.id
                 AND insurer_endorsement_date >= $3 AND insurer_endorsement_date <= $2)::text AS deletions,
              (SELECT ${safeNum("SUM(gross_premium)")}
               FROM endorsement
               WHERE policy_id = p.id
                 AND insurer_endorsement_date >= p.policy_from
                 AND insurer_endorsement_date <= $2)::text AS premium_ytd
       FROM policy p
       JOIN lookup_data ptl
           ON ptl.id = p.policy_type_lid AND ptl.status = 1 AND ptl.organisation_id = $4
       JOIN policy_type_segregation pts ON pts.policy_type_lid = p.policy_type_lid
       JOIN lookup_data ld ON ld.id = pts.irdai_policy_type_lid
       WHERE p.company_id = $1
         AND p.policy_from <= $2
         AND p.policy_to   >= $3
         AND ld.value IN ('Health', 'Life')
       ORDER BY p.policy_name`,
      [companyId, endStr, startStr, organisationId],
    );
    const s8t1: (string | boolean)[][] = s8t1Data.map((r) => {
      const currentCount = Number(r.current_count);
      const add = Number(r.additions);
      const del = Number(r.deletions);
      const total = currentCount + add - del;

      return [
        this.policyLabel(r.policy_type, r.insurer_policy_number, r.policy_id),
        String(currentCount), String(add), String(del), String(total),
        this.fmtAmt(r.premium_ytd),
      ];
    });

    const s8t2Data = await mgr.query<{
      policy_id: number;
      policy_type: string | null;
      insurer_policy_number: string | null;
      current_count: string;
      additions: string;
      deletions: string;
      premium_ytd: string;
    }[]>(
      `SELECT p.id AS policy_id,
              COALESCE(NULLIF(ptl.value, ''), ptl.lookup_key) AS policy_type,
              p.insurer_policy_number,
              (
                (SELECT COUNT(*) FROM policy_asset_endorsement_map pam
                 WHERE pam.policy_id = p.id
                   AND pam.endorsement_status = 'ASSET_ENDORSEMENT_PROCESSED'
                   AND pam.endorsement_deletion_id IS NULL)
              + (SELECT COUNT(*) FROM policy_sub_asset_endorsement_map psam
                 WHERE psam.policy_id = p.id
                   AND psam.endorsement_status = 'ASSET_ENDORSEMENT_PROCESSED'
                   AND psam.endorsement_deletion_id IS NULL)
              )::text AS current_count,
              (SELECT ${safeNum("SUM(endorsement_addition_count)")}
               FROM policy_asset_endorsement
               WHERE policy_id = p.id
                 AND insurer_endorsement_date >= $3 AND insurer_endorsement_date <= $2)::text AS additions,
              (SELECT ${safeNum("SUM(endorsement_deletion_count)")}
               FROM policy_asset_endorsement
               WHERE policy_id = p.id
                 AND insurer_endorsement_date >= $3 AND insurer_endorsement_date <= $2)::text AS deletions,
              (SELECT ${safeNum("SUM(gross_premium)")}
               FROM policy_asset_endorsement
               WHERE policy_id = p.id
                 AND insurer_endorsement_date >= p.policy_from
                 AND insurer_endorsement_date <= $2)::text AS premium_ytd
       FROM policy p
       JOIN lookup_data ptl
           ON ptl.id = p.policy_type_lid AND ptl.status = 1 AND ptl.organisation_id = $4
       LEFT JOIN policy_type_segregation pts ON pts.policy_type_lid = p.policy_type_lid
       LEFT JOIN lookup_data ld ON ld.id = pts.irdai_policy_type_lid
       WHERE p.company_id = $1
         AND p.policy_from <= $2
         AND p.policy_to   >= $3
         AND (ld.value IS NULL OR ld.value NOT IN ('Health', 'Life'))
       ORDER BY p.policy_name`,
      [companyId, endStr, startStr, organisationId],
    );

    const s8t2: (string | boolean)[][] = s8t2Data.map((r) => {
      const currentCount = Number(r.current_count);
      const add = Number(r.additions);
      const del = Number(r.deletions);
      const total = currentCount + add - del;

      return [
        this.policyLabel(r.policy_type, r.insurer_policy_number, r.policy_id),
        String(currentCount), String(add), String(del), String(total),
        this.fmtAmt(r.premium_ytd),
      ];
    });

    // ── s9: Cash Deposit Account — account-level statement, one row per
    // CD account the company holds (not a transaction ledger). Opening
    // Balance is the running position carried into the report month;
    // Total Credits/Debits are scoped to the report month; Closing Balance
    // is derived. Linked Policies is the distinct set of policies the
    // account has ever backed, resolved via its transactions' policy_id.
    const s9AccountData = await mgr.query<{
      cd_id: number;
      cd_account_number: string | null;
      cd_account_name: string | null;
      status: string | null;
      insurer_name: string | null;
      opening_balance: string;
      total_credits: string;
      total_debits: string;
    }[]>(
      `SELECT cd.id                AS cd_id,
              cd.cd_account_number,
              cd.cd_account_name,
              cd.status,
              i.name               AS insurer_name,
              ${safeNum("opening.opening_balance")}::text AS opening_balance,
              ${safeNum("credits.total_credits")}::text   AS total_credits,
              ${safeNum("debits.total_debits")}::text      AS total_debits
       FROM caution_deposit cd
       LEFT JOIN insurer i ON i.id = cd.insurer_id
       LEFT JOIN LATERAL (
         -- ABS() guards against rows where transaction_amount was stored
         -- signed (seen in some legacy/seed data) instead of the documented
         -- unsigned-magnitude convention — direction must come only from
         -- transaction_type, never from the stored sign.
         SELECT SUM(
                  CASE WHEN cdt.transaction_type = 'CREDIT_TRANSACTION'
                       THEN ABS(cdt.transaction_amount) ELSE -ABS(cdt.transaction_amount) END
                ) AS opening_balance
         FROM caution_deposit_transaction cdt
         WHERE cdt.caution_deposit_id = cd.id
           AND cdt.transaction_date < $2
       ) opening ON true
       LEFT JOIN LATERAL (
         SELECT SUM(ABS(cdt.transaction_amount)) AS total_credits
         FROM caution_deposit_transaction cdt
         WHERE cdt.caution_deposit_id = cd.id
           AND cdt.transaction_type = 'CREDIT_TRANSACTION'
           AND cdt.transaction_date BETWEEN $2 AND $3
       ) credits ON true
       LEFT JOIN LATERAL (
         SELECT SUM(ABS(cdt.transaction_amount)) AS total_debits
         FROM caution_deposit_transaction cdt
         WHERE cdt.caution_deposit_id = cd.id
           AND cdt.transaction_type = 'DEBIT_TRANSACTION'
           AND cdt.transaction_date BETWEEN $2 AND $3
       ) debits ON true
       WHERE cd.company_id = $1
       ORDER BY cd.cd_account_number`,
      [companyId, startStr, endStr],
    );

    const cdAccountIds = s9AccountData.map((r) => r.cd_id);
    const s9LinkedPolicyRows = cdAccountIds.length
      ? await mgr.query<{
          cd_id: number;
          policy_id: number;
          policy_type: string | null;
          insurer_policy_number: string | null;
        }[]>(
          `SELECT DISTINCT cdt.caution_deposit_id AS cd_id, p.id AS policy_id,
                  COALESCE(NULLIF(ld.value, ''), ld.lookup_key) AS policy_type,
                  p.insurer_policy_number
           FROM caution_deposit_transaction cdt
           JOIN policy p ON p.id = cdt.policy_id
           LEFT JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.status = 1 AND ld.organisation_id = $2
           WHERE cdt.caution_deposit_id = ANY($1::int[])
           ORDER BY policy_type, p.insurer_policy_number`,
          [cdAccountIds, organisationId],
        )
      : [];
    const linkedPoliciesByAccount = new Map<number, string[]>();
    s9LinkedPolicyRows.forEach((r) => {
      const label = this.policyLabel(r.policy_type, r.insurer_policy_number, r.policy_id);
      const list = linkedPoliciesByAccount.get(r.cd_id) ?? [];
      list.push(label);
      linkedPoliciesByAccount.set(r.cd_id, list);
    });

    const s9t1: (string | boolean)[][] = s9AccountData.map((r) => {
      const opening = Number(r.opening_balance);
      const credits = Number(r.total_credits);
      const debits = Number(r.total_debits);
      const closing = opening + credits - debits;
      const accountLabel = r.cd_account_name
        ? `${r.cd_account_number ?? "—"} (${r.cd_account_name})`
        : r.cd_account_number ?? "—";
      return [
        accountLabel,
        r.insurer_name || "—",
        this.fmtAmt(opening),
        this.fmtAmt(credits),
        this.fmtAmt(debits),
        this.fmtAmt(closing),
        r.status || "—",
        (linkedPoliciesByAccount.get(r.cd_id) ?? []).join("; ") || "—",
      ];
    });

    // ── s10: Our Service Tracker — same scoring model as Service Score's
    // summary-details (getSummaryDetailsForMIRReport mirrors getSummaryDetails),
    // scoped to policies whose duration overlaps the reported month rather than
    // a financial year.
    const [reportMonth, reportYear] = period.split("-").map(Number);
    const serviceTrackerStart = new Date(Date.UTC(reportYear, reportMonth - 1, 1));
    const serviceTrackerEnd = new Date(Date.UTC(reportYear, reportMonth, 1));

    const serviceScoreMonth = await this.serviceTatService.getSummaryDetailsForMIRReport(
      companyId,
      organisationId ?? 0,
      serviceTrackerStart,
      serviceTrackerEnd,
    );

    const s10t1: (string | boolean)[][] = Object.entries(serviceScoreMonth.details).map(
      ([serviceName, detail]) => {
        const { scoredMarks, totalMarks, weightage_score, maxWeightage, ...buckets } = detail;
        return [
          serviceName,
          String(totalMarks),
          ...Object.values(buckets).map((count) => String(count)),
          String(scoredMarks),
          String(totalMarks),
          weightage_score.toFixed(2),
          String(maxWeightage),
        ];
      },
    );

    return {
      s1: { s1t1 },
      s2: { s2t1 },
      s3: { s3t1 },
      s4: { s4t1, s4t2, s4t3, s4t4 },
      s6: { s6t1 },
      s7: { s7t1 },
      s8: { s8t1, s8t2 },
      s9: { s9t1 },
      s10: { s10t1 },
    };
  }

  async listMirReports(filters: {
    companyId?: number;
    period?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const { companyId, period, status, page = 1, limit = 20 } = filters;
    const qb = this.mirReportRepo
      .createQueryBuilder("mr")
      .leftJoinAndSelect("mr.company", "company")
      .orderBy("mr.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (companyId) qb.andWhere("mr.companyId = :companyId", { companyId });
    if (period) qb.andWhere("mr.reportPeriod = :period", { period });
    if (status) qb.andWhere("mr.status = :status", { status });

    const [data, total] = await qb.getManyAndCount();

    // Only Lead CRM will be displayed as CRM Owner in the MIR report list, so fetch their names for display.
    const leadCrmIds = [...new Set(data.map((r) => r.company?.leadCrm).filter((id): id is number => !!id))];
    const leadCrmUsers = leadCrmIds.length
      ? await this.mirReportRepo.manager.query<{ id: number; first_name: string; last_name: string }[]>(
          `SELECT id, first_name, last_name FROM users WHERE id = ANY($1::int[])`,
          [leadCrmIds],
        )
      : [];
    const leadCrmNameMap = new Map(
      leadCrmUsers.map((u) => [u.id, `${u.first_name} ${u.last_name}`.trim()]),
    );

    const mapped = data.map((r) => ({
      ...r,
      createdByName: r.company?.leadCrm
        ? (leadCrmNameMap.get(r.company.leadCrm) ?? String(r.company.leadCrm))
        : "—",
    }));
    return { data: mapped, total, page, limit };
  }

  async generateMirReport(
    companyId: number,
    period: string,
    userId: number,
    organisationId?: number,
  ): Promise<MirReport> {
    await this.assertValidMirStatus("draft");

    const [company] = await this.mirReportRepo.manager.query<
      { associate_crm_id: number | null; lead_crm: number | null }[]
    >(`SELECT associate_crm_id, lead_crm FROM company WHERE id = $1`, [companyId]);
    if (!company) throw new NotFoundException("Company not found");

    // BR-MIR-003: only the company's Associate CRM or Lead CRM may create its
    // MIR — unless the user holds a leadership role, in which case they're
    // allowed through regardless of CRM assignment.
    if (Number(company.associate_crm_id) !== userId && Number(company.lead_crm) !== userId) {
      const isLeadership = await this.scopeService.hasLeadershipRole(Number(userId));
      if (!isLeadership) {
        throw new ForbiddenException(
          "Only the company's Associate CRM or Lead CRM can create its MIR",
        );
      }
    }

    const existing = await this.mirReportRepo.findOne({
      where: { companyId, reportPeriod: period },
    });
    if (existing) {
      throw new ConflictException({
        message: "A MIR already exists for this company and period",
        existingReportId: existing.id,
        existingStatus: existing.status,
      });
    }

    const report = this.mirReportRepo.create({
      companyId,
      reportPeriod: period,
      status: "draft",
      organisationId: organisationId ?? null,
      createdBy: userId,
      updatedBy: userId,
    });

    try {
      return await this.mirReportRepo.save(report);
    } catch (error) {
      // Race-condition backstop: the DB's UNIQUE(company_id, report_period)
      // constraint catches concurrent creates that both passed the check
      // above — surface the same friendly conflict instead of a raw DB error.
      if ((error as { code?: string })?.code === "23505") {
        const raceExisting = await this.mirReportRepo.findOne({
          where: { companyId, reportPeriod: period },
        });
        throw new ConflictException({
          message: "A MIR already exists for this company and period",
          existingReportId: raceExisting?.id,
          existingStatus: raceExisting?.status,
        });
      }
      throw error;
    }
  }

  async getMirReportWithSections(reportId: number) {
    const report = await this.mirReportRepo.findOne({
      where: { id: reportId },
      relations: ["company"],
    });
    if (!report) throw new NotFoundException("MIR report not found");

    const savedSections = await this.sectionRepo.find({
      where: { reportId },
    });
    const savedMap = new Map(savedSections.map((s) => [s.sectionId, s]));


    const isFrozen = ["approved", "published", "acknowledged"].includes(report.status);
    const logCtx = { reportId, status: report.status, isFrozen };
    let autoRows: Record<string, Record<string, (string | boolean)[][]>>;
    if (isFrozen) {
      autoRows = {};
      const missingApprovedData: string[] = [];
      for (const master of MIR_SECTION_MASTER) {
        const approvedData = savedMap.get(master.id)?.approvedData;
        if (approvedData) {
          autoRows[master.sectionKey] = approvedData;
        } else if (["s1", "s2", "s3", "s4", "s6", "s7", "s8", "s9", "s10"].includes(master.sectionKey)) {
          missingApprovedData.push(master.sectionKey);
        }
      }
      this.logger.log({
        level: missingApprovedData.length ? "warn" : "info",
        message: buildLogMessage({
          status: missingApprovedData.length ? "failure" : "success",
          location: "MirReportService",
          method: "getMirReportWithSections",
          payload: logCtx,
          messageData: missingApprovedData.length
            ? `serving FROZEN approved_data — missing snapshot for section(s): ${JSON.stringify(missingApprovedData)}`
            : `serving FROZEN approved_data for section(s): ${JSON.stringify(Object.keys(autoRows))}`,
        }),
      });
    } else {
      // s1/s2/s3/s4/s6/s7/s8/s9/s10 come from live DB; remaining sections fall back to hardcoded rows
      autoRows = await this.getDynamicSectionRows(report.companyId, report.reportPeriod, report.organisationId ?? null);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          status: "success",
          location: "MirReportService",
          method: "getMirReportWithSections",
          payload: logCtx,
          messageData: `serving LIVE dynamicRows for section(s): ${JSON.stringify(Object.keys(autoRows))}`,
        }),
      });
    }

    // §10 footer: sum of the "Weighted Score" cell across every s10t1 row —
    // that's always the second-from-last column (…, Scored, Total Marks,
    // Weighted Score, WTG), regardless of how many TAT bucket columns
    // precede it. Works identically whether s10t1 came from a live query or
    // a frozen snapshot.
    const totalServiceScore = (autoRows.s10?.s10t1 ?? []).reduce(
      (sum, row) => sum + (Number(row[row.length - 2]) || 0),
      0,
    );

    // §9 footer: column totals across every CD account row — Opening
    // Balance, Total Credits, Total Debits, Closing Balance are columns
    // 2..5 (0-indexed) of s9t1, formatted with fmtAmt ("Rs 1,000.00").
    const parseAmt = (cell: string | boolean): number => {
      const num = Number(String(cell).replace(/^Rs\s*/, "").replace(/,/g, ""));
      return isNaN(num) ? 0 : num;
    };
    const s9Rows = autoRows.s9?.s9t1 ?? [];
    const cdTotals = s9Rows.reduce(
      (acc, row) => ({
        opening: acc.opening + parseAmt(row[2]),
        credits: acc.credits + parseAmt(row[3]),
        debits: acc.debits + parseAmt(row[4]),
        closing: acc.closing + parseAmt(row[5]),
      }),
      { opening: 0, credits: 0, debits: 0, closing: 0 },
    );

    const sectionFooter = (sectionKey: string): string | undefined => {
      if (sectionKey === "s10") return `Total Service Score: ${totalServiceScore.toFixed(2)}`;
      if (sectionKey === "s9" && s9Rows.length) {
        return (
          `Total Opening Balance: ${this.fmtAmt(cdTotals.opening)} · ` +
          `Total Credits: ${this.fmtAmt(cdTotals.credits)} · ` +
          `Total Debits: ${this.fmtAmt(cdTotals.debits)} · ` +
          `Total Closing Balance: ${this.fmtAmt(cdTotals.closing)}`
        );
      }
      return undefined;
    };

    const sections = MIR_SECTION_MASTER.map((master) => ({
      ...master,
      tableRows: autoRows[master.sectionKey] ?? MIR_SECTION_ROWS[master.sectionKey] ?? {},
      footer: sectionFooter(master.sectionKey),
      savedData: savedMap.get(master.id)
        ? {
            sectionSummary: savedMap.get(master.id)!.sectionSummary ?? "",
            cellData: savedMap.get(master.id)!.cellData ?? {},
          }
        : null,
    }));

    return { report, sections };
  }

  async submitMirReport(reportId: number, userId: number, dto: SubmitMirDto) {
    await this.assertValidMirStatus("submitted");

    const report = await this.mirReportRepo.findOne({
      where: { id: reportId },
      relations: ["company"],
    });
    if (!report) throw new NotFoundException("MIR report not found");

    if (report.company?.associateCrmId !== userId && report.company?.leadCrm !== userId) {
      throw new ForbiddenException(
        "Only the company's Associate CRM or Lead CRM can submit this MIR",
      );
    }

    if (report.status !== "draft") {
      throw new ConflictException(
        `Cannot submit a report with status '${report.status}'`,
      );
    }

    // Upsert section data
    for (const sec of dto.sections) {
      const master = MIR_SECTION_MASTER.find((m) => m.sectionKey === sec.sectionKey);
      if (!master) continue;

      const existing = await this.sectionRepo.findOne({
        where: { reportId, sectionId: master.id },
      });
      if (existing) {
        await this.sectionRepo.update(existing.id, {
          sectionSummary: sec.sectionSummary,
          cellData: sec.cellData ?? {},
        });
      } else {
        await this.sectionRepo.save(
          this.sectionRepo.create({
            reportId,
            sectionId: master.id,
            sectionSummary: sec.sectionSummary,
            cellData: sec.cellData ?? {},
          }),
        );
      }
    }

    // Update report status + overall comments. Clear any prior rejection
    // comment — it's stale once the Associate CRM has resubmitted.
    await this.mirReportRepo.update(reportId, {
      status: "submitted",
      overallComments: dto.overallComments,
      rejectionComment: null,
      updatedBy: userId,
    });

    // BR-MIR-019: Submitted → notify Lead CRM
    await this.sendMirNotification(
      NOTIFICATION_EVENT_TYPES.MIR_REPORT_SUBMITTED,
      [report.company?.leadCrm],
      this.mirNotificationParams(report),
    );

    return { reportId, status: "submitted" };
  }

  private async assertValidMirStatus(value: string): Promise<void> {
    const [row] = await this.mirReportRepo.manager.query<{ value: string }[]>(
      `SELECT value FROM lookup_data WHERE lookup_name = 'MIR_STATUS' AND value = $1 AND status = 1 AND organisation_id = 0`,
      [value],
    );
    if (!row) throw new BadRequestException(`'${value}' is not a valid/enabled MIR status`);
  }

  // Common template values shared across all MIR notification events.
  private mirNotificationParams(report: MirReport, comment?: string): Record<string, string> {
    return {
      reportUrl: `${ENV.CLIENT_SERVER_URL}mir-reports/view/${report.id}`,
      companyName: report.company?.companyName ?? "",
      period: report.reportPeriod,
      comment: comment ?? "",
    };
  }

  async transitionMirReport(reportId: number, action: string, userId: number, comment?: string) {
    const report = await this.mirReportRepo.findOne({
      where: { id: reportId },
      relations: ["company"],
    });
    if (!report) throw new NotFoundException("MIR report not found");

    await this.assertValidMirStatus(action);

    const TRANSITIONS: Record<string, { from: string; to: string }> = {
      approve:     { from: "submitted",  to: "approved"     },
      reject:      { from: "submitted",  to: "draft"        },
      publish:     { from: "approved",   to: "published"    },
      acknowledge: { from: "published",  to: "acknowledged" },
    };

    const transition = TRANSITIONS[action];
    if (!transition) throw new BadRequestException(`Unknown action: ${action}`);

    // Approve/Reject/Publish are single-level Lead CRM actions (BR-MIR-007) —
    // Acknowledge is performed by HR on the external IBP portal, not gated here.
    if (["approve", "reject", "publish"].includes(action) && report.company?.leadCrm !== userId) {
      throw new ForbiddenException("Only the company's Lead CRM can perform this action");
    }

    // BR-MIR-005: rejection without a comment is blocked.
    if (action === "reject" && !comment?.trim()) {
      throw new BadRequestException("A comment is required to reject a MIR");
    }

    if (report.status !== transition.from) {
      throw new ConflictException(
        `Cannot '${action}' a report with status '${report.status}'`,
      );
    }

    // Freeze the auto-populated sections at the moment of approval — from
    // here on (approved/published/acknowledged)
    if (action === "approve") {
      const dynamicRows = await this.getDynamicSectionRows(
        report.companyId,
        report.reportPeriod,
        report.organisationId ?? null,
      );
      for (const master of MIR_SECTION_MASTER) {
        const rows = dynamicRows[master.sectionKey];
        if (!rows) continue;
        const existing = await this.sectionRepo.findOne({
          where: { reportId, sectionId: master.id },
        });
        if (existing) {
          await this.sectionRepo.update(existing.id, { approvedData: rows });
        } else {
          await this.sectionRepo.save(
            this.sectionRepo.create({ reportId, sectionId: master.id, approvedData: rows }),
          );
        }
      }
    }

    await this.mirReportRepo.update(reportId, {
      status: transition.to,
      updatedBy: userId,
      ...(action === "reject" ? { rejectionComment: comment!.trim() } : {}),
    });

    // BR-MIR-019 notification matrix. Recipients are resolved from the
    // company's assigned CRM roles (associateCrmId / leadCrm), not
    // report.createdBy — either CRM can be the one who created/submitted
    // the report now, so createdBy no longer identifies "the Associate CRM".
    // Lead CRM publishes (BR-MIR-007); HR's only action on this side is
    // Acknowledge — Published notifies the HR Manager(s) for the company
    // (hr_user_management.role_key = 'HR_ADMIN'), resolved via
    // getHrManagerUserIds below.
    const notifyValueMap = this.mirNotificationParams(report, comment);
    if (action === "approve") {
      await this.sendMirNotification(NOTIFICATION_EVENT_TYPES.MIR_REPORT_APPROVED, [report.company?.associateCrmId], notifyValueMap);
    } else if (action === "reject") {
      await this.sendMirNotification(NOTIFICATION_EVENT_TYPES.MIR_REPORT_REJECTED, [report.company?.associateCrmId], notifyValueMap);
    } else if (action === "publish") {
      const hrManagerIds = await this.getHrManagerUserIds(report.companyId);
      await this.sendMirNotification(NOTIFICATION_EVENT_TYPES.MIR_REPORT_PUBLISHED, hrManagerIds, notifyValueMap);
    } else if (action === "acknowledge") {
      await this.sendMirNotification(
        NOTIFICATION_EVENT_TYPES.MIR_REPORT_ACKNOWLEDGED,
        [report.company?.associateCrmId, report.company?.leadCrm],
        notifyValueMap,
      );
    }

    return { reportId, status: transition.to };
  }

  // HR Manager(s) for a company, per the IBP portal's own user directory —
  // distinct from the shared `users` table, but user_id there resolves
  // against it (used by sendMirNotification to fetch emails).
  private async getHrManagerUserIds(companyId: number): Promise<number[]> {
    const rows = await this.mirReportRepo.manager.query<{ user_id: number }[]>(
      `SELECT user_id
       FROM hr_user_management
       WHERE company_id = $1
         AND role_key = 'HR_ADMIN'
         AND deleted_at IS NULL
         AND user_status_key = 'USER_STATUS_ACTIVE'`,
      [companyId],
    );
    return rows.map((r) => r.user_id);
  }
}
