import { Test, TestingModule } from "@nestjs/testing";
import { Repository, EntityManager } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException, BadRequestException } from "@nestjs/common";
import { NoteRepository } from "./note.repository";
import {
  Note,
  Company,
  Opportunity,
  FileUpload,
  NoteDocumentMap,
  OpportunityActivityMap,
} from "../../../../service-lib/src/lib/entities";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { CreateNoteDto, CreateNoteDocumentDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";

describe("NoteRepository", () => {
  let noteRepository: NoteRepository;
  let noteRepo: jest.Mocked<Repository<Note>>;
  let entityService: jest.Mocked<EntityService>;
  let entityManager: jest.Mocked<EntityManager>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoteRepository,
        {
          provide: getRepositoryToken(Note),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            softDelete: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: EntityService,
          useValue: {
            fetchEntityList: jest.fn(),
          },
        },
      ],
    }).compile();

    noteRepository = module.get(NoteRepository);
    noteRepo = module.get(getRepositoryToken(Note));
    entityService = module.get(EntityService);

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

  describe("createNote", () => {
    it("should create a note successfully", async () => {
      const noteDetails: Partial<CreateNoteDto> = {
        title: "title",
        description: "desc",
        companyId: 1,
      };
      jest
        .spyOn(noteRepository, "validateNoteAssociations")
        .mockResolvedValue(undefined);
      entityManager.create.mockReturnValue(noteDetails);
      entityManager.save.mockResolvedValue({ id: 1, ...noteDetails });

      const result = await noteRepository.createNote(
        noteDetails,
        entityManager
      );

      expect(noteRepository.validateNoteAssociations).toHaveBeenCalledWith(
        entityManager,
        1,
        undefined,
        undefined
      );
      expect(entityManager.create).toHaveBeenCalledWith(Note, noteDetails);
      expect(entityManager.save).toHaveBeenCalledWith(Note, noteDetails);
      expect(result).toEqual({ id: 1, ...noteDetails });
    });

    it("should throw NotFoundException from validateNoteAssociations", async () => {
      jest
        .spyOn(noteRepository, "validateNoteAssociations")
        .mockRejectedValue(new NotFoundException("not found"));
      await expect(
        noteRepository.createNote({}, entityManager)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException from validateNoteAssociations", async () => {
      jest
        .spyOn(noteRepository, "validateNoteAssociations")
        .mockRejectedValue(new BadRequestException("bad"));
      await expect(
        noteRepository.createNote({}, entityManager)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw generic error", async () => {
      jest
        .spyOn(noteRepository, "validateNoteAssociations")
        .mockResolvedValue(undefined);
      entityManager.create.mockImplementation(() => {
        throw new Error("fail");
      });
      await expect(
        noteRepository.createNote({}, entityManager)
      ).rejects.toThrow("Error creating note: fail");
    });
  });

  describe("createNoteDocuments", () => {
    it("should create note documents successfully", async () => {
      const docs: CreateNoteDocumentDto[] = [{ documentId: 1 }];
      entityManager.findOne.mockResolvedValue({ id: 1 });
      entityManager.save.mockResolvedValue(undefined);

      await expect(
        noteRepository.createNoteDocuments(docs, 1, entityManager)
      ).resolves.toBeUndefined();
      expect(entityManager.save).toHaveBeenCalled();
    });

    it("should throw NotFoundException if document not found", async () => {
      entityManager.findOne.mockResolvedValue(undefined);
      const docs: CreateNoteDocumentDto[] = [{ documentId: 99 }];
      await expect(
        noteRepository.createNoteDocuments(docs, 1, entityManager)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw generic error", async () => {
      entityManager.findOne.mockRejectedValue(new Error("fail"));
      const docs: CreateNoteDocumentDto[] = [{ documentId: 1 }];
      await expect(
        noteRepository.createNoteDocuments(docs, 1, entityManager)
      ).rejects.toThrow("Error creating note document: fail");
    });
  });

  describe("getNotes", () => {
    it("should return notes with pagination", async () => {
      entityService.fetchEntityList.mockResolvedValue({
        data: [{ id: 1 }],
        count: 1,
      });
      jest
        .spyOn(noteRepository, "transformGetNotesResponse")
        .mockResolvedValue([{ id: 1 }]);

      const result = await noteRepository.getNotes(
        1,
        10,
        [],
        [],
        1,
        "",
        undefined,
        undefined
      );
      expect(result).toEqual({ data: [{ id: 1 }], count: 1 });
    });

    it("should return empty data if no notes", async () => {
      entityService.fetchEntityList.mockResolvedValue({ data: [], count: 0 });
      const result = await noteRepository.getNotes(
        1,
        10,
        [],
        [],
        1,
        "",
        undefined,
        undefined
      );
      expect(result).toEqual({ data: [], count: 0 });
    });

    it("should throw error on fetchEntityList failure", async () => {
      entityService.fetchEntityList.mockRejectedValue(new Error("fail"));
      await expect(
        noteRepository.getNotes(1, 10, [], [], 1, "", undefined, undefined)
      ).rejects.toThrow("Failed to fetch get notes list");
    });
  });

  describe("getNoteById", () => {
    it("should return transformed note", async () => {
      noteRepo.findOne.mockResolvedValue({
        id: 1,
        noteDocs: [],
        company: null,
        opportunity: null,
        activity: null,
      });
      jest
        .spyOn(noteRepository, "transformNoteResponse")
        .mockResolvedValue([{ id: 1 }]);
      const result = await noteRepository.getNoteById(1);
      expect(result).toEqual({ id: 1 });
    });

    it("should throw NotFoundException if note not found", async () => {
      noteRepo.findOne.mockResolvedValue(undefined);
      await expect(noteRepository.getNoteById(1)).rejects.toThrow(
        "Note not found"
      );
    });

    it("should throw error on findOne failure", async () => {
      noteRepo.findOne.mockRejectedValue(new Error("fail"));
      await expect(noteRepository.getNoteById(1)).rejects.toThrow(
        "Error fetching note: fail"
      );
    });
  });

  describe("updateNote", () => {
    it("should update note successfully", async () => {
      entityManager.findOne.mockResolvedValue({ id: 1 });
      jest
        .spyOn(noteRepository, "validateNoteAssociations")
        .mockResolvedValue(undefined);
      entityManager.update.mockResolvedValue(undefined);

      await expect(
        noteRepository.updateNote(
          1,
          { title: "title", description: "desc" },
          entityManager
        )
      ).resolves.toBeUndefined();
      expect(entityManager.update).toHaveBeenCalled();
    });

    it("should throw NotFoundException if note not found", async () => {
      entityManager.findOne.mockResolvedValue(undefined);
      await expect(
        noteRepository.updateNote(
          1,
          { title: "title", description: "desc" },
          entityManager
        )
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw error on update failure", async () => {
      entityManager.findOne.mockResolvedValue({ id: 1 });
      jest
        .spyOn(noteRepository, "validateNoteAssociations")
        .mockResolvedValue(undefined);
      entityManager.update.mockRejectedValue(new Error("fail"));
      await expect(
        noteRepository.updateNote(
          1,
          { title: "title", description: "desc" },
          entityManager
        )
      ).rejects.toThrow("Error updating note: fail");
    });
  });

  describe("updateNoteDocuments", () => {
    it("should add and remove documents as needed", async () => {
      entityManager.find.mockResolvedValue([{ documentId: 1 }]);
      jest
        .spyOn(noteRepository, "createNoteDocuments")
        .mockResolvedValue(undefined);
      entityManager.remove.mockResolvedValue(undefined);

      const docs: CreateNoteDocumentDto[] = [{ documentId: 2 }];
      await expect(
        noteRepository.updateNoteDocuments(docs, 1, entityManager)
      ).resolves.toBeUndefined();
      expect(noteRepository.createNoteDocuments).toHaveBeenCalled();
      expect(entityManager.remove).toHaveBeenCalled();
    });

    it("should only add new documents", async () => {
      entityManager.find.mockResolvedValue([]);
      jest
        .spyOn(noteRepository, "createNoteDocuments")
        .mockResolvedValue(undefined);

      const docs: CreateNoteDocumentDto[] = [{ documentId: 2 }];
      await expect(
        noteRepository.updateNoteDocuments(docs, 1, entityManager)
      ).resolves.toBeUndefined();
      expect(noteRepository.createNoteDocuments).toHaveBeenCalled();
    });

    it("should only remove documents", async () => {
      entityManager.find.mockResolvedValue([{ documentId: 1 }]);
      jest
        .spyOn(noteRepository, "createNoteDocuments")
        .mockResolvedValue(undefined);
      entityManager.remove.mockResolvedValue(undefined);

      const docs: CreateNoteDocumentDto[] = [];
      await expect(
        noteRepository.updateNoteDocuments(docs, 1, entityManager)
      ).resolves.toBeUndefined();
      expect(entityManager.remove).toHaveBeenCalled();
    });

    it("should throw error on failure", async () => {
      entityManager.find.mockRejectedValue(new Error("fail"));
      await expect(
        noteRepository.updateNoteDocuments([], 1, entityManager)
      ).rejects.toThrow("Error updating note document: fail");
    });
  });

  describe("deleteNoteById", () => {
    it("should delete note if found", async () => {
      noteRepo.findOne.mockResolvedValue({ id: 1 });
      noteRepo.softDelete.mockResolvedValue(undefined);

      await expect(noteRepository.deleteNoteById(1)).resolves.toBeUndefined();
      expect(noteRepo.softDelete).toHaveBeenCalledWith({ id: 1 });
    });

    it("should throw NotFoundException if note not found", async () => {
      noteRepo.findOne.mockResolvedValue(undefined);
      await expect(noteRepository.deleteNoteById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw error on softDelete failure", async () => {
      noteRepo.findOne.mockResolvedValue({ id: 1 });
      noteRepo.softDelete.mockRejectedValue(new Error("fail"));
      await expect(noteRepository.deleteNoteById(1)).rejects.toThrow(
        "Error deleting note: fail"
      );
    });
  });

  describe("transformNoteResponse", () => {
    it("should transform notes", async () => {
      const notes = [
        {
          id: 1,
          title: "title",
          description: "desc",
          noteDocs: [{ documentId: 2 }],
          company: { id: 1, companyName: "c", displayName: "d" },
          opportunity: { opportunityId: 1, policyType: { lookUpValue: "p" } },
          activity: { id: 1, activityName: "a" },
        },
      ];
      const result = await noteRepository.transformNoteResponse(notes as any);
      expect(result[0].id).toBe(1);
      expect(result[0].company.name).toBe("c");
    });

    it("should throw error on failure", async () => {
      await expect(
        noteRepository.transformNoteResponse(undefined as any)
      ).rejects.toThrow("Failed to transform note response");
    });
  });

  describe("transformGetNotesResponse", () => {
    it("should transform notes", async () => {
      const notes = [
        {
          id: 1,
          title: "title",
          description: "desc",
          company: { id: 1, companyName: "c", displayName: "d" },
          opportunity: { opportunityId: 1, policyType: { lookUpValue: "p" } },
          activity: { id: 1, activityName: "a" },
        },
      ];
      const result = await noteRepository.transformGetNotesResponse(
        notes as any
      );
      expect(result[0].id).toBe(1);
      expect(result[0].company.name).toBe("c");
    });

    it("should throw error on failure", async () => {
      await expect(
        noteRepository.transformGetNotesResponse(undefined as any)
      ).rejects.toThrow("Failed to transform get notes response");
    });
  });

  describe("validateNoteAssociations", () => {
    it("should validate company, opportunity, and activity", async () => {
      entityManager.findOne.mockResolvedValueOnce({ id: 1 }); // company
      entityManager.findOne.mockResolvedValueOnce({ opportunityId: 2 }); // opportunity
      entityManager.find.mockResolvedValueOnce([{ id: 3 }]); // activities

      await expect(
        noteRepository.validateNoteAssociations(entityManager, 1, 2, 3)
      ).resolves.toBeUndefined();
    });

    it("should throw NotFoundException if company not found", async () => {
      entityManager.findOne.mockResolvedValueOnce(undefined);
      await expect(
        noteRepository.validateNoteAssociations(
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
        noteRepository.validateNoteAssociations(entityManager, 1, 2, undefined)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if no activities for opportunity", async () => {
      entityManager.findOne.mockResolvedValueOnce({ id: 1 }); // company
      entityManager.findOne.mockResolvedValueOnce({ opportunityId: 2 }); // opportunity
      entityManager.find.mockResolvedValueOnce([]);
      await expect(
        noteRepository.validateNoteAssociations(entityManager, 1, 2, 3)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if activity not found for opportunity", async () => {
      entityManager.findOne.mockResolvedValueOnce({ id: 1 }); // company
      entityManager.findOne.mockResolvedValueOnce({ opportunityId: 2 }); // opportunity
      entityManager.find.mockResolvedValueOnce([{ id: 4 }]);
      await expect(
        noteRepository.validateNoteAssociations(entityManager, 1, 2, 3)
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if activityId provided without opportunityId", async () => {
      await expect(
        noteRepository.validateNoteAssociations(
          entityManager,
          undefined,
          undefined,
          3
        )
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getNoteById", () => {
    it("should throw NotFoundException if note is not found", async () => {
      noteRepo.findOne.mockResolvedValue(undefined);
      await expect(noteRepository.getNoteById(123)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("transformGetNotesResponse", () => {
    it("should throw error if transformation fails", async () => {
      // Simulate an error in transformation logic
      await expect(
        noteRepository.transformGetNotesResponse(undefined as any)
      ).rejects.toThrow("Failed to transform get notes response");
    });
  });
});
