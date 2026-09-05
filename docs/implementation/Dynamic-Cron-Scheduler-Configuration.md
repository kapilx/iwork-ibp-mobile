# Dynamic Cron Scheduler Configuration - Developer Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [API Endpoints](#api-endpoints)
7. [Scheduler Types](#scheduler-types)
8. [Configuration Guide](#configuration-guide)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## Overview

### Summary

The Dynamic Cron Scheduler Configuration is a centralized system for managing scheduled jobs across the application. It allows administrators to configure, monitor, and control scheduled tasks through a web interface without requiring code deployments.

### Key Features

- ✅ Database-driven cron configuration
- ✅ Support for both fixed-time (daily) and interval-based schedules
- ✅ Real-time status monitoring (idle, running, success, failed)
- ✅ Enable/disable schedulers on the fly
- ✅ Update schedule expressions without deployment
- ✅ Execution history tracking
- ✅ Error logging and reporting
- ✅ IST timezone display with 12-hour format
- ✅ Auto-refresh capability

### Technology Stack

- **Backend**: NestJS, TypeORM, node-cron
- **Frontend**: React, TypeScript, AG-Grid, Material-UI
- **Database**: PostgreSQL
- **Scheduler Library**: node-cron

---

## Architecture

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌────────────────────┐  ┌──────────────────┐                  │
│  │ CronJobsListing    │  │  Edit Drawer     │                  │
│  │ - Table Display    │  │  - Time Picker   │                  │
│  │ - Status Badges    │  │  - Interval Input│                  │
│  │ - Refresh Button   │  │  - Enable/Disable│                  │
│  └────────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
                              ▼ HTTP
┌─────────────────────────────────────────────────────────────────┐
│                    API Layer (NestJS)                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │         CronConfigurationController                         │ │
│  │  - GET /cron-configurations                                 │ │
│  │  - PUT /cron-configurations/:id                             │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Service Layer                                 │
│  ┌──────────────────────┐  ┌──────────────────────────────┐   │
│  │ CronConfiguration    │  │  DynamicCronService          │   │
│  │ Service              │  │  - Load cron jobs            │   │
│  │ - Business logic     │  │  - Register handlers         │   │
│  │ - Validation         │  │  - Update expressions        │   │
│  └──────────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Scheduler Registry                          │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ Opportunity    │  │  Enrollment    │  │  Service TAT   │   │
│  │ Schedulers     │  │  Schedulers    │  │  Scheduler     │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL)                               │
│  application_scheduler_configuration table                       │
└─────────────────────────────────────────────────────────────────┘
```

### Component Flow

1. **Frontend requests** scheduler configurations via API
2. **Controller** validates and routes requests
3. **Service** processes business logic and database operations
4. **DynamicCronService** manages cron job lifecycle
5. **Scheduler Registry** stores and executes registered handlers
6. **Database** persists configuration and execution status

---

## Database Schema

### Table: `application_scheduler_configuration`

```sql
CREATE TABLE application_scheduler_configuration (
    id SERIAL PRIMARY KEY,
    scheduler_key VARCHAR(255) UNIQUE NOT NULL,
    scheduler_name VARCHAR(255) NOT NULL,
    scheduler_expression VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    description TEXT,
    last_successful_run_at TIMESTAMPTZ,
    last_failed_run_at TIMESTAMPTZ,
    last_run_status VARCHAR(20) DEFAULT 'idle',
    last_error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER NOT NULL,
    updated_by INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_scheduler_key ON application_scheduler_configuration(scheduler_key);
```

### Column Descriptions

| Column                   | Type         | Description                            |
| ------------------------ | ------------ | -------------------------------------- |
| `id`                     | SERIAL       | Primary key                            |
| `scheduler_key`          | VARCHAR(255) | Unique identifier (maps to handler)    |
| `scheduler_name`         | VARCHAR(255) | Display name                           |
| `scheduler_expression`   | VARCHAR(100) | Cron expression                        |
| `is_enabled`             | BOOLEAN      | Active/inactive status                 |
| `description`            | TEXT         | Purpose and details                    |
| `last_successful_run_at` | TIMESTAMPTZ  | Last successful execution time         |
| `last_failed_run_at`     | TIMESTAMPTZ  | Last failure time                      |
| `last_run_status`        | VARCHAR(20)  | Status: idle, running, success, failed |
| `last_error_message`     | TEXT         | Error details if failed                |

---

## Backend Implementation

### 1. Entity Definition

**File**: `libs/service-lib/src/lib/entities/application-scheduler-configuration.entity.ts`

```typescript
@Entity("application_scheduler_configuration")
@Index(["schedulerKey"], { unique: true })
export class ApplicationSchedulerConfiguration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: "scheduler_key", length: 255, unique: true })
  schedulerKey: string;

  @Column({ name: "scheduler_name", length: 255 })
  schedulerName: string;

  @Column({ name: "scheduler_expression", length: 100 })
  schedulerExpression: string;

  @Column({ name: "is_enabled", default: true })
  isEnabled: boolean;

  @Column({ name: "description", type: "text", nullable: true })
  description: string | null;

  @Column({
    name: "last_successful_run_at",
    type: "timestamptz",
    nullable: true,
  })
  lastSuccessfulRunAt: Date | null;

  @Column({ name: "last_failed_run_at", type: "timestamptz", nullable: true })
  lastFailedRunAt: Date | null;

  @Column({
    name: "last_run_status",
    type: "varchar",
    length: 20,
    default: "idle",
  })
  lastRunStatus: string;

  @Column({ name: "last_error_message", type: "text", nullable: true })
  lastErrorMessage: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @Column({ name: "created_by" })
  createdBy: number;

  @Column({ name: "updated_by" })
  updatedBy: number;
}
```

### 2. Constants

**File**: `libs/service-lib/src/lib/constants.ts`

```typescript
export const SCHEDULER_HANDLERS: Record<string, string> = {
  // Opportunity Schedulers
  HANDLE_EXPIRED_OPPORTUNITIES: "handleExpiredOpportunities",
  HANDLE_OPPORTUNITY_ACTIVITIES_CLOSE_TO_EXPIRY:
    "handleOpportunityActivitiesCloseToExpiry",
  HANDLE_OPPORTUNITIES_CLOSE_TO_EXPIRY: "handleOpportunitiesCloseToExpiry",
  GENERATE_PERFORMANCE_OUTPUT_FOR_ALL_USERS:
    "generatePerformanceOutputForAllUsers",
  HANDLE_POLICIES_CLOSE_TO_EXPIRY: "handlePoliciesCloseToExpiry",
  REFRESH_COMPANY_ANALYTICS: "refreshCompanyAnalytics",

  // Enrollment Upload Schedulers
  HANDLE_UPLOADS: "handleUploads",
  HANDLE_ENROLLMENT_UPLOADS: "handleEnrollmentUploads",
  HANDLE_ASSET_ENROLLMENT_UPLOADS: "handleAssetEnrollmentUploads",
  HANDLE_TPA_ID_UPLOADS: "handleTpaIdUploads",
  HANDLE_ENROLLMENT_ACTIVATION: "handleEnrollmentActivation",

  // Service TAT Scheduler
  SERVICE_TAT_AGGREGATION: "handleDailyAggregation",
};
```

### 3. Dynamic Cron Service

**File**: `apps/services/scheduler-service/src/app/cron-configuration/dynamic-cron.service.ts`

**Key Methods**:

- `registerHandler(schedulerKey, handler)` - Register a single handler
- `registerHandlers(handlers)` - Register multiple handlers at once
- `loadCronJobs()` - Load all configurations from database
- `addDynamicCron(schedulerKey, expression, callback)` - Create cron job
- `updateCronExpression(schedulerKey, newExpression)` - Update schedule
- `stopCron(schedulerKey)` - Stop a running cron
- `startCron(schedulerKey)` - Start a stopped cron
- `removeCron(schedulerKey)` - Remove cron completely

### 4. Scheduler Implementation Pattern

**Example**: `enrollment-upload.scheduler.ts`

```typescript
@Injectable()
export class EnrollmentUploadScheduler implements OnModuleInit {
  constructor(
    // ... repositories
    private readonly dynamicCronService: DynamicCronService
  ) {}

