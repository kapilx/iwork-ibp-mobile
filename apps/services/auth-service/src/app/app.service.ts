import { Injectable } from '@nestjs/common';
import { createLogger } from '../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../service-lib/src/lib/trace-id.service';
import { serviceNames } from '../../../service-lib/src/lib/constants';

@Injectable()
export class AppService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(private readonly traceIdService: TraceIdService) {
    this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
  }

  getData(): { message: string } {
    // Log when the method is invoked
    this.logger.log({
      level: 'info',
      message: 'getData method invoked',
      context: 'getDataService',
      additionalInfo: { method: 'getData' },
    });

    const response = { message: 'Auth Service API running successfully..' };

    // Log the response being returned
    this.logger.log({
      level: 'info',
      message: 'Successfully retrieved data',
      context: 'getDataService',
      additionalInfo: { method: 'getData', response },
    });
    return response;
  }
}
