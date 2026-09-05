import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository } from "typeorm";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { noteSearchObject } from "../../../../service-lib/src/lib/constants";
import {
  Company,
  FileUpload,
  Note,
  NoteDocumentMap,
  Opportunity,
  OpportunityActivityMap,
} from "../../../../service-lib/src/lib/entities";
import { CreateNoteDocumentDto, CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { NoteViewBy } from "./dto/get-note.dto";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";

@Injectable()
export class NoteRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(Note)
    private readonly noteRepository: Repository<Note>,
    private readonly entityService: EntityService,
    private readonly traceIdService: TraceIdService,
    private readonly scopeService: ScopeService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.OPPORTUNITY_SERVICE);
  }

  // Create a new note
  async createNote(
    noteDetails: Partial<CreateNoteDto>,
    entityManager: EntityManager
  ) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'NoteRepository',
        method: 'createNote',
        messageData: 'method invoked',
      }),
    });
    try {
      // Note linking validation
      await this.validateNoteAssociations(
        entityManager,
        noteDetails.companyId,
        noteDetails.opportunityId,
        noteDetails.activityId
      );
      const note = entityManager.create(Note, noteDetails);
      return await entityManager.save(Note, note);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'NoteRepository',
          method: 'createNote',
          messageData: error,
        }),
      });
      throw new Error("Error creating note: " + error.message);
    }
  }

  // Create note documents
  async createNoteDocuments(
    documents: CreateNoteDocumentDto[],
    noteId: number,
    entityManager: EntityManager
  ) {
    try {
      await Promise.all(
        documents.map(async (doc) => {
          if (doc.documentId) {
            const document = await entityManager.findOne(FileUpload, {
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
      const noteDocuments: Partial<NoteDocumentMap>[] = documents.map(
        (doc) => ({
          noteId: noteId,
          documentId: doc.documentId,
        })
      );
      await entityManager.save(NoteDocumentMap, noteDocuments);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error("Error creating note document: " + error.message);
    }
  }

  // Get notes with pagination, search, and sorting
  async getNotes(
    page: number,
    limit: number,
    searchArray: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    sort: { field: string; order: "ASC" | "DESC" }[],
    userId: number,
    searchBy: string,
    companyId?: number,
    opportunityId?: number,
    viewBy?: NoteViewBy
  ): Promise<{
    data: any[];
    count: number;
  }> {
    try {
      // Build scoped user IDs based on viewBy
      let scopedUserIds: number[];
      if (viewBy === NoteViewBy.SELF_ORG) {
        const hierarchyUsers = await this.scopeService.getNewEmployeeHierarchyByUserId(userId, false);
        scopedUserIds = Array.from(new Set([userId, ...hierarchyUsers.map(u => u.userId)].map(Number)));
      } else if (viewBy === NoteViewBy.SELF_TEAM) {
        const reporteeIds = await this.scopeService.fetchDirectReporteeUserIds(userId);
        scopedUserIds = Array.from(new Set([userId, ...reporteeIds].map(Number)));
      } else {
        scopedUserIds = [userId];
      }

      const { data, count } = await this.entityService.fetchEntityList(
        Note,
        page,
        limit,
        sort.length > 0 ? sort : [{ field: "createdAt", order: "DESC" }],
        ["company", "opportunity", "opportunity.policyType", "activity"],
        {
          createdBy: scopedUserIds.length === 1 ? scopedUserIds[0] : (In(scopedUserIds) as any),
          ...(companyId ? { companyId } : {}),
          ...(opportunityId ? { opportunityId } : {}),
        },
        undefined,
        searchArray.length === 0 ? [] : searchArray,
        undefined,
        searchBy,
        noteSearchObject
      );
      if (!data || data.length === 0) {
        return { data: [], count: 0 };
      }
      return { data: await this.transformGetNotesResponse(data), count };
    } catch (error) {
      throw new Error("Failed to fetch get notes list", error);
    }
  }

  // Get a note by ID
  async getNoteById(id: number) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'NoteRepository',
        method: 'getNoteById',
        payload: { id },
        messageData: 'method invoked',
      }),
    });
    try {
      const note = await this.noteRepository.findOne({
        where: { id },
        relations: [
          "company",
          "opportunity",
          "opportunity.policyType",
          "activity",
          "noteDocs",
        ],
      });
      if (!note) {
        throw new NotFoundException(errorMessages.noteNotFound);
      }
      const data = await this.transformNoteResponse([{ ...note }]);
      return data[0];
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'NoteRepository',
          method: 'getNoteById',
          payload: { id },
          messageData: error,
        }),
      });
      throw new Error("Error fetching note: " + error.message);
    }
  }

  async getNotesByOpportunityActivityId(
    activityId: number,
  ) {
    try {
      const notes = await this.noteRepository.find({
        where: {
          activityId,
        },
        order: { createdAt: "DESC" },
        relations: ["company",
          "opportunity",
          "opportunity.policyType",
          "activity",], // Ensure relations are properly loaded
        });
  
      const transformedNotes = notes.map((note: Note) => {
        return {
          id: note.id,
          noteTitle: note.title,
          description: note.description,
          companyId: undefined,
          company: note.company
            ?{
              id: note.company.id,
              name: note.company.companyName,
              displayName: note.company.displayName,
            }
          :null,
          opportunityId: undefined,
          opportunity: note.opportunity
            ? {
              id: note.opportunity.opportunityId,
              policy: note.opportunity.policyType?.lookUpValue,
            }
          : null,
          activityId: undefined,
          activity: note.activity
            ? {
              id: note.activity.id,
              activityKey: note.activity.activityKey,
              activityName: note.activity.activityName,
            }
          : null,
          };
        });
        return transformedNotes;
      } catch (error) {
        throw new Error(
          "Error fetching tasks by opportunity and activity: " + error.message
        );
      }
    }

  // Get notes by opportunity ID
  async updateNote(
    id: number,
    updateNote: UpdateNoteDto,
    entityManager: EntityManager
  ) {
    try {
      const note = await entityManager.findOne(Note, { where: { id } });
      if (!note) {
        throw new NotFoundException(errorMessages.noteNotFound);
      }
      // Validate associations before updating
      await this.validateNoteAssociations(
        entityManager,
        updateNote.companyId,
        updateNote.opportunityId,
        updateNote.activityId
      );
      Object.assign(note, updateNote);
      await entityManager.save(Note, note);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      if (error instanceof BadRequestException) throw error;
      throw new Error("Error updating note: " + error.message);
    }
  }

  // Update note documents
  async updateNoteDocuments(
    documents: CreateNoteDocumentDto[],
    noteId: number,
    entityManager: EntityManager
  ) {
    try {
      const existingDocuments = await entityManager.find(NoteDocumentMap, {
        where: { noteId },
      });
      const existingDocumentIds = existingDocuments.map((doc) =>
        Number(doc.documentId)
      );
      // Add new documents
      const newDocuments = documents.filter(
        (doc) => doc.documentId && !existingDocumentIds.includes(doc.documentId)
      );
      if (newDocuments.length > 0) {
        await this.createNoteDocuments(newDocuments, noteId, entityManager);
      }
      // Remove documents that are not in the documents array
      const documentsToRemove = existingDocuments.filter(
        (doc) => !documents.some((d) => d.documentId === doc.documentId)
      );
      if (documentsToRemove.length > 0) {
        await entityManager.remove(NoteDocumentMap, documentsToRemove);
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error("Error updating note document: " + error.message);
    }
  }

  // Delete a note by ID
  async deleteNoteById(id: number) {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'NoteRepository',
        method: 'deleteNoteById',
        payload: { id },
        messageData: 'method invoked',
      }),
    });
    try {
      const note = await this.noteRepository.findOne({ where: { id } });
      if (!note) {
        throw new NotFoundException(errorMessages.noteNotFound);
      }
      await this.noteRepository.softDelete({ id });
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'NoteRepository',
          method: 'deleteNoteById',
          payload: { id },
          messageData: error,
        }),
      });
      throw new Error("Error deleting note: " + error.message);
    }
  }

  // Transform note response to match the required format
  async transformNoteResponse(notes: Note[]) {
    try {
      return notes.map((note) => ({
        id: note.id,
        title: note.title,
        description: note.description,
        noteDocs: note?.noteDocs?.map((doc) => ({
          documentId: doc.documentId,
        })),
        companyId: undefined,
        company: note?.company
          ? {
              id: note.company.id,
              name: note.company.companyName,
              displayName: note.company.displayName,
            }
          : null,
        opportunityId: undefined,
        opportunity: note?.opportunity
          ? {
              opportunityId: note.opportunity.opportunityId,
              policy: note.opportunity.policyType?.lookUpValue,
            }
          : null,
        activityId: undefined,
        activity: note?.activity
          ? {
              id: note.activity.id,
              activityName: note.activity.activityName,
            }
          : null,
      }));
    } catch (error) {
      throw new Error("Failed to transform note response", error);
    }
  }

  // Transform get notes response to match the required format
  async transformGetNotesResponse(notes: Note[]) {
    try {
      return notes.map((note) => ({
        id: note.id,
        title: note.title,
        description: note.description,
        companyId: undefined,
        company: note?.company
          ? {
              id: note.company.id,
              name: note.company.companyName,
              displayName: note.company.displayName,
            }
          : undefined,
        opportunityId: undefined,
        opportunity: note?.opportunity
          ? {
              opportunityId: note.opportunity.opportunityId,
              policy: note.opportunity.policyType?.lookUpValue,
            }
          : undefined,
        activityId: undefined,
        activity: note?.activity
          ? {
              id: note.activity.id,
              activityName: note.activity.activityName,
            }
          : undefined,
      }));
    } catch (error) {
      throw new Error("Failed to transform get notes response", error);
    }
  }
  // Validate associations for note creation or update
  async validateNoteAssociations(
    entityManager: EntityManager,
    companyId: number | undefined | null,
    opportunityId: number | undefined | null,
    activityId: number | undefined | null
  ) {
    try {
      if (companyId) {
        const company = await entityManager.findOne(Company, {
          where: { id: companyId },
        });
        if (!company) {
          throw new NotFoundException(errorMessages.companyNotFound);
        }
      }
      if (opportunityId) {
        const opportunity = await entityManager.findOne(Opportunity, {
          where: { opportunityId },
        });
        if (!opportunity) {
          throw new NotFoundException(errorMessages.opportunityNotFound);
        }
      }
      if (opportunityId && activityId) {
        const activities = await entityManager.find(OpportunityActivityMap, {
          where: { opportunityId: opportunityId },
        });
        if (!activities || activities.length === 0) {
          throw new BadRequestException(
            "No activities found for the given opportunity ID"
          );
        }
        const activityExists = activities.some(
          (activity) => activity.id === activityId
        );
        if (!activityExists) {
          throw new BadRequestException(
            `Activity ID ${activityId} not found for the given opportunity ID`
          );
        }
      } else if (!opportunityId && activityId) {
        throw new BadRequestException(
          "Activity ID provided without an associated Opportunity ID"
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else if (error instanceof BadRequestException) {
        throw error;
      }
    }
  }
}
