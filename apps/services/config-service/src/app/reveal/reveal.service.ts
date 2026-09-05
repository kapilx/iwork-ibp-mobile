import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../service-lib/src/lib/entities/user';
import { Employee } from '../../../../service-lib/src/lib/entities/employee.entity';
import { ContactCommunicationDetails } from '../../../../service-lib/src/lib/entities/contact-communication-details.entity';
import { PolicyEnrollmentEmployee } from '../../../../service-lib/src/lib/entities/policy-enrollment-employee.entity';
import { PolicyEnrollmentDependent } from '../../../../service-lib/src/lib/entities/policy-enrollment-dependent.entity';
import { AuditHistoryService } from '../../../../service-lib/src/lib/audit-history/services/audit-history.service';
import {
  AuditHistoryAction,
  AuditHistoryLogType,
} from '../../../../service-lib/src/lib/audit-history/audit-history.constants';
import { MASKING_REGISTRY } from '../../../../service-lib/src/lib/field-masking/constants/masking-registry.constants';
import { RevealRequestDto } from './dto/reveal-request.dto';
import { RevealResponseDto } from './dto/reveal-response.dto';

@Injectable()
export class RevealService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(ContactCommunicationDetails)
    private readonly contactCommRepo: Repository<ContactCommunicationDetails>,
    @InjectRepository(PolicyEnrollmentEmployee)
    private readonly policyEnrollmentEmployeeRepo: Repository<PolicyEnrollmentEmployee>,
    @InjectRepository(PolicyEnrollmentDependent)
    private readonly policyEnrollmentDependentRepo: Repository<PolicyEnrollmentDependent>,
    private readonly auditHistoryService: AuditHistoryService,
  ) {}

  async reveal(
    dto: RevealRequestDto,
    currentUserId: string,
    ipAddress: string,
    userAgent: string,
    requestId: string,
  ): Promise<RevealResponseDto> {
    const { table, field, id } = dto;

    const tableConfig = MASKING_REGISTRY[table];
    if (!tableConfig) {
      throw new BadRequestException(`Unknown table: ${table}`);
    }

    if (!tableConfig.fields[field]) {
      throw new BadRequestException(
        `Field '${field}' is not a masked field in table '${table}'`,
      );
    }

    const pk = tableConfig._primaryKey;
    const record = await this.getRecord(table, pk, id);

    if (!record) {
      throw new NotFoundException(`Record not found: ${table}#${id}`);
    }

    const value = (record as any)[field];

    await this.auditHistoryService.createAuditLog({
      action: AuditHistoryAction.REVEALED,
      entityType: table,
      entityName: field,
      entityId: String(id),
      userId: currentUserId,
      ipAddress,
      userAgent,
      requestId,
      type: AuditHistoryLogType.TRACE,
    });

    return { field, value: value != null ? String(value) : '' };
  }

  private async getRecord(table: string, pk: string, id: number): Promise<unknown> {
    switch (table) {
      case 'users':
        return this.userRepo.findOne({ where: { [pk]: id } as any });
      case 'employee':
        return this.employeeRepo.findOne({ where: { [pk]: id } as any });
      case 'contact_communication':
        return this.contactCommRepo.findOne({ where: { [pk]: id } as any });
      case 'policy_enrollment_employee':
        return this.policyEnrollmentEmployeeRepo.findOne({ where: { [pk]: id } as any });
      case 'policy_enrollment_dependent':
        // The insured list includes soft-deleted dependents (uses withDeleted), so
        // reveal must also look them up regardless of deleted_at.
        return this.policyEnrollmentDependentRepo.findOne({ where: { [pk]: id } as any, withDeleted: true });
      default:
        throw new BadRequestException(`No repository registered for table: ${table}`);
    }
  }
}
