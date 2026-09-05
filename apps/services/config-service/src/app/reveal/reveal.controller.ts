import { Body, Controller, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { RevealService } from './reveal.service';
import { RevealRequestDto } from './dto/reveal-request.dto';
import { RevealResponseDto } from './dto/reveal-response.dto';

@Controller('reveal')
export class RevealController {
  constructor(private readonly revealService: RevealService) {}

  @Post()
  async reveal(
    @Body() dto: RevealRequestDto,
    @Req() req: Request,
  ): Promise<RevealResponseDto> {
    const currentUserId = String(req?.headers?.userid ?? '');
    const ipAddress = req.ip ?? '';
    const userAgent = (req.headers['user-agent'] as string) ?? '';
    const requestId = (req.headers['x-request-id'] as string) ?? '';

    return this.revealService.reveal(
      dto,
      currentUserId,
      ipAddress,
      userAgent,
      requestId,
    );
  }
}
