import { Test, TestingModule } from "@nestjs/testing";
import { Repository, EntityManager } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { MeetingRepository } from "./meeting.repository";
import {
  Meeting,
  Company,
  CompanyContactMap,
  Opportunity,
  OpportunityActivityMap,
  MeetingDocumentMap,
  MeetingParticipantMap,
  FileUpload,
  TpaContact,
  InsureContact,
  BrokerContact,
  Employee,
} from "../../../../service-lib/src/lib/entities";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import {
  CreateMeetingDto,
  CreateMeetingDocumentDto,
  CreateMeetingParticipantDto,
} from "./dto/create-meeting.dto";
import { UpdateMeetingDto } from "./dto/update-meeting.dto";
import { PARTICIPANT_TYPE } from "../../../../../../libs/service-lib/src/lib/constants";

describe("MeetingRepository", () => {
  let meetingRepository: MeetingRepository;
  let meetingRepo: jest.Mocked<Repository<Meeting>>;
  let companyRepo: jest.Mocked<Repository<Company>>;
  let companyContactMapRepo: jest.Mocked<Repository<CompanyContactMap>>;
  let opportunityRepo: jest.Mocked<Repository<Opportunity>>;
  let opportunityActivityMapRepo: jest.Mocked<
    Repository<OpportunityActivityMap>
  >;
  let entityService: jest.Mocked<EntityService>;
  let entityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingRepository,
        {
          provide: getRepositoryToken(Meeting),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
            find: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Company),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(CompanyContactMap),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Opportunity),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(OpportunityActivityMap),
          useValue: { find: jest.fn() },
        },
        {
          provide: EntityService,
          useValue: { fetchEntityList: jest.fn(), getLookupValues: jest.fn() },
        },
      ],
    }).compile();

    meetingRepository = module.get(MeetingRepository);
    meetingRepo = module.get(getRepositoryToken(Meeting));
    companyRepo = module.get(getRepositoryToken(Company));
    companyContactMapRepo = module.get(getRepositoryToken(CompanyContactMap));
    opportunityRepo = module.get(getRepositoryToken(Opportunity));
    opportunityActivityMapRepo = module.get(
      getRepositoryToken(OpportunityActivityMap)
    );
    entityService = module.get(EntityService);

    entityManager = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createMeeting", () => {
    it("should create a meeting successfully", async () => {
      jest
        .spyOn(meetingRepository, "validateMeetingAssociations")
        .mockResolvedValue(undefined);
      entityManager.create.mockReturnValue({ meetingName: "test" });
      entityManager.save.mockResolvedValue({ id: 1, meetingName: "test" });

      const result = await meetingRepository.createMeeting(
        { meetingName: "test" },
        entityManager
      );

      expect(meetingRepository.validateMeetingAssociations).toHaveBeenCalled();
      expect(entityManager.create).toHaveBeenCalledWith(Meeting, {
        meetingName: "test",
      });
      expect(entityManager.save).toHaveBeenCalledWith(Meeting, {
        meetingName: "test",
      });
      expect(result).toEqual({ id: 1, meetingName: "test" });
    });

    it("should throw NotFoundException from validateMeetingAssociations", async () => {
      jest
        .spyOn(meetingRepository, "validateMeetingAssociations")
        .mockRejectedValue(new NotFoundException("not found"));
      await expect(
        meetingRepository.createMeeting({}, entityManager)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException from validateMeetingAssociations", async () => {
      jest
        .spyOn(meetingRepository, "validateMeetingAssociations")
        .mockRejectedValue(new BadRequestException("bad"));
      await expect(
        meetingRepository.createMeeting({}, entityManager)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw generic error", async () => {
      jest
        .spyOn(meetingRepository, "validateMeetingAssociations")
        .mockResolvedValue(undefined);
      entityManager.create.mockImplementation(() => {
        throw new Error("fail");
      });
      await expect(
        meetingRepository.createMeeting({}, entityManager)
      ).rejects.toThrow("Error creating meeting: fail");
    });
  });

  describe("createMeetingParticipants", () => {
    it("should create meeting participants successfully", async () => {
      entityManager.findOne.mockResolvedValue({ id: 1 });
      entityManager.save.mockResolvedValue(undefined);

      const participants: CreateMeetingParticipantDto[] = [
        { participantId: 1, participantRecordType: PARTICIPANT_TYPE.EMPLOYEE },
      ];

      await expect(
        meetingRepository.createMeetingParticipants(
          1,
          participants,
          entityManager
        )
      ).resolves.toBeUndefined();
      expect(entityManager.save).toHaveBeenCalled();
    });

    it("should throw NotFoundException if participant not found", async () => {
      entityManager.findOne.mockResolvedValue(undefined);
      const participants: CreateMeetingParticipantDto[] = [
        { participantId: 99, participantRecordType: PARTICIPANT_TYPE.EMPLOYEE },
      ];
      await expect(
        meetingRepository.createMeetingParticipants(
          1,
          participants,
          entityManager
        )
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException for invalid participant type", async () => {
      const participants: CreateMeetingParticipantDto[] = [
        { participantId: 1, participantRecordType: "INVALID_TYPE" as any },
      ];
      await expect(
        meetingRepository.createMeetingParticipants(
          1,
          participants,
          entityManager
        )
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw generic error", async () => {
      entityManager.findOne.mockRejectedValue(new Error("fail"));
      const participants: CreateMeetingParticipantDto[] = [
        { participantId: 1, participantRecordType: PARTICIPANT_TYPE.EMPLOYEE },
      ];
      await expect(
        meetingRepository.createMeetingParticipants(
          1,
          participants,
          entityManager
        )
      ).rejects.toThrow("Error creating meeting participants: fail");
    });
  });

  describe("createMeetingDocuments", () => {
    it("should create meeting documents successfully", async () => {
      entityManager.findOne.mockResolvedValue({ id: 1 });
      entityManager.save.mockResolvedValue(undefined);

      const docs: CreateMeetingDocumentDto[] = [{ documentId: 1 }];

      await expect(
        meetingRepository.createMeetingDocuments(1, docs, entityManager)
      ).resolves.toBeUndefined();
      expect(entityManager.save).toHaveBeenCalled();
    });

    it("should throw NotFoundException if document not found", async () => {
      entityManager.findOne.mockResolvedValue(undefined);
      const docs: CreateMeetingDocumentDto[] = [{ documentId: 99 }];
      await expect(
        meetingRepository.createMeetingDocuments(1, docs, entityManager)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw generic error", async () => {
      entityManager.findOne.mockRejectedValue(new Error("fail"));
      const docs: CreateMeetingDocumentDto[] = [{ documentId: 1 }];
      await expect(
        meetingRepository.createMeetingDocuments(1, docs, entityManager)
      ).rejects.toThrow("Error creating meeting document: fail");
    });
  });

  describe("updateMeeting", () => {
    it("should update meeting successfully", async () => {
      entityManager.findOne.mockResolvedValue({ id: 1 });
      jest
        .spyOn(meetingRepository, "validateMeetingAssociations")
        .mockResolvedValue(undefined);
      entityManager.update.mockResolvedValue(undefined);

      await expect(
        meetingRepository.updateMeeting(
          1,
          { meetingName: "updated" },
          entityManager
        )
      ).resolves.toBeUndefined();
      expect(entityManager.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException if meeting not found", async () => {
      entityManager.findOne.mockResolvedValue(undefined);
      await expect(
        meetingRepository.updateMeeting(
          1,
          { meetingName: "updated" },
          entityManager
        )
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw error on update failure", async () => {
      entityManager.findOne.mockResolvedValue({ id: 1 });
      jest
        .spyOn(meetingRepository, "validateMeetingAssociations")
        .mockResolvedValue(undefined);
      entityManager.update.mockRejectedValue(new Error("fail"));
      await expect(
        meetingRepository.updateMeeting(
          1,
          { meetingName: "updated" },
          entityManager
        )
      ).rejects.toThrow("Error updating meeting: fail");
    });
  });

  describe("updateMeetingParticipants", () => {
    it("should add and remove participants as needed", async () => {
      entityManager.find.mockResolvedValue([
        { participantId: 1, participantRecordType: PARTICIPANT_TYPE.EMPLOYEE },
      ]);
      jest
        .spyOn(meetingRepository, "createMeetingParticipants")
        .mockResolvedValue(undefined);
      entityManager.remove.mockResolvedValue(undefined);

      const participants: CreateMeetingParticipantDto[] = [
        { participantId: 2, participantRecordType: PARTICIPANT_TYPE.EMPLOYEE },
      ];
      await expect(
        meetingRepository.updateMeetingParticipants(
          1,
          participants,
          entityManager
        )
      ).resolves.toBeUndefined();
      expect(meetingRepository.createMeetingParticipants).toHaveBeenCalled();
      expect(entityManager.remove).toHaveBeenCalled();
    });

    it("should only add new participants", async () => {
      entityManager.find.mockResolvedValue([]);
      jest
        .spyOn(meetingRepository, "createMeetingParticipants")
        .mockResolvedValue(undefined);

      const participants: CreateMeetingParticipantDto[] = [
        { participantId: 2, participantRecordType: PARTICIPANT_TYPE.EMPLOYEE },
      ];
      await expect(
        meetingRepository.updateMeetingParticipants(
          1,
          participants,
          entityManager
        )
      ).resolves.toBeUndefined();
      expect(meetingRepository.createMeetingParticipants).toHaveBeenCalled();
    });

    it("should only remove participants", async () => {
      entityManager.find.mockResolvedValue([
        { participantId: 1, participantRecordType: PARTICIPANT_TYPE.EMPLOYEE },
      ]);
      jest
        .spyOn(meetingRepository, "createMeetingParticipants")
        .mockResolvedValue(undefined);
      entityManager.remove.mockResolvedValue(undefined);

      const participants: CreateMeetingParticipantDto[] = [];
      await expect(
        meetingRepository.updateMeetingParticipants(
          1,
          participants,
          entityManager
        )
      ).resolves.toBeUndefined();
      expect(entityManager.remove).toHaveBeenCalled();
    });

    it("should throw error on failure", async () => {
      entityManager.find.mockRejectedValue(new Error("fail"));
      await expect(
        meetingRepository.updateMeetingParticipants(1, [], entityManager)
      ).rejects.toThrow("Error updating meeting participants: fail");
    });
  });

  describe("updateMeetingDocuments", () => {
    it("should add and remove documents as needed", async () => {
      entityManager.find.mockResolvedValue([{ documentId: 1 }]);
      jest
        .spyOn(meetingRepository, "createMeetingDocuments")
        .mockResolvedValue(undefined);
      entityManager.remove.mockResolvedValue(undefined);

      const docs: CreateMeetingDocumentDto[] = [{ documentId: 2 }];
      await expect(
        meetingRepository.updateMeetingDocuments(1, docs, entityManager)
      ).resolves.toBeUndefined();
      expect(meetingRepository.createMeetingDocuments).toHaveBeenCalled();
      expect(entityManager.remove).toHaveBeenCalled();
    });

    it("should only add new documents", async () => {
      entityManager.find.mockResolvedValue([]);
      jest
        .spyOn(meetingRepository, "createMeetingDocuments")
        .mockResolvedValue(undefined);

      const docs: CreateMeetingDocumentDto[] = [{ documentId: 2 }];
      await expect(
        meetingRepository.updateMeetingDocuments(1, docs, entityManager)
      ).resolves.toBeUndefined();
      expect(meetingRepository.createMeetingDocuments).toHaveBeenCalled();
    });

    it("should only remove documents", async () => {
      entityManager.find.mockResolvedValue([{ documentId: 1 }]);
      jest
        .spyOn(meetingRepository, "createMeetingDocuments")
        .mockResolvedValue(undefined);
      entityManager.remove.mockResolvedValue(undefined);

      const docs: CreateMeetingDocumentDto[] = [];
      await expect(
        meetingRepository.updateMeetingDocuments(1, docs, entityManager)
      ).resolves.toBeUndefined();
      expect(entityManager.remove).toHaveBeenCalled();
    });

    it("should throw error on failure", async () => {
      entityManager.find.mockRejectedValue(new Error("fail"));
      await expect(
        meetingRepository.updateMeetingDocuments(1, [], entityManager)
      ).rejects.toThrow("Error updating meeting document: fail");
    });
  });

  describe("getMeetingById", () => {
    it("should return transformed meeting", async () => {
      meetingRepo.findOne.mockResolvedValue({
        id: 1,
        meetingTypeLid: 2,
        meetingSubTypeLid: 3,
        participants: [],
        meetingDocs: [],
        company: null,
        contact: null,
        opportunity: null,
        activity: null,
      });
      entityService.getLookupValues.mockResolvedValue([
        { id: 2, lookUpValue: "type" },
        { id: 3, lookUpValue: "subtype" },
      ]);
      jest
        .spyOn(meetingRepository, "transformMeetingResponse")
        .mockResolvedValue([{ id: 1 }]);
      const result = await meetingRepository.getMeetingById(1);
      expect(result).toEqual({ id: 1 });
    });

    it("should throw NotFoundException if meeting not found", async () => {
      meetingRepo.findOne.mockResolvedValue(undefined);
      await expect(meetingRepository.getMeetingById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw error if lookup values not found", async () => {
      meetingRepo.findOne.mockResolvedValue({
        id: 1,
        meetingTypeLid: 2,
        meetingSubTypeLid: 3,
      });
      entityService.getLookupValues.mockResolvedValue(undefined);
      await expect(meetingRepository.getMeetingById(1)).rejects.toThrow(
        "Failed to fetch lookup values"
      );
    });

    it("should throw error on findOne failure", async () => {
      meetingRepo.findOne.mockRejectedValue(new Error("fail"));
      await expect(meetingRepository.getMeetingById(1)).rejects.toThrow(
        "Error fetching meeting: fail"
      );
    });
  });

  describe("deleteMeetingById", () => {
    it("should delete meeting if found", async () => {
      meetingRepo.findOne.mockResolvedValue({ id: 1 });
      meetingRepo.softDelete.mockResolvedValue(undefined);

      await expect(
        meetingRepository.deleteMeetingById(1)
      ).resolves.toBeUndefined();
      expect(meetingRepo.softDelete).toHaveBeenCalledWith({ id: 1 });
    });

    it("should throw NotFoundException if meeting not found", async () => {
      meetingRepo.findOne.mockResolvedValue(undefined);
      await expect(meetingRepository.deleteMeetingById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw error on softDelete failure", async () => {
      meetingRepo.findOne.mockResolvedValue({ id: 1 });
      meetingRepo.softDelete.mockRejectedValue(new Error("fail"));
      await expect(meetingRepository.deleteMeetingById(1)).rejects.toThrow(
        "Error deleting meeting: fail"
      );
    });
  });

  describe("getMeetings", () => {
    it("should return meetings with pagination", async () => {
      entityService.fetchEntityList.mockResolvedValue({
        data: [{ id: 1, meetingTypeLid: 2, meetingSubTypeLid: 3 }],
        count: 1,
      });
      entityService.getLookupValues.mockResolvedValue([
        { id: 2, lookUpValue: "type" },
        { id: 3, lookUpValue: "subtype" },
      ]);
      jest
        .spyOn(meetingRepository, "transformGetMeetingsResponse")
        .mockResolvedValue([{ id: 1 }]);

      const result = await meetingRepository.getMeetings(
        1,
        10,
        [],
        [],
        1,
        "",
        undefined,
        undefined
      );
      expect(result).toEqual({ data: [{ id: 1 }], count: 1 });
    });

    it("should return empty data if no meetings", async () => {
      entityService.fetchEntityList.mockResolvedValue({ data: [], count: 0 });
      const result = await meetingRepository.getMeetings(
        1,
        10,
        [],
        [],
        1,
        "",
        undefined,
        undefined
      );
      expect(result).toEqual({ data: [], count: 0 });
    });

    it("should throw error on fetchEntityList failure", async () => {
      entityService.fetchEntityList.mockRejectedValue(new Error("fail"));
      await expect(
        meetingRepository.getMeetings(1, 10, [], [], 1, "", undefined, undefined)
      ).rejects.toThrow("Failed to fetch get meetings list");
    });
  });

  describe("getMeetingsByOpportunityAndActivity", () => {
    it("should return transformed meetings", async () => {
      meetingRepo.find.mockResolvedValue([
        {
          id: 1,
          meetingDate: new Date(),
          startTime: "10:00",
          endTime: "11:00",
          description: "desc",
          location: "loc",
          minOfMeeting: "min",
          company: { id: 1, companyName: "c" },
          meetingType: { id: 2, lookUpValue: "type" },
          participants: [{ participant: { userId: 3, firstName: "John" } }],
        },
      ]);
      const result =
        await meetingRepository.getMeetingsByOpportunityAndActivity(1, 2);
      expect(result[0].id).toBe(1);
      expect(result[0].company.name).toBe("c");
      expect(result[0].meetingType.lookUpValue).toBe("type");
      expect(result[0].participants[0].name).toBe("John");
    });

    it("should throw InternalServerErrorException on failure", async () => {
      meetingRepo.find.mockRejectedValue(new Error("fail"));
      await expect(
        meetingRepository.getMeetingsByOpportunityAndActivity(1, 2)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("transformMeetingResponse", () => {
    it("should transform meetings", async () => {
      const meetings = [
        {
          id: 1,
          meetingName: "meeting",
          meetingDocs: [{ documentId: 2 }],
          company: { id: 1, companyName: "c", displayName: "d" },
          contact: { id: 2, displayName: "contact" },
          opportunity: { opportunityId: 1, policyType: { lookUpValue: "p" } },
          activity: { id: 1, activityName: "a" },
          participants: [
            {
              participantId: 3,
              participantRecordType: PARTICIPANT_TYPE.EMPLOYEE,
            },
          ],
        },
      ];
      const result = await meetingRepository.transformMeetingResponse(
        meetings as any
      );
      expect(result[0].id).toBe(1);
      expect(result[0].company.name).toBe("c");
      expect(result[0].participants[0].participantRecordType).toBe(
        PARTICIPANT_TYPE.EMPLOYEE
      );
    });

    it("should throw error on failure", async () => {
      await expect(
        meetingRepository.transformMeetingResponse(undefined as any)
      ).rejects.toThrow("Failed to transform meeting response.");
    });
  });

  describe("transformGetMeetingsResponse", () => {
    it("should transform meetings", async () => {
      const meetings = [
        {
          id: 1,
          meetingName: "meeting",
          meetingTypeLid: 2,
          meetingSubTypeLid: 3,
          company: { id: 1, companyName: "c", displayName: "d" },
          contact: { id: 2, displayName: "contact" },
          opportunity: { opportunityId: 1, policyType: { lookUpValue: "p" } },
          activity: { id: 1, activityName: "a" },
        },
      ];
      const meetingTypeLookup = [{ id: 2, lookUpValue: "type" }];
      const meetingSubTypeLookup = [{ id: 3, lookUpValue: "subtype" }];
      const result = await meetingRepository.transformGetMeetingsResponse(
        meetings as any,
        meetingTypeLookup,
        meetingSubTypeLookup
      );
      expect(result[0].id).toBe(1);
      expect(result[0].meetingType).toBe("type");
      expect(result[0].meetingSubType).toBe("subtype");
    });

    it("should throw error on failure", async () => {
      await expect(
        meetingRepository.transformGetMeetingsResponse(undefined as any, [], [])
      ).rejects.toThrow("Failed to transform get meetings response.");
    });
  });

  describe("validateMeetingAssociations", () => {
    it("should validate company, contact, opportunity, and activity", async () => {
      companyRepo.findOne.mockResolvedValue({ id: 1 }); // company
      companyContactMapRepo.findOne.mockResolvedValue({
        contactId: 2,
        companyId: 1,
      }); // contact
      opportunityRepo.findOne.mockResolvedValue({ opportunityId: 3 }); // opportunity
      opportunityActivityMapRepo.find.mockResolvedValue([{ id: 4 }]); // activities

      await expect(
        meetingRepository.validateMeetingAssociations(1, 2, 3, 4)
      ).resolves.toBeUndefined();
    });

    it("should throw NotFoundException if company not found", async () => {
      companyRepo.findOne.mockResolvedValue(undefined);
      await expect(
        meetingRepository.validateMeetingAssociations(
          1,
          undefined,
          undefined,
          undefined
        )
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if contact not found for company", async () => {
      companyRepo.findOne.mockResolvedValue({ id: 1 });
      companyContactMapRepo.findOne.mockResolvedValue(undefined);
      await expect(
        meetingRepository.validateMeetingAssociations(
          1,
          2,
          undefined,
          undefined
        )
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if contactId provided without companyId", async () => {
      await expect(
        meetingRepository.validateMeetingAssociations(
          undefined,
          2,
          undefined,
          undefined
        )
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw NotFoundException if opportunity not found", async () => {
      companyRepo.findOne.mockResolvedValue({ id: 1 });
      companyContactMapRepo.findOne.mockResolvedValue({
        contactId: 2,
        companyId: 1,
      });
      opportunityRepo.findOne.mockResolvedValue(undefined);
      await expect(
        meetingRepository.validateMeetingAssociations(1, 2, 3, undefined)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if no activities for opportunity", async () => {
      companyRepo.findOne.mockResolvedValue({ id: 1 });
      companyContactMapRepo.findOne.mockResolvedValue({
        contactId: 2,
        companyId: 1,
      });
      opportunityRepo.findOne.mockResolvedValue({ opportunityId: 3 });
      opportunityActivityMapRepo.find.mockResolvedValue([]);
      await expect(
        meetingRepository.validateMeetingAssociations(1, 2, 3, 4)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if activity not found for opportunity", async () => {
      companyRepo.findOne.mockResolvedValue({ id: 1 });
      companyContactMapRepo.findOne.mockResolvedValue({
        contactId: 2,
        companyId: 1,
      });
      opportunityRepo.findOne.mockResolvedValue({ opportunityId: 3 });
      opportunityActivityMapRepo.find.mockResolvedValue([{ id: 5 }]);
      await expect(
        meetingRepository.validateMeetingAssociations(1, 2, 3, 4)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if activityId provided without opportunityId", async () => {
      await expect(
        meetingRepository.validateMeetingAssociations(
          undefined,
          undefined,
          undefined,
          4
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("transformMeetingResponse", () => {
    it("should throw error if input is undefined", async () => {
      await expect(
        meetingRepository.transformMeetingResponse(undefined as any)
      ).rejects.toThrow("Failed to transform meeting response.");
    });

    it("should handle empty array gracefully", async () => {
      const result = await meetingRepository.transformMeetingResponse([]);
      expect(result).toEqual([]);
    });
  });

  describe("transformGetMeetingsResponse", () => {
    it("should throw error if input is undefined", async () => {
      await expect(
        meetingRepository.transformGetMeetingsResponse(undefined as any, [], [])
      ).rejects.toThrow("Failed to transform get meetings response.");
    });
  });

  describe("validateMeetingAssociations", () => {
    it("should throw BadRequestException if activityId provided without opportunityId", async () => {
      await expect(
        meetingRepository.validateMeetingAssociations(
          undefined,
          undefined,
          undefined,
          4 // activityId only
        )
      ).rejects.toThrow(BadRequestException);
    });
  });
});
