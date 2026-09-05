import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { EmployeeService } from "./employee.service";
import { EmployeeRepository } from "./employee.repository";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { EmployeeDto } from "./dto/employee.dto";
import { infoMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";

describe("EmployeeService", () => {
  let service: EmployeeService;
  let repository: jest.Mocked<EmployeeRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeeService,
        {
          provide: LookUpValidationService,
          useValue: {
            validateDynamicLookupValues: jest.fn(),
          },
        },
        {
          provide: MasterValidationService,
          useValue: {
            validateMasterIds: jest.fn(),
          },
        },
        {
          provide: EmployeeRepository,
          useValue: {
            addEmployee: jest.fn(),
            getEmployees: jest.fn(),
            getEmployeeById: jest.fn(),
            updateEmployeeDetails: jest.fn(),
            deleteEmployeeById: jest.fn(),
            getListOfEmployeesValues: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EmployeeService>(EmployeeService);
    repository = module.get(EmployeeRepository);
  });

  describe("addEmployee", () => {
    it("should delegate to the repository and return the created employee", async () => {
      const createEmployeeDto = new CreateEmployeeDto();
      const userId = 1;
      const createdEmployee = new EmployeeDto({ id: 1, name: "John Doe" });

      repository.addEmployee.mockResolvedValue(createdEmployee);

      const result = await service.addEmployee(createEmployeeDto, userId);

      expect(repository.addEmployee).toHaveBeenCalledWith(
        createEmployeeDto,
        userId
      );
      expect(result).toBe(createdEmployee);
    });
  });

  describe("getEmployees", () => {
    it("should retrieve employees with pagination and sorting", async () => {
      const employees = [
        new EmployeeDto({ id: 1, name: "John Doe" }),
        new EmployeeDto({ id: 2, name: "Jane Smith" }),
      ];
      const count = 2;

      repository.getEmployees.mockResolvedValue({ data: employees, count });

      const result = await service.getEmployees(
        "firstName",
        "ASC",
        1,
        10,
        "search"
      );

      expect(repository.getEmployees).toHaveBeenCalledWith(
        [],
        [],
        1,
        10,
        "search"
      );
      expect(result).toEqual({ data: employees, count });
    });
  });

  describe("getEmployeeById", () => {
    it("should return an employee if found", async () => {
      const employee = new EmployeeDto();
      repository.getEmployeeById.mockResolvedValue(employee);

      const result = await service.getEmployeeById(1);

      expect(repository.getEmployeeById).toHaveBeenCalledWith(1);
      expect(result).toBe(employee);
    });

    it("should throw NotFoundException if the employee is not found", async () => {
      repository.getEmployeeById.mockResolvedValue(null);

      await expect(service.getEmployeeById(1)).rejects.toThrow(
        new NotFoundException(infoMessages.employeeNotFound)
      );
    });
  });

  describe("updateEmployeeById", () => {
    it("should update an employee and return the updated employee", async () => {
      const updateEmployeeDto = new UpdateEmployeeDto();
      const userId = 1;
      const updatedEmployee = new EmployeeDto();

      repository.updateEmployeeDetails.mockResolvedValue(true);
      jest.spyOn(service, "getEmployeeById").mockResolvedValue(updatedEmployee);

      const result = await service.updateEmployeeById(
        1,
        updateEmployeeDto,
        userId
      );

      expect(repository.updateEmployeeDetails).toHaveBeenCalledWith(
        1,
        updateEmployeeDto,
        userId,
        undefined,
        undefined
      );
      expect(result).toBe(updatedEmployee);
    });

    it("should throw NotFoundException if the employee is not found", async () => {
      const updateEmployeeDto = new UpdateEmployeeDto();
      const userId = 1;

      repository.updateEmployeeDetails.mockResolvedValue(false);

      await expect(
        service.updateEmployeeById(1, updateEmployeeDto, userId)
      ).rejects.toThrow(new NotFoundException(infoMessages.employeeNotFound));
    });
  });

  describe("deleteEmployeeById", () => {
    it("should delete an employee if found", async () => {
      repository.deleteEmployeeById.mockResolvedValue(true);

      await service.deleteEmployeeById(1);

      expect(repository.deleteEmployeeById).toHaveBeenCalledWith(1);
    });

    it("should throw NotFoundException if the employee is not found", async () => {
      repository.deleteEmployeeById.mockResolvedValue(false);

      await expect(service.deleteEmployeeById(1)).rejects.toThrow(
        new NotFoundException(infoMessages.employeeNotFound)
      );
    });
  });

  describe("getListOfEmployeesValues", () => {
    it("should retrieve a list of employee values", async () => {
      const employees = [new EmployeeDto(), new EmployeeDto()];
      const count = 2;

      repository.getListOfEmployeesValues.mockResolvedValue({
        data: employees,
        count,
      });

      const result = await service.getListOfEmployeesValues(
        "firstName",
        "ASC",
        1,
        10,
        "search"
      );

      expect(repository.getListOfEmployeesValues).toHaveBeenCalledWith(
        [],
        [],
        1,
        10,
        "search"
      );
      expect(result).toEqual({ data: employees, count });
    });
  });
});
