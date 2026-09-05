import { Test, TestingModule } from "@nestjs/testing";
import { AccessControlListController } from "./access-control-list.controller";
import { AccessControlListService } from "./access-control-list.service";
import {
  createErrorResponse,
  createResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { HttpStatus } from "@nestjs/common";
import * as jwt from "jsonwebtoken";

describe("AccessControlListController", () => {
  let controller: AccessControlListController;
  let service: AccessControlListService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccessControlListController],
      providers: [
        {
          provide: AccessControlListService,
          useValue: {
            getUserPermissions: jest.fn(),
            getAclMetadata: jest.fn(),
            getRoleAcl: jest.fn(),
            updateRoleAcl: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AccessControlListController>(
      AccessControlListController
    );
    service = module.get<AccessControlListService>(AccessControlListService);
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
  });

  it("should return permissions for a valid token", async () => {
    const mockPermissions = { roleId: 1, roleName: "Admin", access: {} };
    jest
      .spyOn(service, "getUserPermissions")
      .mockResolvedValue(mockPermissions);

    const mockAuthHeader = "Bearer valid.token";
    const mockResponse: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(jwt, "decode").mockReturnValue({ userDetails: { userId: 123 } });

    await controller.getUserPermissionsx(mockAuthHeader, mockResponse);

    expect(service.getUserPermissions).toHaveBeenCalledWith(123); // Ensure correct userId is passed
    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(mockResponse.json).toHaveBeenCalledWith(
      createResponse(
        HttpStatus.OK,
        "Permissions retrieved successfully",
        mockPermissions
      )
    );
  });

  it("should return 401 for missing Authorization header", async () => {
    const mockResponse: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.getUserPermissionsx("", mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith(
      createErrorResponse(HttpStatus.UNAUTHORIZED, "Missing or invalid token")
    );
  });

  it("should return 401 for invalid Authorization header", async () => {
    const mockAuthHeader = "InvalidHeader";
    const mockResponse: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.getUserPermissionsx(mockAuthHeader, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith(
      createErrorResponse(HttpStatus.UNAUTHORIZED, "Missing or invalid token")
    );
  });

  it("should return 401 for invalid or expired token", async () => {
    const mockAuthHeader = "Bearer invalid.token";
    const mockResponse: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jest.spyOn(jwt, "decode").mockReturnValue(null); // Simulate invalid token

    await controller.getUserPermissionsx(mockAuthHeader, mockResponse);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
    expect(mockResponse.json).toHaveBeenCalledWith(
      createErrorResponse(HttpStatus.UNAUTHORIZED, "Invalid or expired token")
    );
  });

  it('should get acl metadata', async () => {
    jest.spyOn(service, 'getAclMetadata').mockResolvedValue(['data']);
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.getAclMetadata('', res);
    expect(service.getAclMetadata).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
    expect(res.json).toHaveBeenCalledWith(
      createResponse(HttpStatus.OK, 'ACL metadata retrieved successfully', ['data'])
    );
  });

  it('should get role acl', async () => {
    jest.spyOn(service, 'getRoleAcl').mockResolvedValue([1]);
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.getAclMetadata('1', res);
    expect(service.getRoleAcl).toHaveBeenCalledWith(1);
    expect(res.json).toHaveBeenCalledWith(
      createResponse(HttpStatus.OK, 'Role ACL retrieved successfully', [1])
    );
  });

  it('should update role acl', async () => {
    jest.spyOn(service, 'updateRoleAcl').mockResolvedValue(true);
    const res: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    await controller.updateRoleAcl('1', { aclIds: [1] }, res);
    expect(service.updateRoleAcl).toHaveBeenCalledWith(1, [1]);
    expect(res.json).toHaveBeenCalledWith(
      createResponse(HttpStatus.OK, 'Role ACL updated successfully')
    );
  });
});
