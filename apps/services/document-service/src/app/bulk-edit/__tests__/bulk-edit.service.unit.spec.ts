// Place mocks BEFORE importing service to ensure they apply
jest.mock("axios", () => ({ post: jest.fn() }));
jest.mock("../services/bulk-edit.repository", () => ({
  BulkEditRepository: jest.fn().mockImplementation(() => ({
    getUserAndManagerDetails: jest
      .fn()
      .mockResolvedValue({ user: null, manager: null }),
    findUserWithRoles: jest.fn(),
    findPeersByRoleAndOrganisation: jest.fn(),
    findRoleByName: jest.fn(),
  })),
}));
jest.mock(
  "../../../../../service-lib/src/lib/utils/notification.utils",
  () => ({
    NotificationUtils: jest.fn().mockImplementation(() => ({
      getNotificationDetailsByEvent: jest.fn().mockResolvedValue([]),
    })),
  })
);

import { Test, TestingModule } from "@nestjs/testing";
import { BulkEditService } from "../services/bulk-edit.service";
import { BulkEditRequestDto } from "../dto/bulk-edit-request.dto";
import { EntityType } from "../enums/field-operation.enum";
import axios from "axios";
import { BadRequestException } from "@nestjs/common";

const mockedAxios = axios as jest.Mocked<typeof axios>;

const notificationUtilsMock = {
  getNotificationDetailsByEvent: jest.fn().mockResolvedValue([]),
};

const traceIdServiceMock = { traceId: "test-trace" };

