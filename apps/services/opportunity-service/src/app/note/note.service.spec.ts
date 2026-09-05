import { Test, TestingModule } from "@nestjs/testing";
import { DataSource, EntityManager } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { NoteService } from "./note.service";
import { NoteRepository } from "./note.repository";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";

const mockNoteRepository = () => ({
  createNote: jest.fn(),
  createNoteDocuments: jest.fn(),
  getNotes: jest.fn(),
  getNoteById: jest.fn(),
  updateNote: jest.fn(),
  updateNoteDocuments: jest.fn(),
  deleteNoteById: jest.fn(),
});

const mockDataSource = () => ({
  transaction: jest.fn(),
});

describe("NoteService", () => {
  let noteService: NoteService;
  let noteRepository: jest.Mocked<ReturnType<typeof mockNoteRepository>>;
  let dataSource: ReturnType<typeof mockDataSource>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NoteService,
        { provide: NoteRepository, useFactory: mockNoteRepository },
        { provide: DataSource, useFactory: mockDataSource },
      ],
    }).compile();

    noteService = module.get<NoteService>(NoteService);
    noteRepository = module.get(NoteRepository);
    dataSource = module.get(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createNote", () => {
    it("should create a note and documents successfully", async () => {
      const note = { id: 1 };
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      noteRepository.createNote.mockResolvedValue(note);
      noteRepository.createNoteDocuments.mockResolvedValue(undefined);

      const createNoteDto: CreateNoteDto = {
        title: "title",
        description: "Test",
        documents: [{ documentId: 2 }],
      } as any;

      const result = await noteService.createNote(createNoteDto);

      expect(result).toEqual({ id: 1 });
      expect(noteRepository.createNote).toHaveBeenCalledWith(
        { title: "title", description: "Test" },
        expect.any(Object)
      );
      expect(noteRepository.createNoteDocuments).toHaveBeenCalledWith(
        [{ documentId: 2 }],
        1,
        expect.any(Object)
      );
    });

    it("should create a note without documents", async () => {
      const note = { id: 1 };
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      noteRepository.createNote.mockResolvedValue(note);

      const createNoteDto: CreateNoteDto = {
        title: "title",
        description: "Test",
        documents: [],
      } as any;

      const result = await noteService.createNote(createNoteDto);

      expect(result).toEqual({ id: 1 });
      expect(noteRepository.createNoteDocuments).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      noteRepository.createNote.mockRejectedValue(
        new NotFoundException("Not found")
      );

      await expect(
        noteService.createNote({ title: "title", description: "Test" } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException on other errors", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      noteRepository.createNote.mockRejectedValue(new Error("Some error"));

      await expect(
        noteService.createNote({ title: "title", description: "Test" } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it("should use provided entityManager if passed", async () => {
      const note = { id: 1 };
      const entityManager = {} as EntityManager;
      noteRepository.createNote.mockResolvedValue(note);
      noteRepository.createNoteDocuments.mockResolvedValue(undefined);

      const createNoteDto: CreateNoteDto = {
        title: "title",
        description: "Test",
        documents: [{ documentId: 2 }],
      } as any;

      const result = await noteService.createNote(createNoteDto, entityManager);

      expect(result).toEqual({ id: 1 });
      expect(noteRepository.createNote).toHaveBeenCalledWith(
        { title: "title", description: "Test" },
        entityManager
      );
      expect(noteRepository.createNoteDocuments).toHaveBeenCalledWith(
        [{ documentId: 2 }],
        1,
        entityManager
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe("getNotes", () => {
    it("should return notes with pagination", async () => {
      noteRepository.getNotes.mockResolvedValue({ data: [], count: 0 });

      const result = await noteService.getNotes(1, 10, "", "", 1, "", undefined, undefined);

      expect(result).toEqual({ data: [], count: 0 });
      expect(noteRepository.getNotes).toHaveBeenCalled();
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      noteRepository.getNotes.mockRejectedValue(
        new NotFoundException("Not found")
      );

      await expect(
        noteService.getNotes(1, 10, "", "", 1, "", undefined, undefined)
      ).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw Error with custom message on other errors", async () => {
      noteRepository.getNotes.mockRejectedValue(new Error("fail"));

      await expect(
        noteService.getNotes(1, 10, "", "", 1, "", undefined, undefined)
      ).rejects.toThrow(
        errorMessages.noteListRetrievalFailed
      );
    });
  });

  describe("getNoteById", () => {
    it("should return note by id", async () => {
      noteRepository.getNoteById.mockResolvedValue({ id: 1 });

      const result = await noteService.getNoteById(1);

      expect(result).toEqual({ id: 1 });
      expect(noteRepository.getNoteById).toHaveBeenCalledWith(1);
    });

    it("should throw NotFoundException if note not found", async () => {
      noteRepository.getNoteById.mockResolvedValue(undefined);

      await expect(noteService.getNoteById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException on other errors", async () => {
      noteRepository.getNoteById.mockRejectedValue(new Error("fail"));

      await expect(noteService.getNoteById(1)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe("updateNoteById", () => {
    it("should update note and documents successfully", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      noteRepository.updateNote.mockResolvedValue(undefined);
      noteRepository.updateNoteDocuments.mockResolvedValue(undefined);

      const updateNoteDto: UpdateNoteDto = {
        title: "title",
        description: "Updated",
        documents: [{ documentId: 2 }],
      } as any;

      const result = await noteService.updateNoteById(1, updateNoteDto);

      expect(result).toEqual({ id: 1 });
      expect(noteRepository.updateNote).toHaveBeenCalledWith(
        1,
        { title: "title", description: "Updated" },
        expect.any(Object)
      );
      expect(noteRepository.updateNoteDocuments).toHaveBeenCalledWith(
        [{ documentId: 2 }],
        1,
        expect.any(Object)
      );
    });

    it("should update note without documents", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      noteRepository.updateNote.mockResolvedValue(undefined);

      const updateNoteDto: UpdateNoteDto = {
        title: "title",
        description: "Updated",
        documents: [],
      } as any;

      const result = await noteService.updateNoteById(1, updateNoteDto);

      expect(result).toEqual({ id: 1 });
      expect(noteRepository.updateNoteDocuments).not.toHaveBeenCalled();
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      noteRepository.updateNote.mockRejectedValue(
        new NotFoundException("Not found")
      );

      await expect(
        noteService.updateNoteById(1, {
          title: "title",
          description: "fail",
        } as any)
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException on other errors", async () => {
      dataSource.transaction.mockImplementation(async (cb: any) =>
        cb({} as EntityManager)
      );
      noteRepository.updateNote.mockRejectedValue(new Error("fail"));

      await expect(
        noteService.updateNoteById(1, {
          title: "title",
          description: "fail",
        } as any)
      ).rejects.toThrow(BadRequestException);
    });

    it("should use provided entityManager if passed", async () => {
      const entityManager = {} as EntityManager;
      noteRepository.updateNote.mockResolvedValue(undefined);
      noteRepository.updateNoteDocuments.mockResolvedValue(undefined);

      const updateNoteDto: UpdateNoteDto = {
        title: "title",
        description: "Updated",
        documents: [{ documentId: 2 }],
      } as any;

      const result = await noteService.updateNoteById(
        1,
        updateNoteDto,
        entityManager
      );

      expect(result).toEqual({ id: 1 });
      expect(noteRepository.updateNote).toHaveBeenCalledWith(
        1,
        { title: "title", description: "Updated" },
        entityManager
      );
      expect(noteRepository.updateNoteDocuments).toHaveBeenCalledWith(
        [{ documentId: 2 }],
        1,
        entityManager
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe("deleteNoteById", () => {
    it("should delete note by id", async () => {
      noteRepository.deleteNoteById.mockResolvedValue(undefined);

      await expect(noteService.deleteNoteById(1)).resolves.toBeUndefined();
      expect(noteRepository.deleteNoteById).toHaveBeenCalledWith(1);
    });

    it("should throw NotFoundException if repository throws NotFoundException", async () => {
      noteRepository.deleteNoteById.mockRejectedValue(
        new NotFoundException("Not found")
      );

      await expect(noteService.deleteNoteById(1)).rejects.toThrow(
        NotFoundException
      );
    });

    it("should throw BadRequestException on other errors", async () => {
      noteRepository.deleteNoteById.mockRejectedValue(new Error("fail"));

      await expect(noteService.deleteNoteById(1)).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
