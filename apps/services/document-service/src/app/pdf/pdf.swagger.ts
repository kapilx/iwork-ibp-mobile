import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { successMessage, errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";

// Swagger metadata for POST /document/pdf/placement-slip endpoint
export const generatePlacementSlipPdfSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Generate Placement Slip PDF",
      description: "Generates a placement slip PDF document with provided data and returns the file URL.",
    }),
    ApiBody({
      description: "Placement slip PDF generation payload",
      schema: {
        type: "object",
        required: ["fileName", "data"],
        properties: {
          fileName: {
            type: "string",
            example: "placement_slip_2024_001",
            description: "Name of the PDF file to be generated",
          },
          data: {
            type: "object",
            description: "Placement slip data including policy details, coverage information, etc.",
            additionalProperties: true,
            example: {
              policyId: 123,
              companyName: "ABC Insurance Co.",
              coverageDetails: {},
            },
          },
        },
      },
    }),
   ApiResponse({
  status: 201,
  description: successMessage.placementSlipPdfGenerated,
  schema: {
    type: "object",
    properties: {
      status: { type: "number", example: 201 },
      message: {
        type: "string",
        example: successMessage.placementSlipPdfGenerated,
      },
      data: {
        type: "string",
        example: "https://storage.example.com/placement-slip.pdf",
      },
    },
  },
}),

ApiResponse({
  status: 500,
  description: "PDF generation failed",
  schema: {
    type: "object",
    properties: {
      status: { type: "number", example: 500 },
      message: {
        type: "string",
        example: "Error while generating pdf",
      },
    },
  },
}),

  );
