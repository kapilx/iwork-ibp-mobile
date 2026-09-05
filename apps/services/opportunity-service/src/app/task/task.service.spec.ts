import { Test, TestingModule } from "@nestjs/testing";
import { DataSource, EntityManager } from "typeorm";
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { TaskService } from "./task.service";
import { TaskRepository } from "./task.repository";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import { LookUpService } from "../../../../org-service/src/app/look-up/look-up.service";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import {
  DEFAULT_TASK_STATUS,
  IS_EDITABLE,
  IS_NOT_EDITABLE,
} from "../../../../../../libs/service-lib/src/lib/constants";

const mockTaskRepository = () => ({
  createTask: jest.fn(),
  createTaskDocuments: jest.fn(),
  getTasks: jest.fn(),
  getTaskById: jest.fn(),
  updateTask: jest.fn(),
  updateTaskDocuments: jest.fn(),
  deleteTaskById: jest.fn(),
  getTasksByOpportunityAndActivity: jest.fn(),
});

const mockLookUpValidation = () => ({
  validateDynamicLookupValues: jest.fn(),
});

const mockMasterValidation = () => ({
  validateMasterIds: jest.fn(),
});

const mockLookUpService = () => ({
  getLookUpsByKey: jest.fn(),
});

const mockDataSource = () => ({
  transaction: jest.fn(),
});

