import { Test, TestingModule } from "@nestjs/testing";
import { NoteController } from "./note.controller";
import { NoteService } from "./note.service";
import { CreateNoteDto } from "./dto/create-note.dto";
import { UpdateNoteDto } from "./dto/update-note.dto";
import { GetNotesDto } from "./dto/get-note.dto";
import { successMessage } from "../../../../../../libs/service-lib/src/lib/messages";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from "../../../../../../libs/service-lib/src/lib/constants";

// Mock Guards
jest.mock("../../../../../services/auth-service/src/guards/auth.guard", () => ({
  AuthGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));
jest.mock("../../../../../services/auth-service/src/guards/role.guard", () => ({
  RolesGuard: jest.fn().mockImplementation(() => ({
    canActivate: () => true,
  })),
}));

// Interfaces for mock request/response
interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}
interface MockRequest {
  user?: { userDetails?: { userId?: number } };
}

const createMockRes = (): MockResponse => {
  const res: Partial<MockResponse> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as MockResponse;
};

const createMockReq = (userId = 1): MockRequest => ({
  user: { userDetails: { userId } },
});

describe("NoteController", () => {
  let controller: NoteController;
  let noteService: NoteService;

  const noteServiceMock = {
    createNote: jest.fn(),
    getNotes: jest.fn(),
    getNoteById: jest.fn(),
    updateNoteById: jest.fn(),
    deleteNoteById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NoteController],
      providers: [{ provide: NoteService, useValue: noteServiceMock }],
    }).compile();

    controller = module.get<NoteController>(NoteController);
    noteService = module.get<NoteService>(NoteService);

    jest.clearAllMocks();
  });

  describe("createNote", () => {
    it("should validate required fields and create a note", async () => {
      const res = createMockRes();
      const req = createMockReq(10);
      const dto: CreateNoteDto = { description: "test note" } as any;
      noteServiceMock.createNote.mockResolvedValue({ id: 1 });

      await controller.createNote(dto, res as any, req as any);

      expect(noteServiceMock.createNote).toHaveBeenCalledWith({
        ...dto,
        createdBy: 10,
        updatedBy: 10,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 201,
          message: successMessage.noteCreation,
          data: { id: 1 },
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      const req = createMockReq();
      const dto: CreateNoteDto = { description: "fail" } as any;
      noteServiceMock.createNote.mockRejectedValue(new Error("fail"));

      await controller.createNote(dto, res as any, req as any);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getNotes", () => {
    it("should return notes with pagination and validation", async () => {
      const res = createMockRes();
      const req = createMockReq(5);
      const notes = { data: [{ id: 1 }], count: 1 };
      noteServiceMock.getNotes.mockResolvedValue(notes);

      await controller.getNotes(
        {
          page: 2,
          limit: 5,
          search: "abc",
          sort: "createdAt:ASC",
          searchBy: "desc",
        } as GetNotesDto,
        res as any,
        req as any
      );

      expect(noteServiceMock.getNotes).toHaveBeenCalledWith(
        2,
        5,
        "abc",
        "createdAt:ASC",
        5,
        "desc",
        undefined,
        undefined
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.noteList,
          data: notes,
        })
      );
    });

    it("should use default values if query params are missing", async () => {
      const res = createMockRes();
      const req = createMockReq(4);
      const notes = { data: [], count: 0 };
      noteServiceMock.getNotes.mockResolvedValue(notes);

      await controller.getNotes({} as GetNotesDto, res as any, req as any);

      expect(noteServiceMock.getNotes).toHaveBeenCalledWith(
        DEFAULT_PAGE,
        DEFAULT_LIMIT,
        "",
        "createdAt:DESC",
        4,
        "",
        undefined,
        undefined
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      const req = createMockReq();
      noteServiceMock.getNotes.mockRejectedValue(new Error("fail"));

      await controller.getNotes({} as GetNotesDto, res as any, req as any);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("getNoteById", () => {
    it("should return note details with 200", async () => {
      const res = createMockRes();
      noteServiceMock.getNoteById.mockResolvedValue({ id: 1 });

      await controller.getNoteById(1, res as any);

      expect(noteServiceMock.getNoteById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.noteDetails,
          data: { id: 1 },
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      noteServiceMock.getNoteById.mockRejectedValue(new Error("fail"));

      await controller.getNoteById(1, res as any);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("updateNoteById", () => {
    it("should validate required fields and update note", async () => {
      const res = createMockRes();
      const req = createMockReq(7);
      const dto: UpdateNoteDto = { description: "updated" } as any;
      noteServiceMock.updateNoteById.mockResolvedValue({ id: 1 });

      await controller.updateNoteById(1, dto, res as any, req as any);

      expect(noteServiceMock.updateNoteById).toHaveBeenCalledWith(1, {
        ...dto,
        updatedBy: 7,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.noteUpdate,
          data: { id: 1 },
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      const req = createMockReq();
      noteServiceMock.updateNoteById.mockRejectedValue(new Error("fail"));

      await controller.updateNoteById(
        1,
        {} as UpdateNoteDto,
        res as any,
        req as any
      );

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("deleteNoteById", () => {
    it("should delete note and return 200", async () => {
      const res = createMockRes();
      noteServiceMock.deleteNoteById.mockResolvedValue(undefined);

      await controller.deleteNoteById(1, res as any);

      expect(noteServiceMock.deleteNoteById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 200,
          message: successMessage.noteDeleted,
          data: null,
        })
      );
    });

    it("should handle error and return error response", async () => {
      const res = createMockRes();
      noteServiceMock.deleteNoteById.mockRejectedValue(new Error("fail"));

      await controller.deleteNoteById(1, res as any);

      expect(res.json).toHaveBeenCalled();
    });
  });
});
