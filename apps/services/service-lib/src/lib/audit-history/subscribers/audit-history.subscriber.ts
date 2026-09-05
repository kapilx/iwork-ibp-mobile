import {
  EventSubscriber,
  EntitySubscriberInterface,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
  DataSource,
  EntityMetadata,
} from "typeorm";
import { AuditHistoryLogDetail } from "../../entities/audit-history-log-detail.entity";
import { AuditHistoryLog } from "../../entities/audit-history-log.entity";
import {
  AuditHistoryAction,
  AUDIT_CONTEXT_KEY,
  AuditHistoryLogType,
} from "../audit-history.constants";
import {
  isAuditable,
  getAuditEntityName,
} from "../decorators/auditable.decorator";
import { getSkipAuditFields } from "../decorators/skip-audit.decorator";
import { AuditHistoryContext } from "../interfaces/audit-history-context.interface";
import { Injectable } from "@nestjs/common";

@Injectable()
@EventSubscriber()
export class AuditHistorySubscriber implements EntitySubscriberInterface {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  private getAuditHistoryContext(event: any): AuditHistoryContext | undefined {
    return event.queryRunner?.data?.[AUDIT_CONTEXT_KEY];
  }

  private getEntityId(entity: any, metadata: EntityMetadata): string {
    if (entity.id) return String(entity.id);

    // Handle composite keys
    const primaryColumns = metadata.primaryColumns;
    if (primaryColumns.length === 1) {
      return String(entity[primaryColumns[0].propertyName]);
    }

    // For composite keys, create a concatenated string
    return primaryColumns
      .map((col) => `${col.propertyName}:${entity[col.propertyName]}`)
      .join(",");
  }

  private resolveEntityIdWithFallback(
    event: any,
    entity: any,
    metadata: EntityMetadata
  ): string {
    try {
      return this.getEntityId(entity, metadata);
    } catch (error) {
      const fallbackEntity = event?.databaseEntity;
      if (fallbackEntity) {
        try {
          return this.getEntityId(fallbackEntity, metadata);
        } catch {
          // Continue to entityId fallback
        }
      }

      const fallbackEntityId = event?.entityId;
      if (fallbackEntityId !== undefined && fallbackEntityId !== null) {
        if (typeof fallbackEntityId === "object") {
          try {
            return JSON.stringify(fallbackEntityId);
          } catch {
            return String(fallbackEntityId);
          }
        }
        return String(fallbackEntityId);
      }

      return "unknown";
    }
  }

  private async createAuditLog(
    event: any,
    action: AuditHistoryAction,
    entity: any,
    metadata: EntityMetadata,
    details: Partial<AuditHistoryLogDetail>[] = []
  ): Promise<void> {
    const context = this.getAuditHistoryContext(event);
    const entityName = getAuditEntityName(entity ?? metadata.target);
    const entityType =
      (metadata.target as any).name ?? entity?.constructor?.name;
    const entityId = this.resolveEntityIdWithFallback(
      event,
      entity,
      metadata
    );

    const auditLog = new AuditHistoryLog();
    auditLog.action = action;
    auditLog.entityType = entityType;
    auditLog.entityName = entityName;
    auditLog.entityId = entityId;
    auditLog.type = AuditHistoryLogType.AUDIT;
    auditLog.userId = context?.userId || null;
    auditLog.ipAddress = context?.ipAddress || null;
    auditLog.userAgent = context?.userAgent || null;
    auditLog.requestId = context?.requestId || null;
    auditLog.metadata = context ? { ...context } : null;

    await event.queryRunner.manager.save(AuditHistoryLog, auditLog);

    if (details.length > 0) {
      const auditDetails = details.map((detail) => {
        const auditDetail = new AuditHistoryLogDetail();
        auditDetail.auditHistoryLog = auditLog;
        auditDetail.fieldName = detail.fieldName;
        auditDetail.oldValue = detail.oldValue;
        auditDetail.newValue = detail.newValue;
        auditDetail.fieldType = detail.fieldType;
        return auditDetail;
      });

      await event.queryRunner.manager.save(AuditHistoryLogDetail, auditDetails);
    }
  }

