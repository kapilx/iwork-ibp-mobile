import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskViewBy } from "./dto/get-task.dto";
import { TaskRepository } from "./task.repository";
import { DataSource, EntityManager } from "typeorm";
import {
  DEFAULT_TASK_STATUS,
  IS_EDITABLE,
  IS_NOT_EDITABLE,
  LOOK_UP_DATA,
  MASTER_DATA,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { LookUpService } from "../../../../org-service/src/app/look-up/look-up.service";
import {
  PRIORITY_LOOK_UP_MEDIUM_VALUE,
  TASK_STATUS_CLOSED,
  TASK_TYPE,
} from "../../../../service-lib/src/lib/constants";
import {
  mapSearchParams,
  mapSortParams,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { Task } from "../../../../service-lib/src/lib/entities";

@Injectable()
export class TaskService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly dataSource: DataSource,
    private readonly lookUpValidation: LookUpValidationService,
    private readonly masterValidation: MasterValidationService,
    private readonly lookUpService: LookUpService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.OPPORTUNITY_SERVICE
    );
  }

  async createTask(taskData: CreateTaskDto, entityManager?: EntityManager) {
    try {
      const createTask = async (manager: EntityManager) => {
        await this.lookUpValidation.validateDynamicLookupValues(
          taskData,
          LOOK_UP_DATA
        );
        await this.masterValidation.validateMasterIds(taskData, MASTER_DATA);
        const { documents, ...taskDetails } = taskData;
        // default values for task status and task type
        const taskStatus = await this.lookUpService.getLookUpsByKey(
          DEFAULT_TASK_STATUS
        );
        if (!taskStatus) {
          throw new NotFoundException(
            `Task status with key ${DEFAULT_TASK_STATUS} not found.`
          );
        }
        const taskType = await this.lookUpService.getLookUpsByKey(
          TASK_TYPE.TASK
        );
        if (!taskType) {
          throw new NotFoundException(
            `Task type with key ${TASK_TYPE.TASK} not found.`
          );
        }
        const personalTaskType = await this.lookUpService.getLookUpsByKey(
          TASK_TYPE.PERSONAL
        );
        if (!personalTaskType) {
          throw new NotFoundException(
            `Personal Task type with key ${TASK_TYPE.PERSONAL} not found.`
          );
        }
        const nonPersonalTaskType = await this.lookUpService.getLookUpsByKey(
          TASK_TYPE.NON_PERSONAL
        );
        if (!nonPersonalTaskType) {
          throw new NotFoundException(
            `Non-Personal Task type with key ${TASK_TYPE.NON_PERSONAL} not found.`
          );
        }
        const taskPriority = await this.lookUpService.getLookUpsByKey(
          PRIORITY_LOOK_UP_MEDIUM_VALUE
        );
        if (!taskPriority) {
          throw new NotFoundException(
            `Task priority with key ${PRIORITY_LOOK_UP_MEDIUM_VALUE} not found.`
          );
        }
        taskDetails.priorityLid = taskDetails.priorityLid || taskPriority[0].id;
        taskDetails.taskStatusLid =
          taskDetails.taskStatusLid || taskStatus[0].id;
        taskDetails.taskTypeLid = taskDetails.taskTypeLid || taskType[0].id;
        if (
          taskDetails.taskTypeLid == taskType[0].id ||
          taskDetails.taskTypeLid == personalTaskType[0].id ||
          taskDetails.taskTypeLid == nonPersonalTaskType[0].id
        ) {
          taskDetails.taskIsEditable = IS_EDITABLE;
        } else {
          taskDetails.taskIsEditable = IS_NOT_EDITABLE;
        }
        if (
          taskDetails.taskTypeLid == personalTaskType[0].id ||
          taskDetails.taskTypeLid == nonPersonalTaskType[0].id
        ) {
          if (taskDetails.taskTypeLid == personalTaskType[0].id) {
            taskDetails.assigneeId = taskDetails.createdBy;
          }
          taskDetails.subTaskTypeLid = taskDetails.taskTypeLid;
          taskDetails.taskTypeLid = taskType[0].id;
        }

        const task = await this.taskRepository.createTask(taskDetails, manager);
        if (documents && documents.length > 0) {
          await this.taskRepository.createTaskDocuments(
            documents,
            task.id,
            manager
          );
        }
        return { id: task.id };
      };
      if (entityManager) {
        return await createTask(entityManager); // Use the provided transaction
      } else {
        return await this.dataSource.transaction(createTask); // Start a new transaction
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async getTasks(
    page: number,
    limit: number,
    search: string,
    sort: string,
    userId: number,
    searchBy: string,
    showCompleted = false,
    companyId?: number,
    opportunityId?: number,
    filterByOpportunity?: boolean,
    viewBy?: TaskViewBy
  ) {
    try {
      const searchParams = mapSearchParams(search);
      const sortParams = mapSortParams(sort);
      let statusId: number | undefined;
      if (!showCompleted) {
        const active = await this.lookUpService.getLookUpsByKey(
          TASK_STATUS_CLOSED
        );
        statusId = active?.[0]?.id;
      }
      const tasks = await this.taskRepository.getTasks(
        page,
        limit,
        searchParams,
        sortParams,
        userId,
        searchBy,
        statusId,
        companyId,
        opportunityId,
        filterByOpportunity,
        viewBy
      );
      return tasks;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error(errorMessages.taskListRetrievalFailed);
    }
  }

  async getTaskById(id: number) {
    try {
      const task = await this.taskRepository.getTaskById(id);
      if (!task) {
        throw new NotFoundException(errorMessages.taskNotFound);
      }
      return task;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async updateTask(
    id: number,
    updateTaskData: UpdateTaskDto,
    userId: number,
    entityManager?: EntityManager,
    fromActivity = false
  ) {
    try {
      const updateTask = async (manager: EntityManager) => {
        const { documents, ...taskDetails } = updateTaskData;
        await this.taskRepository.updateTask(
          id,
          taskDetails,
          userId,
          manager,
          fromActivity
        );
        if (documents && documents.length > 0) {
          await this.taskRepository.updateTaskDocuments(documents, id, manager);
        }
        return { id };
      };
      if (entityManager) {
        return await updateTask(entityManager); // Use the provided transaction
      } else {
        return await this.dataSource.transaction(updateTask); // Start a new transaction
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async completeTask(
    id: number,
    comments: string | null,
    userId: number,
    entityManager?: EntityManager,
    isTemplateApprovalTask?: boolean
  ) {
    try {
      const complete = async (manager: EntityManager) => {
        await this.taskRepository.completeTask(id, comments, userId, manager, isTemplateApprovalTask);
        return { id };
      };
      if (entityManager) {
        return await complete(entityManager);
      } else {
        return await this.dataSource.transaction(complete);
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(error.message);
    }
  }

  async deleteTaskById(id: number): Promise<void> {
    try {
      await this.taskRepository.deleteTaskById(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async getTasksByOpportunityActivityId(activityId: number) {
    try {
      return await this.taskRepository.getTasksByOpportunityActivityId(
        activityId
      );
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch tasks for the given opportunity and activity."
      );
    }
  }

  async getTaskByOpportunityAndStatus(
    opportunityId: number,
    taskStatusLid: number,
    taskTypeLid: number
  ): Promise<Task | null> {
    try {
      return await this.taskRepository.getTaskByOpportunityAndStatus(
        opportunityId,
        taskStatusLid,
        taskTypeLid
      );
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch task for the given opportunity, status, and type."
      );
    }
  }

  async getIsgPlanningAssignedTaskByOpportunityAndOwner(
    opportunityId: number,
    taskStatusLid: number,
    ownerId: number
  ): Promise<Task | null> {
    try {
      return await this.taskRepository.getIsgPlanningAssignedTaskByOpportunityAndOwner(
        opportunityId,
        taskStatusLid,
        ownerId
      );
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch task for the given opportunity, status, and type."
      );
    }
  }
}
