import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  RequestTimeoutException,
} from "@nestjs/common";
import { Observable, throwError, TimeoutError } from "rxjs";
import { catchError, timeout } from "rxjs/operators";

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  private readonly timeoutDuration: number;

  constructor(
    timeoutDuration = process.env.REQUEST_TIMEOUT_MS
      ? Number.parseInt(process.env.REQUEST_TIMEOUT_MS, 10)
      : 120000,
  ) {
    // Default 2 minutes (120000ms) - can be overridden via environment variable
    this.timeoutDuration = timeoutDuration;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Check for bypass header (for internal scheduler/system calls)
    const request = context.switchToHttp().getRequest();
    // Headers are lowercased by Node.js/Express
    const bypassTimeout = request?.headers?.['x-bypass-timeout'] === 'true';
    // If bypass header is present, don't apply timeout
    if (bypassTimeout) {
      return next.handle();
    }

    return next.handle().pipe(
      timeout(this.timeoutDuration),
      catchError((err) => {
        console.log("TimeoutInterceptor caught an error:", err);
        if (err instanceof TimeoutError) {
          return throwError(
            () =>
              new RequestTimeoutException(
                `Request processing exceeded ${
                  this.timeoutDuration / 1000
                } seconds timeout`,
              ),
          );
        }
        return throwError(() => err);
      }),
    );
  }
}
