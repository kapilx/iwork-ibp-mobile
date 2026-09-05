import { Body, Controller, Get, Post, Put } from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { Request } from 'express';
import { PromptFavouriteService } from './prompt-favourite.service';
import {
  addFavouriteSwaggerMetadata,
  removeFavouriteSwaggerMetadata,
} from '../ai-service.swagger';

@Controller('prompt')
export class PromptFavouriteController {
  constructor(private readonly favouriteService: PromptFavouriteService) {}

@addFavouriteSwaggerMetadata()
@Post('add-favourite')
  async addFavourite(
    @Body('messageId') messageId: number,
    @Req() request: Request
  ) {
    const userId = request.headers.userid; 
    return this.favouriteService.saveFavourite({
      messageId,
      createdBy: Number(userId),
    });
  }

  // to remove favourite
  @removeFavouriteSwaggerMetadata()
  @Put('remove-favourite')
  async removeFavourite(@Body('messageId') messageId: number) {
      return this.favouriteService.unfavourite(messageId);
  }

}
