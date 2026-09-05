import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import {
  LOOK_UP_DATA,
  MASTER_DATA,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import {
  mapSearchParams,
  mapSortParams,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { MeetingViewBy } from "./dto/get-meetings.dto";
import { LookUpService } from "../../../../org-service/src/app/look-up/look-up.service";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import { CreateMeetingDto } from "./dto/create-meeting.dto";
import { UpdateMeetingDto } from "./dto/update-meeting.dto";
import { MeetingRepository } from "./meeting.repository";
import { CreateMeetingFeedbackDto } from "./dto/create-meeting-feedback.dto";
import { MEETING_STATUS } from "../../../../../services/service-lib/src/lib/constants";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Injectable()
export class MeetingService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly dataSource: DataSource,
    private readonly lookUpValidation: LookUpValidationService,
    private readonly lookUpService: LookUpService,
    private readonly masterValidation: MasterValidationService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.OPPORTUNITY_SERVICE
    );
  }

  // Create a new meeting
  async createMeeting(
    meetingData: CreateMeetingDto,
    entityManager?: EntityManager
  ) {
    try {
      const createMeeting = async (manager: EntityManager) => {
        await this.lookUpValidation.validateDynamicLookupValues(
          meetingData,
          LOOK_UP_DATA
        );
        await this.masterValidation.validateMasterIds(meetingData, MASTER_DATA);
        const {
          tpaParticipants,
          insurerParticipants,
          companyParticipants,
          employeeParticipants,
          documents,
          ...meetingDetails
        } = meetingData;
        // DEFAULT_MEETING_STATUS
        const meetingStatus = await this.lookUpService.getLookUpsByKey(
          MEETING_STATUS.SCHEDULED
        );
        meetingDetails.meetingStatusLid =
          meetingDetails.meetingStatusLid || meetingStatus[0].id;
        const meeting = await this.meetingRepository.createMeeting(
          meetingDetails,
          manager
        );
        // Handle participants if any are present
        if (
          tpaParticipants ||
          insurerParticipants ||
          companyParticipants ||
          employeeParticipants
        ) {
          await this.meetingRepository.saveMeetingParticipants(
            meeting.id,
            {
              tpaParticipants,
              insurerParticipants,
              companyParticipants,
              employeeParticipants,
            },
            manager
          );
        } else {
          throw new BadRequestException(
            errorMessages.meetingParticipantsRequired
          );
        }
        if (documents && documents.length > 0) {
          await this.meetingRepository.saveMeetingDocuments(
            meeting.id,
            documents,
            manager
          );
        }
        return { id: meeting.id };
      };
      if (entityManager) {
        return await createMeeting(entityManager); // Use the provided transaction
      } else {
        return await this.dataSource.transaction(createMeeting); // Start a new transaction
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  // Get meetings with pagination, search, and sorting
  async getMeetings(
    page: number,
    limit: number,
    search: string,
    sort: string,
    userId: number,
    searchBy: string,
    companyId?: number,
    opportunityId?: number,
    filterByOpportunity?: boolean,
    viewBy?: MeetingViewBy
  ) {
    try {
      const searchParams = mapSearchParams(search);
      const sortParams = mapSortParams(sort);
      const meetings = await this.meetingRepository.getMeetings(
        page,
        limit,
        searchParams,
        sortParams,
        userId,
        searchBy,
        companyId,
        opportunityId,
        filterByOpportunity,
        viewBy
      );
      return meetings;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error; // Re-throw NotFoundException to be handled by the controller
      }
      throw new Error(errorMessages.meetingListRetrievalFailed);
    }
  }

  // Get a meeting by ID
  async getMeetingById(id: number) {
    try {
      const meeting = await this.meetingRepository.getMeetingById(id);
      if (!meeting) {
        throw new NotFoundException(errorMessages.meetingNotFound);
      }
      return meeting;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  // Update a meeting by ID
  async updateMeeting(
    id: number,
    updateMeetingData: UpdateMeetingDto,
    entityManager?: EntityManager,
    fromOpportunityActivity?: boolean = false
  ) {
    try {
      const updateMeeting = async (manager: EntityManager) => {
        await this.lookUpValidation.validateDynamicLookupValues(
          updateMeetingData,
          LOOK_UP_DATA
        );
        await this.masterValidation.validateMasterIds(
          updateMeetingData,
          MASTER_DATA
        );
        const {
          tpaParticipants,
          insurerParticipants,
          companyParticipants,
          employeeParticipants,
          documents,
          ...meetingDetails
        } = updateMeetingData;
        await this.meetingRepository.updateMeeting(
          id,
          meetingDetails,
          manager,
          fromOpportunityActivity
        );
        if (
          tpaParticipants ||
          insurerParticipants ||
          companyParticipants ||
          employeeParticipants
        ) {
          await this.meetingRepository.saveMeetingParticipants(
            id,
            {
              tpaParticipants,
              insurerParticipants,
              companyParticipants,
              employeeParticipants,
            },
            manager
          );
        }
        if (documents) {
          await this.meetingRepository.saveMeetingDocuments(
            id,
            documents,
            manager
          );
        }
        return { id };
      };
      if (entityManager) {
        return await updateMeeting(entityManager); // Use the provided transaction
      } else {
        return await this.dataSource.transaction(updateMeeting); // Start a new transaction
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  // Complete a meeting by ID
  async completeMeeting(
    id: number,
    completeMeetingDto: CreateMeetingFeedbackDto,
    entityManager?: EntityManager
  ) {
    try {
      const complete = async (manager: EntityManager) => {
        await this.lookUpValidation.validateDynamicLookupValues(
          completeMeetingDto,
          LOOK_UP_DATA
        );
        await this.masterValidation.validateMasterIds(
          completeMeetingDto,
          MASTER_DATA
        );
        await this.meetingRepository.completeMeeting(
          id,
          completeMeetingDto,
          manager
        );

        return { id };
      };
      if (entityManager) {
        return await complete(entityManager); // Use the provided transaction
      } else {
        return await this.dataSource.transaction(complete); // Start a new transaction
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(error.message);
    }
  }

  // Delete a meeting by ID
  async deleteMeetingById(id: number): Promise<void> {
    try {
      await this.meetingRepository.deleteMeetingById(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async getMeetingsByOpportunityAndActivity(opportunityActivityId: number) {
    try {
      return await this.meetingRepository.getMeetingsByOpportunityAndActivity(
        opportunityActivityId
      );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }
}
