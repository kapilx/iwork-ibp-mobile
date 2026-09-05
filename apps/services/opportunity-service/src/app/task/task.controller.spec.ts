import { Test, TestingModule } from "@nestjs/testing";
import { TaskController } from "./task.controller";
import { TaskService } from "./task.service";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { GetTasksDto } from "./dto/get-task.dto";
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

describe("TaskController", () => {
  let controller: TaskController;
  let taskService: TaskService;

  const taskServiceMock = {
    createTask: jest.fn(),
    getTasks: jest.fn(),
    getTaskById: jest.fn(),
    updateTask: jest.fn(),
    completeTask: jest.fn(),
    deleteTaskById: jest.fn(),
    getTasksByOpportunityAndActivity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [{ provide: TaskService, useValue: taskServiceMock }],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    taskService = module.get<TaskService>(TaskService);

    jest.clearAllMocks();
  });

  describe("createTask", () => {
    it("should validate required fields and create a task", async () => {
      const res = createMockRes();
      const req = createMockReq(10);
      const dto: CreateTaskDto = { taskName: "test task" } as any;
      taskServiceMock.createTask.mockResolvedValue({ id: 1 });

      await controller.createTask(dto, res as any, req as any);

      expect(taskServiceMock.createTask).toHaveBeenCalledWith({
        ...dto,
        createdBy: 10,
        updatedBy: 10,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 201,
          message: successMessage.taskCreation,
          data: { id: 1 },
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      const req = createMockReq();
      const dto: CreateTaskDto = { taskName: "fail" } as any;
      taskServiceMock.createTask.mockRejectedValue(new Error("fail"));

      await controller.createTask(dto, res as any, req as any);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getTasks", () => {
    it("should return tasks with pagination and validation", async () => {
      const res = createMockRes();
      const req = createMockReq(5);
      const tasks = { data: [{ id: 1 }], count: 1 };
      taskServiceMock.getTasks.mockResolvedValue(tasks);

      await controller.getTasks(
        {
          page: 2,
          limit: 5,
          search: "abc",
          sort: "createdAt:ASC",
          searchBy: "desc",
          showCompleted: true,
        } as GetTasksDto,
        res as any,
        req as any
      );

      expect(taskServiceMock.getTasks).toHaveBeenCalledWith(
        2,
        5,
        "abc",
        "createdAt:ASC",
        5,
        "desc",
        true,
        undefined,
        undefined
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.taskList,
          data: tasks,
        })
      );
    });

    it("should use default values if query params are missing", async () => {
      const res = createMockRes();
      const req = createMockReq(4);
      const tasks = { data: [], count: 0 };
      taskServiceMock.getTasks.mockResolvedValue(tasks);

      await controller.getTasks({} as GetTasksDto, res as any, req as any);

      expect(taskServiceMock.getTasks).toHaveBeenCalledWith(
        DEFAULT_PAGE,
        DEFAULT_LIMIT,
        "",
        "createdAt:DESC",
        4,
        "",
        undefined,
        undefined,
        undefined
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      const req = createMockReq();
      taskServiceMock.getTasks.mockRejectedValue(new Error("fail"));

      await controller.getTasks({} as GetTasksDto, res as any, req as any);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getTaskById", () => {
    it("should return task details with 200", async () => {
      const res = createMockRes();
      taskServiceMock.getTaskById.mockResolvedValue({ id: 1 });

      await controller.getTaskById(1, res as any);

      expect(taskServiceMock.getTaskById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.taskDetails,
          data: { id: 1 },
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      taskServiceMock.getTaskById.mockRejectedValue(new Error("fail"));

      await controller.getTaskById(1, res as any);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("updateTaskById", () => {
    it("should validate required fields and update task", async () => {
      const res = createMockRes();
      const req = createMockReq(7);
      const dto: UpdateTaskDto = { taskName: "updated" } as any;
      taskServiceMock.updateTask.mockResolvedValue({ id: 1 });

      await controller.updateTaskById(1, dto, res as any, req as any);

      expect(taskServiceMock.updateTask).toHaveBeenCalledWith(1, {
        ...dto,
        updatedBy: 7,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.taskUpdation,
          data: { id: 1 },
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      const req = createMockReq();
      taskServiceMock.updateTask.mockRejectedValue(new Error("fail"));

      await controller.updateTaskById(
        1,
        {} as UpdateTaskDto,
        res as any,
        req as any
      );

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("completeTaskById", () => {
    it("should mark task complete and return 200", async () => {
      const res = createMockRes();
      taskServiceMock.completeTask.mockResolvedValue({ id: 1 });

      await controller.completeTaskById(1, res as any);

      expect(taskServiceMock.completeTask).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.taskCompleted,
          data: { id: 1 },
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      taskServiceMock.completeTask.mockRejectedValue(new Error("fail"));

      await controller.completeTaskById(1, res as any);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("deleteTaskById", () => {
    it("should delete task and return 200", async () => {
      const res = createMockRes();
      taskServiceMock.deleteTaskById.mockResolvedValue(undefined);

      await controller.deleteTaskById(1, res as any);

      expect(taskServiceMock.deleteTaskById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.taskDeleted,
          data: null,
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      taskServiceMock.deleteTaskById.mockRejectedValue(new Error("fail"));

      await controller.deleteTaskById(1, res as any);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getTasksByOpportunityAndActivity", () => {
    it("should return tasks for given opportunity and activity", async () => {
      const res = createMockRes();
      const tasks = [{ id: 1 }];
      taskServiceMock.getTasksByOpportunityAndActivity.mockResolvedValue(tasks);

      await controller.getTasksByOpportunityAndActivity(1, 2, res as any);

      expect(
        taskServiceMock.getTasksByOpportunityAndActivity
      ).toHaveBeenCalledWith(1, 2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.tasksFetched,
          data: tasks,
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      taskServiceMock.getTasksByOpportunityAndActivity.mockRejectedValue(
        new Error("fail")
      );

      await controller.getTasksByOpportunityAndActivity(1, 2, res as any);

      expect(res.json).toHaveBeenCalled();
    });
  });
});
