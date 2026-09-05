import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, ILike } from "typeorm";
import { Address } from "../../../../service-lib/src/lib/entities/address.entity";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";
import { AddressResponseDto } from "./dto/address-response.dto";
import { Region } from "../../../../service-lib/src/lib/entities/region.entity";
import { Country } from "../../../../service-lib/src/lib/entities/country.entity";
import { State } from "../../../../service-lib/src/lib/entities/state.entity";
import { City } from "../../../../service-lib/src/lib/entities/city.entity";
import { createErrorResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { statusCode } from "../../../../../../libs/service-lib/src/lib/enum";
import {
  DEFAULT_SORT_ORDER,
  DEFAULT_DESC_SORT_ORDER,
  DEFAULT_ASC_SORT_ORDER,
  DEFAULT_SORT_FIELD,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
@Injectable()
export class AddressRepository {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly dataSource: DataSource,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  private readonly logger: ReturnType<typeof createLogger>;

  /** Creates a new address in the database. */
  async createAddress(addressData: CreateAddressDto): Promise<Address> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const address = this.addressRepository.create(addressData);
      const savedAddress = await queryRunner.manager.save(Address, address);
      await queryRunner.commitTransaction();
      return savedAddress;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.internalServerError,
          errorMessages.addressQueryCreationFailed
        )
      );
    } finally {
      await queryRunner.release();
    }
  }

  /** Fetches paginated address details with optional search functionality. */
  async fetchAllAddressDetails(
    page: number,
    limit: number,
    search?: string,
    sort?: string
  ): Promise<{ data: Address[]; count: number }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const skip = (page - 1) * limit;

      // Build search condition if search term is provided
      const whereCondition = search
        ? [
            { address1: ILike(`%${search}%`) },
            { area: ILike(`%${search}%`) },
            { pinCode: ILike(`%${search}%`) },
          ]
        : {};

      // Build dynamic sorting condition
      let sortType: Record<string, "ASC" | "DESC"> = {};
      if (sort) {
        sort.split(",").forEach((sortParam) => {
          const [field, order] = sortParam.split(":");
          if (
            field &&
            (order === DEFAULT_ASC_SORT_ORDER ||
              order === DEFAULT_DESC_SORT_ORDER)
          ) {
            sortType[field] = order;
          }
        });
      } else {
        sortType = { [DEFAULT_SORT_FIELD]: DEFAULT_SORT_ORDER };
      }

      // Fetch data along with total count
      const [addresses, count] = await queryRunner.manager.findAndCount(
        Address,
        {
          skip,
          take: limit,
          where: whereCondition,
          relations: ["countryId", "stateId", "cityId"],
          order: sortType,
        }
      );

      await queryRunner.commitTransaction();
      return {
        data: addresses,
        count,
      };
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'AddressRepository',
          method: 'fetchAllAddressDetails',
          messageData: error,
        }),
      });
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.internalServerError,
          errorMessages.addressQueryFetchFailed
        )
      );
    } finally {
      await queryRunner.release();
    }
  }

  /** Retrieves the details of a specific address by its ID. */
  async getAddressDetails(id: number): Promise<Address> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const address = await queryRunner.manager.findOne(Address, {
        where: { id },
        relations: ["countryId", "stateId", "cityId"],
      });

      if (!address) {
        throw new NotFoundException(`Address with ID ${id} not found`);
      }

      await queryRunner.commitTransaction();
      return address;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'AddressRepository',
          method: 'getAddressDetails',
          messageData: error,
        }),
      });
      await queryRunner.rollbackTransaction();
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException(
            createErrorResponse(
              statusCode.internalServerError,
              errorMessages.addressQueryFetchFailed
            )
          );
    } finally {
      await queryRunner.release();
    }
  }

  /** Updates the details of an existing address. */
  async updateAddressDetails(
    addressId: number,
    updateAddress: UpdateAddressDto
  ): Promise<Address> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Ensure the entity exists in the database
      const existingAddress = await queryRunner.manager.findOne(Address, {
        where: { id: addressId },
      });
      if (!existingAddress) {
        throw new NotFoundException(`Address with ID ${addressId} not found`);
      }
      // Fetch related entities only if they exist in the payload
      const country = updateAddress.countryId
        ? await queryRunner.manager.findOne(Country, {
            where: { id: updateAddress.countryId },
          })
        : existingAddress.countryId;

      const state = updateAddress.stateId
        ? await queryRunner.manager.findOne(State, {
            where: { id: updateAddress.stateId },
          })
        : existingAddress.stateId;

      const city = updateAddress.cityId
        ? await queryRunner.manager.findOne(City, {
            where: { id: updateAddress.cityId },
          })
        : existingAddress.cityId;

      // Merge existing address with updated data
      Object.assign(existingAddress, updateAddress, {
        countryId: country, // Use fetched or existing reference
        stateId: state,
        cityId: city,
      });

      // Save the updated entity
      const updatedAddress = await queryRunner.manager.save(
        Address,
        existingAddress
      );
      await queryRunner.commitTransaction();
      return updatedAddress;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException(
            createErrorResponse(
              statusCode.internalServerError,
              errorMessages.addressQueryUpdationFailed
            )
          );
    } finally {
      await queryRunner.release();
    }
  }

  /** Removes an address from the database. */
  async removeAddressDetails(address: AddressResponseDto): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const addressData = await this.getAddressDetails(address.id);
      await queryRunner.manager.remove(addressData);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.internalServerError,
          errorMessages.addressQueryDeletionFailed
        )
      );
    } finally {
      await queryRunner.release();
    }
  }

  /** Retrieves all the region details */
  async findAllRegions(): Promise<Region[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      return await queryRunner.manager.find(Region);
    } catch (error) {
      throw new Error(errorMessages.regionQueryFetchFailed);
    } finally {
      await queryRunner.release();
    }
  }
  /** Retrieves the countries details by region id */
  async findCountries(regionId?: number): Promise<Country[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      const query = queryRunner.manager.createQueryBuilder(Country, "country");
      if (regionId) {
        query.where("country.region_id = :regionId", { regionId });
      }
      return await query.getMany();
    } catch (error) {
      throw new Error(errorMessages.countryQueryFetchFailed);
    } finally {
      await queryRunner.release();
    }
  }
  /** Retrieves all the countries details */
  async fetchAllCountries(): Promise<Country[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      return await queryRunner.manager.find(Country);
    } catch (error) {
      throw new Error(errorMessages.countryQueryFetchFailed);
    } finally {
      await queryRunner.release();
    }
  }
  /** Retrieves the state details by country id */
  async findStates(countryId?: number): Promise<State[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      const query = queryRunner.manager.createQueryBuilder(State, "state");
      if (countryId) {
        query.where("state.country_id = :countryId", { countryId });
      }
      return await query.getMany();
    } catch (error) {
      throw new Error(errorMessages.stateQueryFetchFailed);
    } finally {
      await queryRunner.release();
    }
  }
  /** Retrieves the city details by state id */
  async findCities(stateId?: number, search?: string): Promise<City[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    try {
      const query = queryRunner.manager.createQueryBuilder(City, "city");
      if (stateId) {
        query.where("city.state_id = :stateId", { stateId });
      }
      if (search) {
        query.andWhere("LOWER(city.name) LIKE LOWER(:search)", { search: `%${search}%` });
      }
      return await query.getMany();
    } catch (error) {
      throw new Error(errorMessages.cityQueryFetchFailed);
    } finally {
      await queryRunner.release();
    }
  }
}
