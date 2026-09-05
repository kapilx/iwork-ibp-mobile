import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsAlpha, IsArray, IsInt, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { removeHtmlTags } from "../../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { BadRequestException } from "@nestjs/common";

export class SendEmailDto {
    @ApiPropertyOptional({
        description: "Receiver Email address",
        example:
        "[abc@example.com,test@example.com]",
    })
    @IsArray({ message: "To Address must be a array of strings." })
    toAddress!: string[];

    @ApiPropertyOptional({
        description: "CC Email address",
        example:
        "[abc@example.com,test@example.com]",
    })
    @IsArray({ message: "CC Address must be a array of strings." })
    ccAddress!: string[];

    @ApiPropertyOptional({
        description: "Subject of Email",
        example: "Emergency Leave Request",
    })
    @IsNotEmpty({ message: "Subject is required." })
    @IsString({ message: "Subject must be a string." })
    @Transform(({ value }: { value: string | null; }) => {
        const cleanedValue = value ? removeHtmlTags(value) : value;
        if (cleanedValue && cleanedValue.length > 1000) {
            throw new BadRequestException(
                "Subject must not exceed 1000 characters"
            );
        }
        return value?.length === 0 ? null : value;
    })
    subject!: string;

    @ApiPropertyOptional({
        description: "Body of Email",
        example: "This is a test email body.",
    })
    @IsString({ message: "Body must be a string." })
    @Transform(({ value }: { value: string | null }) => {
        const cleanedValue = value ? removeHtmlTags(value) : value;
        if (cleanedValue && cleanedValue.length > 1000) {
        throw new BadRequestException(
            "Body processes must not exceed 1000 characters"
        );
        }
        return value?.length === 0 ? null : value;
    })
    body!: string;

  
}