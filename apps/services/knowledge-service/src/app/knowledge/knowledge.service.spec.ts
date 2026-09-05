import { Test, TestingModule } from '@nestjs/testing';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeRepository } from './knowledge.repository';

describe('KnowledgeService', () => {
  let service: KnowledgeService;
  let repo: jest.Mocked<KnowledgeRepository>;

  const mockRepo = {
    findActiveDocument: jest.fn(),
    incrementAccessCount: jest.fn(),
    getFileStream: jest.fn(),
  } as unknown as jest.Mocked<KnowledgeRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KnowledgeService,
        { provide: KnowledgeRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<KnowledgeService>(KnowledgeService);
    repo = module.get(KnowledgeRepository) as jest.Mocked<KnowledgeRepository>;

    jest.clearAllMocks();
  });

  it('should return stream result for stored file', async () => {
    const doc: any = {
      documentId: 1,
      relativePath: 'path/file.pdf',
      title: 'Doc',
      extension: 'pdf',
    };
    const stream = {} as any;
    repo.findActiveDocument.mockResolvedValue(doc);
    repo.getFileStream.mockReturnValue(stream);

    const result = await service.download(1);

    expect(repo.findActiveDocument).toHaveBeenCalledWith(1);
    expect(repo.incrementAccessCount).toHaveBeenCalledWith(1);
    expect(repo.getFileStream).toHaveBeenCalledWith('path/file.pdf');
    expect(result).toEqual({ stream, fileName: 'Doc.pdf' });
  });

  it('should return url result when relativePath is url', async () => {
    const doc: any = {
      documentId: 2,
      relativePath: 'https://test.com/file',
      title: 'Doc',
      extension: 'pdf',
    };
    repo.findActiveDocument.mockResolvedValue(doc);

    const result = await service.download(2);

    expect(repo.findActiveDocument).toHaveBeenCalledWith(2);
    expect(repo.incrementAccessCount).toHaveBeenCalledWith(2);
    expect(repo.getFileStream).not.toHaveBeenCalled();
    expect(result).toEqual({ url: 'https://test.com/file', fileName: 'Doc.pdf' });
  });

  it('should return null when document is not found', async () => {
    repo.findActiveDocument.mockResolvedValue(null);

    const result = await service.download(3);

    expect(result).toBeNull();
    expect(repo.incrementAccessCount).not.toHaveBeenCalled();
  });
});
