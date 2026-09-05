import { Module } from '@nestjs/common';
import { InsuranceWellnessHubServiceLibModule } from '../../../../service-lib/src/lib/service-lib.module';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  imports: [InsuranceWellnessHubServiceLibModule],
  controllers: [EmailController],
  providers: [EmailService],
})
export class EmailModule {}