  async onModuleInit() {
    const handlers = new Map<string, () => Promise<void>>();

    handlers.set("HANDLE_UPLOADS", this.handleUploads.bind(this));
    handlers.set(
      "HANDLE_ENROLLMENT_UPLOADS",
      this.handleEnrollmentUploads.bind(this)
    );
    handlers.set(
      "HANDLE_ASSET_ENROLLMENT_UPLOADS",
      this.handleAssetEnrollmentUploads.bind(this)
    );

    this.dynamicCronService.registerHandlers(handlers);
  }

  // @Cron("*/2 * * * *") // Now managed dynamically
  async handleUploads() {
    // Implementation
  }
}
```

### 5. Repository Layer

**File**: `apps/services/scheduler-service/src/app/cron-configuration/cron-configuration.repository.ts`

**Methods**:

- `getAllConfigurations(page, limit, sort)` - Get paginated list
- `getConfigurationById(id)` - Get single configuration
- `getConfigurationByKey(key)` - Get by scheduler key
- `updateConfiguration(id, data, userId)` - Update configuration
- `updateExecutionStatus(key, status, error, duration)` - Update execution status

### 6. Service Layer

**File**: `apps/services/scheduler-service/src/app/cron-configuration/cron-configuration.service.ts`

**Methods**:

- `getAllConfigurations(page, limit, sort)` - Business logic for listing
- `updateConfiguration(id, data, userId)` - Validation and update logic

---

## Frontend Implementation

### 1. Page Component

**File**: `apps/ui/iwork/src/app/pages/CronJobsListing/index.tsx`

**Key Features**:

- Table with AG-Grid
- Edit drawer with dynamic form
- Confirmation modal for changes
- Refresh functionality
- Status badges with color coding

### 2. Configuration

**File**: `apps/ui/iwork/src/app/pages/CronJobsListing/config.ts`

**Key Functions**:

```typescript
// Detect if cron is interval-based
isIntervalCron(cronExpression: string): boolean

