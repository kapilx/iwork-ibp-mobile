import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EventTypeResponseDto {
  @ApiProperty({
    description: 'Event type ID',
    example: 1
  })
  id!: number;

  @ApiProperty({
    description: 'Event type name',
    example: 'Password_Reset'
  })
  name!: string;

  @ApiPropertyOptional({
    description: 'Event type description',
    example: 'Password reset notification event'
  })
  description?: string;
}

export class EventVariableDefinitionResponseDto {
  @ApiProperty({
    description: 'Variable key/name',
    example: 'firstName'
  })
  key!: string;

  @ApiProperty({
    description: 'Variable description',
    example: 'Customer first name'
  })
  description!: string;

  @ApiProperty({
    description: 'Variable data type',
    example: 'string'
  })
  dataType!: string;

  @ApiProperty({
    description: 'Example value for the variable',
    example: 'John'
  })
  example!: string;

  @ApiProperty({
    description: 'Variable category',
    example: 'customer'
  })
  category!: string;

  @ApiProperty({
    description: 'Whether this variable is required for this event type',
    example: true
  })
  required!: boolean;
}

export class EventVariablesResponseDto {
  @ApiProperty({
    description: 'Event type information',
    type: EventTypeResponseDto
  })
  eventType!: EventTypeResponseDto;

  @ApiProperty({
    description: 'Variables available for this event type',
    type: [EventVariableDefinitionResponseDto]
  })
  variables!: EventVariableDefinitionResponseDto[];

  @ApiProperty({
    description: 'Total number of variables',
    example: 5
  })
  totalVariables!: number;

  @ApiProperty({
    description: 'Number of required variables',
    example: 3
  })
  requiredVariables!: number;
}


export class ValidationErrorDto {
  @ApiProperty({
    description: 'Type of validation error',
    enum: ['UNDEFINED_VARIABLE', 'INVALID_SYNTAX', 'MISSING_VARIABLE'],
    example: 'UNDEFINED_VARIABLE'
  })
  type!: 'UNDEFINED_VARIABLE' | 'INVALID_SYNTAX' | 'MISSING_VARIABLE';

  @ApiProperty({
    description: 'Variable name that caused the error',
    example: 'invalidVariable'
  })
  variable!: string;

  @ApiProperty({
    description: 'Position of the variable in the template',
    example: 1
  })
  position!: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Variable \'invalidVariable\' is not defined in the system.'
  })
  message!: string;

  @ApiPropertyOptional({
    description: 'Suggested variable names',
    example: ['firstName', 'policyNumber', 'premiumAmount']
  })
  suggestions?: string[];
}

export class ValidationResultResponseDto {
  @ApiProperty({
    description: 'Whether the template variables are valid',
    example: true
  })
  isValid!: boolean;

  @ApiProperty({
    description: 'List of variables found in the template',
    example: ['firstName', 'policyNumber', 'premiumAmount', 'dueDate']
  })
  variables!: string[];

  @ApiProperty({
    description: 'List of validation errors',
    type: [ValidationErrorDto]
  })
  errors!: ValidationErrorDto[];

  @ApiProperty({
    description: 'List of validation warnings',
    type: [ValidationErrorDto]
  })
  warnings!: ValidationErrorDto[];
}