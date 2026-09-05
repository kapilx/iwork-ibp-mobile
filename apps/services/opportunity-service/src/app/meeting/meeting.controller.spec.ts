import { Test, TestingModule } from "@nestjs/testing";
import { MeetingController } from "./meeting.controller";
import { MeetingService } from "./meeting.service";
import { CreateMeetingDto } from "./dto/create-meeting.dto";
import { UpdateMeetingDto } from "./dto/update-meeting.dto";
import { GetMeetingsDto } from "./dto/get-meetings.dto";
import { successMessage } from "../../../../../../libs/service-lib/src/lib/messages";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from "../../../../../../libs/service-lib/src/lib/constants";

// Mock Guards
jest.mock("../../../../../services/auth-service/src/guards/auth.guard", () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));
jest.mock("../../../../../services/auth-service/src/guards/role.guard", () => ({
  RolesGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}
interface MockRequest {
  user?: { userDetails?: { userId?: number } };
}

const createMockRes = (): MockResponse => {
  const res: Partial<MockResponse> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as MockResponse;
};

const createMockReq = (userId = 1): MockRequest => ({
  user: { userDetails: { userId } },
});

describe("MeetingController", () => {
  let controller: MeetingController;
  let meetingService: MeetingService;

  const meetingServiceMock = {
    createMeeting: jest.fn(),
    getMeetings: jest.fn(),
    getMeetingById: jest.fn(),
    updateMeeting: jest.fn(),
    deleteMeetingById: jest.fn(),
    getMeetingsByOpportunityAndActivity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MeetingController],
      providers: [{ provide: MeetingService, useValue: meetingServiceMock }],
    }).compile();

    controller = module.get<MeetingController>(MeetingController);
    meetingService = module.get<MeetingService>(MeetingService);

    jest.clearAllMocks();
  });

  describe("createMeeting", () => {
    it("should validate required fields and create a meeting", async () => {
      const res = createMockRes();
      const req = createMockReq(10);
      const dto: CreateMeetingDto = { meetingName: "test meeting" } as any;
      meetingServiceMock.createMeeting.mockResolvedValue({ id: 1 });

      await controller.createMeeting(dto, res as any, req as any);

      expect(meetingServiceMock.createMeeting).toHaveBeenCalledWith({
        ...dto,
        createdBy: 10,
        updatedBy: 10,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 201,
          message: successMessage.meetingCreation,
          data: { id: 1 },
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      const req = createMockReq();
      const dto: CreateMeetingDto = { meetingName: "fail" } as any;
      meetingServiceMock.createMeeting.mockRejectedValue(new Error("fail"));

      await controller.createMeeting(dto, res as any, req as any);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getMeetings", () => {
    it("should return meetings with pagination and validation", async () => {
      const res = createMockRes();
      const req = createMockReq(5);
      const meetings = { data: [{ id: 1 }], count: 1 };
      meetingServiceMock.getMeetings.mockResolvedValue(meetings);

      await controller.getMeetings(
        {
          page: 2,
          limit: 5,
          search: "abc",
          sort: "createdAt:ASC",
          searchBy: "desc",
          companyId: 11,
          opportunityId: 22,
        } as GetMeetingsDto,
        res as any,
        req as any
      );

      expect(meetingServiceMock.getMeetings).toHaveBeenCalledWith(
        2,
        5,
        "abc",
        "createdAt:ASC",
        5,
        "desc",
        11,
        22
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.meetingList,
          data: meetings,
        })
      );
    });

    it("should use default values if query params are missing", async () => {
      const res = createMockRes();
      const req = createMockReq(4);
      const meetings = { data: [], count: 0 };
      meetingServiceMock.getMeetings.mockResolvedValue(meetings);

      await controller.getMeetings(
        {} as GetMeetingsDto,
        res as any,
        req as any
      );

      expect(meetingServiceMock.getMeetings).toHaveBeenCalledWith(
        DEFAULT_PAGE,
        DEFAULT_LIMIT,
        "",
        "createdAt:DESC",
        4,
        "",
        undefined,
        undefined
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      const req = createMockReq();
      meetingServiceMock.getMeetings.mockRejectedValue(new Error("fail"));

      await controller.getMeetings(
        {} as GetMeetingsDto,
        res as any,
        req as any
      );

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getMeetingById", () => {
    it("should return meeting details with 200", async () => {
      const res = createMockRes();
      meetingServiceMock.getMeetingById.mockResolvedValue({ id: 1 });

      await controller.getMeetingById(1, res as any);

      expect(meetingServiceMock.getMeetingById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.meetingDetails,
          data: { id: 1 },
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      meetingServiceMock.getMeetingById.mockRejectedValue(new Error("fail"));

      await controller.getMeetingById(1, res as any);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("updateMeetingById", () => {
    it("should validate required fields and update meeting", async () => {
      const res = createMockRes();
      const req = createMockReq(7);
      const dto: UpdateMeetingDto = { meetingName: "updated" } as any;
      meetingServiceMock.updateMeeting.mockResolvedValue({ id: 1 });

      await controller.updateMeetingById(1, dto, res as any, req as any);

      expect(meetingServiceMock.updateMeeting).toHaveBeenCalledWith(1, {
        ...dto,
        updatedBy: 7,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.meetingUpdated,
          data: { id: 1 },
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      const req = createMockReq();
      meetingServiceMock.updateMeeting.mockRejectedValue(new Error("fail"));

      await controller.updateMeetingById(
        1,
        {} as UpdateMeetingDto,
        res as any,
        req as any
      );

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("deleteMeetingById", () => {
    it("should delete meeting and return 200", async () => {
      const res = createMockRes();
      meetingServiceMock.deleteMeetingById.mockResolvedValue(undefined);

      await controller.deleteMeetingById(1, res as any);

      expect(meetingServiceMock.deleteMeetingById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.meetingDeleted,
          data: undefined,
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      meetingServiceMock.deleteMeetingById.mockRejectedValue(new Error("fail"));

      await controller.deleteMeetingById(1, res as any);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getMeetingsByOpportunityAndActivity", () => {
    it("should return meetings for given opportunity and activity", async () => {
      const res = createMockRes();
      const meetings = [{ id: 1 }];
      meetingServiceMock.getMeetingsByOpportunityAndActivity.mockResolvedValue(
        meetings
      );

      await controller.getMeetingsByOpportunityAndActivity(1, 2, res as any);

      expect(
        meetingServiceMock.getMeetingsByOpportunityAndActivity
      ).toHaveBeenCalledWith(1, 2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.meetingList,
          data: meetings,
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      meetingServiceMock.getMeetingsByOpportunityAndActivity.mockRejectedValue(
        new Error("fail")
      );

      await controller.getMeetingsByOpportunityAndActivity(1, 2, res as any);

      expect(res.json).toHaveBeenCalled();
    });
  });
});
