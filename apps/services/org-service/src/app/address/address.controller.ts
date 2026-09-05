import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Res,
  Req,
  Put,
  Query,
} from "@nestjs/common";
import type { Response, Request } from "express";
import { AddressService } from "./address.service";
import { CreateAddressDto } from "./dto/create-address.dto";
import { UpdateAddressDto } from "./dto/update-address.dto";
import {
  createAddressSwaggerMetadata,
  getAddressSwaggerMetadata,
  deleteAddressSwaggerMetadata,
  getAddressesSwaggerMetadata,
  updateAddressSwaggerMetadata,
  getRegionListSwaggerMetadata,
  getCountryListSwaggerMetadata,
  getCountriesByRegionSwaggerMetadata,
  getStatesByCountrySwaggerMetadata,
  getCitiesByStateSwaggerMetadata,
} from "./address.swagger";
import {
  createResponse,
  createErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { statusCode } from "../../../../../../libs/service-lib/src/lib/enum";
import {
  successMessage,
  errorMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
} from "../../../../../../libs/service-lib/src/lib/constants";
@Controller("address")
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  /* Below controller will Creates a new address. with the help of the data object validated using `createAddressDto`. */
  @Post()
  @createAddressSwaggerMetadata()
  async addAddress(
    @Body() address: CreateAddressDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * addAddress *", req.headers);
      const userId = parseInt(req?.headers?.userid);
      const serviceStartTime = Date.now(); // Record the service execution start time
      const data = await this.addressService.addAddress(address, userId);
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * addAddress * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * addAddress * ${responseTime - requestStartTime}ms`
      );

      return res
        .status(statusCode.ok)
        .json(
          createResponse(statusCode.ok, successMessage.addressCreated, data)
        );
    } catch (error) {
      return res
        .status(statusCode.internalServerError)
        .json(
          createErrorResponse(
            statusCode.internalServerError,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  /** Retrieves the list of all addresses.*/
  @Get()
  @getAddressesSwaggerMetadata()
  async getAddressList(
    @Res() res: Response,
    @Req() req: Request,
    @Query("page") page: number = DEFAULT_PAGE,
    @Query("limit") limit: number = DEFAULT_LIMIT,
    @Query("search") search?: string,
    @Query("sort") sort?: string
  ) {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * getAddressList *", req.headers);
      const serviceStartTime = Date.now(); // Record the service execution start time

      const { data, count } = await this.addressService.getAddressList(
        page,
        limit,
        search,
        sort
      );
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * getAddressList * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * getAddressList * ${responseTime - requestStartTime}ms`
      );

      return res.status(statusCode.ok).json(
        createResponse(statusCode.ok, successMessage.addressListRetrieved, {
          data,
          count,
        })
      );
    } catch (error) {
      return res
        .status(statusCode.internalServerError)
        .json(
          createErrorResponse(
            statusCode.internalServerError,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  /** Retrieves an address by its ID.*/
  @Get(":id")
  @getAddressSwaggerMetadata()
  async getAddressById(
    @Param("id") addressId: number,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * getAddressById *", req.headers);
      const serviceStartTime = Date.now(); // Record the service execution start time

      const address = await this.addressService.getAddressById(addressId);
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * getAddressById * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * getAddressById * ${responseTime - requestStartTime}ms`
      );

      return res
        .status(statusCode.ok)
        .json(
          createResponse(statusCode.ok, successMessage.addressDetails, address)
        );
    } catch (error) {
      return res
        .status(statusCode.notFound)
        .json(
          createErrorResponse(
            statusCode.notFound,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  /** Updates an address by its ID.*/
  @Put(":id")
  @updateAddressSwaggerMetadata()
  async updateAddressById(
    @Param("id") addressId: number,
    @Body() updateAddress: UpdateAddressDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * updateAddressById *", req.headers);
      const serviceStartTime = Date.now(); // Record the service execution start time
      const userId = parseInt(req?.headers?.userid);
      const updatedAddress = await this.addressService.updateAddressById(
        addressId,
        updateAddress,
        userId
      );
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * updateAddressById * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * updateAddressById * ${
          responseTime - requestStartTime
        }ms`
      );

      return res
        .status(statusCode.ok)
        .json(
          createResponse(
            statusCode.ok,
            successMessage.addressUpdated,
            updatedAddress
          )
        );
    } catch (error) {
      return res
        .status(statusCode.internalServerError)
        .json(
          createErrorResponse(
            statusCode.internalServerError,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  /** Deletes an address by its ID. */
  @Delete(":id")
  @deleteAddressSwaggerMetadata()
  async deleteAddressById(
    @Param("id") addressId: number,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * deleteAddressById *", req.headers);
      const serviceStartTime = Date.now(); // Record the service execution start time
      await this.addressService.deleteAddressById(addressId);
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * deleteAddressById * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * deleteAddressById * ${
          responseTime - requestStartTime
        }ms`
      );
      return res
        .status(statusCode.ok)
        .json(createResponse(statusCode.ok, successMessage.addressDeleted));
    } catch (error) {
      return res
        .status(statusCode.notFound)
        .json(
          createErrorResponse(
            statusCode.notFound,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }
  /** Retrieves the region details */
  @Get("region/list")
  @getRegionListSwaggerMetadata()
  async getAllRegions(@Res() res: Response, @Req() req: Request) {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * getAllRegions *", req.headers);
      const serviceStartTime = Date.now(); // Record the service execution start time

      const regions = await this.addressService.getAllRegions();
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * getAllRegions * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * getAllRegions * ${responseTime - requestStartTime}ms`
      );

      return res
        .status(statusCode.ok)
        .json(
          createResponse(
            statusCode.ok,
            successMessage.regionListFetched,
            regions
          )
        );
    } catch (error) {
      return res
        .status(statusCode.internalServerError)
        .json(
          createErrorResponse(
            statusCode.internalServerError,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  /** Retrieves all country details */
  @Get("country/list")
  @getCountryListSwaggerMetadata()
  async getAllCountries(@Res() res: Response, @Req() req: Request) {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * getAllCountries *", req.headers);
      const serviceStartTime = Date.now(); // Record the service execution start time
      const countries = await this.addressService.getAllCountries();
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * getAllCountries * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * getAllCountries * ${
          responseTime - requestStartTime
        }ms`
      );

      return res
        .status(statusCode.ok)
        .json(
          createResponse(
            statusCode.ok,
            successMessage.countryListFetched,
            countries
          )
        );
    } catch (error) {
      return res
        .status(statusCode.internalServerError)
        .json(
          createErrorResponse(
            statusCode.internalServerError,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  /** Retrieves all country details based upon region */
  @Get("country/:regionId")
  @getCountriesByRegionSwaggerMetadata()
  async getCountries(
    @Res() res: Response,
    @Req() req: Request,
    @Param("regionId") regionId?: number
  ) {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * getCountries *", req.headers);
      const serviceStartTime = Date.now(); // Record the service execution start time
      const countries = await this.addressService.getCountries(regionId);
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * getCountries * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * getCountries * ${responseTime - requestStartTime}ms`
      );

      return res
        .status(statusCode.ok)
        .json(
          createResponse(
            statusCode.ok,
            successMessage.countryListFetched,
            countries
          )
        );
    } catch (error) {
      return res
        .status(statusCode.internalServerError)
        .json(
          createErrorResponse(
            statusCode.internalServerError,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }

  /** Retrieves all state details based upon country */
  @Get("state/:countryId")
  @getStatesByCountrySwaggerMetadata()
  async getStates(
    @Res() res: Response,
    @Req() req: Request,
    @Param("countryId") countryId?: number
  ) {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * getStates *", req.headers);
      const serviceStartTime = Date.now(); // Record the service execution start time
      const states = await this.addressService.getStates(countryId);
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * getStates * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * getStates * ${responseTime - requestStartTime}ms`
      );

      return res
        .status(statusCode.ok)
        .json(
          createResponse(statusCode.ok, successMessage.stateListFetched, states)
        );
    } catch (error) {
      return res
        .status(statusCode.internalServerError)
        .json(
          createErrorResponse(
            statusCode.internalServerError,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }
  /** Retrieves all city details based upon state */
  @Get("city/:stateId")
  @getCitiesByStateSwaggerMetadata()
  async getCities(
    @Res() res: Response,
    @Req() req: Request,
    @Param("stateId") stateId?: number,
    @Query("search") search?: string
  ) {
    try {
      const requestStartTime = Date.now();
      console.log("Request Headers: * getCities *", req.headers);
      const serviceStartTime = Date.now(); // Record the service execution start time
      const cities = await this.addressService.getCities(stateId, search);
      const serviceEndTime = Date.now(); // Record the service execution end time
      console.log(
        `Service Execution Time: * getCities * ${
          serviceEndTime - serviceStartTime
        }ms`
      );
      const responseTime = Date.now(); // Record the response time
      console.log(
        `Response Time: * getCities * ${responseTime - requestStartTime}ms`
      );

      return res
        .status(statusCode.ok)
        .json(
          createResponse(statusCode.ok, successMessage.cityListFetched, cities)
        );
    } catch (error) {
      return res
        .status(statusCode.internalServerError)
        .json(
          createErrorResponse(
            statusCode.internalServerError,
            error instanceof Error ? error.message : errorMessages.unknownError
          )
        );
    }
  }
}
