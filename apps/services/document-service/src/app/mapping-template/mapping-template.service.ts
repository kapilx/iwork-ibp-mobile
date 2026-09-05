import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { MappingTemplateVersion } from "../../../../service-lib/src/lib/entities/mapping-template-version.entity";
import { MappingTemplateColumn } from "../../../../service-lib/src/lib/entities/mapping-template-column.entity";
import {
  SaveMappingTemplateDto,
  ColumnMappingDto,
} from "./dto/save-mapping-template.dto";
import { SaveMappingTemplateResponseDto } from "./dto/save-mapping-template-response.dto";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { UPLOAD_CLAIM_ENTITY_NAME } from "../../../../../../libs/service-lib/src/lib/constants";

@Injectable()
export class MappingTemplateService {
  private readonly logger = new Logger(MappingTemplateService.name);

  constructor(private readonly dataSource: DataSource) {}

  async saveMappingTemplate(
    dto: SaveMappingTemplateDto,
    userId: number,
  ): Promise<SaveMappingTemplateResponseDto> {
    // Validate for duplicate target columns in the payload
    this.validateDuplicateTargetColumns(dto.mappings);
    const isUploadClaim = dto.entity_name === UPLOAD_CLAIM_ENTITY_NAME;
    const entityId = isUploadClaim ? dto.entity_id ?? dto.company_id : null;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      if (isUploadClaim) {
        await queryRunner.manager.update(
          MappingTemplateVersion,
          {
            companyId: dto.company_id,
            entityName: dto.entity_name,
            entityId: null,
          },
          {
            entityId: dto.company_id,
            updatedBy: userId,
          },
        );
      }

      // Step 1: Determine new template version number
      const newVersionNo = await this.getNextVersionNumber(
        dto.company_id,
        dto.entity_name,
        dto.file_direction,
        queryRunner,
      );

      // Step 2: Deactivate existing active version
      this.logger.log(
        `Deactivating existing mapping template for entity ${dto.entity_name} ` +
          `companyId=${dto.company_id} entityId=${entityId ?? "null"}`,
      );
      await queryRunner.manager.update(
        MappingTemplateVersion,
        this.buildTemplateScope({
          companyId: dto.company_id,
          entityId: isUploadClaim ? entityId : null,
          entityName: dto.entity_name,
          fileDirection: dto.file_direction,
          isActive: true,
        }),
        {
          isActive: false,
          updatedBy: userId,
        },
      );

      // Step 3: Insert new mapping template version
      const newTemplateVersion = queryRunner.manager.create(
        MappingTemplateVersion,
        {
          companyId: dto.company_id,
          entityId,
          entityName: dto.entity_name,
          fileDirection: dto.file_direction,
          templateVersionNo: newVersionNo,
          isActive: true,
          changeNote: dto.change_note,
          createdBy: userId,
          updatedBy: userId,
          ...(isUploadClaim ? { entityId } : {}),
        },
      );

      const savedTemplateVersion = (await queryRunner.manager.save(
        MappingTemplateVersion,
        newTemplateVersion,
      )) as MappingTemplateVersion;
      this.logger.log(
        `Mapping template version saved: id=${savedTemplateVersion.id}, ` +
          `version=${newVersionNo}, entity=${dto.entity_name}, ` +
          `companyId=${dto.company_id}, entityId=${entityId ?? "null"}`,
      );

      // Step 4: Insert column mappings
      const columnMappings = dto.mappings.map((mapping) =>
        queryRunner.manager.create(MappingTemplateColumn, {
          mappingTemplateVersionId: savedTemplateVersion.id,
          sourceColumnId: mapping.source_column_id,
          sourceColumnName: mapping.source_column_name,
          targetTableName: mapping.target_table_name,
          targetColumnName: mapping.target_column_name,
          transformationConfig: mapping.transformation_config,
          createdBy: userId,
          updatedBy: userId,
        }),
      );

      await queryRunner.manager.save(MappingTemplateColumn, columnMappings);

      // Step 5: Commit transaction
      await queryRunner.commitTransaction();

      this.logger.log(
        `Mapping template saved successfully: version ${newVersionNo}, ID ${savedTemplateVersion.id}`,
      );

      return new SaveMappingTemplateResponseDto(
        savedTemplateVersion.id,
        newVersionNo,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error("Failed to save mapping template", error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        errorMessages.failedToSaveMappingTemplate,
      );
    } finally {
      await queryRunner.release();
    }
  }

