import { applyDecorators } from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiBody,
    ApiExtraModels,
    ApiOperation,
    ApiResponse,
    ApiTags,
    getSchemaPath
} from '@nestjs/swagger';
import {
    OnboardingResponseDto,
    SendEnrollmentConfirmationDto,
    SendEnrollmentReminderDto,
    SendEnrollmentStartDto,
    SendLifeEventConfirmationDto,
    TriggerCompanyInitialOnboardingDto,
    TriggerTestInitialOnboardingDto,
    SendBulkEnrollmentConfirmationDto,
    TriggerTestEnrollmentConfirmationDto,
    SendApologyWelcomeEmailDto
} from './dto/enrollment.dto';
import { errorMessages } from '../../../../../../libs/service-lib/src/lib/messages';

// Swagger decorators for sendEnrollmentStartNotification
export const SendEnrollmentStartSwagger = () =>
    applyDecorators(
        ApiTags('Onboarding'),
        ApiBearerAuth('access-token'),
        ApiExtraModels(SendEnrollmentStartDto, OnboardingResponseDto),
        ApiOperation({
            summary: 'Send enrollment start notification',
            description: 'Sends enrollment start notifications to employees based on specified criteria. This endpoint allows triggering enrollment start notifications for specific companies, policies, or employees within a date range.'
        }),
        ApiBody({
            description: 'Enrollment start notification parameters',
            schema: {
                $ref: getSchemaPath(SendEnrollmentStartDto)
            }
        }),
        ApiResponse({
            status: 200,
            description: 'Enrollment start notifications sent successfully',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 200 },
                    message: {
                        type: 'string',
                        example: 'Enrollment start notifications sent successfully'
                    },
                    data: {
                        type: 'object',
                        $ref: getSchemaPath(OnboardingResponseDto)
                    }
                }
            }
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - Invalid parameters',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 400 },
                    message: {
                        type: 'string',
                        example: 'Invalid trigger date format or missing required parameters'
                    }
                }
            }
        }),
        ApiResponse({
            status: 404,
            description: 'Not Found - Companies, policies, or employees not found',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 404 },
                    message: {
                        type: 'string',
                        example: 'Specified companies or employees not found'
                    }
                }
            }
        }),
        ApiResponse({
            status: 500,
            description: 'Internal Server Error',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 500 },
                    message: { type: 'string', example: 'Internal server error.' }
                }
            }
        })
    );

// Swagger decorators for sendEnrollmentConfirmationNotification
export const SendEnrollmentConfirmationSwagger = () =>
    applyDecorators(
        ApiTags('Onboarding'),
        ApiBearerAuth('access-token'),
        ApiExtraModels(SendEnrollmentConfirmationDto, OnboardingResponseDto),
        ApiOperation({
            summary: 'Send enrollment confirmation notification',
            description: 'Sends an enrollment confirmation notification to a specific employee after they have completed the enrollment process.'
        }),
        ApiBody({
            description: 'Employee and policy information for confirmation',
            schema: {
                $ref: getSchemaPath(SendEnrollmentConfirmationDto)
            }
        }),
        ApiResponse({
            status: 200,
            description: 'Enrollment confirmation notification sent successfully',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 200 },
                    message: {
                        type: 'string',
                        example: 'Enrollment confirmation notification sent successfully'
                    },
                    data: {
                        type: 'object',
                        $ref: getSchemaPath(OnboardingResponseDto)
                    }
                }
            }
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - Missing required fields',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 400 },
                    message: {
                        type: 'string',
                        example: 'employeeId and policyId are required fields'
                    }
                }
            }
        }),
        ApiResponse({
            status: 404,
            description: 'Not Found - Employee or policy not found',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 404 },
                    message: {
                        type: 'string',
                        example: 'Employee or policy not found'
                    }
                }
            }
        }),
        ApiResponse({
            status: 500,
            description: 'Internal Server Error',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 500 },
                    message: { type: 'string', example: 'Internal server error.' }
                }
            }
        })
    );

