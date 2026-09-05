import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PolicyEnrollmentEmployee } from "../../../../service-lib/src/lib/entities/policy-enrollment-employee.entity";
import { UserRole } from "../../../../service-lib/src/lib/entities/user-role.entity";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { USER_STATUS_DELETED } from "../../../../../../libs/service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

export interface IbpEmployeeAuthResult {
  id: number;
  loginName: string | null;
  email: string | null;
  phoneNumber: string | null;
  employeeName: string;
  companyId: number;
  /** FK to users.id — used as JWT userId for downstream ibp-service compatibility */
  userId: number | null;
  password: string | null;
  ibpPassword: string | null;
  isPasswordSet: boolean;
  isPasswordHashed: boolean;
  passwordExpiresAt: Date | null;
  authVersion: number;
  userStatusKey: string;
  roles: Array<{ id: number; name: string; role_key: string }>;
}

@Injectable()
export class IbpEmployeeAuthRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(PolicyEnrollmentEmployee)
    private readonly ibpEmployeeRepository: Repository<PolicyEnrollmentEmployee>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
  }

  async findByPhoneAndCompany(
    phoneNumber: string,
    companyId: number
  ): Promise<IbpEmployeeAuthResult | null> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "IbpEmployeeAuthRepository",
        method: "findByPhoneAndCompany",
        payload: { companyId },
        messageData: "method invoked",
      }),
    });

    // Multiple rows per employee (one per policy enrollment) — get most recent
    const employee = await this.ibpEmployeeRepository.findOne({
      where: { phoneNumber, companyId },
      order: { id: "DESC" },
    });

    if (!employee) return null;
    return this.toAuthResult(employee);
  }

  async findByEmailAndCompany(
    email: string,
    companyId: number
  ): Promise<IbpEmployeeAuthResult | null> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "IbpEmployeeAuthRepository",
        method: "findByEmailAndCompany",
        payload: { companyId },
        messageData: "method invoked",
      }),
    });

    const employee = await this.ibpEmployeeRepository.findOne({
      where: { email, companyId },
      order: { id: "DESC" },
    });

    if (!employee) return null;
    return this.toAuthResult(employee);
  }

  async findByLoginNameAndCompany(
    loginName: string,
    companyId: number
  ): Promise<IbpEmployeeAuthResult | null> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "IbpEmployeeAuthRepository",
        method: "findByLoginNameAndCompany",
        payload: { companyId },
        messageData: "method invoked",
      }),
    });

    const employee = await this.ibpEmployeeRepository.findOne({
      where: { loginName, companyId },
      order: { id: "DESC" },
    });

    if (!employee) return null;
    return this.toAuthResult(employee);
  }

  async findByIdentifierAndCompany(
    identifier: string,
    companyId: number
  ): Promise<IbpEmployeeAuthResult | null> {
    // Try loginName → email → phone in order
    const employee = await this.ibpEmployeeRepository
      .createQueryBuilder("emp")
      .where("emp.companyId = :companyId", { companyId })
      .andWhere("emp.deletedAt IS NULL")
      .andWhere(
        "(emp.loginName = :id OR emp.email = :id OR emp.phoneNumber = :id)",
        { id: identifier.trim() }
      )
      .orderBy("emp.id", "DESC")
      .getOne();

    if (!employee) return null;
    return this.toAuthResult(employee);
  }

  async findById(id: number): Promise<IbpEmployeeAuthResult | null> {
    const employee = await this.ibpEmployeeRepository.findOne({ where: { id } });
    if (!employee) return null;
    return this.toAuthResult(employee);
  }

  private async toAuthResult(employee: PolicyEnrollmentEmployee): Promise<IbpEmployeeAuthResult> {
    const roleRows = await this.userRoleRepository.find({
      where: { ibpEmployeeId: employee.id },
      relations: ["role"],
    });

    const roles = roleRows
      .filter((ur) => ur.role)
      .map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        role_key: ur.role.roleKey,
      }));

    return {
      id: employee.id,
      loginName: employee.loginName ?? null,
      email: employee.email ?? null,
      phoneNumber: employee.phoneNumber ?? null,
      employeeName: employee.employeeName,
      companyId: employee.companyId!,
      userId: employee.userId ?? null,
      password: employee.password ?? null,
      ibpPassword: employee.ibpPassword ?? null,
      isPasswordSet: employee.isPasswordSet,
      isPasswordHashed: employee.isPasswordHashed,
      passwordExpiresAt: employee.passwordExpiresAt ?? null,
      authVersion: Number(employee.authVersion ?? 1),
      userStatusKey: employee.userStatusKey,
      roles,
    };
  }
}
