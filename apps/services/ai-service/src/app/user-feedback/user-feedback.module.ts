import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiUserFeedback } from '../../../../service-lib/src/lib/entities/ai-user-feedback.entity';
import { UserFeedbackController } from './user-feedback.controller';
import { UserFeedbackService } from './user-feedback.service';
import { UserFeedbackRepository } from './user-feedback.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AiUserFeedback])],
  controllers: [UserFeedbackController],
  providers: [UserFeedbackService, UserFeedbackRepository],
  exports: [UserFeedbackService],
})
export class UserFeedbackModule {}
