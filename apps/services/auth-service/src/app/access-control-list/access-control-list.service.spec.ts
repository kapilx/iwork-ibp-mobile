import { Test, TestingModule } from "@nestjs/testing";
import { AccessControlListService } from "./access-control-list.service";
import { AccessControlListRepository } from "./access-control-list.repository";

describe("AccessControlListService", () => {
  let service: AccessControlListService;
  let repository: AccessControlListRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessControlListService,
        {
          provide: AccessControlListRepository,
          useValue: {
            getUserPermissions: jest.fn(),
            getAclMetadata: jest.fn(),
            getRoleAcl: jest.fn(),
            updateRoleAcl: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AccessControlListService>(AccessControlListService);
    repository = module.get<AccessControlListRepository>(
      AccessControlListRepository
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should return permissions when repository returns data", async () => {
    const mockPermissions = { roleId: 1, roleName: "Admin", access: {} };
    jest
      .spyOn(repository, "getUserPermissions")
      .mockResolvedValue(mockPermissions);

    const userId = 123;
    const result = await service.getUserPermissions(userId);

    expect(repository.getUserPermissions).toHaveBeenCalledWith(userId);
    expect(result).toEqual(mockPermissions);
  });

  it("should throw an error when repository throws an error", async () => {
    jest
      .spyOn(repository, "getUserPermissions")
      .mockRejectedValue(new Error("Database error"));

    const userId = 123;

    await expect(service.getUserPermissions(userId)).rejects.toThrow(
      "Database error"
    );
    expect(repository.getUserPermissions).toHaveBeenCalledWith(userId);
  });

  it('should return acl metadata', async () => {
    jest.spyOn(repository, 'getAclMetadata').mockResolvedValue(['meta']);
    const res = await service.getAclMetadata();
    expect(repository.getAclMetadata).toHaveBeenCalled();
    expect(res).toEqual(['meta']);
  });

  it('should return role acl', async () => {
    jest.spyOn(repository, 'getRoleAcl').mockResolvedValue([1]);
    const res = await service.getRoleAcl(1);
    expect(repository.getRoleAcl).toHaveBeenCalledWith(1);
    expect(res).toEqual([1]);
  });

  it('should update role acl', async () => {
    jest.spyOn(repository, 'updateRoleAcl').mockResolvedValue(true);
    const res = await service.updateRoleAcl(1, [1]);
    expect(repository.updateRoleAcl).toHaveBeenCalledWith(1, [1]);
    expect(res).toBe(true);
  });
});
