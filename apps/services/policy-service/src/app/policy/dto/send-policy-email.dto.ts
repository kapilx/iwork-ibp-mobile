import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from "class-validator";

export class EndorsementNotificationEmail {
  @ApiProperty({
    description: "Redirect URL included in the endorsement notification email",
    example: "https://app.example.com/endorsement/123",
  })
  @IsString()
  @IsNotEmpty()
  url!: string;


  @ApiProperty({
    description:
      "Type of contact receiving the notification (client or insurer)",
    example: "client",
  })
  @IsString()
  @IsNotEmpty()
  contactType!: string;

  @ApiPropertyOptional({
    description: "List of attachment file IDs to be included in the email",
    example: [101, 102, 103],
    type: [Number],
  })
  @IsArray()
  @IsOptional()
  attachmentFileIds?: number[];

  @ApiPropertyOptional({
    description: "Indicates whether this email is for client confirmation",
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isClientConfirmation?: boolean;

  @ApiProperty({
    description: "List of communication detail IDs (from contact_communication_details.id) to send the endorsement notification to",
    example: [25250, 25251, 25252],
    type: [Number],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  emailIds?: number[];

  @ApiPropertyOptional({
    description: "List of CC email addresses to be included in the notification",
    example: ["example@divami.com", "ksajdh@msdsjd.in"],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  ccEmails?: string[];
}
