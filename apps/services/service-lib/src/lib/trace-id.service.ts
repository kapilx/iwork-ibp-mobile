import { AsyncLocalStorage } from 'async_hooks';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';

@Injectable()
export class TraceIdService {
  private readonly store = new AsyncLocalStorage<string>();

  get traceId(): string | undefined {
    return this.store.getStore();
  }

  runWithId<T>(fn: () => T, id: string = randomUUID()): T {
    return this.store.run(id, fn);
  }

  setId(id: string): void {
    this.store.enterWith(id);
  }
}