  private async getNextVersionNumber(
    companyId: number,
    entityName: string,
    fileDirection: string,
    queryRunner: any,
  ): Promise<number> {
    const result = await queryRunner.manager
      .createQueryBuilder(MappingTemplateVersion, "mtv")
      .select("COALESCE(MAX(mtv.templateVersionNo), 0)", "maxVersion")
      .where("mtv.companyId = :companyId", { companyId })
      .andWhere("mtv.entityName = :entityName", { entityName })
      .andWhere("mtv.fileDirection = :fileDirection", { fileDirection })
      .getRawOne();
    return (result?.maxVersion || 0) + 1;
  }

  private validateDuplicateTargetColumns(mappings: ColumnMappingDto[]): void {
    const targetColumnSet = new Set<string>();

    for (const mapping of mappings) {
      const key = `${mapping.target_table_name}.${mapping.target_column_name}`;

      if (targetColumnSet.has(key)) {
        throw new BadRequestException(
          errorMessages.duplicateTargetColumn(
            mapping.target_table_name,
            mapping.target_column_name,
          ),
        );
      }

      targetColumnSet.add(key);
    }
  }

  async getMappingTemplate(
    companyId: number,
    entityName: string,
    fileDirection: string = "INBOUND",
    status?: string,
    entityId?: number,
  ): Promise<any[]> {
    this.logger.log(
      `Fetching mapping template(s) for company: ${companyId}, entity: ${entityName}, status: ${
        status || "ACTIVE"
      }`,
    );

    const repository = this.dataSource.getRepository(MappingTemplateVersion);
    const whereClause: any = this.buildTemplateScope({
      companyId,
      entityId:
        entityName === UPLOAD_CLAIM_ENTITY_NAME ? entityId ?? companyId : null,
      entityName,
      fileDirection,
    });

    if (status !== "ALL") {
      whereClause.isActive = true;
    }

    const versions = await repository.find({
      where: whereClause,
      relations: ["columns"],
      order: {
        templateVersionNo: "DESC",
      },
    });

    if (!versions || versions.length === 0) {
      return [];
    }

    return versions.map((version) => ({
      id: version.id,
      company_id: version.companyId,
      entity_name: version.entityName,
      file_direction: version.fileDirection,
      template_version_no: version.templateVersionNo,
      change_note: version.changeNote,
      mappings:
        version.columns?.map((col) => ({
          source_column_id: col.sourceColumnId,
          source_column_name: col.sourceColumnName,
          target_table_name: col.targetTableName,
          target_column_name: col.targetColumnName,
          transformation_config: col.transformationConfig,
        })) || [],
      createdAt: version.createdAt,
      status: version.isActive ? "ACTIVE" : "INACTIVE",
    }));
  }