// Parse interval from cron (e.g., "*/2 * * * *" -> 2)
parseCronInterval(cronExpression: string): number | null

// Convert minutes to cron (e.g., 2 -> "*/2 * * * *")
convertIntervalToCron(intervalMinutes: number): string

// Parse cron to time (e.g., "45 12 * * *" -> "18:15:00" IST)
parseCronToTime(cronExpression: string): string

// Parse cron to 12-hour format (e.g., "45 12 * * *" -> "6:15 PM" IST)
parseCronToTimeInIST(cronExpression: string): string
```

### 3. Column Definitions

```typescript
const columns = [
  {
    headerName: "Scheduler Name",
    field: "schedulerName",
    sortable: true,
    pinned: "left",
  },
  {
    headerName: "Schedule",
    field: "schedulerExpression",
    sortable: true,
    valueFormatter: ({ value }) => {
      if (isIntervalCron(value)) {
        return `Every ${parseCronInterval(value)} mins`;
      }
      return parseCronToTimeInIST(value); // e.g., "6:15 PM"
    },
  },
  {
    headerName: "Status",
    field: "lastRunStatus",
    cellRenderer: "ChipRenderer",
    valueFormatter: ({ value }) => value?.toUpperCase(),
  },
  {
    headerName: "Last Success",
    field: "lastSuccessfulRunAt",
    valueFormatter: ({ value }) =>
      value ? new Date(value).toLocaleString() : "--",
  },
  {
    headerName: "Enabled",
    field: "isEnabled",
    valueFormatter: ({ value }) => (value ? "Yes" : "No"),
  },
];
```

### 4. Form Configuration

**Dynamic Form Fields**:

- **For Interval-based crons**: Number input for minutes
- **For Fixed-time crons**: Time picker for HH:mm

```typescript
export const editCronConfigurationFormConfig = (editableRowData: any) => {
  const isInterval = isIntervalCron(editableRowData?.schedulerExpression);

  return [
    {
      key: "cronSettings",
      config: [
        // ... scheduler name, key fields
        ...(isInterval
          ? [
              {
                key: "schedulerInterval",
                type: "number",
                label: "Interval (minutes)",
                rules: { min: 1, max: 1440 },
              },
            ]
          : [
              {
                key: "schedulerExpression",
                type: "time",
                label: "Schedule time",
              },
            ]),
        {
          key: "isEnabled",
          type: "checkbox",
          label: "Is Enabled",
        },
      ],
    },
  ];
};
```

---

## API Endpoints

### Base URL

```
{API_GATEWAY_URL}/scheduler-service/cron-configurations
```

### 1. Get All Configurations

**Endpoint**: `GET /cron-configurations`

**Query Parameters**:

```typescript
{
  page?: number;           // Page number (default: 1)
  limit?: number;          // Items per page (default: 10)
  sortField?: string;      // Field to sort by
  sortOrder?: 'ASC' | 'DESC'; // Sort direction
}
```

**Response**:

```json
{
  "data": [
    {
      "id": 12,
      "schedulerKey": "REFRESH_COMPANY_ANALYTICS",
      "schedulerName": "Refresh Company Analytics",
      "schedulerExpression": "35 17 * * *",
      "isEnabled": true,
      "description": "Triggers company analytics refresh...",
      "lastRunStatus": "success",
      "lastSuccessfulRunAt": "2026-01-19T05:30:00.000Z",
      "lastFailedRunAt": null,
      "lastErrorMessage": null,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-01-19T05:30:00.000Z"
    }
  ],
  "count": 12
}
```

### 2. Update Configuration

**Endpoint**: `PUT /cron-configurations/:id`

**Request Body**:

```json
{
  "isEnabled": true,
  "cronExpression": "*/5 * * * *"
}
```

**Response**:

```json
{
  "message": "Scheduler configuration updated successfully",
  "data": {
    "id": 12,
    "schedulerKey": "REFRESH_COMPANY_ANALYTICS",
    "schedulerExpression": "*/5 * * * *",
    "isEnabled": true,
    "updatedAt": "2026-01-19T10:30:00.000Z"
  }
}
```

### 3. Error Responses

**400 Bad Request**:

```json
{
  "statusCode": 400,
  "message": "Invalid cron expression",
  "error": "Bad Request"
}
```

**404 Not Found**:

```json
{
  "statusCode": 404,
  "message": "Scheduler configuration not found",
  "error": "Not Found"
}
```

---

## Scheduler Types

### 1. Fixed-Time Schedulers (Daily Execution)

**Cron Pattern**: `M H * * *`

**Examples**:

- `0 0 * * *` - Daily at 12:00 AM UTC (5:30 AM IST)
- `30 21 * * *` - Daily at 9:30 PM UTC (3:00 AM IST)
- `45 12 * * *` - Daily at 12:45 PM UTC (6:15 PM IST)

**Use Cases**:

- Daily reports generation
- Analytics refresh
- Performance calculations
- Policy expiry checks
- Opportunity expiration handling

**Configured Schedulers**:

1. **REFRESH_COMPANY_ANALYTICS** - `35 17 * * *`
2. **HANDLE_EXPIRED_OPPORTUNITIES** - `45 12 * * *`
3. **HANDLE_OPPORTUNITIES_CLOSE_TO_EXPIRY** - `45 12 * * *`
4. **HANDLE_OPPORTUNITY_ACTIVITIES_CLOSE_TO_EXPIRY** - `45 12 * * *`
5. **HANDLE_POLICIES_CLOSE_TO_EXPIRY** - `45 12 * * *`
6. **GENERATE_PERFORMANCE_OUTPUT_FOR_ALL_USERS** - `45 12 * * *`

### 2. Interval-Based Schedulers

**Cron Pattern**: `*/N * * * *`

**Examples**:

- `*/2 * * * *` - Every 2 minutes
- `*/5 * * * *` - Every 5 minutes
- `*/15 * * * *` - Every 15 minutes

**Use Cases**:

- File processing queues
- Real-time data synchronization
- Upload monitoring
- Status checks
- TAT aggregation

**Configured Schedulers**:

1. **HANDLE_UPLOADS** - `*/2 * * * *`
2. **HANDLE_ENROLLMENT_UPLOADS** - `*/2 * * * *`
3. **HANDLE_ASSET_ENROLLMENT_UPLOADS** - `*/2 * * * *`
4. **HANDLE_TPA_ID_UPLOADS** - `*/2 * * * *`
5. **HANDLE_ENROLLMENT_ACTIVATION** - `*/2 * * * *`
6. **SERVICE_TAT_AGGREGATION** - `*/2 * * * *`

---

## Configuration Guide

### Adding a New Scheduler

#### Step 1: Add Handler Mapping

**File**: `libs/service-lib/src/lib/constants.ts`

```typescript
export const SCHEDULER_HANDLERS: Record<string, string> = {
  // ... existing handlers
  NEW_SCHEDULER_KEY: "newSchedulerMethod",
};
```

#### Step 2: Implement Handler Method

**File**: Your scheduler class

```typescript
@Injectable()
export class YourScheduler implements OnModuleInit {
  constructor(private readonly dynamicCronService: DynamicCronService) {}

