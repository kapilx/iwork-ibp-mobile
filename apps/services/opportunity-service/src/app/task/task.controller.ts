import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpStatus,
  Req,
  Res,
  Query,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { TaskService } from "./task.service";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  errorMessages,
  infoMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  createResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto, updateTaskCompleteDto } from "./dto/update-task.dto";
import {
  createTaskSwaggerMetadata,
  deleteTaskSwaggerMetadata,
  getTaskByIdSwaggerMetadata,
  getTasksSwaggerMetadata,
  updateTaskSwaggerMetadata,
  completeTaskSwaggerMetadata,
  getTasksByOpportunityActivitySwaggerMetadata,
} from "./task.swagger";
import { GetTasksDto } from "./dto/get-task.dto";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Controller("task")
export class TaskController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly taskService: TaskService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.OPPORTUNITY_SERVICE
    );
  }

  @Post()
  @createTaskSwaggerMetadata()
  async createTask(
    @Body() taskData: CreateTaskDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "TaskController",
        method: "createTask",
        messageData: "method invoked",
      }),
    });
    try {
      taskData.createdBy = userId;
      taskData.updatedBy = userId;
      if (!taskData.assigneeId) {
        taskData.assigneeId = userId; // Default to the user creating the task if no assignee is provided
      }
      const task = await this.taskService.createTask(taskData);
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(HttpStatus.CREATED, successMessage.taskCreation, task)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "TaskController",
          method: "createTask",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message || errorMessages.taskNotFound,
        infoMessages.forBidden,
        errorMessages.taskCreationFailed
      );
    }
  }

  @Get()
  @getTasksSwaggerMetadata()
  async getTasks(
    @Query() query: GetTasksDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const {
      page,
      limit,
      search,
      sort,
      searchBy,
      showCompleted,
      companyId,
      opportunityId,
      filterByOpportunity,
      viewBy,
    } = query;
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "TaskController",
        method: "getTasks",
        payload: { page, limit, search },
        messageData: "method invoked",
      }),
    });
    try {
      const tasks = await this.taskService.getTasks(
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search || "",
        sort || "dueDate:DESC",
        userId,
        searchBy || "",
        showCompleted === true,
        companyId,
        opportunityId,
        filterByOpportunity,
        viewBy
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.taskList, tasks));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "TaskController",
          method: "getTasks",
          payload: { page, limit, search },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message,
        infoMessages.forBidden,
        errorMessages.taskListRetrievalFailed
      );
    }
  }

  @Get(":id")
  @getTaskByIdSwaggerMetadata()
  async getTaskById(@Param("id") id: number, @Res() res: Response) {
    try {
      const task = await this.taskService.getTaskById(id);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.taskDetails, task));
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.taskNotFound,
        infoMessages.forBidden,
        errorMessages.taskDetailsRetrievalFailed
      );
    }
  }

  // Get tasks by opportunity activity ID
  @Get("activity/:opportunityActivityId")
  @getTasksByOpportunityActivitySwaggerMetadata()
  async getTasksByOpportunityActivityId(
    @Param("opportunityActivityId") opportunityActivityId: number,
    @Res() res: Response
  ) {
    try {
      const tasks = await this.taskService.getTasksByOpportunityActivityId(
        opportunityActivityId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.tasksFetched, tasks)
        );
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.taskNotFound,
        infoMessages.forBidden,
        errorMessages.failedToFetchTasks
      );
    }
  }

  @Put(":id")
  @updateTaskSwaggerMetadata()
  async updateTaskById(
    @Param("id") id: number,
    @Body() updateTask: UpdateTaskDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      updateTask.updatedBy = userId;
      const task = await this.taskService.updateTask(id, updateTask, userId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.taskUpdation, task));
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        error.message || errorMessages.taskNotFound,
        infoMessages.forBidden,
        errorMessages.taskUpdateFailed
      );
    }
  }

  @Put(":id/complete")
  @completeTaskSwaggerMetadata()
  async completeTaskById(
    @Param("id") id: number,
    @Res() res: Response,
    @Req() req: Request,
    @Body() body: updateTaskCompleteDto
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      const task = await this.taskService.completeTask(
        id,
        body?.comments ?? null,
        userId,
        undefined,
        body?.isTemplateApprovalTask ?? false
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.taskClosed, task));
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        error.message || errorMessages.taskNotFound,
        infoMessages.forBidden,
        errorMessages.taskCompletionFailed
      );
    }
  }

  @Delete(":id")
  @deleteTaskSwaggerMetadata()
  async deleteTaskById(@Param("id") id: number, @Res() res: Response) {
    try {
      await this.taskService.deleteTaskById(id);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.taskDeleted, null));
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.taskNotFound,
        infoMessages.forBidden,
        errorMessages.taskDeletionFailed
      );
    }
  }
}
