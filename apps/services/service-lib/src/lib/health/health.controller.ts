import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
export class HealthController {

    constructor(private healthService: HealthService) {
        // Constructor can be used for dependency injection if needed}}
    }

    @Get()
    check(){
        return this.healthService.healthCheck();
    }
}
