import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import {
  mapSearchParams,
  mapSortParams,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { NoteViewBy } from "./dto/get-note.dto";
import { NoteRepository } from "./note.repository";
@Injectable()
export class NoteService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly noteRepository: NoteRepository,
    private readonly dataSource: DataSource,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.OPPORTUNITY_SERVICE);
  }

  // Create a new note
  async createNote(noteData: CreateNoteDto, entityManager?: EntityManager) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'NoteService',
        method: 'createNote',
        messageData: 'method invoked',
      }),
    });
    try {
      const createNote = async (manager: EntityManager) => {
        const { documents, ...noteDetails } = noteData;
        const note = await this.noteRepository.createNote(noteDetails, manager);
        if (documents && documents.length > 0) {
          await this.noteRepository.createNoteDocuments(
            documents,
            note.id,
            manager
          );
        }
        return { id: note.id };
      };
      if (entityManager) {
        return await createNote(entityManager); // Use the provided transaction
      } else {
        return await this.dataSource.transaction(createNote); // Start a new transaction
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'NoteService',
          method: 'createNote',
          messageData: error,
        }),
      });
      throw new BadRequestException(error.message);
    }
  }

  // Get notes with pagination, search, and sorting
  async getNotes(
    page: number,
    limit: number,
    search: string,
    sort: string,
    userId: number,
    searchBy: string,
    companyId?: number,
    opportunityId?: number,
    viewBy?: NoteViewBy
  ) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'NoteService',
        method: 'getNotes',
        payload: { page, limit, search, companyId, opportunityId },
        messageData: 'method invoked',
      }),
    });
    try {
      const searchParams = mapSearchParams(search);
      const sortParams = mapSortParams(sort);
      const notes = await this.noteRepository.getNotes(
        page,
        limit,
        searchParams,
        sortParams,
        userId,
        searchBy,
        companyId,
        opportunityId,
        viewBy
      );
      return notes;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'NoteService',
          method: 'getNotes',
          payload: { page, limit, search, companyId, opportunityId },
          messageData: error,
        }),
      });
      throw new Error(errorMessages.noteListRetrievalFailed);
    }
  }

  // Get a note by ID
  async getNoteById(id: number) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'NoteService',
        method: 'getNoteById',
        payload: { id },
        messageData: 'method invoked',
      }),
    });
    try {
      const note = await this.noteRepository.getNoteById(id);
      if (!note) {
        throw new NotFoundException(errorMessages.noteNotFound);
      }
      return note;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'NoteService',
          method: 'getNoteById',
          payload: { id },
          messageData: error,
        }),
      });
      throw new BadRequestException(error.message);
    }
  }

  async getNotesByOpportunityActivityId(activityId: number) {
    try {
      return await this.noteRepository.getNotesByOpportunityActivityId(
        activityId
      );
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch notes for the given opportunity and activity."
      );
    }
  }

  // Update a note by ID
  async updateNoteById(
    id: number,
    updateNoteData: UpdateNoteDto,
    entityManager?: EntityManager
  ) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'NoteService',
        method: 'updateNoteById',
        payload: { id },
        messageData: 'method invoked',
      }),
    });
    try {
      const updateNote = async (manager: EntityManager) => {
        const { documents, ...noteDetails } = updateNoteData;
        await this.noteRepository.updateNote(id, noteDetails, manager);
        if (documents && documents.length > 0) {
          await this.noteRepository.updateNoteDocuments(documents, id, manager);
        }
        return { id };
      };
      if (entityManager) {
        return await updateNote(entityManager); // Use the provided transaction
      } else {
        return await this.dataSource.transaction(updateNote); // Start a new transaction
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'NoteService',
          method: 'updateNoteById',
          payload: { id },
          messageData: error,
        }),
      });
      throw new BadRequestException(error.message);
    }
  }

  // Delete a note by ID
  async deleteNoteById(id: number): Promise<void> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'NoteService',
        method: 'deleteNoteById',
        payload: { id },
        messageData: 'method invoked',
      }),
    });
    try {
      await this.noteRepository.deleteNoteById(id);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'NoteService',
          method: 'deleteNoteById',
          payload: { id },
          messageData: error,
        }),
      });
      throw new BadRequestException(error.message);
    }
  }
}
