import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { NudgeDataService } from './nudge-data.service';
import { Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  getNudgesSwaggerMetadata,
  getNudgeParameterDataSwaggerMetadata,
} from '../ai-service.swagger';

@Controller('nudge-data')
export class NudgeDataController {
  constructor(private readonly service: NudgeDataService) {}

  @getNudgesSwaggerMetadata()
  @Get()
  async getNudges(
    @Query('scope_id') scopeId: number,
    @Req() request: Request
  ) {
    const authHeader = request.headers.authorization;
    const userId = request.headers.userid;
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }
    const token = authHeader.replace('Bearer ', '');
    const payload = token.split('.')[1];
    const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));
    const roles = decoded.userDetails.roles;
    // Extract only the role IDs
    const roleIds = Array.isArray(roles) ? roles.map((r: any) => r.id) : [];
    return this.service.getNudges(roleIds, Number(scopeId), Number(userId));
  }
  // to fetch the nudge parameter data from ai-utility-service
  @getNudgeParameterDataSwaggerMetadata()
  @Post('get-nudge-parameter-data')
  async getNudgeParameterData(
    @Body() aiPayload: any,
    @Req() request: Request
  ) {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }
    return this.service.getNudgeParameterData(aiPayload, authHeader);
  }
}
