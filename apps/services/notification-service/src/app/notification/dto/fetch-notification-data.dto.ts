import { Transform, Type } from "class-transformer";
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  isInt,
  IsInt,
  IsDate,
  ValidateNested,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { NotificationEventType } from "../../../../../service-lib/src/lib/entities";

export class NotificationBody {
  @ApiPropertyOptional({ description: "Entity Id of the notification", example: 1 })
  @IsInt({ message: "Entity id must be an integer" })
  @IsOptional()
  entityId: number | null;

  @ApiProperty({
    description: "Content of the notification",
    example: "Content of the cover",
  })
  @IsString({ message: "content must be a string." })
  content!: string;

  @ApiProperty({
    description: "Entity type of the notification",
    example: "Entity type of the cover",
  })
  @IsString({ message: "entityType must be a string." })
  entityType!: string;
}

export class NotificationDataDto {
  @ApiProperty({ description: "Id of the notification", example: 1 })
  @IsInt({ message: "opportunity id must be an integer" })
  id!: number;

  @ApiProperty({ description: "User Id of the notification", example: 1 })
  @IsInt({ message: "User id must be an integer" })
  userId!: number;

  @ApiProperty({
    description: "Subject of the notification",
    example: "Subject of the cover",
  })
  @IsString({ message: "subject must be a string." })
  subject!: string;

  @ApiProperty({ description: "Status Lid of the notification", example: 1 })
  @IsInt({ message: "Status Lid must be an integer" })
  statusLid!: number;

  @ApiProperty({
    description: "Event type Id of the notification",
    type: NotificationEventType,
  })
  @ValidateNested()
  @Type(() => NotificationEventType)
  eventTypeId!: NotificationEventType;

  @ApiProperty({
    description: "Body of the notification" ,
    type: NotificationBody
  })
  @ValidateNested()
  @Type(()=> NotificationBody)
  body!: NotificationBody

  @ApiProperty({
    description: "Date when the notification was created",
    example: "2025-06-07T10:30:00.000Z",
  })
  @IsDate({ message: "createdAt must be a valid date" })
  @Type(() => Date)
  createdAt!: Date;

  @ApiProperty({
    description: "Date when the notification was updated",
    example: "2025-06-07T10:30:00.000Z",
  })
  @IsDate({ message: "updatedAt must be a valid date" })
  @Type(() => Date)
  updatedAt!: Date;

  @ApiProperty({
    description: "Date when the notification was deleted",
    example: "2025-06-07T10:30:00.000Z",
  })
  @IsDate({ message: "deletedAt must be a valid date" })
  @Type(() => Date)
  deletedAt!: Date;
}


