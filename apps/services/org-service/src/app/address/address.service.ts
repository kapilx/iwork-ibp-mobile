import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from "@nestjs/common";
import { AddressRepository } from "./address.repository";
import { CreateAddressDto } from "./dto/create-address.dto";
import { AddressResponseDto } from "./dto/address-response.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";
import { AddressResponseFetchDto } from "./dto/address-response-fetch.dto";
import { plainToInstance } from "class-transformer";
import { createErrorResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { statusCode } from "../../../../../../libs/service-lib/src/lib/enum";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { serviceNames } from "../../../../service-lib/src/lib/constants";

/**
 * Service for managing addresses.
 */
@Injectable()
export class AddressService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    /**
     * Repository service for address operations.
     */
    private readonly addressRepository: AddressRepository,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /** Creates a new address. */
  async addAddress(
    createAddress: CreateAddressDto,
    userId: number
  ): Promise<AddressResponseDto> {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'success',
          location: 'AddressService',
          method: 'addAddress',
          payload: createAddress,
          messageData: 'method invoked',
        }),
      });
      createAddress.createdBy = userId;
      createAddress.updatedBy = userId;
      createAddress.createdAt = new Date();
      createAddress.updatedAt = new Date();
      const address = await this.addressRepository.createAddress(createAddress);
      return plainToInstance(AddressResponseDto, address, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'AddressService',
          method: 'addAddress',
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.internalServerError,
          errorMessages.addressCreationFailed
        )
      );
    }
  }

  /** Retrieves all addresses.*/
  async getAddressList(
    page: number,
    limit: number,
    search?: string,
    sort?: string
  ): Promise<{ data: AddressResponseFetchDto[]; count: number }> {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'AddressService',
          method: 'getAddressList',
          payload: { page, limit, search, sort },
          messageData: 'method invoked',
        }),
      });
      const { data, count } =
        await this.addressRepository.fetchAllAddressDetails(
          page,
          limit,
          search,
          sort
        );
      // addressData: plainToInstance(AddressResponseFetchDto, addressData, { excludeExtraneousValues: true }),
      return {
        data,
        count,
      };
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'AddressService',
          method: 'getAddressList',
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.internalServerError,
          errorMessages.addressFetchFailed
        )
      );
    }
  }

  /** Retrieves an address by ID.*/
  async getAddressById(addressId: number): Promise<AddressResponseFetchDto> {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'AddressService',
          method: 'getAddressById',
          payload: { addressId },
          messageData: 'method invoked',
        }),
      });
      const address = await this.addressRepository.getAddressDetails(addressId);
      // return plainToInstance(AddressResponseFetchDto, address, { excludeExtraneousValues: true });
      return address;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'AddressService',
          method: 'getAddressById',
          payload: { addressId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.internalServerError,
          errorMessages.addressFetchFailed
        )
      );
    }
  }

  /** Updates an address by ID.*/
  async updateAddressById(
    addressId: number,
    updateAddress: UpdateAddressDto,
    userId: number
  ): Promise<AddressResponseDto> {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'success',
          location: 'AddressService',
          method: 'updateAddressById',
          payload: { addressId },
          messageData: 'method invoked',
        }),
      });
      updateAddress.updatedAt = new Date();
      updateAddress.updatedBy = userId;
      const updatedAddress = await this.addressRepository.updateAddressDetails(
        addressId,
        updateAddress
      );
      // return plainToInstance(AddressResponseDto, updatedAddress, { excludeExtraneousValues: true });
      return updatedAddress;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: 'failure',
          location: 'AddressService',
          method: 'updateAddressById',
          payload: { addressId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.internalServerError,
          errorMessages.addressUpdationFailed
        )
      );
    }
  }

  /** Removes an address by ID. */
  async deleteAddressById(addressId: number): Promise<void> {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'AddressService',
          method: 'deleteAddressById',
          payload: { addressId },
          messageData: 'method invoked',
        }),
      });
      const address = await this.getAddressById(addressId);
      await this.addressRepository.removeAddressDetails(address);
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'AddressService',
          method: 'deleteAddressById',
          payload: { addressId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          statusCode.internalServerError,
          errorMessages.addressDeletionFailed
        )
      );
    }
  }

  /** Retrieves all the region details */
  async getAllRegions() {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'AddressService',
          method: 'getAllRegions',
          messageData: 'method invoked',
        }),
      });
      return await this.addressRepository.findAllRegions();
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'AddressService',
          method: 'getAllRegions',
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(errorMessages.regionFetchFailed);
    }
  }
  /** Retrieves all the countries */
  async getAllCountries() {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'AddressService',
          method: 'getAllCountries',
          messageData: 'method invoked',
        }),
      });
      return await this.addressRepository.fetchAllCountries();
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'AddressService',
          method: 'getAllCountries',
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(errorMessages.countryFecthFailed);
    }
  }
  /** Retrieves all the country based upon region */
  async getCountries(regionId?: number) {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'AddressService',
          method: 'getCountries',
          payload: { regionId },
          messageData: 'method invoked',
        }),
      });
      return await this.addressRepository.findCountries(regionId);
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'AddressService',
          method: 'getCountries',
          payload: { regionId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(errorMessages.countryFecthFailed);
    }
  }
  /** Retrieves all the states based upon country */
  async getStates(countryId?: number) {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'AddressService',
          method: 'getStates',
          payload: { countryId },
          messageData: 'method invoked',
        }),
      });
      return await this.addressRepository.findStates(countryId);
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'AddressService',
          method: 'getStates',
          payload: { countryId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(errorMessages.stateFecthFailed);
    }
  }
  /** Retrieves all the cities based upon state */
  async getCities(stateId?: number, search?: string) {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'AddressService',
          method: 'getCities',
          payload: { stateId },
          messageData: 'method invoked',
        }),
      });
      return await this.addressRepository.findCities(stateId, search);
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'AddressService',
          method: 'getCities',
          payload: { stateId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(errorMessages.cityFetchFailed);
    }
  }
}
