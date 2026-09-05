import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  DataSource,
  EntityManager,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import { EMPLOYEE_STATUS_ACTIVE } from "../../../../../../libs/service-lib/src/lib/constants";
import {
  errorMessages,
  infoMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import {
  announcementSearchObject,
  serviceNames,
} from "../../../../service-lib/src/lib/constants";
import {
  Announcement,
  Employee,
  LookUp,
  User,
} from "../../../../service-lib/src/lib/entities";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  CreateAnnouncementDto,
  EmployeeCelebrationDto,
} from "./dto/dashboard.dto";

@Injectable()
export class DashboardRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(Announcement)
    private readonly announcementRepository: Repository<Announcement>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    private readonly dataSource: DataSource,
    private readonly entityService: EntityService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  async createAnnouncement(
    announcementData: CreateAnnouncementDto,
    entityManager: EntityManager
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "DashboardRepository",
          method: "createAnnouncement",
          messageData: "method invoked",
        }),
      });
      const announcement = entityManager.create(Announcement, announcementData);
      return await entityManager.save(Announcement, announcement);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "DashboardRepository",
          method: "createAnnouncement",
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create announcement: ${error.message}`
      );
    }
  }

  async updateAnnouncement(
    id: number,
    announcementData: CreateAnnouncementDto,
    entityManager: EntityManager
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "DashboardRepository",
          method: "updateAnnouncement",
          messageData: "method invoked",
        }),
      });
      const announcement = await entityManager.findOne(Announcement, {
        where: { id },
      });
      if (!announcement) {
        throw new NotFoundException(
          errorMessages.announcementNotFoundWithId(id)
        );
      }
      await entityManager.update(Announcement, id, announcementData);
      return { id: id };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "DashboardRepository",
          method: "updateAnnouncement",
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update announcement: ${error.message}`
      );
    }
  }

  async getAnnouncementById(id: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "DashboardRepository",
          method: "getAnnouncementById",
          payload: { id },
          messageData: "method invoked",
        }),
      });
      const announcement = await this.announcementRepository.findOne({
        where: { id },
        relations: ["organisation", "organisation.country"],
      });
      if (!announcement) {
        throw new NotFoundException(
          errorMessages.announcementNotFoundWithId(id)
        );
      }
      return await this.transformAnnouncementResponse([{ ...announcement }]);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "DashboardRepository",
          method: "getAnnouncementById",
          payload: { id },
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to retrieve announcement: ${error.message}`
      );
    }
  }

  async getAnnouncements(
    userId: number,
    page: number,
    limit: number,
    searchArray: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    sort: { field: string; order: "ASC" | "DESC" }[],
    searchBy: string
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "DashboardRepository",
          method: "getAnnouncements",
          payload: { userId, page, limit, searchArray, sort, searchBy },
          messageData: "method invoked",
        }),
      });
      const userDetails = await this.dataSource
        .getRepository(User)
        .findOne({ where: { userId } });
      if (!userDetails) {
        throw new NotFoundException(infoMessages.userNotFoundWithId(userId));
      }
      const { data, count } = await this.entityService.fetchEntityList(
        Announcement,
        page,
        limit,
        sort.length > 0 ? sort : [{ field: "expiryDate", order: "ASC" }],
        undefined,
        {
          organisationId: userDetails.organisationId,
          expiryDate: MoreThanOrEqual(new Date()),
        },
        ["id", "title", "description", "expiryDate"],
        searchArray.length === 0 ? [] : searchArray,
        undefined,
        searchBy,
        announcementSearchObject
      );
      if (!data || data.length === 0) {
        return { data: [], count: 0 };
      }
      return {
        data: await this.transformAnnouncementResponse(data),
        count,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "DashboardRepository",
          method: "getAnnouncements",
          payload: { userId },
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to retrieve announcements: ${error.message}`
      );
    }
  }

  async getTeamCelebrations(userId: number, page: number, limit: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "DashboardRepository",
          method: "getTeamCelebrations",
          payload: { userId },
          messageData: "method invoked",
        }),
      });
      const employee = await this.employeeRepository.findOne({
        where: { userId },
        select: ["organisationId"],
      });
      if (!employee) {
        throw new NotFoundException(`Employee with userId ${userId} not found`);
      }
      const from: Date = new Date();
      const to: Date = new Date();
      to.setDate(from.getDate() + 7);
      // Build MM-DD list for the range
      const mmddList: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(from);
        d.setDate(from.getDate() + i);
        const mmdd = `${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;
        mmddList.push(mmdd);
      }
      const statusLid = (
        await this.lookUpRepository.findOne({
          where: { lookUpKey: EMPLOYEE_STATUS_ACTIVE },
        })
      )?.id;
      const employees: Employee[] = await this.employeeRepository
        .createQueryBuilder("employee")
        .where("employee.organisation_id = :organisationId", {
          organisationId: employee.organisationId,
        })
        .andWhere("employee.status_lid = :statusLid", { statusLid })
        .andWhere(
          `(TO_CHAR(employee.date_of_birth, 'MM-DD') IN (:...mmddList) OR TO_CHAR(employee.date_of_joining, 'MM-DD') IN (:...mmddList))`,
          { mmddList }
        )
        .select([
          "employee.iirmEmpId",
          "employee.userId",
          "employee.firstName",
          "employee.lastName",
          "employee.emailId",
          "employee.dateOfBirth",
          "employee.dateOfJoining",
          "employee.profileUrl",
        ])
        .getMany();

      const celebrationList: EmployeeCelebrationDto[] = [];

      employees.forEach((emp) => {
        // Birthday check
        if (emp.dateOfBirth) {
          const dobDate = new Date(emp.dateOfBirth);
          const dobMMDD = `${String(dobDate.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(dobDate.getDate()).padStart(2, "0")}`;
          if (mmddList.includes(dobMMDD)) {
            celebrationList.push({
              employeeId: emp.iirmEmpId,
              userId: emp.userId,
              fullName: `${emp.firstName} ${emp.lastName}`,
              emailId: emp.emailId,
              celebrationType: "BIRTHDAY",
              celebrationDate: `${from.getFullYear()}-${dobMMDD}`,
              profileUrl: emp.profileUrl,
            });
          }
        }
        // Work anniversary check
        if (emp.dateOfJoining) {
          const dojDate = new Date(emp.dateOfJoining);
          const dojMMDD = `${String(dojDate.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(dojDate.getDate()).padStart(2, "0")}`;
          if (mmddList.includes(dojMMDD)) {
            celebrationList.push({
              employeeId: emp.iirmEmpId,
              userId: emp.userId,
              fullName: `${emp.firstName} ${emp.lastName}`,
              emailId: emp.emailId,
              celebrationType: "WORK_ANNIVERSARY",
              celebrationDate: `${from.getFullYear()}-${dojMMDD}`,
              profileUrl: emp.profileUrl,
            });
          }
        }
      });
      celebrationList.sort((a, b) => {
        if (a.celebrationDate && b.celebrationDate) {
          return (
            new Date(a.celebrationDate).getTime() -
            new Date(b.celebrationDate).getTime()
          );
        }
        return 0;
      });
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedCelebrations = celebrationList.slice(startIndex, endIndex);
      return { data: paginatedCelebrations, count: celebrationList.length };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "DashboardRepository",
          method: "getTeamCelebrations",
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch team celebrations: ${error.message}`
      );
    }
  }

  async deleteAnnouncement(id: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "DashboardRepository",
          method: "deleteAnnouncement",
          payload: { id },
          messageData: "method invoked",
        }),
      });
      const announcement = await this.announcementRepository.findOne({
        where: { id },
      });
      if (!announcement) {
        throw new NotFoundException(
          errorMessages.announcementNotFoundWithId(id)
        );
      }
      const result = await this.announcementRepository.softDelete(id);
      if (result.affected === 0) {
        throw new BadRequestException(
          `Failed to soft delete announcement with ID ${id}`
        );
      }
      return {
        message: `Announcement with ID ${id} soft deleted successfully`,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "DashboardRepository",
          method: "deleteAnnouncement",
          payload: { id },
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to delete announcement: ${error.message}`
      );
    }
  }

  // Transform announcement response to match the required format
  async transformAnnouncementResponse(announcements: Announcement[]) {
    try {
      return announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        description: announcement.description,
        expiryDate: announcement.expiryDate,
        organisation: announcement.organisation
          ? {
              id: announcement.organisation.id,
              name: announcement.organisation.name,
              country: announcement.organisation.country
                ? {
                    id: announcement.organisation.country.id,
                    name: announcement.organisation.country.name,
                  }
                : null,
            }
          : undefined,
      }));
    } catch (error) {
      throw new BadRequestException(
        `Failed to transform announcement response: ${error.message}`
      );
    }
  }
}
