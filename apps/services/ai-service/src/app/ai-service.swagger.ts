import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiHeader,
  ApiBody,
  ApiResponse,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';

// ========== Prompt Favourite Endpoints ==========

export function addFavouriteSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Add favourite prompt',
      description: 'Mark a message as favourite for a user',
    }),
    ApiHeader({
      name: 'userid',
      description: 'User ID',
      required: true,
      schema: { type: 'string' },
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          messageId: { type: 'number', example: 123 },
        },
        required: ['messageId'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Favourite saved successfully or already exists',
      schema: {
        type: 'object',
        additionalProperties: true,
        description:
          'Returns saved entity object or message object from repository',
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    })
  );
}

export function removeFavouriteSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Remove favourite prompt',
      description: 'Unmark a message as favourite',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          messageId: { type: 'number', example: 123 },
        },
        required: ['messageId'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Favourite removed or not found',
      schema: {
        type: 'object',
        additionalProperties: true,
        description: 'Returns updated entity or message object from repository',
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Invalid input',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    })
  );
}

// ========== Nudge Data Endpoints ==========

export function getNudgesSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Get nudges for user',
      description:
        'Retrieve nudges based on user roles and scope from JWT token',
    }),
    ApiHeader({
      name: 'authorization',
      description: 'Bearer token',
      required: true,
      schema: { type: 'string' },
    }),
    ApiHeader({
      name: 'userid',
      description: 'User ID',
      required: true,
      schema: { type: 'string' },
    }),
    ApiQuery({
      name: 'scope_id',
      type: 'number',
      required: true,
      description: 'Scope ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Nudges retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true,
          description: 'Nudge object with template, actions, and AI payload',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Missing authorization header',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    })
  );
}

export function getNudgeParameterDataSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Get nudge parameter data',
      description:
        'Fetch nudge parameter data from ai-utility-service and process template',
    }),
    ApiHeader({
      name: 'authorization',
      description: 'Bearer token',
      required: true,
      schema: { type: 'string' },
    }),
    ApiBody({
      schema: {
        type: 'object',
        additionalProperties: true,
        description: 'AI payload with user_id and nudges array',
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Nudge parameter data retrieved and processed successfully',
      schema: {
        type: 'object',
        properties: {
          nudge_id: { type: 'number' },
          nudge_template: { type: 'string' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Missing authorization header',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    })
  );
}

// ========== User Feedback Endpoints ==========

export function saveFeedbackSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Save user feedback',
      description: 'Create or update user feedback for a message',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          messageId: { type: 'number', example: 123 },
          isValidResponse: { type: 'number', enum: [0, 1], example: 1 },
          createdBy: { type: 'number', example: 456 },
        },
        required: ['messageId', 'isValidResponse', 'createdBy'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Feedback saved or updated successfully',
      schema: {
        type: 'object',
        additionalProperties: true,
        description: 'Returns saved or updated feedback entity from repository',
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Validation failed',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    })
  );
}

// ========== Business Card Endpoints ==========

export function uploadBusinessCardSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Upload business card',
      description: 'Process business card image and extract contact information',
    }),
    ApiHeader({
      name: 'userid',
      description: 'User ID',
      required: true,
      schema: { type: 'string' },
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Business card image file',
          },
        },
        required: ['file'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Business card processed successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: true,
            },
            description: 'Extracted contact data or error message',
          },
          error: {
            type: 'string',
            nullable: true,
            description: 'Error message if processing failed',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - No file uploaded',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    })
  );
}

// ========== Research Endpoints ==========

export function searchCompanySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Search company information',
      description: 'Fetch company data using AI research service',
    }),
    ApiHeader({
      name: 'authorization',
      description: 'Bearer token',
      required: true,
      schema: { type: 'string' },
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          query: { type: 'string', example: 'Apple Inc' },
        },
        required: ['query'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Company data retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            additionalProperties: true,
            description: 'Company information object',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Company not found',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
    })
  );
}

export function searchCompanyIndustryIntelligenceSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Search company industry intelligence',
      description: 'Fetch industry intelligence data for a company',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          query: { type: 'string', example: 'Apple Inc' },
          industrySegment: { type: 'string', example: 'Technology' },
        },
        required: ['query'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Industry intelligence retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            additionalProperties: true,
            description: 'Industry intelligence data',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Intelligence data not found',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
    })
  );
}

// ========== Policy Configurator Extractor Endpoints ==========

export function extractPolicyConfiguratorSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Extract policy configuration from PDF',
      description:
        'Upload a policy document PDF and use AI to extract a pre-populated Policy Configurator JSON covering all 6 stages (components, relationships, template, parameters, choices, constraints).',
    }),
    ApiHeader({
      name: 'userid',
      description: 'User ID',
      required: true,
      schema: { type: 'string' },
    }),
    ApiQuery({
      name: 'policyId',
      type: 'number',
      required: true,
      description: 'ID of the policy to associate the extracted configuration with',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Policy document PDF',
          },
        },
        required: ['file'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Extraction completed. policyConfiguration is populated on success or {} on failure.',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              policyConfiguration: {
                type: 'object',
                additionalProperties: true,
                description: 'Extracted policy configuration JSON or {} if extraction failed',
              },
              message: {
                type: 'string',
                nullable: true,
                description: 'Set when policyConfiguration is {} (extraction failed)',
              },
              warnings: {
                type: 'array',
                items: { type: 'string' },
                nullable: true,
                description: 'Per-stage warnings when some stages fell back to defaults',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - No file uploaded',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
    })
  );
}

// ========== PDF Analyser Endpoints ==========

export function uploadPdfDocumentSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Upload and analyze PDF document',
      description:
        'Process PDF document with AI and extract insurance information',
    }),
    ApiConsumes('multipart/form-data'),
    ApiQuery({
      name: 'company',
      type: 'string',
      required: false,
      description: 'Extract company information (true/false)',
    }),
    ApiQuery({
      name: 'policyDetails',
      type: 'string',
      required: false,
      description: 'Extract policy details (true/false)',
    }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'PDF file to analyze',
          },
        },
        required: ['file'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'PDF analyzed successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            additionalProperties: true,
            description:
              'Extracted document data including documentInfo, companyInfo, policyDetails, or insuranceData',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - No file uploaded',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
    })
  );
}

export function answerQuestionsFromPdfSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Answer questions from PDF cover',
      description:
        'Upload PDF and get answers to specific questions using AI',
    }),
    ApiHeader({
      name: 'userid',
      description: 'User ID',
      required: true,
      schema: { type: 'string' },
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'PDF file',
          },
          data: {
            type: 'string',
            description: 'JSON string with questions array',
            example: '{"questions":["What is the policy number?"]}',
          },
        },
        required: ['file', 'data'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Questions answered successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              answers: {
                type: 'object',
                additionalProperties: true,
                description: 'Question-answer pairs',
              },
              documentDeleted: { type: 'boolean', example: true },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - Validation failed or no file uploaded',
      schema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
          errors: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
    })
  );
}

export function extractPolicyDetailsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: 'Extract and compare policy details from PDF',
      description:
        'Upload a policy document PDF and extract 9 financial fields (policy_number, sum_insured, basic_premium, net_premium, gst_percentage, gst_amount, fee, other_amount, total_premium). Each field is compared against the placement slip record for the given opportunity activity. policy_number has no DB comparison — db_value is always null and is_matched is always true.',
    }),
    ApiHeader({
      name: 'userid',
      description: 'User ID',
      required: true,
      schema: { type: 'string' },
    }),
    ApiQuery({
      name: 'opportunityActivityId',
      type: 'number',
      required: true,
      description: 'ID of the opportunity activity (placement slip generation activity)',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'Policy document PDF',
          },
        },
        required: ['file'],
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Extraction and comparison completed.',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              fields: {
                type: 'object',
                description: 'Per-field comparison result',
                properties: Object.fromEntries(
                  ['policy_number', 'sum_insured', 'basic_premium', 'net_premium',
                   'gst_percentage', 'gst_amount', 'fee', 'other_amount', 'total_premium'].map((key) => [
                    key,
                    {
                      type: 'object',
                      properties: {
                        extracted: { nullable: true, description: 'Value extracted from the PDF' },
                        db_value: { nullable: true, description: key === 'policy_number' ? 'Always null — no DB column' : 'Value from the placement slip record' },
                        is_matched: { type: 'boolean', description: key === 'policy_number' ? 'Always true — no DB comparison' : 'Whether extracted matches DB value' },
                      },
                    },
                  ])
                ),
              },
              message: {
                type: 'string',
                nullable: true,
                description: 'Empty string when all fields match; lists mismatched field names otherwise',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - No file uploaded or invalid opportunityActivityId',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
        },
      },
    })
  );
}
