import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditHistoryLogType } from '../audit-history.constants';
import { AuditHistoryService } from '../services/audit-history.service';
import { USER_TRACE_KEY } from '../decorators/user-trace.decorator';
import { DataSource } from 'typeorm';

@Injectable()
export class UserTraceInterceptor implements NestInterceptor {
  constructor(
    private auditHistoryService: AuditHistoryService,
    private reflector: Reflector,
    private dataSource: DataSource
  ) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const action = this.reflector.get<string>(
      USER_TRACE_KEY,
      context.getHandler(),
    );

    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    return next.handle().pipe(
      tap(async (response) => {
        let userId: any;
        if (request.path === '/login') {
          if (response && response.statusCode === 200) {
            const user = await this.dataSource.getRepository('users').findOne({
              where: [{ emailId: request.body.userName }, { loginName: request.body.userName }],
              select: ['userId']
            });
            userId = user?.userId;
          } else return response;
        } else {
          userId = parseInt(request?.headers?.userid) || {};
        }
        try {
          await this.auditHistoryService.createAuditLog({
            entityType: 'User',
            entityName: 'User',
            entityId: userId,
            action,
            userId: userId,
            ipAddress: request.ip || request.connection?.remoteAddress,
            userAgent: request.headers['user-agent'],
            requestId: request.id || request.headers['x-request-id'],
            type: AuditHistoryLogType.TRACE,
          });
        } catch (err) {
          console.error('Failed to save user trace', err);
        }
        return response;
      }),
    );
  }
}
