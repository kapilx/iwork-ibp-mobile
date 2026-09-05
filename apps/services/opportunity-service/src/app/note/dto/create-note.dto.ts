import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class CreateNoteDocumentDto {
  @ApiProperty({
    description: "Document ID",
    example: 1,
  })
  @IsInt({ message: "Document ID must be a number." })
  @IsNotEmpty({ message: "Document ID is required." })
  @Min(1, {
    message: "Document ID must be positive number.",
  })
  documentId!: number;
}

export class CreateNoteDto {
  @IsInt({ message: "Company id must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Company id must be positive number.",
  })
  companyId?: number;

  @IsInt({ message: "Opportunity id must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Opportunity id must be positive number.",
  })
  opportunityId?: number;

  @IsInt({ message: "Activity id must be a number." })
  @IsOptional()
  @Min(1, {
    message: "Activity id must be positive number.",
  })
  activityId?: number;

  @ApiProperty({
    description: "Title",
    type: String,
    example: "Note title",
  })
  @IsString({ message: "Title must be a string." })
  @IsNotEmpty({ message: "Title is required." })
  @MaxLength(100, {
    message: "Title must not exceed 100 characters.",
  })
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  title!: string;

  @ApiProperty({
    description: "Description",
    type: String,
    example: "Note description",
  })
  @IsString({ message: "Description must be a string." })
  @IsOptional()
  @Transform(({ value }: { value: string | null }) =>
    value ? value.trim() : value
  )
  description?: string;

  @ApiPropertyOptional({
    description: "Note documents",
    type: [CreateNoteDocumentDto],
  })
  @IsOptional()
  @IsArray({ message: "Note documents must be an array." })
  @ValidateNested({ each: true })
  @Type(() => CreateNoteDocumentDto)
  documents?: CreateNoteDocumentDto[];

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;
}