describe("TaskService", () => {
  let taskService: TaskService;
  let taskRepository: jest.Mocked<ReturnType<typeof mockTaskRepository>>;
  let lookUpValidation: jest.Mocked<ReturnType<typeof mockLookUpValidation>>;
  let masterValidation: jest.Mocked<ReturnType<typeof mockMasterValidation>>;
  let lookUpService: jest.Mocked<ReturnType<typeof mockLookUpService>>;
  let dataSource: ReturnType<typeof mockDataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        { provide: TaskRepository, useFactory: mockTaskRepository },
        { provide: LookUpValidationService, useFactory: mockLookUpValidation },
        { provide: MasterValidationService, useFactory: mockMasterValidation },
        { provide: LookUpService, useFactory: mockLookUpService },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    taskService = module.get<TaskService>(TaskService);
    taskRepository = module.get(TaskRepository);
    lookUpValidation = module.get(LookUpValidationService);
    masterValidation = module.get(MasterValidationService);
    lookUpService = module.get(LookUpService);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createTask", () => {
    it("should create a task and documents successfully", async () => {
      const task = { id: 1 };
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      lookUpService.getLookUpsByKey.mockResolvedValue([{ id: 99 }]);
      taskRepository.createTask.mockResolvedValue(task);
      taskRepository.createTaskDocuments.mockResolvedValue(undefined);

      const createTaskDto: CreateTaskDto = {
        taskName: "Test",
        documents: [{ documentId: 2 }],
      } as any;

      const result = await taskService.createTask(createTaskDto);

      expect(result).toEqual({ id: 1 });
      expect(lookUpValidation.validateDynamicLookupValues).toHaveBeenCalled();
      expect(masterValidation.validateMasterIds).toHaveBeenCalled();
      expect(lookUpService.getLookUpsByKey).toHaveBeenCalledWith(
        DEFAULT_TASK_STATUS
      );
      expect(taskRepository.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          taskName: "Test",
          taskStatusLid: 99,
          taskIsEditable: IS_EDITABLE,
        }),
        expect.any(Object)
      );
      expect(taskRepository.createTaskDocuments).toHaveBeenCalledWith(
        [{ documentId: 2 }],
        1,
        expect.any(Object)
      );
    });

    it("should create a task without documents", async () => {
      const task = { id: 1 };
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      lookUpService.getLookUpsByKey.mockResolvedValue([{ id: 99 }]);
      taskRepository.createTask.mockResolvedValue(task);

      const createTaskDto: CreateTaskDto = {
        taskName: "Test",
        documents: [],
      } as any;

      const result = await taskService.createTask(createTaskDto);

      expect(result).toEqual({ id: 1 });
      expect(taskRepository.createTaskDocuments).not.toHaveBeenCalled();
    });

    it("should set taskIsEditable to IS_NOT_EDITABLE if opportunityId or activityId present", async () => {
      const task = { id: 1 };
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      lookUpService.getLookUpsByKey.mockResolvedValue([{ id: 99 }]);
      taskRepository.createTask.mockResolvedValue(task);

      const createTaskDto: CreateTaskDto = {
        taskName: "Test",
        opportunityId: 5,
        documents: [],
      } as any;

      await taskService.createTask(createTaskDto);

      expect(taskRepository.createTask).toHaveBeenCalledWith(
        expect.objectContaining({
          taskIsEditable: IS_NOT_EDITABLE,
        }),
        expect.any(Object)
      );
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      lookUpService.getLookUpsByKey.mockResolvedValue([{ id: 99 }]);
      taskRepository.createTask.mockRejectedValue(
        new NotFoundException("Not found")
      );

      await expect(
        taskService.createTask({ taskName: "Test" } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException on other errors", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      lookUpService.getLookUpsByKey.mockResolvedValue([{ id: 99 }]);
      taskRepository.createTask.mockRejectedValue(new Error("Some error"));

      await expect(
        taskService.createTask({ taskName: "Test" } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it("should use provided entityManager if passed", async () => {
      const task = { id: 1 };
      const entityManager = {} as EntityManager;
      lookUpValidation.validateDynamicLookupValues.mockResolvedValue(undefined);
      masterValidation.validateMasterIds.mockResolvedValue(undefined);
      lookUpService.getLookUpsByKey.mockResolvedValue([{ id: 99 }]);
      taskRepository.createTask.mockResolvedValue(task);
      taskRepository.createTaskDocuments.mockResolvedValue(undefined);

      const createTaskDto: CreateTaskDto = {
        taskName: "Test",
        documents: [{ documentId: 2 }],
      } as any;

      const result = await taskService.createTask(createTaskDto, entityManager);

      expect(result).toEqual({ id: 1 });
      expect(taskRepository.createTask).toHaveBeenCalledWith(
        expect.objectContaining({ taskName: "Test" }),
        entityManager
      );
      expect(taskRepository.createTaskDocuments).toHaveBeenCalledWith(
        [{ documentId: 2 }],
        1,
        entityManager
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe("getTasks", () => {
    it("should return tasks with pagination", async () => {
      taskRepository.getTasks.mockResolvedValue({ data: [], count: 0 });

      const result = await taskService.getTasks(
        1,
        10,
        "",
        "",
        1,
        "",
        false,
        undefined,
        undefined
      );

      expect(result).toEqual({ data: [], count: 0 });
      expect(taskRepository.getTasks).toHaveBeenCalled();
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      taskRepository.getTasks.mockRejectedValue(
        new NotFoundException("Not found")
      );

      await expect(
        taskService.getTasks(1, 10, "", "", 1, "", false, undefined, undefined)
      ).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw Error with custom message on other errors", async () => {
      taskRepository.getTasks.mockRejectedValue(new Error("fail"));

      await expect(
        taskService.getTasks(1, 10, "", "", 1, "", false, undefined, undefined)
      ).rejects.toThrow(
        errorMessages.taskListRetrievalFailed
      );
    });
  });

  describe("getTaskById", () => {
    it("should return task by id", async () => {
      taskRepository.getTaskById.mockResolvedValue({ id: 1 });

      const result = await taskService.getTaskById(1);

      expect(result).toEqual({ id: 1 });
      expect(taskRepository.getTaskById).toHaveBeenCalledWith(1);
    });

    it("should throw NotFoundException if task not found", async () => {
      taskRepository.getTaskById.mockResolvedValue(undefined);

      await expect(taskService.getTaskById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException on other errors", async () => {
      taskRepository.getTaskById.mockRejectedValue(new Error("fail"));

      await expect(taskService.getTaskById(1)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("updateTask", () => {
    it("should update task and documents successfully", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      taskRepository.updateTask.mockResolvedValue(undefined);
      taskRepository.updateTaskDocuments.mockResolvedValue(undefined);

      const updateTaskDto: UpdateTaskDto = {
        taskName: "Updated",
        documents: [{ documentId: 2 }],
      } as any;

      const result = await taskService.updateTask(1, updateTaskDto);

      expect(result).toEqual({ id: 1 });
      expect(taskRepository.updateTask).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ taskName: "Updated" }),
        expect.any(Object)
      );
      expect(taskRepository.updateTaskDocuments).toHaveBeenCalledWith(
        [{ documentId: 2 }],
        1,
        expect.any(Object)
      );
    });

    it("should update task without documents", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      taskRepository.updateTask.mockResolvedValue(undefined);

      const updateTaskDto: UpdateTaskDto = {
        taskName: "Updated",
        documents: [],
      } as any;

      const result = await taskService.updateTask(1, updateTaskDto);

      expect(result).toEqual({ id: 1 });
      expect(taskRepository.updateTaskDocuments).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      taskRepository.updateTask.mockRejectedValue(
        new NotFoundException("Not found")
      );

      await expect(
        taskService.updateTask(1, { taskName: "fail" } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException on other errors", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      taskRepository.updateTask.mockRejectedValue(new Error("fail"));

      await expect(
        taskService.updateTask(1, { taskName: "fail" } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it("should use provided entityManager if passed", async () => {
      const entityManager = {} as EntityManager;
      taskRepository.updateTask.mockResolvedValue(undefined);
      taskRepository.updateTaskDocuments.mockResolvedValue(undefined);

      const updateTaskDto: UpdateTaskDto = {
        taskName: "Updated",
        documents: [{ documentId: 2 }],
      } as any;

      const result = await taskService.updateTask(
        1,
        updateTaskDto,
        entityManager
      );

      expect(result).toEqual({ id: 1 });
      expect(taskRepository.updateTask).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ taskName: "Updated" }),
        entityManager
      );
      expect(taskRepository.updateTaskDocuments).toHaveBeenCalledWith(
        [{ documentId: 2 }],
        1,
        entityManager
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe("completeTask", () => {
    it("should complete task successfully", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) => cb({} as EntityManager));
      taskRepository.completeTask.mockResolvedValue(undefined);

      const result = await taskService.completeTask(1);

      expect(result).toEqual({ id: 1 });
      expect(taskRepository.completeTask).toHaveBeenCalled();
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) => cb({} as EntityManager));
      taskRepository.completeTask.mockRejectedValue(new NotFoundException("not"));

      await expect(taskService.completeTask(1)).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException on other errors", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) => cb({} as EntityManager));
      taskRepository.completeTask.mockRejectedValue(new Error("fail"));

      await expect(taskService.completeTask(1)).rejects.toThrow(BadRequestException);
    });
  });

  describe("deleteTaskById", () => {
    it("should delete task by id", async () => {
      taskRepository.deleteTaskById.mockResolvedValue(undefined);

      await expect(taskService.deleteTaskById(1)).resolves.toBeUndefined();
      expect(taskRepository.deleteTaskById).toHaveBeenCalledWith(1);
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      taskRepository.deleteTaskById.mockRejectedValue(
        new NotFoundException("Not found")
      );

      await expect(taskService.deleteTaskById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException on other errors", async () => {
      taskRepository.deleteTaskById.mockRejectedValue(new Error("fail"));

      await expect(taskService.deleteTaskById(1)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("getTasksByOpportunityAndActivity", () => {
    it("should return tasks for given opportunity and activity", async () => {
      taskRepository.getTasksByOpportunityAndActivity.mockResolvedValue([
        { id: 1 },
      ]);

      const result = await taskService.getTasksByOpportunityAndActivity(1, 2);

      expect(result).toEqual([{ id: 1 }]);
      expect(
        taskRepository.getTasksByOpportunityAndActivity
      ).toHaveBeenCalledWith(1, 2);
    });

    it("should throw InternalServerErrorException on error", async () => {
      taskRepository.getTasksByOpportunityAndActivity.mockRejectedValue(
        new Error("fail")
      );

      await expect(
        taskService.getTasksByOpportunityAndActivity(1, 2)
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
