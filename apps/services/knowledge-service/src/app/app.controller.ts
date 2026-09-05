import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { TraceIdService } from '../../../service-lib/src/lib/trace-id.service';
import { createLogger } from '../../../service-lib/src/lib/logger';
import { serviceNames } from '../../../service-lib/src/lib/constants';
import { buildLogMessage } from '../../../service-lib/src/lib/utils/logger.util';
import { healthCheckSwaggerMetadata } from './app.swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly appService: AppService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.KNOWLEDGE_SERVICE);
  }

  @Get('health')
  @healthCheckSwaggerMetadata()
  getData() {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'AppController',
        method: 'getData',
        messageData: 'method invoked',
      }),
    });
    return this.appService.getData();
  }
}
