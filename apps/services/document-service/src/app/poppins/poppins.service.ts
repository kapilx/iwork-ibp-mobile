import { ForbiddenException, Injectable } from "@nestjs/common";
import axios from "axios";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Injectable()
export class PoppinsService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(private readonly traceIdService: TraceIdService) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.DOCUMENT_SERVICE
    );
  }

  /**
   * Fetches magic URL from Poppins India SSO API
   * @param {string} email - User's email address
   * @returns {Promise<string>} Magic URL for SSO
   */
  async getMagicUrl(email: string): Promise<string> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "PoppinsService",
        method: "getMagicUrl",
        payload: { email },
        messageData: "method invoked",
      }),
    });

    try {
      const response = await axios.post(
        ENV.POPPINS_INDIA_URL as string,
        {
          redirect_to: ENV.POPPINS_INDIA_REDIRECT_URL,
          email: email,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${ENV.POPPINS_INDIA_AUTH_TOKEN}`,
          },
        }
      );

      if (response.data.status && response.data.magic_url) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "PoppinsService",
            method: "getMagicUrl",
            payload: { email },
            messageData: "Magic URL generated successfully",
          }),
        });
        return response.data.magic_url;
      }

      throw new Error("Invalid response format from magic URL API");
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PoppinsService",
          method: "getMagicUrl",
          payload: { email },
          messageData: error,
        }),
      });
      throw new ForbiddenException(`Access Denied. Contact IT team at ${ENV.IT_SUPPORT_EMAIL}`);
    }
  }
}
