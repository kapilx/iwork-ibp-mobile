import { ApiProperty } from "@nestjs/swagger";

export class InsurerResponseDto {
  @ApiProperty({ description: "ID of the insurer" })
  id!: number;

  @ApiProperty({ description: "Name of the insurer" })
  insurerName!: string;

  @ApiProperty({ description: "Display name of the insurer" })
  displayName!: string;

  @ApiProperty({ description: "Type ID of the company" })
  companyTypeLid!: number;

  @ApiProperty({ description: "Website of the insurer" })
  website!: string;

  @ApiProperty({ description: "Is the insurer a life insurance company?" })
  isLife!: boolean;

  @ApiProperty({ description: "Tag ID for the company" })
  companyTagLid!: number;

  @ApiProperty({ description: "Remarks about the insurer", required: false })
  remarks?: string;

  @ApiProperty({
    description: "List of addresses associated with the insurer",
    type: [Object],
  })
  address!: {
    id: number;
    addressTypeLid: number;
    address1: string;
    countryId: number;
    stateId: number;
    cityId: number;
    address2?: string;
    area?: string;
    pinCode?: string;
    phoneNumber?: string;
    alternatePhoneNumber?: string;
    email?: string;
    supportNumber?: string;
  }[];

  @ApiProperty({
    description: "List of contacts associated with the insurer",
    type: [Object],
  })
  contacts!: {
    id: number;
    titleId: number;
    firstName: string;
    lastName: string;
    middleName?: string;
    displayName: string;
    emailId?: string;
    phone?: string;
    department: string;
    designation: string;
  }[];
}
