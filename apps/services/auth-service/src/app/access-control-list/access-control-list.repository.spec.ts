import { Test, TestingModule } from "@nestjs/testing";
import { AccessControlListRepository } from "./access-control-list.repository";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { UserRole } from "../../../../service-lib/src/lib/entities/user-role.entity";
import { RoleAclCategoryActionMap } from "../../../../service-lib/src/lib/entities/role-acl-category-action-map.entity";
import { AclCategoryActionMap } from "../../../../service-lib/src/lib/entities/acl-category-action-map.entity";
import { HttpStatus } from "@nestjs/common";
import { createErrorResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";

describe("AccessControlListRepository", () => {
  let repository: AccessControlListRepository;
  let userRoleRepository: Repository<UserRole>;
  let roleAclMapRepository: Repository<RoleAclCategoryActionMap>;
  let aclMapRepository: Repository<AclCategoryActionMap>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessControlListRepository,
        {
          provide: getRepositoryToken(UserRole),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(RoleAclCategoryActionMap),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(AclCategoryActionMap),
          useClass: Repository,
        },
      ],
    }).compile();

    repository = module.get<AccessControlListRepository>(
      AccessControlListRepository
    );
    userRoleRepository = module.get<Repository<UserRole>>(
      getRepositoryToken(UserRole)
    );
    roleAclMapRepository = module.get<Repository<RoleAclCategoryActionMap>>(
      getRepositoryToken(RoleAclCategoryActionMap)
    );
    aclMapRepository = module.get<Repository<AclCategoryActionMap>>(
      getRepositoryToken(AclCategoryActionMap)
    );
  });

  it("should be defined", () => {
    expect(repository).toBeDefined();
  });

  it("should return permissions when user roles and permissions exist", async () => {
    const mockUserRoles = [
      {
        role: { id: 1, name: "Admin" },
      },
    ];
    const mockRolePermissions = [
      {
        aclCategoryActionMap: {
          aclCategory: { name: "Company" },
          aclAction: { name: "Read" },
        },
      },
    ];

    jest.spyOn(userRoleRepository, "createQueryBuilder").mockReturnValueOnce({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockUserRoles),
    } as any);

    jest.spyOn(roleAclMapRepository, "createQueryBuilder").mockReturnValueOnce({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockRolePermissions),
    } as any);

    const userId = 123;
    const result = await repository.getUserPermissions(userId);

    expect(userRoleRepository.createQueryBuilder).toHaveBeenCalledWith(
      "userRole"
    );
    expect(roleAclMapRepository.createQueryBuilder).toHaveBeenCalledWith(
      "roleAcl"
    );
    expect(result).toEqual({
      roleId: 1,
      roleName: "Admin",
      access: {
        Company: {
          read: true,
        },
      },
    });
  });

  it("should return 404 error when no roles are found for the user", async () => {
    jest.spyOn(userRoleRepository, "createQueryBuilder").mockReturnValueOnce({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    } as any);

    const userId = 123;
    const result = await repository.getUserPermissions(userId);

    expect(userRoleRepository.createQueryBuilder).toHaveBeenCalledWith(
      "userRole"
    );
    expect(result).toEqual(
      createErrorResponse(HttpStatus.NOT_FOUND, "No roles found for the user")
    );
  });

  it("should return 500 error when an error occurs while fetching user roles", async () => {
    jest.spyOn(userRoleRepository, "createQueryBuilder").mockReturnValueOnce({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockRejectedValue(new Error("Database error")),
    } as any);

    const userId = 123;
    const result = await repository.getUserPermissions(userId);

    expect(userRoleRepository.createQueryBuilder).toHaveBeenCalledWith(
      "userRole"
    );
    expect(result).toEqual(
      createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Database error")
    );
  });

  it("should return 500 error when an error occurs while processing role permissions", async () => {
    const mockUserRoles = [
      {
        role: { id: 1, name: "Admin" },
      },
    ];

    jest.spyOn(userRoleRepository, "createQueryBuilder").mockReturnValueOnce({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(mockUserRoles),
    } as any);

    jest.spyOn(roleAclMapRepository, "createQueryBuilder").mockReturnValueOnce({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockRejectedValue(new Error("Permission error")),
    } as any);

    const userId = 123;
    const result = await repository.getUserPermissions(userId);

    expect(roleAclMapRepository.createQueryBuilder).toHaveBeenCalledWith(
      "roleAcl"
    );
    expect(result).toEqual(
      createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Permission error")
    );
  });

  it('should return acl metadata', async () => {
    const mockMaps = [
      {
        id: 1,
        aclCategory: { id: 1, name: 'Cat', categoryKey: 'CAT' },
        aclAction: { name: 'Read', actionKey: 'read' },
      },
    ];
    jest.spyOn(aclMapRepository, 'find').mockResolvedValue(mockMaps as any);
    const result = await repository.getAclMetadata();
    expect(aclMapRepository.find).toHaveBeenCalled();
    expect(result).toEqual([
      {
        category: mockMaps[0].aclCategory,
        actions: [{ id: 1, name: 'Read', actionKey: 'read' }],
      },
    ]);
  });

  it('should return role acl ids', async () => {
    const mockRecords = [
      { aclCategoryActionMap: { id: 2 } },
      { aclCategoryActionMap: { id: 3 } },
    ];
    jest
      .spyOn(roleAclMapRepository, 'find')
      .mockResolvedValue(mockRecords as any);
    const result = await repository.getRoleAcl(1);
    expect(roleAclMapRepository.find).toHaveBeenCalledWith({
      where: { role: { id: 1 } },
      relations: { aclCategoryActionMap: true },
    });
    expect(result).toEqual([2, 3]);
  });

  it('should update role acl', async () => {
    jest.spyOn(roleAclMapRepository, 'delete').mockResolvedValue({} as any);
    jest.spyOn(roleAclMapRepository, 'save').mockResolvedValue([] as any);
    const result = await repository.updateRoleAcl(1, [1, 2]);
    expect(roleAclMapRepository.delete).toHaveBeenCalledWith({ role: { id: 1 } });
    expect(roleAclMapRepository.save).toHaveBeenCalled();
    expect(result).toBe(true);
  });
});
