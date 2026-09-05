import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { PolicyInstallments } from "../../../../service-lib/src/lib/entities/policy-installments.entity";
import { User } from "../../../../service-lib/src/lib/entities/user";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";

export type InstallmentReminderRow = {
  installmentId: number;
  policyId: number;
  companyId: number;
  installmentNo: string | null;
  installmentSequence: number | null;
  installmentDate: string;
  installmentAmount: string | null;
  policyName: string | null;
  insurerPolicyNumber: string | null;
  iirmPolicyNumber: number;
  policyFrom: string | null;
  policyTo: string | null;
  clientName: string | null;
  policyType: string | null;
  insurerName: string | null;
  ownerId: number | null;
  amId: number | null;
  isgId: number | null;
  daysDiff: number;
  currencyFormat: string | null;
  numberFormat: string | null;
};

@Injectable()
export class InstallmentReminderRepository {
  constructor(
    @InjectRepository(PolicyInstallments)
    private readonly policyInstallmentsRepo: Repository<PolicyInstallments>,
    @InjectRepository(LookUp)
    private readonly lookUpRepo: Repository<LookUp>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>
  ) {}

  async getInstallmentPaidStatusId(
    paidStatusKey: string
  ): Promise<number | null> {
    const paidStatus = await this.lookUpRepo.findOne({
      where: { lookUpKey: paidStatusKey },
      select: ["id"],
    });
    if (!paidStatus) {
      return null;
    }
    return paidStatus.id;
  }

  async getEligibleInstallments(
    maxWindowDays: number,
    paidStatusId: number | null
  ): Promise<InstallmentReminderRow[]> {
    const dayDiffExpr = `(pi.installment_date::date - (NOW() AT TIME ZONE 'Asia/Kolkata')::date)::int`;

    const qb = this.policyInstallmentsRepo
      .createQueryBuilder("pi")
      .innerJoin("policy", "p", "p.id = pi.policy_id")
      .leftJoin(
        "opportunity",
        "o",
        "o.id = COALESCE(pi.opportunity_id, p.opportunity_id)"
      )
      .leftJoin("company", "c", "c.id = p.company_id")
      .leftJoin("country", "ctry", "ctry.id = c.country_id")
      .leftJoin(
        "localization_country",
        "lc",
        "LOWER(lc.name) = LOWER(ctry.name)",
      )
      .leftJoin("lookup_data", "lu", "lu.id = p.policy_type_lid")
      .select("pi.id", "installmentId")
      .addSelect("pi.policy_id", "policyId")
      .addSelect("p.company_id", "companyId")
      .addSelect("pi.installment_no", "installmentNo")
      .addSelect("pi.installment_sequence", "installmentSequence")
      .addSelect(
        `TO_CHAR(pi.installment_date, 'YYYY-MM-DD')`,
        "installmentDate"
      )
      .addSelect(
        "COALESCE(pi.total_installment_amount, pi.installment_gross_amount, pi.installment_net_amount)::text",
        "installmentAmount"
      )
      .addSelect("p.policy_name", "policyName")
      .addSelect("p.insurer_policy_number", "insurerPolicyNumber")
      .addSelect("p.id", "iirmPolicyNumber")
      .addSelect(`TO_CHAR(p.policy_from, 'YYYY-MM-DD')`, "policyFrom")
      .addSelect(`TO_CHAR(p.policy_to, 'YYYY-MM-DD')`, "policyTo")
      .addSelect(
        "COALESCE(NULLIF(c.display_name, ''), c.company_name)",
        "clientName"
      )
      .addSelect("COALESCE(NULLIF(lu.value, ''), lu.lookup_key)", "policyType")
      .addSelect(
        `(
          SELECT COALESCE(NULLIF(i.display_name, ''), i.name)
          FROM policy_insurer_map pim
          JOIN insurer i ON i.id = pim.insurer_id AND i.deleted_at IS NULL
          WHERE pim.policy_id = p.id AND pim.deleted_at IS NULL
          ORDER BY pim.id ASC
          LIMIT 1
        )`,
        "insurerName"
      )
      .addSelect("o.owner_id", "ownerId")
      .addSelect("o.am_id", "amId")
      .addSelect("o.isg_id", "isgId")
      .addSelect(dayDiffExpr, "daysDiff")
      .addSelect("lc.currency_format", "currencyFormat")
      .addSelect("lc.number_format", "numberFormat")
      .where("pi.deleted_at IS NULL")
      .andWhere("pi.installment_date IS NOT NULL")
      .andWhere(
        new Brackets((whereQb) => {
          if (paidStatusId === null) {
            whereQb.where("1=1");
            return;
          }
          whereQb
            .where("pi.status_lid IS NULL")
            .orWhere("pi.status_lid <> :paidStatusId", { paidStatusId });
        })
      )
      .andWhere(`${dayDiffExpr} BETWEEN 0 AND :maxWindowDays`, { maxWindowDays })
      .orderBy("pi.installment_date", "ASC")
      .addOrderBy("pi.id", "ASC");

    const rows = await qb.getRawMany<InstallmentReminderRow>();
    return rows;
  }

  async getDynamicRecipientEmails(userIds: number[]): Promise<string[]> {
    if (!userIds.length) {
      return [];
    }

    const recipients = await this.userRepo
      .createQueryBuilder("u")
      .leftJoin("employee", "e", "e.user_id = u.id AND e.deleted_at IS NULL")
      .select(
        `DISTINCT COALESCE(NULLIF(u.email_id, ''), NULLIF(e.email_id, ''))`,
        "email"
      )
      .where("u.id IN (:...userIds)", { userIds })
      .andWhere("u.deleted_at IS NULL")
      .getRawMany<{ email: string | null }>();

    return recipients
      .map((item) => item.email?.trim())
      .filter((email: string | undefined): email is string => !!email);
  }
}
