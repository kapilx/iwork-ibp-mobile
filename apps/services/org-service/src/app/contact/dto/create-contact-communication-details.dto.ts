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
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from "class-validator";

// Custom validator to ensure communicationDetails is valid based on communicationType
@ValidatorConstraint({ name: "IsValidCommunicationDetails", async: false })
export class IsValidCommunicationDetails
  implements ValidatorConstraintInterface
{
  validate(value: string | undefined | null, args: ValidationArguments) {
    // If value is null or undefined, let @IsNotEmpty handle the validation
    if (value == null) {
      return true;
    }
    const object = args.object as CreateContactCommunicationDetailsDto;

    if (object.communicationType === "email") {
      // Validate email format
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    } else if (object.communicationType === "phone") {
      // Validate phone format (10-digit number)
      return true;
    }
    return false; // Invalid if communicationType is neither "email" nor "phone"
  }

  defaultMessage(args: ValidationArguments) {
    const object = args.object as CreateContactCommunicationDetailsDto;

    if (object.communicationType === "email") {
      return `communicationDetails must be a valid email address.`;
    } else if (object.communicationType === "phone") {
      return `communicationDetails must be a valid 10-digit phone number.`;
    }
    return `communicationType must be either 'email' or 'phone'.`;
  }
}

export class CreateContactCommunicationDetailsDto {
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
  @Validate(IsValidCommunicationDetails)
  communicationDetails!: string;

  @ApiProperty({
    description: "Indicates if this is the primary communication detail",
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: "isPrimary must be a boolean value." })
  isPrimary!: boolean;

  @ApiProperty({
    description: "Contact ID associated with the contact details",
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Contact ID must be a number." })
  contact?: number;

  @ApiProperty({
    description: "User who created the record",
    example: "admin",
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Created by must be a number." })
  createdBy?: number;

  @ApiProperty({
    description: "User who last updated the record",
    example: "admin",
    required: false,
  })
  @IsOptional()
  @IsInt({ message: "Updated by must be a number." })
  updatedBy?: number;
}
