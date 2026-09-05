import { Transform } from "class-transformer";
import { IsOptional, IsString, IsNumber, Min, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { DEFAULT_VALUES } from "../../../../../service-lib/src/lib/constants";

export class UpdateStatusDto {
    @ApiProperty({
    description: "Notification Id.",
    example: "id:2",
    })
    @IsNotEmpty()
    @IsNumber()
    id!: number;

    @ApiProperty({
        description: "Updating Notification status.",
        example: "status:NOTIFICATION_DELETE",
    })
    @IsNotEmpty()
    @IsString()
    status!: string;
}
