import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { DataSource } from "typeorm";
import { AUDIT_CONTEXT_KEY } from "../audit-history.constants";
import { AuditHistoryContext } from "../interfaces/audit-history-context.interface";
import { AuditHistoryContextService } from "../audit-history-context.service";

@Injectable()
export class AuditHistoryContextInterceptor implements NestInterceptor {
  constructor(
    private readonly dataSource: DataSource,
    private readonly auditContextService: AuditHistoryContextService,
  ) {
    const originalCreateQueryRunner = this.dataSource.createQueryRunner.bind(
      this.dataSource,
    );
    this.dataSource.createQueryRunner = (...args: any[]) => {
      const queryRunner = originalCreateQueryRunner(...args);
      const ctx = this.auditContextService.context;
      if (ctx) {
        queryRunner.data = queryRunner.data || {};
        queryRunner.data[AUDIT_CONTEXT_KEY] = ctx;
      }
      return queryRunner;
    };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers?.userid;

    const auditContext: AuditHistoryContext = {
      userId: userId || null,
      requestId: request.id || request.headers["x-request-id"],
      ipAddress: request.ip || request.connection?.remoteAddress,
      userAgent: request.headers["user-agent"],
    };

    return this.auditContextService.runWithContext(auditContext, () =>
      next.handle(),
    );
  }
}
