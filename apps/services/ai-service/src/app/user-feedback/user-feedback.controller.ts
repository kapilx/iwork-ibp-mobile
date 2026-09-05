import { Controller, Post, Body } from '@nestjs/common';
import { IsNotEmpty, IsNumber, IsIn } from 'class-validator';
import { UserFeedbackService } from './user-feedback.service';
import { saveFeedbackSwaggerMetadata } from '../ai-service.swagger';
export class CreateUserFeedbackDto {
  @IsNotEmpty()
  @IsNumber()
  messageId: number;

  @IsNotEmpty()
  @IsNumber()
  @IsIn([0, 1])
  isValidResponse: number;

  @IsNotEmpty()
  @IsNumber()
  createdBy: number;
}

@Controller('user-feedback')
export class UserFeedbackController {
  constructor(private readonly service: UserFeedbackService) {}

  @saveFeedbackSwaggerMetadata()
  @Post('/')
  async saveFeedback(@Body() body: CreateUserFeedbackDto) {
    try{return this.service.saveFeedback(body);}
    catch (error) {
        console.error('Error saving user feedback:', error);
        throw error;
        }
  }
}
