import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, IsNull, Repository } from "typeorm";
import {
  AdminReport,
  AdminReportParameter,
} from "../../../../service-lib/src/lib/entities";
import { ExternalHrLocationMap } from "../../../../service-lib/src/lib/entities/external-hr-location-map.entity";
import { ExternalHrPolicyMap } from "../../../../service-lib/src/lib/entities/external-hr-policy-map.entity";
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import { PolicyEnrollmentEmployee } from "../../../../service-lib/src/lib/entities/policy-enrollment-employee.entity";
import { PolicyClaim } from "../../../../service-lib/src/lib/entities/policy-employee-claim.entity";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { USER_STATUS_ACTIVE, USER_STATUS_INACTIVE } from "../../../../../../libs/service-lib/src/lib/constants";

@Injectable()
export class HrRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(AdminReport)
    private readonly adminReportRepository: Repository<AdminReport>,
    @InjectRepository(AdminReportParameter)
    private readonly adminReportParameterRepository: Repository<AdminReportParameter>,
  ) {}

  findReport(reportName: string) {
    return this.adminReportRepository.findOne({
      where: { name: reportName, deletedAt: IsNull() },
    });
  }

  findParameters(reportId?: number) {
    return this.adminReportParameterRepository.find({
      where: { adminReportId: reportId, deletedAt: IsNull() },
    });
  }

  query(sql: string) {
    return this.dataSource.query(sql);
  }

  /**
   * Looks up the mstr_ext_application_ref.label (appKey) for a given policy
   * and API type. Queries tpa_external_feature_config (our unified mapping table).
   * Returns null if no config found → caller falls back to hardcoded appKey.
   */
  async getTpaAppKeyForPolicy(policyNumber: string, apiType: string): Promise<string | null> {
    console.log(`[HrRepo:getTpaAppKeyForPolicy] policyNumber=${policyNumber} apiType=${apiType}`);
    const rows = await this.dataSource.query<{ label: string }[]>(`
      SELECT ear.label
      FROM   public.policy p
      JOIN   public.policy_tpa_map              ptm ON ptm.policy_id = p.id
      JOIN   public.tpa_external_feature_config cfg
               ON cfg.tpa_id = ptm.tpa_id AND cfg.api_type = $2 AND cfg.is_active = true
      JOIN   public.mstr_ext_application_ref    ear
               ON ear.id = cfg.app_ref_id AND ear.is_active = true
      WHERE  p.insurer_policy_number = $1
        AND  p.deleted_at IS NULL
      LIMIT  1
    `, [policyNumber, apiType]);
    const label = rows?.[0]?.label ?? null;
    console.log(`[HrRepo:getTpaAppKeyForPolicy] resolved appKey=${label ?? "(none — will fallback)"}`);
    return label;
  }

  /**
   * Same as above but resolves by TPA ID directly (used when policy is already loaded).
   */
  async getTpaAppKeyByTpaId(tpaId: number, apiType: string): Promise<string | null> {
    console.log(`[HrRepo:getTpaAppKeyByTpaId] tpaId=${tpaId} apiType=${apiType}`);
    const rows = await this.dataSource.query<{ label: string }[]>(`
      SELECT ear.label
      FROM   public.tpa_external_feature_config cfg
      JOIN   public.mstr_ext_application_ref    ear
               ON ear.id = cfg.app_ref_id AND ear.is_active = true
      WHERE  cfg.tpa_id = $1 AND cfg.api_type = $2 AND cfg.is_active = true
      LIMIT  1
    `, [tpaId, apiType]);
    const label = rows?.[0]?.label ?? null;
    console.log(`[HrRepo:getTpaAppKeyByTpaId] resolved appKey=${label ?? "(none — will fallback)"}`);
    return label;
  }

  async getEmployeeProfile(employeeId: number | null, search: string | null): Promise<any[]> {
    const sql = `
WITH resolved_id AS (
  SELECT CASE
    WHEN $2::text IS NOT NULL THEN (
      SELECT id
      FROM policy_enrollment_employee
      WHERE deleted_at IS NULL
        AND (
          COALESCE(NULLIF(full_name, ''), employee_name) ILIKE '%' || $2::text || '%'
          OR LOWER(company_employee_id) = LOWER($2::text)
        )
      ORDER BY id
      LIMIT 1
    )
    ELSE $1::integer
  END AS emp_id
),
dep_data AS (
  SELECT
    COALESCE(
      json_agg(
        json_build_object(
          'id',           ped.id,
          'name',         ped.name,
          'relationship', COALESCE(NULLIF(ped.relation, ''), ped.relationship_type),
          'dob',          ped.date_of_birth,
          'gender',       ped.gender
        ) ORDER BY ped.id
      ) FILTER (WHERE ped.id IS NOT NULL),
      '[]'::json
    ) AS dependents_list,
    COUNT(ped.id)::int AS dependents_count
  FROM policy_enrollment_dependent ped
  WHERE ped.employee_id = (SELECT emp_id FROM resolved_id)
    AND ped.deleted_at IS NULL
),
insurer_by_policy AS (
  SELECT DISTINCT ON (pim.policy_id) pim.policy_id, i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
),
policy_data AS (
  -- Every policy the employee is/was mapped to via
  -- policy_enrollment_employee_policy_map (pepm) — not just the ones with a
  -- live policy_employee_enrollment row, so an expired policy still shows up
  -- even if its enrollment record was archived/replaced on renewal. Each
  -- policy carries its own Active/Expired status plus a per-component
  -- ("choice") breakdown of exactly who's enrolled under that component,
  -- mirroring the choices/choice_people structure used by the per-choice
  -- enrollment report.
  SELECT
    pepm.employee_id,
    json_agg(
      json_build_object(
        'policyId',            pepm.policy_id,
        'policyName',          pol.policy_name,
        'policyNumber',        pol.insurer_policy_number,
        'insurerPolicyNumber', pol.insurer_policy_number,
        'effectiveDate',       pol.policy_from,
        'expiryDate',          pol.policy_to,
        'insurerName',         pi_sub.insurer_name,
        'policyStatus',        CASE WHEN pol.policy_to >= CURRENT_DATE THEN 'Active' ELSE 'Expired' END,
        'sumInsured',          COALESCE(enr.sum_insured, 0),
        'availableBalance',    COALESCE(enr.balance, 0),
        'enrollmentStatus',    enr.employee_enrollment_status_key,
        'enrollmentStartDate', TO_CHAR(pepm.enrollment_start_date, 'YYYY-MM-DD'),
        'enrollmentEndDate',   TO_CHAR(pepm.enrollment_end_date, 'YYYY-MM-DD'),
        'components',          COALESCE(comp.components_list, '[]'::json)
      ) ORDER BY (pol.policy_to >= CURRENT_DATE) DESC, pol.policy_to DESC
    ) AS policies_list
  FROM policy_enrollment_employee_policy_map pepm
  JOIN policy pol ON pol.id = pepm.policy_id
  JOIN policy_enrollment_employee bee ON bee.id = pepm.employee_id
  LEFT JOIN insurer_by_policy pi_sub ON pi_sub.policy_id = pepm.policy_id
  LEFT JOIN policy_employee_enrollment enr
    ON enr.employee_id = pepm.employee_id
   AND enr.policy_id = pepm.policy_id
   AND enr.deleted_at IS NULL
  LEFT JOIN LATERAL (
    SELECT COALESCE(real_comp.components_list, fallback_comp.components_list) AS components_list
    FROM (SELECT 1) AS _one
    LEFT JOIN LATERAL (
      SELECT json_agg(
        json_build_object(
          'componentLabel', pec.policy_component_action_label,
          'sumInsured',     COALESCE(pec.sum_insured, 0),
          'companyPay',     COALESCE(pec.company_pay, 0),
          'employeePay',    COALESCE(pec.employee_pay, 0),
          'enrolledPeople', COALESCE(people.people_list, '[]'::json)
        ) ORDER BY pec.id
      ) AS components_list
      FROM policy_employee_enrollment_choice pec
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'name', person_name, 'relationship', relationship, 'dob', dob, 'gender', gender
          ) ORDER BY sort_order, person_name
        ) AS people_list
        FROM (
          -- self row — the employee is covered by their own choice, except for
          -- "parental" components (e.g. Parental Base Policy), which only ever
          -- cover the employee's parents, never the employee themselves —
          -- matches the eligibleRelations-driven Self/parental split used by
          -- DashboardBenifitsSection on the employee-facing dashboard.
          SELECT 'Self' AS relationship, bee.employee_name AS person_name, bee.date_of_birth AS dob, bee.gender AS gender, 0 AS sort_order
          WHERE pec.policy_component_action_type IS DISTINCT FROM 'parental'

          UNION ALL

          -- dependents explicitly linked to this specific component
          SELECT ped.relation, ped.name, ped.date_of_birth, ped.gender, 1
          FROM policy_employee_enrollment_choice_dependent pecd
          INNER JOIN policy_enrollment_dependent ped ON ped.id = pecd.dependent_id AND ped.deleted_at IS NULL
          WHERE pecd.employee_enrollment_choice_id = pec.id AND pecd.deleted_at IS NULL

          UNION ALL

          -- fallback: a component with no explicit per-component dependent
          -- links still shows every dependent recorded against this policy
          SELECT ped2.relation, ped2.name, ped2.date_of_birth, ped2.gender, 1
          FROM policy_enrollment_dependent ped2
          WHERE ped2.employee_id = pepm.employee_id
            AND (ped2.policy_id = pepm.policy_id OR ped2.policy_id IS NULL)
            AND ped2.deleted_at IS NULL
            AND NOT EXISTS (
              SELECT 1 FROM policy_employee_enrollment_choice_dependent pecd2
              WHERE pecd2.employee_enrollment_choice_id = pec.id AND pecd2.deleted_at IS NULL
            )
        ) person
      ) people ON true
      WHERE pec.employee_enrollment_id = enr.id
    ) real_comp ON true
    LEFT JOIN LATERAL (
      -- Fallback for enrollments with NO selectable components at all (e.g.
      -- GTL — a flat benefit with nothing to choose): still show the employee
      -- as Self under a synthetic "Base Policy" entry instead of an empty
      -- Components Enrolled list. Only fires when the employee is genuinely
      -- enrolled (enr.id exists) AND no real choice rows were found.
      SELECT json_agg(
        json_build_object(
          'componentLabel', 'Base Policy',
          'sumInsured',     COALESCE(enr.sum_insured, 0),
          'companyPay',     0,
          'employeePay',    0,
          'enrolledPeople', COALESCE(fp.people_list, '[]'::json)
        )
      ) AS components_list
      FROM (SELECT 1) AS _fallback_row
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'name', person_name, 'relationship', relationship, 'dob', dob, 'gender', gender
          ) ORDER BY sort_order, person_name
        ) AS people_list
        FROM (
          SELECT 'Self' AS relationship, bee.employee_name AS person_name, bee.date_of_birth AS dob, bee.gender AS gender, 0 AS sort_order

          UNION ALL

          SELECT ped3.relation, ped3.name, ped3.date_of_birth, ped3.gender, 1
          FROM policy_enrollment_dependent ped3
          WHERE ped3.employee_id = pepm.employee_id
            AND (ped3.policy_id = pepm.policy_id OR ped3.policy_id IS NULL)
            AND ped3.deleted_at IS NULL
        ) fp_person
      ) fp ON true
      WHERE enr.id IS NOT NULL
        AND real_comp.components_list IS NULL
    ) fallback_comp ON true
  ) comp ON true
  WHERE pepm.deleted_at IS NULL
  GROUP BY pepm.employee_id
)
SELECT
  pee.id                                                          AS "employeeId",
  pee.company_employee_id                                         AS "companyEmployeeId",
  COALESCE(NULLIF(pee.full_name, ''), pee.employee_name)          AS "employeeName",
  pee.gender                                                      AS "gender",
  pee.designation                                                 AS "designation",
  pee.additional_params->>'department'                            AS "department",
  pee.additional_params->>'location'                              AS "location",
  COALESCE(pee.additional_params->>'Effective Date',
           pee.additional_params->>'dateOfJoining')              AS "dateOfJoining",
  pee.marital_status                                              AS "maritalStatus",
  pee.email                                                       AS "email",
  TO_CHAR(pee.date_of_birth, 'YYYY-MM-DD')                        AS "dateOfBirth",
  pee.phone_number                                                AS "phone",
  pee.alternate_email                                             AS "alternateEmail",
  pee.alternate_phone_number                                      AS "alternatePhone",
  u.user_status_key                                               AS "userStatus",
  le.latest_enrollment_status                                     AS "enrollmentStatus",
  COALESCE(le.latest_sum_insured, 0)                              AS "sumInsured",
  COALESCE(le.latest_balance, 0)                                  AS "availableBalance",
  le.latest_updated_at                                            AS "lastActivityDate",
  le.latest_policy_id                                             AS "policyId",
  CONCAT('uploads/e-cards/company/', pee.company_id,
         '/', pee.company_employee_id, '.pdf')                    AS "ecardKey",
  COALESCE(dep.dependents_list, '[]'::json)                       AS "dependents",
  COALESCE(dep.dependents_count, 0)                               AS "dependentsCount",
  COALESCE(pd.policies_list, '[]'::json)                          AS "policies",
  COALESCE((pee.additional_params->>'isVip')::boolean, false)     AS "isVip",
  pee.user_status_key                                             AS "employeeStatus",
  (pee.user_status_key = 'USER_STATUS_INACTIVE')                  AS "isBlocked"
FROM policy_enrollment_employee pee
CROSS JOIN dep_data dep
LEFT JOIN users u ON u.id = pee.user_id
LEFT JOIN (
  SELECT
    enr.employee_id,
    (ARRAY_AGG(enr.policy_id               ORDER BY enr.updated_at DESC, enr.id DESC))[1] AS latest_policy_id,
    (ARRAY_AGG(enr.employee_enrollment_status_key ORDER BY enr.updated_at DESC, enr.id DESC))[1] AS latest_enrollment_status,
    (ARRAY_AGG(COALESCE(enr.sum_insured, 0) ORDER BY enr.updated_at DESC, enr.id DESC))[1] AS latest_sum_insured,
    (ARRAY_AGG(COALESCE(enr.balance, 0)    ORDER BY enr.updated_at DESC, enr.id DESC))[1] AS latest_balance,
    (ARRAY_AGG(enr.updated_at              ORDER BY enr.updated_at DESC, enr.id DESC))[1] AS latest_updated_at
  FROM policy_employee_enrollment enr
  WHERE enr.deleted_at IS NULL
  GROUP BY enr.employee_id
) le ON le.employee_id = pee.id
LEFT JOIN policy_data pd ON pd.employee_id = pee.id
WHERE pee.id = (SELECT emp_id FROM resolved_id)
  AND pee.deleted_at IS NULL
    `;
    return this.dataSource.query(sql, [employeeId, search]);
  }

  async globalSearch(companyId: number, q: string, hrManagementId: number | null = null) {
    const term = `%${q.toLowerCase()}%`;

    const employeeRepo = this.dataSource.getRepository(PolicyEnrollmentEmployee);
    const claimRepo    = this.dataSource.getRepository(PolicyClaim);
    const policyRepo   = this.dataSource.getRepository(Policy);

    const companySubQuery = `(SELECT :companyId::int UNION SELECT gcm.company_id FROM group_company_map gcm WHERE gcm.group_company_id = :companyId)`;

    // ── Employees ──────────────────────────────────────────────────────────────
    const empQb = employeeRepo
      .createQueryBuilder("pee")
      .select("pee.id", "dbId")
      .addSelect("COALESCE(NULLIF(pee.fullName,''), pee.employeeName)", "name")
      .addSelect("pee.companyEmployeeId", "employeeCode")
      .addSelect("pee.designation", "dept")
      .addSelect("COALESCE((pee.additional_params->>'isVip')::boolean, false)", "isVip")
      .where(`pee.companyId IN ${companySubQuery}`, { companyId })
      .andWhere("pee.deletedAt IS NULL")
      .andWhere(
        `(LOWER(COALESCE(NULLIF(pee.fullName,''), pee.employeeName)) LIKE :term OR LOWER(pee.companyEmployeeId) LIKE :term)`,
        { term },
      );

    if (hrManagementId) {
      const accessiblePolicyIdsForEmp = this.dataSource
        .getRepository(ExternalHrPolicyMap)
        .createQueryBuilder("ehpm")
        .select("ehpm.policyId")
        .where("ehpm.hrManagementId = :hrManagementId", { hrManagementId });

      empQb.andWhere(
        `EXISTS (
           SELECT 1 FROM policy_enrollment_employee_policy_map peepm
           WHERE peepm.employee_id = pee.id
             AND peepm.deleted_at IS NULL
             AND peepm.policy_id IN (${accessiblePolicyIdsForEmp.getQuery()})
         )`,
        accessiblePolicyIdsForEmp.getParameters(),
      );
    }

    // ── Claims ─────────────────────────────────────────────────────────────────
    const claimQb = claimRepo
      .createQueryBuilder("pc")
      .select("pc.id", "id")
      .addSelect("pc.claimNumber", "claimNumber")
      .addSelect("COALESCE(pc.employeeName, '')", "employeeName")
      .addSelect("COALESCE(pc.claimStatus, '')", "status")
      .addSelect("CAST(COALESCE(pc.claimAmount, 0) AS TEXT)", "amount")
      .where(`pc.companyId IN ${companySubQuery}`, { companyId })
      .andWhere("pc.deletedAt IS NULL")
      .andWhere(
        "(LOWER(pc.claimNumber) LIKE :term OR LOWER(pc.employeeName) LIKE :term)",
        { term },
      );

    if (hrManagementId) {
      const accessiblePolicyIdsForClaim = this.dataSource
        .getRepository(ExternalHrPolicyMap)
        .createQueryBuilder("ehpm")
        .select("ehpm.policyId")
        .where("ehpm.hrManagementId = :hrManagementId", { hrManagementId });

      claimQb.andWhere(
        `pc.policyId IN (${accessiblePolicyIdsForClaim.getQuery()})`,
        accessiblePolicyIdsForClaim.getParameters(),
      );
    }

    // ── Policies ───────────────────────────────────────────────────────────────
    const policyQb = policyRepo
      .createQueryBuilder("p")
      .select("p.id", "id")
      .addSelect("p.policyName", "name")
      .addSelect("TO_CHAR(p.policyFrom, 'DD Mon YYYY')", "policyFrom")
      .addSelect("TO_CHAR(p.policyTo, 'DD Mon YYYY')", "policyTo")
      .where(`p.companyId IN ${companySubQuery}`, { companyId })
      .andWhere("LOWER(p.policyName) LIKE :term", { term });

    if (hrManagementId) {
      const accessiblePolicyIdsForPolicy = this.dataSource
        .getRepository(ExternalHrPolicyMap)
        .createQueryBuilder("ehpm")
        .select("ehpm.policyId")
        .where("ehpm.hrManagementId = :hrManagementId", { hrManagementId });

      policyQb.andWhere(
        `p.id IN (${accessiblePolicyIdsForPolicy.getQuery()})`,
        accessiblePolicyIdsForPolicy.getParameters(),
      );
    }

    const [employees, claims, policies] = await Promise.all([
      empQb.limit(10).getRawMany(),
      claimQb.limit(10).getRawMany(),
      policyQb.limit(10).getRawMany(),
    ]);

    return { employees, claims, policies };
  }

  // ─── Company hierarchy search ───────────────────────────────────────────────

  async getCompanyHierarchy(
    search: string,
    page: number,
    limit: number,
  ): Promise<{ data: any[]; count: number }> {
    const offset = (page - 1) * limit;
    const searchParam = search?.trim() || null;

    const [rows, countRows] = await Promise.all([
      this.dataSource.query(
        `
WITH matched_ids AS (
  SELECT id FROM company
  WHERE deleted_at IS NULL
    AND ($1::text IS NULL OR company_name ILIKE '%' || $1 || '%')
),
root_ids AS (
  SELECT DISTINCT COALESCE(gcm.group_company_id, m.id) AS id
  FROM matched_ids m
  LEFT JOIN group_company_map gcm ON gcm.company_id = m.id
)
SELECT
  c.id,
  c.company_name AS "companyName",
  COALESCE(
    JSON_AGG(
      JSON_BUILD_OBJECT('id', ch.id, 'companyName', ch.company_name)
      ORDER BY ch.company_name
    ) FILTER (WHERE ch.id IS NOT NULL),
    '[]'::json
  ) AS "childCompanies"
FROM company c
INNER JOIN root_ids r ON r.id = c.id
LEFT JOIN group_company_map gcm ON gcm.group_company_id = c.id
LEFT JOIN company ch ON ch.id = gcm.company_id AND ch.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.company_name
ORDER BY c.company_name
LIMIT $2 OFFSET $3
        `,
        [searchParam, limit, offset],
      ),
      this.dataSource.query(
        `
WITH matched_ids AS (
  SELECT id FROM company
  WHERE deleted_at IS NULL
    AND ($1::text IS NULL OR company_name ILIKE '%' || $1 || '%')
)
SELECT COUNT(DISTINCT COALESCE(gcm.group_company_id, m.id))::int AS total
FROM matched_ids m
LEFT JOIN group_company_map gcm ON gcm.company_id = m.id
        `,
        [searchParam],
      ),
    ]);

    return { data: rows, count: parseInt(countRows[0]?.total ?? "0", 10) };
  }

  // ─── External HR context ────────────────────────────────────────────────────

  async getExternalHrContext(hrManagementId: number): Promise<{ isExternalHr: boolean; policyIds: number[]; resolvedHrId: number }> {
    // First try direct lookup by hr_user_management.id
    const rows = await this.dataSource.query(
      `SELECT epm.policy_id
       FROM hr_user_management hum
       JOIN external_hr_policy_map epm ON epm.hr_management_id = hum.id
       WHERE hum.id = $1 AND hum.deleted_at IS NULL`,
      [hrManagementId],
    );

    if (rows.length) {
      return { isExternalHr: true, policyIds: rows.map((r: { policy_id: number }) => r.policy_id), resolvedHrId: hrManagementId };
    }

    // Fallback: userId may be a policy_enrollment_employee.id — look up HR user by matching email
    const crossRows = await this.dataSource.query(
      `SELECT hum.id AS hum_id, epm.policy_id
       FROM hr_user_management hum
       JOIN external_hr_policy_map epm ON epm.hr_management_id = hum.id
       WHERE hum.deleted_at IS NULL
         AND hum.email_id = (
           SELECT email FROM policy_enrollment_employee
           WHERE id = $1 AND deleted_at IS NULL LIMIT 1
         )`,
      [hrManagementId],
    );

    if (crossRows.length) {
      const resolvedHrId = crossRows[0].hum_id;
      return { isExternalHr: true, policyIds: crossRows.map((r: { policy_id: number }) => r.policy_id), resolvedHrId };
    }

    return { isExternalHr: false, policyIds: [], resolvedHrId: hrManagementId };
  }

  // ─── External HR methods ────────────────────────────────────────────────────

  async findHrUserByEmail(email: string): Promise<any> {
    const result = await this.dataSource.query(
      `SELECT id, role_key, company_name FROM hr_user_management WHERE email_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [email.toLowerCase().trim()],
    );
    return result[0] || null;
  }

  async generateUniqueLoginName(base: string): Promise<string> {
    const existing = await this.dataSource.query(
      `SELECT login_name FROM hr_user_management WHERE login_name LIKE $1 AND deleted_at IS NULL`,
      [`${base}%`],
    );
    const names = new Set<string>(existing.map((r: { login_name: string }) => r.login_name));
    if (!names.has(base)) return base;
    for (let i = 2; i <= 999; i++) {
      if (!names.has(`${base}${i}`)) return `${base}${i}`;
    }
    return `${base}_${Date.now()}`;
  }

  async createHrUserManagement(data: {
    user_name: string;
    email_id: string;
    login_name: string;
    role_key: string;
    company_id: number;
    company_name?: string;
    phone_number?: string;
    date_of_birth?: string | null;
  }): Promise<any> {
    const result = await this.dataSource.query(
      `INSERT INTO hr_user_management
         (user_name, email_id, login_name, role_key, company_id, company_name, phone_number, date_of_birth,
          is_password_set, is_password_hashed, auth_version, user_status_key, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, FALSE, 1, 'USER_STATUS_ACTIVE', NOW(), NOW())
       RETURNING id`,
      [
        data.user_name,
        data.email_id,
        data.login_name,
        data.role_key,
        data.company_id,
        data.company_name || null,
        data.phone_number || null,
        data.date_of_birth || null,
      ],
    );
    return result[0];
  }

  async findHrManagementById(id: number): Promise<any> {
    const result = await this.dataSource.query(
      `SELECT id, role_key, company_id, company_name, email_id, user_name, phone_number, date_of_birth, user_status_key FROM hr_user_management WHERE id = $1 LIMIT 1`,
      [id],
    );
    return result[0] || null;
  }

  async findHrManagementByUserId(userId: number): Promise<any> {
    const result = await this.dataSource.query(
      `SELECT id, user_id, role_key, company_id, company_name, phone_number, date_of_birth FROM hr_user_management WHERE user_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [userId],
    );
    return result[0] || null;
  }

  async updateHrUserManagement(
    id: number,
    data: { user_name?: string; role_key?: string; phone_number?: string; date_of_birth?: string | null; user_status_key?: string; company_id?: number | null; company_name?: string | null; deleted_at?: Date | null },
  ): Promise<void> {
    const setClauses: string[] = ["updated_at = NOW()"];
    const values: any[] = [];
    let idx = 1;
    if (data.user_name !== undefined) {
      setClauses.push(`user_name = $${idx++}`);
      values.push(data.user_name);
    }
    if (data.role_key !== undefined) {
      setClauses.push(`role_key = $${idx++}`);
      values.push(data.role_key);
    }
    if (data.phone_number !== undefined) {
      setClauses.push(`phone_number = $${idx++}`);
      values.push(data.phone_number);
    }
    if (data.date_of_birth !== undefined) {
      setClauses.push(`date_of_birth = $${idx++}`);
      values.push(data.date_of_birth || null);
    }
    if (data.user_status_key !== undefined) {
      setClauses.push(`user_status_key = $${idx++}`);
      values.push(data.user_status_key);
    }
    if (data.company_id !== undefined) {
      setClauses.push(`company_id = $${idx++}`);
      values.push(data.company_id);
    }
    if (data.company_name !== undefined) {
      setClauses.push(`company_name = $${idx++}`);
      values.push(data.company_name);
    }
    if (data.deleted_at !== undefined) {
      setClauses.push(`deleted_at = $${idx++}`);
      values.push(data.deleted_at);
    }
    values.push(id);
    await this.dataSource.query(
      `UPDATE hr_user_management SET ${setClauses.join(", ")} WHERE id = $${idx}`,
      values,
    );
  }

  async insertExternalHrPolicyMappings(
    hrManagementId: number,
    companyId: number,
    policyIds: number[],
  ): Promise<void> {
    if (!policyIds.length) return;
    const companyParamIdx = policyIds.length + 2;
    const valuePlaceholders = policyIds
      .map((_, i) => ["($1, $", i + 2, ", $", companyParamIdx, ")"].join(""))
      .join(", ");
    await this.dataSource.query(
      `INSERT INTO external_hr_policy_map (hr_management_id, policy_id, company_id) VALUES ${valuePlaceholders} ON CONFLICT (hr_management_id, policy_id) DO NOTHING`,
      [hrManagementId, ...policyIds, companyId],
    );
  }

  async deleteExternalHrPolicyMappings(hrManagementId: number): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM external_hr_policy_map WHERE hr_management_id = $1`,
      [hrManagementId],
    );
  }

  async insertExternalHrLocationMappings(
    hrManagementId: number,
    companyId: number,
    addressIds: number[],
  ): Promise<void> {
    if (!addressIds.length) return;
    const companyParamIdx = addressIds.length + 2;
    const valuePlaceholders = addressIds
      .map((_, i) => ["($1, $", i + 2, ", $", companyParamIdx, ")"].join(""))
      .join(", ");
    await this.dataSource.query(
      `INSERT INTO external_hr_location_map (hr_management_id, address_id, company_id) VALUES ${valuePlaceholders} ON CONFLICT (hr_management_id, address_id) DO NOTHING`,
      [hrManagementId, ...addressIds, companyId],
    );
  }

  async deleteExternalHrLocationMappings(hrManagementId: number): Promise<void> {
    await this.dataSource.query(
      `DELETE FROM external_hr_location_map WHERE hr_management_id = $1`,
      [hrManagementId],
    );
  }

  async getHrUserPolicyMappings(hrManagementId: number): Promise<{ policyId: number; companyId: number }[]> {
    const rows = await this.dataSource.query(
      `SELECT policy_id AS "policyId", company_id AS "companyId" FROM external_hr_policy_map WHERE hr_management_id = $1`,
      [hrManagementId],
    );
    return rows.map((r: any) => ({ policyId: Number(r.policyId), companyId: Number(r.companyId) }));
  }

  async getHrUserLocationMappings(hrManagementId: number): Promise<{ addressId: number; companyId: number }[]> {
    const rows = await this.dataSource.query(
      `SELECT address_id AS "addressId", company_id AS "companyId" FROM external_hr_location_map WHERE hr_management_id = $1`,
      [hrManagementId],
    );
    return rows.map((r: any) => ({ addressId: Number(r.addressId), companyId: Number(r.companyId) }));
  }

  async getPendingEnrollmentEmployeeIds(policyId: number): Promise<number[]> {
    const rows = await this.dataSource.query(
      `SELECT DISTINCT peepm.employee_id AS "employeeId"
       FROM policy_enrollment_employee_policy_map peepm
       WHERE peepm.policy_id = $1
         AND peepm.deleted_at IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM policy_employee_enrollment pee
           WHERE pee.employee_id = peepm.employee_id
             AND pee.policy_id = peepm.policy_id
             AND pee.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
             AND pee.deleted_at IS NULL
         )
       ORDER BY peepm.employee_id`,
      [policyId],
    );
    return rows.map((r: any) => Number(r.employeeId));
  }

  async setEmployeeVip(employeeId: number, isVip: boolean): Promise<void> {
    await this.dataSource.query(
      `UPDATE policy_enrollment_employee
       SET additional_params = COALESCE(additional_params, '{}'::jsonb) || jsonb_build_object('isVip', $2::boolean),
           updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [employeeId, isVip],
    );
  }

  async setEmployeeBlocked(employeeId: number, isBlocked: boolean): Promise<void> {
    const statusKey = isBlocked ? USER_STATUS_INACTIVE : USER_STATUS_ACTIVE;
    await this.dataSource.getRepository(PolicyEnrollmentEmployee).update(
      { id: employeeId, deletedAt: IsNull() },
      { userStatusKey: statusKey, updatedAt: new Date() },
    );
  }

  async syncPeeStatusByEmail(email: string, statusKey: string): Promise<void> {
    await this.dataSource.getRepository(PolicyEnrollmentEmployee).update(
      { email: email.trim().toLowerCase(), deletedAt: IsNull() },
      { userStatusKey: statusKey, updatedAt: new Date() },
    );
  }

  async getCompanyNamesByIds(companyIds: number[]): Promise<Map<number, string>> {
    if (!companyIds.length) return new Map();
    try {
      const rows = await this.dataSource.getRepository(Company).find({
        where: { id: In(companyIds), deletedAt: IsNull() },
        select: ["id", "companyName"],
      });
      return new Map(rows.map((r) => [r.id, r.companyName]));
    } catch (error) {
      throw new InternalServerErrorException("Failed to fetch company names", { cause: error });
    }
  }

  async getCompanyName(companyId: number): Promise<string | null> {
    try {
      const company = await this.dataSource.getRepository(Company).findOne({
        where: { id: companyId, deletedAt: IsNull() },
        select: ["id", "companyName"],
      });
      return company?.companyName ?? null;
    } catch (error) {
      console.error("Failed to fetch company name for companyId", companyId, error);
      throw new InternalServerErrorException("Failed to fetch company name", { cause: error });
    }
  }

  async getEnrollmentUploadSummaryByEndorsement(
    policyId: number,
    endorsementId: number,
    page: number,
    limit: number,
  ): Promise<{ data: any[]; count: number; summary: { totalRecords: number; successCount: number; failureCount: number } }> {
    const offset = (page - 1) * limit;
    const EXCLUDED_DOC_TYPES = `'policy_tpa_id_upload', 'policy_endorsement_creation'`;

    // Scoped by endorsement_id alone — no enrollment-window filter — to match
    // iWork's own listEnrollmentUploadSummary (policy-service policy.repository.ts:9451,
    // exposed as GET :policyId/:endorsementId/enrollment-upload-summary-by-endorsement):
    // it filters purely on entityType/entityId/endorsementId, with no
    // enrollment_start_date/end_date condition at all. An earlier version of this
    // fix added a date-window filter, reasoning that an endorsement can stay "open"
    // and accumulate batches from later periods — true, but iWork doesn't scope by
    // window either, so that filter made IBP under-count relative to iWork's own
    // listing instead of matching it. Reverted to plain endorsement_id scoping.
    const dataQuery = `
      SELECT
        peus.id,
        peus.document_processing_file_id AS "documentProcessingFileId",
        peus.policy_id AS "policyId",
        peus.source_file_upload_id AS "sourceFileUploadId",
        peus.error_file_upload_id AS "errorFileUploadId",
        peus.success_file_upload_id AS "successFileUploadId",
        peus.success_count AS "successCount",
        peus.error_count AS "errorCount",
        peus.process_count AS "processCount",
        COALESCE(peus.batch_id, peus.document_processing_file_id) AS "batchId",
        dpf.entity_type AS "entityType",
        dpf.entity_id AS "entityId",
        dpf.document_id AS "documentId",
        dpf.document_type AS "documentType",
        dpf.enrollment_start_date AS "enrollmentStartDate",
        dpf.enrollment_end_date AS "enrollmentEndDate",
        dpf.process_status AS "processStatus",
        CASE WHEN dpf.process_status IN ('COMPLETED', 'FAILED') THEN dpf.updated_at ELSE NULL END AS "updatedAt",
        sf.id AS "sourceFileId",
        sf.file_key AS "sourceFileKey",
        sf.file_size AS "sourceFileSize",
        ef.id AS "errorFileId",
        ef.file_key AS "errorFileKey",
        ef.file_size AS "errorFileSize",
        ssf.id AS "successFileId",
        ssf.file_key AS "successFileKey",
        ssf.file_size AS "successFileSize",
        sf.created_at AS "createdAt",
        sf.created_at AS "date"
      FROM document_processing_file dpf
      LEFT JOIN policy_enrollment_upload_summary peus ON peus.document_processing_file_id = dpf.id
      LEFT JOIN file_uploads sf ON sf.id = dpf.document_id
      LEFT JOIN file_uploads ef ON ef.id = peus.error_file_upload_id
      LEFT JOIN file_uploads ssf ON ssf.id = peus.success_file_upload_id
      WHERE dpf.entity_type = 'policy'
        AND dpf.entity_id = $1
        AND dpf.endorsement_id = $2
        AND dpf.document_type NOT IN (${EXCLUDED_DOC_TYPES})
      ORDER BY sf.created_at DESC
      LIMIT $3 OFFSET $4
    `;

    const aggregateQuery = `
      SELECT
        COUNT(dpf.id)::int AS count,
        COALESCE(SUM(peus.process_count), 0)::int AS "totalRecords",
        COALESCE(SUM(peus.success_count), 0)::int AS "successCount",
        COALESCE(SUM(peus.error_count), 0)::int AS "failureCount"
      FROM document_processing_file dpf
      LEFT JOIN policy_enrollment_upload_summary peus ON peus.document_processing_file_id = dpf.id
      WHERE dpf.entity_type = 'policy'
        AND dpf.entity_id = $1
        AND dpf.endorsement_id = $2
        AND dpf.document_type NOT IN (${EXCLUDED_DOC_TYPES})
    `;

    const [rows, [agg]] = await Promise.all([
      this.dataSource.query(dataQuery, [policyId, endorsementId, limit, offset]),
      this.dataSource.query(aggregateQuery, [policyId, endorsementId]),
    ]);

    const mapped = rows.map((row: any) => ({
      id: row.id,
      documentProcessingFileId: row.documentProcessingFileId,
      policyId: row.policyId,
      sourceFileUploadId: row.sourceFileUploadId,
      errorFileUploadId: row.errorFileUploadId,
      successFileUploadId: row.successFileUploadId,
      successCount: row.successCount,
      errorCount: row.errorCount,
      processCount: row.processCount,
      batchId: row.batchId,
      documentProcessingFile: {
        id: row.documentProcessingFileId,
        entityType: row.entityType,
        entityId: row.entityId,
        documentId: row.documentId,
        documentType: row.documentType,
        enrollmentStartDate: row.enrollmentStartDate,
        enrollmentEndDate: row.enrollmentEndDate,
        processStatus: row.processStatus,
        updatedAt: row.updatedAt,
      },
      sourceFile: row.sourceFileId
        ? {
            id: row.sourceFileId,
            fileName: row.sourceFileKey ? row.sourceFileKey.split("/").pop() : null,
            fileSize: row.sourceFileSize,
          }
        : null,
      errorFile: row.errorFileId
        ? {
            id: row.errorFileId,
            fileName: row.errorFileKey ? row.errorFileKey.split("/").pop() : null,
            fileSize: row.errorFileSize,
          }
        : null,
      successFile: row.successFileId
        ? {
            id: row.successFileId,
            fileName: row.successFileKey ? row.successFileKey.split("/").pop() : null,
            fileSize: row.successFileSize,
          }
        : null,
      createdAt: row.createdAt,
      date: row.date,
    }));

    return {
      data: mapped,
      count: Number(agg?.count ?? 0),
      summary: {
        totalRecords: Number(agg?.totalRecords ?? 0),
        successCount: Number(agg?.successCount ?? 0),
        failureCount: Number(agg?.failureCount ?? 0),
      },
    };
  }

  async getEndorsementStats(policyId: number, endorsementId: number, locationIds: number[] = []) {
    const hasLocationFilter = locationIds.length > 0;

    // Step 1: Get endorsement counts and premiums (stored aggregates — full endorsement totals)
    const [endRow]: any[] = await this.dataSource.query(
      `SELECT endorsment_count, endorsment_dependent_count,
              employee_endorsement_addition_count, employee_endorsement_deletion_count,
              net_premium, gross_premium
       FROM endorsement
       WHERE policy_id = $1 AND id = $2
       LIMIT 1`,
      [policyId, endorsementId],
    );

    // Step 2: Get document IDs linked to this endorsement
    const docRows: { document_id: number }[] = await this.dataSource.query(
      `SELECT document_id FROM document_processing_file WHERE endorsement_id = $1`,
      [endorsementId],
    );
    const documentIds = docRows.map((r) => r.document_id);

    // REVERTED: previously unioned in "dependent owner" employees (people whose
    // dependent was added/deleted via this endorsement even if the employee
    // themselves wasn't in the addition/deletion batch), to try to match iWork's
    // population for the completed/in-progress/not-started split. That widened
    // the population used for that split beyond what the Employees/Dependants/
    // Total Lives tiles show (which read the stored endorsment_count/
    // endorsment_dependent_count columns) — creating exactly the inconsistency
    // reported on endorsement #30492: 4 "Not Logged In" lives that don't appear
    // in Total Lives at all, since they were never part of that stored total.
    // Reverting keeps the split population consistent with the totals shown
    // above it; the iWork-parity gap this was trying to close needs a
    // different, more targeted fix instead of widening the population.
    const dependentOwnerIds: number[] = [];

    let totalEmployeesInEndorsement = 0;
    let notStartedCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let useUpdationFallback = false;

    if (documentIds.length > 0) {
      // Build location join clause for employee filtering
      const locJoin = hasLocationFilter
        ? `INNER JOIN policy_enrollment_employee pee_loc ON pee_loc.id = empMap.employee_id
             AND pee_loc.deleted_at IS NULL
             AND pee_loc.policy_config_location_id = ANY($4)`
        : "";
      const locParam = hasLocationFilter
        ? [policyId, documentIds, dependentOwnerIds, locationIds]
        : [policyId, documentIds, dependentOwnerIds];

      // Step 3a: Employee status counts via batch documents
      // "completed" used to mean "status != IN_PROGRESS", which silently
      // folded EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED (a real, distinct
      // status used elsewhere in this module) into the completed bucket —
      // anyone with a policy_employee_enrollment row that wasn't literally
      // "in progress" got counted as done, inflating employeeCompletedCount
      // by however many batch members hadn't actually started. Now requires
      // the strict ENROLLED status, matching how "completed"/"enrolled" is
      // defined everywhere else in this module.
      const [empCounts]: any[] = await this.dataSource.query(
        `SELECT
           COUNT(DISTINCT empMap.employee_id) AS "totalEmployees",
           -- Scoped to THIS batch's own deletion documents ($2), not "deleted by any
           -- batch ever" (the old "IS NOT NULL" check). An employee added by this
           -- batch who was later deleted via a DIFFERENT, unrelated endorsement has a
           -- non-null enrollment_deletion_batch_id pointing at that OTHER batch — the
           -- old check silently excluded them from every bucket below (not counted as
           -- deletionCompleted for THIS batch, but still subtracted out of
           -- notStartedCount), so they vanished from Employees/In Progress/Not Logged
           -- In entirely. Confirmed on endorsement #30418 (Additions 70, Deletions
           -- 157): Employees + In Progress + Not Logged In summed to 60, not 70.
           COUNT(DISTINCT CASE WHEN empMap.enrollment_deletion_batch_id = ANY($2) THEN empMap.employee_id END) AS "deletionCompleted",
           -- Same fix as deletionCompleted above: "not deleted by THIS batch"
           -- instead of "not deleted by anything, ever" (the old "IS NULL"
           -- check) — otherwise an employee added by this batch but deleted
           -- later via a different endorsement was excluded here too, even
           -- though their current status among THIS batch's additions is a
           -- separate question from that unrelated deletion.
           -- Wrapped in COALESCE(..., false): plain "NOT (col = ANY($2))"
           -- evaluates to NULL (not TRUE) whenever col IS NULL — the normal
           -- case for a pure addition that was never deleted at all — which
           -- silently excluded every never-deleted employee from BOTH
           -- inProgress and completed (SQL's three-valued logic: NOT NULL = NULL,
           -- and a NULL CASE condition never matches). Confirmed on endorsement
           -- #30492: 4 employees with status ENROLLED were falling into
           -- notStartedCount because this exact guard silently dropped them.
           COUNT(DISTINCT CASE WHEN NOT COALESCE(empMap.enrollment_deletion_batch_id = ANY($2), false)
             AND enroll.employee_id IS NOT NULL
             AND enroll.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS'
             THEN empMap.employee_id END) AS "inProgress",
           -- Broad "not literally IN_PROGRESS" definition, matching iWork's
           -- getPolicyEndorsementStats (policy.repository.ts:28078-28084) exactly —
           -- confirmed on endorsement #30418, where iWork reports notStartedCount=0/
           -- inProgressCount=0 (i.e. treats everyone not mid-enrolment as "completed"),
           -- while the strict "= ENROLLED" version this replaces left 43 lives sitting
           -- in Not Logged In that iWork doesn't. This reverts the stricter, previously
           -- deliberate ibp-only definition (see the old comment above this query) in
           -- favor of full parity with iWork.
           COUNT(DISTINCT CASE WHEN NOT COALESCE(empMap.enrollment_deletion_batch_id = ANY($2), false)
             AND enroll.employee_id IS NOT NULL
             AND (enroll.employee_enrollment_status_key IS NULL OR enroll.employee_enrollment_status_key != 'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS')
             THEN empMap.employee_id END) AS "completed"
         FROM policy_enrollment_employee_policy_map empMap
         LEFT JOIN policy_employee_enrollment enroll
           ON enroll.employee_id = empMap.employee_id AND enroll.policy_id = empMap.policy_id
         LEFT JOIN policy_enrollment_employee emp
           ON emp.id = empMap.employee_id AND emp.deleted_at IS NULL
         ${locJoin}
         WHERE empMap.policy_id = $1
           AND (
             empMap.enrollment_addition_batch_id = ANY($2)
             OR empMap.enrollment_deletion_batch_id = ANY($2)
             OR empMap.employee_id = ANY($3)
           )`,
        locParam,
      );
      totalEmployeesInEndorsement = Number(empCounts?.totalEmployees ?? 0);
      const deletionCompleted = Number(empCounts?.deletionCompleted ?? 0);
      inProgressCount = Number(empCounts?.inProgress ?? 0);
      // Deleted employees ARE folded into completedCount here, matching iWork's
      // getPolicyEndorsementStats exactly (policy.repository.ts:28115-28116:
      // completedCount = Number(employeeCounts?.completed) + deletionCompletedCount).
      // This reverses a deliberate ibp-only correctness fix (confirmed live via
      // policy 749326: a deleted employee showing up as "Enrolment completed"
      // was considered wrong) — but iWork's own endorsement-steps API still does
      // exactly this (confirmed on endorsement #30492: additionCount 11 +
      // deletionCount 60 = totalLives 71 = completedCount 71, i.e. iWork counts
      // every deletion as "completed" too), so full parity wins here per the
      // same instruction this whole round of fixes has followed.
      // notStartedCount still subtracts deletionCompleted from the total first
      // (using the RAW, pre-fold completed count) — the fold-in only affects what
      // gets REPORTED as completedCount, not how notStartedCount is derived.
      const rawCompleted = Number(empCounts?.completed ?? 0);
      completedCount = rawCompleted + deletionCompleted;
      notStartedCount = Math.max(
        0,
        totalEmployeesInEndorsement - deletionCompleted - inProgressCount - rawCompleted,
      );
    }

    if (totalEmployeesInEndorsement === 0) {
      // Step 3b: Updation fallback — employees updated (not added/deleted) via direct file
      const updateOnlyRows: { employee_id: number }[] = await this.dataSource.query(
        `SELECT DISTINCT employee_id
         FROM policy_employee_endorsement
         WHERE policy_id = $1
           AND endorsement_id = $2
           AND employee_endorsement_status_key = 'EMPLOYEE_ENDORSEMENT_READY'
           AND endorsement_updation_file_id IS NOT NULL`,
        [policyId, endorsementId],
      );
      if (updateOnlyRows.length > 0) {
        useUpdationFallback = true;
        totalEmployeesInEndorsement = updateOnlyRows.length;
        notStartedCount = 0;
        inProgressCount = 0;
        completedCount = updateOnlyRows.length;
      }
    }

    // Step 4: Dependent status counts
    // Row scope now also includes dependents whose PARENT EMPLOYEE belongs to
    // this endorsement's batch (empMap2), not just dependents directly tagged
    // with this endorsement/batch id — a dependent added later via a mid-term
    // "add dependent" flow (no batch upload at all) never gets
    // addition_endorsement_id/enrollment_addition_batch_id set, so the old
    // scope silently dropped it from every endorsement's stats, inception
    // included.
    //
    // The empMap2 fallback only fires when the dependent's OWN
    // addition/deletion_endorsement_id is NULL. Confirmed via direct DB query
    // (policy 953191, inception #30374): without this guard, empMap2 matched
    // on the parent employee's CURRENT map row alone, sweeping in 32
    // dependents that actually belong to a completely different endorsement
    // (their own addition_endorsement_id was set, just not to this one) —
    // an employee can accumulate multiple batches over time, so their map
    // row's batch id isn't a reliable signal for "this specific dependent
    // belongs to this specific endorsement" when the dependent's own column
    // already answers that question. Verified the guard is a no-op for the
    // two already-correct cases (#30418, #30492): empMap2 contributed zero
    // additional dependents in both once addition/deletion_endorsement_id is
    // set, so restricting it to the NULL case changes nothing there.
    // Completion status now comes from the same enrollment-choice
    // chain as endorsement_employee_metrics' active_dependents fix, not
    // dep.endorsement_status_key directly, for the same reason: that column
    // isn't reliably stamped outside the batch-upload flow, while being
    // selected in a choice is the authoritative "this dependent is covered"
    // signal regardless of how it was added.
    //
    // Status buckets (deletionCompleted/inProgress/completed) are gated on
    // "ownScoped" — the dependent's OWN addition/deletion_endorsement_id
    // matching this endorsement — NOT the broader empMap2-fallback
    // population. Confirmed via direct DB query (endorsement #30690): a
    // dependent with addition_endorsement_id NULL, pulled in only via its
    // parent employee's batch row, was showing up in IBP's live In
    // Progress count while iWork's own live query (which has no
    // employee-batch fallback for dependents) never counts it at all —
    // iWork reported notStarted=1/inProgress=1 (employee-only) for this
    // endorsement, IBP reported notLoggedIn=1/inProgress=2. The
    // empMap2-fallback population is still used for totalDependents/
    // enrolledLives scoping (a dependent genuinely tied to this batch
    // shouldn't vanish from those), but per explicit instruction
    // (2026-08-09) it no longer contributes to the status split, so the
    // split total (ownScopedTotal) — not the broader population — is what
    // notStartedCount's subtraction uses below.
    const [depCounts]: any[] = await this.dataSource.query(
      `SELECT
         COUNT(DISTINCT dep.id) AS "totalDependents",
         COUNT(DISTINCT CASE WHEN dep.addition_endorsement_id = $2 OR dep.deletion_endorsement_id = $2 THEN dep.id END) AS "ownScopedTotal",
         COUNT(DISTINCT CASE WHEN dep.deletion_endorsement_id = $2 AND dep.enrollment_deletion_batch_id IS NOT NULL THEN dep.id END) AS "deletionCompleted",
         COUNT(DISTINCT CASE WHEN (dep.addition_endorsement_id = $2 OR dep.deletion_endorsement_id = $2)
           AND NOT (dep.deletion_endorsement_id = $2 AND dep.enrollment_deletion_batch_id IS NOT NULL)
           AND pee2.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS' THEN dep.id END) AS "inProgress",
         -- Broad "not IN_PROGRESS" definition, matching iWork's own dependent-side
         -- logic (policy.repository.ts:28144-28150), which requires a NON-NULL
         -- status that isn't IN_PROGRESS — unlike the employee-side fix above
         -- (where NULL also counts as completed), iWork's dependent-side
         -- explicitly requires dep.endorsement_status_key IS NOT NULL. IBP derives
         -- this status via the enrollment-choice chain (pee2) instead of
         -- iWork's direct dep.endorsement_status_key column (a pre-existing,
         -- deliberate structural difference, not changed here) — matching the
         -- same NOT-NULL stance on top of that.
         COUNT(DISTINCT CASE WHEN (dep.addition_endorsement_id = $2 OR dep.deletion_endorsement_id = $2)
           AND NOT (dep.deletion_endorsement_id = $2 AND dep.enrollment_deletion_batch_id IS NOT NULL)
           AND pee2.employee_enrollment_status_key IS NOT NULL
           AND pee2.employee_enrollment_status_key != 'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS' THEN dep.id END) AS "completed"
       FROM policy_enrollment_dependent dep
       LEFT JOIN policy_enrollment_employee_policy_map empMap2
         ON empMap2.employee_id = dep.employee_id AND empMap2.policy_id = dep.policy_id
       LEFT JOIN policy_employee_enrollment_choice_dependent pecd
         ON pecd.dependent_id = dep.id AND pecd.deleted_at IS NULL
       LEFT JOIN policy_employee_enrollment_choice peec
         ON peec.id = pecd.employee_enrollment_choice_id
       LEFT JOIN policy_employee_enrollment pee2
         ON pee2.id = peec.employee_enrollment_id AND pee2.deleted_at IS NULL
       WHERE dep.policy_id = $1
         AND (
           dep.addition_endorsement_id = $2
           OR dep.deletion_endorsement_id = $2
           OR (dep.addition_endorsement_id IS NULL AND empMap2.enrollment_addition_batch_id = ANY($3))
           OR (dep.deletion_endorsement_id IS NULL AND empMap2.enrollment_deletion_batch_id = ANY($3))
         )`,
      [policyId, endorsementId, documentIds],
    );

    const totalDependentsInEndorsement = Number(depCounts?.ownScopedTotal ?? 0);
    const depDeletionCompleted = Number(depCounts?.deletionCompleted ?? 0);
    let dependentInProgressCount = Number(depCounts?.inProgress ?? 0);
    // Deleted dependents ARE folded into dependentCompletedCount, matching iWork's
    // getPolicyEndorsementStats exactly (same dependentCompletedCount =
    // completed + deletionCompleted pattern as the employee side above) — see
    // that comment for the full reasoning on why this reverses a previously
    // deliberate ibp-only correctness fix in favor of iWork parity.
    //
    // CONFIRMED (was flagged as unverified): dependent deletion DOES set
    // deleted_at on the same policy_enrollment_dependent row. The outer WHERE
    // clause used to require dep.deleted_at IS NULL, which silently excluded
    // every deleted dependent from this query entirely — not just from
    // deletionCompleted, but from totalDependents itself. Verified directly
    // against the DB for policy 953191 / endorsement 30492: 7 non-deleted + 29
    // deleted = 36 dependents, exactly matching iWork's totalDependents (IBP
    // was reporting 7). Removed the dep.deleted_at IS NULL condition from the
    // WHERE clause above so deleted dependents are counted (and correctly
    // bucketed into deletionCompleted by the CASE conditions), not dropped.
    const rawDependentCompleted = Number(depCounts?.completed ?? 0);
    let dependentCompletedCount = rawDependentCompleted + depDeletionCompleted;
    let dependentNotStartedCount = Math.max(
      0,
      totalDependentsInEndorsement - depDeletionCompleted - dependentInProgressCount - rawDependentCompleted,
    );

    if (useUpdationFallback) {
      // Step 5: Updation fallback for dependents
      const [depUpdateRow]: any[] = await this.dataSource.query(
        `SELECT COUNT(*) AS count
         FROM policy_dependent_endorsement
         WHERE policy_id = $1
           AND endorsement_id = $2
           AND employee_endorsement_status_key = 'EMPLOYEE_ENDORSEMENT_READY'
           AND endorsement_updation_file_id IS NOT NULL`,
        [policyId, endorsementId],
      );
      const updateOnlyDepCount = Number(depUpdateRow?.count ?? 0);
      dependentNotStartedCount = 0;
      dependentInProgressCount = 0;
      dependentCompletedCount = updateOnlyDepCount;
    }

    // Prefers the STORED endorsment_count/endorsment_dependent_count columns
    // (same columns iWork's own endorsementSummary header reads) whenever there's
    // no location filter, falling back to the live per-person count only when the
    // stored value is null.
    //
    // KNOWN TRADEOFF (deliberate, not a bug — confirmed via direct DB query on
    // endorsement #30418): the stored columns are written by a separate
    // scheduler job and can drift from what this function's own live query would
    // compute right now. On #30418, iWork's own header (140 dependents) doesn't
    // even match iWork's own live per-person query population for that same
    // endorsement (verified: 137) — iWork's completedCount (251) exceeds its own
    // totalLives (227) for the same reason. When the stored total is stale
    // relative to live data, Employees/Dependants/Total Lives (stored-based)
    // will not sum exactly against In Progress/Not Started/Completed (always
    // live) — reintroducing the "phantom people" pattern from #30492, but this
    // time because iWork's OWN source data disagrees with itself, not because of
    // a query bug. Chosen anyway, per explicit instruction, so IBP's headline
    // Employees/Dependants/Total Lives numbers match iWork's header exactly.
    const liveComputedEmployees = completedCount + inProgressCount + notStartedCount;
    const liveComputedDependents = dependentCompletedCount + dependentInProgressCount + dependentNotStartedCount;
    const endorsementReadyEmployees = hasLocationFilter
      ? liveComputedEmployees
      : Number(endRow?.endorsment_count ?? liveComputedEmployees ?? 0);
    const endorsementReadyDependents = hasLocationFilter
      ? liveComputedDependents
      : Number(endRow?.endorsment_dependent_count ?? liveComputedDependents ?? 0);

    // New, standalone fields for the accordion header pill specifically —
    // additive only, doesn't touch or feed into anything above.
    //
    // enrolledLives / enrolledPremium: deliberately fresh, self-contained
    // queries rather than reusing completedCount/dependentCompletedCount —
    // those are FOLDED (deletionCompleted people count as "completed" too,
    // per the iWork-parity fix earlier), so a deleted employee/dependent
    // could show up as "enrolled" there. "Enrolled" here means genuinely
    // active: emp.deleted_at IS NULL / dep.deleted_at IS NULL, status
    // strictly ENROLLED. This is also why notStartedCount/inProgressCount
    // (which already exclude deletionCompleted by construction) plus this
    // enrolledLives can reconcile against the active headcount, instead of
    // double-counting deleted people the way completedCount(folded) would.
    let enrolledLives = 0;
    let enrolledPremium = 0;
    if (documentIds.length > 0) {
      // policy_employee_enrollment has at most one row per (employee_id, policy_id)
      // (the same natural key already relied on elsewhere in this function, e.g.
      // the "enroll"/"pe" joins above) — pop is already DISTINCT employee_id, so
      // this join can't fan out and double-count emp.id or total_premium.
      // Employee deletion does NOT set deleted_at on policy_enrollment_employee
      // (confirmed directly on the DB) — a deleted employee's master record
      // stays active and their employee_enrollment_status_key stays whatever it
      // was before removal (often still ENROLLED). So emp.deleted_at IS NULL
      // alone doesn't exclude them; also excluding anyone matched via THIS
      // batch's own deletion documents (same NULL-safe pattern as the
      // deletionCompleted logic above) is required for "enrolled" to mean
      // "currently active", not "was enrolled before being removed".
      const [enrolledEmpRow]: any[] = await this.dataSource.query(
        `SELECT
           COUNT(DISTINCT emp.id) AS "enrolledEmployees",
           COALESCE(SUM(pe.total_premium), 0) AS "enrolledPremium"
         FROM (
           SELECT DISTINCT empMap.employee_id
           FROM policy_enrollment_employee_policy_map empMap
           WHERE empMap.policy_id = $1
             AND (empMap.enrollment_addition_batch_id = ANY($2) OR empMap.enrollment_deletion_batch_id = ANY($2))
             AND NOT COALESCE(empMap.enrollment_deletion_batch_id = ANY($2), false)
         ) pop
         INNER JOIN policy_enrollment_employee emp
           ON emp.id = pop.employee_id AND emp.deleted_at IS NULL
         INNER JOIN policy_employee_enrollment pe
           ON pe.employee_id = pop.employee_id AND pe.policy_id = $1
         WHERE pe.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'`,
        [policyId, documentIds],
      );
      const enrolledEmployeesCount = Number(enrolledEmpRow?.enrolledEmployees ?? 0);
      enrolledPremium = Number(enrolledEmpRow?.enrolledPremium ?? 0);

      const [enrolledDepRow]: any[] = await this.dataSource.query(
        `SELECT COUNT(DISTINCT dep.id) AS "enrolledDependents"
         FROM policy_enrollment_dependent dep
         LEFT JOIN policy_enrollment_employee_policy_map empMap2
           ON empMap2.employee_id = dep.employee_id AND empMap2.policy_id = dep.policy_id
         LEFT JOIN policy_employee_enrollment_choice_dependent pecd
           ON pecd.dependent_id = dep.id AND pecd.deleted_at IS NULL
         LEFT JOIN policy_employee_enrollment_choice peec
           ON peec.id = pecd.employee_enrollment_choice_id
         LEFT JOIN policy_employee_enrollment pee2
           ON pee2.id = peec.employee_enrollment_id AND pee2.deleted_at IS NULL
         WHERE dep.policy_id = $1
           AND dep.deleted_at IS NULL
           AND (
             dep.addition_endorsement_id = $2
             OR (dep.addition_endorsement_id IS NULL AND empMap2.enrollment_addition_batch_id = ANY($3))
           )
           AND pee2.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'`,
        [policyId, endorsementId, documentIds],
      );
      const enrolledDependentsCount = Number(enrolledDepRow?.enrolledDependents ?? 0);

      enrolledLives = enrolledEmployeesCount + enrolledDependentsCount;
    }

    // activeLives: enrolled + in-progress + not-logged-in, i.e. everyone still
    // ACTIVE on this batch (excludes anyone deletion-matched). Deliberately
    // separate from totalLives, which stays the lifetime stored total (matches
    // iWork's header, including exited/deleted people) — the two answer
    // different questions and shouldn't be conflated. This is the field the
    // enrolledLives + inProgress + notLoggedIn invariant actually holds
    // against; totalLives will legitimately be larger by however many were
    // deleted from this batch (activeLives + deletionCount â‰ˆ totalLives).
    const activeLives = enrolledLives + inProgressCount + dependentInProgressCount + notStartedCount + dependentNotStartedCount;

    return {
      enrolledLives,
      enrolledPremium,
      activeLives,
      totalEmployees: endorsementReadyEmployees,
      totalDependents: endorsementReadyDependents,
      totalLives: endorsementReadyEmployees + endorsementReadyDependents,
      // additionCount/deletionCount are stored per-endorsement aggregates —
      // cannot be split by location, returned as-is.
      additionCount: Number(endRow?.employee_endorsement_addition_count ?? 0),
      deletionCount: Number(endRow?.employee_endorsement_deletion_count ?? 0),
      netPremium: Number(endRow?.net_premium ?? 0),
      grossPremium: Number(endRow?.gross_premium ?? 0),
      // Every status bucket is lives-level (employee count + the dependents of
      // employees in that same bucket), so EMPLOYEES/DEPENDANTS/TOTAL LIVES and
      // IN PROGRESS/NOT LOGGED IN are all built the same way and can be summed
      // consistently on the frontend.
      notStartedCount: notStartedCount + dependentNotStartedCount,
      inProgressCount: inProgressCount + dependentInProgressCount,
      completedCount: completedCount + dependentCompletedCount,
      employeeCompletedCount: completedCount,
      // Enrolled dependents — i.e. dependents whose OWN linked employee
      // enrollment is ENROLLED (see the depCounts query's "completed" case
      // above, gated on pee2.employee_enrollment_status_key = ENROLLED).
      // Exposed directly so the DEPENDANTS tile can bind to "enrolled
      // dependents" instead of the raw, unfiltered totalDependents.
      dependentCompletedCount,
      // "Not logged in" used to be derived independently from user_activity_log
      // (via a join keyed on the wrong id space), which could disagree with
      // employee_enrollment_status_key and report someone as not-logged-in
      // even though they were already marked Enrolled. Status is the
      // authoritative source everywhere else in this module, so reuse it here
      // too: not-logged-in is just not-started, and the two can never overlap
      // — same lives-level figure (employees + their dependents) as
      // notStartedCount above, not employee-only like this used to be.
      notLoggedInCount: notStartedCount + dependentNotStartedCount,
      locationFiltered: hasLocationFilter,
    };
  }

  async listHrAdminUsers(params: {
    companyId?: number;
    search?: string;
    page: number;
    limit: number;
  }) {
    const offset = (params.page - 1) * params.limit;
    const values: any[] = [];
    let where = `hum.role_key IN ('HR_ADMIN', 'ONLY_HR')`;

    if (params.companyId) {
      values.push(params.companyId);
      where += ` AND hum.company_id = $${values.length}`;
    }
    if (params.search) {
      values.push(`%${params.search}%`);
      where += ` AND (hum.user_name ILIKE $${values.length} OR hum.email_id ILIKE $${values.length})`;
    }

    const countRow = await this.dataSource.query(
      `SELECT COUNT(*) AS total FROM hr_user_management hum WHERE ${where}`,
      values,
    );

    values.push(params.limit, offset);
    const rows = await this.dataSource.query(
      `SELECT hum.id AS "hrManagementId", hum.user_name AS "fullName", hum.email_id AS email,
              hum.phone_number AS phone, hum.role_key AS "roleKey",
              hum.company_id AS "companyId", hum.company_name AS "companyName",
              hum.user_status_key AS status, hum.created_at AS "createdAt"
         FROM hr_user_management hum
        WHERE ${where}
        ORDER BY hum.created_at DESC
        LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );

    return { data: rows, total: Number(countRow[0]?.total ?? 0) };
  }

}
