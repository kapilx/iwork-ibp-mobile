import { Module } from "@nestjs/common";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { FileUploadController } from "./file-upload.controller";
import { FileUploadService } from "./file-upload.service";
import { FileUploadRepository } from "./file-upload.repository";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FileUpload } from "../../../../service-lib/src/lib/entities/file-upload.entity";
import { JwtModule } from "@nestjs/jwt";
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import { ArchivedFileUpload } from "./../../../../service-lib/src/lib/entities/archived-file-upload.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([FileUpload, Company, ArchivedFileUpload]),
    JwtModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService, FileUploadRepository],
})
export class FileUploadModule {}
