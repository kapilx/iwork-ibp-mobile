import { Test, TestingModule } from '@nestjs/testing';
import { DataSource, QueryRunner, EntityMetadata, ColumnMetadata } from 'typeorm';
import { AuditHistorySubscriber } from './audit-history.subscriber';
import { AuditHistoryLog } from '../../entities/audit-history-log.entity';
import { AuditHistoryLogDetail } from '../../entities/audit-history-log-detail.entity';
import { AuditHistoryAction, AUDIT_CONTEXT_KEY } from '../audit-history.constants';
import { Auditable } from '../decorators/auditable.decorator';
import { SkipAudit } from '../decorators/skip-audit.decorator';

@Auditable({ name: 'TestEntity' })
class TestEntity {
  id: string = '123';
  name: string = 'Test';
  @SkipAudit()
  password: string = 'secret';
}

describe('AuditSubscriber', () => {
  let auditSubscriber: AuditHistorySubscriber;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let mockManager: any;

  beforeEach(async () => {
    mockManager = {
      save: jest.fn().mockResolvedValue({}),
    };

    queryRunner = {
      data: {
        [AUDIT_CONTEXT_KEY]: {
          userId: 'user123',
          ipAddress: '127.0.0.1',
          userAgent: 'Jest Test',
          requestId: 'req123',
        },
      },
      manager: mockManager,
    } as any;

    dataSource = {
      subscribers: [],
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: AuditHistorySubscriber,
          useFactory: () => new AuditHistorySubscriber(dataSource),
        },
      ],
    }).compile();

    auditSubscriber = module.get<AuditHistorySubscriber>(AuditHistorySubscriber);
  });

  describe('afterInsert', () => {
    it('should create audit log for insert action', async () => {
      const entity = new TestEntity();
      const mockMetadata = {
        columns: [
          { propertyName: 'id', type: 'varchar' },
          { propertyName: 'name', type: 'varchar' },
          { propertyName: 'password', type: 'varchar' },
        ],
      } as any;

      const insertEvent = {
        entity,
        metadata: mockMetadata,
        queryRunner,
      } as any;

      await auditSubscriber.afterInsert(insertEvent);

      expect(mockManager.save).toHaveBeenCalledTimes(2);
      
      const auditLogCall = mockManager.save.mock.calls[0];
      expect(auditLogCall[0]).toBe(AuditHistoryLog);
      expect(auditLogCall[1]).toMatchObject({
        action: AuditHistoryAction.INSERT,
        entityType: 'TestEntity',
        entityName: 'TestEntity',
        entityId: '123',
        userId: 'user123',
        ipAddress: '127.0.0.1',
        userAgent: 'Jest Test',
        requestId: 'req123',
      });

      const auditDetailCall = mockManager.save.mock.calls[1];
      expect(auditDetailCall[0]).toBe(AuditHistoryLogDetail);
      expect(auditDetailCall[1]).toHaveLength(2); // password field should be skipped
      expect(auditDetailCall[1][0]).toMatchObject({
        fieldName: 'id',
        oldValue: null,
        newValue: '123',
        fieldType: 'varchar',
      });
      expect(auditDetailCall[1][1]).toMatchObject({
        fieldName: 'name',
        oldValue: null,
        newValue: 'Test',
        fieldType: 'varchar',
      });
    });

    it('should skip non-auditable entities', async () => {
      class NonAuditableEntity {
        id: string = '456';
      }

      const entity = new NonAuditableEntity();
      const insertEvent = {
        entity,
        metadata: { columns: [] },
        queryRunner,
      } as any;

      await auditSubscriber.afterInsert(insertEvent);

      expect(mockManager.save).not.toHaveBeenCalled();
    });
  });

  describe('afterUpdate', () => {
    it('should create audit log for update action with field changes', async () => {
      const entity = new TestEntity();
      entity.name = 'Updated Test';

      const databaseEntity = new TestEntity();
      databaseEntity.name = 'Original Test';

      const mockMetadata = {
        columns: [
          { propertyName: 'id', type: 'varchar' },
          { propertyName: 'name', type: 'varchar' },
          { propertyName: 'password', type: 'varchar' },
        ],
      } as any;

      const updateEvent = {
        entity,
        databaseEntity,
        metadata: mockMetadata,
        queryRunner,
      } as any;

      await auditSubscriber.afterUpdate(updateEvent);

      expect(mockManager.save).toHaveBeenCalledTimes(2);

      const auditLogCall = mockManager.save.mock.calls[0];
      expect(auditLogCall[1]).toMatchObject({
        action: AuditHistoryAction.UPDATE,
        entityType: 'TestEntity',
        entityId: '123',
      });

      const auditDetailCall = mockManager.save.mock.calls[1];
      expect(auditDetailCall[1]).toHaveLength(1); // Only name changed
      expect(auditDetailCall[1][0]).toMatchObject({
        fieldName: 'name',
        oldValue: 'Original Test',
        newValue: 'Updated Test',
        fieldType: 'varchar',
      });
    });

    it('should not create audit log if no fields changed', async () => {
      const entity = new TestEntity();
      const databaseEntity = new TestEntity();

      const updateEvent = {
        entity,
        databaseEntity,
        metadata: { columns: [] },
        queryRunner,
      } as any;

      await auditSubscriber.afterUpdate(updateEvent);

      expect(mockManager.save).not.toHaveBeenCalled();
    });
  });

  describe('afterRemove', () => {
    it('should create audit log for delete action', async () => {
      const entity = new TestEntity();

      const removeEvent = {
        entity,
        queryRunner,
      } as any;

      await auditSubscriber.afterRemove(removeEvent);

      expect(mockManager.save).toHaveBeenCalledTimes(1);
      expect(mockManager.save).toHaveBeenCalledWith(AuditHistoryLog, expect.objectContaining({
        action: AuditHistoryAction.DELETE,
        entityType: 'TestEntity',
        entityId: '123',
      }));
    });
  });
});