export const SendLifeEventConfirmationSwagger = () =>
    applyDecorators(
        ApiTags('Onboarding'),
        ApiBearerAuth('access-token'),
        ApiExtraModels(SendLifeEventConfirmationDto, OnboardingResponseDto),
        ApiOperation({
            summary: 'Send life event confirmation notification',
            description: 'Sends a life event confirmation email after an employee submits a dependent addition or deletion request.'
        }),
        ApiBody({
            description: 'Life event confirmation notification parameters',
            schema: {
                $ref: getSchemaPath(SendLifeEventConfirmationDto)
            }
        }),
        ApiResponse({
            status: 200,
            description: 'Life event confirmation notification sent successfully',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 200 },
                    message: {
                        type: 'string',
                        example: 'Life event confirmation notification sent successfully'
                    },
                    data: {
                        type: 'object',
                        $ref: getSchemaPath(OnboardingResponseDto)
                    }
                }
            }
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - Invalid employee, policy, or life event details'
        })
    );

// Swagger decorators for sendEnrollmentReminderNotification
export const SendEnrollmentReminderSwagger = () =>
    applyDecorators(
        ApiTags('Onboarding'),
        ApiBearerAuth('access-token'),
        ApiExtraModels(SendEnrollmentReminderDto, OnboardingResponseDto),
        ApiOperation({
            summary: 'Send enrollment reminder notifications',
            description: 'Sends enrollment reminder notifications to employees based on enrollment end dates. The system automatically uses specific reminder days [7, 3, 2, 1] days before the enrollment deadline regardless of the reminderDays parameter in the request.'
        }),
        ApiBody({
            description: 'Enrollment reminder notification parameters',
            schema: {
                $ref: getSchemaPath(SendEnrollmentReminderDto)
            }
        }),
        ApiResponse({
            status: 200,
            description: 'Enrollment reminder notifications scheduled successfully',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 200 },
                    message: {
                        type: 'string',
                        example: 'Enrollment reminder notifications scheduled successfully'
                    },
                    data: {
                        type: 'object',
                        $ref: getSchemaPath(OnboardingResponseDto)
                    }
                }
            }
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - Invalid parameters',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 400 },
                    message: {
                        type: 'string',
                        example: 'Invalid trigger date format or missing required parameters'
                    }
                }
            }
        }),
        ApiResponse({
            status: 404,
            description: 'Not Found - Companies, policies, or employees not found',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 404 },
                    message: {
                        type: 'string',
                        example: 'Specified companies, policies, or employees not found'
                    }
                }
            }
        }),
        ApiResponse({
            status: 500,
            description: 'Internal Server Error',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 500 },
                    message: { type: 'string', example: 'Internal server error.' }
                }
            }
        })
    );

export const TriggerCompanyInitialOnboardingSwagger = () =>
    applyDecorators(
        ApiTags('Onboarding'),
        ApiBearerAuth('access-token'),
        ApiExtraModels(TriggerCompanyInitialOnboardingDto, OnboardingResponseDto),
        ApiOperation({
            summary: 'Trigger pending initial onboarding notifications for a company',
            description: 'Sends initial onboarding notifications for all employees of the specified company whose onboarding mail flag is still false.'
        }),
        ApiBody({
            description: 'Company onboarding trigger payload',
            schema: {
                $ref: getSchemaPath(TriggerCompanyInitialOnboardingDto)
            }
        }),
        ApiResponse({
            status: 200,
            description: 'Pending initial onboarding notifications processed successfully',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 200 },
                    message: {
                        type: 'string',
                        example: 'Pending initial onboarding notifications processed successfully'
                    },
                    data: {
                        type: 'object',
                        $ref: getSchemaPath(OnboardingResponseDto)
                    }
                }
            }
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - Invalid parameters',
        }),
        ApiResponse({
            status: 404,
            description: 'Not Found - Company not found',
        }),
        ApiResponse({
            status: 500,
            description: 'Internal Server Error',
        })
    );

export const TriggerTestInitialOnboardingSwagger = () =>
    applyDecorators(
        ApiTags('Onboarding'),
        ApiBearerAuth('access-token'),
        ApiExtraModels(TriggerTestInitialOnboardingDto, OnboardingResponseDto),
        ApiOperation({
            summary: 'Test-trigger the initial onboarding mail for a single employee by email',
            description: 'Sends the initial onboarding notification to one employee identified by email, regardless of whether it was already sent, without affecting the bulk/cron send bookkeeping. Throws if the email is not configured under this company/domain.'
        }),
        ApiBody({
            description: 'Company ID, employee email, and optional subdomain to test',
            schema: {
                $ref: getSchemaPath(TriggerTestInitialOnboardingDto)
            }
        }),
        ApiResponse({
            status: 200,
            description: 'Test onboarding mail sent successfully',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 200 },
                    message: {
                        type: 'string',
                        example: 'Test onboarding mail sent successfully to employee@example.com'
                    },
                    data: {
                        type: 'object',
                        $ref: getSchemaPath(OnboardingResponseDto)
                    }
                }
            }
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - Invalid parameters',
        }),
        ApiResponse({
            status: 404,
            description: 'Not Found - Company not found, or the user is not configured under this domain',
        }),
        ApiResponse({
            status: 500,
            description: 'Internal Server Error',
        })
    );

