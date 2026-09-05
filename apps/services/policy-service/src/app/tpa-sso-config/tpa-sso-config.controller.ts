import {
  Body, Controller, Delete, Get, HttpStatus,
  Param, ParseIntPipe, Post, Put, Res,
} from "@nestjs/common";
import type { Response } from "express";
import { TpaSsoConfigService } from "./tpa-sso-config.service";
import { UpsertTpaSsoConfigDto } from "./dto/upsert-tpa-sso-config.dto";
import { UpsertSsoWithFeatureDto } from "./dto/upsert-sso-with-feature.dto";
import { PreviewSsoUrlDto } from "./dto/preview-sso-url.dto";
import { createErrorResponse, createResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";

@Controller("tpa-sso-config")
export class TpaSsoConfigController {
  constructor(private readonly service: TpaSsoConfigService) {}

  @Get()
  async getAll(@Res() res: Response) {
    try {
      const data = await this.service.getAll();
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "SSO configs fetched.", data));
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, (e as Error).message));
    }
  }

  @Get("tpa/:tpaId")
  async getByTpaId(@Param("tpaId", ParseIntPipe) tpaId: number, @Res() res: Response) {
    try {
      const data = await this.service.getByTpaId(tpaId);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "SSO config fetched.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Get(":id")
  async getById(@Param("id", ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const data = await this.service.getById(id);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "SSO config fetched.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Post()
  async create(@Body() dto: UpsertTpaSsoConfigDto, @Res() res: Response) {
    try {
      console.log("Creating SSO config with DTO:", dto);
      const data = await this.service.create(dto);
      return res.status(HttpStatus.CREATED).json(createResponse(HttpStatus.CREATED, "SSO config created.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  // SSO-only save path: writes the IBP button (tpa_external_feature_config) and the
  // crypto config (tpa_sso_config/tpa_sso_field_mapping) in one DB transaction — either
  // both land or neither does. Used by the iWork "Add/Edit Feature" screens when
  // Feature Type = TPA Portal Login; does not affect any other feature type's save flow.
  @Post("upsert-with-feature")
  async upsertWithFeature(@Body() dto: UpsertSsoWithFeatureDto, @Res() res: Response) {
    try {
      const data = await this.service.upsertWithFeatureConfig(dto);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "SSO config saved.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Put(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: Partial<UpsertTpaSsoConfigDto>,
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.update(id, dto);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "SSO config updated.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Delete(":id")
  async delete(@Param("id", ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.service.delete(id);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "SSO config deleted.", null));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  // Lets an admin sanity-check a config end-to-end (encrypt sample values, see the real
  // redirect URL) before wiring it up to a real employee — without touching employee data.
  @Post(":id/preview")
  async preview(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: PreviewSsoUrlDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.previewRedirectUrl(id, dto);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Preview URL generated.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }
}
