import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { ILike, In, Repository } from "typeorm";
import { CreateLookUpDto } from "./dto/create-look-up.dto";
import { UpdateLookUpDto } from "./dto/update-look-up.dto";
import { LookUpDto } from "./dto/look-up.dto";
import {
  DEFAULT_ACTIVE_STATUS,
  DEFAULT_VALUES,
  ORG_SPECIFIC_LOOKUPS,
} from "../../../../service-lib/src/lib/constants";
import { DEFAULT_ACTIVE_LOOKUP_STATUS, DEFAULT_ASC_SORT_ORDER } from "../../../../../../libs/service-lib/src/lib/constants";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
@Injectable()
export class LookUpRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Retrieves all LookUps.
   */
  async getAllLookUps(
    search?: string,
    sortBy: keyof LookUpDto = "id",
    sortOrder: "ASC" | "DESC" = "ASC",
    page: number = DEFAULT_VALUES.PAGE,
    limit: number = DEFAULT_VALUES.LIMIT
  ): Promise<{ data: LookUpDto[] }> {
    const where: Record<string, any> = {};

    if (search !== undefined && search !== null && search !== "") {
      where.lookUpName = ILike(`%${search}%`);
    }
    where.status = DEFAULT_ACTIVE_STATUS.LOOK_UP; // Default active status

    const result = await this.lookUpRepository.find({
      select: {
        id: true,
        lookUpName: true,
        lookUpKey: true,
        lookUpValueKey: true,
        lookUpValue: true,
        description: true,
      },
      ...(Object.keys(where).length > 0 && { where }),
      order: {
        [sortBy]: sortOrder,
      },
    });

    const offset = (page - 1) * limit;
    return { data: result.slice(offset, offset + limit) };
  }

  /**
   * Creates a new LookUp.
   */
  async createLookUp(lookUp: CreateLookUpDto): Promise<LookUpDto> {
    const newLookUp = {
      ...lookUp,
      createdBy: DEFAULT_VALUES.CREATED_BY,
      updatedBy: DEFAULT_VALUES.UPDATED_BY,
      status: DEFAULT_ACTIVE_STATUS.LOOK_UP, // Default active status
    };
    const recorData = await this.lookUpRepository.save(newLookUp);
    const { createdBy, updatedBy, createdAt, updatedAt, ...filteredData } =
      recorData;
    return filteredData;
  }

  /**
   * Retrieves a single LookUp by ID.
   */
  async getLookUpById(id: number): Promise<{ data: LookUpDto }> {
    const lookUp = await this.lookUpRepository.findOne({
      select: {
        id: true,
        lookUpName: true,
        lookUpKey: true,
        lookUpValueKey: true,
        lookUpValue: true,
        description: true,
        status: true,
      },
      where: { id },
    });
    if (!lookUp) {
      throw new Error(`LookUp with ID ${id} not found`);
    }
    return { data: lookUp };
  }

  /**
   * Updates a LookUp by ID.
   */
  async updateLookUpById(
    id: number,
    lookUp: UpdateLookUpDto
  ): Promise<{ data: LookUpDto }> {
    const existingLookUp = await this.getLookUpById(id);
    if (!existingLookUp) {
      throw new Error(`LookUp with ID ${id} not found`);
    }
    const updatedLookUp = {
      ...lookUp,
      updatedBy: DEFAULT_VALUES.UPDATED_BY,
    };
    await this.lookUpRepository.update(id, updatedLookUp);
    return this.getLookUpById(id);
  }

  /**
   * Deletes a LookUp by ID
   */
  async deleteLookUpById(id: number): Promise<void> {
    const lookUp = await this.getLookUpById(id);
    if (!lookUp) {
      throw new Error(`LookUp with ID ${id} not found`);
    }
    await this.lookUpRepository.delete(id);
  }

  /**
   * fetches the lookup values by lookup name
   */
  async findByLookUpName(
    lookUpName: string,
    organisationId: number,
    sortOrder: "ASC" | "DESC" = DEFAULT_ASC_SORT_ORDER
  ): Promise<{ id: number; lookUpValue: string }[]> {
    let orgIds = [];
    if (ORG_SPECIFIC_LOOKUPS.includes(lookUpName)) {
      orgIds = [0, organisationId];
    } else {
      orgIds = [0];
    }
    const lookUps = await this.lookUpRepository.find({
      where: {
        lookUpName: lookUpName,
        status: DEFAULT_ACTIVE_STATUS.LOOK_UP,
        organisationId: In(orgIds),
      },
      order: { lookUpOrder: sortOrder },
    });
    return lookUps.map((item) => ({
      id: item.id,
      lookUpValue: item.lookUpValue,
      lookUpKey: item.lookUpKey,
      lookUpName: item.lookUpName,
    }));
  }

  /**
   * fetches the lookup values by lookup name
   */
  async findByLookUpKey(
    lookUpKey: string
  ): Promise<
    { id: number; lookUpValue: string; lookUpKey: string; lookUpName: string }[]
  > {
    const lookUps = await this.lookUpRepository.find({
      where: { lookUpKey },
    });
    return lookUps.map((item) => ({
      id: item.id,
      lookUpValue: item.lookUpValue,
      lookUpKey: item.lookUpKey,
      lookUpName: item.lookUpName,
      status: item.status,
    }));
  }

  /**
   * Retrieves distinct lookup names from the lookup_data table.
   */
  async getDistinctLookUpNames(): Promise<string[]> {
    const result = await this.lookUpRepository
      .createQueryBuilder("lookup_data")
      .select("DISTINCT lookup_data.lookup_name", "lookup_name")
      .getRawMany();

    return result.map((row) => row.lookup_name);
  }

  /**
   * Retrieves LookUp records based on a list of lookup names.
   */
  async findByLookupNames(
    lookupNames: string[]
  ): Promise<
    { id: number; lookUpValue: string; lookUpName: string; lookUpKey: string }[]
  > {
    try {
      // Validate lookupNames
      if (!Array.isArray(lookupNames) || lookupNames.length === 0) {
        throw new Error("lookupNames must be a non-empty array");
      }

      const lookUps = await this.lookUpRepository.find({
        where: { lookUpName: In(lookupNames),status: DEFAULT_ACTIVE_LOOKUP_STATUS },
        select: ["id", "lookUpValue", "lookUpName", "lookUpKey", "status"],
        order: { lookUpName: "ASC" },
      });

      return lookUps.map((item) => ({
        id: item.id,
        lookUpValue: item.lookUpValue,
        lookUpName: item.lookUpName,
        lookUpKey: item.lookUpKey,
        status: item.status,
      }));
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to fetch LookUp records"
      );
    }
  }
}
