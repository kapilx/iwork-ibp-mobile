import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  ParseIntPipe,
  HttpStatus,
  Res,
  Req,
  Query,
} from "@nestjs/common";
import type { Response, Request } from "express";
import { CronConfigurationService } from "./cron-configuration.service";
import { UpdateCronConfigDto } from "../dto/update-cron-config.dto";
import { GetCronConfigurationsDto } from "../dto/get-cron-configurations.dto";
import {
  createResponse,
  createErrorResponse,
} from "../../../../service-lib/src/lib/utils/response.utils";

@Controller("cron-configurations")
export class CronConfigurationController {
  constructor(private readonly cronConfigService: CronConfigurationService) {}

  @Get()
  async getAllConfigurations(
    @Query() query: GetCronConfigurationsDto,
    @Res() res: Response
  ) {
    try {
      const { data, count } = await this.cronConfigService.getAllConfigurations(
        query.page,
        query.limit,
        query.sort || `id:ASC`,
        query.searchBy
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Cron configurations retrieved successfully",
            { data, count, page: query.page, limit: query.limit }
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error
              ? error.message
              : "Failed to retrieve configurations"
          )
        );
    }
  }

  @Get(":id")
  async getConfigurationById(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response
  ) {
    try {
      const config = await this.cronConfigService.getConfigurationById(id);

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Cron configuration retrieved successfully",
            config
          )
        );
    } catch (error) {
      const status =
        error instanceof Error && error.message.includes("not found")
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(status)
        .json(
          createErrorResponse(
            status,
            error instanceof Error
              ? error.message
              : "Failed to retrieve configuration"
          )
        );
    }
  }

  @Put(":id")
  async updateConfiguration(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCronConfigDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const userId = (req as any).user?.userId || 1;

      const config = await this.cronConfigService.updateConfiguration(
        id,
        dto,
        userId
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Cron configuration updated successfully",
            config
          )
        );
    } catch (error) {
      const status =
        error instanceof Error && error.message.includes("not found")
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(status)
        .json(
          createErrorResponse(
            status,
            error instanceof Error
              ? error.message
              : "Failed to update configuration"
          )
        );
    }
  }
}
