import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Policy } from "../../../../service-lib/src/lib/entities/policy.entity";
import { User } from "../../../../service-lib/src/lib/entities/user";

export type PolicyReminderRow = {
    policyId: number;
    companyId: number;
    policyName: string | null;
    insurerPolicyNumber: string | null;
    iirmPolicyNumber: number;
    policyStartDate: string | null;
    policyEndDate: string | null;
    clientName: string | null;
    policyType: string | null;
    insurerName: string | null;
    ownerId: number | null;
    daysDiff: number;
};

@Injectable()
export class PolicyReminderRepository {
    constructor(
        @InjectRepository(Policy)
        private readonly policyRepo: Repository<Policy>,
        @InjectRepository(User)
        private readonly userRepo: Repository<User>
    ) {}

    async getEligiblePolicies(
        maxWindowDays: number
    ): Promise<PolicyReminderRow[]> {
        const dayDiffExpr = `(p.policy_to::date - (NOW() AT TIME ZONE 'Asia/Kolkata')::date)::int`;

        const qb = this.policyRepo
            .createQueryBuilder("p")
            .leftJoin(
                "opportunity",
                "o",
                "o.id = p.opportunity_id"
            )
            .leftJoin("company", "c", "c.id = p.company_id")
            .leftJoin("lookup_data", "lu", "lu.id = p.policy_type_lid")
            .select("p.id", "policyId")
            .addSelect("p.company_id", "companyId")
            .addSelect("p.policy_name", "policyName")
            .addSelect("p.insurer_policy_number", "insurerPolicyNumber")
            .addSelect("p.id", "iirmPolicyNumber")
            .addSelect(`TO_CHAR(p.policy_from, 'YYYY-MM-DD')`, "policyStartDate")
            .addSelect(`TO_CHAR(p.policy_to, 'YYYY-MM-DD')`, "policyEndDate")
            .addSelect(
                "COALESCE(NULLIF(c.display_name, ''), c.company_name)",
                "clientName"
            )
            .addSelect("COALESCE(NULLIF(lu.value, ''), lu.lookup_key)", "policyType")
            .addSelect(
                `(
                    SELECT COALESCE(NULLIF(i.display_name, ''), i.name)
                    FROM policy_insurer_map pim
                    JOIN insurer i ON i.id = pim.insurer_id
                    WHERE pim.policy_id = p.id
                    ORDER BY pim.id ASC
                    LIMIT 1
                )`,
                "insurerName"
            )
            .addSelect("o.owner_id", "ownerId")
            .addSelect(dayDiffExpr, "daysDiff")
            .where(`${dayDiffExpr} BETWEEN 0 AND :maxWindowDays`, { maxWindowDays })
            .orderBy("p.policy_to", "ASC")
            .addOrderBy("p.id", "ASC");

        const rows = await qb.getRawMany<PolicyReminderRow>();
        return rows;
    }

    async getDynamicRecipientEmails(userIds: number[]): Promise<string[]> {
        if (!userIds.length) {
            return [];
        }

        const recipients = await this.userRepo
            .createQueryBuilder("usr")
            .leftJoin("employee", "emp", "emp.user_id = usr.id")
            .select(
                `DISTINCT COALESCE(NULLIF(usr.email_id, ''), NULLIF(emp.email_id, ''))`,
                "email"
            )
            .where("usr.id IN (:...userIds)", { userIds })
            .getRawMany<{ email: string | null }>();

        return recipients
            .map((item) => item.email?.trim())
            .filter((email: string | undefined): email is string => !!email);
    }
}
