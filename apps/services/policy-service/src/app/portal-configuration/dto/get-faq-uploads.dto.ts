import { IsOptional, IsNumberString, IsInt, Min, Max, IsString } from "class-validator";
import { Type } from "class-transformer";

export class GetFaqUploadsDto {
    @IsOptional()
    @IsString()
    policyId?: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 20;
}