  async onModuleInit() {
    const handlers = new Map<string, () => Promise<void>>();
    handlers.set("NEW_SCHEDULER_KEY", this.newSchedulerMethod.bind(this));
    this.dynamicCronService.registerHandlers(handlers);
  }

  // @Cron("*/5 * * * *") // Comment out hardcoded cron
  async newSchedulerMethod() {
    // Your implementation
  }
}
```

#### Step 3: Insert Database Record

```sql
INSERT INTO application_scheduler_configuration (
    id,
    scheduler_key,
    scheduler_name,
    scheduler_expression,
    is_enabled,
    description,
    created_by,
    updated_by
) VALUES (
    24,
    'NEW_SCHEDULER_KEY',
    'New Scheduler Name',
    '*/5 * * * *',
    TRUE,
    'Description of what this scheduler does',
    0,
    0
);
```

#### Step 4: Test

1. Restart scheduler service
2. Check logs for handler registration
3. Verify in UI that scheduler appears
4. Test enable/disable functionality
5. Monitor execution status

### Modifying Scheduler Frequency

#### Via UI:

1. Navigate to **Scheduler Management**
2. Click **Edit Configuration** on desired scheduler
3. Change time/interval
4. Click **Save**
5. Confirm changes

#### Via Database:

```sql
UPDATE application_scheduler_configuration
SET scheduler_expression = '*/10 * * * *',
    updated_at = CURRENT_TIMESTAMP,
    updated_by = {user_id}