  async deleteMappingTemplate(id: number, userId: number): Promise<void> {
    this.logger.log(
      `Deleting mapping template version ID: ${id} by user: ${userId}`,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get the template to be deleted to know its details
      const templateToDelete = await queryRunner.manager.findOne(
        MappingTemplateVersion,
        {
          where: { id },
        },
      );

      if (!templateToDelete) {
        this.logger.warn(`Mapping template version ID ${id} not found`);
        return;
      }

      // 2. Soft delete the current template
      await queryRunner.manager.update(
        MappingTemplateVersion,
        { id },
        {
          isActive: false,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      );

      // 3. Find the previous version (highest version number less than current)
      const scopeColumn =
        templateToDelete.entityName === UPLOAD_CLAIM_ENTITY_NAME &&
        templateToDelete.entityId !== null &&
        templateToDelete.entityId !== undefined
          ? "mtv.entityId"
          : "mtv.companyId";
      const scopeValue =
        templateToDelete.entityName === UPLOAD_CLAIM_ENTITY_NAME &&
        templateToDelete.entityId !== null &&
        templateToDelete.entityId !== undefined
          ? templateToDelete.entityId
          : templateToDelete.companyId;
      const correctPreviousVersion = await queryRunner.manager
        .createQueryBuilder(MappingTemplateVersion, "mtv")
        .where(`${scopeColumn} = :scopeValue`, { scopeValue })
        .andWhere("mtv.entityName = :entityName", {
          entityName: templateToDelete.entityName,
        })
        .andWhere("mtv.fileDirection = :fileDirection", {
          fileDirection: templateToDelete.fileDirection,
        })
        .andWhere("mtv.templateVersionNo < :currentVersion", {
          currentVersion: templateToDelete.templateVersionNo,
        })
        .orderBy("mtv.templateVersionNo", "DESC")
        .getOne();

      if (correctPreviousVersion) {
        this.logger.log(
          `Rolling back to version ${correctPreviousVersion.templateVersionNo} (ID: ${correctPreviousVersion.id})`,
        );
        await queryRunner.manager.update(
          MappingTemplateVersion,
          { id: correctPreviousVersion.id },
          {
            isActive: true,
            updatedBy: userId,
            updatedAt: new Date(),
          },
        );
      } else {
        this.logger.log(`No previous version found to rollback to.`);
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error deleting mapping template ID ${id}`, error);
      throw new InternalServerErrorException(
        errorMessages.failedToDeleteMappingTemplate,
      );
    } finally {
      await queryRunner.release();
    }
  }

  private buildTemplateScope(params: {
    companyId: number;
    entityId: number | null;
    entityName: string;
    fileDirection: string;
    isActive?: boolean;
  }): Record<string, number | string | boolean | null> {
    const base = {
      entityName: params.entityName,
      fileDirection: params.fileDirection,
    } as Record<string, number | string | boolean | null>;
    if (
      params.entityName === UPLOAD_CLAIM_ENTITY_NAME &&
      params.entityId !== null
    ) {
      base.entityId = params.entityId;
    } else {
      base.companyId = params.companyId;
    }
    if (params.isActive !== undefined) {
      base.isActive = params.isActive;
    }
    return base;
  }

  async restoreMappingTemplate(id: number, userId: number): Promise<void> {
    this.logger.log(
      `Restoring mapping template version ID: ${id} by user: ${userId}`,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Get the template to be restored
      const templateToRestore = await queryRunner.manager.findOne(
        MappingTemplateVersion,
        {
          where: { id },
        },
      );

      if (!templateToRestore) {
        this.logger.warn(`Mapping template version ID ${id} not found`);
        throw new BadRequestException("Template version not found");
      }

      // 2. Deactivate all versions for this company/entity/direction
      await queryRunner.manager.update(
        MappingTemplateVersion,
        {
          companyId: templateToRestore.companyId,
          entityName: templateToRestore.entityName,
          fileDirection: templateToRestore.fileDirection,
          isActive: true,
        },
        {
          isActive: false,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      );

      // 3. Activate the target version
      await queryRunner.manager.update(
        MappingTemplateVersion,
        { id },
        {
          isActive: true,
          updatedBy: userId,
          updatedAt: new Date(),
        },
      );

      await queryRunner.commitTransaction();
      this.logger.log(
        `Template version ${templateToRestore.templateVersionNo} restored successfully.`,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error restoring mapping template ID ${id}`, error);
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        "Failed to restore mapping template",
      );
    } finally {
      await queryRunner.release();
    }
  }
}
