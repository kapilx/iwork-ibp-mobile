import { BadRequestException, Injectable } from "@nestjs/common";
import { DataSource, In } from "typeorm";
import { getEntityByName } from "./get-entity.utils";

@Injectable()
export class MasterValidationService {
  private readonly dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async validateMasterIds(
    payload: Record<string, any>,
    masterData: Record<string, string>
  ): Promise<void> {
    try {
      const extractIdsToValidate = (
        obj: Record<string, any>,
        masterData: Record<string, string>,
        parentField: string = ""
      ): { id: number; entity: string; field: string }[] => {
        const ids: { id: number; entity: string; field: string }[] = [];

        for (const [field, value] of Object.entries(obj)) {
          if (Array.isArray(value)) {
            // Handle arrays by iterating through each element
            value.forEach((item) => {
              ids.push(
                ...extractIdsToValidate(
                  item,
                  masterData,
                  `${parentField}${field}.`
                )
              );
            });
          } else if (typeof value === "object" && value !== null) {
            // Recursively handle nested objects
            ids.push(
              ...extractIdsToValidate(
                value,
                masterData,
                `${parentField}${field}.`
              )
            );
          } else if (masterData[field] !== undefined && value !== null) {
            // Add the field if it matches the masterData
            ids.push({
              id: value,
              entity: masterData[field],
              field: `${parentField}${field}`,
            });
          }
        }

        return ids;
      };

      const idsToValidate = extractIdsToValidate(payload, masterData);

      // Group IDs by entity for batch validation
      const groupedIds: Record<string, number[]> = {};
      idsToValidate.forEach(({ id, entity }) => {
        if (!groupedIds[entity]) {
          groupedIds[entity] = [];
        }
        groupedIds[entity].push(id);
      });

      // Validate IDs for each entity
      for (const [entityName, ids] of Object.entries(groupedIds)) {
        const entity = getEntityByName(entityName);
        const repository = this.dataSource.getRepository(entity);

        const primaryColumn =
          repository.metadata.primaryColumns[0]?.propertyName;

        if (!primaryColumn) {
          throw new BadRequestException(
            `Primary key column not found for the entity ${entityName}.`
          );
        }

        // Fetch all valid IDs from the master table
        const validIds = await repository.find({
          where: { [primaryColumn]: In(ids) },
          select: [primaryColumn],
        });

        const validIdSet = new Set(validIds.map((item) => item[primaryColumn]));
        // Check for invalid IDs
        ids.forEach((id) => {
          if (!validIdSet.has(id)) {
            const invalidField = idsToValidate.find(
              (item) => item.id === id
            )?.field;
            throw new BadRequestException(
              `Validation error: The value '${id}' for the field '${invalidField}' does not exist in the '${entityName}' entity.`
            );
          }
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}