WHERE scheduler_key = 'HANDLE_UPLOADS';
```

#### Via API:

```bash
curl -X PUT \
  http://localhost:3000/api/cron-configurations/18 \
  -H 'Content-Type: application/json' \
  -d '{
    "cronExpression": "*/10 * * * *",
    "isEnabled": true
  }'
```

---

## Testing

### Unit Tests

#### Backend Service Tests

```typescript
describe("CronConfigurationService", () => {
  it("should get all configurations", async () => {
    const result = await service.getAllConfigurations(1, 10, []);
    expect(result.data).toBeDefined();
    expect(result.count).toBeGreaterThan(0);
  });

  it("should update configuration", async () => {
    const updated = await service.updateConfiguration(
      12,
      { cronExpression: "*/5 * * * *" },
      1
    );
    expect(updated.schedulerExpression).toBe("*/5 * * * *");
  });
});
```

#### Frontend Utility Tests

```typescript
describe("Cron Utilities", () => {
  it("should detect interval cron", () => {
    expect(isIntervalCron("*/2 * * * *")).toBe(true);
    expect(isIntervalCron("45 12 * * *")).toBe(false);
  });

  it("should parse interval correctly", () => {
    expect(parseCronInterval("*/2 * * * *")).toBe(2);
    expect(parseCronInterval("*/15 * * * *")).toBe(15);
  });

  it("should convert to 12-hour format", () => {
    expect(parseCronToTimeInIST("45 12 * * *")).toBe("6:15 PM");
    expect(parseCronToTimeInIST("0 0 * * *")).toBe("5:30 AM");
  });
});
```

### Integration Tests

```typescript
describe("Scheduler Integration", () => {
  it("should execute scheduler on schedule", async () => {
    // Mock time and wait for execution
    jest.useFakeTimers();

    const spy = jest.spyOn(scheduler, "handleUploads");

    // Advance time by 2 minutes
    jest.advanceTimersByTime(2 * 60 * 1000);

    expect(spy).toHaveBeenCalled();
  });
});
```

## Troubleshooting

### Common Issues

#### 1. Scheduler Not Running

**Symptoms**: Status stays "idle", no execution logs

**Causes & Solutions**:

- **Handler not registered**: Check `onModuleInit` logs
- **Cron expression invalid**: Validate expression syntax
- **Scheduler disabled**: Check `is_enabled` flag in database
- **Service not restarted**: Restart scheduler-service

#### 2. Status Not Updating

**Symptoms**: Scheduler runs but status remains "idle"

**Causes & Solutions**:

- **Exception in handler**: Check error logs
- **Database connection issue**: Verify DB connectivity
- **Transaction not committed**: Check repository methods

**Fix**:

```typescript
// Ensure status update is not in try-catch that swallows errors
await this.cronConfigRepository.updateExecutionStatus(
  schedulerKey,
  "running",
  null,
  null
);
```

#### 3. Incorrect Time Display

**Symptoms**: UI shows wrong time or format

**Causes & Solutions**:

- **Timezone mismatch**: Verify UTC to IST conversion (+5:30)
- **12-hour format error**: Check AM/PM calculation
- **Browser timezone**: Ensure using IST not local time

**Verify Conversion**:

```typescript
// UTC: 12:45 (cron: 45 12 * * *)
// IST: 12:45 + 5:30 = 18:15 = 6:15 PM ✓

