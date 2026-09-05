import { Test, TestingModule } from "@nestjs/testing";
import { DataSource, EntityManager } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { MeetingService } from "./meeting.service";
import { MeetingRepository } from "./meeting.repository";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { CreateMeetingDto } from "./dto/create-meeting.dto";
import { UpdateMeetingDto } from "./dto/update-meeting.dto";

const mockMeetingRepository = () => ({
  createMeeting: jest.fn(),
  createMeetingParticipants: jest.fn(),
  createMeetingDocuments: jest.fn(),
  getMeetings: jest.fn(),
  getMeetingById: jest.fn(),
  updateMeeting: jest.fn(),
  updateMeetingParticipants: jest.fn(),
  updateMeetingDocuments: jest.fn(),
  deleteMeetingById: jest.fn(),
  getMeetingsByOpportunityAndActivity: jest.fn(),
});

const mockLookUpValidation = () => ({
  validateDynamicLookupValues: jest.fn(),
});

const mockMasterValidation = () => ({
  validateMasterIds: jest.fn(),
});

const mockDataSource = () => ({
  transaction: jest.fn(),
});

describe("MeetingService", () => {
  let meetingService: MeetingService;
  let meetingRepository: jest.Mocked<ReturnType<typeof mockMeetingRepository>>;
  let lookUpValidation: jest.Mocked<ReturnType<typeof mockLookUpValidation>>;
  let masterValidation: jest.Mocked<ReturnType<typeof mockMasterValidation>>;
  let dataSource: ReturnType<typeof mockDataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MeetingService,
        { provide: MeetingRepository, useFactory: mockMeetingRepository },
        { provide: LookUpValidationService, useFactory: mockLookUpValidation },
        { provide: MasterValidationService, useFactory: mockMasterValidation },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    meetingService = module.get<MeetingService>(MeetingService);
    meetingRepository = module.get(MeetingRepository);
    lookUpValidation = module.get(LookUpValidationService);
    masterValidation = module.get(MasterValidationService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createMeeting", () => {
    it("should create a meeting with participants and documents", async () => {
      const meeting = { id: 1 };
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      meetingRepository.createMeeting.mockResolvedValue(meeting);
      meetingRepository.createMeetingParticipants.mockResolvedValue(undefined);
      meetingRepository.createMeetingDocuments.mockResolvedValue(undefined);

      const createMeetingDto: CreateMeetingDto = {
        meetingName: "Test",
        participants: [{ participantId: 2, participantRecordType: "EMPLOYEE" }],
        documents: [{ documentId: 3 }],
      } as any;

      const result = await meetingService.createMeeting(createMeetingDto);

      expect(result).toEqual({ id: 1 });
      expect(lookUpValidation.validateDynamicLookupValues).toHaveBeenCalled();
      expect(masterValidation.validateMasterIds).toHaveBeenCalled();
      expect(meetingRepository.createMeeting).toHaveBeenCalledWith(
        expect.objectContaining({ meetingName: "Test" }),
        expect.any(Object)
      );
      expect(meetingRepository.createMeetingParticipants).toHaveBeenCalledWith(
        1,
        [{ participantId: 2, participantRecordType: "EMPLOYEE" }],
        expect.any(Object)
      );
      expect(meetingRepository.createMeetingDocuments).toHaveBeenCalledWith(
        1,
        [{ documentId: 3 }],
        expect.any(Object)
      );
    });

    it("should create a meeting without participants and documents", async () => {
      const meeting = { id: 1 };
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      meetingRepository.createMeeting.mockResolvedValue(meeting);

      const createMeetingDto: CreateMeetingDto = {
        meetingName: "Test",
        participants: [],
        documents: [],
      } as any;

      const result = await meetingService.createMeeting(createMeetingDto);

      expect(result).toEqual({ id: 1 });
      expect(
        meetingRepository.createMeetingParticipants
      ).not.toHaveBeenCalled();
      expect(meetingRepository.createMeetingDocuments).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      meetingRepository.createMeeting.mockRejectedValue(
        new NotFoundException("Not found")
      );

      await expect(
        meetingService.createMeeting({ meetingName: "Test" } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException on other errors", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      meetingRepository.createMeeting.mockRejectedValue(
        new Error("Some error")
      );

      await expect(
        meetingService.createMeeting({ meetingName: "Test" } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it("should use provided entityManager if passed", async () => {
      const meeting = { id: 1 };
      const entityManager = {} as EntityManager;
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      meetingRepository.createMeeting.mockResolvedValue(meeting);
      meetingRepository.createMeetingParticipants.mockResolvedValue(undefined);
      meetingRepository.createMeetingDocuments.mockResolvedValue(undefined);

      const createMeetingDto: CreateMeetingDto = {
        meetingName: "Test",
        participants: [{ participantId: 2, participantRecordType: "EMPLOYEE" }],
        documents: [{ documentId: 3 }],
      } as any;

      const result = await meetingService.createMeeting(
        createMeetingDto,
        entityManager
      );

      expect(result).toEqual({ id: 1 });
      expect(meetingRepository.createMeeting).toHaveBeenCalledWith(
        expect.objectContaining({ meetingName: "Test" }),
        entityManager
      );
      expect(meetingRepository.createMeetingParticipants).toHaveBeenCalledWith(
        1,
        [{ participantId: 2, participantRecordType: "EMPLOYEE" }],
        entityManager
      );
      expect(meetingRepository.createMeetingDocuments).toHaveBeenCalledWith(
        1,
        [{ documentId: 3 }],
        entityManager
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe("getMeetings", () => {
    it("should return meetings with pagination", async () => {
      meetingRepository.getMeetings.mockResolvedValue({ data: [], count: 0 });

      const result = await meetingService.getMeetings(1, 10, "", "", 1, "", undefined, undefined);

      expect(result).toEqual({ data: [], count: 0 });
      expect(meetingRepository.getMeetings).toHaveBeenCalled();
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      meetingRepository.getMeetings.mockRejectedValue(
        new NotFoundException("Not found")
      );

      await expect(
        meetingService.getMeetings(1, 10, "", "", 1, "", undefined, undefined)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw Error with custom message on other errors", async () => {
      meetingRepository.getMeetings.mockRejectedValue(new Error("fail"));

      await expect(
        meetingService.getMeetings(1, 10, "", "", 1, "", undefined, undefined)
      ).rejects.toThrow(errorMessages.meetingListRetrievalFailed);
    });
  });

  describe("getMeetingById", () => {
    it("should return meeting by id", async () => {
      meetingRepository.getMeetingById.mockResolvedValue({ id: 1 });

      const result = await meetingService.getMeetingById(1);

      expect(result).toEqual({ id: 1 });
      expect(meetingRepository.getMeetingById).toHaveBeenCalledWith(1);
    });

    it("should throw NotFoundException if meeting not found", async () => {
      meetingRepository.getMeetingById.mockResolvedValue(undefined);

      await expect(meetingService.getMeetingById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException on other errors", async () => {
      meetingRepository.getMeetingById.mockRejectedValue(new Error("fail"));

      await expect(meetingService.getMeetingById(1)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("updateMeeting", () => {
    it("should update meeting and related entities successfully", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      meetingRepository.updateMeeting.mockResolvedValue(undefined);
      meetingRepository.updateMeetingParticipants.mockResolvedValue(undefined);
      meetingRepository.updateMeetingDocuments.mockResolvedValue(undefined);

      const updateMeetingDto: UpdateMeetingDto = {
        meetingName: "Updated",
        participants: [{ participantId: 2, participantRecordType: "EMPLOYEE" }],
        documents: [{ documentId: 3 }],
      } as any;

      const result = await meetingService.updateMeeting(1, updateMeetingDto);

      expect(result).toEqual({ id: 1 });
      expect(meetingRepository.updateMeeting).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ meetingName: "Updated" }),
        expect.any(Object)
      );
      expect(meetingRepository.updateMeetingParticipants).toHaveBeenCalledWith(
        1,
        [{ participantId: 2, participantRecordType: "EMPLOYEE" }],
        expect.any(Object)
      );
      expect(meetingRepository.updateMeetingDocuments).toHaveBeenCalledWith(
        1,
        [{ documentId: 3 }],
        expect.any(Object)
      );
    });

    it("should update meeting without participants and documents", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      meetingRepository.updateMeeting.mockResolvedValue(undefined);

      const updateMeetingDto: UpdateMeetingDto = {
        meetingName: "Updated",
        participants: [],
        documents: [],
      } as any;

      const result = await meetingService.updateMeeting(1, updateMeetingDto);

      expect(result).toEqual({ id: 1 });
      expect(
        meetingRepository.updateMeetingParticipants
      ).not.toHaveBeenCalled();
      expect(meetingRepository.updateMeetingDocuments).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      meetingRepository.updateMeeting.mockRejectedValue(
        new NotFoundException("Not found")
      );

      await expect(
        meetingService.updateMeeting(1, { meetingName: "fail" } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException on other errors", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      meetingRepository.updateMeeting.mockRejectedValue(new Error("fail"));

      await expect(
        meetingService.updateMeeting(1, { meetingName: "fail" } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it("should use provided entityManager if passed", async () => {
      const entityManager = {} as EntityManager;
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      meetingRepository.updateMeeting.mockResolvedValue(undefined);
      meetingRepository.updateMeetingParticipants.mockResolvedValue(undefined);
      meetingRepository.updateMeetingDocuments.mockResolvedValue(undefined);

      const updateMeetingDto: UpdateMeetingDto = {
        meetingName: "Updated",
        participants: [{ participantId: 2, participantRecordType: "EMPLOYEE" }],
        documents: [{ documentId: 3 }],
      } as any;

      const result = await meetingService.updateMeeting(
        1,
        updateMeetingDto,
        entityManager
      );

      expect(result).toEqual({ id: 1 });
      expect(meetingRepository.updateMeeting).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ meetingName: "Updated" }),
        entityManager
      );
      expect(meetingRepository.updateMeetingParticipants).toHaveBeenCalledWith(
        1,
        [{ participantId: 2, participantRecordType: "EMPLOYEE" }],
        entityManager
      );
      expect(meetingRepository.updateMeetingDocuments).toHaveBeenCalledWith(
        1,
        [{ documentId: 3 }],
        entityManager
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe("deleteMeetingById", () => {
    it("should delete meeting by id", async () => {
      meetingRepository.deleteMeetingById.mockResolvedValue(undefined);

      await expect(
        meetingService.deleteMeetingById(1)
      ).resolves.toBeUndefined();
      expect(meetingRepository.deleteMeetingById).toHaveBeenCalledWith(1);
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      meetingRepository.deleteMeetingById.mockRejectedValue(
        new NotFoundException("Not found")
      );

      await expect(meetingService.deleteMeetingById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException on other errors", async () => {
      meetingRepository.deleteMeetingById.mockRejectedValue(new Error("fail"));

      await expect(meetingService.deleteMeetingById(1)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("getMeetingsByOpportunityAndActivity", () => {
    it("should return meetings for given opportunity and activity", async () => {
      meetingRepository.getMeetingsByOpportunityAndActivity.mockResolvedValue([
        { id: 1 },
      ]);

      const result = await meetingService.getMeetingsByOpportunityAndActivity(
        1,
        2
      );

      expect(result).toEqual([{ id: 1 }]);
      expect(
        meetingRepository.getMeetingsByOpportunityAndActivity
      ).toHaveBeenCalledWith(1, 2);
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      meetingRepository.getMeetingsByOpportunityAndActivity.mockRejectedValue(
        new NotFoundException("Not found")
      );

      await expect(
        meetingService.getMeetingsByOpportunityAndActivity(1, 2)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException on other errors", async () => {
      meetingRepository.getMeetingsByOpportunityAndActivity.mockRejectedValue(
        new Error("fail")
      );

      await expect(
        meetingService.getMeetingsByOpportunityAndActivity(1, 2)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
