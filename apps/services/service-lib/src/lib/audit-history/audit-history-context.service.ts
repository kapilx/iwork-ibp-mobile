import { AsyncLocalStorage } from "async_hooks";
import { Injectable } from "@nestjs/common";
import { AuditHistoryContext } from "./interfaces/audit-history-context.interface";

@Injectable()
export class AuditHistoryContextService {
  private readonly store = new AsyncLocalStorage<AuditHistoryContext>();

  get context(): AuditHistoryContext | undefined {
    return this.store.getStore();
  }

  runWithContext<T>(context: AuditHistoryContext, fn: () => T): T {
    return this.store.run(context, fn);
  }

  setContext(context: AuditHistoryContext): void {
    this.store.enterWith(context);
  }
}
