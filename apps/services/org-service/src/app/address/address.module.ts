import { Module } from "@nestjs/common";
import { InsuranceWellnessHubServiceLibModule } from "../../../../service-lib/src/lib/service-lib.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AddressController } from "./address.controller";
import { AddressService } from "./address.service";
import { Address } from "../../../../service-lib/src/lib/entities/address.entity";
import { Region } from "../../../../service-lib/src/lib/entities/region.entity";
import { Country } from "../../../../service-lib/src/lib/entities/country.entity";
import { City } from "../../../../service-lib/src/lib/entities/city.entity";
import { State } from "../../../../service-lib/src/lib/entities/state.entity";
import { JwtModule } from "@nestjs/jwt";
import { AddressRepository } from "./address.repository";

/**
 * Module for managing addresss.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Address, Region, Country, City, State]),
    JwtModule,
    InsuranceWellnessHubServiceLibModule,
  ],
  controllers: [AddressController],
  providers: [AddressService, AddressRepository], // Add repositories
  exports: [AddressService], // Export AddressService so it can be used in other modules
})
export class AddressModule {}
