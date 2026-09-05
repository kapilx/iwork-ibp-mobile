import { IsNotEmpty, IsString, IsOptional, IsNumber } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ProcessEnrollmentPayloadDto {
  @ApiProperty({
    description: "Payload ID to process",
    example: "inception_9999_payload_1"
  })
  @IsNotEmpty()
  @IsString()
  payloadId: string;

  @ApiProperty({
    description: "Payload status map Redis key",
    example: "inception_9999_payload_status_map"
  })
  @IsNotEmpty()
  @IsString()
  payloadMapId: string;

  @ApiProperty({
    description: "Endorsement ID for the enrollment",
    required: false,
    example: 12345
  })
  @IsOptional()
  @IsNumber()
  endorsementId?: number;
}