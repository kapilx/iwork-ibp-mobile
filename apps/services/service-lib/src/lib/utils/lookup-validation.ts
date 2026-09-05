import { BadRequestException } from "@nestjs/common";

import { Injectable } from "@nestjs/common";
import { DataSource, In } from "typeorm";
import { LookUp } from "../entities/look-up.entity";

@Injectable()
export class LookUpValidationService {
  private readonly dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  async getIdsForLookupValueKeys(lookupValueKeys: string[]): Promise<LookUp[]> {
    const lookUpRepository = this.dataSource.getRepository(LookUp);
    const lookups = await lookUpRepository.find({
      where: {
        lookUpValueKey: In(lookupValueKeys),
      },
    });
    return lookups;
  }

  async validateDynamicLookupValues(
    payload: Record<string, any>,
    lookupData: Record<string, string | string[]>
  ): Promise<void> {
    try {
      const extractIdsToValidate = (
        obj: Record<string, any>,
        lookupData: Record<string, string | string[]>,
        parentField = ""
      ): { id: number; key: string | string[]; field: string }[] => {
        const ids: { id: number; key: string | string[]; field: string }[] = [];

        for (const [field, value] of Object.entries(obj)) {
          if (Array.isArray(value)) {
            // Handle arrays by iterating through each element
            if (value.length > 0 && typeof value[0] !== "object") {
              // Array of primitives (e.g., number[])
              value.forEach((item) => {
                if (lookupData[field] !== undefined && item !== null) {
                  ids.push({
                    id: item,
                    key: lookupData[field],
                    field: `${parentField}${field}`,
                  });
                }
              });
            } else {
              // Array of objects
              value.forEach((item, index) => {
                ids.push(
                  ...extractIdsToValidate(
                    item,
                    lookupData,
                    `${parentField}${field}[${index}].`
                  )
                );
              });
            }
          } else if (typeof value === "object" && value !== null) {
            // Recursively handle nested objects
            ids.push(
              ...extractIdsToValidate(
                value,
                lookupData,
                `${parentField}${field}.`
              )
            );
          } else if (lookupData[field] !== undefined && value !== null) {
            // Add the field if it matches the lookupData
            ids.push({
              id: value,
              key: lookupData[field],
              field: `${parentField}${field}`,
            });
          }
        }

        return ids;
      };

      const idsToValidate = extractIdsToValidate(payload, lookupData);
      const lookupKeys = idsToValidate.flatMap(({ key }) =>
        Array.isArray(key) ? key : [key]
      );

      // Fetch all lookup values for the provided keys
      const lookUpRepository = this.dataSource.getRepository(LookUp);
      const lookups = await lookUpRepository.find({
        where: {
          lookUpName: In(lookupKeys),
        },
      });
      // Validate each ID against the lookup data
      for (const { id, key, field } of idsToValidate) {
        if (!id) {
          throw new BadRequestException(
            `The field corresponding to ${key} is required.`
          );
        }

        const validKeys = Array.isArray(key) ? key : [key];
        const matchingLookup = lookups.find(
          (lookup) => validKeys.includes(lookup.lookUpName) && lookup.id === id
        );

        if (!matchingLookup) {
          throw new BadRequestException(
            `The id ${id} does not match a valid lookup value for ${field}.`
          );
        }
      }
    } catch (error) {
      // If the error is a BadRequestException, rethrow it with the same message
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }

      // For other errors, throw a generic error
      throw new BadRequestException(
        "An unexpected error occurred during lookup validation."
      );
    }
  }
}
