import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditHistoryService } from '../services/audit-history.service';
import { AuditHistoryLog } from '../../entities/audit-history-log.entity';
import { AuditHistoryQueryDto } from '../../dto/audit-history-query.dto';
import { AuditHistoryAction } from '../audit-history.constants';

describe('AuditService', () => {
  let service: AuditHistoryService;
  let repository: Repository<AuditHistoryLog>;

  const mockRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditHistoryService,
        {
          provide: getRepositoryToken(AuditHistoryLog),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuditHistoryService>(AuditHistoryService);
    repository = module.get<Repository<AuditHistoryLog>>(getRepositoryToken(AuditHistoryLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [
        { id: '1', entityType: 'User', action: AuditHistoryAction.INSERT },
        { id: '2', entityType: 'User', action: AuditHistoryAction.UPDATE },
      ];
      const mockCount = 2;

      mockRepository.findAndCount.mockResolvedValue([mockLogs, mockCount]);

      const query: AuditHistoryQueryDto = {
        limit: '10',
        offset: '0',
      };

      const result = await service.findAll(query);

      expect(result).toEqual([mockLogs, mockCount]);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        relations: ['details'],
        order: { createdAt: 'DESC' },
        take: 10,
        skip: 0,
      });
    });

    it('should filter by entity type and action', async () => {
      const mockLogs = [{ id: '1', entityType: 'User', action: AuditHistoryAction.INSERT }];
      const mockCount = 1;

      mockRepository.findAndCount.mockResolvedValue([mockLogs, mockCount]);

      const query: AuditHistoryQueryDto = {
        entityType: 'User',
        action: AuditHistoryAction.INSERT,
        limit: '20',
        offset: '0',
      };

      const result = await service.findAll(query);

      expect(result).toEqual([mockLogs, mockCount]);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          entityType: 'User',
          action: AuditHistoryAction.INSERT,
        },
        relations: ['details'],
        order: { createdAt: 'DESC' },
        take: 20,
        skip: 0,
      });
    });

    it('should filter by date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      const query: AuditHistoryQueryDto = {
        startDate,
        endDate,
        limit: '20',
        offset: '0',
      };

      await service.findAll(query);

      expect(mockRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          createdAt: expect.any(Object), // Between operator
        },
        relations: ['details'],
        order: { createdAt: 'DESC' },
        take: 20,
        skip: 0,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single audit log by id', async () => {
      const mockLog = {
        id: '1',
        entityType: 'User',
        action: AuditHistoryAction.INSERT,
        details: [],
      };

      mockRepository.findOne.mockResolvedValue(mockLog);

      const result = await service.findOne('1');

      expect(result).toEqual(mockLog);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        relations: ['details'],
      });
    });
  });

  describe('findByEntity', () => {
    it('should return audit logs for specific entity', async () => {
      const mockLogs = [
        { id: '1', entityType: 'User', entityId: '123', action: AuditHistoryAction.INSERT },
        { id: '2', entityType: 'User', entityId: '123', action: AuditHistoryAction.UPDATE },
      ];

      mockRepository.find.mockResolvedValue(mockLogs);

      const result = await service.findByEntity('User', '123');

      expect(result).toEqual(mockLogs);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { entityType: 'User', entityId: '123' },
        relations: ['details'],
        order: { createdAt: 'DESC' },
      });
    });
  });
});