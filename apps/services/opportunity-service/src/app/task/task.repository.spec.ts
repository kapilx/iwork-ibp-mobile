import { Test, TestingModule } from "@nestjs/testing";
import { Repository, EntityManager, DataSource } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { TaskRepository } from "./task.repository";
import { Task } from "../../../../service-lib/src/lib/entities";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { CreateTaskDto, CreateTaskDocumentDto } from "./dto/create-task.dto";

describe("TaskRepository", () => {
  let taskRepository: TaskRepository;
  let taskRepo: jest.Mocked<Repository<Task>>;
  let entityService: jest.Mocked<EntityService>;
  let entityManager: jest.Mocked<EntityManager>;
  let dataSource: { query: jest.Mock };
  let queryBuilder: any;

  beforeEach(async () => {
    queryBuilder = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orWhere: jest.fn().mockReturnThis(),
      setParameters: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskRepository,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
            update: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
          },
        },
        {
          provide: EntityService,
          useValue: {
            fetchEntityList: jest.fn(),
            getLookupValues: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            query: jest.fn(),
          },
        },
      ],
    }).compile();

    taskRepository = module.get(TaskRepository);
    taskRepo = module.get(getRepositoryToken(Task));
    entityService = module.get(EntityService);
    dataSource = module.get(DataSource);

    entityManager = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createTask", () => {
    it("should create a task successfully", async () => {
      const taskDetails: Partial<CreateTaskDto> = {
        taskName: "Task",
        companyId: 1,
        opportunityId: 2,
        activityId: 3,
      };
      jest
        .spyOn(taskRepository, "validateTaskAssociations")
        .mockResolvedValue(undefined);
      entityManager.create.mockReturnValue(taskDetails);
      entityManager.save.mockResolvedValue({ id: 1, ...taskDetails });

      const result = await taskRepository.createTask(
        taskDetails,
        entityManager
      );

      expect(taskRepository.validateTaskAssociations).toHaveBeenCalledWith(
        entityManager,
        1,
        2,
        3
      );
      expect(entityManager.create).toHaveBeenCalledWith(Task, taskDetails);
      expect(entityManager.save).toHaveBeenCalledWith(Task, taskDetails);
      expect(result).toEqual({ id: 1, ...taskDetails });
    });

    it("should throw NotFoundException from validateTaskAssociations", async () => {
      jest
        .spyOn(taskRepository, "validateTaskAssociations")
        .mockRejectedValue(new NotFoundException("not found"));
      await expect(
        taskRepository.createTask({}, entityManager)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException from validateTaskAssociations", async () => {
      jest
        .spyOn(taskRepository, "validateTaskAssociations")
        .mockRejectedValue(new BadRequestException("bad"));
      await expect(
        taskRepository.createTask({}, entityManager)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw generic error", async () => {
      jest
        .spyOn(taskRepository, "validateTaskAssociations")
        .mockResolvedValue(undefined);
      entityManager.create.mockImplementation(() => {
        throw new Error("fail");
      });
      await expect(
        taskRepository.createTask({}, entityManager)
      ).rejects.toThrow("Error creating task: fail");
    });
  });

  describe("createTaskDocuments", () => {
    it("should create task documents successfully", async () => {
      const docs: CreateTaskDocumentDto[] = [{ documentId: 1 }];
      entityManager.findOne.mockResolvedValue({ id: 1 });
      entityManager.save.mockResolvedValue(undefined);

      await expect(
        taskRepository.createTaskDocuments(docs, 1, entityManager)
      ).resolves.toBeUndefined();
      expect(entityManager.save).toHaveBeenCalled();
    });

    it("should throw NotFoundException if document not found", async () => {
      entityManager.findOne.mockResolvedValue(undefined);
      const docs: CreateTaskDocumentDto[] = [{ documentId: 99 }];
      await expect(
        taskRepository.createTaskDocuments(docs, 1, entityManager)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw generic error", async () => {
      entityManager.findOne.mockRejectedValue(new Error("fail"));
      const docs: CreateTaskDocumentDto[] = [{ documentId: 1 }];
      await expect(
        taskRepository.createTaskDocuments(docs, 1, entityManager)
      ).rejects.toThrow("Error creating task document: fail");
    });
  });

  describe("updateTask", () => {
    it("should update task successfully", async () => {
      taskRepo.findOne.mockResolvedValue({ id: 1 });
      jest
        .spyOn(taskRepository, "validateTaskAssociations")
        .mockResolvedValue(undefined);
      entityManager.update.mockResolvedValue(undefined);

      await expect(
        taskRepository.updateTask(1, { taskName: "t" }, entityManager)
      ).resolves.toBeUndefined();
      expect(entityManager.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException if task not found", async () => {
      taskRepo.findOne.mockResolvedValue(undefined);
      await expect(
        taskRepository.updateTask(1, { taskName: "t" }, entityManager)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw error on update failure", async () => {
      taskRepo.findOne.mockResolvedValue({ id: 1 });
      jest
        .spyOn(taskRepository, "validateTaskAssociations")
        .mockResolvedValue(undefined);
      entityManager.update.mockRejectedValue(new Error("fail"));
      await expect(
        taskRepository.updateTask(1, { taskName: "t" }, entityManager)
      ).rejects.toThrow("Error updating task: fail");
    });
  });

  describe("updateTaskDocuments", () => {
    it("should add and remove documents as needed", async () => {
      entityManager.find.mockResolvedValue([{ documentId: 1 }]);
      jest
        .spyOn(taskRepository, "createTaskDocuments")
        .mockResolvedValue(undefined);
      entityManager.remove.mockResolvedValue(undefined);

      const docs: CreateTaskDocumentDto[] = [{ documentId: 2 }];
      await expect(
        taskRepository.updateTaskDocuments(docs, 1, entityManager)
      ).resolves.toBeUndefined();
      expect(taskRepository.createTaskDocuments).toHaveBeenCalled();
      expect(entityManager.remove).toHaveBeenCalled();
    });

    it("should only add new documents", async () => {
      entityManager.find.mockResolvedValue([]);
      jest
        .spyOn(taskRepository, "createTaskDocuments")
        .mockResolvedValue(undefined);

      const docs: CreateTaskDocumentDto[] = [{ documentId: 2 }];
      await expect(
        taskRepository.updateTaskDocuments(docs, 1, entityManager)
      ).resolves.toBeUndefined();
      expect(taskRepository.createTaskDocuments).toHaveBeenCalled();
    });

    it("should only remove documents", async () => {
      entityManager.find.mockResolvedValue([{ documentId: 1 }]);
      jest
        .spyOn(taskRepository, "createTaskDocuments")
        .mockResolvedValue(undefined);
      entityManager.remove.mockResolvedValue(undefined);

      const docs: CreateTaskDocumentDto[] = [];
      await expect(
        taskRepository.updateTaskDocuments(docs, 1, entityManager)
      ).resolves.toBeUndefined();
      expect(entityManager.remove).toHaveBeenCalled();
    });

    it("should throw error on failure", async () => {
      entityManager.find.mockRejectedValue(new Error("fail"));
      await expect(
        taskRepository.updateTaskDocuments([], 1, entityManager)
      ).rejects.toThrow("Error updating task document: fail");
    });
  });

  describe("getTaskById", () => {
    it("should return transformed task", async () => {
      taskRepo.findOne.mockResolvedValue({
        id: 1,
        priorityLid: 1,
        taskStatusLid: 2,
        taskTypeLid: 3,
        taskDocs: [],
        company: null,
        opportunity: null,
        activity: null,
        assignee: null,
      });
      entityService.getLookupValues.mockResolvedValue([
        { id: 1, lookUpValue: "p" },
        { id: 2, lookUpValue: "s" },
        { id: 3, lookUpValue: "t" },
        { id: 4, lookUpValue: "c" },
      ]);
      jest
        .spyOn(taskRepository, "transformTaskResponse")
        .mockResolvedValue([{ id: 1 }]);
      const result = await taskRepository.getTaskById(1);
      expect(result).toEqual({ id: 1 });
    });

    it("should throw NotFoundException if task not found", async () => {
      taskRepo.findOne.mockResolvedValue(undefined);
      await expect(taskRepository.getTaskById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw error if lookup values not found", async () => {
      taskRepo.findOne.mockResolvedValue({
        id: 1,
        priorityLid: 1,
        taskStatusLid: 2,
        taskTypeLid: 3,
      });
      entityService.getLookupValues.mockResolvedValue(undefined);
      await expect(taskRepository.getTaskById(1)).rejects.toThrow(
        "Failed to fetch lookup values"
      );
    });

    it("should throw error on findOne failure", async () => {
      taskRepo.findOne.mockRejectedValue(new Error("fail"));
      await expect(taskRepository.getTaskById(1)).rejects.toThrow(
        "Error fetching task: fail"
      );
    });
  });

  describe("deleteTaskById", () => {
    it("should delete task if found", async () => {
      taskRepo.findOne.mockResolvedValue({ id: 1 });
      taskRepo.softDelete.mockResolvedValue(undefined);

      await expect(taskRepository.deleteTaskById(1)).resolves.toBeUndefined();
      expect(taskRepo.softDelete).toHaveBeenCalledWith({ id: 1 });
    });

    it("should throw NotFoundException if task not found", async () => {
      taskRepo.findOne.mockResolvedValue(undefined);
      await expect(taskRepository.deleteTaskById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw error on softDelete failure", async () => {
      taskRepo.findOne.mockResolvedValue({ id: 1 });
      taskRepo.softDelete.mockRejectedValue(new Error("fail"));
      await expect(taskRepository.deleteTaskById(1)).rejects.toThrow(
        "Error deleting task: fail"
      );
    });
  });

  describe("completeTask", () => {
    it("should mark sub-task as completed", async () => {
      taskRepo.findOne.mockResolvedValue({ id: 1, taskTypeLid: 2 });
      entityManager.findOne = jest
        .fn()
        .mockResolvedValueOnce({ id: 2 }) // sub task type
        .mockResolvedValueOnce({ id: 3 }); // closed status
      entityManager.update.mockResolvedValue(undefined);

      await expect(
        taskRepository.completeTask(1, entityManager)
      ).resolves.toBeUndefined();
      expect(entityManager.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException if task not found", async () => {
      taskRepo.findOne.mockResolvedValue(undefined);
      await expect(
        taskRepository.completeTask(1, entityManager)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if not sub-task", async () => {
      taskRepo.findOne.mockResolvedValue({ id: 1, taskTypeLid: 5 });
      entityManager.findOne = jest.fn().mockResolvedValueOnce({ id: 2 }); // sub task type
      await expect(
        taskRepository.completeTask(1, entityManager)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getTasks", () => {
    it("should return tasks with pagination", async () => {
      const taskData = [
        {
          id: 1,
          priorityLid: 1,
          taskStatusLid: 2,
          taskTypeLid: 3,
          taskDocs: [],
        },
      ];
      queryBuilder.getManyAndCount.mockResolvedValue([taskData, 1]);
      entityService.getLookupValues.mockResolvedValue([
        { id: 1, lookUpValue: "p" },
        { id: 2, lookUpValue: "s" },
        { id: 3, lookUpValue: "t" },
      ]);
      jest
        .spyOn(taskRepository, "transformGetTasksResponse")
        .mockResolvedValue([{ id: 1 }]);

      const result = await taskRepository.getTasks(
        1,
        10,
        [],
        [],
        1,
        "",
        undefined,
        undefined,
        undefined
      );
      expect(result).toEqual({ data: [{ id: 1 }], count: 1 });
      expect(taskRepo.createQueryBuilder).toHaveBeenCalledWith("task");
      expect(queryBuilder.skip).toHaveBeenCalledWith(0);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
      expect(dataSource.query).not.toHaveBeenCalled();
    });

    it("should return empty data if no tasks", async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);
      const result = await taskRepository.getTasks(
        1,
        10,
        [],
        [],
        1,
        "",
        undefined,
        undefined,
        undefined
      );
      expect(result).toEqual({ data: [], count: 0 });
    });

    it("should include personal and non-personal tasks when task type filter is Task", async () => {
      queryBuilder.getManyAndCount.mockResolvedValue([
        [
          {
            id: 1,
            priorityLid: 1,
            taskStatusLid: 2,
            taskTypeLid: 3,
            taskDocs: [],
          },
        ],
        1,
      ]);
      entityService.getLookupValues.mockResolvedValue([
        { id: 1, lookUpValue: "p" },
        { id: 2, lookUpValue: "s" },
        { id: 3, lookUpValue: "t" },
      ]);
      jest
        .spyOn(taskRepository, "transformGetTasksResponse")
        .mockResolvedValue([{ id: 1 }]);
      dataSource.query.mockResolvedValue([{ id: 2 }, { id: 3 }]);

      await taskRepository.getTasks(
        1,
        10,
        [{ searchBy: "taskType.lookUpValue", searchValue: "Task" }],
        [],
        1,
        "",
        undefined,
        undefined,
        undefined
      );

      expect(dataSource.query).toHaveBeenCalled();
      expect(queryBuilder.setParameters).toHaveBeenCalledWith(
        expect.objectContaining({
          taskTypeTask: "Task",
          taskTypePersonal: "Personal",
          taskTypeNonPersonal: "Non Personal",
        })
      );
    });

    it("should throw error on query failure", async () => {
      queryBuilder.getManyAndCount.mockRejectedValue(new Error("fail"));
      await expect(
        taskRepository.getTasks(1, 10, [], [], 1, "", undefined, undefined, undefined)
      ).rejects.toThrow("Failed to fetch get tasks list");
    });
  });

  describe("getTasksByOpportunityAndActivity", () => {
    it("should return transformed tasks", async () => {
      taskRepo.find.mockResolvedValue([
        {
          id: 1,
          taskName: "t",
          description: "d",
          dueDate: new Date(),
          priority: { id: 1, lookUpValue: "p" },
          company: { id: 1, companyName: "c" },
          assignee: { userId: 2, firstName: "a" },
        },
      ]);
      const result = await taskRepository.getTasksByOpportunityAndActivity(
        1,
        2
      );
      expect(result[0].id).toBe(1);
      expect(result[0].priority.id).toBe(1);
      expect(result[0].company.name).toBe("c");
    });

    it("should throw error on failure", async () => {
      taskRepo.find.mockRejectedValue(new Error("fail"));
      await expect(
        taskRepository.getTasksByOpportunityAndActivity(1, 2)
      ).rejects.toThrow(
        "Error fetching tasks by opportunity and activity: fail"
      );
    });
  });

  describe("transformTaskResponse", () => {
    it("should transform tasks", async () => {
      const tasks = [
        {
          id: 1,
          taskName: "t",
          taskDocs: [{ documentId: 2 }],
          company: { id: 1, companyName: "c", displayName: "d" },
          opportunity: { opportunityId: 1, policyType: { lookUpValue: "p" } },
          activity: { id: 1, activityName: "a" },
          assignee: { userId: 2, firstName: "a", lastName: "b" },
        },
      ];
      const result = await taskRepository.transformTaskResponse(tasks as any);
      expect(result[0].id).toBe(1);
      expect(result[0].company.name).toBe("c");
    });

    it("should throw error on failure", async () => {
      await expect(
        taskRepository.transformTaskResponse(undefined as any)
      ).rejects.toThrow("Failed to transform task response");
    });
  });

  describe("transformGetTasksResponse", () => {
    it("should transform tasks", async () => {
      const tasks = [
        {
          id: 1,
          taskName: "t",
          priorityLid: 1,
          taskStatusLid: 2,
          taskDocs: [{ documentId: 2 }],
          company: { id: 1, companyName: "c", displayName: "d" },
          opportunity: { opportunityId: 1, policyType: { lookUpValue: "p" } },
          activity: { id: 1, activityName: "a" },
          assignee: { userId: 2, firstName: "a", lastName: "b" },
        },
      ];
      const priorityLookup = [{ id: 1, lookUpValue: "p" }];
      const taskStatusLookup = [{ id: 2, lookUpValue: "s" }];
      const result = await taskRepository.transformGetTasksResponse(
        tasks as any,
        priorityLookup,
        taskStatusLookup
      );
      expect(result[0].id).toBe(1);
      expect(result[0].priority).toBe("p");
      expect(result[0].taskStatus).toBe("s");
    });

    it("should throw error on failure", async () => {
      await expect(
        taskRepository.transformGetTasksResponse(undefined as any, [], [])
      ).rejects.toThrow("Failed to transform task response");
    });
  });

  describe("validateTaskAssociations", () => {
    it("should validate company, opportunity, and activity", async () => {
      entityManager.findOne.mockResolvedValueOnce({ id: 1 }); // company
      entityManager.findOne.mockResolvedValueOnce({ opportunityId: 2 }); // opportunity
      entityManager.find.mockResolvedValueOnce([{ id: 3 }]); // activities

      await expect(
        taskRepository.validateTaskAssociations(entityManager, 1, 2, 3)
      ).resolves.toBeUndefined();
    });

    it("should throw NotFoundException if company not found", async () => {
      entityManager.findOne.mockResolvedValueOnce(undefined);
      await expect(
        taskRepository.validateTaskAssociations(
          entityManager,
          1,
          undefined,
          undefined
        )
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw NotFoundException if opportunity not found", async () => {
      entityManager.findOne.mockResolvedValueOnce({ id: 1 }); // company
      entityManager.findOne.mockResolvedValueOnce(undefined); // opportunity
      await expect(
        taskRepository.validateTaskAssociations(entityManager, 1, 2, undefined)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if no activities for opportunity", async () => {
      entityManager.findOne.mockResolvedValueOnce({ id: 1 }); // company
      entityManager.findOne.mockResolvedValueOnce({ opportunityId: 2 }); // opportunity
      entityManager.find.mockResolvedValueOnce([]);
      await expect(
        taskRepository.validateTaskAssociations(entityManager, 1, 2, 3)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if activity not found for opportunity", async () => {
      entityManager.findOne.mockResolvedValueOnce({ id: 1 }); // company
      entityManager.findOne.mockResolvedValueOnce({ opportunityId: 2 }); // opportunity
      entityManager.find.mockResolvedValueOnce([{ id: 4 }]);
      await expect(
        taskRepository.validateTaskAssociations(entityManager, 1, 2, 3)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if activityId provided without opportunityId", async () => {
      await expect(
        taskRepository.validateTaskAssociations(
          entityManager,
          undefined,
          undefined,
          3
        )
      ).rejects.toThrow(BadRequestException);
    });
  });
});
