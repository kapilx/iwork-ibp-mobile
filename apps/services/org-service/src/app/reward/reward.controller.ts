import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { statusCode } from "../../../../../../libs/service-lib/src/lib/enum";
import {
  createErrorResponse,
  createResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { CreateRewardDto } from "./dto/create-reward.dto";
import { GetAllRewardsDto } from "./dto/get-all-rewards.dto";
import { UpdateRewardDto } from "./dto/update-reward.dto";
import { RewardService } from "./reward.service";

@ApiTags("Reward")
@Controller("reward")
export class RewardController {
  constructor(private readonly rewardService: RewardService) {}

  private userId(req: Request): number {
    return parseInt((req?.headers?.userid as string) || "0", 10);
  }

  // Duplicate detection (BR-018) surfaces as 409 so the UI can show the inline
  // block (hard) or the confirm dialog (soft); other errors use the shared handler.
  private fail(res: Response, error: any, msg: string) {
    if (error instanceof ConflictException) {
      return res.status(statusCode.conflict).json(createErrorResponse(statusCode.conflict, error.message, error.getResponse()));
    }
    return handleErrorResponse(error, res, msg);
  }

  @Get()
  async list(@Query() dto: GetAllRewardsDto, @Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.rewardService.list(dto, this.userId(req));
      return res.status(statusCode.ok).json(createResponse(statusCode.ok, "Rewards fetched successfully", result));
    } catch (error: any) {
      return handleErrorResponse(error, res, "Failed to fetch rewards");
    }
  }

  // History for the form: existing rewards for an insurer (BR-017). Declared before :id.
  @Get("by-insurer/:insurerId")
  async byInsurer(@Param("insurerId", ParseIntPipe) insurerId: number, @Res() res: Response) {
    try {
      const data = await this.rewardService.listByInsurer(insurerId);
      return res.status(statusCode.ok).json(createResponse(statusCode.ok, "Rewards fetched successfully", data));
    } catch (error: any) {
      return handleErrorResponse(error, res, "Failed to fetch rewards");
    }
  }

  @Get("export")
  async exportExcel(@Query() dto: GetAllRewardsDto, @Req() req: Request, @Res() res: Response) {
    try {
      const url = await this.rewardService.exportExcel(dto, this.userId(req));
      return res.status(statusCode.ok).json(createResponse(statusCode.ok, "Rewards export generated successfully", url));
    } catch (error: any) {
      return handleErrorResponse(error, res, "Failed to export rewards");
    }
  }

  @Get(":id")
  async getOne(@Param("id", ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const data = await this.rewardService.getOne(id);
      return res.status(statusCode.ok).json(createResponse(statusCode.ok, "Reward fetched successfully", data));
    } catch (error: any) {
      return handleErrorResponse(error, res, "Failed to fetch reward");
    }
  }

  @Post()
  async create(@Body() dto: CreateRewardDto, @Req() req: Request, @Res() res: Response) {
    try {
      const data = await this.rewardService.create(dto, this.userId(req));
      return res.status(statusCode.created).json(createResponse(statusCode.created, "Reward created successfully", data));
    } catch (error: any) {
      return this.fail(res, error, "Failed to create reward");
    }
  }

  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateRewardDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const data = await this.rewardService.update(id, dto, this.userId(req));
      return res.status(statusCode.ok).json(createResponse(statusCode.ok, "Reward updated successfully", data));
    } catch (error: any) {
      return this.fail(res, error, "Failed to update reward");
    }
  }

  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number, @Req() req: Request, @Res() res: Response) {
    try {
      await this.rewardService.delete(id, this.userId(req));
      return res.status(statusCode.ok).json(createResponse(statusCode.ok, "Reward deleted successfully"));
    } catch (error: any) {
      return handleErrorResponse(error, res, "Failed to delete reward");
    }
  }
}
