import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreatePolicyHospitalDto {
  @ApiProperty({ description: "Hospital name", example: "Apollo Hospital" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  hospitalName!: string;

  @ApiProperty({ description: "Address line 1", example: "123 Main Street" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  addressLine1!: string;

  @ApiPropertyOptional({ description: "Address line 2", example: "Near Central Park" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @ApiPropertyOptional({ description: "Landmark", example: "Opp. Metro Station" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  landmark?: string;

  @ApiProperty({ description: "City", example: "Hyderabad" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city!: string;

  @ApiProperty({ description: "State", example: "Telangana" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  state!: string;

  @ApiPropertyOptional({ description: "Country", example: "India", default: "India" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ description: "Pincode", example: "500001" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  pinCode?: string;

  @ApiPropertyOptional({ description: "Hospital code (optional)", example: "APOLLO-HYD-001" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: "Email", example: "helpdesk@apollo.com" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ description: "Phone number", example: "9876543210" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiPropertyOptional({
    description:
      "Whether this hospital should be treated as a network hospital for this policy. For reimbursement manual hospitals, this should be false.",
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isNetworkHospital?: boolean;
}

export class CreatePolicyHospitalResponseDto {
  @ApiProperty({ description: "Hospital ID", example: 101 })
  @IsNumber()
  hospitalId!: number;

  @ApiProperty({ description: "Whether the hospital already existed in master", example: true })
  @IsBoolean()
  existed!: boolean;

  @ApiProperty({
    description: "Whether a policy mapping already existed (or was restored from soft-delete)",
    example: false,
  })
  @IsBoolean()
  mappingExisted!: boolean;

  @ApiProperty({ description: "Policy ID", example: 712840 })
  @IsNumber()
  policyId!: number;
}

