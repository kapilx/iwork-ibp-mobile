import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { LocalizationRegulatoryFieldsCountryMap } from "../../../../service-lib/src/lib/entities/localization-regulatory-fields-country-map.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../../../../service-lib/src/lib/entities/user";
import { Organisation } from "../../../../service-lib/src/lib/entities/organisation.entity";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";

@Injectable()
export class LocalizationRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(LocalizationRegulatoryFieldsCountryMap)
    private readonly localizationRegulatoryFieldsCountryMap: Repository<LocalizationRegulatoryFieldsCountryMap>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(Organisation)
    private readonly organisationRepository: Repository<Organisation>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  async getUserLocalization(userId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "LocalizationRepository",
          method: "getUserLocalization",
          messageData: "method invoked",
        }),
      });
      // Validate userId
      if (!userId) {
        throw new Error("User ID is required.");
      }
      // Fetch the user along with their organization and organization's country
      const user = await this.userRepository.findOne({
        where: { userId: userId },
        relations: ["organisation", "organisation.country"],
      });

      if (!user) {
        throw new Error("User not found.");
      }

      if (!user.organisation || !user.organisation.country) {
        throw new Error("User organization or country not found.");
      }

      const countryName = user.organisation.country.name;

      const result = await this.localizationRegulatoryFieldsCountryMap
        .createQueryBuilder("map")
        .innerJoinAndSelect("map.country", "country")
        .innerJoinAndSelect("map.regulatoryField", "field")
        .where("LOWER(country.name) = LOWER(:countryName)", { countryName })
        .orderBy("country.name", "ASC")
        .addOrderBy("field.displayOrder", "ASC")
        .getMany();

      if (result.length === 0) {
        throw new Error("No localization data found for the user's country.");
      }

      const {
        id,
        name,
        description,
        isoCode,
        locale,
        currencyCode,
        currencyDisplayName,
        currencyFormat,
        numberFormat,
        dateFormat,
        phoneNumberFormat,
        faxFormat,
        mobileFormat,
        pincodeFormat,
        taxLabel
      } = result[0].country;

      const fields = result.map((entry) => ({
        fieldKey: entry.regulatoryField.fieldKey,
        fieldLabel: entry.fieldLabel || entry.regulatoryField.fieldKey,
        metaData: entry.metaData ?? entry.regulatoryField.metaData,
      }));

      return {
        id,
        name,
        description,
        isoCode,
        locale,
        currencyCode,
        currencyDisplayName,
        currencyFormat,
        numberFormat,
        dateFormat,
        phoneNumberFormat,
        faxFormat,
        mobileFormat,
        pincodeFormat,
        taxLabel,
        fields,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "LocalizationRepository",
          method: "getUserLocalization",
          messageData: error,
        }),
      });
      throw new Error(
        error.message ||
          "An unexpected error occurred while fetching user localization."
      );
    }
  }

  async getOrganizationLocalization(organisationId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "LocalizationRepository",
          method: "getOrganizationLocalization",
          payload: { organisationId },
          messageData: "method invoked",
        }),
      });
      // Validate organizationId
      if (!organisationId) {
        throw new Error("Organization ID is required.");
      }

      // Fetch the organization along with its country
      const organization = await this.organisationRepository.findOne({
        where: { id: organisationId },
        relations: ["country"],
      });

      if (!organization) {
        throw new Error("Organization not found.");
      }

      if (!organization.country) {
        throw new Error("Organization country not found.");
      }

      const countryName = organization.country.name;

      const result = await this.localizationRegulatoryFieldsCountryMap
        .createQueryBuilder("map")
        .innerJoinAndSelect("map.country", "country")
        .innerJoinAndSelect("map.regulatoryField", "field")
        .where("LOWER(country.name) = LOWER(:countryName)", { countryName })
        .orderBy("country.name", "ASC")
        .addOrderBy("field.displayOrder", "ASC")
        .getMany();

      if (result.length === 0) {
        throw new Error(
          "No localization data found for the organization's country."
        );
      }

      const {
        id,
        name,
        description,
        isoCode,
        locale,
        currencyCode,
        currencyDisplayName,
        currencyFormat,
        numberFormat,
        dateFormat,
        taxLabel,
      } = result[0].country;

      const fields = result.map((entry) => ({
        fieldKey: entry.regulatoryField.fieldKey,
        fieldLabel: entry.fieldLabel || entry.regulatoryField.fieldKey,
        metaData: entry.metaData ?? entry.regulatoryField.metaData,
      }));

      return {
        id,
        name,
        description,
        isoCode,
        locale,
        currencyCode,
        currencyDisplayName,
        currencyFormat,
        numberFormat,
        dateFormat,
        taxLabel,
        fields,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "LocalizationRepository",
          method: "getOrganizationLocalization",
          payload: { organisationId },
          messageData: error,
        }),
      });
      throw new Error(
        error.message ||
          "An unexpected error occurred while fetching organization localization."
      );
    }
  }
}
