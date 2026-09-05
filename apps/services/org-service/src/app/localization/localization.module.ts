import { Module } from '@nestjs/common';
import { InsuranceWellnessHubServiceLibModule } from '../../../../service-lib/src/lib/service-lib.module';
import { LocalizationService } from './localization.service';
import { LocalizationController } from './localization.controller';
import { LocalizationRepository } from './localization.repository';
import { TypeOrmModule } from "@nestjs/typeorm";
import { LocalizationRegulatoryFieldsCountryMap } from '../../../../service-lib/src/lib/entities/localization-regulatory-fields-country-map.entity';
import { LocalizationCompanyRegulatoryFields } from '../../../../service-lib/src/lib/entities/localization-company-regulatory-field.entity';
import { LocalizationCountry } from '../../../../service-lib/src/lib/entities/localization-country.entity';
import { User } from '../../../../service-lib/src/lib/entities/user';
import { Organisation } from '../../../../service-lib/src/lib/entities/organisation.entity';

@Module({
  controllers: [LocalizationController],
  providers: [LocalizationService, LocalizationRepository],
  imports: [
    TypeOrmModule.forFeature([
        LocalizationRegulatoryFieldsCountryMap,
        LocalizationCompanyRegulatoryFields,
        LocalizationCountry,
        User,
        Organisation
    ]),
    LocalizationModule,
    InsuranceWellnessHubServiceLibModule],
  exports: [LocalizationService, LocalizationRepository],
})
export class LocalizationModule {}
