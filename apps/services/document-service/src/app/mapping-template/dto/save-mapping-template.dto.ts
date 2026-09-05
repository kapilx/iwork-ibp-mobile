import {
    IsNotEmpty,
    IsString,
    IsInt,
    IsEnum,
    IsArray,
    ValidateNested,
    IsObject,
    ArrayMinSize,
    IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum FileDirection {
    INBOUND = 'INBOUND',
    OUTBOUND = 'OUTBOUND',
}

export class ColumnMappingDto {
    @IsInt()
    @IsNotEmpty()
    source_column_id!: number;

    @IsString()
    @IsNotEmpty()
    source_column_name!: string;

    @IsString()
    @IsNotEmpty()
    target_table_name!: string;

    @IsString()
    @IsNotEmpty()
    target_column_name!: string;

    @IsObject()
    @IsNotEmpty()
    transformation_config!: Record<string, unknown>;
}

export class SaveMappingTemplateDto {
    @IsInt()
    @IsNotEmpty()
    company_id!: number;

    @IsInt()
    @IsOptional()
    entity_id?: number;

    @IsString()
    @IsNotEmpty()
    entity_name!: string;

    @IsEnum(FileDirection)
    @IsNotEmpty()
    file_direction!: FileDirection;

    @IsString()
    change_note?: string;

    @IsArray()
    @ArrayMinSize(1, { message: 'mappings array cannot be empty' })
    @ValidateNested({ each: true })
    @Type(() => ColumnMappingDto)
    mappings!: ColumnMappingDto[];
}
