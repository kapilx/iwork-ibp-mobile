import { Injectable } from '@nestjs/common';
import { PromptFavouriteRepository } from './prompt-favourite.repository';
@Injectable()
export class PromptFavouriteService {
  constructor(private readonly repo: PromptFavouriteRepository) {}

 async saveFavourite(payload: { messageId: number; createdBy: number }) {
  return this.repo.saveFavourite(payload);
}

  // to remove favourite
  async unfavourite(messageId: number) {
    return this.repo.unfavouriteByMessageId(messageId);
  }

}
