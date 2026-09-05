import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AuditHistoryLog } from "../entities/audit-history-log.entity";
import { AuditHistoryLogDetail } from "../entities/audit-history-log-detail.entity";
import { AuditHistorySubscriber } from "./subscribers/audit-history.subscriber";
import { AuditHistoryContextInterceptor } from "./interceptors/audit-history-context.interceptor";
import { UserTraceInterceptor } from "./interceptors/user-trace.interceptor";
import { AuditHistoryService } from "./services/audit-history.service";
import { AuditHistoryContextService } from "./audit-history-context.service";

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditHistoryLog, AuditHistoryLogDetail])],
  controllers: [],
  providers: [
    AuditHistoryService,
    AuditHistorySubscriber,
    AuditHistoryContextService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditHistoryContextInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: UserTraceInterceptor,
    },
  ],
  exports: [AuditHistoryService, AuditHistoryContextService],
})
export class AuditHistoryModule {}
