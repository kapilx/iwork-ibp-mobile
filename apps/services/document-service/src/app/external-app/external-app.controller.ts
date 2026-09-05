import {
    Body,
    Controller,
    ForbiddenException,
    HttpStatus,
    Post,
    Req,
    Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { JwtService } from "@nestjs/jwt";
import { ExternalAppService } from "./external-app.service";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { ApiTags } from "@nestjs/swagger";
import { getExternalAppMagicUrlSwaggerMetadata } from "./external-app.swagger";

@ApiTags("External App SSO")
@Controller("external-app-sso")
export class ExternalAppController {
    private readonly logger: ReturnType<typeof createLogger>;

    constructor(
        private readonly externalAppService: ExternalAppService,
        private readonly jwtService: JwtService,
        private readonly traceIdService: TraceIdService
    ) {
        this.logger = createLogger(
            this.traceIdService,
            serviceNames.DOCUMENT_SERVICE
        );
    }

    /**
     * Execute external app SSO flow and return complete response
     * POST /external-app-sso/magic-url
     * 
     * @param appKey - Application identifier (label) in request body
     * @param dynamicFields - Optional dynamic fields for payload template resolution
     * 
     * Flow:
     * 1. Extract user email from JWT token
     * 2. Service fetches app config from database using appKey
     * 3. Based on auth_type:
     *    - JWT: Generate app-level JWT token → use as Bearer for both API calls
     *    - SESSION: No JWT → Authentication API returns session token → use as Bearer for Data API
     * 4. Resolve Authentication API payload template with available fields
     * 5. Call Authentication API → extract token using configurable response key
     * 6. Resolve Data API payload template with available fields + auth response token
     * 7. Call Data API → return complete response to frontend
     */
    @Post("magic-url")
    @getExternalAppMagicUrlSwaggerMetadata()
    async executeExternalAppSSO(
        @Body("appKey") appKey: string,
        @Body("dynamicFields") dynamicFields: Record<string, any>,
        @Body("employeeId") employeeId: number | undefined,
        @Body("policyId") policyId: number | undefined,
        @Req() req: Request,
        @Res() res: Response
    ) {
        // Mutable out-param — ExternalAppService populates this with the exact
        // outbound TPA request (method/url/headers/body, secrets included)
        // right before the data-API call fires, regardless of whether that
        // call succeeds or throws. Relayed back in the response so a caller
        // (e.g. ibp-service's background claim delivery) can persist it for
        // support/debugging — a failed attempt can be retried by literally
        // copy-pasting the stored JSON straight at the TPA.
        const debugCapture: { resolvedRequest?: Record<string, any> } = {};
        try {
            // Extract user email from JWT token
            const token = req?.headers?.authorization?.split(" ")[1];

            if (!token) {
                return res.status(HttpStatus.UNAUTHORIZED).json({
                    statusCode: HttpStatus.UNAUTHORIZED,
                    message: "Authorization token not provided",
                });
            }

            const decodedUser = this.jwtService.verify(token, {
                secret: ENV.JWT_SECRET,
            });

            const emailId = decodedUser?.userDetails?.emailId as string;

            if (!emailId) {
                return res.status(HttpStatus.BAD_REQUEST).json({
                    statusCode: HttpStatus.BAD_REQUEST,
                    message: "User email not found in request",
                });
            }

            // Get complete response data from service
            const responseData = await this.externalAppService.executeExternalAppSSO(
                appKey,
                emailId,
                dynamicFields,
                { employeeId, policyId },
                debugCapture
            );

            return res.status(HttpStatus.OK).json({
                statusCode: HttpStatus.OK,
                message: "External app response fetched successfully",
                data: responseData,
                resolvedRequest: debugCapture.resolvedRequest,
            });

        } catch (error) {
            if (error instanceof ForbiddenException) {
                this.logger.warn({
                    level: "warn",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "failure",
                        location: "ExternalAppController",
                        method: "executeExternalAppSSO",
                        messageData: error.message,
                    }),
                });

                return res.status(HttpStatus.FORBIDDEN).json({
                    statusCode: HttpStatus.FORBIDDEN,
                    message: error.message,
                });
            } else {
                this.logger.error({
                    level: "error",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "failure",
                        location: "ExternalAppController",
                        method: "executeExternalAppSSO",
                        messageData: error instanceof Error ? error.message : "Unknown error",
                    }),
                });

                return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                    message:
                        error instanceof Error
                            ? error.message
                            : "Failed to generate magic URL",
                    // Populated even on failure — debugCapture is set right before
                    // the outbound call fires, so a business/HTTP failure from the
                    // TPA still carries the exact request that was attempted.
                    resolvedRequest: debugCapture.resolvedRequest,
                });
            }
        }
    }

    // Note: file fetching for external-app URLs (e.g. e-card PDFs) is done server-side
    // automatically inside ExternalAppService.applyStep2Mappings() — the magic-url response
    // above already includes BASE64_PDF when a downloadable file was resolved. There's no
    // separate proxy-file route: one request from the frontend covers both the API call and
    // the file fetch, rather than needing a second round-trip.
}
