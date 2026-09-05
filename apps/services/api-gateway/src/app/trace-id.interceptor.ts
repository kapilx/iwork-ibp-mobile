import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TraceIdService } from '../../../service-lib/src/lib/trace-id.service';

@Injectable()
export class TraceIdInterceptor implements NestInterceptor {
  constructor(private readonly traceIdService: TraceIdService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return this.traceIdService.runWithId(() =>
      next.handle().pipe(
        tap(() => {
          context.switchToHttp().getResponse().setHeader('X-Trace-Id', this.traceIdService.traceId);
        }),
      ),
    );
  }
}
