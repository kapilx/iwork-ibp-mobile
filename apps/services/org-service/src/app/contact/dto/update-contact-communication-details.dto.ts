import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  MaxLength,
  IsInt,
  IsBoolean,
  Validate,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { IsValidCommunicationDetails } from "./create-contact-communication-details.dto";
import { Transform } from "class-transformer";

export class UpdateContactCommunicationDetailsDto {
  @ApiProperty({
    description: "ID of the communication detail to update",
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "ID must be an integer." })
  id?: number;

  @ApiProperty({
    description: "Contact ID associated with the contact details",
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Contact ID must be a number." })
  contact?: number;

  @ApiProperty({
    description: "Type of communication (email or phone)",
    example: "email",
    required: true,
  })
  @IsNotEmpty({ message: "Communication type is required." })
  @IsString({ message: "Communication type must be a string." })
  @IsIn(["email", "phone"], {
    message: "Communication type must be 'email' or 'phone'.",
  })
  communicationType!: string;

  @ApiProperty({
    description: "Details of the communication (email address or phone number)",
    example: "john.doe@example.com",
    required: true,
  })
  @IsNotEmpty({ message: "Communication details are required." })
  @IsString({ message: "Communication details must be a string." })
  @Transform(({ value }: { value: string }) => {
    if (value) {
      // Strip HTML tags and trim whitespace
      const strippedValue = value.replace(/<[^>]*>/g, '').trim();
      return strippedValue;
    }
    return value;
  })
  @MaxLength(255, {
    message: "Communication details must not exceed 255 characters.",
  })
  @Validate(IsValidCommunicationDetails)
  communicationDetails!: string;

  @ApiProperty({
    description: "Indicates if this is the primary communication detail",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "isPrimary must be a boolean value." })
  isPrimary?: boolean;

  @ApiProperty({
    description: "User who last updated the record",
    example: "admin",
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Updated by must be a number." })
  updatedBy?: number;

  @ApiProperty({
    description: "Timestamp of the last update",
    example: "2025-04-02T12:34:56.789Z",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "Updated At must be a string." })
  updatedAt?: Date;
}
