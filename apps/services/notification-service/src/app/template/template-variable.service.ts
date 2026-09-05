import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { 
  NotificationParameter, 
  NotificationEventType,
  NotificationEventParameterMapping,
  TraceIdService 
} from '../../../../service-lib';

export interface EventVariableDefinition {
  key: string;
  description: string;
  required: boolean;
}


export interface ValidationError {
  type: 'UNDEFINED_VARIABLE' | 'INVALID_SYNTAX' | 'MISSING_VARIABLE';
  variable: string;
  position: number;
  message: string;
  suggestions?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  variables: string[];
  errors: ValidationError[];
  warnings: ValidationError[];
}


@Injectable()
export class TemplateVariableService {
  private readonly logger: Logger;

  constructor(
    @InjectRepository(NotificationParameter)
    private readonly parameterRepository: Repository<NotificationParameter>,
    @InjectRepository(NotificationEventType)
    private readonly eventTypeRepository: Repository<NotificationEventType>,
    @InjectRepository(NotificationEventParameterMapping)
    private readonly eventParameterMappingRepository: Repository<NotificationEventParameterMapping>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = new Logger(TemplateVariableService.name);
  }

  /**
   * Parse template content to extract variable names
   */
  parseVariables(content: string): string[] {
    const traceId = this.traceIdService.traceId;
    this.logger.log(`[${traceId}] Parsing variables from template content`);

    if (!content) {
      return [];
    }

    // Regex to match {{variableName}} pattern
    const variableRegex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const variableName = match[1];
      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }
    }

    this.logger.log(`[${traceId}] Found ${variables.length} unique variables: ${variables.join(', ')}`);
    return variables;
  }

  /**
   * Find similar variable names for suggestions
   */
  private findSimilarVariables(target: string, available: string[]): string[] {
    const suggestions: { name: string; score: number }[] = [];

    available.forEach(name => {
      const score = this.calculateSimilarity(target.toLowerCase(), name.toLowerCase());
      if (score > 0.4) { // Threshold for similarity
        suggestions.push({ name, score });
      }
    });

    return suggestions
      .sort((a, b) => b.score - a.score)
      .map(s => s.name);
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Get all available event types
   */
  async getEventTypes(): Promise<NotificationEventType[]> {
    const traceId = this.traceIdService.traceId;
    this.logger.log(`[${traceId}] Fetching all event types`);

    try {
      const eventTypes = await this.eventTypeRepository.find({
        select: ['id', 'name', 'description'],
        order: { name: 'ASC' }
      });

      this.logger.log(`[${traceId}] Found ${eventTypes.length} event types`);
      return eventTypes;
    } catch (error) {
      this.logger.error(`[${traceId}] Error fetching event types:`, error);
      throw new Error('Failed to fetch event types');
    }
  }

  /**
   * Get variables for a specific event type
   */
  async getVariablesByEventType(eventTypeId: number, requiredOnly: boolean = false): Promise<{
    eventType: NotificationEventType;
    variables: EventVariableDefinition[];
    totalVariables: number;
    requiredVariables: number;
  }> {
    const traceId = this.traceIdService.traceId;
    this.logger.log(`[${traceId}] Fetching variables for event type ${eventTypeId}, requiredOnly: ${requiredOnly}`);

    try {
      // First, get the event type details
      const eventType = await this.eventTypeRepository.findOne({
        where: { id: eventTypeId },
        select: ['id', 'name', 'description']
      });

      if (!eventType) {
        throw new NotFoundException(`Event type with ID ${eventTypeId} not found`);
      }

      // Get variables mapped to this event type
      const queryBuilder = this.eventParameterMappingRepository
        .createQueryBuilder('mapping')
        .innerJoinAndSelect('mapping.parameterDefinition', 'parameter')
        .where('mapping.eventTypeId = :eventTypeId', { eventTypeId });

      if (requiredOnly) {
        queryBuilder.andWhere('mapping.required = :required', { required: true });
      }

      queryBuilder.orderBy('parameter.key', 'ASC');

      const mappings = await queryBuilder.getMany();

      const variables: EventVariableDefinition[] = mappings.map(mapping => ({
        key: mapping.parameterDefinition.key,
        description: mapping.parameterDefinition.description || '',
        required: mapping.required
      }));

      const requiredVariables = variables.filter(v => v.required).length;

      this.logger.log(`[${traceId}] Found ${variables.length} variables for event type ${eventType.name}, ${requiredVariables} required`);

      return {
        eventType,
        variables,
        totalVariables: variables.length,
        requiredVariables
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`[${traceId}] Error fetching variables for event type ${eventTypeId}:`, error);
      throw new Error('Failed to fetch variables for event type');
    }
  }

  /**
   * Validate variables against event-specific parameters
   */
  async validateVariablesForEventType(content: string, eventTypeId: number, subject: string = ''): Promise<ValidationResult> {
    const traceId = this.traceIdService.traceId;
    this.logger.log(`[${traceId}] Validating template variables for event type ${eventTypeId}`);

    try {
      // Get event-specific variables
      const eventVariables = await this.getVariablesByEventType(eventTypeId);
      const availableKeys = eventVariables.variables.map(v => v.key);
      const eventName = eventVariables.eventType.name;

      const bodyValidation = this.validateContentVariables(content, availableKeys, eventName, 'Body');
      const subjectValidation = this.validateContentVariables(subject, availableKeys, eventName, 'Subject');

      const errors = [...subjectValidation.errors, ...bodyValidation.errors];
      const variables = [...new Set([...subjectValidation.variables, ...bodyValidation.variables])];
      const warnings: ValidationError[] = [];

      const isValid = errors.length === 0;
      this.logger.log(`[${traceId}] Event type validation complete. Valid: ${isValid}, Errors: ${errors.length}, Warnings: ${warnings.length}`);

      return {
        isValid,
        variables,
        errors,
        warnings
      };

    } catch (error) {
      if (error instanceof NotFoundException) {
          throw error;
      }
      this.logger.error(`[${traceId}] Error validating variables for event type ${eventTypeId}:`, error);
      throw new Error('Failed to validate template variables for event type');
    }
  }

  private validateContentVariables(content: string, availableKeys: string[], eventName: string, source: string) {
    const errors: ValidationError[] = [];
    const variables: string[] = [];
    
    if (!content) return { errors, variables };

    const variableRegex = /\{\{([^}]*)\}\}/g;
    let match;
    let position = 0;

    while ((match = variableRegex.exec(content)) !== null) {
      position++;
      const fullMatch = match[0]; // {{variableName}}
      const variableName = match[1];

      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }

      // Check for invalid syntax
      if (!variableName || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variableName)) {
        errors.push({
          type: 'INVALID_SYNTAX',
          variable: fullMatch,
          position,
          message: `[${source}] Invalid variable syntax: '${fullMatch}'. Variables must contain only letters, numbers, and underscores.`
        });
        continue;
      }

      // Check if variable exists for this event type
      if (!availableKeys.includes(variableName)) {
        const suggestions = this.findSimilarVariables(variableName, availableKeys);
        errors.push({
          type: 'UNDEFINED_VARIABLE',
          variable: variableName,
          position,
          message: `[${source}] Variable '${variableName}' is not available for event type '${eventName}'.`,
          suggestions: suggestions.slice(0, 3)
        });
      }
    }
    
    return { errors, variables };
  }
}