import { Expose } from "class-transformer";

/**
 * Data Transfer Object for Address Response.
 */
export class AddressResponseDto {
  /**
   * Unique identifier for the address.
   */
  @Expose()
  id!: number | undefined;

  /**
   * Identifier for the type of address (e.g., home, office).
   */
  @Expose()
  addressTypeLid!: number;

  /**
   * Primary address line.
   */
  @Expose()
  address1!: string;

  /**
   * Identifier for the country.
   */
  @Expose()
  countryId!: number;

  /**
   * Identifier for the state.
   */
  @Expose()
  stateId!: number;

  /**
   * Identifier for the city.
   */
  @Expose()
  cityId!: number;

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
   * Postal code or PIN code (optional).
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
   * Mobile number or toll-free number (optional).
   */
  @Expose()
  supportNumber?: string;
}