parseCronToTimeInIST("45 12 * * *"); // Should return "6:15 PM"
```

#### 4. Duplicate Executions

**Symptoms**: Handler called multiple times simultaneously

**Causes & Solutions**:

- **Multiple instances**: Check if service deployed multiple times
- **Cron not stopped**: Ensure old jobs removed before adding new
- **Race condition**: Add locking mechanism

**Prevention**:

```typescript
// Always remove before adding
this.removeCron(schedulerKey);
this.addDynamicCron(schedulerKey, expression, handler);
```

#### 5. Memory Leaks

**Symptoms**: Scheduler service memory grows over time

**Causes & Solutions**:

- **Unclosed connections**: Ensure DB connections closed
- **Event listeners**: Remove listeners when cron stops
- **Large data in memory**: Process in batches

### Logging Best Practices

```typescript
// Success log
this.logger.log({
  level: "info",
  message: buildLogMessage({
    traceId: this.traceIdService.traceId,
    status: "success",
    location: "YourScheduler",
    method: "yourMethod",
    messageData: {
      /* relevant data */
    },
  }),
});

// Error log
this.logger.error({
  level: "error",
  message: buildLogMessage({
    traceId: this.traceIdService.traceId,
    status: "failure",
    location: "YourScheduler",
    method: "yourMethod",
    messageData: error,
  }),
});
```

### Performance Optimization

```typescript
// 1. Use batch processing
const BATCH_SIZE = 100;
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await processBatch(batch);
}

