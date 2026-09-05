import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { resolve } from "path";
import { User } from "../../../../../apps/services/auth-service/src/app/simple-auth/entities/user";
import { TPA } from "../../../../../apps/services/org-service/src/app/tpa/entities/tpa.entity";
import { TPAAddress } from "../../../../../apps/services/org-service/src/app/tpa/entities/tpa-address.entity";
import { InsurerCompany } from "../../../../../apps/services/org-service/src/app/insurer/entities/insurer-company.entity";
import { InsurerCompanyAddress } from "../../../../../apps/services/org-service/src/app/insurer/entities/insurer-company-address.entity";
import { Employee } from "../../../../../apps/services/org-service/src/app/employee/entities/employee.entity";
import { Company } from "../../../../../apps/services/org-service/src/app/company/entities/company.entity";
import { Contact } from "../../../../../apps/services/org-service/src/app/contact/entities/contact.entity";
import { ContactAddress } from "../../../../../apps/services/org-service/src/app/contact/entities/contact-address.entity";
import { CompanyContact } from "../../../../../apps/services/org-service/src/app/contact/entities/company-contact.entity";
import { Address } from "../../../../../apps/services/org-service/src/app/address/entities/address.entity";
import { Region } from "../../../../../apps/services/org-service/src/app/address/entities/region.entity";
import { City } from "../../../../../apps/services/org-service/src/app/address/entities/city.entity";
import { State } from "../../../../../apps/services/org-service/src/app/address/entities/state.entity";
import { Country } from "../../../../../apps/services/org-service/src/app/address/entities/country.entity";
import { CompanyAddress } from "../../../../../apps/services/org-service/src/app/company/entities/company.address.entity";
import { CompanyDetail } from "../../../../../apps/services/org-service/src/app/company/entities/company-detail.entity";
import { LookUp } from "../../../../../apps/services/org-service/src/app/look-up/entities/look-up.entity";
import { Organisation } from "../../../../../apps/services/org-service/src/app/master/entities/organisation.entity";
import { OrgDesignation } from "../../../../../apps/services/service-lib/src/lib/entities/org-designation.entity";
import { IndustrySegment } from "../../../../../apps/services/org-service/src/app/master/entities/industry-segment.entity";
import { OrgDepartment } from "../../../../../apps/services/service-lib/src/lib/entities/org-department.entity";
import { OrgVertical } from "../../../../../apps/services/service-lib/src/lib/entities/org-vertical.entity";
import { OrgBranch } from "../../../../../apps/services/service-lib/src/lib/entities/org-branch.entity";
import { Role } from "../../../../../apps/services/auth-service/src/app/access-control-list/entities/roles.entity";
import { UserRole } from "../../../../../apps/services/auth-service/src/app/access-control-list/entities/user-role.entity";
import { ContactCommunicationDetails } from "../../../../../apps/services/org-service/src/app/contact/entities/contact-communication-details.entity";
import { FilePasswordConfig } from "../../../../../apps/services/org-service/src/app/file-password-config/file-password-config.entity";
import { ENV } from "../../../../../apps/services/service-lib/src/lib/environment";
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: "postgres",
  host: ENV.DB_HOST || "sonar.divami.com",
  port: ENV.DB_PORT ? parseInt(ENV.DB_PORT, 10) : 5432,
  username: ENV.DB_USER || "iirm",
  password: ENV.DB_PASSWORD || "3hz6YowfQT8nKeo",
  database: ENV.DB_NAME || "iirm",
  entities: [
    resolve(
      __dirname,
      "../../../../../apps/services/**/entities/*.entity{.ts,.js}"
    ),
    User,
    LookUp,
    Organisation,
    OrgDesignation,
    IndustrySegment,
    OrgDepartment,
    Contact,
    Address,
    Region,
    Country,
    City,
    State,
    TPA,
    TPAAddress,
    ContactAddress,
    CompanyContact,
    InsurerCompany,
    InsurerCompanyAddress,
    Employee,
    Company,
    CompanyAddress,
    CompanyDetail,
    OrgVertical,
    OrgBranch,
    Role,
    UserRole,
    ContactCommunicationDetails,
    FilePasswordConfig,
  ],
  synchronize: false,
};
