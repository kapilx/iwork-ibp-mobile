import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AiUserFeedback } from '../../../../service-lib/src/lib/entities/ai-user-feedback.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserFeedbackRepository {
  constructor(
    @InjectRepository(AiUserFeedback)
    private readonly feedbackRepo: Repository<AiUserFeedback>
  ) {}

  async getFeedbackByMessageId(messageId: number) {
   try{ console.log('Getting feedback for messageId: ', messageId);
    return this.feedbackRepo.findOne({
      where: { messageId },
    });}
    catch (error) {
        console.error('Error in getFeedbackByMessageId Repository:', error);
        throw error;
        }
  }

  async createFeedback(payload: { messageId: number; isValidResponse: number; createdBy: number }) {
   try{ console.log('Creating feedback with payload: ', payload);
    const feedback = this.feedbackRepo.create({
      messageId: payload.messageId,
      isValidResponse: payload.isValidResponse,
      createdBy: payload.createdBy,
      updatedBy: payload.createdBy,
    });
    return this.feedbackRepo.save(feedback);}
    catch (error) {
        console.error('Error in createFeedback Repository:', error);
        throw error;
        }
  }

  async updateFeedback(existing: AiUserFeedback, payload: { isValidResponse: number; createdBy: number }) {
   try{ console.log('Updating feedback with payload: ', payload);
    existing.isValidResponse = payload.isValidResponse;
    existing.updatedBy = payload.createdBy;
    return this.feedbackRepo.save(existing);}
    catch (error) {
        console.error('Error in updateFeedback Repository:', error);
        throw error;
        }
  }
}