// 2. Use database pagination
const { data, count } = await repository.findAndCount({
  skip: page * limit,
  take: limit,
});

// 3. Add execution duration tracking
const startTime = Date.now();
// ... execution
const duration = Date.now() - startTime;
await this.updateExecutionStatus(key, "success", null, duration);
```

---

## Appendix

### Cron Expression Reference

```
 ┌───────────── minute (0 - 59)
 │ ┌─────────── hour (0 - 23)
 │ │ ┌───────── day of month (1 - 31)
 │ │ │ ┌─────── month (1 - 12)
 │ │ │ │ ┌───── day of week (0 - 6) (Sunday = 0)
 │ │ │ │ │
 * * * * *
```

**Special Characters**:

- `*` - Any value
- `*/N` - Every N units
- `N-M` - Range
- `N,M` - List

**Examples**:

```
*/2 * * * *     - Every 2 minutes
0 */6 * * *     - Every 6 hours
0 9 * * 1       - Every Monday at 9 AM
0 0 1 * *       - First day of every month
0 0 * * 0       - Every Sunday at midnight
```

### Time Zone Conversions

| UTC   | IST (+5:30)    | 12-Hour IST |
| ----- | -------------- | ----------- |
| 00:00 | 05:30          | 5:30 AM     |
| 06:00 | 11:30          | 11:30 AM    |
| 12:00 | 17:30          | 5:30 PM     |
| 18:00 | 23:30          | 11:30 PM    |
| 23:30 | 05:00 (+1 day) | 5:00 AM     |

### File Structure

```
new-insurance-wellness-hub/
├── apps/
│   ├── services/
│   │   └── scheduler-service/
│   │       └── src/
│   │           └── app/
│   │               ├── cron-configuration/
│   │               │   ├── cron-configuration.module.ts
│   │               │   ├── cron-configuration.controller.ts
│   │               │   ├── cron-configuration.service.ts
│   │               │   ├── cron-configuration.repository.ts
│   │               │   └── dynamic-cron.service.ts
│   │               └── scheduler/
│   │                   ├── opportunity-status.scheduler.ts
│   │                   ├── enrollment-upload.scheduler.ts
│   │                   └── service-tat.scheduler.ts
│   └── ui/
│       └── iwork/
│           └── src/
│               └── app/
│                   └── pages/
│                       └── CronJobsListing/
│                           ├── index.tsx
│                           ├── config.ts
│                           └── styles.ts
├── libs/
│   └── service-lib/
│       └── src/
│           └── lib/
│               ├── entities/
│               │   └── application-scheduler-configuration.entity.ts
│               └── constants.ts
├── scripts/
│   └── insert-enrollment-and-tat-schedulers.sql
└── docs/
    └── implementation/
        └── Dynamic-Cron-Scheduler-Configuration.md
```

## Support & Maintenance

### Monitoring Checklist

- [ ] All schedulers showing expected status
- [ ] No repeated failures for same scheduler
- [ ] Execution times within acceptable range
- [ ] Database table size not growing unbounded
- [ ] Error logs reviewed regularly

### Regular Maintenance

1. **Weekly**: Review failed executions and error logs
2. **Monthly**: Analyze performance metrics and optimize slow schedulers
3. **Quarterly**: Audit unused schedulers and clean up
4. **Yearly**: Review and update documentation

### Contact

- **Development Team**: Backend & Frontend Teams
- **Database**: DBA Team
- **DevOps**: Infrastructure Team

---

**Document Version**: 1.0  
**Last Updated**: January 19, 2026  
**Maintained By**: Development Team
