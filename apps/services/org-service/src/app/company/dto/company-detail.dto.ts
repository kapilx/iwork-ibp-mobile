import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsInt, IsOptional, IsString } from "class-validator";
import { Transform } from "class-transformer";
import { removeHtmlTags } from "../../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { BadRequestException } from "@nestjs/common";

export class CompanyDetailsDto {
  @ApiPropertyOptional({
    description: "Company history",
    example:
      "Tech Solutions Inc. was founded in 2020 to provide innovative tech solutions.",
  })
  @IsOptional()
  @IsString({ message: "Company history must be a string." })
  // @Transform(({ value }: { value: string | null }) => {
  //   const cleanedValue = value ? removeHtmlTags(value) : value;
  //   if (cleanedValue && cleanedValue.length > 1000) {
  //     throw new BadRequestException(
  //       "Company history must not exceed 1000 characters"
  //     );
  //   }
  //   return value?.length === 0 ? null : value;
  // })
  @Transform(({ value }: { value: string | null }) => {
    return value?.length === 0 ? null : value;
  })
  companyHistory?: string;

  @ApiPropertyOptional({
    description: "Major products",
    example: "Cloud services, AI solutions, and IoT devices.",
  })
  @IsOptional()
  @IsString({ message: "Major products must be a string." })
  // @Transform(({ value }: { value: string | null }) => {
  //   const cleanedValue = value ? removeHtmlTags(value) : value;
  //   if (cleanedValue && cleanedValue.length > 1000) {
  //     throw new BadRequestException(
  //       "Major products must not exceed 1000 characters"
  //     );
  //   }
  //   return value?.length === 0 ? null : value;
  // })
  @Transform(({ value }: { value: string | null }) => {
    return value?.length === 0 ? null : value;
  })
  majorProducts?: string;

  @ApiPropertyOptional({
    description: "Key customers",
    example: "Fortune 500 companies, startups, and government agencies.",
  })
  @IsOptional()
  @IsString({ message: "Key customers must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 1000) {
      throw new BadRequestException(
        "Key customers must not exceed 1000 characters"
      );
    }
    return value?.length === 0 ? null : value;
  })
  keyCustomers?: string;

  @ApiPropertyOptional({
    description: "Business processes",
    example: "Agile development, DevOps, and customer-centric design.",
  })
  @IsOptional()
  @IsString({ message: "Business processes must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 1000) {
      throw new BadRequestException(
        "Business processes must not exceed 1000 characters"
      );
    }
    return value?.length === 0 ? null : value;
  })
  businessProcesses?: string;

  @ApiPropertyOptional({
    description: "Account strategy",
    example: "Focus on long-term partnerships and customer satisfaction.",
  })
  @IsOptional()
  @IsString({ message: "Account strategy must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 1000) {
      throw new BadRequestException(
        "Account strategy must not exceed 1000 characters"
      );
    }
    return value?.length === 0 ? null : value;
  })
  accountStrategy?: string;

  @ApiPropertyOptional({
    description: "Targeting reason",
    example: "Targeting high-growth industries and emerging markets.",
  })
  @IsOptional()
  @IsString({ message: "Targeting reason must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 1000) {
      throw new BadRequestException(
        "Targeting reason must not exceed 1000 characters"
      );
    }
    return value?.length === 0 ? null : value;
  })
  targetingReason?: string;

  @ApiPropertyOptional({
    description: "Competitors",
    example: "Competitor A, Competitor B, Competitor C.",
  })
  @IsOptional()
  @IsString({ message: "Competitors must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 1000) {
      throw new BadRequestException(
        "Competitors must not exceed 1000 characters"
      );
    }
    return value?.length === 0 ? null : value;
  })
  competitor?: string;

  @ApiPropertyOptional({
    description: "Weakness",
    example: "Limited presence in Asia-Pacific region.",
  })
  @IsOptional()
  @IsString({ message: "Weakness must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 1000) {
      throw new BadRequestException("Weakness must not exceed 1000 characters");
    }
    return value?.length === 0 ? null : value;
  })
  weakness?: string;

  @ApiPropertyOptional({
    description: "Action plan",
    example: "Expand operations in Asia-Pacific and hire local talent.",
  })
  @IsOptional()
  @IsString({ message: "Action plan must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 1000) {
      throw new BadRequestException(
        "Action plan must not exceed 1000 characters"
      );
    }
    return value?.length === 0 ? null : value;
  })
  actionPlan?: string;

  @ApiPropertyOptional({
    description: "Potential opportunity",
    example: "Growing demand for AI and IoT solutions.",
  })
  @IsOptional()
  @IsString({ message: "Potential opportunity must be a string." })
  // @Transform(({ value }: { value: string | null }) => {
  //   const cleanedValue = value ? removeHtmlTags(value) : value;
  //   return value?.length === 0 ? null : value;
  // })
  @Transform(({ value }: { value: string | null }) => {
    return value?.length === 0 ? null : value;
  })
  potentialOpportunity?: string;

  @ApiPropertyOptional({
    description: "Industry intelligence",
    example: "The tech industry is expected to grow by 10% annually.",
  })
  @IsOptional()
  @IsString({ message: "Industry intelligence must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    return value?.length === 0 ? null : value;
  })
  industryIntelligence?: string;

  @ApiPropertyOptional({
    description: "Service plan",
    example: "Provide 24/7 customer support and regular updates.",
  })
  @IsOptional()
  @IsString({ message: "Service plan must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 1000) {
      throw new BadRequestException(
        "Service plan must not exceed 1000 characters"
      );
    }
    return value?.length === 0 ? null : value;
  })
  servicePlan?: string;

  @ApiPropertyOptional({
    description: "Acquisition history",
    example: "Acquired Startup X in 2021 to enhance AI capabilities.",
  })
  @IsOptional()
  @IsString({ message: "Acquisition history must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 1000) {
      throw new BadRequestException(
        "Acquisition history must not exceed 1000 characters"
      );
    }
    return value?.length === 0 ? null : value; // Return the original value with tags to store in the database
  })
  acquisitionHistory?: string;

  @ApiPropertyOptional({
    description: "Business profile",
    example: "Tech Solutions is a leader in cloud and AI solutions.",
  })
  @IsOptional()
  @IsString({ message: "Business profile must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 1000) {
      throw new BadRequestException(
        "Business profile must not exceed 1000 characters"
      );
    }
    return value?.length === 0 ? null : value;
  })
  bizProfile?: string;

  @ApiPropertyOptional({
    description: "Service performance",
    example: "Consistently rated 4.8/5 by customers.",
  })
  @IsOptional()
  @IsString({ message: "Service performance must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    const cleanedValue = value ? removeHtmlTags(value) : value;
    if (cleanedValue && cleanedValue.length > 1000) {
      throw new BadRequestException(
        "Service performance must not exceed 1000 characters"
      );
    }
    return value?.length === 0 ? null : value;
  })
  servicePerformance?: string;

  @IsOptional()
  @IsString({ message: "Sales Pitch must be a string." })
  @Transform(({ value }: { value: string | null }) => {
    value = value ? value.trim() : value;
    return value?.length === 0 ? null : value;
  })
  salesPitch?: string;

  @IsOptional()
  @IsInt()
  createdBy?: number;

  @IsOptional()
  @IsInt()
  updatedBy?: number;
}
