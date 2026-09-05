import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Company } from "./entities/company.entity";

const MIN_REMINDER_DAY = 0;
const MAX_REMINDER_DAY = 90;

export type ReminderConfigKey =
  | "installmentReminderDays"
  | "policyExpiryReminderDays"
  | "opportunityCloseToExpiryReminderDays";

/**
 * Reads per-company reminder-day overrides straight off the `company` table
 * (configured on the Company Details page's "Email Reminders" tab). One row
 * per company - no domain/portal-config ambiguity. Companies without an
 * override fall back to the caller-supplied default.
 */
@Injectable()
export class ReminderConfigService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>
  ) {}

  async getReminderDaysByCompany(
    companyIds: number[],
    configKey: ReminderConfigKey,
    fallbackDays: number[]
  ): Promise<Map<number, number[]>> {
    const result = new Map<number, number[]>();
    if (!companyIds.length) {
      return result;
    }

    const uniqueCompanyIds = Array.from(new Set(companyIds));
    const rows = await this.companyRepository
      .createQueryBuilder("c")
      .select(["c.id", `c.${configKey}`])
      .where("c.id IN (:...uniqueCompanyIds)", { uniqueCompanyIds })
      .getMany();

    const daysByCompany = new Map<number, number[] | null | undefined>();
    rows.forEach((row) => daysByCompany.set(row.id, row[configKey]));

    uniqueCompanyIds.forEach((companyId) => {
      result.set(
        companyId,
        this.parseReminderDays(daysByCompany.get(companyId), fallbackDays)
      );
    });

    return result;
  }

  private parseReminderDays(
    raw: number[] | null | undefined,
    fallbackDays: number[]
  ): number[] {
    if (!Array.isArray(raw) || raw.length === 0) {
      return fallbackDays;
    }

    const parsed = Array.from(
      new Set(
        raw
          .map((value) => Number(value))
          .filter(
            (value) =>
              Number.isInteger(value) &&
              value >= MIN_REMINDER_DAY &&
              value <= MAX_REMINDER_DAY
          )
      )
    );

    return parsed.length ? parsed : fallbackDays;
  }
}
