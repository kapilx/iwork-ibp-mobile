import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AiPromptFavourite } from '../../../../service-lib/src/lib/entities/ai-prompt-favourite.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PromptFavouriteRepository {
  constructor(
    @InjectRepository(AiPromptFavourite)
    private readonly favouriteRepo: Repository<AiPromptFavourite>
  ) {}
    // to create and save a favourite prompt
  async saveFavourite(payload: { messageId: number; createdBy: number }) {
    const existing = await this.favouriteRepo.findOne({
      where: {
        messageId: payload.messageId,
        createdBy: payload.createdBy,
      },
    });

    // Case 1: Exists but was unfavourited → re-favourite
    if (existing && existing.isFavourite === 0) {
      existing.isFavourite = 1;
      return this.favouriteRepo.save(existing);
    }

    // Case 2: Already favourite
    if (existing && existing.isFavourite === 1) {
      return {
        message: 'Already marked as favourite',
        id: existing.id,
      };
    }

    // Case 3: No record → create new
    const favourite = this.favouriteRepo.create({
      messageId: payload.messageId,
      createdBy: payload.createdBy,
      isFavourite: 1,
    });
    return this.favouriteRepo.save(favourite);
  }

    // to remove favourite by message id
  async unfavouriteByMessageId(messageId: number) {
    const favourite = await this.favouriteRepo.findOne({
      where: {
        messageId: messageId,
        isFavourite: 1,
      },
    });

    if (!favourite) {
      return {
        message: 'Favourite record not found',
      };
    }

    favourite.isFavourite = 0;
    return this.favouriteRepo.save(favourite);
  }
    
}
