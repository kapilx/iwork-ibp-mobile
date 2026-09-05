import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Reward } from "../../../../service-lib/src/lib/entities/reward.entity";
import { RewardBusinessMonth } from "../../../../service-lib/src/lib/entities/reward-business-month.entity";
import { RewardDocMap } from "../../../../service-lib/src/lib/entities/reward-doc-map.entity";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { LookUpRepository } from "../look-up/look-up.repository";
import { CreateRewardDto } from "./dto/create-reward.dto";
import { GetAllRewardsDto } from "./dto/get-all-rewards.dto";
import { UpdateRewardDto } from "./dto/update-reward.dto";
import { RewardRepository } from "./reward.repository";
import {
  generateExcel,
  uploadToS3,
} from "../../../../service-lib/src/lib/utils/file-management.utils";

const GENERIC_KEY = "REWARD_CATEGORY_GENERIC";
const FIXED_KEY = "REWARD_TYPE_FIXED";
const month = (d: string) => d.slice(0, 10);
const monthSet = (arr: string[]) => [...new Set(arr.map(month))].sort().join("|");

@Injectable()
export class RewardService {
  constructor(
    private readonly rewardRepo: RewardRepository,
    private readonly lookUpRepo: LookUpRepository,
    private readonly scopeService: ScopeService
  ) {}

  // Owning org of the acting user (null for leadership/super → global scope).
  private async resolveOrgScope(
    userId: number
  ): Promise<{ isLeadership: boolean; organisationId: number | null }> {
    const isLeadership = await this.scopeService.hasLeadershipRole(userId);
    if (isLeadership) return { isLeadership, organisationId: null };
    const employee = await this.scopeService.getEmployeeDetails(userId);
    return { isLeadership, organisationId: employee?.organisationId ?? null };
  }

  private async lookupId(key: string): Promise<number> {
    const rows = await this.lookUpRepo.findByLookUpKey(key);
    if (!rows?.length) throw new NotFoundException(`Lookup ${key} not seeded.`);
    return rows[0].id;
  }

  async list(dto: GetAllRewardsDto, userId: number) {
    const genericLid = await this.lookupId(GENERIC_KEY);
    const { organisationId } = await this.resolveOrgScope(userId);
    const [{ data, count }, kpi] = await Promise.all([
      this.rewardRepo.findAll(dto, organisationId),
      this.rewardRepo.kpis(dto, genericLid, organisationId),
    ]);
    return {
      data,
      count,
      kpisData: {
        totalRewardAmount: kpi.total,
        genericRewardAmount: kpi.generic,
        specificRewardAmount: 0, // future phase (greyed in UI)
      },
    };
  }

  async getOne(id: number): Promise<Reward> {
    const reward = await this.rewardRepo.findOne(id);
    if (!reward) throw new NotFoundException("Reward not found.");
    return reward;
  }

  listByInsurer(insurerId: number) {
    return this.rewardRepo.findByInsurer(insurerId);
  }

  // BR-018: hard block exact dup (insurer + same months + same amount); soft warn on same date of income.
  private async assertNotDuplicate(dto: CreateRewardDto, amount: number, excludeId?: number) {
    const existing = await this.rewardRepo.findByInsurer(dto.insurerId, excludeId);
    const incomingMonths = monthSet(dto.businessMonths);
    for (const r of existing) {
      const sameMonths = monthSet((r.businessMonths || []).map((b: RewardBusinessMonth) => b.businessMonth)) === incomingMonths;
      if (sameMonths && Number(r.rewardAmount) === amount) {
        throw new ConflictException(
          "A reward for this insurer with the same Business Month(s) and amount already exists."
        );
      }
    }
    if (!dto.confirmDuplicate) {
      const sameDay = existing.some((r) => month(r.dateOfIncome) === month(dto.dateOfIncome));
      if (sameDay) {
        throw new ConflictException({
          warning: true,
          message: "A reward for this insurer already has this Date of Income. Confirm to proceed.",
        });
      }
    }
  }

  async create(dto: CreateRewardDto, userId: number): Promise<Reward> {
    const amount = Number(dto.rewardAmount);
    await this.assertNotDuplicate(dto, amount);
    const reward = new Reward();
    reward.rewardCategoryLid = dto.rewardCategoryLid ?? (await this.lookupId(GENERIC_KEY));
    reward.rewardTypeLid = await this.lookupId(FIXED_KEY);
    reward.insurerId = dto.insurerId;
    reward.dateOfIncome = month(dto.dateOfIncome);
    reward.rewardAmount = String(amount);
    reward.remarks = dto.remarks;
    const employee = await this.scopeService.getEmployeeDetails(userId);
    reward.organisationId = employee?.organisationId ?? undefined;
    reward.createdBy = userId;
    reward.updatedBy = userId;
    reward.businessMonths = this.buildMonths(dto.businessMonths);
    reward.docMaps = (dto.documentIds || []).map((docId) => new RewardDocMap(undefined, docId));
    return this.rewardRepo.save(reward);
  }

