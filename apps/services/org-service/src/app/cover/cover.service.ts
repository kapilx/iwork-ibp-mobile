import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { CoverRepository } from "./cover.repository";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { SyncCoverTemplateDto } from "./dto/sync-cover-template.dto";

@Injectable()
export class CoverService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly coverRepository: CoverRepository,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  async getMappings(policyTypeId: number, organizationId?: number) {
    try {
      return await this.coverRepository.getMappings(policyTypeId, organizationId);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CoverService",
          method: "getMappings",
          payload: { policyTypeId, organizationId },
          messageData: error,
        }),
      });
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to retrieve cover mappings"
      );
    }
  }

  async syncMappings(dto: SyncCoverTemplateDto, userId: number) {
    try {
      return await this.coverRepository.syncMappings(
        dto.policyTypeId,
        dto.organizationId,
        dto.covers,
        userId
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CoverService",
          method: "syncMappings",
          payload: { policyTypeId: dto.policyTypeId },
          messageData: error,
        }),
      });
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to sync cover mappings"
      );
    }
  }
}
