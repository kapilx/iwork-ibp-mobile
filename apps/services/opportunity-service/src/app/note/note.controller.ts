import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
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
import { CreateNoteDto } from "./dto/create-note.dto";
import { GetNotesDto } from "./dto/get-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { NoteService } from "./note.service";
import {
  createNoteSwaggerMetadata,
  deleteNoteSwaggerMetadata,
  getNoteByIdSwaggerMetadata,
  getNotesSwaggerMetadata,
  updateNoteSwaggerMetadata,
} from "./note.swagger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Controller("note")
export class NoteController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly noteService: NoteService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.OPPORTUNITY_SERVICE);
  }

  // Create a new note
  @Post()
  @createNoteSwaggerMetadata()
  async createNote(
    @Body() noteData: CreateNoteDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'NoteController',
        method: 'createNote',
        messageData: 'method invoked',
      }),
    });
    try {
      const userId = parseInt(req?.headers?.userid);
      noteData.createdBy = userId;
      noteData.updatedBy = userId;
      const note = await this.noteService.createNote(noteData);
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(HttpStatus.CREATED, successMessage.noteCreation, note)
        );
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'NoteController',
          method: 'createNote',
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message || errorMessages.noteNotFound,
        infoMessages.forBidden,
        errorMessages.noteCreationFailed
      );
    }
  }

  // Get notes with pagination, search, and sorting
  @Get()
  @getNotesSwaggerMetadata()
  async getNotes(
    @Query() query: GetNotesDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const { page, limit, search, sort, searchBy, companyId, opportunityId, viewBy } =
      query;
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'NoteController',
        method: 'getNotes',
        payload: { page, limit, search, companyId, opportunityId },
        messageData: 'method invoked',
      }),
    });
    try {
      const notes = await this.noteService.getNotes(
        page || DEFAULT_PAGE,
        limit || DEFAULT_LIMIT,
        search || "",
        sort || "createdAt:DESC",
        userId,
        searchBy || "",
        companyId,
        opportunityId,
        viewBy
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.noteList, notes));
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'NoteController',
          method: 'getNotes',
          payload: { page, limit, search, companyId, opportunityId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message,
        infoMessages.forBidden,
        errorMessages.noteListRetrievalFailed
      );
    }
  }

  // Get a note by ID
  @Get(":id")
  @getNoteByIdSwaggerMetadata()
  async getNoteById(@Param("id") id: number, @Res() res: Response) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'NoteController',
        method: 'getNoteById',
        payload: { id },
        messageData: 'method invoked',
      }),
    });
    try {
      const note = await this.noteService.getNoteById(id);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.noteDetails, note));
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'NoteController',
          method: 'getNoteById',
          payload: { id },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.noteNotFound,
        infoMessages.forBidden,
        errorMessages.noteDetailsRetrievalFailed
      );
    }
  }

  @Get("activity/:opportunityActivityId")
  async getTasksByOpportunityActivityId(
    @Param("opportunityActivityId") opportunityActivityId: number,
    @Res() res: Response
  ) {
    try {
      const notes = await this.noteService.getNotesByOpportunityActivityId(
        opportunityActivityId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.notesFetched, notes)
        );
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.noteNotFound,
        infoMessages.forBidden,
        errorMessages.failedToFetchNotes
      );
    }
  }

  // Update a note by ID
  @Put(":id")
  @updateNoteSwaggerMetadata()
  async updateNoteById(
    @Param("id") id: number,
    @Body() updateNote: UpdateNoteDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: 'success',
        location: 'NoteController',
        method: 'updateNoteById',
        payload: { id },
        messageData: 'method invoked',
      }),
    });
    try {
      updateNote.updatedBy = userId;
      const note = await this.noteService.updateNoteById(id, updateNote);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.noteUpdate, note));
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'NoteController',
          method: 'updateNoteById',
          payload: { id },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        error.message || errorMessages.noteNotFound,
        infoMessages.forBidden,
        errorMessages.noteUpdateFailed
      );
    }
  }

  // Delete a note by ID
  @Delete(":id")
  @deleteNoteSwaggerMetadata()
  async deleteNoteById(@Param("id") id: number, @Res() res: Response) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'NoteController',
        method: 'deleteNoteById',
        payload: { id },
        messageData: 'method invoked',
      }),
    });
    try {
      await this.noteService.deleteNoteById(id);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.noteDeleted, null));
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'NoteController',
          method: 'deleteNoteById',
          payload: { id },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.noteNotFound,
        infoMessages.forBidden,
        errorMessages.noteDeletionFailed
      );
    }
  }
}