  async afterInsert(event: InsertEvent<any>): Promise<void> {
    if (!isAuditable(event.entity)) return;

    const skipFields = getSkipAuditFields(event.entity);
    const details: Partial<AuditHistoryLogDetail>[] = [];

    for (const column of event.metadata.columns) {
      const fieldName = column.propertyName;
      if (skipFields.includes(fieldName)) continue;

      const value = event.entity[fieldName];
      if (value !== undefined && value !== null) {
        details.push({
          fieldName,
          oldValue: null,
          newValue: value,
          fieldType: column.type.toString(),
        });
      }
    }

    await this.createAuditLog(
      event,
      AuditHistoryAction.INSERT,
      event.entity,
      event.metadata,
      details
    );
  }
  async beforeUpdate(event: UpdateEvent<any>): Promise<any> | void {
    const entityClass = event.metadata.target as Function;
    if (!isAuditable(entityClass)) return;

    const updatedData: any = event.entity || {};
    let dbEntity: any = {};
    if (entityClass.name.toLowerCase() === "opportunity") {
      dbEntity =
        (await event.manager.findOne(entityClass, {
          where: { opportunityId: event.entity.auditRefId },
        })) || {};
    } else if (entityClass.name.toLowerCase() === "employee") {
      dbEntity =
        (await event.manager.findOne(entityClass, {
          where: { employeeId: event.entity.employeeId },
        })) || {};
    } else if (entityClass.name.toLowerCase() === "user") {
      dbEntity =
        (await event.manager.findOne(entityClass, {
          where: { userId: event.entity.userId },
        })) || {};
    } else {
      dbEntity =
        event.entity.auditRefId ? 
        (await event.manager.findOne(entityClass, {
          where: { id: event.entity.auditRefId ?? event.entity.id },
        })) || {} : 
        (await event.manager.findOne(entityClass, {
          where: { id: event.entity.id },
        })) || {};
    }

    const skipFields = getSkipAuditFields(entityClass);
    const details: Partial<AuditHistoryLogDetail>[] = [];

    for (const column of event.metadata.columns) {
      const fieldName = column.propertyName;
      if (skipFields.includes(fieldName)) continue;

      const oldValue = dbEntity?.[fieldName];
      const newValue =
        updatedData[fieldName] !== undefined
          ? updatedData[fieldName]
          : dbEntity?.[fieldName];

      if (oldValue !== newValue) {
        details.push({
          fieldName,
          oldValue,
          newValue,
          fieldType: column.type.toString(),
        });
      }
    }

    if (details.length > 0) {
      await this.createAuditLog(
        event,
        AuditHistoryAction.UPDATE,
        updatedData.id ? updatedData : dbEntity,
        event.metadata,
        details
      );
    }
  }
  // afterLoad(entity: any) {
  //   const entityClass = event.metadata.target as Function;
  //   if (!isAuditable(entityClass)) return;
  //   this.oldData = entity;
  //   console.log('afterLoad event:', this.oldData);
  // }

  // async afterUpdate(event: UpdateEvent<any>): Promise<void> {

  //   const entityClass = event.metadata.target as Function;
  //   if (!isAuditable(entityClass)) return;
  //   console.log('afterUpdate event:', this.oldData);
  //   const updatedData: any = event.entity || {};
  //   const dbEntity: any = event.databaseEntity || {};

  //   const skipFields = getSkipAuditFields(entityClass);
  //   const details: Partial<AuditHistoryLogDetail>[] = [];

  //   for (const column of event.metadata.columns) {
  //     const fieldName = column.propertyName;
  //     if (skipFields.includes(fieldName)) continue;

  //     const oldValue = dbEntity?.[fieldName];
  //     const newValue =
  //       updatedData[fieldName] !== undefined ? updatedData[fieldName] : dbEntity?.[fieldName];

  //     if (oldValue !== newValue) {
  //       details.push({
  //         fieldName,
  //         oldValue,
  //         newValue,
  //         fieldType: column.type.toString(),
  //       });
  //     }
  //   }

  //   if (details.length > 0) {
  //     await this.createAuditLog(
  //       event,
  //       AuditHistoryAction.UPDATE,
  //       updatedData.id ? updatedData : dbEntity,
  //       event.metadata,
  //       details,
  //     );
  //   }
  // }

  async afterRemove(event: RemoveEvent<any>): Promise<void> {
    const entityClass = event.metadata.target as Function;
    if (!isAuditable(entityClass)) return;

    const entity = event.entity || event.databaseEntity;
    await this.createAuditLog(
      event,
      AuditHistoryAction.DELETE,
      entity,
      event.metadata
    );
  }
}