  async update(id: number, dto: UpdateRewardDto, userId: number): Promise<Reward> {
    const reward = await this.getOne(id);
    const amount = dto.rewardAmount != null ? Number(dto.rewardAmount) : Number(reward.rewardAmount);
    // category immutable (BR-001); rewardCategoryLid in the DTO is ignored.
    await this.assertNotDuplicate(
      {
        insurerId: dto.insurerId ?? reward.insurerId,
        businessMonths: dto.businessMonths ?? (reward.businessMonths || []).map((b: RewardBusinessMonth) => b.businessMonth),
        dateOfIncome: dto.dateOfIncome ?? reward.dateOfIncome,
        confirmDuplicate: dto.confirmDuplicate,
      } as CreateRewardDto,
      amount,
      id
    );
    if (dto.insurerId != null) reward.insurerId = dto.insurerId;
    if (dto.dateOfIncome != null) reward.dateOfIncome = month(dto.dateOfIncome);
    if (dto.rewardAmount != null) reward.rewardAmount = String(amount);
    if (dto.remarks !== undefined) reward.remarks = dto.remarks;
    reward.updatedBy = userId;
    // Detach loaded relations so TypeORM's cascade doesn't re-process them
    // during save. docMaps has a dual-mapped column (doc_id appears as both
    // @Column and @JoinColumn) which causes cascade to write null when the
    // relation entity isn't in the EntityManager's identity map.
    delete (reward as any).docMaps;
    delete (reward as any).businessMonths;
    await this.rewardRepo.save(reward);
    if (dto.businessMonths) {
      await this.rewardRepo.replaceBusinessMonths(id, this.buildMonths(dto.businessMonths));
    }
    if (dto.documentIds !== undefined) {
      await this.rewardRepo.replaceDocMaps(id, dto.documentIds);
    }
    return this.rewardRepo.findOne(id) as Promise<Reward>;
  }

  delete(id: number, userId: number) {
    return this.rewardRepo.softDelete(id, userId);
  }

  async exportExcel(dto: GetAllRewardsDto, userId: number): Promise<string> {
    const { organisationId } = await this.resolveOrgScope(userId);
    const rewards = await this.rewardRepo.findAllForExport(dto, organisationId);

    const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const fmtMonthYear = (d: string | Date | undefined): string => {
      if (!d) return "--";
      if (typeof d === "string") {
        const m = d.match(/^(\d{4})-(\d{2})/);
        if (m) return `${MONTHS_SHORT[parseInt(m[2], 10) - 1]}-${m[1]}`;
      }
      const date = new Date(d);
      return isNaN(date.getTime()) ? "--" : `${MONTHS_SHORT[date.getMonth()]}-${date.getFullYear()}`;
    };
    const fmtDate = (d: string | Date | undefined): string => {
      if (!d) return "--";
      const date = new Date(d);
      return isNaN(date.getTime())
        ? "--"
        : date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    };

    const rows = rewards.map((r, i) => ({
      "Serial Number": i + 1,
      "Insurer": (r.insurer as any)?.insurerName ?? "--",
      "Reward Category": r.rewardCategory?.lookUpValue ?? "--",
      "Business Months": Array.isArray(r.businessMonths) && r.businessMonths.length
        ? r.businessMonths.map((bm: RewardBusinessMonth) => fmtMonthYear(bm.businessMonth)).join(", ")
        : "--",
      "Income Month": fmtMonthYear(r.dateOfIncome),
      "Date Of Income": fmtDate(r.dateOfIncome),
      "Reward Amount": Number(r.rewardAmount) || 0,
      "Remarks": r.remarks ?? "",
    }));

    const buffer = await generateExcel(rows);
    const fileName = `rewards_export_${Date.now()}.xlsx`;
    return uploadToS3(
      buffer,
      fileName,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  }

  private buildMonths(months: string[]): RewardBusinessMonth[] {
    return months.map((m) => {
      const bm = new RewardBusinessMonth();
      const ym = month(m).slice(0, 7); // YYYY-MM
      const [y, mo] = ym.split("-").map(Number);
      const lastDay = new Date(Date.UTC(y, mo, 0)).getUTCDate(); // day 0 of next month
      bm.businessMonth = `${ym}-01`;
      bm.startDate = `${ym}-01`;
      bm.endDate = `${ym}-${String(lastDay).padStart(2, "0")}`;
      return bm;
    });
  }
}
