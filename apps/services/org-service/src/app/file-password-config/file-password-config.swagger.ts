import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

export function getFilePasswordConfigSwagger() {
    return applyDecorators(
        ApiOperation({
            summary: 'Get file password configuration',
            description: 'Retrieves the current file password configuration for protected file downloads. Admin access only.',
        }),
        ApiResponse({
            status: 200,
            description: 'Configuration retrieved successfully',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 200 },
                    message: { type: 'string', example: 'Configuration retrieved successfully' },
                    data: {
                        type: 'object',
                        properties: {
                            id: { type: 'number', example: 1 },
                            passwordType: { type: 'string', enum: ['custom', 'user_details'], example: 'custom' },
                            selectedCountryId: { type: 'number', example: 2 },
                            organisationKey: { type: 'string', example: 'iirm_srilanka' },
                            customPassword: { type: 'string', example: 'Secure@1234' },
                            userFields: { type: 'array', items: { type: 'string' }, example: ['firstName', 'email'] },
                            createdBy: { type: 'number', example: 1 },
                            updatedBy: { type: 'number', example: 1 },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: 404,
            description: 'Configuration not found',
        })
    );
}

export function upsertFilePasswordConfigSwagger() {
    return applyDecorators(
        ApiOperation({
            summary: 'Create or update file password configuration',
            description: 'Creates or updates the file password configuration for protected file downloads. Admin access only.',
        }),
        ApiBody({
            description: 'File password configuration data',
            schema: {
                type: 'object',
                required: ['passwordType', 'selectedCountryId', 'organisationKey'],
                properties: {
                    passwordType: {
                        type: 'string',
                        enum: ['custom', 'user_details'],
                        description: 'Type of password generation',
                        example: 'custom',
                    },
                    selectedCountryId: {
                        type: 'number',
                        description: 'ID of the selected country/organisation',
                        example: 2,
                    },
                    organisationKey: {
                        type: 'string',
                        description: 'Key identifier for the organisation',
                        example: 'iirm_srilanka',
                    },
                    customPassword: {
                        type: 'string',
                        description: 'Custom password (required if passwordType is custom)',
                        example: 'Secure@1234',
                    },
                    userFields: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Array of user fields to use for password generation (required if passwordType is user_details)',
                        example: ['firstName', 'email'],
                    },
                },
            },
        }),
        ApiResponse({
            status: 200,
            description: 'Configuration saved successfully',
            schema: {
                type: 'object',
                properties: {
                    statusCode: { type: 'number', example: 200 },
                    message: { type: 'string', example: 'Configuration saved successfully' },
                    data: {
                        type: 'object',
                        properties: {
                            id: { type: 'number', example: 1 },
                            passwordType: { type: 'string', enum: ['custom', 'user_details'], example: 'custom' },
                            selectedCountryId: { type: 'number', example: 2 },
                            organisationKey: { type: 'string', example: 'iirm_srilanka' },
                            customPassword: { type: 'string', example: 'Secure@1234' },
                            userFields: { type: 'array', items: { type: 'string' }, example: null },
                            createdBy: { type: 'number', example: 1 },
                            updatedBy: { type: 'number', example: 1 },
                            createdAt: { type: 'string', format: 'date-time' },
                            updatedAt: { type: 'string', format: 'date-time' },
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Invalid input data',
        })
    );
}
