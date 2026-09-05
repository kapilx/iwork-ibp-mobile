import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { MASTER_DATA } from "../../../../../../libs/service-lib/src/lib/constants";
import {
  mapSearchParams,
  mapSortParams,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import { DashboardRepository } from "./dashboard.repository";
import { CreateAnnouncementDto } from "./dto/dashboard.dto";

@Injectable()
export class DashboardService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly dashboardRepository: DashboardRepository,
    private readonly dataSource: DataSource,
    private readonly masterValidation: MasterValidationService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  async createAnnouncement(
    announcementData: CreateAnnouncementDto,
    entityManager?: EntityManager
  ) {
    try {
      const createAnnouncement = async (manager: EntityManager) => {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "DashboardService",
            method: "createAnnouncement",
            messageData: "method invoked",
          }),
        });
        await this.masterValidation.validateMasterIds(
          announcementData,
          MASTER_DATA
        );
        return await this.dashboardRepository.createAnnouncement(
          announcementData,
          manager
        );
      };
      if (entityManager) {
        return await createAnnouncement(entityManager); // Use the provided transaction
      } else {
        return await this.dataSource.transaction(createAnnouncement); // Start a new transaction
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "DashboardService",
          method: "createAnnouncement",
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create announcement: ${error.message}`
      );
    }
  }

  async updateAnnouncement(
    id: number,
    announcementData: CreateAnnouncementDto,
    entityManager?: EntityManager
  ) {
    try {
      const updateAnnouncement = async (manager: EntityManager) => {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "DashboardService",
            method: "updateAnnouncement",
            messageData: "method invoked",
          }),
        });
        await this.masterValidation.validateMasterIds(
          announcementData,
          MASTER_DATA
        );
        return await this.dashboardRepository.updateAnnouncement(
          id,
          announcementData,
          manager
        );
      };
      if (entityManager) {
        return await updateAnnouncement(entityManager); // Use the provided transaction
      } else {
        return await this.dataSource.transaction(updateAnnouncement); // Start a new transaction
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "DashboardService",
          method: "updateAnnouncement",
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update announcement: ${error.message}`
      );
    }
  }

  async getAnnouncementById(id: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "DashboardService",
          method: "getAnnouncementById",
          payload: { id },
          messageData: "method invoked",
        }),
      });
      const announcement = await this.dashboardRepository.getAnnouncementById(
        id
      );
      if (!announcement) {
        throw new NotFoundException(`Announcement with ID ${id} not found`);
      }
      return announcement;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "DashboardService",
          method: "getAnnouncementById",
          payload: { id },
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to retrieve announcement: ${error.message}`
      );
    }
  }

  async getAnnouncements(
    userId: number,
    page: number,
    limit: number,
    search: string,
    sort: string,
    searchBy: string
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "DashboardService",
          method: "getAnnouncements",
          payload: { userId, page, limit, search, sort, searchBy },
          messageData: "method invoked",
        }),
      });
      const searchParams = mapSearchParams(search);
      const sortParams = mapSortParams(sort);
      const announcements = await this.dashboardRepository.getAnnouncements(
        userId,
        page,
        limit,
        searchParams,
        sortParams,
        searchBy
      );
      return announcements;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "DashboardService",
          method: "getAnnouncements",
          payload: { userId, page, limit, search, sort, searchBy },
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to retrieve announcements: ${error.message}`
      );
    }
  }

  async getTeamCelebrations(userId: number, page: number, limit: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "DashboardService",
          method: "getTeamCelebrations",
          payload: { userId, page, limit },
          messageData: "method invoked",
        }),
      });
      return await this.dashboardRepository.getTeamCelebrations(
        userId,
        page,
        limit
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "DashboardService",
          method: "getTeamCelebrations",
          payload: { userId, page, limit },
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch team celebrations: ${error.message}`
      );
    }
  }

  async deleteAnnouncement(id: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "DashboardService",
          method: "deleteAnnouncement",
          payload: { id },
          messageData: "method invoked",
        }),
      });
      return await this.dashboardRepository.deleteAnnouncement(id);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "DashboardService",
          method: "deleteAnnouncement",
          payload: { id },
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete announcement: ${error.message}`
      );
    }
  }
}
