import {
  Body, Controller, Delete, Get, HttpStatus,
  Param, ParseIntPipe, Post, Put, Query, Res,
} from "@nestjs/common";
import type { Response } from "express";
import { TpaExternalFeatureService } from "./tpa-external-feature.service";
import { CreateFeatureTypeDto } from "./dto/create-feature-type.dto";
import { CreateFeatureConfigDto } from "./dto/create-feature-config.dto";
import { UpsertAppRefDto } from "./dto/upsert-app-ref.dto";
import { UpsertResponseMappingDto } from "./dto/upsert-response-mapping.dto";
import { TestApiConfigDto } from "./dto/test-api-config.dto";
import { createErrorResponse, createResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { TpaSsoConfigService } from "../tpa-sso-config/tpa-sso-config.service";

@Controller("tpa-external-feature")
export class TpaExternalFeatureController {
  constructor(
    private readonly service: TpaExternalFeatureService,
    private readonly ssoConfigService: TpaSsoConfigService,
  ) {}

  // ── DB Schema ────────────────────────────────────────────────

  @Get("db-schema")
  async getDbSchema(@Res() res: Response) {
    try {
      const data = await this.service.getDbSchema();
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "DB schema fetched.", data));
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, (e as Error).message));
    }
  }

  // ── App Refs ─────────────────────────────────────────────────

  // Two independent reads — mstr_ext_application_ref via the existing app-refs query,
  // tpa_sso_config via the existing SSO service — appended into one array in this
  // response only. Neither underlying table/query changes; each item carries a
  // configType tag ("APP_REF" | "SSO") since the two shapes are genuinely different
  // (an SSO config has no authType/payload fields, an app ref has no portalUrl/crypto
  // fields) — a consumer needs that to tell which kind of row it's looking at.
  @Get("app-refs")
  async getAppRefs(@Query("onlyActive") onlyActive: string, @Res() res: Response) {
    try {
      const isActive = onlyActive === "true";
      const [appRefs, ssoConfigs] = await Promise.all([
        this.service.getAllAppRefs(isActive),
        this.ssoConfigService.getAll(),
      ]);
      const data = [
        ...appRefs.map((r) => ({ ...r, configType: "APP_REF" as const })),
        ...(isActive ? ssoConfigs.filter((c) => c.isActive) : ssoConfigs).map((c) => ({ ...c, configType: "SSO" as const })),
      ];
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "App refs fetched.", data));
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, (e as Error).message));
    }
  }

  @Get("app-refs/:id")
  async getAppRefById(@Param("id", ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const data = await this.service.getAppRefById(id);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "App ref fetched.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Post("app-refs")
  async createAppRef(@Body() dto: UpsertAppRefDto, @Res() res: Response) {
    try {
      const data = await this.service.createAppRef(dto);
      return res.status(HttpStatus.CREATED).json(createResponse(HttpStatus.CREATED, "App ref created.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Post("app-refs/test")
  async testApiConfig(@Body() dto: TestApiConfigDto, @Res() res: Response) {
    try {
      const data = await this.service.testApiConfig(dto);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "API test complete.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Put("app-refs/:id")
  async updateAppRef(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: Partial<UpsertAppRefDto>,
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.updateAppRef(id, dto);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "App ref updated.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  // ── Feature Types ────────────────────────────────────────────

  @Get("feature-types")
  async getFeatureTypes(@Query("onlyActive") onlyActive: string, @Res() res: Response) {
    try {
      const data = await this.service.getAllFeatureTypes(onlyActive === "true");
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Feature types fetched.", data));
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, (e as Error).message));
    }
  }

  @Post("feature-types")
  async createFeatureType(@Body() dto: CreateFeatureTypeDto, @Res() res: Response) {
    try {
      const data = await this.service.createFeatureType(dto);
      return res.status(HttpStatus.CREATED).json(createResponse(HttpStatus.CREATED, "Feature type created.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Put("feature-types/:id")
  async updateFeatureType(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: Partial<CreateFeatureTypeDto>,
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.updateFeatureType(id, dto);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Feature type updated.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  // ── Feature Configs ──────────────────────────────────────────

  @Get("configs")
  async getAllConfigs(@Res() res: Response) {
    try {
      const data = await this.service.getAllConfigs();
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "All configs fetched.", data));
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, (e as Error).message));
    }
  }

  @Get("tpa/:tpaId/configs")
  async getConfigsByTpa(
    @Param("tpaId", ParseIntPipe) tpaId: number,
    @Query("onlyActive") onlyActive: string,
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.getConfigsByTpa(tpaId, onlyActive === "true");
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Configs fetched.", data));
    } catch (e) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, (e as Error).message));
    }
  }

  @Get("configs/:id")
  async getConfigById(@Param("id", ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const data = await this.service.getConfigById(id);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Config fetched.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Post("configs")
  async createConfig(@Body() dto: CreateFeatureConfigDto, @Res() res: Response) {
    try {
      const data = await this.service.createFeatureConfig(dto);
      return res.status(HttpStatus.CREATED).json(createResponse(HttpStatus.CREATED, "Feature config created.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Put("configs/:id")
  async updateConfig(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: Partial<CreateFeatureConfigDto>,
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.updateFeatureConfig(id, dto);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Feature config updated.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Delete("configs/:id")
  async deleteConfig(@Param("id", ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.service.deleteFeatureConfig(id);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Feature config deleted.", null));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  // ── Response Mappings ─────────────────────────────────────────

  @Get("app-refs/:id/response-mappings")
  async getResponseMappings(@Param("id", ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const data = await this.service.getResponseMappings(id);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Response mappings fetched.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Post("app-refs/:id/response-mappings")
  async upsertResponseMappings(
    @Param("id", ParseIntPipe) id: number,
    @Body() dtos: UpsertResponseMappingDto[],
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.upsertResponseMappings(id, dtos);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Response mappings saved.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Delete("response-mappings/:id")
  async deleteResponseMapping(@Param("id", ParseIntPipe) id: number, @Res() res: Response) {
    try {
      await this.service.deleteResponseMapping(id);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Response mapping deleted.", null));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.BAD_REQUEST;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Post("app-refs/:id/rotate-basic-auth")
  async rotateBasicAuth(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: { username: string; password: string },
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.rotateBasicAuth(id, dto.username, dto.password);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Credentials updated in AWS Secrets Manager.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Post("app-refs/:id/update-secret-keys")
  async updateSecretKeys(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: { keys: Record<string, string> },
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.updateSecretKeys(id, dto.keys ?? {});
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Secret keys updated.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Post("app-refs/:id/check-secret-keys")
  async checkSecretKeys(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: { keys: string[] },
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.checkSecretKeys(id, dto.keys ?? []);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Secret key status.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }

  @Delete("app-refs/:id/secret-keys")
  async deleteSecretKeys(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: { keys: string[] },
    @Res() res: Response,
  ) {
    try {
      const data = await this.service.deleteSecretKeys(id, dto.keys ?? []);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Orphaned secret keys deleted.", data));
    } catch (e) {
      const status = (e as any).status ?? HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json(createErrorResponse(status, (e as Error).message));
    }
  }
}
