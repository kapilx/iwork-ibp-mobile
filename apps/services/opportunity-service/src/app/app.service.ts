import { Injectable } from '@nestjs/common';
import { createLogger } from '../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../service-lib/src/lib/trace-id.service';
import { serviceNames } from '../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../service-lib/src/lib/utils/logger.util';

@Injectable()
export class AppService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(private readonly traceIdService: TraceIdService) {
    this.logger = createLogger(this.traceIdService, serviceNames.OPPORTUNITY_SERVICE);
  }

  getData(): { message: string } {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'AppService',
        method: 'getData',
        messageData: 'method invoked',
      }),
    });
    const response = { message: 'Opportunity Service API running successfully..' };
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'AppService',
        method: 'getData',
        messageData: 'response generated',
      }),
    });
    return response;
  }
}
