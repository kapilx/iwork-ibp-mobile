import { Test, TestingModule } from "@nestjs/testing";
import { EmployeeController } from "./employee.controller";
import { EmployeeService } from "./employee.service";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { GetEmployeesDto } from "./dto/get-empolyees-query.dto";
import { EmployeeDto } from "./dto/employee.dto";
import { HttpStatus, NotFoundException } from "@nestjs/common";
import { AuthGuard } from "../../../../../services/auth-service/src/guards/auth.guard";
import { JwtService } from "@nestjs/jwt";
import { createErrorResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { successMessage } from "../../../../../../libs/service-lib/src/lib/messages";

describe("EmployeeController", () => {
  let controller: EmployeeController;
  let service: EmployeeService;
  let authGuard: AuthGuard;
  let jwtService: JwtService;

  const mockEmployeeService = {
    addEmployee: jest.fn(),
    getEmployees: jest.fn(),
    getEmployeeById: jest.fn(),
    updateEmployeeById: jest.fn(),
    deleteEmployeeById: jest.fn(),
    getListOfEmployeesValues: jest.fn(),
  };

  const mockRes = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn().mockReturnValue({ userId: 1 }), // Mock implementation of verify
          },
        },
        {
          provide: EmployeeService,
          useValue: mockEmployeeService,
        },
      ],
    }).compile();

    controller = module.get<EmployeeController>(EmployeeController);
    service = module.get<EmployeeService>(EmployeeService);
    authGuard = module.get<AuthGuard>(AuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it("should be defined", () => {
    expect(authGuard).toBeDefined();
  });

  describe("addEmployee", () => {
    it("should create a new employee and return success response", async () => {
      const createEmployeeObject: CreateEmployeeDto = {
        firstName: "John",
        lastName: "Doe",
        emailId: "john.doe@example.com",
        mobile: "9876543210",
        salutationLid: 16,
        verticalId: 1,
        departmentId: 1,
        designationId: 1,
        iirmEmpId: "1",
        roles: [
          {
            roleId: 1,
          },
        ],
        organisationId: 100,
        branchId: 200,
      };

      const employeeObject = new EmployeeDto({
        employeeId: 1,
        ...createEmployeeObject,
      });
      mockEmployeeService.addEmployee.mockResolvedValue(employeeObject);

      await controller.addEmployee(
        createEmployeeObject,
        mockRes as any,
        {} as any
      );

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.CREATED,
        message: successMessage.employeeCreation,
        data: employeeObject,
      });
      expect(mockEmployeeService.addEmployee).toHaveBeenCalledWith(
        createEmployeeObject,
        expect.any(Number)
      );
    });

    it("should return an error response if creation fails", async () => {
      const createEmployeeObject: CreateEmployeeDto = {
        firstName: "John",
        lastName: "Doe",
        emailId: "john.doe@example.com",
        mobile: "9876543210",
        salutationLid: 16,
        locationId: 1,
        verticalId: 1,
        departmentId: 1,
        designationId: 1,
        iirmEmpId: "1",
        iworkRoleId: 1,
        roleId: 1,
        organizationLid: 100,
        branchLid: 200,
        statusLid: 300,
      };

      mockEmployeeService.addEmployee.mockRejectedValue(
        new Error("Database error")
      );

      await controller.addEmployee(
        createEmployeeObject,
        mockRes as any,
        {} as any
      );

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.BAD_REQUEST,
        message: "Database error",
        data: undefined,
      });
    });
  });

  describe("getEmployees", () => {
    it("should return a list of employees", async () => {
      const employees = [
        new EmployeeDto({ employeeId: 1, firstName: "John", lastName: "Doe" }),
        new EmployeeDto({
          employeeId: 2,
          firstName: "Jane",
          lastName: "Smith",
        }),
      ];

      mockEmployeeService.getEmployees.mockResolvedValue({
        data: employees,
        count: 2,
      });

      await controller.getEmployees(mockRes as any, {} as GetEmployeesDto);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: successMessage.employeeListRetrieval,
        data: {
          data: employees,
          count: 2,
        },
      });
    });

    it("should return an error response if fetching employees fails", async () => {
      mockEmployeeService.getEmployees.mockRejectedValue(
        new NotFoundException("Database error")
      );

      await controller.getEmployees(mockRes as any, {} as GetEmployeesDto);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith(
        createErrorResponse(HttpStatus.NOT_FOUND, "Database error")
      );
    });
  });

  describe("getEmployeesListOfValues", () => {
    describe("getEmployeesListOfValues", () => {
      it("should return a list of employee values", async () => {
        // Arrange
        const mockResponse = {
          status: jest.fn().mockReturnThis(), // Mock the status method
          json: jest.fn(), // Mock the json method
        };

        const mockEmployees = {
          data: [
            {
              employeeId: 1,
              firstName: "John Doe",
              emailId: "john.doe@example.com",
            },
            {
              employeeId: 2,
              firstName: "Jane Smith",
              emailId: "jane.smith@example.com",
            },
          ],
          count: 2,
        };

        jest
          .spyOn(mockEmployeeService, "getListOfEmployeesValues")
          .mockResolvedValue(mockEmployees);

        const queries = {
          sortBy: "firstName",
          sortOrder: "ASC",
          page: 1,
          limit: 10,
          search: "",
        };

        // Act
        await controller.getEmployeesListOfValues(mockResponse as any, queries);

        // Assert
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.json).toHaveBeenCalledWith({
          status: 200,
          message: successMessage.employeeListRetrieval,
          data: {
            data: mockEmployees.data,
            count: mockEmployees.count,
          },
        });
      });
    });
  });

  describe("getEmployeeById", () => {
    it("should return an employee by ID", async () => {
      const employee = { employeeId: 1, firstName: "John", lastName: "Doe" };
      mockEmployeeService.getEmployeeById.mockResolvedValue(employee);

      await controller.getEmployeeById(mockRes as any, 1);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: successMessage.employeeRetrieval,
        data: employee,
      });
    });

    it("should return a not found error if the employee does not exist", async () => {
      // Mocking getEmployeeById to throw NotFoundException
      mockEmployeeService.getEmployeeById.mockRejectedValue(
        new NotFoundException("Employee not found")
      );

      await controller.getEmployeeById(mockRes as any, 1);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 400,
        message: "Database error",
        data: undefined,
      });
    });
  });

  describe("updateEmployeeById", () => {
    it("should update an employee by ID", async () => {
      const updateEmployeeObject: UpdateEmployeeDto = { firstName: "Jane" };
      const updatedEmployee = { employeeId: 1, firstName: "Jane" };

      mockEmployeeService.updateEmployeeById.mockResolvedValue(updatedEmployee);

      await controller.updateEmployeeById(
        mockRes as any,
        {} as any,
        1,
        updateEmployeeObject,
        "update",
        2
      );

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: successMessage.employeeUpdate,
        data: updatedEmployee,
      });
    });

    it("should return a bad request error if update fails", async () => {
      const updateEmployeeObject: UpdateEmployeeDto = { firstName: "Jane" };

      mockEmployeeService.updateEmployeeById.mockRejectedValue(
        new Error("Update failed")
      );

      await controller.updateEmployeeById(
        mockRes as any,
        {} as any,
        1,
        updateEmployeeObject,
        "update",
        2
      );

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 400,
        message: "Database error",
        data: undefined,
      });
    });
  });

  describe("deleteEmployeeById", () => {
    it("should delete an employee by ID and return success response", async () => {
      // Mock the service to resolve without returning any data
      mockEmployeeService.deleteEmployeeById.mockResolvedValue(undefined);

      // Call the controller method
      await controller.deleteEmployeeById(mockRes as any, 1);

      // Assert the response
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: HttpStatus.OK,
        message: successMessage.employeeDeletion,
      });

      // Ensure the service method was called with the correct parameter
      expect(mockEmployeeService.deleteEmployeeById).toHaveBeenCalledWith(1);
    });

    it("should return a not found error if the employee does not exist", async () => {
      // Mock the service to throw a NotFoundException
      mockEmployeeService.deleteEmployeeById.mockRejectedValue(
        new NotFoundException("Employee not found")
      );

      // Call the controller method
      await controller.deleteEmployeeById(mockRes as any, 1);

      // Assert the response
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 400,
        message: "Database error",
        data: undefined,
      });

      // Ensure the service method was called with the correct parameter
      expect(mockEmployeeService.deleteEmployeeById).toHaveBeenCalledWith(1);
    });

    it("should return a bad request error if deletion fails due to other reasons", async () => {
      // Mock the service to throw a generic error
      mockEmployeeService.deleteEmployeeById.mockRejectedValue(
        new Error("Database error")
      );

      // Call the controller method
      await controller.deleteEmployeeById(mockRes as any, 1);

      // Assert the response
      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 400,
        message: "Database error",
        data: undefined,
      });

      // Ensure the service method was called with the correct parameter
      expect(mockEmployeeService.deleteEmployeeById).toHaveBeenCalledWith(1);
    });
  });
});