export const TriggerTestEnrollmentConfirmationSwagger = () =>
    applyDecorators(
        ApiTags('Onboarding'),
        ApiBearerAuth('access-token'),
        ApiExtraModels(TriggerTestEnrollmentConfirmationDto, OnboardingResponseDto),
        ApiOperation({
            summary: 'Test-trigger the enrollment confirmation mail for a single employee by email',
            description: 'Sends the enrollment confirmation notification to one employee identified by email, regardless of whether it was already sent. Throws if the email is not configured or not enrolled under this company/domain.'
        }),
        ApiBody({
            description: 'Company ID, employee email, and optional subdomain to test',
            schema: {
                $ref: getSchemaPath(TriggerTestEnrollmentConfirmationDto)
            }
        }),
        ApiResponse({
            status: 200,
            description: 'Test confirmation mail sent successfully',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 200 },
                    message: {
                        type: 'string',
                        example: 'Confirmation mail sent successfully to employee@example.com'
                    },
                    data: {
                        type: 'object',
                        $ref: getSchemaPath(OnboardingResponseDto)
                    }
                }
            }
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - Invalid parameters',
        }),
        ApiResponse({
            status: 404,
            description: 'Not Found - Company not found, or the user is not configured/enrolled under this domain',
        }),
        ApiResponse({
            status: 500,
            description: 'Internal Server Error',
        })
    );

// Swagger decorators for sendBulkEnrollmentConfirmation
export const SendBulkEnrollmentConfirmationSwagger = () =>
    applyDecorators(
        ApiTags('Onboarding'),
        ApiBearerAuth('access-token'),
        ApiExtraModels(SendBulkEnrollmentConfirmationDto, OnboardingResponseDto),
        ApiOperation({
            summary: 'Send enrollment confirmation emails to all enrolled-with-choices employees of a company',
            description: 'Triggers enrollment confirmation notifications for all employees of the specified company who are enrolled with choices (excludes bulk/bypass-uploaded and auto-submitted enrollments, and anyone already sent) and returns immediately. The actual sending — batched 50 at a time to support large lists (10K+ employees) — continues in the background after the response is returned; check application logs for per-batch progress and per-employee failures. Optionally filter by specific employee IDs and/or a portal subdomain.'
        }),
        ApiBody({
            description: 'Company ID and optional employee IDs / subdomain',
            schema: {
                $ref: getSchemaPath(SendBulkEnrollmentConfirmationDto)
            }
        }),
        ApiResponse({
            status: 202,
            description: 'Bulk enrollment confirmation triggered; sending continues in the background',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 202 },
                    message: {
                        type: 'string',
                        example: 'Bulk enrollment confirmation processing started'
                    },
                    data: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true }
                        }
                    }
                }
            }
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - Invalid company ID',
        }),
        ApiResponse({
            status: 500,
            description: 'Internal Server Error',
        })
    );

