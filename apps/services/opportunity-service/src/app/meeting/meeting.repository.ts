import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository ,Brackets} from "typeorm";
import {
  DEFAULT_EMPLOYEE_PAGE,
  DEFAULT_EMPLOYEE_PAGE_LIMIT,
  PARTICIPANT_TYPE,
  PARTICIPANT_EMPLOYEE_COMPANY_ID,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { applySearchConditions } from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import {
  meetingSearchObject,
  MEETING_STATUS,
  MEETING_FEEDBACK_SUBMITTED,
} from "../../../../service-lib/src/lib/constants";
import {
  Company,
  CompanyContactMap,
  Contact,
  FileUpload,
  InsureContact,
  LookUp,
  Meeting,
  MeetingChallengesMap,
  MeetingDocumentMap,
  MeetingNextStepsMap,
  MeetingOutcomesMap,
  MeetingParticipantMap,
  Opportunity,
  OpportunityActivityMap,
  TpaContact,
  User,
} from "../../../../service-lib/src/lib/entities";
import {
  CreateMeetingDocumentDto,
  CreateMeetingDto,
} from "./dto/create-meeting.dto";
import { UpdateMeetingDto } from "./dto/update-meeting.dto";
import { CreateMeetingFeedbackDto } from "./dto/create-meeting-feedback.dto";
import { MeetingViewBy } from "./dto/get-meetings.dto";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";

export interface MeetingParticipants {
  tpaParticipants?: { tpaId: number; tpaContactPerson: number[] };
  insurerParticipants?: {
    insurerId: number;
    insurerContactPerson: number[];
  };
  companyParticipants?: {
    companyId: number;
    companyContactPerson: number[];
  };
  employeeParticipants?: { employees: number[] };
}

export interface Participant {
  participantId: number;
  participantCompanyId: number;
  participantRecordType: string;
}

@Injectable()
export class MeetingRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepository: Repository<Opportunity>,
    @InjectRepository(OpportunityActivityMap)
    private readonly opportunityActivityMapRepository: Repository<OpportunityActivityMap>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly entityService: EntityService,
    private readonly traceIdService: TraceIdService,
    private readonly scopeService: ScopeService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.OPPORTUNITY_SERVICE
    );
  }

  // Create a new meeting
  async createMeeting(
    meetingData: Partial<CreateMeetingDto>,
    manager: EntityManager
  ) {
    try {
      // Meeting linking validation
      await this.validateMeetingAssociations(
        meetingData.companyId,
        meetingData.opportunityId,
        meetingData.activityId
      );
      // Validate meeting timings
      await this.validateMeetingTimings(
        meetingData.meetingDate,
        meetingData.startTime,
        meetingData.endTime
      );
      const meeting = manager.create(Meeting, meetingData);
      return await manager.save(Meeting, meeting);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new Error("Error creating meeting: " + error.message);
    }
  }

  // Update an existing meeting
  async updateMeeting(
    id: number,
    updateMeeting: UpdateMeetingDto,
    manager: EntityManager,
    fromOpportunityActivity: boolean
  ) {
    try {
      const meeting = await manager.findOne(Meeting, { where: { id } });
      if (!meeting) {
        throw new NotFoundException(errorMessages.meetingNotFound);
      }
      if (
        meeting.createdBy !== updateMeeting.updatedBy &&
        !fromOpportunityActivity
      ) {
        throw new BadRequestException(
          `You are not Organizer or Owner to update this meeting.`
        );
      }
      // Meeting linking validation
      await this.validateMeetingAssociations(
        updateMeeting.companyId,
        updateMeeting.opportunityId,
        updateMeeting.activityId
      );
      // Validate meeting timings
      await this.validateMeetingTimings(
        updateMeeting.meetingDate,
        updateMeeting.startTime,
        updateMeeting.endTime
      );
      const meetingStatus = await manager.findOne(LookUp, {
        where: { id: meeting.meetingStatusLid },
      });
      if (!meetingStatus) {
        throw new NotFoundException(
          `Meeting status with ID ${meeting.meetingStatusLid} not found`
        );
      }
      if (meetingStatus.lookUpKey !== MEETING_STATUS.SCHEDULED) {
        throw new BadRequestException(errorMessages.meetingUpdateError);
      }
      Object.assign(meeting, updateMeeting);
      if (updateMeeting.meetingStatusLid) {
        const updatedStatus = await manager.findOne(LookUp, {
          where: { id: updateMeeting.meetingStatusLid },
        });
        if (updatedStatus?.lookUpKey === MEETING_STATUS.COMPLETED) {
          meeting.completedAt = meeting.completedAt ?? new Date();
        }
      }
      await manager.save(Meeting, meeting);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new Error("Error updating meeting: " + error.message);
    }
  }

  // Update meeting completion status
  async completeMeeting(
    id: number,
    completeMeetingDto: CreateMeetingFeedbackDto,
    manager: EntityManager
  ) {
    try {
      const meeting = await manager.findOne(Meeting, { where: { id } });
      if (!meeting) {
        throw new NotFoundException(errorMessages.meetingNotFound);
      }
      if (meeting.isFeedbackSubmitted === MEETING_FEEDBACK_SUBMITTED) {
        throw new BadRequestException(
          `Meeting with ID ${id} has already been completed.`
        );
      }
      const status = await manager.findOne(LookUp, {
        where: { lookUpKey: MEETING_STATUS.COMPLETED },
      });
      if (!status) {
        throw new NotFoundException(
          `Meeting status with lookUpKey ${MEETING_STATUS.COMPLETED} not found`
        );
      }
      const {
        meetingRating,
        meetingOutcomes,
        meetingChallenges,
        meetingNextSteps,
      } = completeMeetingDto;
      // Helper function to insert records for a given entity and values
      const insertMeetingRecords = async <T>(
        entity: any,
        values: number[],
        fieldName: string
      ): Promise<void> => {
        if (values && Array.isArray(values) && values.length > 0) {
          const recordsToInsert = values.map((value: number) => ({
            meetingId: id,
            [fieldName]: value,
          }));
          await manager.save(entity, recordsToInsert);
        }
      };
      // Save meeting outcomes
      await insertMeetingRecords(
        MeetingOutcomesMap,
        meetingOutcomes,
        "outcomeId"
      );
      // Save meeting challenges
      await insertMeetingRecords(
        MeetingChallengesMap,
        meetingChallenges,
        "challengeId"
      );
      // Save meeting next steps
      await insertMeetingRecords(
        MeetingNextStepsMap,
        meetingNextSteps,
        "nextStepId"
      );
      await manager.update(Meeting, id, {
        meetingStatusLid: status.id,
        meetingRating: meetingRating,
        isFeedbackSubmitted: MEETING_FEEDBACK_SUBMITTED,
        remarks: completeMeetingDto.remarks,
        updatedBy: completeMeetingDto.updatedBy,
        completedAt: new Date(),
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new Error("Error completing meeting: " + error.message);
    }
  }

  // Save meeting participants
  async saveMeetingParticipants(
    meetingId: number,
    participants: MeetingParticipants,
    manager: EntityManager
  ): Promise<void> {
    try {
      const participantTypeMap: Record<
        string,
        {
          entity: any;
          validate: (
            manager: EntityManager,
            participantCompanyId: number,
            participantId: number
          ) => Promise<void>;
          message: (id: number) => string;
        }
      > = {
        [PARTICIPANT_TYPE.TPA_CONTACT]: {
          entity: TpaContact,
          validate: async (
            manager: EntityManager,
            tpaId: number,
            contactId: number
          ) => {
            const tpaContact = await manager.findOne(TpaContact, {
              where: { id: tpaId, contactId },
            });
            if (!tpaContact) {
              throw new NotFoundException(
                `TPA Contact with tpaId ${tpaId} and contactId ${contactId} not found`
              );
            }
          },
          message: (id: number) => `TPA Contact with ID ${id} not found`,
        },
        [PARTICIPANT_TYPE.INSURER_CONTACT]: {
          entity: InsureContact,
          validate: async (
            manager: EntityManager,
            insurerId: number,
            contactId: number
          ) => {
            const insurerContact = await manager.findOne(InsureContact, {
              where: { insurerId, contactId },
            });
            if (!insurerContact) {
              throw new NotFoundException(
                `Insurer Contact with insurerId ${insurerId} and contactId ${contactId} not found`
              );
            }
          },
          message: (id: number) => `Insurer Contact with ID ${id} not found`,
        },
        [PARTICIPANT_TYPE.COMPANY_CONTACT]: {
          entity: CompanyContactMap,
          validate: async (
            manager: EntityManager,
            companyId: number,
            contactId: number
          ) => {
            const companyContact = await manager.findOne(CompanyContactMap, {
              where: { companyId, contactId },
            });
            if (!companyContact) {
              throw new NotFoundException(
                `Company Contact with companyId ${companyId} and contactId ${contactId} not found`
              );
            }
          },
          message: (id: number) => `Company Contact with ID ${id} not found`,
        },
        [PARTICIPANT_TYPE.EMPLOYEE]: {
          entity: User,
          validate: async (
            manager: EntityManager,
            _companyId: number,
            employeeId: number
          ) => {
            const employee = await manager.findOne(User, {
              where: { userId: employeeId },
            });
            if (!employee) {
              throw new NotFoundException(
                `Employee with user ID ${employeeId} not found`
              );
            }
          },
          message: (id: number) => `Employee with user ID ${id} not found`,
        },
      };

      // Helper to build participant list from payload
      const normalizedParticipants: Participant[] = [];
      if (
        participants.tpaParticipants &&
        Object.keys(participants.tpaParticipants).length > 0
      ) {
        const { tpaId, tpaContactPerson } = participants.tpaParticipants;
        if (
          !tpaId ||
          !Array.isArray(tpaContactPerson) ||
          tpaContactPerson.length === 0
        ) {
          throw new BadRequestException(
            "TPA participants are required and must be valid."
          );
        }
        tpaContactPerson.forEach((id) =>
          normalizedParticipants.push({
            participantId: id,
            participantCompanyId: tpaId,
            participantRecordType: PARTICIPANT_TYPE.TPA_CONTACT,
          })
        );
      }
      if (
        participants.insurerParticipants &&
        Object.keys(participants.insurerParticipants).length > 0
      ) {
        const { insurerId, insurerContactPerson } =
          participants.insurerParticipants;
        if (
          !insurerId ||
          !Array.isArray(insurerContactPerson) ||
          insurerContactPerson.length === 0
        ) {
          throw new BadRequestException(
            "Insurer participants are required and must be valid."
          );
        }
        insurerContactPerson.forEach((id) =>
          normalizedParticipants.push({
            participantId: id,
            participantCompanyId: insurerId,
            participantRecordType: PARTICIPANT_TYPE.INSURER_CONTACT,
          })
        );
      }
      if (
        participants.companyParticipants &&
        Object.keys(participants.companyParticipants).length > 0
      ) {
        const { companyId, companyContactPerson } =
          participants.companyParticipants;
        if (
          !companyId ||
          !Array.isArray(companyContactPerson) ||
          companyContactPerson.length === 0
        ) {
          throw new BadRequestException(
            "Company participants are required and must be valid."
          );
        }
        companyContactPerson.forEach((id) =>
          normalizedParticipants.push({
            participantId: id,
            participantCompanyId: companyId,
            participantRecordType: PARTICIPANT_TYPE.COMPANY_CONTACT,
          })
        );
      }
      if (participants.employeeParticipants) {
        const { employees } = participants.employeeParticipants;
        if (!Array.isArray(employees) || employees.length === 0) {
          throw new BadRequestException(
            "Employee participants are required and must be valid."
          );
        }
        employees.forEach((id) =>
          normalizedParticipants.push({
            participantId: id,
            participantCompanyId: PARTICIPANT_EMPLOYEE_COMPANY_ID,
            participantRecordType: PARTICIPANT_TYPE.EMPLOYEE,
          })
        );
      }
      // Fetch all existing participants for this meeting
      const existingParticipants: MeetingParticipantMap[] = await manager.find(
        MeetingParticipantMap,
        { where: { meetingId } }
      );
      if (
        existingParticipants.length === 0 &&
        normalizedParticipants.length === 0
      ) {
        throw new BadRequestException(
          errorMessages.meetingParticipantsRequired
        );
      }
      // Build a set for quick lookup
      const incomingParticipantsSet = new Set(
        normalizedParticipants.map(
          (p) => `${p.participantId}_${p.participantRecordType}`
        )
      );
      const existingParticipantsSet = new Set(
        existingParticipants.map(
          (p) => `${p.participantId}_${p.participantRecordType}`
        )
      );
      // Remove participants that exist in DB but not in the incoming payload
      const participantsToRemove = existingParticipants.filter(
        (participant) =>
          !incomingParticipantsSet.has(
            `${participant.participantId}_${participant.participantRecordType}`
          )
      );
      if (participantsToRemove.length > 0) {
        await manager.remove(MeetingParticipantMap, participantsToRemove);
      }
      // Add participants that are in the payload but not in the DB
      const participantsToAdd = normalizedParticipants.filter(
        (participant) =>
          !existingParticipantsSet.has(
            `${participant.participantId}_${participant.participantRecordType}`
          )
      );
      for (const participant of participantsToAdd) {
        // Validate participant existence
        const participantType = participant.participantRecordType;
        const typeConfig = participantTypeMap[participantType];
        if (!typeConfig) {
          throw new BadRequestException(
            `Invalid participant type: ${participantType}`
          );
        }
        if (participantType === PARTICIPANT_TYPE.EMPLOYEE) {
          await typeConfig.validate(
            manager,
            PARTICIPANT_EMPLOYEE_COMPANY_ID,
            participant.participantId
          );
        } else {
          await typeConfig.validate(
            manager,
            participant.participantCompanyId,
            participant.participantId
          );
        }
      }
      // New participants to add
      const newParticipants: Partial<MeetingParticipantMap>[] =
        participantsToAdd.map((participant) => ({
          meetingId,
          participantId: participant.participantId,
          participantCompanyId: participant.participantCompanyId,
          participantRecordType: participant.participantRecordType,
        }));

      if (newParticipants.length > 0) {
        await manager.save(MeetingParticipantMap, newParticipants);
      }
      const meetingParticipants = await manager.find(MeetingParticipantMap, {
        where: { meetingId },
      });
      if (!meetingParticipants || meetingParticipants.length === 0) {
        throw new BadRequestException(
          errorMessages.meetingParticipantsRequired
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new Error("Error saving meeting participants: " + error.message);
    }
  }

  // Save meeting documents
  async saveMeetingDocuments(
    meetingId: number,
    documents: CreateMeetingDocumentDto[],
    manager: EntityManager
  ): Promise<void> {
    try {
      // Validate all provided document IDs
      await Promise.all(
        documents.map(async (doc) => {
          if (doc.documentId) {
            const document = await manager.findOne(FileUpload, {
              where: { id: doc.documentId },
            });
            if (!document) {
              throw new NotFoundException(
                errorMessages.documentWithIdNotFound(doc.documentId)
              );
            }
          } else {
            throw new BadRequestException(
              "Document ID is required for each document."
            );
          }
        })
      );
      // Fetch existing meeting documents
      const existingDocuments = await manager.find(MeetingDocumentMap, {
        where: { meetingId },
      });
      const existingDocumentIds = existingDocuments.map((doc) =>
        Number(doc.documentId)
      );
      // Determine new documents to add
      const newDocuments = documents.filter(
        (doc) => doc.documentId && !existingDocumentIds.includes(doc.documentId)
      );
      if (newDocuments.length > 0) {
        const meetingDocuments: Partial<MeetingDocumentMap>[] =
          newDocuments.map((doc) => ({
            meetingId,
            documentId: doc.documentId,
            documentTypeLid: doc.documentTypeLid,
          }));
        await manager.save(MeetingDocumentMap, meetingDocuments);
        const newDocumentIds = newDocuments.map((doc) => doc.documentId);
        await manager
          .createQueryBuilder()
          .update(FileUpload)
          .set({ meetingId })
          .whereInIds(newDocumentIds)
          .execute();
      }
      // Determine documents to remove
      const documentsToRemove = existingDocuments.filter(
        (doc) => !documents.some((d) => d.documentId === doc.documentId)
      );
      if (documentsToRemove.length > 0) {
        await manager.remove(MeetingDocumentMap, documentsToRemove);
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new Error("Error saving meeting documents: " + error.message);
    }
  }

  // Get a meeting by ID
  async getMeetingById(id: number) {
    try {
      const meeting = await this.meetingRepository.findOne({
        where: { id },
        relations: [
          "participants",
          "meetingDocs",
          "meetingDocs.document",
          "company",
          "opportunity",
          "activity",
          "meetingOutcomes",
          "meetingOutcomes.outcome",
          "meetingChallenges",
          "meetingChallenges.challenge",
          "meetingNextSteps",
          "meetingNextSteps.nextStep",
        ],
      });
      if (!meeting) {
        throw new NotFoundException(errorMessages.meetingNotFound);
      }
      const lookUpValues = await this.entityService.getLookupValues([
        meeting.meetingTypeLid,
        meeting.meetingStatusLid,
        meeting.locationTypeLid,
      ]);
      if (!lookUpValues) {
        throw new Error("Failed to fetch lookup values");
      }
      // Map the lookup values to their respective fields
      const meetingType = lookUpValues.find(
        (item) => item.id === meeting.meetingTypeLid
      );
      const meetingStatus = lookUpValues.find(
        (item) => item.id === meeting.meetingStatusLid
      );
      const locationType = lookUpValues.find(
        (item) => item.id === meeting.locationTypeLid
      );
      // Spread the lookup values into the meeting object
      const enrichedMeeting = {
        ...meeting,
        meetingType,
        meetingStatus,
        locationType,
      };
      // Validate and filter the response
      const filteredData = await this.transformMeetingResponse([
        enrichedMeeting,
      ]);
      return filteredData[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error("Error fetching meeting: " + error.message);
    }
  }

  // Delete a meeting by ID
  async deleteMeetingById(id: number) {
    try {
      const meeting = await this.meetingRepository.findOne({ where: { id } });
      if (!meeting) {
        throw new NotFoundException(errorMessages.meetingNotFound);
      }
      await this.meetingRepository.softDelete({ id });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error("Error deleting meeting: " + error.message);
    }
  }

  // Get meetings with pagination, sorting, and searching
  async getMeetings(
    page: number,
    limit: number,
    searchArray: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    sort: { field: string; order: "ASC" | "DESC" }[],
    userId: number,
    searchBy: string,
    companyId?: number,
    opportunityId?: number,
    filterByOpportunity?: boolean,
    viewBy?: MeetingViewBy
  ): Promise<{
    data: any[];
    count: number;
  }> {
    try {
      const qb = this.meetingRepository
        .createQueryBuilder("meeting")
        .leftJoinAndSelect("meeting.company", "company")
        .leftJoinAndSelect("meeting.opportunity", "opportunity")
        .leftJoinAndSelect("opportunity.policyType", "opportunity_policyType")
        .leftJoinAndSelect("meeting.activity", "activity")
        .leftJoinAndSelect("meeting.meetingType", "meetingType")
        .leftJoinAndSelect("meeting.participants", "participant");

      // Resolve the set of user IDs to scope the query based on viewBy
      let scopedUserIds: number[];
      if (viewBy === MeetingViewBy.SELF_ORG) {
        // Full downward hierarchy (recursive)
        const hierarchyUsers = await this.scopeService.getNewEmployeeHierarchyByUserId(userId, false);
        scopedUserIds = Array.from(new Set([userId, ...hierarchyUsers.map(u => u.userId)].map(Number)));
      } else if (viewBy === MeetingViewBy.SELF_TEAM) {
        // Direct reportees only
        const reporteeIds = await this.scopeService.fetchDirectReporteeUserIds(userId);
        scopedUserIds = Array.from(new Set([userId, ...reporteeIds].map(Number)));
      } else {
        // Default: Self only
        scopedUserIds = [userId];
      }

      qb.where(
        new Brackets((whereQb) => {
          whereQb
            .where("meeting.createdBy IN (:...hierarchyUserIds)")
            .orWhere(
              "participant.participantId = :userId AND participant.participantRecordType = :participantType"
            );
        })
      ).setParameters({
        userId,
        hierarchyUserIds: scopedUserIds,
        participantType: PARTICIPANT_TYPE.EMPLOYEE,
      });

      if (Array.isArray(searchArray) && searchArray.length > 0) {
        searchArray.forEach(({ searchBy, searchValue }, idx) => {
          const param = `param_${idx}`;
          let alias = "meeting";
          let column = searchBy;
          if (searchBy.includes(".")) {
            const parts = searchBy.split(".");
            column = parts.pop() as string;
            alias = parts.join("_");
          }
          if (Array.isArray(searchValue)) {
            qb.andWhere(`${alias}.${column} IN (:...${param})`, {
              [param]: searchValue,
            });
          } else {
            qb.andWhere(`${alias}.${column} ILIKE :${param}`, {
              [param]: `%${searchValue}%`,
            });
          }
        });
      }

      if (searchBy) {
        applySearchConditions(qb, searchBy, meetingSearchObject);
      }

      if (filterByOpportunity && opportunityId) {
        qb.andWhere("meeting.opportunity_id = :opportunityId", {
          opportunityId,
        });
      }

      if (opportunityId) {
        qb.addSelect(
          "CASE WHEN meeting.opportunity_id = :orderOpportunityId THEN 0 ELSE 1 END",
          "order_priority"
        );
        qb.orderBy("order_priority", "ASC");
        qb.setParameter("orderOpportunityId", opportunityId);
      } else if (companyId) {
        qb.addSelect(
          "CASE WHEN meeting.company_id = :orderCompanyId THEN 0 ELSE 1 END",
          "order_priority"
        );
        qb.orderBy("order_priority", "ASC");
        qb.setParameter("orderCompanyId", companyId);
      } else {
        const sortParams =
          sort.length > 0 ? sort : [{ field: "createdAt", order: "DESC" }];
        for (const { field, order } of sortParams) {
          let alias = "meeting";
          let column = field;
          if (field.includes(".")) {
            const parts = field.split(".");
            column = parts.pop() as string;
            alias = parts.join("_");
          }
          qb.addOrderBy(`${alias}.${column}`, order, "NULLS LAST");
        }
      }

      qb.skip((page - 1) * limit).take(limit);

      const [data, count] = await qb.getManyAndCount();

      if (!data || data.length === 0) {
        return { data: [], count: 0 };
      }
      // Extract all unique priorityLid values from the data
      const meetingTypeLids = [
        ...new Set(
          data.map((meeting) => meeting.meetingTypeLid).filter(Boolean)
        ),
      ];
      const meetingStatusLids = [
        ...new Set(
          data.map((meeting) => meeting.meetingStatusLid).filter(Boolean)
        ),
      ];
      const locationTypeLids = [
        ...new Set(
          data.map((meeting) => meeting.locationTypeLid).filter(Boolean)
        ),
      ];
      const allLids = [
        ...new Set([
          ...meetingTypeLids,
          ...meetingStatusLids,
          ...locationTypeLids,
        ]),
      ];
      // Fetch lookup values for all LIDs in one call
      const allLookupValues =
        allLids.length > 0
          ? await this.entityService.getLookupValues(allLids)
          : [];
      const meetingTypeLookup = allLookupValues.filter((item) =>
        meetingTypeLids.includes(item.id)
      );
      const meetingStatusLookup = allLookupValues.filter((item) =>
        meetingStatusLids.includes(item.id)
      );
      const locationTypeLookup = allLookupValues.filter((item) =>
        locationTypeLids.includes(item.id)
      );
      return {
        data: await this.transformGetMeetingsResponse(
          data,
          meetingTypeLookup,
          meetingStatusLookup,
          locationTypeLookup
        ),
        count,
      };
    } catch (error) {
      throw new Error(`Failed to fetch get meetings list: ${error.message}`);
    }
  }

  async getMeetingsByOpportunityAndActivity(
    opportunityActivityId: number
  ): Promise<any[]> {
    try {
      // Using direct query to include soft-deleted records and get all meetings without pagination limit
      const data = await this.meetingRepository
        .createQueryBuilder("meeting")
        .leftJoinAndSelect("meeting.company", "company")
        .leftJoinAndSelect("meeting.opportunity", "opportunity")
        .leftJoinAndSelect("opportunity.policyType", "opportunity_policyType")
        .leftJoinAndSelect("meeting.activity", "activity")
        .leftJoinAndSelect("meeting.participants", "participants")
        .leftJoinAndSelect("meeting.meetingDocs", "meetingDocs")
        .leftJoinAndSelect("meetingDocs.document", "meetingDocs_document")
        .where("meeting.activityId = :opportunityActivityId", { opportunityActivityId })
        .orderBy("meeting.id", "DESC")
        .getMany();

      if (!data || data.length === 0) {
        return [];
      }
      // Extract all unique priorityLid values from the data
      const meetingTypeLids = [
        ...new Set(
          data.map((meeting) => meeting.meetingTypeLid).filter(Boolean)
        ),
      ];
      const meetingStatusLids = [
        ...new Set(
          data.map((meeting) => meeting.meetingStatusLid).filter(Boolean)
        ),
      ];
      const locationTypeLids = [
        ...new Set(
          data.map((meeting) => meeting.locationTypeLid).filter(Boolean)
        ),
      ];
      const allLids = [
        ...new Set([
          ...meetingTypeLids,
          ...meetingStatusLids,
          ...locationTypeLids,
        ]),
      ];
      // Fetch lookup values for all LIDs in one call
      const allLookupValues =
        allLids.length > 0
          ? await this.entityService.getLookupValues(allLids)
          : [];
      const meetingTypeLookup = allLookupValues.filter((item) =>
        meetingTypeLids.includes(item.id)
      );
      const meetingStatusLookup = allLookupValues.filter((item) =>
        meetingStatusLids.includes(item.id)
      );
      const locationTypeLookup = allLookupValues.filter((item) =>
        locationTypeLids.includes(item.id)
      );
      return await this.transformGetMeetingsResponse(
        data,
        meetingTypeLookup,
        meetingStatusLookup,
        locationTypeLookup
      );
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch meetings for the given opportunity and activity."
      );
    }
  }

  async transformMeetingResponse(meetings: Meeting[]) {
    try {
      const allEmployeeIds = [
        ...new Set(
          meetings.flatMap(
            (m) =>
              m.participants
                ?.filter(
                  (p) => p.participantRecordType === PARTICIPANT_TYPE.EMPLOYEE
                )
                .map((p) => p.participantId) ?? []
          )
        ),
      ];
      const allContactIds = [
        ...new Set(
          meetings.flatMap(
            (m) =>
              m.participants
                ?.filter((p) =>
                  [PARTICIPANT_TYPE.TPA_CONTACT, PARTICIPANT_TYPE.INSURER_CONTACT, PARTICIPANT_TYPE.COMPANY_CONTACT].includes(p.participantRecordType)
                )
                .map((p) => p.participantId) ?? []
          )
        ),
      ];
      const employeeNameMap = await this.getEmployeeNames(allEmployeeIds);
      const contactNameMap = await this.getContactNames(allContactIds);

      return meetings.map((meeting) => {
        const tpaParticipants = meeting.participants
          ?.filter(
            (p) => p.participantRecordType === PARTICIPANT_TYPE.TPA_CONTACT
          )
          .map((p) => ({ id: p.participantId, name: contactNameMap.get(p.participantId) ?? null }));
        const insurerParticipants = meeting.participants
          ?.filter(
            (p) => p.participantRecordType === PARTICIPANT_TYPE.INSURER_CONTACT
          )
          .map((p) => ({ id: p.participantId, name: contactNameMap.get(p.participantId) ?? null }));
        const companyParticipants = meeting.participants
          ?.filter(
            (p) => p.participantRecordType === PARTICIPANT_TYPE.COMPANY_CONTACT
          )
          .map((p) => ({ id: p.participantId, name: contactNameMap.get(p.participantId) ?? null }));
        const employeeParticipants = meeting.participants
          ?.filter((p) => p.participantRecordType === PARTICIPANT_TYPE.EMPLOYEE)
          .map((p) => ({
            id: p.participantId,
            employeeName: employeeNameMap.get(p.participantId) ?? null,
          }));

        return {
          ...this.omitFields(meeting),
          companyId: undefined,
          company: meeting.company
            ? {
                id: meeting.company.id,
                name: meeting.company.companyName,
                displayName: meeting.company.displayName,
              }
            : null,
          opportunityId: undefined,
          opportunity: meeting.opportunity
            ? {
                id: meeting.opportunity.opportunityId,
                policy: meeting.opportunity.policyType?.lookUpValue,
              }
            : null,
          activityId: undefined,
          activity: meeting.activity
            ? {
                id: meeting.activity.id,
                activityKey: meeting.activity.activityKey,
                activityName: meeting.activity.activityName,
              }
            : null,
          meetingTypeLid: undefined,
          meetingStatusLid: undefined,
          locationTypeLid: undefined,
          meetingDocs: meeting.meetingDocs?.map((doc) => ({
            documentId: doc.documentId,
            documentTypeLid: doc.documentTypeLid,
            fileName: doc.document?.fileKey
              ? doc?.document?.fileKey?.split("/")?.pop()
              : null,
          })),
          meetingOutcomes: meeting.meetingOutcomes?.map((outcome) => ({
            id: outcome.id,
            value: outcome.outcome?.lookUpValue,
          })),
          meetingChallenges: meeting.meetingChallenges?.map((challenge) => ({
            id: challenge.id,
            value: challenge.challenge?.lookUpValue,
          })),
          meetingNextSteps: meeting.meetingNextSteps?.map((nextStep) => ({
            id: nextStep.id,
            value: nextStep.nextStep?.lookUpValue,
          })),
          participants: undefined,
          ...(tpaParticipants && tpaParticipants.length > 0
            ? {
                tpaParticipants: {
                  tpaId: meeting.participants.find(
                    (p) =>
                      p.participantRecordType === PARTICIPANT_TYPE.TPA_CONTACT
                  )?.participantCompanyId,
                  tpaContactPerson: tpaParticipants,
                },
              }
            : {}),
          ...(insurerParticipants && insurerParticipants.length > 0
            ? {
                insurerParticipants: {
                  insurerId: meeting.participants.find(
                    (p) =>
                      p.participantRecordType ===
                      PARTICIPANT_TYPE.INSURER_CONTACT
                  )?.participantCompanyId,
                  insurerContactPerson: insurerParticipants,
                },
              }
            : {}),
          ...(companyParticipants && companyParticipants.length > 0
            ? {
                companyParticipants: {
                  companyId: meeting.participants.find(
                    (p) =>
                      p.participantRecordType ===
                      PARTICIPANT_TYPE.COMPANY_CONTACT
                  )?.participantCompanyId,
                  companyContactPerson: companyParticipants,
                },
              }
            : {}),
          ...(employeeParticipants && employeeParticipants.length > 0
            ? {
                employeeParticipants: {
                  employees: employeeParticipants,
                },
              }
            : {}),
          meetingRating: meeting.meetingRating,
          isFeedbackSubmitted: meeting.isFeedbackSubmitted,
        };
      });
    } catch (error) {
      throw new Error("Failed to transform meeting response.");
    }
  }

  async transformGetMeetingsResponse(
    meetings,
    meetingTypeLookup,
    meetingStatusLookup,
    locationTypeLookup
  ) {
    try {
      const allEmployeeIds = [
        ...new Set(
          meetings.flatMap(
            (m) =>
              m.participants
                ?.filter(
                  (p) => p.participantRecordType === PARTICIPANT_TYPE.EMPLOYEE
                )
                .map((p) => p.participantId) ?? []
          )
        ),
      ];
      const allUserIds = [
        ...new Set([
          ...allEmployeeIds,
          ...meetings.map((m) => m.createdBy).filter(Boolean),
        ] as number[]),
      ];
      const employeeNameMap = await this.getEmployeeNames(allUserIds);

      return meetings.map((meeting) => {
        const tpaParticipants = meeting.participants
          ?.filter(
            (p) => p.participantRecordType === PARTICIPANT_TYPE.TPA_CONTACT
          )
          .map((p) => p.participantId);
        const insurerParticipants = meeting.participants
          ?.filter(
            (p) => p.participantRecordType === PARTICIPANT_TYPE.INSURER_CONTACT
          )
          .map((p) => p.participantId);
        const companyParticipants = meeting.participants
          ?.filter(
            (p) => p.participantRecordType === PARTICIPANT_TYPE.COMPANY_CONTACT
          )
          .map((p) => p.participantId);
        const employeeParticipants = meeting.participants
          ?.filter((p) => p.participantRecordType === PARTICIPANT_TYPE.EMPLOYEE)
          .map((p) => ({
            id: p.participantId,
            employeeName: employeeNameMap.get(p.participantId) ?? null,
          }));

        return {
          ...this.omitFields(meeting),
          createdBy: {
            id: meeting.createdBy ?? null,
            name: meeting.createdBy ? (employeeNameMap.get(meeting.createdBy) ?? null) : null,
          },
          companyId: undefined,
          company: meeting.company
            ? {
                id: meeting.company.id,
                name: meeting.company.companyName,
                displayName: meeting.company.displayName,
              }
            : null,
          opportunityId: undefined,
          opportunity: meeting.opportunity
            ? {
                id: meeting.opportunity.opportunityId,
                policy: meeting.opportunity.policyType?.lookUpValue,
              }
            : null,
          activityId: undefined,
          activity: meeting.activity
            ? {
                id: meeting.activity.id,
                activityKey: meeting.activity.activityKey,
                activityName: meeting.activity.activityName,
              }
            : null,
          meetingTypeLid: undefined,
        meetingType: {
          id: meeting.meetingTypeLid,
          lookUpValue:
            meetingTypeLookup?.find(
              (item) => item.id === meeting.meetingTypeLid
            )?.lookUpValue ?? null,
        },
          meetingStatusLid: undefined,
        meetingStatus: {
          id: meeting.meetingStatusLid,
          lookUpValue:
            meetingStatusLookup?.find(
              (item) => item.id === meeting.meetingStatusLid
            )?.lookUpValue ?? null,
        },
          locationTypeLid: undefined,
          locationType: {
          id: meeting.locationTypeLid,
          lookUpValue:
            locationTypeLookup?.find(
              (item) => item.id === meeting.locationTypeLid
            )?.lookUpValue ?? null,
          },
          meetingDocs: meeting.meetingDocs?.map((doc) => ({
            documentId: doc.documentId,
            documentTypeLid: doc.documentTypeLid,
            fileName: doc.document?.fileKey
              ? doc?.document?.fileKey?.split("/")?.pop()
              : null,
          })),
          meetingOutcomes: meeting.meetingOutcomes?.map((outcome) => ({
            id: outcome.id,
            value: outcome.outcome?.lookUpValue,
          })),
          meetingChallenges: meeting.meetingChallenges?.map((challenge) => ({
            id: challenge.id,
            value: challenge.challenge?.lookUpValue,
          })),
          meetingNextSteps: meeting.meetingNextSteps?.map((nextStep) => ({
            id: nextStep.id,
            value: nextStep.nextStep?.lookUpValue,
          })),
          participants: undefined,
          ...(tpaParticipants && tpaParticipants.length > 0
            ? {
                tpaParticipants: {
                  tpaId: meeting.participants.find(
                    (p) =>
                      p.participantRecordType === PARTICIPANT_TYPE.TPA_CONTACT
                  )?.participantCompanyId,
                  tpaContactPerson: tpaParticipants,
                },
              }
            : {}),
          ...(insurerParticipants && insurerParticipants.length > 0
            ? {
                insurerParticipants: {
                  insurerId: meeting.participants.find(
                    (p) =>
                      p.participantRecordType ===
                      PARTICIPANT_TYPE.INSURER_CONTACT
                  )?.participantCompanyId,
                  insurerContactPerson: insurerParticipants,
                },
              }
            : {}),
          ...(companyParticipants && companyParticipants.length > 0
            ? {
                companyParticipants: {
                  companyId: meeting.participants.find(
                    (p) =>
                      p.participantRecordType ===
                      PARTICIPANT_TYPE.COMPANY_CONTACT
                  )?.participantCompanyId,
                  companyContactPerson: companyParticipants,
                },
              }
            : {}),
          ...(employeeParticipants && employeeParticipants.length > 0
            ? {
                employeeParticipants: {
                  employees: employeeParticipants,
                },
              }
            : {}),
          meetingRating: meeting.meetingRating,
          isFeedbackSubmitted: meeting.isFeedbackSubmitted,
        };
      });
    } catch (error) {
      throw new Error("Failed to transform meeting response.");
    }
  }

  private async getEmployeeNames(
    participantIds: number[]
  ): Promise<Map<number, string>> {
    if (!participantIds || participantIds.length === 0) return new Map();
    const users = await this.userRepository.find({
      where: { userId: In(participantIds) },
      select: ["userId", "firstName", "lastName"],
    });
    return new Map(
      users.map((u) => [
        u.userId,
        `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
      ])
    );
  }

  private async getContactNames(
    contactIds: number[]
  ): Promise<Map<number, string>> {
    if (!contactIds || contactIds.length === 0) return new Map();
    const contacts = await this.contactRepository.find({
      where: { id: In(contactIds) },
      select: ["id", "firstName", "lastName"],
    });
    return new Map(
      contacts.map((c) => [
        c.id,
        `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim(),
      ])
    );
  }

  private omitFields(entity: Record<string, any>) {
    if (!entity) {
      return {};
    }
    const { createdAt, updatedAt, deletedAt, createdBy, updatedBy, ...rest } =
      entity || {};
    return rest;
  }

  // Validate associations for meeting creation or update
  async validateMeetingAssociations(
    companyId: number | undefined | null,
    opportunityId: number | undefined | null,
    activityId: number | undefined | null
  ) {
    try {
      if (companyId) {
        const company = await this.companyRepository.findOne({
          where: { id: companyId },
        });
        if (!company) {
          throw new NotFoundException(errorMessages.companyNotFound);
        }
      }
      if (opportunityId) {
        const opportunity = await this.opportunityRepository.findOne({
          where: { opportunityId },
        });
        if (!opportunity) {
          throw new NotFoundException(errorMessages.opportunityNotFound);
        }
      }
      if (opportunityId && activityId) {
        const activities = await this.opportunityActivityMapRepository.find({
          where: { opportunityId },
        });
        if (!activities) {
          throw new BadRequestException(
            "No activities found for the given opportunity ID"
          );
        }
        const activityExists = activities.some(
          (activity) => activity.id === activityId
        );
        if (!activityExists) {
          throw new BadRequestException(
            `Activity ID ${activityId} not found for the given opportunity ID`
          );
        }
      } else if (!opportunityId && activityId) {
        throw new BadRequestException(
          "Activity ID provided without an associated Opportunity ID"
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof BadRequestException) {
        throw error;
      }
    }
  }

  // Validate meeting timings
  async validateMeetingTimings(
    meetingDate: Date,
    startTime: string,
    endTime: string
  ) {
    try {
      // Combine meetingDate and time strings into Date objects
      const startDateTime = new Date(
        `${meetingDate.toISOString().split("T")[0]}T${startTime}`
      );
      const endDateTime = new Date(
        `${meetingDate.toISOString().split("T")[0]}T${endTime}`
      );

      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        throw new BadRequestException("Invalid start or end time format.");
      }

      if (startDateTime >= endDateTime) {
        const rolledEnd = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000);
        const spanInMinutes =
          (rolledEnd.getTime() - startDateTime.getTime()) / 60000;

        const startHour = Number(startTime.slice(0, 2));
        const crossesMidnight = startHour >= 23 && spanInMinutes <= 60;

        if (!crossesMidnight) {
          throw new BadRequestException(
            "Meeting start time must be before end time."
          );
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
    }
  }
}
