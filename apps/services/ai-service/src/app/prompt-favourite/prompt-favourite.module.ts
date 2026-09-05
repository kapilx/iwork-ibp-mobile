import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiPromptFavourite } from '../../../../service-lib/src/lib/entities/ai-prompt-favourite.entity';
import { PromptFavouriteController } from './prompt-favourite.controller';
import { PromptFavouriteService } from './prompt-favourite.service';
import { PromptFavouriteRepository } from './prompt-favourite.repository';


@Module({
  imports: [TypeOrmModule.forFeature([AiPromptFavourite])],
  controllers: [PromptFavouriteController],
  providers: [PromptFavouriteService, PromptFavouriteRepository],
  exports: [PromptFavouriteService],
})
export class PromptFavouriteModule {}