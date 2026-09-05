import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { CreateTaskDto } from "./dto/create-task.dto";
import { UpdateTaskDto } from "./dto/update-task.dto";
import { TaskDto } from "./dto/task-response.dto";
import { GetTasksDto } from "./dto/get-task.dto";

export const createTaskSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateTaskDto),
    ApiOperation({
      summary: "Create a new task",
      description: "Create a new task",
    }),
    ApiBody({
      description: "Task data",
      schema: {
        $ref: getSchemaPath(CreateTaskDto),
      },
    }),
    ApiResponse({
      status: 201,
      description: successMessage.taskCreation,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 201 },
          message: { type: "string", example: successMessage.taskCreation },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.taskCreationFailed,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: errorMessages.taskCreationFailed,
          },
        },
      },
    })
  );
};

export const updateTaskSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdateTaskDto),
    ApiOperation({
      summary: "Update a task",
      description: "Update a task",
    }),
    ApiParam({
      name: "id",
      description: "Task ID",
      type: Number,
    }),
    ApiBody({
      description: "Task data",
      schema: {
        $ref: getSchemaPath(UpdateTaskDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.taskUpdation,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.taskUpdation },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 1 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.taskUpdateFailed,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: errorMessages.taskUpdateFailed,
          },
        },
      },
    })
  );
};

export const getTaskByIdSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(TaskDto),
    ApiOperation({
      summary: "Get task by ID",
      description: "Get task by ID",
    }),
    ApiParam({
      name: "id",
      description: "Task ID",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.taskDetails,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.taskDetails },
          data: {
            $ref: getSchemaPath(TaskDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.taskNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: errorMessages.taskNotFound },
        },
      },
    })
  );
};

export const deleteTaskSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Delete a task",
      description: "Delete a task",
    }),
    ApiParam({
      name: "id",
      description: "Task ID",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.taskDeleted,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.taskDeleted },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.taskNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: errorMessages.taskNotFound },
        },
      },
    })
  );
};

export const getTasksSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get all tasks",
      description: "Get all tasks",
    }),
    ...Object.keys(GetTasksDto.prototype).map((key) =>
      ApiQuery({
        name: key,
        required: false,
        description: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetTasksDto.prototype,
          key
        )?.description,
        example: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetTasksDto.prototype,
          key
        )?.example,
      })
    ),
    ApiResponse({
      status: 200,
      description: successMessage.taskList,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.taskList },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  $ref: getSchemaPath(TaskDto),
                },
              },
              count: { type: "number", example: 10 },
            },
          },
        },
      },
    })
  );
};

export const completeTaskSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Mark task as complete" }),
    ApiParam({ name: "id", description: "Task ID", type: Number }),
    ApiResponse({
      status: 200,
      description: successMessage.taskCompleted,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.taskCompleted },
          data: {
            type: "object",
            properties: { id: { type: "number", example: 1 } },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.taskCompletionFailed,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: errorMessages.taskCompletionFailed },
        },
      },
    })
  );
};

export const getTasksByOpportunityActivitySwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get tasks by opportunity activity",
      description: "Retrieve all tasks associated with an opportunity activity"
    }),
    ApiParam({
      name: "opportunityActivityId",
      type: Number,
      description: "Opportunity Activity ID"
    }),
    ApiResponse({
      status: 200,
      description: "Tasks fetched successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: "Tasks fetched successfully" },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number", example: 399 },
                taskName: { type: "string", example: "Broking slip generation - Approval" },
                description: { type: "string", example: "Broking slip generation - Approval for Opportunity ID: 674554" },
                dueDate: { type: "string", example: "2025-07-09" },
                priority: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 3303 },
                    lookUpValue: { type: "string", example: "High" }
                  }
                },
                company: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 263642 },
                    name: { type: "string", example: "Dummy" }
                  }
                },
                assignee: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 1469 },
                    name: { type: "string", example: "Suryamohan" }
                  }
                },
                status: {
                  type: "object",
                  properties: {
                    closedDate: { type: "string", example: "2025-07-04" },
                    closedTime: { type: "string", example: "15:48:33" }
                  }
                },
                updatedBy: { type: "number", example: 2002 }
              }
            }
          }
        }
      }
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.taskNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: errorMessages.taskNotFound }
        }
      }
    })
  );
};