import {
  Controller,
  Delete,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import {
  createErrorResponse,
  createResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { errorMessages, successMessage } from "../../../../../../libs/service-lib/src/lib/messages";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { ZohoIntegrationService } from "./zoho-integration.service";

@ApiTags("Zoho Integration")
@Controller("hr-module/zoho")
export class ZohoIntegrationController {
  constructor(private readonly zohoService: ZohoIntegrationService) {}

  // Returns the Zoho OAuth2 authorization URL. Frontend redirects the browser to it.
  @Get("auth-url")
  async getAuthUrl(
    @Query("companyId") companyIdStr: string,
    @Query("frontendOrigin") frontendOriginParam: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const companyId = parseInt(companyIdStr, 10);
      if (!companyId) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          createErrorResponse(HttpStatus.BAD_REQUEST, "companyId is required"),
        );
      }
      // Query param is most reliable (window.location.origin from frontend).
      // Fall back to headers in case called from non-browser contexts.
      const frontendOrigin =
        frontendOriginParam ||
        (req as any).headers?.origin ||
        (req as any).headers?.referer?.replace(/^(https?:\/\/[^\/]+).*/, "$1") ||
        undefined;
      const url = this.zohoService.buildAuthUrl(companyId, frontendOrigin);
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, successMessage.reportUserActivityGeneratedSuccessfully, { url }),
      );
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json(
        createErrorResponse(HttpStatus.BAD_REQUEST, error instanceof Error ? error.message : errorMessages.reportUserActivityGenerationFailed),
      );
    }
  }

  // Zoho redirects here after the admin authorises the app.
  // Exchanges the code for tokens, saves them, then redirects to the IBP settings page.
  // Uses a JS-redirect HTML response instead of HTTP 302 because the API gateway proxy
  // follows 302s server-side (axios default), which causes the frontend SPA HTML to be
  // served from the wrong origin. A 200 HTML response with window.location bypasses this.
  @Get("callback")
  async callback(
    @Query("code") code: string,
    @Query("state") state: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const frontendUrl = ENV.FRONTEND_IBP_URL ?? "http://localhost:4201";

    const htmlRedirect = (url: string) => {
      const safe = url.replace(/"/g, "&quot;");
      return res.status(200).type("html").send(
        `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${safe}"></head>` +
        `<body><script>window.location.replace("${safe}");</script></body></html>`,
      );
    };

    if (!code || !state) {
      return htmlRedirect(`${frontendUrl}/hr-portal/settings?tab=integrations&zoho=error&reason=missing_params`);
    }

    try {
      const userId = parseInt(String((req as any)?.headers?.userid ?? "0"), 10) || 0;
      const result = await this.zohoService.handleCallback(code, state, userId);
      const origin = result.frontendOrigin ?? frontendUrl;
      return htmlRedirect(`${origin}/hr-portal/settings?tab=integrations&zoho=connected`);
    } catch (error) {
      const reason = encodeURIComponent(error instanceof Error ? error.message : "unknown");
      return htmlRedirect(`${frontendUrl}/hr-portal/settings?tab=integrations&zoho=error&reason=${reason}`);
    }
  }

  // Returns connection status and last sync stats for the company.
  @Get("status")
  async getStatus(
    @Query("companyId") companyIdStr: string,
    @Res() res: Response,
  ) {
    try {
      const companyId = parseInt(companyIdStr, 10);
      if (!companyId) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          createErrorResponse(HttpStatus.BAD_REQUEST, "companyId is required"),
        );
      }
      const status = await this.zohoService.getStatus(companyId);
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, successMessage.reportUserActivityGeneratedSuccessfully, status),
      );
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : errorMessages.reportUserActivityGenerationFailed),
      );
    }
  }

  // Triggers a full employee sync from Zoho People.
  @Post("sync")
  async sync(
    @Query("companyId") companyIdStr: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const companyId = parseInt(companyIdStr, 10);
      if (!companyId) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          createErrorResponse(HttpStatus.BAD_REQUEST, "companyId is required"),
        );
      }
      const userId = parseInt(String((req as any)?.headers?.userid ?? "0"), 10) || 0;
      const stats = await this.zohoService.syncEmployees(companyId, userId);
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, `${stats.synced} employees synced from Zoho`, stats),
      );
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json(
        createErrorResponse(HttpStatus.BAD_REQUEST, error instanceof Error ? error.message : errorMessages.reportUserActivityGenerationFailed),
      );
    }
  }

  // Returns the Zoho People portal URL for the "Go to Zoho People" button.
  @Get("portal-url")
  async getPortalUrl(
    @Query("companyId") companyIdStr: string,
    @Res() res: Response,
  ) {
    try {
      const companyId = parseInt(companyIdStr, 10);
      if (!companyId) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          createErrorResponse(HttpStatus.BAD_REQUEST, "companyId is required"),
        );
      }
      const url = await this.zohoService.getPortalUrl(companyId);
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, successMessage.reportUserActivityGeneratedSuccessfully, { url }),
      );
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json(
        createErrorResponse(HttpStatus.BAD_REQUEST, error instanceof Error ? error.message : errorMessages.reportUserActivityGenerationFailed),
      );
    }
  }

  // Revokes Zoho tokens and deactivates the integration for the company.
  @Delete("disconnect")
  async disconnect(
    @Query("companyId") companyIdStr: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const companyId = parseInt(companyIdStr, 10);
      if (!companyId) {
        return res.status(HttpStatus.BAD_REQUEST).json(
          createErrorResponse(HttpStatus.BAD_REQUEST, "companyId is required"),
        );
      }
      const userId = parseInt(String((req as any)?.headers?.userid ?? "0"), 10) || 0;
      await this.zohoService.disconnect(companyId, userId);
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, "Zoho disconnected successfully", { companyId }),
      );
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : errorMessages.reportUserActivityGenerationFailed),
      );
    }
  }
}
