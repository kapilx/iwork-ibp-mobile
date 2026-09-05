import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, EntityManager, Repository } from "typeorm";
import { IS_NOT_EDITABLE } from "../../../../../../libs/service-lib/src/lib/constants";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import {
  applySearchConditions,
  convertUtcToIst,
  extractDateAndTime,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import {
  ISG_PLANNING_TASK_NAME,
  LOOK_UP_FIELD,
  serviceNames,
  TASK_CLOSED,
  TASK_STATUS_CLOSED,
  TASK_TYPE,
  taskSearchObject,
} from "../../../../service-lib/src/lib/constants";
import {
  Company,
  FileUpload,
  LookUp,
  Opportunity,
  OpportunityActivityMap,
  Policy,
  Task,
  TaskDocumentMap,
} from "../../../../service-lib/src/lib/entities";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  getLookup,
  getLookups,
} from "../../../../service-lib/src/lib/utils/opportunity.utils";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { CreateTaskDocumentDto, CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskViewBy } from "./dto/get-task.dto";

@Injectable()
export class TaskRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    private readonly entityService: EntityService,
    private readonly traceIdService: TraceIdService,
    private readonly scopeService: ScopeService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.OPPORTUNITY_SERVICE
    );
  }

  async createTask(
    taskDetails: Partial<CreateTaskDto>,
    manager: EntityManager
  ) {
    try {
      // Task linking validation
      await this.validateTaskAssociations(
        manager,
        taskDetails.companyId,
        taskDetails.opportunityId,
        taskDetails.activityId,
        taskDetails.policyId
      );
      if (!taskDetails.assigneeId && taskDetails.createdBy) {
        taskDetails.assigneeId = taskDetails.createdBy; // Default to the user creating the task if no assignee is provided
      }
      const task = manager.create(Task, taskDetails);
      return await manager.save(Task, task);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new Error("Error creating task: " + error.message);
    }
  }

  async createTaskDocuments(
    documents: CreateTaskDocumentDto[],
    taskId: number,
    manager: EntityManager
  ) {
    try {
      await Promise.all(
        documents.map(async (doc) => {
          if (doc.documentId) {
            const document = await manager.findOne(FileUpload, {
              where: { id: doc.documentId },
            });
            if (!document) {
              throw new NotFoundException(
                errorMessages.documentWithIdNotFound(doc.documentId)
              );
            }
          }
        })
      );
      const taskDocuments: Partial<TaskDocumentMap>[] = documents.map(
        (doc) => ({
          taskId: taskId,
          documentId: doc.documentId,
        })
      );
      await manager.save(TaskDocumentMap, taskDocuments);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error("Error creating task document: " + error.message);
    }
  }

  async updateTask(
    id: number,
    updateTask: UpdateTaskDto,
    userId: number,
    manager: EntityManager,
    fromActivity: boolean
  ) {
    try {
      const task = await this.taskRepository.findOne({ where: { id } });
      if (!task) {
        throw new NotFoundException(errorMessages.taskWithIdNotFound(id));
      }
      if (task.taskIsEditable == IS_NOT_EDITABLE && !fromActivity) {
        throw new BadRequestException(
          `${task.taskName} task is not editable as it is activity related task.`
        );
      }
      if (task.taskClose) {
        throw new BadRequestException(
          `${task.taskName} task is already completed and cannot be updated.`
        );
      }
      if (task.assigneeId !== userId) {
        throw new BadRequestException(
          `Only the assigned user can make updates.`
        );
      }
      // Validate associations before updating
      await this.validateTaskAssociations(
        manager,
        updateTask.companyId ? updateTask.companyId : task.companyId,
        updateTask.opportunityId
          ? updateTask.opportunityId
          : task.opportunityId,
        updateTask.activityId ? updateTask.activityId : task.activityId,
        updateTask.policyId ? updateTask.policyId : task.policyId
      );

      if (updateTask.taskStatusLid) {
        const taskStatus = await getLookups(
          this.lookUpRepository,
          [TASK_STATUS_CLOSED],
          LOOK_UP_FIELD.KEY
        );
        const status = await getLookup(
          taskStatus,
          [TASK_STATUS_CLOSED],
          LOOK_UP_FIELD.KEY
        );
        if (
          updateTask.taskStatusLid == status[`lookup_${TASK_STATUS_CLOSED}`].id
        ) {
          updateTask.taskClose = TASK_CLOSED;
        }
      }
      Object.assign(task, { ...updateTask, updatedAt: new Date() });
      await manager.save(Task, task);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(`Error updating task: ${error.message}`);
    }
  }

  async updateTaskDocuments(
    documents: CreateTaskDocumentDto[],
    taskId: number,
    manager: EntityManager
  ) {
    try {
      const existingDocuments = await manager.find(TaskDocumentMap, {
        where: { taskId },
      });
      const existingDocumentIds = existingDocuments.map((doc) =>
        Number(doc.documentId)
      );
      // Add new documents
      const newDocuments = documents.filter(
        (doc) => doc.documentId && !existingDocumentIds.includes(doc.documentId)
      );
      if (newDocuments.length > 0) {
        await this.createTaskDocuments(newDocuments, taskId, manager);
      }
      // Remove documents that are not in the documents array
      const documentsToRemove = existingDocuments.filter(
        (doc) => !documents.some((d) => d.documentId === doc.documentId)
      );
      if (documentsToRemove.length > 0) {
        await manager.remove(TaskDocumentMap, documentsToRemove);
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error("Error updating task document: " + error.message);
    }
  }

  async completeTask(
    id: number,
    comments: string | null,
    userId: number,
    manager: EntityManager,
    isTemplateApprovalTask?: boolean
  ) {
    try {
      const task = await this.taskRepository.findOne({ where: { id } });
      if (!task) {
        throw new NotFoundException(errorMessages.taskWithIdNotFound(id));
      }
      if (task.taskClose) {
        throw new BadRequestException(
          `${task.taskName} task is already completed and cannot be updated.`
        );
      }
      if (task.assigneeId !== userId) {
        throw new BadRequestException(
          `You are not allowed to complete this task. Only the assignee has permission.`
        );
      }
      const taskLookups = await getLookups(
        this.lookUpRepository,
        [TASK_TYPE.TASK, TASK_STATUS_CLOSED],
        LOOK_UP_FIELD.KEY
      );
      const lookUps = await getLookup(
        taskLookups,
        [TASK_TYPE.TASK, TASK_STATUS_CLOSED],
        LOOK_UP_FIELD.KEY
      );
      const subTaskType = lookUps[`lookup_${TASK_TYPE.TASK}`];
      const closedStatus = lookUps[`lookup_${TASK_STATUS_CLOSED}`];

      // Bypass task type validation if isTemplateApprovalTask flag is true
      if (!isTemplateApprovalTask && task.taskTypeLid !== subTaskType.id) {
        throw new BadRequestException(errorMessages.invalidTaskType);
      }
      // update to closed
      Object.assign(task, {
        taskStatusLid: closedStatus.id,
        taskClose: TASK_CLOSED,
        comments: comments ?? null,
        updatedBy: userId,
        updatedAt: new Date(),
      });
      await manager.save(Task, task);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(`Error completing task: ${error.message}`);
    }
  }

  async getTaskById(id: number) {
    try {
      const task = await this.taskRepository.findOne({
        where: { id },
        relations: [
          "company",
          "assignee",
          "opportunity",
          "opportunity.policyType",
          "activity",
          "taskDocs",
        ],
      });
      if (!task) {
        throw new NotFoundException(errorMessages.taskNotFound);
      }
      const lookUpValues = await this.entityService.getLookupValues([
        task.priorityLid,
        task.taskStatusLid,
        task.taskTypeLid,
      ]);
      if (!lookUpValues) {
        throw new Error("Failed to fetch lookup values");
      }
      // Map the lookup values to their respective fields
      const priority = lookUpValues.find(
        (item) => item.id === task.priorityLid
      );
      const taskStatus = lookUpValues.find(
        (item) => item.id === task.taskStatusLid
      );
      const taskType = lookUpValues.find(
        (item) => item.id === task.taskTypeLid
      );
      // Spread the lookup values into the task object
      const enrichedTask = {
        ...task,
        priority,
        taskStatus,
        taskType,
        // taskCategory,
      };
      // Validate and filter the response
      const filteredData = await this.transformTaskResponse([enrichedTask]);
      return filteredData[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error("Error fetching task: " + error.message);
    }
  }

  async deleteTaskById(id: number) {
    try {
      const task = await this.taskRepository.findOne({ where: { id } });
      if (!task) {
        throw new NotFoundException(errorMessages.taskWithIdNotFound(id));
      }
      await this.taskRepository.softDelete({ id });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error("Error deleting task: " + error.message);
    }
  }

  async getTasks(
    page: number,
    limit: number,
    searchArray: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    sort: { field: string; order: "ASC" | "DESC" }[],
    userId: number,
    searchBy: string,
    statusId?: number,
    companyId?: number,
    opportunityId?: number,
    filterByOpportunity?: boolean,
    viewBy?: TaskViewBy
  ): Promise<{
    data: any[];
    count: number;
  }> {
    try {
      const searchParams = Array.isArray(searchArray) ? [...searchArray] : [];
      const isTaskSearchValue = (value: unknown) => {
        if (typeof value === "string") {
          return value.toLowerCase() === "task";
        }
        if (Array.isArray(value)) {
          return value.some(
            (item) => typeof item === "string" && item.toLowerCase() === "task"
          );
        }
        return false;
      };
      const taskTypeIndex = searchParams.findIndex(
        (param) =>
          param?.searchBy === "taskType.lookUpValue" &&
          isTaskSearchValue(param?.searchValue)
      );

      const includePersonalAndNonPersonal = taskTypeIndex !== -1;
      if (includePersonalAndNonPersonal) {
        const { searchValue } = searchParams[taskTypeIndex];
        searchParams.splice(taskTypeIndex, 1);
        if (Array.isArray(searchValue)) {
          const remainingValues = searchValue.filter((item) => {
            return !(typeof item === "string" && item.toLowerCase() === "task");
          });
          if (remainingValues.length > 0) {
            searchParams.splice(taskTypeIndex, 0, {
              searchBy: "taskType.lookUpValue",
              searchValue: remainingValues,
            });
          }
        }
      }

      // Get user IDs based on viewBy scope
      let uniqueHierarchyIds: number[];
      if (viewBy === TaskViewBy.SELF_ORG) {
        const hierarchyUsers = await this.scopeService.getNewEmployeeHierarchyByUserId(userId, false);
        uniqueHierarchyIds = Array.from(new Set([userId, ...hierarchyUsers.map(u => u.userId)].map(Number)));
      } else if (viewBy === TaskViewBy.SELF_TEAM) {
        const reporteeIds = await this.scopeService.fetchDirectReporteeUserIds(userId);
        uniqueHierarchyIds = Array.from(new Set([userId, ...reporteeIds].map(Number)));
      } else {
        uniqueHierarchyIds = [userId];
      }

      const qb = this.taskRepository
        .createQueryBuilder("task")
        .leftJoinAndSelect("task.company", "company")
        .leftJoinAndSelect("task.opportunity", "opportunity")
        .leftJoinAndSelect("opportunity.policyType", "opportunity_policyType")
        .leftJoinAndSelect("task.activity", "activity")
        .leftJoinAndSelect("task.taskType", "taskType")
        .leftJoinAndSelect("task.subTaskType", "subTaskType")
        .leftJoinAndSelect("task.assignee", "assignee");

      if (includePersonalAndNonPersonal) {
        qb.where(
          new Brackets((whereQb) => {
            whereQb
              .where(
                new Brackets((taskQb) => {
                  taskQb
                    .where("taskType.lookUpValue ILIKE :taskTypeTask")
                    .andWhere("task.assigneeId IN (:...hierarchyUserIds)");
                })
              )
              .orWhere(
                new Brackets((personalQb) => {
                  personalQb
                    .where("subTaskType.lookUpValue ILIKE :subTaskTypePersonal")
                    .andWhere("task.assigneeId IN (:...hierarchyUserIds)");
                })
              )
              .orWhere(
                new Brackets((nonPersonalQb) => {
                  nonPersonalQb
                    .where(
                      "subTaskType.lookUpValue ILIKE :subTaskTypeNonPersonal"
                    )
                    .andWhere("task.assigneeId IN (:...hierarchyUserIds)");
                })
              );
          })
        ).setParameters({
          userId,
          hierarchyUserIds: uniqueHierarchyIds.length
            ? uniqueHierarchyIds
            : [userId],
          taskTypeTask: "Task",
          subTaskTypePersonal: "Personal",
          subTaskTypeNonPersonal: "Non Personal",
        });
      } else {
        qb.where("task.assigneeId IN (:...hierarchyUserIds)", {
          hierarchyUserIds: uniqueHierarchyIds.length
            ? uniqueHierarchyIds
            : [userId],
        });
      }
      if (statusId) {
        qb.andWhere("task.taskStatusLid != :statusId", { statusId });
      }

      if (searchParams.length > 0) {
        searchParams.forEach(({ searchBy, searchValue }, idx) => {
          const param = `param_${idx}`;
          let alias = "task";
          let column = searchBy;
          if (searchBy.includes(".")) {
            const parts = searchBy.split(".");
            column = parts.pop() as string;
            alias = parts.join("_");
          }
          if (Array.isArray(searchValue)) {
            qb.andWhere(`${alias}.${column} IN (:...${param})`, {
              [param]: searchValue,
            });
          } else {
            qb.andWhere(`${alias}.${column} ILIKE :${param}`, {
              [param]: `%${searchValue}%`,
            });
          }
        });
      }

      if (searchBy) {
        applySearchConditions(qb, searchBy, taskSearchObject);
      }

      // Apply strict filtering when filterByOpportunity is true
      if (filterByOpportunity && opportunityId) {
        qb.andWhere("task.opportunity_id = :filterOpportunityId", {
          filterOpportunityId: opportunityId,
        });
      }

      if (opportunityId) {
        qb.addSelect(
          "CASE WHEN task.opportunity_id = :orderOpportunityId THEN 0 ELSE 1 END",
          "order_priority"
        );
        qb.orderBy("order_priority", "ASC");
        qb.setParameter("orderOpportunityId", opportunityId);
      } else if (companyId) {
        qb.addSelect(
          "CASE WHEN task.company_id = :orderCompanyId THEN 0 ELSE 1 END",
          "order_priority"
        );
        qb.orderBy("order_priority", "ASC");
        qb.setParameter("orderCompanyId", companyId);
      } else {
        const sortParams =
          sort.length > 0 ? sort : [{ field: "dueDate", order: "ASC" }];
        for (const { field, order } of sortParams) {
          let alias = "task";
          let column = field;
          if (field.includes(".")) {
            const parts = field.split(".");
            column = parts.pop() as string;
            alias = parts.join("_");
          }
          qb.addOrderBy(`${alias}.${column}`, order, "NULLS LAST");
        }
      }

      qb.skip((page - 1) * limit).take(limit);

      const [data, count] = await qb.getManyAndCount();

      if (!data || data.length === 0) {
        return { data: [], count: 0 };
      }
      // Extract all unique priorityLid values from the data
      const priorityLids = [
        ...new Set(data.map((task) => task.priorityLid).filter(Boolean)),
      ];
      const taskStatusLids = [
        ...new Set(data.map((task) => task.taskStatusLid).filter(Boolean)),
      ];
      const taskTypeLids = [
        ...new Set(data.map((task) => task.taskTypeLid).filter(Boolean)),
      ];
      const subTaskTypeLids = [
        ...new Set(data.map((task) => task.subTaskTypeLid).filter(Boolean)),
      ];
      const allLids = [
        ...new Set([
          ...priorityLids,
          ...taskStatusLids,
          ...taskTypeLids,
          ...subTaskTypeLids,
        ]),
      ];
      // Fetch lookup values for all LIDs in one call
      const allLookupValues =
        allLids.length > 0
          ? await this.entityService.getLookupValues(allLids)
          : [];

      const priorityLookup = allLookupValues.filter((item) =>
        priorityLids.includes(item.id)
      );
      const taskStatusLookup = allLookupValues.filter((item) =>
        taskStatusLids.includes(item.id)
      );
      const taskTypeLookup = allLookupValues.filter((item) =>
        taskTypeLids.includes(item.id)
      );
      const subTaskTypeLookup = allLookupValues.filter((item) =>
        subTaskTypeLids.includes(item.id)
      );

      return {
        data: await this.transformGetTasksResponse(
          data,
          priorityLookup,
          taskStatusLookup,
          taskTypeLookup,
          subTaskTypeLookup
        ),
        count,
      };
    } catch (error) {
      throw new Error("Failed to fetch get tasks list", error);
    }
  }

  async getTasksByOpportunityActivityId(
    activityId: number,
    taskTypeLid?: number
  ) {
    try {
      const tasks = await this.taskRepository.find({
        where: {
          activityId,
          taskTypeLid: taskTypeLid ? taskTypeLid : undefined,
        },
        order: { createdAt: "DESC" },
        relations: ["assignee", "priority", "company"], // Ensure relations are properly loaded
      });

      const transformedTasks = tasks.map((task: Task) => {
        const { date, time } = extractDateAndTime(
          convertUtcToIst(task.updatedAt)
        );
        return {
          id: task.id,
          taskName: task.taskName,
          description: task.description,
          dueDate: task.dueDate,
          priority: {
            id: task.priority?.id,
            lookUpValue: task.priority?.lookUpValue,
          },
          company: {
            id: task.company?.id,
            name: task.company?.companyName,
          },
          assignee: {
            id: task.assignee?.userId,
            name: task.assignee?.firstName,
          },
          status: task.taskClose
            ? {
                closedDate: task.updatedAt ? date : null,
                closedTime: task.updatedAt ? time : null,
              }
            : null,
          updatedBy: task.updatedBy,
        };
      });

      return transformedTasks;
    } catch (error) {
      throw new Error(
        "Error fetching tasks by opportunity and activity: " + error.message
      );
    }
  }

  async transformTaskResponse(tasks: Task[]) {
    try {
      return tasks.map((task) => ({
        ...this.omitFields(task),
        priorityLid: undefined,
        taskStatusLid: undefined,
        taskTypeLid: undefined,
        taskDocs: task?.taskDocs?.map((doc) => ({
          documentId: doc.documentId,
        })),
        companyId: undefined,
        company: task?.company
          ? {
              id: task.company.id,
              name: task.company.companyName,
              displayName: task.company.displayName,
            }
          : null,
        opportunityId: undefined,
        opportunity: task?.opportunity
          ? {
              opportunityId: task.opportunity.opportunityId,
              policy: task.opportunity.policyType?.lookUpValue,
            }
          : null,
        assigneeId: undefined,
        assignee: task?.assignee
          ? {
              userId: task.assignee.userId,
              firstName: task.assignee.firstName,
              lastName: task.assignee.lastName,
            }
          : null,
        activityId: undefined,
        activity: task?.activity
          ? {
              id: task.activity.id,
              activityName: task.activity.activityName,
            }
          : null,
      }));
    } catch (error) {
      throw new Error("Failed to transform task response", error);
    }
  }

  // Transform the response for getTasks
  async transformGetTasksResponse(
    tasks: Task[],
    priorityLookup: Array<{ id: number; lookUpValue: string }>,
    taskStatusLookup: Array<{ id: number; lookUpValue: string }>,
    taskTypeLookup: Array<{ id: number; lookUpValue: string }>,
    subTaskTypeLookup: Array<{ id: number; lookUpValue: string }>
  ) {
    try {
      return tasks.map((task) => ({
        ...this.omitFields(task),
        priorityLid: undefined,
        taskStatusLid: undefined,
        taskTypeLid: undefined,
        taskClose: undefined,
        taskDocs: task?.taskDocs?.map((doc) => ({
          documentId: doc.documentId,
        })),
        companyId: undefined,
        company: task?.company
          ? {
              id: task.company.id,
              name: task.company.companyName,
              displayName: task.company.displayName,
            }
          : null,
        opportunityId: undefined,
        opportunity: task?.opportunity
          ? {
              opportunityId: task.opportunity.opportunityId,
              policy: task.opportunity.policyType?.lookUpValue,
            }
          : null,
        policyId: task.policyId ?? null,
        templateId: task.templateId ?? null,
        assigneeId: undefined,
        assignee: task?.assignee
          ? {
              userId: task.assignee.userId,
              firstName: task.assignee.firstName,
              lastName: task.assignee.lastName,
            }
          : null,
        activityId: task.activityId ?? null,
        activity: task?.activity
          ? {
              id: task.activity.id,
              activityName: task.activity.activityName,
            }
          : null,
        taskOrigin: task.taskOrigin ?? null,
        taskLabel: task.taskLabel ?? null,
        priority: {
          id: task.priorityLid,
          lookUpValue:
            priorityLookup.find((item) => item.id === task.priorityLid)
              ?.lookUpValue ?? null,
        },
        taskStatus: {
          id: task.taskStatusLid,
          lookUpValue:
            taskStatusLookup.find((item) => item.id === task.taskStatusLid)
              ?.lookUpValue ?? null,
        },
        taskType: {
          id: task.taskTypeLid,
          lookUpValue:
            taskTypeLookup.find((item) => item.id === task.taskTypeLid)
              ?.lookUpValue ?? null,
        },
        subTaskType: {
          id: task.subTaskTypeLid,
          lookUpValue:
            subTaskTypeLookup.find((item) => item.id === task.subTaskTypeLid)
              ?.lookUpValue ?? null,
        },
      }));
    } catch (error) {
      throw new Error("Failed to transform task response", error);
    }
  }

  private omitFields(entity: Record<string, any>) {
    if (!entity) {
      return {};
    }
    const { createdAt, updatedAt, deletedAt, createdBy, updatedBy, ...rest } =
      entity || {};
    return rest;
  }

  // Validate associations for task creation or update
  async validateTaskAssociations(
    entityManager: EntityManager,
    companyId: number | undefined | null,
    opportunityId: number | undefined | null,
    activityId: number | undefined | null,
    policyId: number | undefined | null
  ) {
    let opportunity: Opportunity | null = null;
    let activity: OpportunityActivityMap | null = null;
    let policy: Policy | null = null;

    // 1. Validate Company (only if provided)
    if (companyId) {
      const companyExists = await entityManager.exists(Company, {
        where: { id: companyId },
      });

      if (!companyExists) {
        throw new NotFoundException(errorMessages.companyNotFound);
      }
    }

    // 2. Validate Opportunity → Company
    if (opportunityId) {
      opportunity = await entityManager.findOne(Opportunity, {
        where: { opportunityId },
        select: ["opportunityId", "companyId"],
      });

      if (!opportunity) {
        throw new NotFoundException(errorMessages.opportunityNotFound);
      }

      if (companyId && opportunity.companyId !== companyId) {
        throw new BadRequestException(
          `Opportunity ID ${opportunityId} is not associated with Company ID ${companyId}`
        );
      }
    }

    // 3. Validate Activity → Opportunity
    if (activityId) {
      if (!opportunityId) {
        throw new BadRequestException(
          "Opportunity ID is required when Activity ID is provided"
        );
      }

      activity = await entityManager.findOne(OpportunityActivityMap, {
        where: { id: activityId },
        select: ["id", "opportunityId", "completedAt"],
      });

      if (!activity) {
        throw new BadRequestException(
          errorMessages.opportunityActivityNotFound(activityId)
        );
      }

      if (activity.opportunityId !== opportunityId) {
        throw new BadRequestException(
          `Activity ID ${activityId} is not associated with Opportunity ID ${opportunityId}`
        );
      }

      if (activity.completedAt) {
        throw new BadRequestException(
          `Cannot associate the task with this activity because it has already been completed.`
        );
      }
    }

    // 4. Validate Policy → Company
    if (policyId) {
      policy = await entityManager.findOne(Policy, {
        where: { id: policyId },
        select: ["id", "companyId"],
      });

      if (!policy) {
        throw new NotFoundException(errorMessages.policyNotFound);
      }

      if (companyId && policy.companyId !== companyId) {
        throw new BadRequestException(
          `Policy ID ${policyId} is not associated with Company ID ${companyId}`
        );
      }
    }
  }

  async getTaskByOpportunityAndStatus(
    opportunityId: number,
    taskStatusLid: number,
    taskTypeLid: number
  ): Promise<Task | null> {
    try {
      const task = await this.taskRepository.findOne({
        where: {
          opportunityId,
          taskStatusLid,
          taskTypeLid,
        },
      });
      return task || null;
    } catch (error) {
      throw new Error(
        `Failed to fetch assignment task by opportunity and task status: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async getIsgPlanningAssignedTaskByOpportunityAndOwner(
    opportunityId: number,
    taskStatusLid: number,
    ownerId: number
  ): Promise<Task | null> {
    try {
      const task = await this.taskRepository.findOne({
        where: {
          opportunityId,
          taskStatusLid,
          assigneeId: ownerId,
          taskName: ISG_PLANNING_TASK_NAME,
        },
      });
      return task || null;
    } catch (error) {
      throw new Error(
        `Failed to fetch ISG planning task by opportunity and owner: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }
}
