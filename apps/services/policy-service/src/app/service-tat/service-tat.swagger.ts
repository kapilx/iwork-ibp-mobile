import { applyDecorators } from "@nestjs/common";
import {
  ApiOkResponse,
  ApiOperation,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
} from "@nestjs/swagger";
import { SERVICE_TAT_MESSAGES } from "./service-tat.constants";
import { MonthlySummaryResponseDto } from "./dto/monthly-summary-response.dto";
import { MonthlyServiceDetailsResponseDto } from "./dto/monthly-service-details-response.dto";

export const getMonthlySummarySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get monthly aggregate Service TAT scores" }),
    ApiOkResponse({
      description: SERVICE_TAT_MESSAGES.MONTHLY_SUMMARY_SUCCESS,
      type: MonthlySummaryResponseDto,
    }),
    ApiUnauthorizedResponse({ description: "Unauthorized" }),
    ApiForbiddenResponse({ description: "Forbidden" }),
    ApiInternalServerErrorResponse({ description: "Internal server error" })
  );

export const getMonthlyDetailsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get monthly Service TAT scores per service",
    }),
    ApiOkResponse({
      description: SERVICE_TAT_MESSAGES.MONTHLY_DETAILS_SUCCESS,
      type: MonthlyServiceDetailsResponseDto,
    }),
    ApiUnauthorizedResponse({ description: "Unauthorized" }),
    ApiForbiddenResponse({ description: "Forbidden" }),
    ApiInternalServerErrorResponse({ description: "Internal server error" })
  );
