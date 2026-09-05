# Logging Implementation 

## Overview

This document outlines the logging standards and implementation details for the Insurance Wellness Hub microservices architecture using Winston logger.

## Log Levels

| Level    | Usage                                          | Example Scenario                                |
|----------|------------------------------------------------|------------------------------------------------|
| ERROR    | Critical issues requiring immediate attention   | Database connection failure, API crashes        |
| WARN     | Potentially harmful situations                  | API rate limit reaching threshold, JWT expiring |
| INFO     | General operational events                      | User login, Request completion                  |
| DEBUG    | Detailed information for debugging              | Request/Response payloads, SQL queries         |
| VERBOSE  | Extra detailed information                      | HTTP headers, Environmental variables           |

## Log Format

### Standard Log Structure
```typescript
interface LogFormat {
  timestamp: string;          // ISO 8601 format
  level: string;             // Log level
  service: string;           // Microservice name
  traceId: string;          // Request trace ID
  message: string;          // Log message
  context?: {               // Additional context
    path?: string;          // API endpoint
    method?: string;        // HTTP method
    statusCode?: number;    // HTTP status code
    error?: any;           // Error details
    userId?: string;        // User identifier
    duration?: number;      // Request duration in ms
  };
}
```

## Implementation Details

### 1. Logger Configuration

```typescript
// filepath: /apps/services/common-service/src/logger/logger.config.ts

import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = {
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.CloudWatch({
      logGroupName: process.env.AWS_CLOUDWATCH_GROUP,
      logStreamName: `${process.env.SERVICE_NAME}-${process.env.NODE_ENV}`,
      awsRegion: process.env.AWS_REGION
    }),
  ]
};
```

### 2. Logger Implementation

```typescript
// filepath: /apps/services/common-service/src/logger/custom-logger.service.ts

@Injectable()
export class CustomLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) 
    private readonly logger: Logger
  ) {}

  log(message: string, context?: any) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: any) {
    this.logger.error(message, { trace, context });
  }
}
```

## Usage Guidelines

### 1. Error Logging

```typescript
// Example of error logging
try {
  await this.userService.create(user);
} catch (error) {
  this.logger.error('Failed to create user', {
    context: {
      userId: user.id,
      error: error.message,
      stack: error.stack
    }
  });
  throw error;
}
```

### 2. Request Logging

```typescript
// Example of request logging middleware
@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: CustomLoggerService) {}

  use(req: Request, res: Response, next: Function) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      this.logger.log('Request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: Date.now() - startTime
      });
    });
    
    next();
  }
}
```

## Log Storage and Retention

### CloudWatch Configuration

- **Log Groups**: Separate log groups for each microservice
- **Retention Period**: 30 days
- **Log Streams**: Based on environment and date

```typescript
const cloudWatchConfig = {
  logGroupName: '/iirm/microservices',
  logStreamName: `${SERVICE_NAME}/${ENVIRONMENT}/${DATE}`,
  retentionInDays: 30
};
```

## Monitoring and Alerts

### CloudWatch Alerts

1. **Error Rate Alert**
   - Trigger when error rate exceeds 5% in 5 minutes
   - Notify via SNS topic

2. **Response Time Alert**
   - Trigger when p95 latency exceeds 1000ms
   - Notify via SNS topic

## Best Practices

1. **DO**
   - Log all API requests and responses
   - Include request trace IDs
   - Use structured logging format
   - Include relevant context
   - Handle sensitive data appropriately

2. **DON'T**
   - Log sensitive information (passwords, tokens)
   - Log large payloads
   - Use console.log
   - Create unnecessary log entries

## Example Implementation

```typescript
// filepath: /apps/services/auth-service/src/auth.controller.ts

@Controller('auth')
export class AuthController {
  constructor(private readonly logger: CustomLoggerService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const traceId = uuid();
    
    this.logger.info('Login attempt', {
      traceId,
      context: {
        email: loginDto.email,
        ipAddress: request.ip
      }
    });

    try {
      const result = await this.authService.login(loginDto);
      
      this.logger.info('Login successful', {
        traceId,
        context: {
          userId: result.userId
        }
      });
      
      return result;
    } catch (error) {
      this.logger.error('Login failed', {
        traceId,
        context: {
          error: error.message,
          stack: error.stack
        }
      });
      throw error;
    }
  }
}
```

## Testing

### Log Testing Guidelines

```typescript
// filepath: /apps/services/auth-service/test/logger.spec.ts

describe('Logger Service', () => {
  it('should log errors with proper context', () => {
    const logger = new CustomLoggerService();
    const spy = jest.spyOn(logger, 'error');
    
    logger.error('Test error', {
      context: { testId: '123' }
    });
    
    expect(spy).toHaveBeenCalledWith(
      'Test error',
      expect.objectContaining({
        context: expect.objectContaining({
          testId: '123'
        })
      })
    );
  });
});
```

## Maintenance and Review

1. Regular review of log patterns
2. Optimization of log levels
3. Cleanup of unnecessary logs
4. Update of alert thresholds

## References

- [Winston Documentation](https://github.com/winstonjs/winston)
- [NestJS Logging](https://docs.nestjs.com/techniques/logging)
- [AWS CloudWatch Best Practices](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/WhatIsCloudWatchLogs.html)