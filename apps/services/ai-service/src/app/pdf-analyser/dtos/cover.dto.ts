import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { QuestionType } from "../interfaces/cover.interface";

class OptionDto {
  @ApiProperty({ description: "Label for the option" })
  @IsNotEmpty({ message: "Option label is required" })
  @IsString({ message: "Option label must be a string" })
  label!: string;

  @ApiProperty({ description: "Value for the option" })
  @IsNotEmpty({ message: "Option value is required" })
  @IsString({ message: "Option value must be a string" })
  value!: string;
}
export class QuestionDto {
  @ApiProperty()
  @IsNotEmpty({ message: "Key is required" })
  @IsString({ message: "Key must be a string" })
  key!: string;

  @ApiProperty({
    enum: QuestionType,
    description: `Type of the question, can be either of ${Object.values(
      QuestionType
    )}`,
  })
  @IsNotEmpty({ message: "Type is required" })
  @IsString({ message: "Type must be a Valid Question Type" })
  @IsIn(Object.values(QuestionType), {
    message: "Type must be either mcq or text",
  })
  type!: QuestionType;

  @ApiProperty()
  @IsNotEmpty({ message: "Label is required" })
  @IsString({ message: "Label must be a string" })
  label!: string;

  @ApiProperty({
    required: false,
    type: [Object],
    description:
      "Options must be an array of string, boolean, date, or number values (can be mixed)",
  })
  @IsOptional()
  @IsArray({ message: "Options must be an array" })
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  options?: OptionDto[];
}

export class PDFQuestionRequestDto {
  @ApiProperty({ type: [QuestionDto] })
  @IsArray({ message: "Questions must be an array" })
  @IsNotEmpty({ each: true, message: "Questions should be empty" })
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions!: QuestionDto[];
}
