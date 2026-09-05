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
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { GetNotesDto, NoteDto } from "./dto/get-note.dto";

export const createNoteSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateNoteDto),
    ApiOperation({
      summary: "Create a new note",
      description: "Create a new note",
    }),
    ApiBody({
      description: "Note data",
      schema: {
        $ref: getSchemaPath(CreateNoteDto),
      },
    }),
    ApiResponse({
      status: 201,
      description: successMessage.noteCreation,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 201 },
          message: { type: "string", example: successMessage.noteCreation },
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
      description: errorMessages.noteCreationFailed,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: errorMessages.noteCreationFailed,
          },
        },
      },
    })
  );
};

export const updateNoteSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdateNoteDto),
    ApiOperation({
      summary: "Update a note",
      description: "Update a note",
    }),
    ApiParam({
      name: "id",
      description: "Note ID",
      type: Number,
    }),
    ApiBody({
      description: "Note data",
      schema: {
        $ref: getSchemaPath(UpdateNoteDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.noteUpdate,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.noteUpdate },
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
      description: errorMessages.noteUpdateFailed,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: errorMessages.noteUpdateFailed,
          },
        },
      },
    })
  );
};

export const getNotesSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get all notes",
      description: "Get all notes",
    }),
    ...Object.keys(GetNotesDto.prototype).map((key) =>
      ApiQuery({
        name: key,
        required: false,
        description: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetNotesDto.prototype,
          key
        )?.description,
        example: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetNotesDto.prototype,
          key
        )?.example,
      })
    ),
    ApiResponse({
      status: 200,
      description: successMessage.noteList,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.noteList },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  $ref: getSchemaPath(NoteDto),
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

export const getNoteByIdSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(NoteDto),
    ApiOperation({
      summary: "Get note by ID",
      description: "Get note by ID",
    }),
    ApiParam({
      name: "id",
      description: "Note ID",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.noteDetails,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.noteDetails },
          data: {
            $ref: getSchemaPath(NoteDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.noteNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: errorMessages.noteNotFound },
        },
      },
    })
  );
};

export const deleteNoteSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Delete a note",
      description: "Delete a note",
    }),
    ApiParam({
      name: "id",
      description: "Note ID",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: successMessage.noteDeleted,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.noteDeleted },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.noteNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: errorMessages.noteNotFound },
        },
      },
    })
  );
};
