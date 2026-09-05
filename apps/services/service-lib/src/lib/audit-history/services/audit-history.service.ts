import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { AuditHistoryLog } from '../../entities/audit-history-log.entity';
import { AuditHistoryQueryDto } from '../../dto/audit-history-query.dto';

@Injectable()
export class AuditHistoryService {
  constructor(
    @InjectRepository(AuditHistoryLog)
    private auditHistoryLogRepository: Repository<AuditHistoryLog>,
  ) {}

  async findAll(query: AuditHistoryQueryDto): Promise<[AuditHistoryLog[], number]> {
    const where: FindOptionsWhere<AuditHistoryLog> = {};

    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;

    if (query.startDate && query.endDate) {
      where.createdAt = Between(new Date(query.startDate), new Date(query.endDate));
    }

    const limit = parseInt(query.limit || '20', 10);
    const offset = parseInt(query.offset || '0', 10);

    return this.auditHistoryLogRepository.findAndCount({
      where,
      relations: ['details'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: string): Promise<AuditHistoryLog | null> {
    return this.auditHistoryLogRepository.findOne({
      where: { id },
      relations: ['details'],
    });
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditHistoryLog[]> {
    return this.auditHistoryLogRepository.find({
      where: { entityType, entityId },
      relations: ['details'],
      order: { createdAt: 'DESC' },
    });
  }

  async createAuditLog(
    log: Partial<AuditHistoryLog>,
  ): Promise<AuditHistoryLog> {
    const entity = this.auditHistoryLogRepository.create(log);
    return this.auditHistoryLogRepository.save(entity);
  }
}