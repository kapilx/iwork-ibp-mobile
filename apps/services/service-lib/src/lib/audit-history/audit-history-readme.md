# Audit Logging System Documentation

## Overview

This audit logging system provides automatic, non-intrusive tracking of all database changes in your NestJS application. It captures INSERT, UPDATE, and DELETE operations on entities marked with the `@Auditable()` decorator.

## Features

- **Automatic Tracking**: No manual logging required in service methods
- **Selective Auditing**: Use decorators to include/exclude entities and fields
- **Detailed Change Tracking**: Captures field-level changes with before/after values
- **User Context**: Automatically captures authenticated user information
- **Extensible**: Easy to add additional metadata like IP address, request ID
- **Performance Optimized**: Uses database sequences and proper indexing
- **Type-Safe**: Full TypeScript support with DTOs and interfaces

## Database Migration

Create and run this migration to set up the audit tables:

```sql
-- Create audit_log table
CREATE TABLE audit_log (
    id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_name VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    user_id VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    request_id VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for audit_log
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- Create audit_log_detail table
CREATE TABLE audit_log_detail (
    id BIGSERIAL PRIMARY KEY,
    audit_log_id BIGINT NOT NULL REFERENCES audit_log(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    field_type VARCHAR(50) NOT NULL
);

-- Create index for audit_log_detail
CREATE INDEX idx_audit_log_detail_audit_log ON audit_log_detail(audit_log_id);
```

## Usage

### 1. Mark Entities as Auditable

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Auditable } from '@libs/audit';

@Entity()
@Auditable({ name: 'User' }) // Optional: provide custom display name
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  name: string;
}
```

### 2. Skip Sensitive Fields

```typescript
import { Auditable, SkipAudit } from '@libs/audit';

@Entity()
@Auditable()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  @SkipAudit() // This field won't be logged
  password: string;
}
```

### 3. Use Normal TypeORM Operations

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(data: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(data);
    return this.userRepository.save(user); // Automatically audited!
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    await this.userRepository.update(id, data); // Automatically audited!
    return this.userRepository.findOne({ where: { id } });
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (user) {
      await this.userRepository.remove(user); // Automatically audited!
    }
  }
}
```

### 4. Authentication Context

The system automatically captures the authenticated user from the request context. Ensure your authentication system sets the user in the request object:

```typescript
// The interceptor looks for these user properties in order:
request.user.id
request.user.sub
```

## Extending the System

### Adding Custom Metadata

You can extend the audit context with custom metadata:

```typescript
// In a custom interceptor
const auditContext: AuditContext = {
  userId: user.id,
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'],
  requestId: request.id,
  // Add custom fields
  tenantId: request.headers['x-tenant-id'],
  apiVersion: request.headers['x-api-version'],
};
```

### Custom Audit Logic

If you need custom audit logic for specific entities, you can extend the `AuditSubscriber`:

```typescript
@Injectable()
@EventSubscriber()
export class CustomAuditSubscriber extends AuditSubscriber {
  listenTo() {
    return SpecialEntity;
  }

  async afterUpdate(event: UpdateEvent<SpecialEntity>): Promise<void> {
    // Custom logic here
    await super.afterUpdate(event);
  }
}
```

## Performance Considerations

1. **Bulk Operations**: For bulk operations, consider temporarily disabling audit logging:

```typescript
// For bulk operations where audit logging might impact performance
const queryRunner = dataSource.createQueryRunner();
queryRunner.data.skipAudit = true; // Custom flag you can check in subscriber
```

## Security Considerations

1. **Access Control**: Implement proper access control for audit log endpoints
2. **Sensitive Data**: Use `@SkipAudit()` decorator for sensitive fields
3. **Data Retention**: Implement a data retention policy for audit logs
4. **Encryption**: Consider encrypting sensitive audit data at rest

## Troubleshooting

### Audit logs not being created

1. Ensure the entity is decorated with `@Auditable()`
2. Check that `AuditModule` is imported in your app module
3. Verify that the database tables exist
4. Check that the interceptor is properly registered

### User context not captured

1. Ensure your authentication system sets `request.user`
2. Check that the global interceptor is registered
3. Verify the user object has an `id` or `sub` property

### Performance issues

1. Check database indexes are properly created
2. Consider implementing pagination for large result sets
3. Use date range filters to limit query scope
4. Monitor slow queries using PostgreSQL's query analyzer

## Best Practices

1. **Selective Auditing**: Only audit entities that require tracking
2. **Skip Sensitive Fields**: Always use `@SkipAudit()` for passwords, tokens, etc.
3. **Regular Cleanup**: Implement a retention policy to clean old audit logs
4. **Monitoring**: Set up monitoring for audit table growth
5. **Testing**: Always test audit functionality when adding new entities
6. **Documentation**: Document which entities are audited in your API documentation

## Testing

The system includes comprehensive unit tests. Run them with:

```bash
nx test audit
```

For integration testing, ensure you have a test database configured and run:

```bash
nx test audit --testNamePattern="integration"
```
