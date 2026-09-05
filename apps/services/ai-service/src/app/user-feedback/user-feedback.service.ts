import { Injectable } from '@nestjs/common';
import { UserFeedbackRepository } from './user-feedback.repository';

@Injectable()
export class UserFeedbackService {
  constructor(private readonly repo: UserFeedbackRepository) {}

  async saveFeedback(payload: { messageId: number; isValidResponse: number; createdBy: number }) {
    try{
    const existing = await this.repo.getFeedbackByMessageId(payload.messageId);
    if (existing) {
      return this.repo.updateFeedback(existing, payload);
    }
    return this.repo.createFeedback(payload);}
    catch (error) {
        console.error('Error in saveFeedback Service:', error);
        throw error;
        }
  }
}