describe("BulkEditService (Unit)", () => {
  let service: BulkEditService;

  beforeEach(async () => {
    process.env.URL_ORG_SERVICE = "http://org-service";
    process.env.URL_OPPORTUNITY_SERVICE = "http://opportunity-service";
    process.env.URL_POLICY_SERVICE = "http://policy-service";
    process.env.URL_NOTIFICATION_SERVICE = "http://notification-service";

    mockedAxios.post.mockReset();

    const BulkEditRepository =
      require("../services/bulk-edit.repository").BulkEditRepository;
    const NotificationUtils =
      require("../../../../../service-lib/src/lib/utils/notification.utils").NotificationUtils;
    const TraceIdService =
      require("../../../../../service-lib/src/lib/trace-id.service").TraceIdService;

    // Use the mocked implementation instance so getUserAndManagerDetails exists for ownership tests
    const bulkEditRepoInstance = new BulkEditRepository();
    // Override default return to simulate active user and manager for ownership notifications
    bulkEditRepoInstance.getUserAndManagerDetails.mockResolvedValue({
      user: {
        userId: 101,
        firstName: "Alice",
        lastName: "Smith",
        emailId: "alice@example.com",
        userStatusKey: "ACTIVE",
      },
      manager: {
        userId: 202,
        firstName: "Bob",
        lastName: "Manager",
        emailId: "bob.manager@example.com",
        userStatusKey: "ACTIVE",
      },
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BulkEditService,
        { provide: BulkEditRepository, useValue: bulkEditRepoInstance },
        { provide: NotificationUtils, useValue: notificationUtilsMock },
        { provide: TraceIdService, useValue: traceIdServiceMock },
      ],
    }).compile();

    service = module.get<BulkEditService>(BulkEditService);
  });

  describe("validateBulkEdit", () => {
    it("should validate a valid COMPANY bulk edit request", async () => {
      const validRequest: BulkEditRequestDto = {
        entityType: EntityType.COMPANY,
        recordIds: [1, 2, 3],
        // Use an allowed field for COMPANY
        fieldUpdates: { accountManager: 42 },
        userId: 1,
      };

      const result = await service.validateBulkEdit(validRequest);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should add warning for large batch", async () => {
      const largeRecordSet = Array.from({ length: 600 }, (_, i) => i + 1);
      const request: BulkEditRequestDto = {
        entityType: EntityType.COMPANY,
        recordIds: largeRecordSet,
        fieldUpdates: { statusLid: 100 },
        userId: 10,
      };
      const result = await service.validateBulkEdit(request);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);
    });

    it("should reject invalid field names", async () => {
      const request: BulkEditRequestDto = {
        entityType: EntityType.COMPANY,
        recordIds: [1],
        fieldUpdates: { invalidField: "value" },
        userId: 1,
      };
      const result = await service.validateBulkEdit(request);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.fieldName === "invalidField")).toBe(
        true
      );
    });

    it("should reject invalid entity type", async () => {
      const request: BulkEditRequestDto = {
        entityType: "INVALID" as any,
        recordIds: [1],
        fieldUpdates: { statusLid: 100 },
        userId: 1,
      };
      const result = await service.validateBulkEdit(request as any);
      expect(result.isValid).toBe(false);
      const entityTypeError = result.errors.find(
        (e) => e.fieldName === "entityType"
      );
      expect(entityTypeError).toBeDefined();
    });
  });

  describe("executeBulkEdit routing", () => {
    beforeEach(() => {
      mockedAxios.post.mockImplementation((url) => {
        if (url.includes("company")) {
          return Promise.resolve({
            data: {
              data: {
                successCount: 2,
                failureCount: 0,
                affectedRecords: [1, 2],
              },
            },
          });
        }
        if (url.includes("opportunity")) {
          return Promise.resolve({
            data: {
              data: { successCount: 1, failureCount: 0, affectedRecords: [5] },
            },
          });
        }
        if (url.includes("policy")) {
          return Promise.resolve({
            data: {
              data: {
                successCount: 3,
                failureCount: 0,
                affectedRecords: [9, 10, 11],
              },
            },
          });
        }
        return Promise.resolve({ data: { data: {} } });
      });
    });

    it("should execute COMPANY bulk edit", async () => {
      const request: BulkEditRequestDto = {
        entityType: EntityType.COMPANY,
        recordIds: [1, 2],
        fieldUpdates: { priorityLid: 7 },
        userId: 1,
      };
      const result = await service.executeBulkEdit(request);
      expect(result.successCount).toBe(2);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("company/bulk-update"),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should map SALES_OPPORTUNITY to OPPORTUNITY bulk edit", async () => {
      const request: BulkEditRequestDto = {
        entityType: EntityType.SALES_OPPORTUNITY,
        recordIds: [5],
        fieldUpdates: { statusLid: 200 },
        userId: 2,
        selectedFilterValues: {},
      };
      const result = await service.executeBulkEdit(request);
      expect(result.successCount).toBe(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("opportunity/bulk-update"),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should execute POLICY bulk edit", async () => {
      const request: BulkEditRequestDto = {
        entityType: EntityType.POLICY,
        recordIds: [9, 10, 11],
        fieldUpdates: { policyStatusLid: 300 },
        userId: 3,
      };
      const result = await service.executeBulkEdit(request);
      expect(result.successCount).toBe(3);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("policy/bulk-update"),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should map RENEWAL_OPPORTUNITY to OPPORTUNITY bulk edit", async () => {
      const request: BulkEditRequestDto = {
        entityType: EntityType.RENEWAL_OPPORTUNITY,
        recordIds: [15],
        fieldUpdates: { statusLid: 400 },
        userId: 4,
        selectedFilterValues: {},
      };
      const result = await service.executeBulkEdit(request);
      expect(result.successCount).toBe(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("opportunity/bulk-update"),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it("should throw for invalid entity type during execution", async () => {
      const request: BulkEditRequestDto = {
        entityType: "INVALID" as any,
        recordIds: [1],
        fieldUpdates: { statusLid: 100 },
        userId: 1,
      };
      await expect(service.executeBulkEdit(request as any)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("executeBulkEdit upstream error handling", () => {
    it("should propagate upstream axios error as BadRequestException", async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error("Upstream error"));
      const request: BulkEditRequestDto = {
        entityType: EntityType.COMPANY,
        recordIds: [1],
        fieldUpdates: { leadCrm: 555 },
        userId: 1,
      };
      await expect(service.executeBulkEdit(request)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("executeBulkEdit validation failure", () => {
    it("should throw BadRequestException for invalid field during execution", async () => {
      const request: BulkEditRequestDto = {
        entityType: EntityType.COMPANY,
        recordIds: [1],
        fieldUpdates: { notAllowedField: 999 },
        userId: 55,
      };
      await expect(service.executeBulkEdit(request)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("ownership notifications", () => {
    beforeEach(() => {
      mockedAxios.post.mockImplementation((url) => {
        // Return minimal success for policy to trigger notification flow
        if (url.includes("policy/bulk-update")) {
          return Promise.resolve({
            data: {
              data: {
                successCount: 5,
                failureCount: 0,
                affectedRecords: [100],
              },
            },
          });
        }
        return Promise.resolve({ data: { data: {} } });
      });
    });

    it("should invoke ownership notification methods when ownerId changed on POLICY", async () => {
      const recvSpy = jest
        .spyOn(service as any, "sendNotificationsToReceiverUser")
        .mockResolvedValue(undefined);
      const mgrSpy = jest
        .spyOn(service as any, "sendNotificationsToManagerUser")
        .mockResolvedValue(undefined);

      const request: BulkEditRequestDto = {
        entityType: EntityType.POLICY,
        recordIds: [100],
        fieldUpdates: { ownerId: 101 },
        userId: 303,
      };
      const result = await service.executeBulkEdit(request);
      expect(result.successCount).toBe(5);
      expect(recvSpy).toHaveBeenCalledTimes(1);
      expect(mgrSpy).toHaveBeenCalledTimes(1);
    });
  });
});
