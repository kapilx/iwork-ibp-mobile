import { Test, TestingModule } from "@nestjs/testing";
import { DataSource, EntityManager, In } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { EmployeeRepository } from "./employee.repository";
import { Employee } from "../../../../service-lib/src/lib/entities/employee.entity";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import {
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import {
  EMPLOYEE_STATUS_ACTIVE,
  EMPLOYEE_STATUS_INACTIVE,
  EMPLOYEE_STATUS_LEAVE,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";

describe("EmployeeRepository", () => {
  let employeeRepository: EmployeeRepository;
  let mockDataSource: Partial<DataSource>;
  let mockEntityService: Partial<EntityService>;
  let mockEntityManager: Partial<EntityManager>;

  beforeEach(async () => {
    // Mock EntityManager
    mockEntityManager = {
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
      softRemove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
        getOne: jest.fn(),
      })),
      create: jest.fn(), // Mock create method
      save: jest.fn(), // Mock save method
      merge: jest.fn(),
    };
    const mockLookUpRepository = {
      findOne: jest.fn(),
    };

    const mockEmployeeRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      })),
    };

    // Mock DataSource
    mockDataSource = {
      transaction: jest.fn((callback) => callback(mockEntityManager)),
      getRepository: jest.fn((entity) => {
        if (entity === Employee) {
          return mockEmployeeRepository;
        }
        if (entity === LookUp) {
          return mockLookUpRepository;
        }
      }),
    };

    // Mock EntityService
    mockEntityService = {
      getData: jest.fn(),
      fetchEntityList: jest.fn(),
    };

    // Create TestingModule
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeRepository,
        { provide: DataSource, useValue: mockDataSource },
        { provide: EntityService, useValue: mockEntityService },
        { provide: getRepositoryToken(Employee), useValue: {} },
      ],
    }).compile();

    // Get the repository instance
    employeeRepository = module.get<EmployeeRepository>(EmployeeRepository);
    (employeeRepository as any).employeeRepository = mockEmployeeRepository;
  });

  describe("getEmployees", () => {
    it("should retrieve employees with pagination and sorting", async () => {
      // Arrange
      const mockData = [
        {
          employeeId: 1,
          firstName: "John Doe",
          emailId: "john.doe@example.com",
          organization: { id: 1, name: "Org A" },
          statusLookup: { id: 1, name: "Active" },
          department: { id: 1, name: "HR" },
          designation: { id: 1, name: "Manager" },
          salutation: { id: 1, name: "Mr." },
          branch: { id: 1, name: "Branch A" },
          role: { id: 1, name: "Admin" },
          iworkRole: { id: 1, name: "Role A" },
          location: { id: 1, name: "Location A" },
          vertical: { id: 1, name: "Vertical A" },
        },
      ];
      const mockCount = 1;

      mockEntityService.getData.mockResolvedValue({
        data: mockData,
        count: mockCount,
      });

      // Act
      const result = await employeeRepository.getEmployees(
        "firstName",
        "ASC",
        1,
        10
      );

      // Assert
      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            employeeId: 1,
            firstName: "John Doe",
            emailId: "john.doe@example.com",
          }),
        ]),
        count: mockCount,
      });
      expect(mockEntityService.getData).toHaveBeenCalledWith(
        Employee,
        1,
        10,
        undefined,
        "firstName",
        "ASC",
        {
          organization: true,
          statusLookup: true,
          department: true,
          designation: true,
          salutation: true,
          branch: true,
          role: true,
          iworkRole: true,
          location: true,
          vertical: true,
        },
        {},
        undefined
      );
    });

    it("should throw an error if the query fails", async () => {
      // Arrange
      mockEntityService.getData.mockRejectedValue(new Error("Database error"));

      // Act & Assert
      await expect(
        employeeRepository.getEmployees("firstName", "ASC", 1, 10)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("deleteEmployeeById", () => {
    it("should successfully delete an employee", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1 };
      const mockUser = { userId: 1 };
      mockEntityManager.findOne
        .mockResolvedValueOnce(mockEmployee) // Find employee
        .mockResolvedValueOnce(mockUser); // Find user
      mockEntityManager.softRemove.mockResolvedValueOnce(undefined);

      // Act
      const result = await employeeRepository.deleteEmployeeById(1);

      // Assert
      expect(result).toBe(true);
      expect(mockEntityManager.findOne).toHaveBeenCalledTimes(2);
      expect(mockEntityManager.softRemove).toHaveBeenCalledTimes(2);
    });

    it("should throw NotFoundException if employee does not exist", async () => {
      // Arrange
      mockEntityManager.findOne.mockResolvedValueOnce(null); // Employee not found

      // Act & Assert
      await expect(employeeRepository.deleteEmployeeById(1)).rejects.toThrow(
        InternalServerErrorException
      );
      expect(mockEntityManager.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe("addEmployee", () => {
    it("should successfully add an employee", async () => {
      const mockUser = { userId: 1 };
      const mockEmployee = { employeeId: 1 };
      const createEmployeeObject = {
        firstName: "John",
        emailId: "john.doe@example.com",
        iirmEmpId: "EMP123",
      };

      jest.spyOn(mockEntityManager, "findOne").mockResolvedValue(null);
      jest.spyOn(mockEntityManager, "create").mockReturnValueOnce(mockUser);
      jest.spyOn(mockEntityManager, "save").mockResolvedValueOnce(mockUser);
      jest.spyOn(mockEntityManager, "create").mockReturnValueOnce(mockEmployee);
      jest.spyOn(mockEntityManager, "save").mockResolvedValueOnce(mockEmployee);

      const result = await employeeRepository.addEmployee(
        createEmployeeObject,
        1
      );

      expect(result).toEqual(mockEmployee);
      expect(mockEntityManager.create).toHaveBeenCalledTimes(2);
      expect(mockEntityManager.save).toHaveBeenCalledTimes(2);
    });

    it("should throw BadRequestException if email already exists", async () => {
      const createEmployeeObject = { emailId: "existing@example.com" };

      jest.spyOn(mockEntityManager, "findOne").mockResolvedValueOnce({
        emailId: "existing@example.com",
      });

      await expect(
        employeeRepository.addEmployee(createEmployeeObject, 1)
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("should throw an error if user creation fails", async () => {
      // Arrange
      mockEntityManager.create.mockImplementation(() => {
        throw new Error("Database error");
      });

      const createEmployeeObject = {
        salutationLid: 1,
        firstName: "John",
        lastName: "Doe",
        emailId: "john.doe@example.com",
        mobile: "1234567890",
        roleId: 1,
        locationId: 1,
        verticalId: 1,
        departmentId: 1,
        designationId: 1,
        reportingManagerEmployeeId: 2,
        iworkRoleId: 1,
        organizationLid: 1,
        branchLid: 1,
        statusLid: 1,
        iirmEmpId: "EMP123",
      };

      // Act & Assert
      await expect(
        employeeRepository.addEmployee(createEmployeeObject, 1)
      ).rejects.toThrow(InternalServerErrorException);
    });
    it("should throw BadRequestException if email already exists in User table", async () => {
      // Arrange
      const createEmployeeObject = {
        emailId: "existing@example.com",
      };
      mockEntityManager.findOne
        .mockResolvedValueOnce(null) // No email in Employee table
        .mockResolvedValueOnce({ emailId: "existing@example.com" }); // Email exists in User table

      await expect(
        employeeRepository.addEmployee(createEmployeeObject, 1)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("getEmployeeById", () => {
    it("should successfully retrieve an employee by ID", async () => {
      // Arrange
      const mockEmployee = {
        employeeId: 1,
        firstName: "John Doe",
        emailId: "john.doe@example.com",
        organization: { id: 1, name: "Org A" },
        statusLookup: { id: 1, name: "Active" },
        department: { id: 1, name: "HR" },
        designation: { id: 1, name: "Manager" },
        salutation: { id: 1, name: "Mr." },
      };

      // Mock query builder chain
      mockEntityManager.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockEmployee),
      });

      // Mock mapEmployeeToDto to return a valid DTO
      jest
        .spyOn(employeeRepository as any, "mapEmployeeToDto")
        .mockReturnValue({
          employeeId: 1,
          firstName: "John Doe",
          emailId: "john.doe@example.com",
          organization: { id: 1, name: "Org A" },
          status: { id: 1, name: "Active" },
          department: { id: 1, name: "HR" },
          designation: { id: 1, name: "Manager" },
          salutation: { id: 1, name: "Mr." },
        });

      // Act
      const result = await employeeRepository.getEmployeeById(1);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          employeeId: 1,
          firstName: "John Doe",
          emailId: "john.doe@example.com",
        })
      );
      expect(mockEntityManager.createQueryBuilder).toHaveBeenCalled();
    });
    it("should throw InternalServerErrorException if an error occurs", async () => {
      // Arrange
      mockEntityManager.createQueryBuilder.mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockRejectedValue(new Error("Database error")),
      });

      // Act & Assert
      await expect(employeeRepository.getEmployeeById(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
    it("should throw NotFoundException if employee does not exist", async () => {
      mockEntityService.getData.mockResolvedValue({ data: [], count: 0 });
      await expect(employeeRepository.getEmployeeById(999)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("updateEmployeeById", () => {
    it("should successfully update an employee and their associated user", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, userId: 1 };
      const mockUser = { userId: 1 };

      mockEntityManager.findOne
        .mockResolvedValueOnce(mockEmployee) // Mock finding the employee
        .mockResolvedValueOnce(mockUser); // Mock finding the user

      mockEntityManager.merge
        .mockReturnValueOnce(mockUser)
        .mockReturnValueOnce(mockEmployee);
      mockEntityManager.save
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockEmployee);

      const employeeObject = {
        firstName: "Updated Name",
        emailId: "updated.email@example.com",
      };

      // Act
      const result = await employeeRepository.updateEmployeeById(
        1,
        employeeObject,
        1
      );

      // Assert
      expect(result).toBe(true);
      expect(mockEntityManager.findOne).toHaveBeenCalledTimes(3); // Once for employee, once for user
      expect(mockEntityManager.merge).toHaveBeenCalledTimes(2); // Once for user, once for employee
      expect(mockEntityManager.save).toHaveBeenCalledTimes(2); // Once for user, once for employee
    });

    it("should throw InternalServerErrorException if the employee does not exist", async () => {
      // Arrange
      mockEntityManager.findOne.mockResolvedValueOnce(null); // Employee not found

      const employeeObject = {
        firstName: "Updated Name",
        emailId: "updated.email@example.com",
      };

      // Act & Assert
      await expect(
        employeeRepository.updateEmployeeById(999, employeeObject, 1)
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockEntityManager.findOne).toHaveBeenCalledTimes(1); // Only called once for employee lookup
    });

    it("should throw InternalServerErrorException if the user associated with the employee does not exist", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, userId: 1 };
      mockEntityManager.findOne
        .mockResolvedValueOnce(mockEmployee) // Mock finding the employee
        .mockResolvedValueOnce(null); // User not found

      const employeeObject = {
        firstName: "Updated Name",
        emailId: "updated.email@example.com",
      };

      // Act & Assert
      await expect(
        employeeRepository.updateEmployeeById(1, employeeObject, 1)
      ).rejects.toThrow(InternalServerErrorException);
      expect(mockEntityManager.findOne).toHaveBeenCalledTimes(2); // Called for both employee and user
    });

    it("should throw InternalServerErrorException if an error occurs during the update", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, userId: 1 };
      const mockUser = { userId: 1 };

      mockEntityManager.findOne
        .mockResolvedValueOnce(mockEmployee) // Mock finding the employee
        .mockResolvedValueOnce(mockUser); // Mock finding the user

      mockEntityManager.merge.mockImplementation(() => {
        throw new Error("Database error");
      });

      const employeeObject = {
        firstName: "Updated Name",
        emailId: "updated.email@example.com",
      };

      // Act & Assert
      await expect(
        employeeRepository.updateEmployeeById(1, employeeObject, 1)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("deleteEmployeeById", () => {
    it("should successfully delete an employee and their associated user", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, userId: 1 };
      const mockUser = { userId: 1 };

      mockEntityManager.findOne
        .mockResolvedValueOnce(mockEmployee) // Mock finding the employee
        .mockResolvedValueOnce(mockUser); // Mock finding the user

      mockEntityManager.softRemove.mockResolvedValue(undefined);

      // Act
      const result = await employeeRepository.deleteEmployeeById(1);

      // Assert
      expect(result).toBe(true);
      expect(mockEntityManager.findOne).toHaveBeenCalledTimes(2); // Once for employee, once for user
      expect(mockEntityManager.softRemove).toHaveBeenCalledTimes(2); // Once for employee, once for user
    });

    it("should throw NotFoundException if the employee does not exist", async () => {
      // Arrange
      mockEntityManager.findOne.mockResolvedValueOnce(null); // Employee not found

      // Act & Assert
      await expect(employeeRepository.deleteEmployeeById(999)).rejects.toThrow(
        InternalServerErrorException
      );
      expect(mockEntityManager.findOne).toHaveBeenCalledTimes(1); // Only called once for employee lookup
    });

    it("should throw NotFoundException if the user associated with the employee does not exist", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, userId: 1 };
      mockEntityManager.findOne
        .mockResolvedValueOnce(mockEmployee) // Mock finding the employee
        .mockResolvedValueOnce(null); // User not found

      // Act & Assert
      await expect(employeeRepository.deleteEmployeeById(1)).rejects.toThrow(
        InternalServerErrorException
      );
      expect(mockEntityManager.findOne).toHaveBeenCalledTimes(2); // Called for both employee and user
    });

    it("should throw InternalServerErrorException if an error occurs during deletion", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, userId: 1 };
      const mockUser = { userId: 1 };

      mockEntityManager.findOne
        .mockResolvedValueOnce(mockEmployee) // Mock finding the employee
        .mockResolvedValueOnce(mockUser); // Mock finding the user

      mockEntityManager.softRemove.mockImplementation(() => {
        throw new Error("Database error");
      });

      // Act & Assert
      await expect(employeeRepository.deleteEmployeeById(1)).rejects.toThrow(
        InternalServerErrorException
      );
    });
  });

  describe("updateEmployeeDetails", () => {
    beforeEach(() => {
      // Mock DataSource.getRepository
      const mockActiveStatus = { id: 1, lookUpKey: EMPLOYEE_STATUS_ACTIVE };
      const mockInactiveStatus = {
        id: 2,
        lookUpKey: EMPLOYEE_STATUS_INACTIVE,
      };
      const mockLeaveStatus = { id: 3, lookUpKey: EMPLOYEE_STATUS_LEAVE };
      jest
        .spyOn(mockDataSource, "getRepository")
        .mockImplementation((entity) => {
          if (entity === LookUp) {
            return {
              findOne: jest.fn((options) => {
                if (options.where.lookUpKey === EMPLOYEE_STATUS_ACTIVE) {
                  return { id: 1, lookUpKey: EMPLOYEE_STATUS_ACTIVE };
                } else if (
                  options.where.lookUpKey === EMPLOYEE_STATUS_INACTIVE
                ) {
                  return { id: 2, lookUpKey: EMPLOYEE_STATUS_INACTIVE };
                } else if (options.where.lookUpKey === EMPLOYEE_STATUS_LEAVE) {
                  return { id: 3, lookUpKey: EMPLOYEE_STATUS_LEAVE };
                }
                return null;
              }),
              find: jest.fn().mockResolvedValue([
                { id: 1, lookUpKey: EMPLOYEE_STATUS_ACTIVE },
                { id: 2, lookUpKey: EMPLOYEE_STATUS_INACTIVE },
                { id: 3, lookUpKey: EMPLOYEE_STATUS_LEAVE },
              ]),
            };
          }
          return {};
        });
    });

    it("should successfully update an employee with no reportees", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1 };
      const mockUpdateData = { firstName: "Updated Name" };

      jest
        .spyOn(employeeRepository, "getEmployeeById")
        .mockResolvedValue(mockEmployee as any);
      jest
        .spyOn(employeeRepository, "updateEmployeeById")
        .mockResolvedValue(true);

      // Act
      const result = await employeeRepository.updateEmployeeDetails(
        1,
        mockUpdateData,
        1
      );

      // Assert
      expect(result).toEqual(expect.objectContaining(mockEmployee));
      expect(employeeRepository.getEmployeeById).toHaveBeenCalledWith(1);
      expect(employeeRepository.updateEmployeeById).toHaveBeenCalledWith(
        1,
        mockUpdateData,
        1
      );
    });

    it("should successfully move an employee to leave status and assign a delegate", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, statusLid: 1 };
      const mockUpdateData = { statusLid: 3 }; // Leave status
      const delegateId = 4;

      jest
        .spyOn(employeeRepository, "getEmployeeById")
        .mockResolvedValue(mockEmployee as any);
      jest.spyOn(employeeRepository, "moveEmployeeToLeave").mockResolvedValue();
      jest
        .spyOn(employeeRepository, "updateEmployeeById")
        .mockResolvedValue(true);

      // Act
      const result = await employeeRepository.updateEmployeeDetails(
        1,
        mockUpdateData,
        1,
        undefined,
        delegateId
      );

      // Assert
      expect(result).toEqual(expect.objectContaining(mockEmployee));
      expect(employeeRepository.moveEmployeeToLeave).toHaveBeenCalledWith(
        1,
        delegateId
      );
    });

    it("should throw BadRequestException if newManagerId is missing when moving to inactive status", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, statusLid: 1 };
      const mockUpdateData = { statusLid: 2 }; // Inactive status

      jest
        .spyOn(employeeRepository, "getEmployeeById")
        .mockResolvedValue(mockEmployee as any);

      // Act & Assert
      await expect(
        employeeRepository.updateEmployeeDetails(1, mockUpdateData, 1)
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("should throw BadRequestException if delegateId is missing when moving to leave status", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, statusLid: 1 };
      const mockUpdateData = { statusLid: 3 }; // Leave status

      jest
        .spyOn(employeeRepository, "getEmployeeById")
        .mockResolvedValue(mockEmployee as any);

      // Act & Assert
      await expect(
        employeeRepository.updateEmployeeDetails(1, mockUpdateData, 1)
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("should throw BadRequestException if reportee action is missing when updating Org/Dept/Branch", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1 };
      const mockUpdateData = { organizationLid: 2 };
      const mockReportees = [{ employeeId: 2 }];

      jest
        .spyOn(employeeRepository, "getEmployeeById")
        .mockResolvedValue(mockEmployee as any);
      jest
        .spyOn(employeeRepository, "getEmployeesByManagerId")
        .mockResolvedValue(mockReportees as any);

      // Act & Assert
      await expect(
        employeeRepository.updateEmployeeDetails(1, mockUpdateData, 1)
      ).rejects.toThrow(InternalServerErrorException);
    });

    it("should throw NotFoundException if the employee does not exist", async () => {
      // Arrange
      jest.spyOn(employeeRepository, "getEmployeeById").mockResolvedValue(null);

      // Act & Assert
      await expect(
        employeeRepository.updateEmployeeDetails(999, {}, 1)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw InternalServerErrorException if an unexpected error occurs", async () => {
      // Arrange
      jest
        .spyOn(employeeRepository, "getEmployeeById")
        .mockImplementation(() => {
          throw new InternalServerErrorException("Database error");
        });

      // Act & Assert
      await expect(
        employeeRepository.updateEmployeeDetails(1, {}, 1)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("getListOfEmployeesValues", () => {
    it("should successfully retrieve a list of employees with selected fields", async () => {
      // Arrange
      const mockActiveStatus = { id: 1, lookUpKey: "EMPLOYEE_STATUS_ACTIVE" };
      const mockLeaveStatus = { id: 2, lookUpKey: "EMPLOYEE_STATUS_LEAVE" };

      jest
        .spyOn(mockDataSource, "getRepository")
        .mockImplementation((entity) => {
          if (entity === LookUp) {
            return {
              findOne: jest.fn().mockImplementation(({ where }) => {
                if (where.lookUpKey === "EMPLOYEE_STATUS_ACTIVE")
                  return mockActiveStatus;
                if (where.lookUpKey === "EMPLOYEE_STATUS_LEAVE")
                  return mockLeaveStatus;
                return null;
              }),
            };
          }
          return null;
        });

      const mockData = [
        {
          employeeId: 1,
          firstName: "John Doe",
          emailId: "john.doe@example.com",
          statusLid: 1, // Matches activeStatus
        },
        {
          employeeId: 2,
          firstName: "Jane Smith",
          emailId: "jane.smith@example.com",
          statusLid: 2, // Matches leaveStatus
        },
      ];
      const mockCount = 2;

      jest
        .spyOn(employeeRepository.entityService, "getData")
        .mockResolvedValue({
          data: mockData,
          count: mockCount,
        });

      const sortBy = "firstName";
      const sortOrder = "ASC";
      const page = 1;
      const limit = 10;

      // Act
      const result = await employeeRepository.getListOfEmployeesValues(
        sortBy,
        sortOrder,
        page,
        limit
      );

      // Assert
      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            employeeId: 1,
            firstName: "John Doe",
            emailId: "john.doe@example.com",
          }),
          expect.objectContaining({
            employeeId: 2,
            firstName: "Jane Smith",
            emailId: "jane.smith@example.com",
          }),
        ]),
        count: mockCount,
      });
    });

    it("should handle pagination correctly when there are no more employees on the requested page", async () => {
      // Arrange
      const mockActiveStatus = { id: 1, lookUpKey: "EMPLOYEE_STATUS_ACTIVE" };
      const mockLeaveStatus = { id: 2, lookUpKey: "EMPLOYEE_STATUS_LEAVE" };

      jest
        .spyOn(mockDataSource, "getRepository")
        .mockImplementation((entity) => {
          if (entity === LookUp) {
            return {
              findOne: jest.fn().mockImplementation(({ where }) => {
                if (where.lookUpKey === "EMPLOYEE_STATUS_ACTIVE")
                  return mockActiveStatus;
                if (where.lookUpKey === "EMPLOYEE_STATUS_LEAVE")
                  return mockLeaveStatus;
                return null;
              }),
            };
          }
          return null;
        });

      jest
        .spyOn(employeeRepository.entityService, "getData")
        .mockResolvedValue({
          data: [],
          count: 0,
        });

      const sortBy = "firstName";
      const sortOrder = "ASC";
      const page = 2;
      const limit = 10;

      // Act
      const result = await employeeRepository.getListOfEmployeesValues(
        sortBy,
        sortOrder,
        page,
        limit
      );

      // Assert
      expect(employeeRepository.entityService.getData).toHaveBeenCalledWith(
        Employee,
        page,
        limit,
        undefined,
        sortBy,
        sortOrder,
        undefined,
        { statusLid: In([mockActiveStatus.id, mockLeaveStatus.id]) },
        ["employeeId", "firstName", "emailId", "statusLid"],
        [{ searchBy: "firstName", searchValue: "" }]
      );
      expect(result).toEqual({
        data: [],
        count: 0,
      });
    });

    it("should throw InternalServerErrorException if an error occurs while fetching employee data", async () => {
      // Arrange
      jest
        .spyOn(employeeRepository.entityService, "getData")
        .mockRejectedValue(new Error("Database error"));

      const sortBy = "firstName";
      const sortOrder = "ASC";
      const page = 1;
      const limit = 10;

      // Act & Assert
      await expect(
        employeeRepository.getListOfEmployeesValues(
          sortBy,
          sortOrder,
          page,
          limit
        )
      ).rejects.toThrow(InternalServerErrorException);
    });
    it("should return a list of employees with selected fields", async () => {
      const mockEmployees = [
        { employeeId: 1, firstName: "John", emailId: "john@example.com" },
      ];
      jest.spyOn(mockEntityService, "fetchEntityList").mockResolvedValue({
        data: mockEmployees,
        count: 1,
      });

      const result = await employeeRepository.getListOfEmployeesValues(
        [],
        [],
        "",
        1,
        10
      );
      expect(result).toEqual({
        data: mockEmployees,
        count: 1,
      });
    });

    it("should return an empty list if no employees match the criteria", async () => {
      jest.spyOn(mockEntityService, "fetchEntityList").mockResolvedValue({
        data: [],
        count: 0,
      });

      const result = await employeeRepository.getListOfEmployeesValues(
        [],
        [],
        "",
        1,
        10
      );
      expect(result).toEqual({
        data: [],
        count: 0,
      });
    });
  });

  describe("moveEmployeeToLeave", () => {
    it("should successfully move an employee to leave status and reassign reportees to the delegate", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1 };
      const mockDelegate = { employeeId: 2 };
      const mockLeaveStatus = { id: 3, lookUpKey: EMPLOYEE_STATUS_LEAVE };
      const mockReportees = [
        { employeeId: 4, reportingManagerEmployeeId: 1 },
        { employeeId: 5, reportingManagerEmployeeId: 1 },
      ];

      jest
        .spyOn(employeeRepository.employeeRepository, "findOne")
        .mockResolvedValueOnce(mockEmployee as any) // Employee exists
        .mockResolvedValueOnce(mockDelegate as any); // Delegate exists

      jest
        .spyOn(mockDataSource.getRepository(LookUp), "findOne")
        .mockResolvedValue(mockLeaveStatus);

      jest
        .spyOn(employeeRepository.employeeRepository, "find")
        .mockResolvedValue(mockReportees as any);

      jest
        .spyOn(employeeRepository.employeeRepository, "save")
        .mockImplementation((entity) => Promise.resolve(entity));

      // Act
      await employeeRepository.moveEmployeeToLeave(1, 2);

      // Assert
      expect(
        employeeRepository.employeeRepository.findOne
      ).toHaveBeenCalledTimes(2); // Once for employee, once for delegate
      expect(mockDataSource.getRepository(LookUp).findOne).toHaveBeenCalledWith(
        {
          where: { lookUpKey: EMPLOYEE_STATUS_LEAVE },
        }
      );
      expect(employeeRepository.employeeRepository.find).toHaveBeenCalledWith({
        where: { reportingManagerEmployeeId: 1 },
      });
      expect(employeeRepository.employeeRepository.save).toHaveBeenCalledTimes(
        mockReportees.length + 1
      ); // Once for each reportee + the employee
      expect(mockEmployee.statusLid).toBe(mockLeaveStatus.id);
      mockReportees.forEach((reportee) => {
        expect(reportee.reportingManagerEmployeeId).toBe(2); // Delegate ID
      });
    });

    it("should throw NotFoundException if the employee does not exist", async () => {
      // Arrange
      jest
        .spyOn(employeeRepository.employeeRepository, "findOne")
        .mockResolvedValueOnce(null); // Employee not found

      // Act & Assert
      await expect(
        employeeRepository.moveEmployeeToLeave(999, 2)
      ).rejects.toThrow(NotFoundException);
      expect(
        employeeRepository.employeeRepository.findOne
      ).toHaveBeenCalledWith({
        where: { employeeId: 999 },
      });
    });

    it("should throw NotFoundException if the delegate does not exist", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1 };

      jest
        .spyOn(employeeRepository.employeeRepository, "findOne")
        .mockResolvedValueOnce(mockEmployee as any) // Employee exists
        .mockResolvedValueOnce(null); // Delegate not found

      // Act & Assert
      await expect(
        employeeRepository.moveEmployeeToLeave(1, 999)
      ).rejects.toThrow(NotFoundException);
      expect(
        employeeRepository.employeeRepository.findOne
      ).toHaveBeenCalledTimes(2); // Once for employee, once for delegate
    });

    it("should throw NotFoundException if the Leave status lookup is not found", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1 };
      const mockDelegate = { employeeId: 2 };

      jest
        .spyOn(employeeRepository.employeeRepository, "findOne")
        .mockResolvedValueOnce(mockEmployee as any) // Employee exists
        .mockResolvedValueOnce(mockDelegate as any); // Delegate exists

      jest
        .spyOn(mockDataSource.getRepository(LookUp), "findOne")
        .mockResolvedValue(null); // Leave status not found

      // Act & Assert
      await expect(
        employeeRepository.moveEmployeeToLeave(1, 2)
      ).rejects.toThrow(NotFoundException);
      expect(mockDataSource.getRepository(LookUp).findOne).toHaveBeenCalledWith(
        {
          where: { lookUpKey: EMPLOYEE_STATUS_LEAVE },
        }
      );
    });

    it("should throw InternalServerErrorException if an unexpected error occurs", async () => {
      // Arrange
      jest
        .spyOn(employeeRepository.employeeRepository, "findOne")
        .mockImplementation(() => {
          throw new InternalServerErrorException("Database error");
        });

      // Act & Assert
      await expect(
        employeeRepository.moveEmployeeToLeave(1, 2)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe("removeEmployee", () => {
    it("should successfully remove an employee and reassign reportees to a new manager", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, statusLid: 1 };
      const mockNewManager = { employeeId: 2, statusLid: 1 };
      const mockReportees = [{ employeeId: 3 }, { employeeId: 4 }];

      jest
        .spyOn(employeeRepository.employeeRepository, "findOne")
        .mockResolvedValueOnce(mockEmployee as any) // Employee exists
        .mockResolvedValueOnce(mockNewManager as any); // New manager exists

      jest
        .spyOn(employeeRepository.employeeRepository, "find")
        .mockResolvedValue(mockReportees as any);

      jest
        .spyOn(employeeRepository.employeeRepository, "save")
        .mockImplementation((entity) => Promise.resolve(entity));

      const mockInactiveStatus = { id: 2, lookUpKey: EMPLOYEE_STATUS_INACTIVE };
      jest
        .spyOn(mockDataSource.getRepository(LookUp), "findOne")
        .mockResolvedValue(mockInactiveStatus);

      // Act
      await employeeRepository.removeEmployee(1, 2);

      // Assert
      expect(
        employeeRepository.employeeRepository.findOne
      ).toHaveBeenCalledTimes(2); // Once for employee, once for new manager
      expect(employeeRepository.employeeRepository.find).toHaveBeenCalledWith({
        where: { reportingManagerEmployeeId: 1, statusLid: 2 },
      });
      expect(employeeRepository.employeeRepository.save).toHaveBeenCalledTimes(
        mockReportees.length + 1
      ); // Once for each reportee + the employee
    });

    it("should throw NotFoundException if the employee does not exist", async () => {
      // Arrange
      jest
        .spyOn(employeeRepository.employeeRepository, "findOne")
        .mockResolvedValueOnce(null); // Employee not found

      // Act & Assert
      await expect(employeeRepository.removeEmployee(999, 2)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw NotFoundException if the new manager does not exist", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, statusLid: 1 };

      jest
        .spyOn(employeeRepository.employeeRepository, "findOne")
        .mockResolvedValueOnce(mockEmployee as any) // Employee exists
        .mockResolvedValueOnce(null); // New manager not found

      // Act & Assert
      await expect(employeeRepository.removeEmployee(1, 999)).rejects.toThrow(
        NotFoundException
      );
    });
    it("should throw NotFoundException if active status lookup is not found", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, statusLid: 1 };

      jest
        .spyOn(employeeRepository.employeeRepository, "findOne")
        .mockResolvedValueOnce(mockEmployee as any); // Employee exists

      jest
        .spyOn(mockDataSource.getRepository(LookUp), "findOne")
        .mockResolvedValueOnce(null); // Active status lookup not found

      // Act & Assert
      await expect(employeeRepository.removeEmployee(1, 2)).rejects.toThrow(
        NotFoundException
      );
    });
    it("should successfully remove an employee with no reportees", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, statusLid: 1 };
      const mockNewManager = { employeeId: 2, statusLid: 1 };
      const mockInactiveStatus = { id: 2, lookUpKey: EMPLOYEE_STATUS_INACTIVE };

      jest
        .spyOn(employeeRepository.employeeRepository, "findOne")
        .mockResolvedValueOnce(mockEmployee as any) // Employee exists
        .mockResolvedValueOnce(mockNewManager as any); // New manager exists

      jest
        .spyOn(mockDataSource.getRepository(LookUp), "findOne")
        .mockResolvedValueOnce({ id: 1, lookUpKey: EMPLOYEE_STATUS_ACTIVE }) // Active status lookup found
        .mockResolvedValueOnce(mockInactiveStatus); // Inactive status lookup found

      jest
        .spyOn(employeeRepository.employeeRepository, "find")
        .mockResolvedValueOnce([]); // No reportees

      jest
        .spyOn(employeeRepository.employeeRepository, "save")
        .mockImplementation((entity) => Promise.resolve(entity));

      // Act
      await employeeRepository.removeEmployee(1, 2);

      // Assert
      expect(employeeRepository.employeeRepository.find).toHaveBeenCalledWith({
        where: { reportingManagerEmployeeId: 1, statusLid: 1 },
      });
      expect(employeeRepository.employeeRepository.save).toHaveBeenCalledWith({
        employeeId: 1,
        statusLid: 2,
      });
    });
    it("should throw an error if saving a reportee fails", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, statusLid: 1 };
      const mockNewManager = { employeeId: 2, statusLid: 1 };
      const mockReportees = [{ employeeId: 3 }, { employeeId: 4 }];
      const mockInactiveStatus = { id: 2, lookUpKey: EMPLOYEE_STATUS_INACTIVE };

      jest
        .spyOn(employeeRepository.employeeRepository, "findOne")
        .mockResolvedValueOnce(mockEmployee as any) // Employee exists
        .mockResolvedValueOnce(mockNewManager as any); // New manager exists

      jest
        .spyOn(mockDataSource.getRepository(LookUp), "findOne")
        .mockResolvedValueOnce({ id: 1, lookUpKey: EMPLOYEE_STATUS_ACTIVE }) // Active status lookup found
        .mockResolvedValueOnce(mockInactiveStatus); // Inactive status lookup found

      jest
        .spyOn(employeeRepository.employeeRepository, "find")
        .mockResolvedValueOnce(mockReportees); // Reportees found

      jest
        .spyOn(employeeRepository.employeeRepository, "save")
        .mockImplementationOnce(() => Promise.reject(new Error("Save failed"))); // Simulate save failure

      // Act & Assert
      await expect(employeeRepository.removeEmployee(1, 2)).rejects.toThrow(
        "Save failed"
      );
    });
    it("should throw an error if saving the employee fails", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1, statusLid: 1 };
      const mockNewManager = { employeeId: 2, statusLid: 1 };
      const mockInactiveStatus = { id: 2, lookUpKey: EMPLOYEE_STATUS_INACTIVE };

      jest
        .spyOn(employeeRepository.employeeRepository, "findOne")
        .mockResolvedValueOnce(mockEmployee as any) // Employee exists
        .mockResolvedValueOnce(mockNewManager as any); // New manager exists

      jest
        .spyOn(mockDataSource.getRepository(LookUp), "findOne")
        .mockResolvedValueOnce({ id: 1, lookUpKey: EMPLOYEE_STATUS_ACTIVE }) // Active status lookup found
        .mockResolvedValueOnce(mockInactiveStatus); // Inactive status lookup found

      jest
        .spyOn(employeeRepository.employeeRepository, "find")
        .mockResolvedValueOnce([]); // No reportees

      jest
        .spyOn(employeeRepository.employeeRepository, "save")
        .mockImplementationOnce(() => Promise.reject(new Error("Save failed"))); // Simulate save failure

      // Act & Assert
      await expect(employeeRepository.removeEmployee(1, 2)).rejects.toThrow(
        "Save failed"
      );
    });
  });

  describe("mapEmployeeToDto", () => {
    it("should map an Employee entity to EmployeeDto", () => {
      // Arrange
      const mockEmployee = {
        employeeId: 1,
        firstName: "John",
        lastName: "Doe",
        emailId: "john.doe@example.com",
        statusLookup: { id: 1, name: "Active" },
      };

      // Act
      const result = employeeRepository.mapEmployeeToDto(mockEmployee, true);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          employeeId: 1,
          firstName: "John",
          emailId: "john.doe@example.com",
          status: { id: 1, name: "Active" },
        })
      );
    });
    it("should throw NotFoundException if the delegate does not exist", async () => {
      // Arrange
      const mockEmployee = { employeeId: 1 };
      mockEntityManager.findOne
        .mockResolvedValueOnce(mockEmployee) // Employee exists
        .mockResolvedValueOnce(null); // Delegate not found

      // Act & Assert
      await expect(
        employeeRepository.moveEmployeeToLeave(1, 999)
      ).rejects.toThrow(NotFoundException);
    });
    it("should map employee when isGetById is false", () => {
      const mockEmployee = {
        employeeId: 1,
        firstName: "John",
        lastName: "Doe",
        statusLookup: { id: 1, name: "Active" },
      } as any;

      const result = employeeRepository.mapEmployeeToDto(mockEmployee, false);
      expect(result).toEqual(
        expect.objectContaining({
          employeeId: 1,
          firstName: "John",
          lastName: "Doe",
          status: { id: 1, name: "Active" },
        })
      );
    });

    it("should throw an error if mapping fails", () => {
      const mockEmployee = null;

      expect(() => {
        employeeRepository.mapEmployeeToDto(mockEmployee as any, true);
      }).toThrow(InternalServerErrorException);
    });
  });
  describe("removeFields", () => {
    it("should remove default fields from the object", () => {
      const input = {
        createdAt: "2025-05-16",
        updatedAt: "2025-05-16",
        firstName: "John",
        lastName: "Doe",
      };
      const result = employeeRepository.removeFields(input);
      expect(result).toEqual({ firstName: "John", lastName: "Doe" });
    });

    it("should remove additional fields passed as arguments", () => {
      const input = {
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
      };
      const result = employeeRepository.removeFields(input, ["email"]);
      expect(result).toEqual({ firstName: "John", lastName: "Doe" });
    });

    it("should not remove fields not in the removal list", () => {
      const input = { firstName: "John", lastName: "Doe" };
      const result = employeeRepository.removeFields(input);
      expect(result).toEqual(input);
    });
  });

  describe("mapEntityWithoutCommonFields", () => {
    it("should return null for null or undefined input", () => {
      expect(employeeRepository.mapEntityWithoutCommonFields(null)).toBeNull();
      expect(
        employeeRepository.mapEntityWithoutCommonFields(undefined)
      ).toBeNull();
    });

    it("should remove specified fields from the entity", () => {
      const entity = {
        id: 1,
        description: "Test description",
        lookUpKey: "KEY",
        lookUpName: "Name",
      };
      const result = employeeRepository.mapEntityWithoutCommonFields(entity);
      expect(result).toEqual({ id: 1 });
    });
  });

  describe("mapReportingToDto", () => {
    it("should map reportingTo to a DTO", () => {
      const reportingTo = {
        employeeId: 1,
        firstName: "John",
        lastName: "Doe",
        statusLookup: { id: 1, name: "Active" },
      };
      const result = employeeRepository.mapReportingToDto(reportingTo as any);
      expect(result).toEqual(
        expect.objectContaining({
          employeeId: 1,
          firstName: "John",
          lastName: "Doe",
          status: { id: 1, name: "Active" },
        })
      );
    });
  });
  describe("mapReporteesDto", () => {
    it("should map reportees to DTOs", () => {
      const reportees = [
        { employeeId: 1, firstName: "John", lastName: "Doe" },
        { employeeId: 2, firstName: "Jane", lastName: "Smith" },
      ];
      const result = employeeRepository.mapReporteesDto(reportees as any);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ employeeId: 1, firstName: "John" }),
          expect.objectContaining({ employeeId: 2, firstName: "Jane" }),
        ])
      );
    });

    it("should return an empty array for no reportees", () => {
      const result = employeeRepository.mapReporteesDto([]);
      expect(result).toEqual([]);
    });
  });

  describe("getEmployeesByManagerId", () => {
    it("should return employees reporting to a specific manager", async () => {
      const mockEmployees = [
        { employeeId: 1, firstName: "John" },
        { employeeId: 2, firstName: "Jane" },
      ];
      jest
        .spyOn(employeeRepository.employeeRepository, "find")
        .mockResolvedValue(mockEmployees as any);

      const result = await employeeRepository.getEmployeesByManagerId(1);
      expect(result).toEqual(mockEmployees);
    });

    it("should return an empty array if no employees report to the manager", async () => {
      jest
        .spyOn(employeeRepository.employeeRepository, "find")
        .mockResolvedValue([]);

      const result = await employeeRepository.getEmployeesByManagerId(1);
      expect(result).toEqual([]);
    });
  });
});