// Swagger decorators for previewBulkEnrollmentConfirmation
export const PreviewBulkEnrollmentConfirmationSwagger = () =>
    applyDecorators(
        ApiTags('Onboarding'),
        ApiBearerAuth('access-token'),
        ApiOperation({
            summary: 'Preview which employees a bulk-enrollment-confirmation trigger would mail',
            description: 'Returns the paginated list (and total count) of employees who are enrolled with choices, not auto-submitted, and not already sent the confirmation mail for the given company/subdomain — the same eligibility filter sendBulkEnrollmentConfirmation applies.'
        }),
        ApiResponse({
            status: 200,
            description: 'Preview fetched successfully',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 200 },
                    message: { type: 'string', example: 'Preview fetched successfully' },
                    data: {
                        type: 'object',
                        properties: {
                            totalCount: { type: 'number', example: 142 },
                            page: { type: 'number', example: 1 },
                            limit: { type: 'number', example: 25 },
                            employees: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        employeeId: { type: 'number', example: 203461 },
                                        employeeName: { type: 'string', example: 'Jane Doe' },
                                        employeeEmail: { type: 'string', example: 'jane.doe@example.com' },
                                        companyEmployeeId: { type: 'string', example: 'EMP-1042' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - Invalid parameters',
        }),
        ApiResponse({
            status: 500,
            description: 'Internal Server Error',
        })
    );

export const SendApologyWelcomeEmailSwagger = () =>
    applyDecorators(
        ApiTags('Onboarding'),
        ApiBearerAuth('access-token'),
        ApiExtraModels(SendApologyWelcomeEmailDto, OnboardingResponseDto),
        ApiOperation({
            summary: 'Send apology email for a previously sent welcome email',
            description: 'Triggers an apology email to the given list of employee IDs (informing them that an earlier welcome email was sent unintentionally and can be ignored), and returns immediately. The actual sending — batched 50 at a time to support large lists (4000+ employees) — continues in the background after the response is returned; check application logs for per-batch progress and per-employee failures.'
        }),
        ApiBody({
            description: 'List of employee IDs to send the apology email to',
            schema: {
                $ref: getSchemaPath(SendApologyWelcomeEmailDto)
            }
        }),
        ApiResponse({
            status: 202,
            description: 'Apology welcome email triggered; sending continues in the background',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 202 },
                    message: {
                        type: 'string',
                        example: 'Apology welcome email triggered for 4000 employee(s)'
                    },
                    data: {
                        type: 'object',
                        properties: {
                            success: { type: 'boolean', example: true },
                            totalEmployees: { type: 'number', example: 4000 }
                        }
                    }
                }
            }
        }),
        ApiResponse({
            status: 400,
            description: 'Bad Request - employeeIds is missing or empty',
        }),
        ApiResponse({
            status: 500,
            description: 'Internal Server Error',
        })
    );

export const getTermsAndConditionsSwagger = () =>
  applyDecorators(
    ApiTags("Onboarding"),
    ApiBearerAuth('access-token'),
    ApiOperation({
      summary: "Get active Terms and Conditions",
      description: "Fetches the currently active terms and conditions document from Strapi CMS.",
    }),
    ApiResponse({
      status: 200,
      description: "Active terms and conditions fetched successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Terms and conditions fetched successfully" },
          data: { type: "object" },
        },
      },
    }),
    ApiResponse({ status: 500, description: "Internal server error." })
  );

export const withdrawTermsSwaggerMetadata = () =>
  applyDecorators(
    ApiTags("Onboarding"),
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Withdraw Terms and Conditions acceptance",
      description: "Resets the user's TC acceptance, clears version and accepted date, and records the withdrawal timestamp.",
    }),
    ApiBody({
      description: "User ID to withdraw consent for",
      schema: {
        type: "object",
        properties: {
          userId: { type: "number", description: "The user ID", example: 123 },
        },
        required: ["userId"],
      },
    }),
    ApiResponse({
      status: 200,
      description: "Terms withdrawn successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Terms withdrawn" },
        },
      },
    }),
    ApiResponse({ status: 404, description: errorMessages.userNotFound }),
    ApiResponse({ status: 500, description: "Internal server error." })
  );

export const getUserTcStatusSwagger = () =>
  applyDecorators(
    ApiTags("Onboarding"),
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get user Terms and Conditions status",
      description: "Returns the current TC acceptance status for a specific user.",
    }),
    ApiResponse({
      status: 200,
      description: "User TC status fetched successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "User TC status fetched successfully" },
          data: {
            type: "object",
            properties: {
              isTCAccepted: { type: "boolean" },
              tcAcceptedVersion: { type: "number", nullable: true },
              tcAcceptedAt: { type: "string", format: "date-time", nullable: true },
              tcWithdrawnAt: { type: "string", format: "date-time", nullable: true },
              tcStatus: { type: "string", nullable: true, example: "accepted" },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: errorMessages.userNotFound }),
    ApiResponse({ status: 500, description: "Internal server error." })
  );

export const acceptTermsSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Accept Terms and Conditions",
      description: "Updates the user's isTCAccepted flag to true.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "User ID and TC version to accept terms for",
      schema: {
        type: "object",
        properties: {
          userId: {
            type: "number",
            description: "The user ID",
            example: 123,
          },
          tcVersion: {
            type: "number",
            description: "The version of the terms and conditions being accepted",
            example: 1,
          },
        },
        required: ["userId"],
      },
    }),
    ApiResponse({
      status: 200,
      description: "Terms accepted successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Terms accepted" },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.userNotFound,
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
    })
  );
};