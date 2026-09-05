import { Expose } from "class-transformer";
import { Country } from "../../location/entities/country.entity";
import { State } from "../../../../../service-lib/src/lib/entities/state.entity";
import { City } from "../../../../../service-lib/src/lib/entities/city.entity";

/**
 * Data transfer object for fetching address details.
 */
export class AddressResponseFetchDto {
  /**
   * Unique identifier for the address.
   */
  @Expose()
  id!: number | undefined;

  /**
   * Identifier for the address type.
   */
  @Expose()
  addressTypeLid!: number;

  /**
   * Primary address line.
   */
  @Expose()
  address1!: string;

  /**
   * Associated country details.
   */
  @Expose()
  countryId!: Country;

  /**
   * Associated state details.
   */
  @Expose()
  stateId!: State;

  /**
   * Associated city details.
   */
  @Expose()
  cityId!: City;

  /**
   * Secondary address line (optional).
   */
  @Expose()
  address2?: string;

  /**
   * Area or locality (optional).
   */
  @Expose()
  area?: string;

  /**
   * Postal code or pin code (optional).
   */
  @Expose()
  pinCode?: string;

  /**
   * Primary phone number.
   */
  @Expose()
  phoneNumber!: string;

  /**
   * Secondary phone number (optional).
   */
  @Expose()
  alternatePhoneNumber?: string;

  /**
   * Email address (optional).
   */
  @Expose()
  email?: string;

  /**
   * Mobile or toll-free number (optional).
   */
  @Expose()
  supportNumber?: string;
}
