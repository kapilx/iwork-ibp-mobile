import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Reward } from "../../../../service-lib/src/lib/entities/reward.entity";
import { RewardBusinessMonth } from "../../../../service-lib/src/lib/entities/reward-business-month.entity";
import { RewardDocMap } from "../../../../service-lib/src/lib/entities/reward-doc-map.entity";
import { GetAllRewardsDto } from "./dto/get-all-rewards.dto";
import { ENTITY_NAME } from "../../../../../../libs/service-lib/src/lib/constants";
import { mapSortParams } from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";

@Injectable()
export class RewardRepository {
  constructor(
    @InjectRepository(Reward)
    private readonly rewardRepo: Repository<Reward>,
    @InjectRepository(RewardBusinessMonth)
    private readonly businessMonthRepo: Repository<RewardBusinessMonth>,
    @InjectRepository(RewardDocMap)
    private readonly docMapRepo: Repository<RewardDocMap>
  ) {}

  // Applies the shared filters (category, insurer, period range, search) to a query builder.
  // organisationId scopes to one org; null = leadership/super (global, no org clause).
  private applyFilters(
    qb: any,
    dto: GetAllRewardsDto,
    organisationId?: number | null
  ) {
    qb.where("r.deletedAt IS NULL");
    if (organisationId != null) {
      qb.andWhere("r.organisationId = :org", { org: organisationId });
    }
    if (dto.rewardCategoryLid) {
      qb.andWhere("r.rewardCategoryLid = :cat", { cat: dto.rewardCategoryLid });
    }
    if (dto.insurerId) {
      qb.andWhere("r.insurerId = :ins", { ins: dto.insurerId });
    }
    if (dto.from && dto.to) {
      if (dto.periodType === "INCOME_MONTH") {
        qb.andWhere("r.dateOfIncome BETWEEN :from AND :to", { from: dto.from, to: dto.to });
      } else {
        // BUSINESS_MONTH (default): match rewards with any business month in range.
        qb.andWhere(
          `EXISTS (SELECT 1 FROM reward_business_month bm
                   WHERE bm.reward_id = r.id AND bm.business_month BETWEEN :from AND :to)`,
          { from: dto.from, to: dto.to }
        );
      }
    }
    if (dto.search) {
      qb.andWhere("insurer.name ILIKE :search", { search: `%${dto.search}%` });
    }
    return qb;
  }

  async findAll(
    dto: GetAllRewardsDto,
    organisationId?: number | null
  ): Promise<{ data: Reward[]; count: number }> {
    const qb = this.rewardRepo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.insurer", "insurer")
      .leftJoinAndSelect("r.rewardCategory", "rewardCategory")
      .leftJoinAndSelect("r.rewardType", "rewardType");
    this.applyFilters(qb, dto, organisationId);

    // Was: `const [field, order] = (dto.sort || "...").split(":")` then
    // `qb.orderBy(\`r.${field}\`, ...)` — the raw client-supplied field
    // string was interpolated directly into the ORDER BY clause with no
    // validation at all. mapSortParams() whitelists against
    // ENTITY_SORT_FIELDS.REWARD first, so every field reaching orderBy()
    // here is one of our own static column paths. Also fixes multi-column
    // sort, which the old `.split(":")` truncated to the first field.
    const sortParams = mapSortParams(dto.sort, ENTITY_NAME.REWARD.toUpperCase());
    const effectiveSort =
      sortParams.length > 0
        ? sortParams
        : [{ field: "r.createdAt", order: "DESC" as const }];
    effectiveSort.forEach(({ field, order }, idx) => {
      if (idx === 0) {
        qb.orderBy(field, order);
      } else {
        qb.addOrderBy(field, order);
      }
    });
    qb.skip((dto.page - 1) * dto.limit).take(dto.limit);

    const [rows, count] = await qb.getManyAndCount();
    if (!rows.length) return { data: [], count };

    // Load business months + doc maps for the page (one-to-many; kept off
    // the paginated query). Re-ordered to match `rows`' already-sorted
    // order rather than re-sorting via a second `order` clause.
    const withRelations = await this.rewardRepo.find({
      where: { id: In(rows.map((r) => r.id)) },
      relations: ["businessMonths", "docMaps", "docMaps.document", "insurer", "rewardCategory", "rewardType"],
    });
    const byId = new Map(withRelations.map((r) => [r.id, r]));
    const data = rows.map((r) => byId.get(r.id) ?? r);
    return { data, count };
  }

  // total + per-category sums over the same filter (no pagination).
  async kpis(
    dto: GetAllRewardsDto,
    genericLid: number,
    organisationId?: number | null
  ): Promise<{ total: number; generic: number }> {
    const qb = this.rewardRepo
      .createQueryBuilder("r")
      .leftJoin("r.insurer", "insurer")
      .select("COALESCE(SUM(r.reward_amount), 0)", "total")
      .addSelect(
        "COALESCE(SUM(CASE WHEN r.reward_category_lid = :genericLid THEN r.reward_amount ELSE 0 END), 0)",
        "generic"
      )
      .setParameter("genericLid", genericLid);
    this.applyFilters(qb, dto, organisationId);
    const raw = await qb.getRawOne();
    return { total: Number(raw.total) || 0, generic: Number(raw.generic) || 0 };
  }

  async findAllForExport(
    dto: GetAllRewardsDto,
    organisationId?: number | null
  ): Promise<Reward[]> {
    const qb = this.rewardRepo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.insurer", "insurer")
      .leftJoinAndSelect("r.rewardCategory", "rewardCategory")
      .leftJoinAndSelect("r.businessMonths", "businessMonths");
    this.applyFilters(qb, dto, organisationId);
    qb.orderBy("r.createdAt", "DESC");
    return qb.getMany();
  }

  findOne(id: number): Promise<Reward | null> {
    return this.rewardRepo.findOne({
      where: { id },
      relations: ["businessMonths", "docMaps", "docMaps.document", "insurer", "rewardCategory", "rewardType"],
    });
  }

  // Active (non-deleted) rewards for an insurer; used for duplicate checks and form history.
  findByInsurer(insurerId: number, excludeId?: number): Promise<Reward[]> {
    const qb = this.rewardRepo
      .createQueryBuilder("r")
      .leftJoinAndSelect("r.businessMonths", "bm")
      .leftJoinAndSelect("r.docMaps", "dm")
      .leftJoinAndSelect("dm.document", "doc")
      .where("r.deletedAt IS NULL")
      .andWhere("r.insurerId = :insurerId", { insurerId });
    if (excludeId) qb.andWhere("r.id != :excludeId", { excludeId });
    return qb.getMany();
  }

  async replaceBusinessMonths(rewardId: number, months: RewardBusinessMonth[]): Promise<void> {
    await this.businessMonthRepo.delete({ rewardId });
    if (months.length) {
      months.forEach(bm => { bm.rewardId = rewardId; });
      await this.businessMonthRepo.save(months);
    }
  }

  async replaceDocMaps(rewardId: number, documentIds: number[]): Promise<void> {
    await this.docMapRepo.delete({ rewardId });
    if (documentIds.length) {
      await this.docMapRepo.insert(
        documentIds.map(docId => ({ rewardId, documentId: docId }))
      );
    }
  }

  save(reward: Reward): Promise<Reward> {
    return this.rewardRepo.save(reward);
  }

  async softDelete(id: number, userId: number): Promise<void> {
    await this.rewardRepo.update(id, { updatedBy: userId });
    await this.rewardRepo.softDelete(id);
  }
}
